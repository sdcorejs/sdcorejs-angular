import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
} from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { SdItemDefDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdOperator } from '@sdcorejs/angular/components/operator';
import { DateRelative, Filter, Operator } from '@sdcorejs/utils/models';
import {
  isQbGroup,
  QB_DATE_MODES,
  QB_EMPTY_OPTIONS,
  QB_RELATIVE_UNIT_OPTIONS,
  QB_TODAY,
  QB_VALUE_SOURCE_OPTIONS,
  QbComparisonMode,
  QbDateMode,
  QbGroup,
  QbNode,
  QbRule,
  QbToken,
  QbValueSource,
  qbAllowedOperators,
  qbDefaultOperator,
  qbDefaultRelative,
  qbSupportsFieldCompareOperator,
  qbIsMultiOperator,
  qbIsNoDataOperator,
  qbIsRelativeDate,
  qbIsToday,
  qbFieldIcon,
  qbNewGroup,
  qbNewRule,
  SdQueryBuilderField,
  SdQueryBuilderFieldOption,
  SdQueryBuilderOption,
} from './query-builder.model';
import { filterToTokens, filterToTree, treeToFilter } from './query-builder.serializer';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

/** A logical `Filter` (AND / OR group) carries a `data[]` array. */
function isAndOr(filter: any): boolean {
  return !!filter && (filter.operator === 'AND' || filter.operator === 'OR') && Array.isArray(filter.data);
}

const QB_EMPTY_FIELDS: SdQueryBuilderField[] = [];

/**
 * Visual filter / rule builder. Compose nested AND / OR groups of
 * `field operator value` conditions; emits the canonical `Filter` (root is a
 * `FilterAndOr` tree) via `[(value)]`, plus a flat `[(filters)]` mirror of the
 * root group's direct children. `mode="view"` renders a read-only SQL-ish raw
 * string with highlighted operators + values.
 */
@Component({
  selector: 'sd-query-builder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, NgTemplateOutlet, SdOperator, SdSelect, SdInput, SdInputNumber, SdDate, SdDatetime, SdItemDefDefDirective],
  templateUrl: './query-builder.component.html',
  styleUrl: './query-builder.component.scss',
})
export class SdQueryBuilder {
  readonly #i18n = inject(I18nService);

  // -------------------------------------------------------------------------
  // Inputs
  // -------------------------------------------------------------------------

  /** Main option object. Prefer this API for new usage; individual inputs stay as a migration bridge. */
  readonly option = input<SdQueryBuilderOption | undefined>(undefined);

  /** Filterable fields — each declares a `type` that drives the operator set + value editor. */
  readonly fields = input<SdQueryBuilderField[]>([]);

  /** `'edit'` (default) = interactive tree · `'view'` = read-only raw-query string. */
  readonly mode = input<'edit' | 'view'>('edit');

  /** `value-only` = literal operands only · `value-or-field` = each rule may compare against another field. */
  readonly comparisonMode = input<QbComparisonMode>('value-only');

  /** Disable all editing controls. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Prefix for `data-autoid` on inner controls (E2E selectors). */
  readonly autoId = input<string>();

  // -------------------------------------------------------------------------
  // Two-way models (output contract)
  // -------------------------------------------------------------------------

  /** Canonical output — the root `FilterAndOr` tree, or `null` when empty. `[(value)]`. */
  readonly value = model<Filter | null>(null);

  /** Convenience mirror — the root group's direct children. `[(filters)]`. */
  readonly filters = model<Filter[]>([]);

  /** Root group's logical connector. `[(rootLogic)]`. */
  readonly rootLogic = model<'AND' | 'OR'>('AND');

  // -------------------------------------------------------------------------
  // Internal source of truth — the editable tree (carries UI state).
  // -------------------------------------------------------------------------

  readonly #tree = signal<QbGroup>(qbNewGroup('AND'));
  readonly tree = this.#tree.asReadonly();

  /** Last filter WE emitted — used to recognise (and ignore) our own echo in the inbound effect. */
  #lastEmitted: Filter | null | undefined = undefined;

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  /** `field.key` → field, for fast lookup from a rule. */
  readonly resolvedFields = computed(() => this.option()?.fields ?? this.fields());
  readonly resolvedMode = computed(() => this.option()?.mode ?? this.mode());
  readonly resolvedComparisonMode = computed(() => this.option()?.comparisonMode ?? this.comparisonMode());
  readonly resolvedDisabled = computed(() => this.option()?.disabled ?? this.disabled());
  readonly resolvedAutoId = computed(() => this.option()?.autoId ?? this.autoId());

