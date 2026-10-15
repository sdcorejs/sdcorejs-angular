import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import type { SdFormGenericSchema } from '@sdcorejs/angular/components/form-generic';
import type { SdGenericSchema } from '../../models';
import { GenericConfigurationForm } from './generic-configuration-form.component';

const schema = (extra: Partial<SdGenericSchema> = {}): SdGenericSchema => ({
  version: 1,
  module: 'tms',
  entity: 'order',
  general: {
    label: 'Order',
    properties: [
      { key: 'id', label: 'Id', dataType: 'string', system: true },
      { key: 'code', label: 'Code', dataType: 'string' },
      { key: 'note', label: 'Note', dataType: 'text' },
    ],
  },
  ...extra,
});

const layout = (...keys: string[]): SdFormGenericSchema =>
  ({ pages: [{ id: 'p', elements: keys.map(key => ({ id: key, key, type: 'textfield', label: key })) }] }) as SdFormGenericSchema;

describe('GenericConfigurationForm', () => {
  const create = (value: SdGenericSchema) => {
    TestBed.configureTestingModule({ imports: [GenericConfigurationForm], providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(GenericConfigurationForm);
    fixture.componentRef.setInput('schema', value);
    const emitted: SdGenericSchema[] = [];
    fixture.componentInstance.schemaChange.subscribe(next => emitted.push(next));
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, emitted };
  };

  it('lists the properties that the layout does not place yet (D-023)', () => {
    const { component } = create(schema({ detail: { form: layout('code') } }));
    expect(component.missing().map(property => property.key)).toEqual(['id', 'note']);
    component.select('create');
    expect(component.missing().map(property => property.key))
      .withContext('system properties never go to create')
      .toEqual(['note']);
  });

  it('adds a property to the layout of the selected form (D-023, AC-020)', () => {
    const { component, emitted } = create(schema({ detail: { form: layout('code') } }));
    component.add(schema().general.properties[2]);
    const form = emitted[0].detail!.form!;
    const keys = form.pages[0].elements.map(element => (element as { key?: string }).key);
    expect(keys).toEqual(['code', 'note']);
    expect((form.pages[0].elements[1] as { type: string }).type).toBe('textarea');
  });

  it('switches create between its own layout and the detail layout', () => {
    const { component, emitted, fixture } = create(schema({ detail: { form: layout('code') } }));
    component.select('create');
    expect(component.sameAsDetail()).toBeTrue();
    component.setSameAsDetail(false);
    expect(emitted[0].create!.form).toEqual(layout('code'));
    fixture.componentRef.setInput('schema', emitted[0]);
    component.setSameAsDetail(true);
    expect(Object.hasOwn(emitted[1].create!, 'form')).toBeFalse();
  });

  it('stores the title of the selected form', () => {
    const { component, emitted } = create(schema());
    component.select('update');
    component.setTitle('Edit ${code}');
    expect(emitted[0].update!.title).toBe('Edit ${code}');
  });

  it('keeps the generated layout object when another tab changes the schema, so sd-form-builder does not reload', () => {
    const { component, fixture } = create(schema());
    const before = component.layout();
    fixture.componentRef.setInput('schema', schema({ list: { title: 'Orders', pageSize: 50 } }));
    expect(component.layout()).withContext('same generated content').toBe(before);
    fixture.componentRef.setInput('schema', schema({ general: { label: 'Order', properties: schema().general.properties.slice(0, 2) } }));
    expect(component.layout()).withContext('a removed property changes the layout').not.toBe(before);
  });

  it('exposes the detail / create / update switcher as a radio group', () => {
    const { fixture, component } = create(schema());
    const group = (fixture.nativeElement as HTMLElement).querySelector('[role="radiogroup"]')!;
    const radios = Array.from(group.querySelectorAll('[role="radio"]'));
    expect(radios.map(radio => radio.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
    component.selectValue('update');
    fixture.detectChanges();
    expect(radios.map(radio => radio.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true']);
  });
});
