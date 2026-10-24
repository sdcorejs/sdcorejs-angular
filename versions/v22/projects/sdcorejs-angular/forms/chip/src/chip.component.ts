import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import {
  afterRenderEffect,
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  contentChild,
  effect,
  inject,
  input,
  isDevMode,
  model,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  viewChildren,
  OnDestroy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Utilities } from '@sdcorejs/utils/fns';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipGrid, MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { ErrorStateMatcher } from '@angular/material/core';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdLabelDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import {
  SdFormControl,
  sdFormControlState,
  SdViewed,
  SdViewedInput,
  sdViewedInline,
  sdViewedTransform,
  ɵsdFormControlConnector,
  ɵsdTimerScope,
} from '@sdcorejs/angular/forms/models';
import type { SdLabelPlacement } from '@sdcorejs/angular/forms/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import { sdIsEmpty, sdSerializeDataValue } from '@sdcorejs/angular/utilities/data-state';
import { Size } from '@sdcorejs/utils/models';
import { Subscription } from 'rxjs';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

/** Items that never become a chip; `0` and `false` still do (A2). */
const isChipItem = (item: unknown): boolean => item !== null && item !== undefined && item !== '';

/** Keys that commit the typed text by default (`KeyboardEvent.key`). */
const DEFAULT_SEPARATORS: readonly string[] = ['Enter', ','];
/** Default `chipTransform`: the text without surrounding spaces. */
const trimChip = (raw: string): string => raw.trim();
/** Character a separator key stands for in pasted text; key names other than Enter / Tab have none. */
const separatorChar = (key: string): string | null => (key === 'Enter' ? '\n' : key === 'Tab' ? '\t' : key.length === 1 ? key : null);
/** Duplicate highlight (B3), the same 1.4s as the review. */
const DUPLICATE_FLASH_MS = 1400;

@Component({
  selector: 'sd-chip',
  templateUrl: './chip.component.html',
  styleUrl: './chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  host: {
    '[class.sd-has-label]': '!!label()',
    '[class.sd-viewed]': 'isViewed()',
    '[class.sd-label-top]': "labelPlacement() === 'top'",
    '(focusin)': 'onFocusIn($event)',
    '(focusout)': 'onFocusOut($event)',
  },
  imports: [
    SdIcon,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    SdLabel,
    SdView,
  ],
})
export class SdChip implements AfterViewInit, OnDestroy {
  #ref = inject(ChangeDetectorRef);
  readonly #i18n = inject(I18nService);
  // why: lỗi phải hiện khi form cha đã submit dù field chưa chạm (A5). NgForm / FormGroupDirective tổ tiên
  // giữ cờ `submitted`; MatInput cũng lấy đúng hai directive này cho ErrorStateMatcher.
  readonly #parentForm = inject(FormGroupDirective, { optional: true }) ?? inject(NgForm, { optional: true });
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** why: id ổn định của lỗi (`<mat-error>` hoặc chữ ẩn của `hideInlineError`) để ô nhập trỏ `aria-describedby` sang (A8). */
  readonly errorId = `sd-chip-error-${Utilities.generateUuid()}`;
  // why: blur hoãn 150ms rồi gọi #ref.detectChanges(). Gỡ chip / đổi route trong 150ms đó là
  // đủ để detectChanges() chạy trên view đã destroy → ViewDestroyedError. Scope handle theo
  // DestroyRef để timer bị clear cùng lúc view tháo.
  readonly #timers = ɵsdTimerScope();
  #subscription = new Subscription();
  #name = Utilities.generateUuid();

