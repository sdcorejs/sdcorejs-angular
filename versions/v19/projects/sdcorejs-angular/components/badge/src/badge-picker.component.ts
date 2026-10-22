import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  FloatLabelType,
  MatFormField,
  MatFormFieldAppearance,
  MatFormFieldControl,
  MatFormFieldModule,
} from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdView } from '@sdcorejs/angular/components/view';
import { ɵSdSearchField, ɵSdSearchFieldInputDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import {
  HandleSdCustomValidator,
  SD_FORM_CONFIGURATION,
  SdCustomValidator,
  SdFormControl,
  SdInlineErrorValidator,
  SdViewed,
  SdViewedInput,
  sdFormControlState,
  sdViewedTransform,
  ɵSdFormControlParent,
  ɵsdCoerceFormGroup,
  ɵsdFormControlConnector,
} from '@sdcorejs/angular/forms/models';
import type { SdLabelPlacement } from '@sdcorejs/angular/forms/models';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { Utilities } from '@sdcorejs/utils/fns';
import { Color, Size } from '@sdcorejs/utils/models';
import { Subject } from 'rxjs';
import { SD_BADGE_ICON_PRESET, SD_BADGE_TYPE_OPTIONS, SdBadgePickerValue } from './badge-picker.constants';
import { SdBadge, SdBadgeType } from './badge.component';

const SD_BADGE_PICKER_TYPES: SdBadgeType[] = SD_BADGE_TYPE_OPTIONS.map(option => option.value);
const SD_BADGE_PICKER_COLORS: Color[] = ['primary', 'secondary', 'info', 'success', 'warning', 'error'];
/** Bản nháp của lần mở đầu tiên khi chưa có giá trị. */
const SD_BADGE_PICKER_FIRST_DRAFT: SdBadgePickerValue = { type: 'round', color: 'secondary', icon: null };

let nextBadgePickerId = 0;

/** `dot` và `pair` không có icon: panel ẩn phần icon, nhưng giá trị `icon` vẫn được giữ. */
function hasIcon(type: SdBadgeType): boolean {
  return type !== 'dot' && type !== 'pair';
}

function sameValue(left: SdBadgePickerValue | null | undefined, right: SdBadgePickerValue | null | undefined): boolean {
  if (!left || !right) return !left && !right;
  return left.type === right.type && left.color === right.color && (left.icon ?? null) === (right.icon ?? null);
}

/**
 * Trigger của `sd-badge-picker` trong `mat-form-field`: cung cấp `MatFormFieldControl` để field có label nổi, viền,
 * vòng focus, lỗi và cỡ y như `sd-select`.
 *
 * Nội bộ (`ɵ`): không nằm trong SemVer, ứng dụng không dùng trực tiếp.
 */
// why: không khai `implements MatFormFieldControl` — interface đó thêm member qua các major Material (19 → 22) mà nguồn
// v19 được dùng cho cả bốn line; mat-form-field chỉ đọc các thuộc tính dưới đây lúc chạy.
@Directive({
  selector: '[sdBadgePickerControl]',
  standalone: true,
  exportAs: 'sdBadgePickerControl',
  providers: [{ provide: MatFormFieldControl, useExisting: ɵSdBadgePickerControlDirective }],
})
export class ɵSdBadgePickerControlDirective implements OnDestroy {
  readonly #picker = inject(SdBadgePicker);

  readonly stateChanges = new Subject<void>();
  readonly id = `sd-badge-picker-${++nextBadgePickerId}`;
  readonly ngControl = null;
  readonly controlType = 'sd-badge-picker';
  readonly autofilled = false;
  /** Id của hint/lỗi mà mat-form-field nối vào; trigger đọc lại cho `aria-describedby`. */
  readonly describedBy = signal<string | null>(null);

  constructor() {
    // why: mat-form-field là OnPush và đọc các getter dưới đây; báo cho nó mỗi khi một thứ field hiển thị đổi.
    effect(() => {
      this.#picker.value();
      this.#picker.isOpen();
      this.#picker.triggerFocused();
      this.#picker.connectorState();
      untracked(() => this.stateChanges.next());
    });
  }

  get value(): SdBadgePickerValue | null {
    return this.#picker.value();
  }

  get placeholder(): string {
    return this.#picker.effectivePlaceholder();
  }

  get focused(): boolean {
    return this.#picker.triggerFocused() || this.#picker.isOpen();
  }

  get empty(): boolean {
    return !this.#picker.value();
  }

  // why: theo thiết kế label chỉ nổi khi có giá trị hoặc panel đang mở — focus trigger thôi thì chưa nổi.
  get shouldLabelFloat(): boolean {
    return !this.empty || this.#picker.isOpen();
  }

  get required(): boolean {
    return this.#picker.required();
  }

  get disabled(): boolean {
    return this.#picker.connectorState().disabled;
  }

  get errorState(): boolean {
    return !!this.#picker.visibleErrorMessage();
  }

  setDescribedByIds(ids: string[]): void {
    this.describedBy.set(ids.length ? ids.join(' ') : null);
  }

  onContainerClick(): void {
    this.#picker.onContainerClick();
  }

  ngOnDestroy(): void {
    this.stateChanges.complete();
  }
}

@Component({
  selector: 'sd-badge-picker',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatTooltipModule,
    OverlayModule,
    SdBadge,
    SdButton,
    SdIcon,
    SdLabel,
    SdTranslatePipe,
    SdView,
    ɵSdBadgePickerControlDirective,
    ɵSdSearchField,
    ɵSdSearchFieldInputDirective,
  ],
  templateUrl: './badge-picker.component.html',
  styleUrl: './badge-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.sd-viewed]': 'connectorState().isViewed',
    '[class.sd-label-top]': "labelPlacement() === 'top'",
    '[attr.data-disabled]': 'connectorState().disabled',
  },
})
export class SdBadgePicker {
  readonly #i18n = inject(I18nService);
  readonly #formConfiguration = inject(SD_FORM_CONFIGURATION, { optional: true });
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  // ==========================================
  // 1. MODELS, INPUTS, OUTPUTS
  // ==========================================
  /** Type đã ghi. Ghi khi panel đóng; trống thì trigger hiện label/placeholder. */
  readonly type = model<SdBadgeType | undefined>(undefined);
  /** Màu đã ghi. Ghi khi panel đóng. */
  readonly color = model<Color | undefined>(undefined);
  /** Icon đã ghi. Ghi khi panel đóng; `dot` và `pair` bỏ qua nhưng vẫn giữ giá trị. */
  readonly icon = model<string | null>(null);

