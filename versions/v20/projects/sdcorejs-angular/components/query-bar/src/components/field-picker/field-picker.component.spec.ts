import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SdQueryFieldPicker } from './field-picker.component';
import { SdQueryField } from '../../query-bar.model';

describe('SdQueryFieldPicker', () => {
  let fixture: ComponentFixture<SdQueryFieldPicker>;
  let component: SdQueryFieldPicker;

  const fields: SdQueryField[] = [
    { key: 'a', label: 'A', type: 'string' } as SdQueryField,
    { key: 'b', label: 'B', type: 'number' } as SdQueryField,
    { key: 'c', label: 'C', type: 'date', disabled: true } as SdQueryField,
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdQueryFieldPicker, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(SdQueryFieldPicker);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('fields', fields);
    fixture.detectChanges();
  });

  it('disables the current key (chip-popover switch flow)', () => {
    fixture.componentRef.setInput('currentKey', 'a');
    fixture.detectChanges();
    expect(component.isDisabled(fields[0])).toBe(true);
    expect(component.isDisabled(fields[1])).toBe(false);
    expect(component.isCurrent(fields[0])).toBe(true);
  });

  it('disables every key in usedKeys (add-filter flow)', () => {
    fixture.componentRef.setInput('usedKeys', new Set(['a', 'b']));
    fixture.detectChanges();
    expect(component.isDisabled(fields[0])).toBe(true);
    expect(component.isDisabled(fields[1])).toBe(true);
    expect(component.isUsed(fields[0])).toBe(true);
  });

  it('honors the field own `disabled: true` flag', () => {
    expect(component.isDisabled(fields[2])).toBe(true);
  });

  it('pick emits the chosen field', () => {
    const spy = jasmine.createSpy('pick');
    component.sdPick.subscribe(spy);
    component.sdPick.emit(fields[0]);
    expect(spy).toHaveBeenCalledWith(fields[0]);
  });

  it('exposes a MatMenu instance via menu()', () => {
    expect(component.menu()).toBeDefined();
  });
});