  // Signals - inputs (accept null|undefined at boundary, transform to canonical)
  autoIdInput = input<string | undefined, string | null | undefined>(undefined, {
    alias: 'autoId',
    transform: (v): string | undefined => v ?? undefined,
  });
  autoId = computed(() => (this.autoIdInput() ? `forms-chip-${this.autoIdInput()}` : undefined));
  readonly #state = sdFormControlState(computed(() => this.formControl));
  readonly dataDisabled = computed(() => (this.#state().disabled ? 'true' : 'false'));
  readonly dataEmpty = computed(() => (sdIsEmpty(this.#state().value) ? 'true' : 'false'));
  readonly dataValue = computed(() => sdSerializeDataValue(this.#state().value));
  readonly dataCount = computed(() => {
    const v = this.#state().value;
    return String(Array.isArray(v) ? v.length : 0);
  });

  readonly dataRequired = computed(() => (this.required() ? 'true' : 'false'));
  readonly dataErrorMessage = computed(() => {
    void this.#state();
    const msg = this.errorMessage();
    return msg && msg.length > 0 ? msg : null;
  });
  name = input<string | undefined, string | null | undefined>(undefined, {
    transform: (v): string | undefined => v ?? undefined,
  });
  appearance = input<MatFormFieldAppearance, MatFormFieldAppearance | null | undefined>('outline', {
    transform: (v): MatFormFieldAppearance => v || 'outline',
  });
  /**
   * `'float'` (mặc định) hoặc `'top'` — nhãn `<label for>` tĩnh phía trên ô nhập chip.
   * why: ô nhập chip là `<input matInput>` thật nên nhãn rời gắn `for` vào đó (`inputId`).
   */
  labelPlacement = input<SdLabelPlacement>('float');
  /**
   * id ổn định của ô nhập chip — nhãn rời trỏ `for` sang, và `mat-chip-grid` dùng nó làm id cho
   * `<mat-label>` ở chế độ nổi. why: luôn gán (kể cả `'float'`): `[id]="null"` sẽ ghi đè id mặc định
   * của `MatChipInput` thành chuỗi `"null"` và làm mất liên kết nhãn.
   */
  readonly inputId = `I${Utilities.generateUuid()}`;
  floatLabel = input<FloatLabelType, FloatLabelType | null | undefined>('auto', {
    transform: (v): FloatLabelType => v || 'auto',
  });
  size = input<Size, Size | null | undefined>('md', {
    transform: (v): Size => v || 'md',
  });
  // why: parent may bind NgForm (template-driven), FormGroup (reactive), or a wrapper with `.form`.
  // Transform once at the input boundary so the rest of the component only deals with FormGroup.
  form = input<FormGroup | undefined, any>(undefined, {
    transform: (val: any): FormGroup | undefined => {
      if (!val) return undefined;
      if (val instanceof NgForm) return val.form;
      if (val instanceof FormGroup) return val;
      if (val?.form instanceof FormGroup) return val.form;
      return undefined;
    },
  });
  label = input<string, string | null | undefined>('', {
    transform: (v): string => v ?? '',
  });
  placeholder = input<string | undefined, string | null | undefined>(undefined, {
    transform: (v): string | undefined => v ?? undefined,
  });
  removable = input<boolean | ((item: any) => boolean), boolean | ((item: any) => boolean) | null | undefined>(true, {
    transform: (v): boolean | ((item: any) => boolean) => v ?? true,
  });
  hideInlineError = input(false, { transform: booleanAttribute });
  required = input(false, { transform: booleanAttribute });
  /** Fewest chips; > 0 adds `Validators.minLength`. Replaces `min`. */
  minCount = input<number | undefined, number | null | undefined>(undefined, {
    transform: (v): number | undefined => v ?? undefined,
  });
  /** Most chips; > 0 adds `Validators.maxLength` (for a model set from outside) and stops adding once reached. Replaces `max`. */
  maxCount = input<number | undefined, number | null | undefined>(undefined, {
    transform: (v): number | undefined => v ?? undefined,
  });
  /** @deprecated Use `minCount`; `minCount` wins when both are set. */
  min = input<number, number | null | undefined>(0, {
    transform: (v): number => v ?? 0,
  });
  /** @deprecated Use `maxCount`; `maxCount` wins when both are set. */
  max = input<number, number | null | undefined>(0, {
    transform: (v): number => v ?? 0,
  });
  /** `false` keeps the field read-only for typing: the input stays (mat-chip-grid needs it) but is read-only and out of the Tab order. */
  addable = input(true, { transform: booleanAttribute });
  /** Leaving the field turns the typed text into a chip. `false` drops the text instead, as before. */
  addOnBlur = input(true, { transform: booleanAttribute });
  /** Keys that commit the typed text (`KeyboardEvent.key`). A paste also splits on these characters, new lines and tabs. */
  separators = input<readonly string[], readonly string[] | null | undefined>(DEFAULT_SEPARATORS, {
    transform: (v): readonly string[] => v ?? DEFAULT_SEPARATORS,
  });
  /** Normalises typed or pasted text before it is compared and stored; `null` or `''` drops it. Default: trim. */
  chipTransform = input<(raw: string) => string | number | null, ((raw: string) => string | number | null) | null | undefined>(trimChip, {
    transform: (v): ((raw: string) => string | number | null) => v ?? trimChip,
  });
  /**
   * Checks a normalised value: an i18n key (or the message itself) when it is refused, else `null`. A refused value does
   * not become a chip; its text stays in the input and the message shows under the field.
   */
  chipValidator = input<((value: string | number) => string | null) | null | undefined>(null);
  /** Shows a button that removes every chip `removable` allows. Off by default, like `clearable` of `<sd-date>`. */
  clearable = input(false, { transform: booleanAttribute });
  /** Chips shown while the field is not focused; the rest fold into “+N”. `null` shows them all. `2` suits `<sd-table>` cells. */
  maxVisible = input<number | null | undefined>(null);
  disabled = input(false, { transform: booleanAttribute });
  /** Display mode: `false` edit · `true` static view · `'inline'` interactive (disabled `'inline'` → static). */
  viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });

  // why: tri-state viewed — `'inline'` keeps the chip interactive; disabled `'inline'` falls back to static.
  readonly #viewedState = sdViewedInline(this.viewed, undefined, this.disabled);
  /** `true` when the static view should render (`viewed===true`, or disabled `'inline'`). */
  readonly isViewed = this.#viewedState.isViewed;
  hyperlink = input<string | undefined, string | null | undefined>(undefined, {
    transform: (v): string | undefined => v ?? undefined,
  });

  // Two-way model
  model = model<(string | number)[] | undefined>(undefined);

  // Signals - outputs (modelChange auto-generated by model() signal)
  sdChange = output<any[]>();

  // Template properties
  input = viewChild<ElementRef<HTMLInputElement>>('input');
  readonly chipGrid = viewChild(MatChipGrid);
  // why: query signal không đặt được trên field ES private (#).
  private readonly chipTextElements = viewChildren<ElementRef<HTMLElement>>('chipTextEl');
  sdViewDef = contentChild(SdViewDefDirective);
  sdLabelDef = contentChild(SdLabelDefDirective);
  sdLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');
  sdValueTemplate = contentChild<TemplateRef<any>>('sdValue');

  // Local states
  #isBlurring = false;
  isFocused = false;
  #inputControl = new FormControl();
  #formControl = new SdFormControl();
  /**
   * Control of `mat-chip-grid` only. why: the grid is a ControlValueAccessor that writes the text of the rendered chips
   * into its control on blur, after a timeout (numbers became strings, a form reset was undone). It still needs an
   * ngControl to work out its error state on every check, so it gets this one; nothing reads its value.
   */
  readonly gridControl = new FormControl<unknown>(null);
  // why: `min`/`max` chỉ là validator do CHÍNH component sở hữu; `required` đi qua option riêng
  // của connector. Connector add/remove đúng phần này (addValidators/removeValidators) nên
  // validator do consumer tự gắn vào `formControl` public KHÔNG bị xoá — trước đây
  // `clearValidators()` + `setValidators()` thổi bay tất cả mỗi lần input đổi.
  /** `minCount`, else the deprecated `min`. */
  readonly effectiveMinCount = computed(() => this.minCount() ?? this.min() ?? 0);
  /** `maxCount`, else the deprecated `max`. */
  readonly effectiveMaxCount = computed(() => this.maxCount() ?? this.max() ?? 0);
  readonly #validators = computed<readonly ValidatorFn[]>(() => {
    const validators: ValidatorFn[] = [];
    const min = this.effectiveMinCount();
    const max = this.effectiveMaxCount();
    if (min > 0) validators.push(Validators.minLength(min));
    if (max > 0) validators.push(Validators.maxLength(max));
    return validators;
  });
  readonly #formConnector = ɵsdFormControlConnector<unknown, unknown>({
    form: this.form,
    name: computed(() => this.name() || this.#name),
    control: computed(() => this.#formControl),
    validators: this.#validators,
    required: this.required,
  });
  #matcher!: ErrorStateMatcher;
  readonly separatorKeysCodes = [ENTER, COMMA];
  /** why: phím tách do `separators` + onInputKeydown xử lý, nên Material không nhận phím nào. */
  readonly noSeparatorKeys: number[] = [];
  readonly selectable = true;

  /**
   * Items rendered as chips: every value except `null`, `undefined` and `''`, so `0` shows (A2). Display only: the
   * model is never rewritten. why: exact duplicates are dropped too, because the chips are tracked by value.
   */
  readonly chips = computed<(string | number)[]>(() => {
    const value = this.#state().value;
    return Array.isArray(value) ? [...new Set<string | number>(value.filter(isChipItem))] : [];
  });

  /** Focus is in the input or on a chip; “+N” only folds chips while it is not (B7). */
  readonly #focusWithin = signal(false);
  /** Message of a typed or pasted value that `chipValidator` refused; it shows under the field until the text changes (B4). */
  readonly inputError = signal<string | null>(null);
  /** Last polite announcement; a new id re-renders the text so a repeated message is read again. */
  readonly liveMessage = signal<{ id: number; text: string } | null>(null);
  #liveId = 0;
  /** Chip that the typed value duplicates, highlighted for 1.4s (B3). */
  readonly duplicateChip = signal<string | number | null>(null);
  /** Text of the chips that the 240px limit cuts; only they get a tooltip (B7). */
  readonly truncatedChips = signal<ReadonlySet<string>>(new Set());
  #warnedDeprecated = false;

  /** `maxCount` reached: typing and pasting add nothing more (B3). */
  readonly full = computed(() => {
    const max = this.effectiveMaxCount();
    return max > 0 && this.chips().length >= max;
  });
  /** Chips on screen: all while the field has focus, else at most `maxVisible` (B7). */
  readonly visibleChips = computed(() => {
    const chips = this.chips();
    const max = this.maxVisible();
    if (this.#focusWithin() || max === null || max === undefined || max < 0 || chips.length <= max) return chips;
    return chips.slice(0, max);
  });
  /** Chips folded into “+N”. */
  readonly hiddenCount = computed(() => this.chips().length - this.visibleChips().length);
  /** At least one chip may be removed, so the clear button has something to do (B6). */
  readonly hasRemovable = computed(() => {
    void this.removable();
    return this.chips().some(chip => this.isRemovable(chip));
  });
  /** Placeholder: “Đã đủ …” once full, else the input, else “Nhập rồi nhấn Enter” — never the label (B5). None when not addable. */
  readonly effectivePlaceholder = computed<string | null>(() => {
    if (!this.addable()) return null;
    if (this.full()) return this.#i18n.t('core.form.chip.full', { max: this.effectiveMaxCount() });
    return this.placeholder() || this.#i18n.t('core.form.chip.placeholder');
  });
  readonly clearLabel = computed(() => this.#i18n.t('core.form.chip.clear'));
  readonly moreLabel = computed(() => this.#i18n.t('core.form.chip.more', { count: this.hiddenCount() }));

  constructor() {
    // Update model
    effect(() => {
      const values = this.model();
      // why: `null` / `undefined` từ cha phải xoá chip và đưa control về `[]`; trước đây control giữ mảng cũ và
      // vẫn gửi nó đi khi submit (A4).
      this.#formControl.setValue(Array.isArray(values) ? values : []);
    });

    // Handle disabled state
    effect(() => {
      const isDisabled = this.disabled();
      if (isDisabled) {
        this.#formControl.disable();
        this.#inputControl.disable();
        this.gridControl.disable();
      } else {
        this.#formControl.enable();
        this.#inputControl.enable();
        this.gridControl.enable();
      }
    });

    effect(() => {
      const nameVal = this.name();
      if (nameVal) {
        this.#name = nameVal;
      }
    });

    // why: `[required]` trên mat-chip-grid khớp selector `[required][formControl]` của RequiredValidator, nên
    // `gridControl` sẽ invalid khi rỗng và MatChipInput gắn aria-invalid="true" lúc field chưa chạm. Gán thẳng thuộc
    // tính của grid: mat-form-field vẫn hiện dấu * và ô nhập vẫn có aria-required.
    effect(() => {
      const grid = this.chipGrid();
      if (grid) grid.required = this.required();
    });

    effect(() => {
      if ((this.min() > 0 || this.max() > 0) && !this.#warnedDeprecated && isDevMode()) {
        this.#warnedDeprecated = true;
        console.warn('[sd-chip] `min` / `max` are deprecated; use `minCount` / `maxCount`.');
      }
    });

    // why: chữ chip dừng ở 240px rồi cắt "…" (B7); chỉ chip thật sự bị cắt mới cần tooltip, và chỉ đo được sau khi vẽ.
    afterRenderEffect(() => {
      const cut = new Set<string>();
      for (const { nativeElement } of this.chipTextElements()) {
        if (nativeElement.scrollWidth > nativeElement.clientWidth) cut.add(nativeElement.dataset['chip'] ?? '');
      }
      const current = untracked(this.truncatedChips);
      if (cut.size !== current.size || [...cut].some(text => !current.has(text))) this.truncatedChips.set(cut);
    });

    // why: `submitted` của form cha không phải signal; submit phải vẽ lại lỗi dưới OnPush.
    this.#parentForm?.ngSubmit.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => this.#ref.markForCheck());

    this.#matcher = { isErrorState: (_control, form) => !!this.inputError() || this.#errorGate(form) };
  }

  get formControl() {
    return this.#formControl;
  }

  get inputControl() {
    return this.#inputControl;
  }

  // why: PHẢI đọc `required`/`min`/`max` VÔ ĐIỀU KIỆN ở đây. Connector cài/gỡ validator bằng
  // `updateValueAndValidity({ emitEvent: false })` → `formControl.errors` đổi mà KHÔNG phát event
  // nào → `#state` (sdFormControlState) không tick. Nếu computed chỉ phụ thuộc `#state` thì bật
  // `[required]` lúc RUNTIME sẽ giữ nguyên message cũ dưới OnPush: control invalid, viền đỏ, nhưng
  // KHÔNG có chữ. Đọc sớm (trước `if (!errors) return`) để dependency được ghi nhận cả khi control
  // đang hợp lệ — đọc trong nhánh `errors[...]` thì lần chạy "không lỗi" không đăng ký dependency.
  readonly errorMessage = computed<string | undefined>(() => {
    void this.#state();
    void this.required();
    const min = this.effectiveMinCount();
    const max = this.effectiveMaxCount();
    const errors = this.#formControl.errors;
    if (!errors) return undefined;

    if (errors['required']) return this.#i18n.t('core.form.chip.required');
    if (errors['minlength']) return this.#i18n.t('core.form.chip.minlength', { min });
    if (errors['maxlength']) return this.#i18n.t('core.form.chip.maxlength', { max });
    return undefined;
  });

  get matcher() {
    return this.#matcher;
  }

  /**
   * The one place that decides whether the error shows (A5): the `ErrorStateMatcher` of the chip grid and the input,
   * `<mat-error>`, the `hideInlineError` icon and `aria-invalid` all read it. Invalid and touched, or the parent form
   * was submitted; a field that is only dirty shows nothing.
   */
  isErrorShown(): boolean {
    return !!this.inputError() || (!!this.errorMessage() && this.#errorGate());
  }

  /** Text under the field: the `chipValidator` message of the typed value first, else the form error. */
  readonly errorText = computed(() => this.inputError() ?? this.errorMessage());

  #errorGate(form?: FormGroupDirective | NgForm | null): boolean {
    const control = this.#formControl;
    return control.invalid && (control.touched || !!(form ?? this.#parentForm)?.submitted);
  }

  /** Whether `item` may be removed, per `removable`; applied on every removal path (A1). */
  isRemovable(item: string | number): boolean {
    const removable = this.removable();
    return typeof removable === 'function' ? !!removable(item) : removable;
  }

  /** Accessible name of the ✕ button of a chip (A6). */
  removeLabel(item: string | number): string {
    return this.#i18n.t('core.form.chip.remove', { value: String(item) });
  }

  /** Text of a chip, also its key for `truncatedChips`. */
  chipText(item: string | number): string {
    return String(item);
  }

  /** A separator key (`separators`) commits the typed text; the key itself is not typed (B2 / separators). */
  onInputKeydown(event: KeyboardEvent): void {
    if (event.isComposing || !this.separators().includes(event.key)) return;
    event.preventDefault();
    this.#commitText(this.input()?.nativeElement.value ?? '');
  }

  /** The refused-value message goes as soon as the text changes (B4). */
  onInputText(): void {
    if (this.inputError()) this.inputError.set(null);
  }

  /**
   * A paste that holds a separator, a new line or a tab becomes several chips in one change (B2). Duplicates are
   * skipped, refused values and values past `maxCount` stay in the input, and the result is announced. A paste with
   * no separator is left to the browser.
   */
  onPaste(event: ClipboardEvent): void {
    if (!this.addable()) return;
    const text = event.clipboardData?.getData('text') ?? '';
    const chars = new Set(['\n', '\r', '\t']);
    for (const key of this.separators()) {
      const char = separatorChar(key);
      if (char) chars.add(char);
    }
    const parts = text.split(new RegExp(`[${[...chars].map(char => char.replace(/[\\\]^-]/g, '\\$&')).join('')}]`));
    if (parts.length < 2) return;
    event.preventDefault();

    const next = [...this.#currentValues()];
    const max = this.effectiveMaxCount();
    const kept: string[] = [];
    let added = 0;
    let skipped = 0;
    let overflow = false;
    let error: string | null = null;
    for (const raw of parts) {
      const value = this.#normalise(raw);
      if (value === null) continue;
      if (next.some(item => String(item) === String(value))) {
        skipped++;
        continue;
      }
      const refused = this.#refusal(value);
      if (refused || (max > 0 && next.length >= max)) {
        if (refused) error ??= refused;
        else overflow = true;
        kept.push(raw.trim());
        continue;
      }
      next.push(value);
      added++;
    }
    if (added) this.#commit(next);
    this.#setInputText(kept.join(', '));
    this.inputError.set(error);
    const notes = [this.#i18n.t('core.form.chip.added', { count: added })];
    if (skipped) notes.push(this.#i18n.t('core.form.chip.skipped', { count: skipped }));
    if (overflow) notes.push(this.#i18n.t('core.form.chip.full', { max }));
    this.#announce(notes.join(' · '));
  }

  /** Backspace / Delete on a chip that `removable` keeps says why nothing happened (A1, B3). */
  onChipKeydown(event: KeyboardEvent, item: string | number): void {
    if ((event.key === 'Backspace' || event.key === 'Delete') && !this.isRemovable(item)) {
      this.#announce(this.#i18n.t('core.form.chip.locked'));
    }
  }

  /** “+N” moves focus to the input, where every chip shows (B7). */
  onMoreClick(event: Event): void {
    event.stopPropagation();
    this.#focus();
  }

  /** Focus entering the input or a chip unfolds “+N”; focus on the “+N” button itself does not (B7). */
  onFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.classList.contains('sd-chip__more')) return;
    this.#focusWithin.set(true);
  }

  /**
   * Marks the field touched once focus leaves it; moving between the input and the chips does not count.
   * why: `mat-chip-grid` is no longer bound to the control. As a ControlValueAccessor it wrote the text of the rendered
   * chips back into the control on blur (numbers became strings, a form reset was undone), so the component marks
   * touched itself, like the grid did.
   */
  onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.#host.contains(next)) return;
    this.#focusWithin.set(false);
    this.#formConnector.markAsTouched();
    this.#ref.markForCheck();
  }

  ngAfterViewInit() {
    this.#subscription.add(
      this.#formControl.sdChanges.subscribe(() => {
        this.#ref.markForCheck();
      })
    );
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }

  #add = (event: MatChipInputEvent): void => this.#commitText(event.value ?? '');

  /**
   * Typed text → chip (a separator key, blur, or `onAdd`): normalise, then a duplicate flashes the chip it repeats, a full
   * field says so, a refused value stays in the input with its message, and anything else is added in one change.
   */
  #commitText(raw: string): void {
    if (!this.addable()) return;
    const value = this.#normalise(String(raw));
    if (value === null) {
      this.#setInputText('');
      return;
    }
    const values = this.#currentValues();
    // why: so trùng theo chuỗi — model `[1]` và chữ "1" vừa gõ là một chip (A3).
    const existing = values.find(item => String(item) === String(value));
    if (existing !== undefined) {
      this.#flashDuplicate(existing);
      this.#announce(this.#i18n.t('core.form.chip.duplicate', { value: String(value) }));
      this.#setInputText('');
      return;
    }
    if (this.full()) {
      this.#announce(this.#i18n.t('core.form.chip.full', { max: this.effectiveMaxCount() }));
      return;
    }
    const refused = this.#refusal(value);
    if (refused) {
      this.inputError.set(refused);
      return;
    }
    // why: PHẢI tạo mảng MỚI. `values` chính là mảng của consumer (model đi thẳng vào formControl), nên `push` vừa sửa
    // trộm mảng của họ, vừa giữ nguyên reference — `model()` dùng equality Object.is nên `model.set(sameRef)` KHÔNG phát
    // `modelChange`, làm `[(model)]` lệch âm thầm.
    this.#commit([...values, value]);
    this.#setInputText('');
  }

  /** `chipTransform` of the text; `null`, `undefined` or `''` means nothing to add. */
  #normalise(raw: string): string | number | null {
    const value = this.chipTransform()(raw);
    return value === null || value === undefined || value === '' ? null : value;
  }

  /** Message of `chipValidator` for `value`, translated when it is a key, else `null`. */
  #refusal(value: string | number): string | null {
    const result = this.chipValidator()?.(value) ?? null;
    if (!result) return null;
    // why: I18nService.t trả lại chính chuỗi kèm cảnh báo khi không có key; app hay trả thẳng câu thông báo.
    return result in this.#i18n.messages() ? this.#i18n.t(result) : result;
  }

  #currentValues(): (string | number)[] {
    const value = this.#formControl.value;
    return Array.isArray(value) ? value : [];
  }

  /** Every user change ends here: one new array, written once to the control, the model and `sdChange`. */
  #commit(next: (string | number)[]): void {
    this.inputError.set(null);
    this.#formControl.setValue(next);
    this.model.set(next);
    this.sdChange.emit(next);
    this.#ref.markForCheck();
  }

  #setInputText(text: string): void {
    const inputEl = this.input();
    if (inputEl) inputEl.nativeElement.value = text;
    this.#inputControl.setValue(text);
  }