  readonly previewTitle = input<string | null | undefined>();
  readonly previewDescription = input<string | null | undefined>();
  readonly types = input<SdBadgeType[], SdBadgeType[] | null | undefined>(SD_BADGE_PICKER_TYPES, {
    transform: value => (value?.length ? value : SD_BADGE_PICKER_TYPES),
  });
  readonly colors = input<Color[], Color[] | null | undefined>(SD_BADGE_PICKER_COLORS, {
    transform: value => (value?.length ? value : SD_BADGE_PICKER_COLORS),
  });
  readonly icons = input<readonly string[], readonly string[] | null | undefined>(SD_BADGE_ICON_PRESET, {
    transform: value => value ?? SD_BADGE_ICON_PRESET,
  });

  readonly form = input<FormGroup | undefined, ɵSdFormControlParent>(undefined, { transform: ɵsdCoerceFormGroup });
  readonly name = input<string>(Utilities.generateUuid());
  readonly size = input<Size, Size | null | undefined>('md', { transform: value => value || 'md' });
  readonly floatLabel = input<FloatLabelType, FloatLabelType | null | undefined>('auto', { transform: value => value || 'auto' });
  /** `'float'` (mặc định) hoặc `'top'` — nhãn tĩnh phía trên, helper text dưới control. */
  readonly labelPlacement = input<SdLabelPlacement>('float');
  readonly appearanceInput = input<MatFormFieldAppearance | undefined>(undefined, { alias: 'appearance' });
  readonly appearance = computed(() => this.appearanceInput() ?? this.#formConfiguration?.appearance ?? 'outline');
  readonly label = input<string | null | undefined>();
  readonly placeholder = input<string | null | undefined>();
  readonly helperText = input<string | null | undefined>();
  readonly required = input(false, { transform: booleanAttribute });
  readonly validator = input<SdCustomValidator | undefined>();
  readonly inlineError = input<string | undefined>();
  readonly hideInlineError = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });
  readonly autoIdInput = input<string | null | undefined>(undefined, { alias: 'autoId' });
  readonly autoId = computed(() => (this.autoIdInput() ? `components-badge-picker-${this.autoIdInput()}` : undefined));

  /** Phát một lần khi panel đóng và giá trị đổi. Esc không phát. */
  readonly sdChange = output<SdBadgePickerValue>();

  // ==========================================
  // 2. VALUE & FORM
  // ==========================================
  /** `{ type, color, icon }` đã ghi, hoặc `null` khi chưa có type. */
  readonly value = computed<SdBadgePickerValue | null>(() => {
    const type = this.type();
    return type ? { type, color: this.color() ?? 'secondary', icon: this.icon() ?? null } : null;
  });

  readonly formControl = new SdFormControl();
  readonly #state = sdFormControlState(computed(() => this.formControl));

  // why: required và inlineError đọc VÔ ĐIỀU KIỆN, cùng lý do như sd-select — connector cài/gỡ validator với
  // emitEvent false nên `#state` không tick.
  readonly errorMessage = computed<string | undefined>(() => {
    void this.#state();
    void this.required();
    const inlineError = this.inlineError();
    const errors = this.formControl.errors;
    if (!errors) return undefined;
    if (errors['required']) return this.#i18n.t('core.component.badge.picker.required');
    if (errors['customValidator']) return errors['customValidator'] as string;
    if (errors['inlineError']) return inlineError;
    return undefined;
  });

  readonly #connector = ɵsdFormControlConnector<SdBadgePickerValue | null, SdBadgePickerValue | null>({
    form: this.form,
    name: this.name,
    control: computed(() => this.formControl),
    model: this.value,
    writeModel: value => this.#writeModels(value),
    modelEquals: sameValue,
    controlEquals: sameValue,
    validators: computed(() => (this.inlineError() ? [SdInlineErrorValidator] : null)),
    asyncValidators: computed(() => {
      const custom = this.validator();
      return custom ? [HandleSdCustomValidator(custom)] : null;
    }),
    required: this.required,
    disabled: this.disabled,
    viewed: this.viewed,
    validationError: this.errorMessage,
  });
  readonly connectorState = this.#connector.state;
  /** Message lỗi đã gate theo tương tác (`undefined` cho tới khi control touched/dirty). */
  readonly visibleErrorMessage = computed(() => this.connectorState().validationError);

  readonly errorId = `sd-badge-picker-error-${Utilities.generateUuid()}`;
  readonly hintId = `sd-badge-picker-hint-${Utilities.generateUuid()}`;
  readonly panelId = `sd-badge-picker-panel-${Utilities.generateUuid()}`;
  readonly typeGroupId = `${this.panelId}-type`;
  readonly colorGroupId = `${this.panelId}-color`;
  readonly iconGroupId = `${this.panelId}-icon`;

  // ==========================================
  // 3. DISPLAY
  // ==========================================
  readonly effectivePlaceholder = computed(() => this.placeholder() || this.#i18n.t('core.component.badge.picker.placeholder'));
  readonly effectivePreviewTitle = computed(() => this.previewTitle() || this.#i18n.t('core.component.badge.picker.preview-title'));
  /** Nhãn mẫu cho bản xem trước của `pair`. */
  readonly pairLabel = computed(() => this.#i18n.t('core.component.badge.picker.pair-label'));
  /** Control lg (48px) dùng badge cỡ md, sm và md dùng cỡ sm. */
  readonly triggerBadgeSize = computed<Size>(() => (this.size() === 'lg' ? 'md' : 'sm'));
  readonly summary = computed(() => {
    const value = this.value();
    if (!value) return '';
    const parts = [this.typeLabel(value.type), this.colorLabel(value.color)];
    if (hasIcon(value.type)) parts.push(value.icon || this.#i18n.t('core.component.badge.picker.no-icon'));
    return parts.join(' · ');
  });
  // why: label chiếm chỗ của placeholder cho tới khi nó nổi lên (giá trị, panel mở, hoặc floatLabel always).
  readonly showPlaceholder = computed(() => !this.value() && (this.isOpen() || this.floatLabel() === 'always' || !this.label()));

  typeLabel = (type: SdBadgeType): string => this.#i18n.t(`core.component.badge.type.${type}`);
  /** Câu gợi ý Esc ở chân panel, tách quanh `{key}` để phím Esc vẽ như nắp phím (review 2026-10-22). */
  readonly escHint = computed(() => this.#i18n.t('core.component.badge.picker.esc-hint').split('{key}'));
  colorLabel = (color: Color): string => this.#i18n.t(`core.component.badge.color.${color}`);
  /** Icon thực sự đưa vào `sd-badge` (type không có icon thì không truyền). */
  iconOf = (value: SdBadgePickerValue): string | null => (hasIcon(value.type) ? value.icon : null);

  // ==========================================
  // 4. PANEL
  // ==========================================
  readonly isOpen = signal(false);
  readonly triggerFocused = signal(false);
  readonly draft = signal<SdBadgePickerValue>(SD_BADGE_PICKER_FIRST_DRAFT);
  readonly iconQuery = signal('');
  #openedFrom: SdBadgePickerValue = SD_BADGE_PICKER_FIRST_DRAFT;

  private readonly field = viewChild(MatFormField);
  private readonly triggerRef = viewChild<ElementRef<HTMLElement>>('trigger');
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  readonly overlayOrigin = computed(() => this.field()?.getConnectedOverlayOrigin());
  readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 },
  ];

  readonly typeOptions = computed(() => {
    const allowed = this.types();
    return SD_BADGE_TYPE_OPTIONS.filter(option => allowed.includes(option.value)).map(option => ({
      value: option.value,
      label: this.#i18n.t(option.labelKey),
    }));
  });
  readonly colorOptions = computed(() => this.colors().map(color => ({ value: color, label: this.colorLabel(color) })));
  readonly draftHasIcon = computed(() => hasIcon(this.draft().type));
  readonly filteredIcons = computed(() => {
    const query = this.iconQuery().trim().toLowerCase().replace(/\s+/g, '_');
    return this.icons().filter(name => !query || name.toLowerCase().includes(query));
  });
  /** Ô đang giữ tab stop của lưới icon: icon nháp nếu nó còn hiện sau khi lọc, ngược lại là ô "không icon". */
  readonly iconTabStop = computed(() => {
    const icon = this.draft().icon;
    return icon && this.filteredIcons().includes(icon) ? icon : null;
  });
  readonly noneIconLabel = computed(() =>
    this.#i18n.t(this.draft().type === 'icon' ? 'core.component.badge.picker.dot' : 'core.component.badge.picker.no-icon')
  );
  /** Description chỉ hiện ở type icon và tag. */
  readonly previewDescriptionShown = computed(() => {
    const type = this.draft().type;
    return type === 'icon' || type === 'tag' ? this.previewDescription() || null : null;
  });
  readonly showDescriptionHint = computed(() => !!this.previewDescription() && !this.previewDescriptionShown());

  setDraftType = (type: SdBadgeType): void => this.draft.update(draft => ({ ...draft, type }));
  setDraftColor = (color: Color): void => this.draft.update(draft => ({ ...draft, color }));
  setDraftIcon = (icon: string | null): void => this.draft.update(draft => ({ ...draft, icon }));

  open(): void {
    if (this.isOpen() || this.connectorState().disabled || this.connectorState().isViewed) return;
    const start = this.value() ?? SD_BADGE_PICKER_FIRST_DRAFT;
    this.#openedFrom = start;
    this.draft.set({ ...start });
    this.iconQuery.set('');
    this.isOpen.set(true);
  }

  /** Bấm trigger: mở, hoặc ghi rồi đóng nếu panel đang mở. */
  toggle(): void {
    if (this.isOpen()) this.#commit();
    else this.open();
  }

  onContainerClick(): void {
    if (this.isOpen()) return;
    this.triggerRef()?.nativeElement.focus();
    this.open();
  }

  /** "Xong": ghi bản nháp rồi đưa focus về trigger. */
  done(): void {
    this.#commit();
    this.#focusTrigger();
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.isOpen()) return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      // why: Space trên phần tử focus được sẽ cuộn trang nếu không chặn.
      event.preventDefault();
      this.open();
    }
  }

  onAttach(): void {
    // why: nội dung panel vừa gắn vào overlay; đợi một nhịp để nó có trong DOM rồi đưa focus vào type đang chọn.
    setTimeout(() => this.panelRef()?.nativeElement.querySelector<HTMLElement>('[data-badge-picker-type][tabindex="0"]')?.focus());
  }

  onOutsideClick(event: MouseEvent): void {
    // why: bấm vào chính field (trigger) đã có toggle() lo; ở đây chỉ xử lý bấm ra hẳn bên ngoài.
    const target = event.target as Node | null;
    if (target && this.#host.contains(target)) return;
    this.#commit();
  }

  onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' && event.key !== 'Esc') return;
    event.preventDefault();
    this.#cancel();
    this.#focusTrigger();
  }

  /** Tab ra khỏi phần tử cuối (hoặc Shift+Tab khỏi phần tử đầu) thì ghi bản nháp. */
  onPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const stops = this.#tabStops();
    if (!stops.length) return;
    const active = document.activeElement;
    if (!event.shiftKey && active === stops[stops.length - 1]) {
      // why: KHÔNG preventDefault — focus về trigger ngay trong keydown nên hành động mặc định của Tab đi tiếp từ
      // trigger tới control kế sau nó, đúng thứ tự trang.
      this.#commit();
      this.#focusTrigger();
    } else if (event.shiftKey && active === stops[0]) {
      event.preventDefault();
      this.#commit();
      this.#focusTrigger();
    }
  }

  /** Mũi tên di chuyển focus giữa các radio của một nhóm (theo lưới `columns` cột); Enter/Space mới chọn. */
  onRadioKeydown(event: KeyboardEvent, columns: number): void {
    const group = (event.currentTarget as HTMLElement).closest('[role="radiogroup"]');
    const radios = Array.from(group?.querySelectorAll<HTMLElement>('[role="radio"]') ?? []);
    const index = radios.indexOf(event.currentTarget as HTMLElement);
    if (index < 0) return;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
        next = index + 1;
        break;
      case 'ArrowLeft':
        next = index - 1;
        break;
      case 'ArrowDown':
        next = index + columns;
        break;
      case 'ArrowUp':
        next = index - columns;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = radios.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    radios[Math.min(Math.max(next, 0), radios.length - 1)].focus();
  }

  onIconQuery(event: Event): void {
    this.iconQuery.set((event.target as HTMLInputElement).value);
  }

  #commit(): void {
    if (!this.isOpen()) return;
    const next = { ...this.draft() };
    const changed = !sameValue(next, this.#openedFrom);
    this.isOpen.set(false);
    this.#connector.markAsTouched();
    if (!changed) return;
    this.#writeModels(next);
    // why: setValue CÓ phát event — form của consumer nhận valueChanges và async [validator] chạy lại; connector
    // thấy model đã bằng giá trị mới nên không ghi ngược lại.
    this.formControl.setValue(next);
    this.#connector.markAsDirty();
    this.sdChange.emit(next);
  }

  #cancel(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.#connector.markAsTouched();
  }

  #writeModels(value: SdBadgePickerValue | null): void {
    this.type.set(value?.type);
    this.color.set(value?.color);
    this.icon.set(value?.icon ?? null);
  }

  #focusTrigger(): void {
    this.triggerRef()?.nativeElement.focus();
  }

  #tabStops(): HTMLElement[] {
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return [];
    return Array.from(panel.querySelectorAll<HTMLElement>('button, input, [tabindex]')).filter(
      el => el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled && el.getAttribute('tabindex') !== '-1'
    );
  }
}