  readonly fieldByKey = computed<Record<string, SdQueryBuilderField>>(() => {
    const map: Record<string, SdQueryBuilderField> = {};
    for (const f of this.resolvedFields()) map[f.key] = f;
    return map;
  });

  /** Boolean fields → their stable `[true,false]` option list. Memoized so the template
   *  binding hands `sd-select` the SAME array ref each CD (else its `toObservable(items)`
   *  → `markForCheck()` loops → OOM). Recomputes only when `fields()` changes. */
  readonly #booleanOptionsByKey = computed<Map<string, SdQueryBuilderFieldOption[]>>(() => {
    const map = new Map<string, SdQueryBuilderFieldOption[]>();
    for (const f of this.resolvedFields()) {
      if (f.type === 'boolean') {
        map.set(f.key, [
          { value: true, display: f.trueLabel ?? this.#i18n.t('core.component.query-builder.boolean.true') },
          { value: false, display: f.falseLabel ?? this.#i18n.t('core.component.query-builder.boolean.false') },
        ]);
      }
    }
    return map;
  });

  // -------------------------------------------------------------------------
  // Option lists — dịch lúc ĐỌC, không phải lúc module được đánh giá.
  //
  // why: bảng hằng số trong `query-builder.model.ts` chỉ giữ `labelKey`; `computed` ở đây mới sinh
  // ra `display`. Nhờ vậy đổi ngôn ngữ là nhãn đổi theo (computed phụ thuộc signal `messages()` bên
  // trong `I18nService.t`), mà tham chiếu mảng vẫn ỔN ĐỊNH giữa các chu kỳ change detection vì
  // computed chỉ tính lại khi ngôn ngữ đổi — bắt buộc, nếu không `sd-select` sẽ rơi lại vào vòng lặp
  // `toObservable(items)` → `markForCheck()` → CD mới → mảng mới (xem `#booleanOptionsByKey`).
  // -------------------------------------------------------------------------