  #announce(text: string): void {
    this.liveMessage.set({ id: ++this.#liveId, text });
  }

  #flashDuplicate(item: string | number): void {
    this.duplicateChip.set(item);
    this.#timers.schedule(() => {
      if (this.duplicateChip() === item) this.duplicateChip.set(null);
    }, DUPLICATE_FLASH_MS);
  }

  #clickChip = ($event: Event, item: any) => {
    $event.stopPropagation();
    $event.stopImmediatePropagation();
    if (!this.#formControl.disabled) {
      this.#focus();
    }
  };

  #remove = (item: any): void => {
    const values: (string | number)[] = this.#formControl.value ?? [];
    // why: `removable` áp cho mọi đường xoá, kể cả Backspace / Delete trên chip mà Material vẫn phát `(removed)` (A1).
    if ((typeof item === 'string' || typeof item === 'number') && this.isRemovable(item)) {
      // why: `filter` đã trả mảng mới nên reference đổi → `model.set` phát `modelChange`.
      const next = values.filter(value => item !== value);
      this.#formControl.setValue(next);
      this.model.set(next);
      this.sdChange.emit(next);
    }
    this.#inputControl.setValue('');
    this.#focus();
  };

  #select = (event: MatAutocompleteSelectedEvent) => {
    const item = event.option.value;
    const values: (string | number)[] = this.#formControl.value ?? [];
    if (item) {
      if (typeof item === 'string' || typeof item === 'number') {
        if (!values.includes(item)) {
          // why: giống #add — mảng mới, không `push` lên mảng của consumer.
          const next = [...values, item];
          this.#formControl.setValue(next);
          this.model.set(next);
          this.sdChange.emit(next);
        }
      }
      const inputEl = this.input();
      if (inputEl) inputEl.nativeElement.value = '';
      this.#inputControl.setValue('', {
        emitEvent: false,
      });
    }
  };

  // why: focus không còn xoá chữ đang gõ (B1).
  #onFocus = () => {
    this.isFocused = true;
    this.#isBlurring = false;
  };

  #onBlur = () => {
    this.#isBlurring = true;
    // why: vẫn 150ms như cũ (cửa sổ để click vào chip/option huỷ blur) — chỉ scope handle theo DestroyRef. Chữ đang gõ
    // thành chip qua `matChipInputAddOnBlur`; chỉ khi `[addOnBlur]="false"` mới bỏ chữ như trước (B1).
    this.#timers.schedule(() => {
      if (this.#isBlurring) {
        this.isFocused = false;
        if (!this.addOnBlur()) this.#setInputText('');
        this.#ref.detectChanges();
      }
    }, 150);
  };

  #onClick = () => {
    if (this.sdViewDef()?.templateRef) {
      if (!this.#formControl.disabled && !this.isFocused) {
        this.#focus();
      }
    }
  };

  #focus = () => {
    this.isFocused = true;
    this.#isBlurring = false;
    // why: vẫn 100ms như cũ — chỉ scope handle theo DestroyRef.
    this.#timers.schedule(() => {
      if (this.isFocused) {
        this.input()?.nativeElement?.focus();
      }
    }, 100);
  };

  /** Removes every chip `removable` allows; locked chips stay. One change, none when nothing goes (B6). */
  #clear = ($event?: any) => {
    $event?.stopPropagation();
    this.#setInputText('');
    this.inputError.set(null);
    const values = this.#currentValues();
    const kept = values.filter(value => !this.isRemovable(value));
    if (kept.length !== values.length) this.#commit(kept);
    // why: nút vừa bấm ẩn đi (visibility) khi không còn chip nào bỏ được, nên focus trên nó sẽ mất; đưa về ô nhập.
    if ($event) this.#focus();
    this.#ref.markForCheck();
  };

  // Public method to expose private methods for template
  onAdd = (event: MatChipInputEvent) => this.#add(event);
  onClickChip = (event: Event, item: any) => this.#clickChip(event, item);
  onRemove = (item: any) => this.#remove(item);
  onSelect = (event: MatAutocompleteSelectedEvent) => this.#select(event);
  onFocus = () => this.#onFocus();
  onBlur = () => this.#onBlur();
  onClick = () => this.#onClick();
  /**
   * why: khi `sdViewDef` đang hiển thị thì bên trong không còn phần tử nào focus được, nên phần tử view là lối vào
   * duy nhất để chuyển sang chế độ sửa. Bàn phím phải mở được y hệt chuột → Enter/Space chạy chung handler;
   * preventDefault chặn Space cuộn trang (A7).
   */
  onViewKeydown = (event: Event) => {
    event.preventDefault();
    this.#onClick();
  };
  focus = () => this.#focus();
  onClear = ($event?: any) => this.#clear($event);
}
