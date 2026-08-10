import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';

import { SdQueryInlineValueChip } from './inline-value-chip.component';
import { SdQueryField } from '../../query-bar.model';

const stringField = { key: 'name', label: 'Name', type: 'string' } as SdQueryField;
const numberField = { key: 'salary', label: 'Salary', type: 'number' } as SdQueryField;

describe('SdQueryInlineValueChip', () => {
  let fixture: ComponentFixture<SdQueryInlineValueChip>;
  let component: SdQueryInlineValueChip;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdQueryInlineValueChip, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(SdQueryInlineValueChip);
    component = fixture.componentInstance;
  });

  function setup(field: SdQueryField, value: unknown = null, operator = 'CONTAIN'): void {
    fixture.componentRef.setInput('field', field);
    fixture.componentRef.setInput('operator', operator);
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
  }

  it('creates', () => {
    setup(stringField);
    expect(component).toBeTruthy();
  });

  describe('state', () => {
    it('is pending when empty and not focused', () => {
      setup(stringField, null);
      expect(component.state()).toBe('pending');
    });

    it('is active when it has a value and not focused', () => {
      setup(stringField, 'abc');
      expect(component.state()).toBe('active');
    });

    it('is focus while focused', () => {
      setup(stringField, 'abc');
      component.onFocus();
      expect(component.state()).toBe('focus');
    });

    it('is error after a bad number commit', () => {
      setup(numberField, null, 'EQUAL');
      component.draft.set('abc');
      component.commitSingle();
      expect(component.state()).toBe('error');
    });
  });

  describe('draft seeding (format)', () => {
    it('formats a number value with vi-VN grouping', () => {
      setup(numberField, 25000000, 'EQUAL');
      expect(component.draft()).toBe((25000000).toLocaleString('vi-VN'));
    });

    it('shows a string value verbatim', () => {
      setup(stringField, 'Nguyễn');
      expect(component.draft()).toBe('Nguyễn');
    });

    it('seeds from/to drafts for a BETWEEN range', () => {
      setup(numberField, { from: 10, to: 50 }, 'BETWEEN');
      expect(component.draftFrom()).toBe((10).toLocaleString('vi-VN'));
      expect(component.draftTo()).toBe((50).toLocaleString('vi-VN'));
    });
  });

  describe('commit', () => {
    it('emits the trimmed string on single commit', () => {
      setup(stringField, null);
      const spy = jasmine.createSpy('valueChange');
      component.valueChange.subscribe(spy);
      component.draft.set('  hello ');
      component.commitSingle();
      expect(spy).toHaveBeenCalledWith('hello');
      expect(component.hasError()).toBe(false);
    });

    it('parses a vi-VN number (strips dot separators) on commit', () => {
      setup(numberField, null, 'EQUAL');
      const spy = jasmine.createSpy('valueChange');
      component.valueChange.subscribe(spy);
      component.draft.set('25.000.000');
      component.commitSingle();
      expect(spy).toHaveBeenCalledWith(25000000);
    });

    it('does NOT emit and flags error on a non-numeric number commit', () => {
      setup(numberField, null, 'EQUAL');
      const spy = jasmine.createSpy('valueChange');
      component.valueChange.subscribe(spy);
      component.draft.set('abc');
      component.commitSingle();
      expect(spy).not.toHaveBeenCalled();
      expect(component.hasError()).toBe(true);
    });

    it('emits null for an emptied number field', () => {
      setup(numberField, 5, 'EQUAL');
      const spy = jasmine.createSpy('valueChange');
      component.valueChange.subscribe(spy);
      component.draft.set('');
      component.commitSingle();
      expect(spy).toHaveBeenCalledWith(null);
    });

    it('emits { from, to } on a BETWEEN range commit', () => {
      setup(numberField, null, 'BETWEEN');
      const spy = jasmine.createSpy('valueChange');
      component.valueChange.subscribe(spy);
      component.draftFrom.set('10');
      component.draftTo.set('50');
      component.commitRange();
      expect(spy).toHaveBeenCalledWith({ from: 10, to: 50 });
    });
  });

  describe('no-data operators', () => {
    it('hides the input segment for NULL / NOT_NULL', () => {
      setup(stringField, null, 'NULL');
      fixture.detectChanges();
      expect(component.isNoData()).toBe(true);
      expect(fixture.nativeElement.querySelector('.c-seamless__input')).toBeNull();
    });
  });

  describe('remove', () => {
    it('emits remove on × click', () => {
      setup(stringField, 'abc');
      const spy = jasmine.createSpy('remove');
      component.sdRemove.subscribe(spy);
      const x = fixture.nativeElement.querySelector('.c-seamless__x') as HTMLButtonElement;
      x.click();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('revert (Esc)', () => {
    it('restores the draft from the committed value without emitting', () => {
      setup(stringField, 'kept');
      const spy = jasmine.createSpy('valueChange');
      component.valueChange.subscribe(spy);
      component.draft.set('typed-but-cancelled');
      component.revertAndBlur({ blur: () => {} });
      expect(component.draft()).toBe('kept');
      expect(spy).not.toHaveBeenCalled();
      expect(component.focused()).toBe(false);
    });
  });

  // why: bug "khoảng cách giữa label và value lớn / không đồng đều" do gap
  // bị cộng dồn (label padding-right + input padding-left = 8px) so với gap
  // nội bộ 4px. Fix: chỉ 1 nguồn khoảng cách (input padding-left = 4px).
  // Spec đo distance giữa `:` separator và input đầu tiên, assert ≤ 6px
  // (4px gap + tolerance), không double-padded.
  describe('label ↔ value spacing', () => {
    it('puts a single 4px gap between the ":" separator and the input (no double-padding) [compact]', () => {
      setup(stringField, 'abc');
      fixture.componentRef.setInput('density', 'compact');
      fixture.detectChanges();
      const sep = fixture.nativeElement.querySelector('.c-seamless__sep') as HTMLElement;
      const input = fixture.nativeElement.querySelector('sd-inline-text') as HTMLElement;
      expect(sep).not.toBeNull();
      expect(input).not.toBeNull();
      const gap = input.getBoundingClientRect().left - sep.getBoundingClientRect().right;
      // why: 4px gap from input padding-left + small font sub-pixel tolerance
      expect(gap).toBeGreaterThanOrEqual(2);
      expect(gap).toBeLessThanOrEqual(6);
    });

    it("matches the label's internal gap so spacing reads uniformly across the chip [compact]", () => {
      setup(stringField, 'abc');
      fixture.componentRef.setInput('density', 'compact');
      fixture.detectChanges();
      const icon = fixture.nativeElement.querySelector('.c-seamless__icon') as HTMLElement;
      const fieldEl = fixture.nativeElement.querySelector('.c-seamless__field') as HTMLElement;
      const sep = fixture.nativeElement.querySelector('.c-seamless__sep') as HTMLElement;
      const input = fixture.nativeElement.querySelector('sd-inline-text') as HTMLElement;
      const iconToField = fieldEl.getBoundingClientRect().left - icon.getBoundingClientRect().right;
      const sepToInput = input.getBoundingClientRect().left - sep.getBoundingClientRect().right;
      // why: cùng là 4px, sai số <= 2px do sub-pixel rendering.
      expect(Math.abs(iconToField - sepToInput)).toBeLessThanOrEqual(2);
    });
  });

  describe('i18n placeholders', () => {
    let i18n: I18nService;

    beforeEach(() => {
      i18n = TestBed.inject(I18nService);
      i18n.setLanguage('vi', { reload: false });
    });

    afterEach(() => {
      i18n.setLanguage('vi', { reload: false });
    });

    it('uses distinct catalogue keys for the number and string placeholder styles', () => {
      setup(numberField, null);
      expect(component.ph()).toBe('giá trị');

      setup(stringField, null);
      expect(component.ph()).toBe('nhập…');
    });

    it('translates the BETWEEN from/to placeholders per field type', () => {
      setup(numberField, null, 'BETWEEN');
      expect(component.phFrom()).toBe('Từ');
      expect(component.phTo()).toBe('Đến');

      setup(stringField, null, 'BETWEEN');
      expect(component.phFrom()).toBe('từ…');
      expect(component.phTo()).toBe('đến…');
    });

    it('follows a language switch', () => {
      setup(numberField, null, 'BETWEEN');
      i18n.setLanguage('en', { reload: false });
      expect(component.ph()).toBe('value');
      expect(component.phFrom()).toBe('From');
      expect(component.phTo()).toBe('To');
    });
  });
});
