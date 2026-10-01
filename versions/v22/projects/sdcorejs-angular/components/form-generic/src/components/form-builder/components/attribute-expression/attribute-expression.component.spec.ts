import { ViewContainerRef } from '@angular/core';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdModal } from '@sdcorejs/angular/components/modal';
import type { Filter } from '@sdcorejs/utils/models';
import type { SdFormGenericPageElement } from '../../../../models/form-generic-schema.model';
import { FormGenericService } from '../../../../services/form-generic.service';
import { AttributeExpression, builderQueryFields } from './attribute-expression.component';

describe('AttributeExpression', () => {
  let fixture: ComponentFixture<AttributeExpression>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AttributeExpression, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(AttributeExpression);
    fixture.componentRef.setInput('elements', []);
    fixture.componentRef.setInput('variables', []);
    fixture.detectChanges();
  });

  it('shows the Filter as a query-builder view and hides the edit button when read-only', () => {
    const box = () => fixture.nativeElement.querySelector('fb-value-box') as HTMLElement;
    expect(box().querySelector('.vb')!.classList).toContain('is-empty');
    expect(box().querySelector('.vb__edit')).not.toBeNull();

    fixture.componentRef.setInput('elements', [{ id: 'a', key: 'age', type: 'number', label: 'Age' }]);
    fixture.componentRef.setInput('model', {
      operator: 'OR',
      data: [
        { field: 'age', operator: 'GREATER_THAN', data: 18 },
        { field: 'age', operator: 'NULL' },
      ],
    } as Filter);
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();

    expect(fixture.componentInstance.text()).toBe('Age > 18 or Age is null');
    expect(box().querySelectorAll('.expr__tok--field').length).toBe(2);
    expect(box().querySelector('.vb')!.classList).not.toContain('is-empty');
    expect(box().querySelector('.vb__edit')).withContext('no permission → no edit button').toBeNull();
  });

  it('stores the edited Filter itself and clears the rule when the editor is emptied', () => {
    const emitted: (Filter | undefined)[] = [];
    fixture.componentInstance.sdChange.subscribe(value => emitted.push(value));
    const filter: Filter = { field: 'agree', operator: 'EQUAL', data: true };
    fixture.componentInstance.draftFilter = filter;
    fixture.componentInstance.onAccept();
    expect(fixture.componentInstance.model()).toEqual(filter);
    fixture.componentInstance.draftFilter = null;
    fixture.componentInstance.onAccept();
    expect(fixture.componentInstance.model()).toBeUndefined();
    expect(emitted).toEqual([filter, undefined]);
  });

  it('builds query fields from fields in groups and variables with typed editors', () => {
    const elements = [
      { id: 'n', key: 'age', type: 'number', label: 'Age' },
      {
        id: 'g',
        type: 'group',
        label: 'G',
        elements: [
          { id: 's', key: 'kind', type: 'select', label: 'Kind', options: { source: 'static', items: [{ value: 'a', label: 'Alpha' }] } },
        ],
      },
      { id: 'c', key: 'agree', type: 'checkbox', label: 'Agree' },
      { id: 'd', key: 'joined', type: 'datetime', subtype: 'date', label: 'Joined' },
      { id: 'u', key: 'files', type: 'upload', label: 'Files' },
      { id: 'h', type: 'html', label: 'H', content: '' },
    ] as unknown as SdFormGenericPageElement[];
    const fields = builderQueryFields(elements, [{ key: 'tenant', label: 'Tenant' }], {
      yes: 'Có',
      no: 'Không',
      variablePrefix: '[Biến] ',
    });
    expect(fields.map(field => [field.key, field.type])).toEqual([
      ['age', 'number'],
      ['kind', 'values'],
      ['agree', 'boolean'],
      ['joined', 'date'],
      ['tenant', 'string'],
    ]);
    expect(fields[1].values).toEqual([{ value: 'a', display: 'Alpha' }]);
    expect(fields[4].label).toBe('[Biến] Tenant');
  });

  it('loads each catalog once, in parallel, and opens the editor even when a catalog never answers', fakeAsync(() => {
    const load = jasmine.createSpy('load').and.resolveTo([{ value: 'hn', label: 'Hà Nội' }]);
    const hang = jasmine.createSpy('hang').and.returnValue(new Promise(() => undefined));
    spyOn(TestBed.inject(FormGenericService), 'catalog').and.callFake((id?: string | null) =>
      id === 'cities' ? { id: 'cities', label: 'Cities', load } : id === 'slow' ? { id: 'slow', label: 'Slow', load: hang } : undefined
    );
    spyOn(fixture.debugElement.query(By.directive(SdModal)).componentInstance as SdModal, 'open');
    fixture.componentRef.setInput('elements', [
      { id: 'a', key: 'from', type: 'select', label: 'From', options: { source: 'catalog', catalog: 'cities' } },
      { id: 'b', key: 'to', type: 'radio', label: 'To', options: { source: 'catalog', catalog: 'cities' } },
      { id: 'c', key: 'late', type: 'select', label: 'Late', options: { source: 'catalog', catalog: 'slow' } },
    ]);
    let opened = false;
    fixture.componentInstance.onEdit().then(() => (opened = true));
    tick(3000);
    flushMicrotasks();
    expect(opened).withContext('a catalog that never answers does not keep the editor closed').toBeTrue();
    expect(load).toHaveBeenCalledTimes(1);
    const fields = fixture.componentInstance.queryFields();
    expect(fields.find(field => field.key === 'from')?.values).toEqual([{ value: 'hn', display: 'Hà Nội' }]);
    expect(fields.find(field => field.key === 'late')?.type).toBe('string');
  }));

  it('still opens the editor when a catalog answers something that is not a list', fakeAsync(() => {
    spyOn(TestBed.inject(FormGenericService), 'catalog').and.returnValue({
      id: 'odd',
      label: 'Odd',
      load: jasmine.createSpy('load').and.resolveTo({ items: [] }),
    });
    spyOn(fixture.debugElement.query(By.directive(SdModal)).componentInstance as SdModal, 'open');
    fixture.componentRef.setInput('elements', [
      { id: 'a', key: 'from', type: 'select', label: 'From', options: { source: 'catalog', catalog: 'odd' } },
    ]);
    let opened = false;
    fixture.componentInstance.onEdit().then(() => (opened = true));
    flushMicrotasks();
    expect(opened).toBeTrue();
    expect(fixture.componentInstance.queryFields().find(field => field.key === 'from')?.type).toBe('string');
  }));

  it('projects the confirm action into the modal footer instead of the scrollable body', () => {
    const modalDe = fixture.debugElement.query(By.directive(SdModal));
    const modal = modalDe.componentInstance as SdModal;
    const vcr = modalDe.injector.get(ViewContainerRef);
    modal.alreadyOpened.set(true);
    const view = modal.templateRef().createEmbeddedView({});
    vcr.insert(view);
    fixture.detectChanges();
    const root = view.rootNodes[0] as HTMLElement;
    const footerRight = root.querySelector('.sd-modal-footer-right') as HTMLElement | null;
    const body = root.querySelector('.sd-modal-body') as HTMLElement | null;
    expect(footerRight?.querySelector('sd-button[sdFooterRight]')).not.toBeNull();
    expect(Array.from(body?.children ?? []).some(child => child.tagName.toLowerCase() === 'sd-button')).toBeFalse();
  });
});
