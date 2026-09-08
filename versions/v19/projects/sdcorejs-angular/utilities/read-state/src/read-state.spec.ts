import { SdReadChannel, SdReadState, cloneReadRequest, combineReadStates } from './read-state';
import { Component, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

@Component({ standalone: true, template: '<ng-template #cell>Cell</ng-template>' })
class TemplateHost {
  readonly cell = viewChild.required<TemplateRef<unknown>>('cell');
}

describe('control read requests', () => {
  it('preserves Angular template handles inside a table request snapshot', () => {
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    const templateRef = fixture.componentInstance.cell();
    const snapshot = cloneReadRequest({ columns: [{ cell: { templateRef } }] });
    expect(snapshot.columns[0].cell.templateRef).toBe(templateRef);
    const view = snapshot.columns[0].cell.templateRef.createEmbeddedView({});
    expect(view.rootNodes[0].textContent).toBe('Cell');
    view.destroy();
  });
  it('accepts only the current request and removes errors on success', () => {
    const changes: SdReadState[] = [];
    const channel = new SdReadChannel('SEARCH', state => changes.push(state));
    const old = channel.begin();
    const current = channel.begin();
    expect(channel.fail(old, new Error('stale'))).toBeFalse();
    const error = new Error('current');
    expect(channel.fail(current, error)).toBeTrue();
    expect(channel.state()).toEqual({ status: 'error', operation: 'SEARCH', error });
    const retry = channel.begin();
    expect(channel.succeed(retry, 0)).toBeTrue();
    expect(channel.state()).toEqual({ status: 'empty', operation: 'SEARCH' });
    expect(changes.map(s => s.status)).toEqual(['loading', 'loading', 'error', 'loading', 'empty']);
  });

  it('ignores completion as soon as its context changes, before the next effect', () => {
    let context = 'old';
    const channel = new SdReadChannel('VALUE');
    const id = channel.begin(() => context === 'old');
    context = 'new';
    expect(channel.succeed(id, 1)).toBeFalse();
    expect(channel.fail(id, 'stale')).toBeFalse();
    channel.invalidate();
    expect(channel.state().status).toBe('idle');
    expect(channel.isCurrent(id)).toBeFalse();
  });

  it('keeps VALUE errors visible across independent SEARCH success', () => {
    const value: SdReadState = { operation: 'VALUE', status: 'error', error: 'value failed' };
    const search: SdReadState = { operation: 'SEARCH', status: 'ready' };
    const combined = combineReadStates(value, search);
    expect(combined.operation).toBe('VALUE');
    expect(combined.status).toBe('error');
    expect(combined.channels).toEqual({ VALUE: value, SEARCH: search });
  });

  it('copies nested request values and dates while preserving column callbacks', () => {
    const callback = () => 'label';
    const args = { filters: [{ value: [1, 2], date: new Date('2026-01-01') }], columns: [{ callback }] };
    const snapshot = cloneReadRequest(args);
    args.filters[0].value.push(3);
    args.filters[0].date.setFullYear(2027);
    expect(snapshot.filters[0].value).toEqual([1, 2]);
    expect(snapshot.filters[0].date.getFullYear()).toBe(2026);
    expect(snapshot.columns[0].callback).toBe(callback);
    const passed = cloneReadRequest(snapshot);
    passed.filters[0].value.push(4);
    expect(snapshot.filters[0].value).toEqual([1, 2]);
  });
});
