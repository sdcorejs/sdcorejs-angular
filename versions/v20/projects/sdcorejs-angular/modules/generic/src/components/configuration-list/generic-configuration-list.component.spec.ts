import { LiveAnnouncer } from '@angular/cdk/a11y';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { I18nService } from '@sdcorejs/angular/i18n';
import type { SdGenericSchema } from '../../models';
import { GenericPropertyIdentity } from '../property-identity/generic-property-identity.component';
import { GenericConfigurationList } from './generic-configuration-list.component';

const SCHEMA: SdGenericSchema = {
  version: 1,
  module: 'tms',
  entity: 'order',
  general: {
    label: 'Order',
    properties: [
      { key: 'code', label: 'Code', dataType: 'string' },
      { key: 'name', label: 'Name', dataType: 'string' },
      { key: 'status', label: 'Status', dataType: 'enum', enums: [{ value: 'NEW', label: 'New' }] },
      { key: 'meta', label: 'Meta', dataType: 'json' },
    ],
  },
  list: { columns: [{ key: 'code' }, { key: 'name' }, { key: 'status' }], externalFilters: [{ key: 'status' }] },
};

@Component({
  imports: [GenericConfigurationList],
  template: `<sd-generic-configuration-list [schema]="schema()" (schemaChange)="changed($event)"></sd-generic-configuration-list>`,
})
class HostComponent {
  readonly schema = signal<SdGenericSchema>(SCHEMA);
  readonly changes: SdGenericSchema[] = [];
  changed(schema: SdGenericSchema): void {
    this.changes.push(schema);
    this.schema.set(schema);
  }
}

describe('GenericConfigurationList', () => {
  let announce: jasmine.Spy;

  const render = async () => {
    announce = jasmine.createSpy('announce').and.resolveTo();
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideNoopAnimations(), { provide: LiveAnnouncer, useValue: { announce } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const list = fixture.debugElement.query(By.directive(GenericConfigurationList)).componentInstance as GenericConfigurationList;
    const row = (key: string) =>
      (fixture.nativeElement as HTMLElement).querySelector(`[data-autoId="generic-column-${key}"]`) as HTMLElement;
    return { fixture, list, row, host: fixture.componentInstance };
  };
  const order = (schema: SdGenericSchema) => schema.list?.columns?.map(column => column.key);

  it('has no external-filter control on any row (AC-001)', async () => {
    const { row } = await render();
    // in the table + visible + sortable + filterable; the external-filter checkbox is gone.
    for (const key of ['code', 'name', 'status']) expect(row(key).querySelectorAll('sd-checkbox').length).withContext(key).toBe(4);
    expect(row('meta').querySelectorAll('sd-checkbox').length).toBe(1);
  });

  it('reorders list.columns when a listed column is dropped and announces the new position (AC-010)', async () => {
    const { list, host } = await render();
    list.drop({ previousIndex: 0, currentIndex: 2 } as CdkDragDrop<unknown>);
    expect(order(host.changes.at(-1)!)).toEqual(['name', 'status', 'code']);
    expect(announce).toHaveBeenCalledWith(
      TestBed.inject(I18nService).t('core.module.generic.configuration.moved', { label: 'Code', position: 3 })
    );
  });

  it('ignores a drop that does not move the column', async () => {
    const { list, host } = await render();
    list.drop({ previousIndex: 1, currentIndex: 1 } as CdkDragDrop<unknown>);
    expect(host.changes).toEqual([]);
    expect(announce).not.toHaveBeenCalled();
  });

  it('keeps the move buttons on the same reorder as drag-drop (AC-011)', async () => {
    const { list, host } = await render();
    list.move('code', 1);
    const byButton = order(host.changes.at(-1)!);
    host.schema.set(SCHEMA);
    list.drop({ previousIndex: 0, currentIndex: 1 } as CdkDragDrop<unknown>);
    expect(order(host.changes.at(-1)!)).toEqual(byButton);
    expect(byButton).toEqual(['name', 'code', 'status']);
    expect(announce).toHaveBeenCalledTimes(2);
  });

  it('moves past the next listed row even when list.columns holds a key without a property', async () => {
    const { fixture, list, host } = await render();
    // why: merge drops such keys (INV-005), but the move buttons must not depend on it, like drop() does not.
    host.schema.set({ ...SCHEMA, list: { columns: [{ key: 'code' }, { key: 'ghost' }, { key: 'name' }] } });
    fixture.detectChanges();
    list.move('code', 1);
    fixture.detectChanges();
    expect(list.listedRows().map(row => row.column.key)).toEqual(['name', 'code']);
    expect(announce).toHaveBeenCalledWith(
      TestBed.inject(I18nService).t('core.module.generic.configuration.moved', { label: 'Code', position: 2 })
    );
  });

  it('gives a drag handle to listed columns only (AC-011)', async () => {
    const { row } = await render();
    for (const key of ['code', 'name', 'status']) {
      expect(row(key).querySelector('[cdkDragHandle], .cfg-drag-handle')).withContext(key).not.toBeNull();
      expect(row(key).closest('.cdk-drop-list')).withContext(key).not.toBeNull();
    }
    expect(row('meta').querySelector('[cdkDragHandle], .cfg-drag-handle')).toBeNull();
    expect(row('meta').closest('.cdk-drop-list')).toBeNull();
  });

  it('labels the visible checkbox "Show by default" with an explaining tooltip (AC-012)', async () => {
    const { fixture } = await render();
    const i18n = TestBed.inject(I18nService);
    const tooltip = fixture.debugElement
      .queryAll(By.directive(SdTooltipDirective))
      .map(element => element.injector.get(SdTooltipDirective).content())
      .find(content => content === i18n.t('core.module.generic.field.visible-hint'));
    expect(tooltip).toBeDefined();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(i18n.t('core.module.generic.field.visible'));
  });

  it('shows the identity (type icon and key) of every row (AC-009)', async () => {
    const { fixture, row } = await render();
    expect(fixture.debugElement.queryAll(By.directive(GenericPropertyIdentity)).length).toBe(4);
    expect(row('status').querySelector('.cfg-identity__key')?.textContent?.trim()).toBe('status');
  });
});