  /** Stable option list for the date-mode select. */
  readonly dateModes = computed(() => QB_DATE_MODES.map(o => ({ ...o, display: this.#i18n.t(o.labelKey) })));
  /** Stable option list for the literal-vs-field operand select. */
  readonly valueSourceOptions = computed(() => QB_VALUE_SOURCE_OPTIONS.map(o => ({ ...o, display: this.#i18n.t(o.labelKey) })));
  /** Stable combined unit×direction option list for the relative select. */
  readonly relativeUnitOptions = computed(() => QB_RELATIVE_UNIT_OPTIONS.map(o => ({ ...o, display: this.#i18n.t(o.labelKey) })));

  // Nhãn i18n tĩnh của template (placeholder / title / aria-label / trạng thái rỗng).
  readonly selectFieldLabel = computed(() => this.#i18n.t('core.component.query-builder.select-field'));
  readonly valueLabel = computed(() => this.#i18n.t('core.component.query-builder.value'));
  readonly fromLabel = computed(() => this.#i18n.t('core.component.query-builder.from'));
  readonly toLabel = computed(() => this.#i18n.t('core.component.query-builder.to'));
  readonly addLabel = computed(() => this.#i18n.t('core.component.query-builder.add'));
  readonly addNodeLabel = computed(() => this.#i18n.t('core.component.query-builder.add-node'));
  readonly conditionLabel = computed(() => this.#i18n.t('core.component.query-builder.condition'));
  readonly groupLabel = computed(() => this.#i18n.t('core.component.query-builder.group'));
  readonly removeGroupLabel = computed(() => this.#i18n.t('core.component.query-builder.remove-group'));
  readonly removeConditionLabel = computed(() => this.#i18n.t('core.component.query-builder.remove-condition'));
  readonly emptyLabel = computed(() => this.#i18n.t('core.component.query-builder.empty'));

  readonly #compareFieldsByKey = computed<Map<string, SdQueryBuilderField[]>>(() => {
    const fields = this.resolvedFields();
    const map = new Map<string, SdQueryBuilderField[]>();

    for (const left of fields) {
      if (left.allowFieldCompare === false) {
        map.set(left.key, QB_EMPTY_FIELDS);
        continue;
      }

      map.set(
        left.key,
        fields.filter(right => {
          if (right.key === left.key) return false;
          if (right.allowFieldCompare === false) return false;
          if (right.type !== left.type) return false;
          if ((left.compareGroup ?? right.compareGroup) !== undefined && left.compareGroup !== right.compareGroup) return false;
          return true;
        })
      );
    }

    return map;
  });

  /**
   * Translator handed to the serializer.
   * why: `filterToTokens` là hàm thuần cấp module, không inject được. Truyền hàm dịch vào để chuỗi
   * view-mode ("hôm nay", "3 ngày trước", "Có"/"Không") không còn hardcode tiếng Việt. Trường ổn
   * định (không tạo mới mỗi lần gọi) để `computed` bên dưới không phụ thuộc tham chiếu mới.
   */
  readonly #translate = (key: string, params?: Record<string, string | number>): string => this.#i18n.t(key, params);

  /** View-mode token stream — recomputed from the emitted value (and from the active language). */
  readonly tokens = computed<QbToken[]>(() => filterToTokens(this.option()?.value ?? this.value(), this.resolvedFields(), this.#translate));

  readonly isView = computed(() => this.resolvedMode() === 'view');

  /** Expose the type-guard to the template. */
  readonly isGroup = isQbGroup;

  /** Resolve the leading icon for a field (own `icon` → per-type → `'tune'`) — used by the field picker. */
  readonly fieldIcon = qbFieldIcon;

  constructor() {
    // Inbound seeding: an EXTERNAL write to value / filters rebuilds the tree.
    // Our own emits are recognised via #lastEmitted and skipped (no echo loop).
    effect(() => {
      const option = this.option();
      const v = option?.value ?? this.value();
      const fl = option?.filters ?? this.filters();
      const incoming = this.#coalesce(v, fl, option?.rootLogic);
      if (this.#filterEq(incoming, this.#lastEmitted)) return;
      this.#tree.set(filterToTree(incoming));
      this.#commit();
    });
  }

  #coalesce(v: Filter | null, fl: Filter[], logic?: 'AND' | 'OR'): Filter | null {
    if (v) return v;
    if (fl && fl.length) return { operator: logic ?? untracked(() => this.rootLogic()), data: fl } as Filter;
    return null;
  }

  #filterEq(a: Filter | null | undefined, b: Filter | null | undefined): boolean {
    return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  }

  // -------------------------------------------------------------------------
  // Tree mutation → emit
  // -------------------------------------------------------------------------

  /** New root ref so the template (which reads `tree()`) re-renders. */
  #bumpTree(): void {
    this.#tree.set({ ...this.#tree() });
  }

  /** Recompute the output `Filter` from the tree and push it to value / filters / rootLogic. */
  #commit(): void {
    const filter = treeToFilter(this.#tree());
    this.#lastEmitted = filter;
    this.value.set(filter);
    const filters = isAndOr(filter) ? (filter as any).data : filter ? [filter] : [];
    this.filters.set(filters);
    const logic = this.#tree().logic;
    if (this.rootLogic() !== logic) this.rootLogic.set(logic);
    this.option()?.onValueChange?.(filter);
    this.option()?.onFiltersChange?.(filters);
    this.option()?.onRootLogicChange?.(logic);
  }

  /** Mutate-in-place + re-render + emit. */
  #apply(): void {
    this.#bumpTree();
    this.#commit();
  }

  // -------------------------------------------------------------------------
  // Group / rule structural mutations
  // -------------------------------------------------------------------------

  /** Switch a group's AND/OR connector and re-emit. No-op when disabled or unchanged. */
  setGroupLogic(group: QbGroup, logic: 'AND' | 'OR'): void {
    if (this.resolvedDisabled() || group.logic === logic) return;
    group.logic = logic;
    this.#apply();
  }

  /** Open this group's "+" menu (closing any other open one). UI-only — does not emit. */
  toggleDropdown(group: QbGroup, event: Event): void {
    if (this.resolvedDisabled()) return;
    event.stopPropagation();
    const willOpen = !group.open;
    this.#closeAllDropdowns(this.#tree());
    group.open = willOpen;
    this.#bumpTree(); // UI-only — no emit
  }

  closeAllDropdowns(): void {
    if (!this.#hasOpenDropdown(this.#tree())) return; // avoid a re-render on every container click
    this.#closeAllDropdowns(this.#tree());
    this.#bumpTree();
  }

  #hasOpenDropdown(node: QbNode): boolean {
    if (!isQbGroup(node)) return false;
    return node.open === true || node.children.some(c => this.#hasOpenDropdown(c));
  }

  #closeAllDropdowns(node: QbNode): void {
    if (isQbGroup(node)) {
      node.open = false;
      node.children.forEach(c => this.#closeAllDropdowns(c));
    }
  }

  /** Append a blank rule to `group`. */
  addRule(group: QbGroup): void {
    if (this.resolvedDisabled()) return;
    group.children.push(qbNewRule());
    group.open = false;
    this.#apply();
  }

  /** Append a nested sub-group (seeded with one blank rule) to `group`. */
  addGroup(group: QbGroup): void {
    if (this.resolvedDisabled()) return;
    group.children.push(qbNewGroup('AND', [qbNewRule()]));
    group.open = false;
    this.#apply();
  }

  /** Remove the child at `index` from `parent` (a rule or a whole sub-group). */
  removeNode(parent: QbGroup, index: number): void {
    if (this.resolvedDisabled()) return;
    parent.children.splice(index, 1);
    this.#apply();
  }

  // -------------------------------------------------------------------------
  // Rule field / operator / value mutations
  // -------------------------------------------------------------------------

  /**
   * Point `rule` at a new field. Resets operator to the field's default and the value
   * to that operator's empty shape — the old operator/value rarely fit the new type.
   *
   * @param rule - the rule being edited.
   * @param key - the chosen field key (from the field picker). Swap-only: a null / undefined
   *   key is a no-op — the field can be changed but never cleared (issue #2).
   */
  setField(rule: QbRule, key: any): void {
    if (this.resolvedDisabled()) return;
    if (key == null) return; // swap-only: never clear the field (issue #2)
    rule.field = key;
    const field = this.fieldByKey()[rule.field as string];
    const op = qbDefaultOperator(field);
    rule.operator = op;
    rule.value = this.#defaultValueFor(op);
    this.#useLiteralSource(rule);
    this.#apply();
  }

  /** Change `rule`'s operator and reshape its value to fit the new operator (array / range / none). */
  setOperator(rule: QbRule, op: Operator | undefined): void {
    if (this.resolvedDisabled()) return;
    rule.operator = op;
    if (rule.valueSource === 'field' && this.canCompareWithField(rule)) {
      rule.value = null;
      if (!this.#isCompareFieldAllowed(rule, rule.compareField)) rule.compareField = undefined;
    } else {
      rule.value = this.#reshapeValue(op, rule.value);
      this.#useLiteralSource(rule);
    }
    this.#apply();
  }

  /** Set a single-value rule's value (coercing numeric fields to `number`). */
  setScalar(rule: QbRule, raw: any): void {
    if (this.resolvedDisabled()) return;
    this.#useLiteralSource(rule);
    rule.value = this.#coerce(rule, raw);
    this.#apply();
  }

  /** Set the lower bound of a BETWEEN rule's `{ from, to }` value. */
  setBetweenFrom(rule: QbRule, raw: any): void {
    if (this.resolvedDisabled()) return;
    this.#useLiteralSource(rule);
    rule.value = { ...(rule.value ?? {}), from: this.#coerce(rule, raw) };
    this.#apply();
  }

  /** Set the upper bound of a BETWEEN rule's `{ from, to }` value. */
  setBetweenTo(rule: QbRule, raw: any): void {
    if (this.resolvedDisabled()) return;
    this.#useLiteralSource(rule);
    rule.value = { ...(rule.value ?? {}), to: this.#coerce(rule, raw) };
    this.#apply();
  }

  setValueSource(rule: QbRule, source: unknown): void {
    if (this.resolvedDisabled()) return;
    if (source === 'field' && this.resolvedComparisonMode() === 'value-or-field' && this.canCompareWithField(rule)) {
      rule.valueSource = 'field';
      rule.value = null;
      if (!this.#isCompareFieldAllowed(rule, rule.compareField)) rule.compareField = undefined;
    } else {
      this.#useLiteralSource(rule);
      rule.value = this.#defaultValueFor(rule.operator);
    }
    this.#apply();
  }

  setCompareField(rule: QbRule, key: any): void {
    if (this.resolvedDisabled()) return;
    if (!this.#isCompareFieldAllowed(rule, key)) return;
    rule.valueSource = 'field';
    rule.compareField = key;
    rule.value = null;
    this.#apply();
  }

  /** Coerce numeric fields to `number` so the emitted Filter carries a real number. */
  #coerce(rule: QbRule, raw: any): any {
    const field = this.fieldByKey()[rule.field as string];
    if (field?.type === 'number' && raw !== null && raw !== undefined && raw !== '') {
      const n = Number(raw);
      return Number.isNaN(n) ? raw : n;
    }
    return raw;
  }

  #defaultValueFor(op: Operator | undefined): any {
    if (qbIsMultiOperator(op)) return [];
    if (op === 'BETWEEN') return { from: null, to: null };
    return null;
  }

  #reshapeValue(op: Operator | undefined, current: any): any {
    if (qbIsNoDataOperator(op)) return null;
    if (qbIsMultiOperator(op)) return Array.isArray(current) ? current : current == null ? [] : [current];
    if (op === 'BETWEEN') {
      // a relative spec / 'TODAY' can't be a BETWEEN endpoint — reset to a fresh range
      return current && typeof current === 'object' && !Array.isArray(current) && !qbIsRelativeDate(current)
        ? current
        : { from: null, to: null };
    }
    // single value — keep a relative spec or the 'TODAY' sentinel; else drop array/range remnants
    if (qbIsToday(current) || qbIsRelativeDate(current)) return current;
    return Array.isArray(current) || (current && typeof current === 'object') ? null : current;
  }

  #useLiteralSource(rule: QbRule): void {
    rule.valueSource = 'literal';
    rule.compareField = undefined;
  }

  #isCompareFieldAllowed(rule: QbRule, key: any): boolean {
    return !!key && this.compareFields(rule).some(f => f.key === key);
  }

  // -------------------------------------------------------------------------
  // Template helpers
  // -------------------------------------------------------------------------

  /** The field metadata for a rule's current `field` key (or undefined if unset). */
  fieldOf(rule: QbRule): SdQueryBuilderField | undefined {
    return rule.field ? this.fieldByKey()[rule.field] : undefined;
  }

  /** Operators allowed for a rule, derived from its field's type / override. */
  allowedOperators(rule: QbRule): Operator[] {
    return qbAllowedOperators(this.fieldOf(rule));
  }

  /** Whether to render the operator picker — hidden when only one operator is allowed. */
  showOperatorSelector(rule: QbRule): boolean {
    return this.allowedOperators(rule).length > 1;
  }

  compareFields(rule: QbRule): SdQueryBuilderField[] {
    const field = this.fieldOf(rule);
    if (!field) return QB_EMPTY_FIELDS;
    return this.#compareFieldsByKey().get(field.key) ?? QB_EMPTY_FIELDS;
  }

  canCompareWithField(rule: QbRule): boolean {
    return qbSupportsFieldCompareOperator(rule.operator) && this.compareFields(rule).length > 0;
  }

  showValueSourceSelector(rule: QbRule): boolean {
    return this.canCompareWithField(rule) && (this.resolvedComparisonMode() === 'value-or-field' || rule.valueSource === 'field');
  }

  valueSourceOf(rule: QbRule): QbValueSource {
    return rule.valueSource === 'field' && this.canCompareWithField(rule) ? 'field' : 'literal';
  }

  isFieldSource(rule: QbRule): boolean {
    return this.valueSourceOf(rule) === 'field';
  }

  /** True for NULL / NOT_NULL — the template then renders no value editor. */
  isNoData(op: Operator | undefined): boolean {
    return qbIsNoDataOperator(op);
  }

  /** True for IN / NOT_IN — the template then renders a multi-select value editor. */
  isMulti(op: Operator | undefined): boolean {
    return qbIsMultiOperator(op);
  }

  /** `[true/false]` option list for a boolean field's value select (stable reference). */
  booleanItems(field: SdQueryBuilderField): SdQueryBuilderFieldOption[] {
    return this.#booleanOptionsByKey().get(field.key) ?? QB_EMPTY_OPTIONS;
  }

  /**
   * Option list cho field `type:'values'`.
   *
   * why: template cũ bind thẳng `[items]="fieldOf(rule)!.values || []"`. `values` là OPTIONAL trên
   * `SdQueryBuilderField`, nên với field khai thiếu `values`, nhánh `|| []` cấp phát một mảng MỚI
   * mỗi lần change detection chạy — đúng nguyên nhân OOM đã ghi ở `#booleanOptionsByKey`:
   * `sd-select` có `toObservable(items)` → `markForCheck()` → CD mới → mảng mới → lặp vô hạn.
   *
   * why: KHÔNG memo hoá qua `computed<Map>` snapshot. `field.values` vốn ĐÃ là mảng của consumer
   * nên tự nó ổn định; snapshot vào Map chỉ thêm một tầng cache không bao giờ invalidate khi
   * consumer nạp option bất đồng bộ bằng cách gán tại chỗ (`fields[0].values = loaded`) — reference
   * `fields` không đổi nên `computed` giữ nguyên list cũ vĩnh viễn. Chỉ nhánh RỖNG cần hằng số
   * dùng chung để tránh literal mới mỗi CD.
   */
  valueItems(field: SdQueryBuilderField): SdQueryBuilderFieldOption[] {
    return field.values?.length ? field.values : QB_EMPTY_OPTIONS;
  }

  /** Current date-value mode of a rule, derived from its value (no separate state). */
  dateMode(rule: QbRule): QbDateMode {
    const v = rule.value;
    if (qbIsToday(v)) return 'now';
    if (qbIsRelativeDate(v)) return 'relative';
    return 'absolute';
  }

  /** Switch a date/datetime rule's value mode, reseeding the value for the new mode. */
  setDateMode(rule: QbRule, mode: unknown): void {
    if (this.resolvedDisabled()) return;
    this.#useLiteralSource(rule);
    if (mode === 'now') rule.value = QB_TODAY;
    else if (mode === 'relative') rule.value = qbDefaultRelative();
    else rule.value = null; // absolute — pick a concrete date
    this.#apply();
  }

  /** Read the offset amount of a relative rule (default 1). */
  relativeAmount(rule: QbRule): number {
    const v = rule.value;
    return qbIsRelativeDate(v) ? (v.amount ?? 1) : 1;
  }

  /** Set the offset amount (clamped to an integer >= 1). */
  setRelativeAmount(rule: QbRule, raw: any): void {
    if (this.resolvedDisabled()) return;
    this.#useLiteralSource(rule);
    const n = Math.floor(Number(raw));
    const amount = Number.isNaN(n) || n < 1 ? 1 : n;
    const cur = qbIsRelativeDate(rule.value) ? rule.value : qbDefaultRelative();
    rule.value = { amount, direction: cur.direction, unit: cur.unit } satisfies DateRelative;
    this.#apply();
  }

  /** Read the `'unit:direction'` token of a relative rule (default `'day:previous'`). */
  relativeUnitDirValue(rule: QbRule): string {
    const v = rule.value;
    if (qbIsRelativeDate(v)) return `${v.unit}:${v.direction}`;
    return 'day:previous';
  }

  /** Set the offset unit + direction from a `'unit:direction'` token. */
  setRelativeUnitDir(rule: QbRule, token: unknown): void {
    if (this.resolvedDisabled()) return;
    this.#useLiteralSource(rule);
    const normalizedToken = typeof token === 'string' ? token : 'day:previous';
    const [unit, direction] = normalizedToken.split(':') as [DateRelative['unit'], DateRelative['direction']];
    const cur = qbIsRelativeDate(rule.value) ? rule.value : qbDefaultRelative();
    rule.value = { amount: cur.amount, direction, unit } satisfies DateRelative;
    this.#apply();
  }

  /** Build a `data-autoid` for an inner control under this builder's `autoId` prefix. */
  autoIdFor(suffix: string): string {
    return `${this.resolvedAutoId() ?? 'qb'}-${suffix}`;
  }
}
