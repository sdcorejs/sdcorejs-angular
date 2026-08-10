import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';

import { SdQueryBuilder } from './query-builder.component';
import { SdQbGroup, SdQbRule, SdQueryBuilderField } from './query-builder.model';

const FIELDS: SdQueryBuilderField[] = [
  { key: 'code', label: 'Mã', type: 'string' },
  { key: 'name', label: 'Tên', type: 'string' },
  { key: 'price', label: 'Giá', type: 'number' },
  { key: 'cost', label: 'Cost', type: 'number' },
  { key: 'updatedAt', label: 'Updated', type: 'date' },
  {
    key: 'status',
    label: 'Trạng thái',
    type: 'values',
    values: [
      { value: 'active', display: 'Hoạt động' },
      { value: 'inactive', display: 'Ngừng' },
    ],
  },
  { key: 'active', label: 'Kích hoạt', type: 'boolean' },
  { key: 'createdAt', label: 'Ngày tạo', type: 'date' },
  { key: 'tier', label: 'Hạng', type: 'string', operators: ['EQUAL'] }, // single-operator field
];

describe('SdQueryBuilder', () => {
  let fixture: ComponentFixture<SdQueryBuilder>;
  let component: SdQueryBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdQueryBuilder, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SdQueryBuilder);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('fields', FIELDS);
    fixture.detectChanges();
  });

  const firstRule = (): SdQbRule => component.tree().children[0] as SdQbRule;

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders the edit container by default and the view div in view mode', () => {
    expect(fixture.nativeElement.querySelector('.qb-container')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.qb-view')).toBeNull();

    fixture.componentRef.setInput('mode', 'view');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.qb-view')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.qb-container')).toBeNull();
  });

  // AC1 — operator set follows field type; selector hidden when only one operator.
  describe('AC1 — operator by field type', () => {
    it('exposes the per-type operator set', () => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'price'); // number
      expect(component.allowedOperators(r)).toContain('BETWEEN');
      expect(component.allowedOperators(r)).toContain('GREATER_THAN');

      component.setField(r, 'status'); // values
      expect(component.allowedOperators(r)).toContain('IN');
      expect(component.allowedOperators(r)).not.toContain('GREATER_THAN');
    });

    it('hides the operator selector for a single-operator field', () => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'tier'); // operators: ['EQUAL']
      expect(component.showOperatorSelector(r)).toBe(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('sd-operator')).toBeNull();
    });

    it('shows the operator selector for a multi-operator field', () => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'name'); // string → many operators
      expect(component.showOperatorSelector(r)).toBe(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('sd-operator')).not.toBeNull();
    });
  });

  // AC2 — value editor control matches field type.
  describe('AC2 — value editor by type', () => {
    const setupRule = (key: string, operator?: string) => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, key);
      if (operator) component.setOperator(r, operator as any);
      fixture.detectChanges();
      return r;
    };

    it('renders sd-input for a string field', () => {
      setupRule('name', 'EQUAL');
      expect(fixture.nativeElement.querySelector('sd-input.qb-val')).not.toBeNull();
    });

    it('renders sd-select for a values field', () => {
      setupRule('status', 'IN');
      expect(fixture.nativeElement.querySelector('sd-select.qb-val')).not.toBeNull();
    });

    it('renders sd-select for a boolean field', () => {
      setupRule('active', 'EQUAL');
      expect(fixture.nativeElement.querySelector('sd-select.qb-val')).not.toBeNull();
    });

    it('renders two value inputs for a BETWEEN number field', () => {
      setupRule('price', 'BETWEEN');
      // a number field renders <sd-input-number>, not <sd-input>
      expect(fixture.nativeElement.querySelectorAll('sd-input-number.qb-val').length).toBe(2);
    });

    it('renders no value editor for a NULL operator', () => {
      setupRule('name', 'NULL');
      expect(fixture.nativeElement.querySelector('.qb-val')).toBeNull();
    });

    it('hides the value source selector in value-only mode', () => {
      setupRule('price', 'GREATER_THAN');
      expect(fixture.nativeElement.querySelector('.qb-value-source')).toBeNull();
    });

    it('allows each rule to switch between literal value and same-type field operand', () => {
      fixture.componentRef.setInput('comparisonMode', 'value-or-field');
      const r = setupRule('price', 'GREATER_THAN');

      expect(component.compareFields(r).map(f => f.key)).toEqual(['cost']);
      expect(fixture.nativeElement.querySelector('.qb-value-source')).not.toBeNull();

      component.setValueSource(r, 'field');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('sd-select.qb-compare-field')).not.toBeNull();

      component.setCompareField(r, 'cost');
      expect(component.value()).toEqual({
        operator: 'AND',
        data: [{ field: 'price', operator: 'GREATER_THAN', dataType: 'field', data: 'cost' }],
      } as any);
    });

    it('resets a field operand when switching to an unsupported operator', () => {
      fixture.componentRef.setInput('comparisonMode', 'value-or-field');
      const r = setupRule('price', 'GREATER_THAN');
      component.setValueSource(r, 'field');
      component.setCompareField(r, 'cost');

      component.setOperator(r, 'BETWEEN');

      expect(r.valueSource).toBe('literal');
      expect(r.compareField).toBeUndefined();
      expect(r.value).toEqual({ from: null, to: null });
    });
  });

  // AC3 — emits a valid nested Filter via [(value)].
  describe('AC3 — Filter output', () => {
    it('emits a nested FilterAndOr tree', () => {
      const c = component;
      c.setGroupLogic(c.tree(), 'OR');
      c.addRule(c.tree());
      const r0 = c.tree().children[0] as SdQbRule;
      c.setField(r0, 'price');
      c.setOperator(r0, 'GREATER_THAN');
      c.setScalar(r0, 100);
      c.addGroup(c.tree());
      const g = c.tree().children[1] as SdQbGroup;
      c.setGroupLogic(g, 'AND');
      const gr0 = g.children[0] as SdQbRule;
      c.setField(gr0, 'code');
      c.setOperator(gr0, 'EQUAL');
      c.setScalar(gr0, 'ABC');
      c.addRule(g);
      const gr1 = g.children[1] as SdQbRule;
      c.setField(gr1, 'name');
      c.setOperator(gr1, 'CONTAIN');
      c.setScalar(gr1, 'abc');

      expect(c.value()).toEqual({
        operator: 'OR',
        data: [
          { field: 'price', operator: 'GREATER_THAN', data: 100 },
          {
            operator: 'AND',
            data: [
              { field: 'code', operator: 'EQUAL', data: 'ABC' },
              { field: 'name', operator: 'CONTAIN', data: 'abc' },
            ],
          },
        ],
      } as any);
    });

    it('emits FilterBetween for a BETWEEN rule', () => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'price');
      component.setOperator(r, 'BETWEEN');
      component.setBetweenFrom(r, 10);
      component.setBetweenTo(r, 20);
      expect(component.value()).toEqual({
        operator: 'AND',
        data: [{ field: 'price', operator: 'BETWEEN', data: { from: 10, to: 20 } }],
      } as any);
    });

    it('emits FilterNoData for a NULL rule (no data key)', () => {
      // asserts: NULL / NOT_NULL must serialize WITHOUT a `data` key (FilterNoData shape) — a stray `data: null` breaks backends that branch on key presence
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'code');
      component.setOperator(r, 'NULL');
      expect(component.value()).toEqual({
        operator: 'AND',
        data: [{ field: 'code', operator: 'NULL' }],
      } as any);
    });

    it('emits null when there are no complete rules', () => {
      component.addRule(component.tree());
      expect(component.value()).toBeNull();
    });
  });

  // AC4 — filters mirror + inbound seeding without an emit loop.
  describe('AC4 — filters mirror + seeding', () => {
    it('keeps filters as the root group data', () => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'code');
      component.setOperator(r, 'EQUAL');
      component.setScalar(r, 'X');
      expect(component.filters()).toEqual([{ field: 'code', operator: 'EQUAL', data: 'X' } as any]);
    });

    it('rebuilds the tree from an external value without looping', () => {
      // asserts: an external [value] write must seed the tree once and settle — the #lastEmitted compare-guard must prevent our own echo from re-triggering a rebuild (infinite loop / value drift)
      const seed = { operator: 'AND', data: [{ field: 'code', operator: 'EQUAL', data: 'X' }] } as any;
      component.value.set(seed);
      fixture.detectChanges();
      expect(component.tree().logic).toBe('AND');
      expect(component.tree().children.length).toBe(1);
      expect(component.tree().children[0].kind).toBe('rule');
      // value remains the normalized seed (no echo loop / drift)
      expect(component.value()).toEqual(seed);
      expect(component.filters()).toEqual(seed.data);
    });
  });

  // AC5 + AC6 — view-mode raw string + highlight spans.
  describe('AC5/AC6 — view mode', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('mode', 'view');
      component.value.set({
        operator: 'OR',
        data: [
          {
            operator: 'AND',
            data: [
              { field: 'code', operator: 'EQUAL', data: 'ABC' },
              { field: 'name', operator: 'CONTAIN', data: 'abc' },
            ],
          },
          { field: 'price', operator: 'GREATER_THAN', data: 100 },
        ],
      } as any);
      fixture.detectChanges();
    });

    it('renders the SQL-ish raw string with field labels', () => {
      const text = (fixture.nativeElement.querySelector('.qb-view') as HTMLElement).textContent ?? '';
      expect(text.replace(/\s+/g, ' ').trim()).toBe("(Mã = 'ABC' and Tên like '%abc%') or Giá > 100");
    });

    it('highlights operator and value tokens in distinct spans', () => {
      const root = fixture.nativeElement.querySelector('.qb-view') as HTMLElement;
      expect(root.querySelectorAll('.qb-tok-op').length).toBeGreaterThan(0);
      expect(root.querySelectorAll('.qb-tok-value').length).toBeGreaterThan(0);
      expect(root.querySelectorAll('.qb-tok-field').length).toBeGreaterThan(0);
    });
  });

  // Task 3 — field swap-only guard
  describe('field swap-only (issue #2)', () => {
    it('ignores a null key — the field is never cleared', () => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'name');
      expect(r.field).toBe('name');

      component.setField(r, null); // attempt to clear
      expect(r.field).toBe('name'); // unchanged — swap only

      component.setField(r, undefined as any);
      expect(r.field).toBe('name');
    });

    it('still swaps to another field', () => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'name');
      component.setField(r, 'price');
      expect(r.field).toBe('price');
    });
  });

  // Task 3 + Task 5 — relative value survives operator change
  describe('relative value survives a single-value operator change', () => {
    it('keeps a relative offset when switching GREATER_THAN → LESS_THAN', () => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'createdAt');
      component.setOperator(r, 'GREATER_THAN');
      component.setDateMode(r, 'relative'); // added in Task 5
      expect(r.value).toEqual({ amount: 1, direction: 'previous', unit: 'day' });

      component.setOperator(r, 'LESS_THAN');
      expect(r.value).toEqual({ amount: 1, direction: 'previous', unit: 'day' });
    });

    it('resets a relative value to {from,to} when switching to BETWEEN', () => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'createdAt');
      component.setOperator(r, 'GREATER_THAN');
      component.setDateMode(r, 'now');
      expect(r.value).toBe('TODAY');

      component.setOperator(r, 'BETWEEN');
      expect(r.value).toEqual({ from: null, to: null });
    });
  });

  // Task 4 — boolean items stability (OOM fix — issue #3)
  describe('boolean items stability (OOM fix — issue #3)', () => {
    const booleanField = (): SdQueryBuilderField => FIELDS.find(f => f.key === 'active')!;

    it('returns the SAME array reference across calls for the same field', () => {
      const a = component.booleanItems(booleanField());
      const b = component.booleanItems(booleanField());
      expect(a).toBe(b); // stable ref — no fresh allocation per CD
    });

    it('does not loop / throw when a rule field is switched to a boolean field', () => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'active');
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(() => fixture.detectChanges()).not.toThrow();
      // boolean value editor rendered
      expect(fixture.nativeElement.querySelectorAll('sd-select').length).toBeGreaterThan(0);
    });

    it('still maps the boolean labels (default + overridden)', () => {
      const items = component.booleanItems(booleanField());
      expect(items).toEqual([
        { value: true, display: 'Có' },
        { value: false, display: 'Không' },
      ]);
    });
  });

  // `values` items stability — same OOM class as boolean items above.
  describe('values items stability (OOM fix)', () => {
    const valuesField = (): SdQueryBuilderField => FIELDS.find(f => f.key === 'status')!;

    it('returns the SAME array reference across calls for the same field', () => {
      expect(component.valueItems(valuesField())).toBe(component.valueItems(valuesField()));
    });

    it('returns the SAME empty reference for a values field declared WITHOUT values', () => {
      // why: đây chính là ca gây treo. `values` là optional, nên template cũ (`fieldOf(rule)!.values || []`)
      // cấp phát một `[]` MỚI mỗi CD cho field khai thiếu `values` → `sd-select` gọi markForCheck →
      // CD mới → mảng mới → lặp vô hạn. Ref rỗng phải ổn định.
      const bare = { key: 'no-values', label: 'Thiếu values', type: 'values' } as SdQueryBuilderField;
      const a = component.valueItems(bare);
      const b = component.valueItems(bare);

      expect(a).toBe(b);
      expect(a.length).toBe(0);
    });

    it('does not loop / throw when a rule field is switched to a values field', () => {
      component.addRule(component.tree());
      component.setField(firstRule(), 'status');

      expect(() => fixture.detectChanges()).not.toThrow();
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('still exposes the declared option list', () => {
      expect(component.valueItems(valuesField())).toEqual([
        { value: 'active', display: 'Hoạt động' },
        { value: 'inactive', display: 'Ngừng' },
      ]);
    });
  });

  // Task 6 — date-mode UI + compact rows (hideInlineError)
  describe('date-mode UI + compact rows', () => {
    const setupDateRule = (op: string) => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'createdAt');
      component.setOperator(r, op as any);
      fixture.detectChanges();
      return r;
    };

    it('renders the date-mode select for a single-value date operator', () => {
      setupDateRule('GREATER_THAN');
      expect(fixture.nativeElement.querySelector('.qb-date-mode')).not.toBeNull();
    });

    it('does NOT render the date-mode select for BETWEEN', () => {
      setupDateRule('BETWEEN');
      expect(fixture.nativeElement.querySelector('.qb-date-mode')).toBeNull();
      // two absolute pickers instead
      expect(fixture.nativeElement.querySelectorAll('sd-date').length).toBe(2);
    });

    it('shows the relative controls when mode = relative, hides the date picker', () => {
      const r = setupDateRule('GREATER_THAN');
      component.setDateMode(r, 'relative');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.qb-rel-amount')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('.qb-rel-unit')).not.toBeNull();
    });

    it('shows no value editor when mode = now', () => {
      const r = setupDateRule('GREATER_THAN');
      component.setDateMode(r, 'now');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.qb-rel-amount')).toBeNull();
      // the absolute date picker is also hidden in now mode
      expect(fixture.nativeElement.querySelector('.qb-rule sd-date.qb-val')).toBeNull();
    });

    it('passes hideInlineError to value editors (compact rows)', () => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'name'); // string → sd-input
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('sd-input.qb-val');
      // hideInlineError reflects to the host (truthy attribute present)
      expect(input?.hasAttribute('hideinlineerror') || input?.getAttribute('ng-reflect-hide-inline-error') === 'true').toBeTrue();
    });
  });

  // Task 5 — date-mode helpers (relative dates — issue #4)
  describe('date-mode helpers (relative dates — issue #4)', () => {
    const dateRule = (): SdQbRule => {
      component.addRule(component.tree());
      const r = firstRule();
      component.setField(r, 'createdAt');
      component.setOperator(r, 'GREATER_THAN'); // single-value op
      return r;
    };

    it('dateMode derives absolute / now / relative from the value', () => {
      const r = dateRule();
      expect(component.dateMode(r)).toBe('absolute'); // default value is null
      r.value = 'TODAY';
      expect(component.dateMode(r)).toBe('now');
      r.value = { amount: 2, direction: 'next', unit: 'day' };
      expect(component.dateMode(r)).toBe('relative');
    });

    it('setDateMode reseeds the value per mode', () => {
      const r = dateRule();
      component.setDateMode(r, 'now');
      expect(r.value).toBe('TODAY');
      component.setDateMode(r, 'relative');
      expect(r.value).toEqual({ amount: 1, direction: 'previous', unit: 'day' });
      component.setDateMode(r, 'absolute');
      expect(r.value).toBeNull();
    });

    it('relativeAmount reads the offset amount (default 1)', () => {
      const r = dateRule();
      expect(component.relativeAmount(r)).toBe(1);
      r.value = { amount: 5, direction: 'previous', unit: 'week' };
      expect(component.relativeAmount(r)).toBe(5);
    });

    it('setRelativeAmount clamps to an integer >= 1', () => {
      const r = dateRule();
      component.setDateMode(r, 'relative');
      component.setRelativeAmount(r, 4);
      expect(r.value).toEqual({ amount: 4, direction: 'previous', unit: 'day' });
      component.setRelativeAmount(r, 0);
      expect((r.value as any).amount).toBe(1);
      component.setRelativeAmount(r, 'abc');
      expect((r.value as any).amount).toBe(1);
      component.setRelativeAmount(r, 2.7);
      expect((r.value as any).amount).toBe(2);
    });

    it('relativeUnitDirValue reads / setRelativeUnitDir writes the unit:direction token', () => {
      const r = dateRule();
      component.setDateMode(r, 'relative');
      expect(component.relativeUnitDirValue(r)).toBe('day:previous');
      component.setRelativeUnitDir(r, 'month:next');
      expect(r.value).toEqual({ amount: 1, direction: 'next', unit: 'month' });
      expect(component.relativeUnitDirValue(r)).toBe('month:next');
    });

    it('exposes stable option lists for the template', () => {
      // why: `[items]` của sd-select phải nhận CÙNG một tham chiếu giữa các chu kỳ CD, nếu không
      // `toObservable(items)` → `markForCheck()` sẽ lặp vô hạn. Computed memo hoá nên hai lần đọc
      // liên tiếp (ngôn ngữ không đổi) phải trả về đúng một mảng.
      expect(component.dateModes()).toBe(component.dateModes());
      expect(component.relativeUnitOptions()).toBe(component.relativeUnitOptions());
      expect(component.dateModes().map(m => m.value)).toEqual(['absolute', 'now', 'relative']);
    });
  });

  // Chuyển nhãn từ "dịch lúc module-eval" sang "dịch lúc đọc".
  describe('i18n — option labels resolve at read time', () => {
    let i18n: I18nService;

    beforeEach(() => {
      i18n = TestBed.inject(I18nService);
      i18n.setLanguage('vi', { reload: false });
    });

    afterEach(() => {
      i18n.setLanguage('vi', { reload: false });
    });

    it('date-mode labels follow the active language', () => {
      expect(component.dateModes().map(m => m.display)).toEqual(['Ngày cụ thể', 'Hôm nay', 'Tương đối']);

      i18n.setLanguage('en', { reload: false });
      expect(component.dateModes().map(m => m.display)).toEqual(['Specific date', 'Today', 'Relative']);

      i18n.setLanguage('ja', { reload: false });
      expect(component.dateModes().map(m => m.display)).toEqual(['指定した日付', '今日', '相対']);
    });

    it('value-source + relative-unit labels follow the active language', () => {
      expect(component.valueSourceOptions().map(o => o.display)).toEqual(['Nhập giá trị', 'Chọn trường']);
      expect(component.relativeUnitOptions()[0].display).toBe('ngày trước');

      i18n.setLanguage('en', { reload: false });
      expect(component.valueSourceOptions().map(o => o.display)).toEqual(['Enter a value', 'Compare with field']);
      expect(component.relativeUnitOptions()[0].display).toBe('days ago');
    });

    it('hands a NEW array ref after a language switch, but keeps it stable within one language', () => {
      // why: hai yêu cầu ngược nhau phải cùng đúng — ổn định giữa các CD (chống vòng lặp OOM của
      // sd-select) NHƯNG phải đổi khi ngôn ngữ đổi (nếu không nhãn cũ kẹt lại trên UI).
      const viRef = component.dateModes();
      expect(component.dateModes()).toBe(viRef);

      i18n.setLanguage('en', { reload: false });
      const enRef = component.dateModes();
      expect(enRef).not.toBe(viRef);
      expect(component.dateModes()).toBe(enRef);
    });

    it('boolean value options fall back to translated labels and follow the language', () => {
      const booleanField = FIELDS.find(f => f.key === 'active')!;
      expect(component.booleanItems(booleanField).map(o => o.display)).toEqual(['Có', 'Không']);

      i18n.setLanguage('en', { reload: false });
      expect(component.booleanItems(booleanField).map(o => o.display)).toEqual(['Yes', 'No']);
    });

    it('view-mode tokens follow the active language', () => {
      fixture.componentRef.setInput('mode', 'view');
      fixture.componentRef.setInput('value', {
        operator: 'AND',
        data: [
          { field: 'createdAt', operator: 'LESS_THAN', dataType: 'date-relative', data: { amount: 3, direction: 'previous', unit: 'day' } },
        ],
      } as any);
      fixture.detectChanges();

      expect(
        component
          .tokens()
          .map(t => t.text)
          .join('')
      ).toBe('Ngày tạo < 3 ngày trước');

      i18n.setLanguage('en', { reload: false });
      expect(
        component
          .tokens()
          .map(t => t.text)
          .join('')
      ).toBe('Ngày tạo < 3 days ago');
    });
  });
});
