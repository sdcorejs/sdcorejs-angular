import { ChangeDetectionStrategy, Component, computed, effect, inject, output, signal, untracked } from '@angular/core';
import type { Signal } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdInform } from '@sdcorejs/angular/components/inform';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { DateUtilities } from '@sdcorejs/utils/fns';
import type { Filter } from '@sdcorejs/utils/models';
import type { SdFormGenericBreakpoint } from '../../../configurations/form-generic-breakpoints';
import { sdSpanSource, type SdFormGenericSpanSource } from '../../../layout/form-generic-layout';
import type { SdFormGenericHtmlDefinition, SdFormGenericTemplate } from '../../../models/form-generic-config.model';
import type {
  SdFormGenericField,
  SdFormGenericFieldValidation,
  SdFormGenericFill,
  SdFormGenericNumberSubtype,
  SdFormGenericOption,
  SdFormGenericOptions,
  SdFormGenericParam,
  SdFormGenericRules,
} from '../../../models/form-generic-field.model';
import { SD_FORM_GENERIC_RESERVED_KEYS } from '../../../models/form-generic-schema';
import type {
  SdFormGenericGroup,
  SdFormGenericNavigation,
  SdFormGenericPageElement,
  SdFormGenericSchema,
} from '../../../models/form-generic-schema.model';
import { sdIsValidPattern, sdNumberPrecision, sdNumberSubtype, sdTextSubtype } from '../../../presets/form-generic-presets';
import { sdIsEmptyFilter } from '../../../rules/form-generic-filter';
import { sdFindKeyReferences } from '../../../rules/form-generic-references';
import { FormGenericService } from '../../../services/form-generic.service';
import { AttributeExpression } from '../components/attribute-expression/attribute-expression.component';
import { AttributeParameter } from '../components/attribute-parameter/attribute-parameter.component';
import { BuildQueries } from '../components/attribute-selection/components/build-queries/build-queries.component';
import { BuildVariables } from '../components/attribute-selection/components/build-variables/build-variables.component';
import { HtmlBuildQueries } from '../components/html/attribute/components/build-queries/build-queries.component';
import {
  BuilderDocument,
  BuilderItem,
  cloneJson,
  collectKeys,
  isField,
  isGroup,
  isUnknown,
  randomKey,
  SD_FORM_BUILDER_KEY_PATTERN,
} from '../state/builder-document';
import { escapeHtml } from '../state/builder-html';
import { GRID_COLUMNS, itemSpan, layoutOf } from '../state/builder-layout';
import { itemIcon, itemTypeLabelKey, paletteIdOf } from '../state/builder-palette';
import { FormBuilderStore, InspectorTab } from '../state/builder-store';
import { OptionsEditorComponent } from './options-editor.component';
import { ToggleRowComponent } from './toggle-row.component';

type AnyField = SdFormGenericField & Record<string, any>;

interface Choice<T = string> {
  readonly value: T;
  readonly display: string;
}

/** Span của một mức và nơi nó lấy giá trị (tự khai báo / theo Desktop / mặc định). */
interface SpanLevel {
  readonly level: SdFormGenericBreakpoint;
  readonly span: number;
  readonly source: SdFormGenericSpanSource;
}

/**
 * Giá trị đại diện cho lựa chọn "không / theo mặc định" trong các select luôn có giá trị.
 *
 * why: `sd-select` coi `''`/`null` là CHƯA chọn (hiện placeholder, lỗi `required`) và hiện nút ×
 * cho select không bắt buộc. Select của inspector luôn phải có một lựa chọn, nên lựa chọn "không"
 * cần một giá trị thật; setter dịch nó về "xoá thuộc tính" trước khi ghi schema.
 */
const NONE = '__none__';

/** Lựa chọn "danh sách tĩnh" của nguồn options (các lựa chọn còn lại là id catalog). */
const STATIC_SOURCE = '__static__';

const LEVELS: readonly SdFormGenericBreakpoint[] = ['desktop', 'tablet', 'mobile'];

let nextInspectorId = 0;

/** Schema chỉ để ĐỌC (tra tham chiếu) — không clone như `documentToSchema`. */
const schemaView = (doc: BuilderDocument): SdFormGenericSchema => ({
  pages: [{ ...doc.base.page, elements: [...doc.elements] }, ...doc.base.otherPages],
  variables: [...doc.variables],
  validations: [...doc.validations],
});

/** Icon group hay dùng (Material Icons Outlined), xếp theo chủ đề: chung · con người · địa điểm · tài chính · hồ sơ · hệ thống. */
const ICON_PRESETS = [
  'category',
  'folder',
  'inventory_2',
  'view_quilt',
  'info',
  'star',
  'flag',
  'person',
  'badge',
  'contact_phone',
  'groups',
  'family_restroom',
  'school',
  'work',
  'home',
  'location_on',
  'apartment',
  'business',
  'directions_car',
  'local_shipping',
  'shopping_cart',
  'payments',
  'account_balance',
  'credit_card',
  'receipt_long',
  'event',
  'schedule',
  'description',
  'assignment',
  'fact_check',
  'attach_file',
  'medical_services',
  'settings',
  'security',
  'verified_user',
];
const COLOR_PRESETS = ['primary', 'secondary', 'info', 'success', 'warning', 'error'] as const;

/**
 * Inspector theo ngữ cảnh. Chỉ hiện thuộc tính renderer THẬT SỰ hỗ trợ cho loại field đang chọn,
 * chia 4 tab Chung / Dữ liệu / Quy tắc / Bố cục. Mọi chỉnh sửa đi qua `FormBuilderStore.update`
 * (một bước undo; gõ chữ liên tục được gộp theo phiên) — không sửa trực tiếp object của schema.
 */
@Component({
  selector: 'fb-inspector',
  templateUrl: './inspector.component.html',
  styleUrl: './inspector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTooltipModule,
    SdInform,
    SdInput,
    SdInputNumber,
    SdSelect,
    SdTextarea,
    SdButton,
    SdIcon,
    SdTranslatePipe,
    AttributeExpression,
    AttributeParameter,
    BuildQueries,
    BuildVariables,
    HtmlBuildQueries,
    OptionsEditorComponent,
    ToggleRowComponent,
  ],
})
export class InspectorComponent {
  readonly store = inject(FormBuilderStore);
  readonly #formGeneric = inject(FormGenericService);
  readonly #confirm = inject(SdConfirmService);

  readonly requestRemove = output<string>();
  readonly openVariables = output<void>();
  readonly openValidations = output<void>();
  readonly openShortcuts = output<void>();

  readonly #uid = `fb-ins-${++nextInspectorId}`;
  readonly orderLabelId = `${this.#uid}-order`;
  /** Id của tabpanel — tab trỏ tới nó (`aria-controls`), nó trỏ lại tab đang mở (`aria-labelledby`). */
  readonly panelId = `${this.#uid}-panel`;
  tabId = (tab: InspectorTab): string => `${this.#uid}-tab-${tab}`;
  readonly iconPresets = ICON_PRESETS;
  readonly colorPresets = COLOR_PRESETS;
  readonly columnChoices: Choice<number>[] = Array.from({ length: GRID_COLUMNS }, (_, index) => ({
    value: index + 1,
    display: `${index + 1}/${GRID_COLUMNS}`,
  }));

  readonly location = this.store.selected;
  readonly item = computed<BuilderItem | null>(() => this.location()?.item ?? null);
  /** Field đang chọn (không phải group/phần tử chưa hỗ trợ) với truy cập thuộc tính linh hoạt. */
  readonly field = computed<AnyField | null>(() => {
    const item = this.item();
    return isField(item) ? (item as AnyField) : null;
  });
  readonly group = computed<SdFormGenericGroup | null>(() => {
    const item = this.item();
    return isGroup(item) ? item : null;
  });
  /** Phần tử `type` mà phiên bản này chưa hỗ trợ: chỉ xem/xoá/di chuyển, nội dung giữ nguyên. */
  readonly unsupported = computed(() => isUnknown(this.item()));
  readonly type: Signal<SdFormGenericPageElement['type'] | null> = computed(() => this.item()?.type ?? null);
  readonly presetId = computed(() => (this.item() ? paletteIdOf(this.item()!) : ''));
  readonly icon = computed(() => (this.item() ? itemIcon(this.item()!) : 'tune'));
  readonly typeLabelKey = computed(() => (this.item() ? itemTypeLabelKey(this.item()!) : ''));
  readonly validation = computed(() => (this.field()?.validation ?? {}) as SdFormGenericFieldValidation);
  readonly rules = computed(() => ((this.item() as { rules?: SdFormGenericRules } | null)?.rules ?? {}) as SdFormGenericRules);
  readonly elements = this.store.allElements;
  readonly navigationMode: Signal<SdFormGenericNavigation['type'] | 'single'> = computed(() => this.store.navigation()?.type ?? 'single');
  readonly linear = computed(() => {
    const navigation = this.store.navigation();
    return navigation?.type === 'steps' && !!navigation.linear;
  });
  readonly navigationChoices = computed(() =>
    ['single', 'tabs', 'steps'].map(value => ({ value, display: this.store.t(`core.component.form-builder.page.${value}`) }))
  );
  setNavigation(value: string | null | undefined): void {
    if (value === 'single' || value === 'tabs' || value === 'steps') this.store.setNavigation(value);
  }
  readonly variables = computed(() => this.store.doc().variables);

  /** Tab khả dụng theo loại phần tử. */
  readonly tabs = computed<InspectorTab[]>(() => {
    const type = this.type();
    if (!type || this.unsupported()) return [];
    if (type === 'group') return ['general', 'rules', 'layout'];
    return ['general', 'data', 'rules', 'layout'];
  });
  readonly activeTab = computed<InspectorTab>(() => {
    const tabs = this.tabs();
    const tab = this.store.inspectorTab();
    return tabs.includes(tab) ? tab : (tabs[0] ?? 'general');
  });

  // ── Khả năng theo loại (chỉ hiện thứ renderer hỗ trợ) ───────────────────────
  readonly supportsPlaceholder = computed(() =>
    ['textfield', 'textarea', 'number', 'select', 'datetime', 'chip-string', 'chip-calendar'].includes(this.type() ?? '')
  );
  readonly supportsHelper = computed(() => !!this.field() && this.type() !== 'html');
  /** `sd-checkbox` không có `required` → không hứa điều renderer không làm. */
  readonly supportsRequired = computed(() => !!this.field() && !['checkbox', 'html'].includes(this.type() ?? ''));
  readonly supportsDisabled = computed(() => !!this.field() && this.type() !== 'html');
  readonly supportsViewed = computed(() => !!this.field() && this.type() !== 'html');
  readonly supportsLength = computed(() => this.type() === 'textfield' || this.type() === 'textarea');
  readonly supportsDefault = computed(() => {
    const type = this.type();
    if (type === 'textfield') return sdTextSubtype(this.field() as never) !== 'password';
    return type === 'textarea' || type === 'number' || type === 'checkbox' || type === 'select' || type === 'radio';
  });
  /** Hyperlink ở chế độ xem: renderer chỉ dùng cho select/radio. */
  readonly supportsHyperlink = computed(() => this.type() === 'select' || this.type() === 'radio');

  readonly textSubtype = computed(() => (this.type() === 'textfield' ? sdTextSubtype(this.field() as never) : null));
  readonly numberSubtype: Signal<SdFormGenericNumberSubtype | 'number' | null> = computed(() =>
    this.type() === 'number' ? (sdNumberSubtype(this.field() as never) ?? 'number') : null
  );
  readonly numberPrecision = computed(() => (this.type() === 'number' ? sdNumberPrecision(this.field() as never) : undefined));
  readonly passwordHasDefault = computed(() => this.textSubtype() === 'password' && this.field()?.['defaultValue'] != null);
  /** Regex không biên dịch được — renderer sẽ bỏ qua nó, nên báo ngay ở ô nhập. */
  readonly patternError = computed(() => {
    const pattern = this.validation().pattern?.value;
    return pattern && !sdIsValidPattern(pattern) ? this.store.t('core.component.form-builder.pattern.invalid') : undefined;
  });

  readonly textKinds = computed<Choice[]>(() =>
    (['text', 'email', 'phone', 'url', 'password'] as const).map(value => ({
      value,
      display: this.store.t(`core.component.form-builder.preset.${value}`),
    }))
  );
  readonly numberKinds = computed<Choice[]>(() => [
    { value: 'number', display: this.store.t('core.component.form-builder.kind.number-default') },
    ...(['integer', 'decimal', 'currency', 'percent'] as const).map(value => ({
      value,
      display: this.store.t(`core.component.form-builder.preset.${value}`),
    })),
  ]);
  readonly phoneCountries = computed<Choice[]>(() => [
    { value: NONE, display: this.store.t('core.component.form-builder.phone-country.any') },
    { value: 'VN', display: this.store.t('core.component.form-builder.phone-country.vn') },
  ]);
  readonly NONE = NONE;
  readonly datetimeFormats: Choice[] = [
    { value: 'date', display: 'dd/MM/yyyy' },
    { value: 'datetime', display: 'dd/MM/yyyy HH:mm' },
  ];
  readonly directions = computed<Choice[]>(() => [
    { value: 'row', display: this.store.t('core.component.form-builder.direction.row') },
    { value: 'column', display: this.store.t('core.component.form-builder.vertical') },
  ]);
  readonly uploadTypes = computed<Choice[]>(() => [
    { value: 'file', display: this.store.t('core.component.form-builder.file') },
    { value: 'image', display: this.store.t('core.component.form-builder.image') },
  ]);
  readonly uploadSources = computed<Choice[]>(() => [
    { value: 'ALL', display: this.store.t('core.component.form-builder.upload-source.all') },
    { value: 'PHOTO_LIBRARY', display: this.store.t('core.component.form-builder.upload-source.photo-library') },
    { value: 'CAPTURE', display: this.store.t('core.component.form-builder.upload-source.capture') },
  ]);
  readonly booleanDefaults = computed<Choice<string>[]>(() => [
    { value: NONE, display: this.store.t('core.component.form-builder.default-none') },
    { value: 'true', display: this.store.t('core.form.checkbox.checked') },
    { value: 'false', display: this.store.t('core.form.checkbox.unchecked') },
  ]);
  /** Vùng chứa của field: cấp trang (NONE) hoặc một group — group không lồng nhau nên chỉ có hai cấp. */
  readonly containerChoices = computed<Choice[]>(() => [
    { value: NONE, display: this.store.t('core.component.form-builder.container.root') },
    ...this.store.groups().map(group => ({ value: group.id, display: this.store.labelOf(group) })),
  ]);
  readonly dateLimits = computed<Choice<string>[]>(() => [
    { value: NONE, display: this.store.t('core.component.form-builder.default-none') },
    { value: 'today', display: this.store.t('core.component.form-builder.date-today') },
  ]);
  /**
   * Lựa chọn min/max của datetime. why: schema có thể mang một ngày ISO (renderer vẫn áp) — hiện nó như
   * một lựa chọn để thấy và bỏ được, thay vì hiện "Không" mà vẫn có ràng buộc.
   */
  readonly minDateChoices = computed(() => this.#dateChoices(this.validation().min));
  readonly maxDateChoices = computed(() => this.#dateChoices(this.validation().max));
  dateLimitValue = (value: unknown): string => (typeof value === 'string' && value ? value : NONE);

  // ── Bố cục theo mức đang xem ──────────────────────────────────────────────
  readonly viewport = this.store.layoutMode;
  /** Span hiệu lực ở mức đang xem. */
  readonly span = computed(() => (this.item() ? itemSpan(this.item()!, this.viewport()) : GRID_COLUMNS));
  readonly spanSource = computed<SdFormGenericSpanSource>(() => sdSpanSource(layoutOf(this.item()), this.viewport()));
  /** "Theo Desktop" (tablet) / "Mặc định" khi mức đang xem chưa tự khai báo span. */
  readonly inheritedLabel = computed(() => {
    const source = this.spanSource();
    if (source === 'own') return '';
    return this.store.t(
      source === 'desktop' ? 'core.component.form-builder.span.follow-desktop' : 'core.component.form-builder.span.default'
    );
  });
  /** Span của cả 3 mức — tóm tắt dưới ô span. */
  readonly spanLevels = computed<SpanLevel[]>(() => {
    const item = this.item();
    if (!item) return [];
    const layout = layoutOf(item);
    return LEVELS.map(level => ({ level, span: itemSpan(item, level), source: sdSpanSource(layout, level) }));
  });
  /** "Desktop 6 · Tablet 6 (Theo Desktop) · Mobile 12 (Mặc định)". */
  readonly spanSummary = computed(() =>
    this.spanLevels()
      .map(level => this.levelLabel(level))
      .join(' · ')
  );
  readonly newRow = computed(() => !!layoutOf(this.item())?.newRow);

  // ── Nguồn lựa chọn: tĩnh | catalog của portal ─────────────────────────────
  readonly options = computed<SdFormGenericOptions | null>(() => (this.field()?.['options'] as SdFormGenericOptions | undefined) ?? null);
  readonly staticItems = computed<SdFormGenericOption[]>(() => {
    const options = this.options();
    return options?.source === 'static' ? (options.items ?? []) : [];
  });
  readonly catalogId = computed(() => {
    const options = this.options();
    return options?.source === 'catalog' ? options.catalog : null;
  });
  readonly catalog = computed(() => this.#formGeneric.catalog(this.catalogId()));
  readonly optionSource = computed(() => this.catalogId() ?? STATIC_SOURCE);
  readonly sourceChoices = computed<Choice[]>(() => {
    const choices: Choice[] = [
      { value: STATIC_SOURCE, display: this.store.t('core.component.form-builder.options.static') },
      ...this.#formGeneric.catalogs.map(catalog => ({ value: catalog.id, display: catalog.label || catalog.id })),
    ];
    // why: schema tạo ở nơi khác có thể trỏ tới catalog portal này chưa đăng ký — vẫn hiện để không mất lựa chọn.
    const current = this.catalogId();
    if (current && !choices.some(choice => choice.value === current)) choices.push({ value: current, display: current });
    return choices;
  });
  readonly catalogParams = computed(() => (this.options() as { params?: SdFormGenericParam[] } | null)?.params);
  readonly catalogFill = computed(() => (this.options() as { fill?: SdFormGenericFill[] } | null)?.fill);
  readonly optionChoices = computed<Choice[]>(() =>
    this.staticItems().map(option => ({ value: option.value, display: option.label || option.value }))
  );

  // ── Cấu hình của portal ───────────────────────────────────────────────────
  readonly htmlDefinitions = signal<SdFormGenericHtmlDefinition[]>([]);
  readonly htmlDefinitionChoices = computed<Choice[]>(() => {
    const choices = this.htmlDefinitions().map(definition => ({ value: definition.id, display: definition.label || definition.id }));
    // why: schema tạo ở portal khác có thể trỏ tới definition portal này không có — vẫn hiện để bỏ chọn được.
    const current = this.field()?.['definition'] as string | undefined;
    if (current && !choices.some(choice => choice.value === current)) choices.push({ value: current, display: current });
    return choices;
  });
  readonly htmlDefinition = computed(() => {
    const id = this.field()?.['definition'];
    return id ? this.htmlDefinitions().find(definition => definition.id === id) : undefined;
  });
  /** Biến của html definition đang chọn: giá trị của field, không có thì mặc định của definition. */
  readonly htmlVariables = computed(() => {
    const values = (this.field()?.['variables'] ?? {}) as Record<string, string>;
    return (this.htmlDefinition()?.variables ?? []).map(variable => ({
      key: variable.key,
      label: variable.label || variable.key,
      value: values[variable.key] ?? variable.value ?? '',
    }));
  });
  readonly templates = computed<SdFormGenericTemplate[]>(() => {
    const type = this.type();
    return this.#formGeneric.templates.filter(template => template.field?.type === type);
  });
  readonly templateChoices = computed<Choice[]>(() =>
    this.templates().map(template => ({ value: template.id, display: template.label || template.id }))
  );
  /** Mẫu đang áp (nhận ra theo key của mẫu) — schema không lưu id mẫu. */
  readonly currentTemplate = computed(() => {
    const key = this.field()?.key;
    return key ? (this.templates().find(template => template.field.key === key)?.id ?? null) : null;
  });

  // ── Mã trường ─────────────────────────────────────────────────────────────
  readonly keyDraft = signal('');
  readonly keyMessage = signal<string>('');
  readonly keyError = computed(() => {
    const field = this.field();
    if (!field) return '';
    const draft = this.keyDraft().trim();
    if (!draft) return this.store.t('core.component.form-builder.key.empty');
    if (draft === field.key) return '';
    if (!SD_FORM_BUILDER_KEY_PATTERN.test(draft)) return this.store.t('core.component.form-builder.key.invalid');
    if (SD_FORM_GENERIC_RESERVED_KEYS.has(draft)) return this.store.t('core.component.form-builder.key.reserved');
    if (collectKeys(this.store.doc(), field.id).has(draft)) return this.store.t('core.component.form-builder.key.duplicate');
    return '';
  });
  /** Tham chiếu tới key của field đang chọn từ phần tử KHÁC (và validation cấp form). */
  readonly keyReferences = computed(() => {
    const field = this.field();
    if (!field?.key) return [];
    return sdFindKeyReferences(schemaView(this.store.doc()), field.key).filter(reference => reference.elementId !== field.id);
  });
  readonly structuredReferences = computed(() => this.keyReferences().filter(reference => reference.kind === 'structured').length);
  readonly textReferences = computed(() => this.keyReferences().filter(reference => reference.kind === 'text').length);

  constructor() {
    this.#formGeneric.htmlDefinitions().then(list => this.htmlDefinitions.set(list ?? []));
    // why: chỉ nạp lại ô key khi đổi field được chọn hoặc key đổi từ ngoài (undo/redo). Sửa thuộc tính
    // khác không được xoá bản nháp key chưa áp dụng, và key đổi do chính `applyKey` giữ thông báo
    // "đã cập nhật N tham chiếu" (role=status) cho người dùng đọc.
    effect(() => {
      this.#keyIdentity();
      untracked(() => {
        const field = this.field();
        const key = field?.key ?? '';
        const sameField = this.#keyFieldId === field?.id;
        this.#keyFieldId = field?.id;
        if (sameField && this.keyDraft().trim() === key) return;
        this.keyDraft.set(key);
        this.keyMessage.set('');
      });
    });
  }

  #keyFieldId?: string;
  readonly #keyIdentity = computed(() => {
    const field = this.field();
    return field ? JSON.stringify([field.id, field.key ?? '']) : '';
  });

  label = (key: string, params?: Record<string, string | number>) => this.store.t(key, params);

  #dateChoices(current: unknown): Choice<string>[] {
    const choices = this.dateLimits();
    if (typeof current !== 'string' || !current || current === 'today') return choices;
    // why: a date-only string is read as UTC midnight by Date — splitting it avoids showing the previous
    // day in a negative UTC offset.
    const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(current);
    const display = day ? `${day[3]}/${day[2]}/${day[1]}` : DateUtilities.toFormat(current, 'dd/MM/yyyy') || current;
    return [...choices, { value: current, display }];
  }

  selectTab(tab: InspectorTab): void {
    this.store.inspectorTab.set(tab);
  }

  onTabKeydown(event: KeyboardEvent): void {
    const tabs = this.tabs();
    const index = tabs.indexOf(this.activeTab());
    const next =
      event.key === 'ArrowRight' || event.key === 'ArrowLeft'
        ? tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]
        : event.key === 'Home'
          ? tabs[0]
          : event.key === 'End'
            ? tabs[tabs.length - 1]
            : null;
    if (!next) return;
    event.preventDefault();
    // why: lấy tablist NGAY — `currentTarget` về null khi sự kiện dispatch xong (trong microtask).
    const tablist = event.currentTarget as HTMLElement | null;
    this.selectTab(next);
    queueMicrotask(() => tablist?.querySelector<HTMLElement>(`[data-tab="${next}"]`)?.focus());
  }

  // ── Cập nhật (mỗi lệnh là một bước undo; gõ chữ được gộp) ───────────────────

  #id(): string | null {
    return this.item()?.id ?? null;
  }

  /** Sửa phần tử đang chọn qua bản sao nông. */
  #update(updater: (next: Record<string, any>) => void, coalesceKey?: string): void {
    const id = this.#id();
    if (!id) return;
    this.store.update(
      id,
      item => {
        const next = { ...item } as Record<string, any>;
        updater(next);
        return next as BuilderItem;
      },
      coalesceKey
    );
  }

  /** Gán thuộc tính cấp gốc. `undefined`/`null`/`''` = xoá thuộc tính khỏi schema. */
  set(property: string, value: unknown, coalesce = false): void {
    this.#update(
      next => {
        if (value === undefined || value === null || value === '') delete next[property];
        else next[property] = value;
      },
      coalesce ? `${this.#id()}:${property}` : undefined
    );
  }

  /** Cờ boolean: chỉ ghi `true`; tắt = xoá thuộc tính. */
  setFlag(property: string, value: boolean): void {
    this.set(property, value ? true : undefined);
  }

  /** Nhãn bắt buộc phải là chuỗi (có thể rỗng) — không xoá thuộc tính. */
  setLabel(value: string): void {
    this.#update(next => (next['label'] = value ?? ''), `${this.#id()}:label`);
  }

  setValidation(property: keyof SdFormGenericFieldValidation, value: unknown, coalesce = false): void {
    this.#update(
      next => {
        const validation = { ...((next['validation'] ?? {}) as Record<string, unknown>) };
        if (value === undefined || value === null || value === '') delete validation[property];
        else validation[property] = value;
        if (Object.keys(validation).length) next['validation'] = validation;
        else delete next['validation'];
      },
      coalesce ? `${this.#id()}:validation.${property}` : undefined
    );
  }

  /** Như `setValidation` cho select có lựa chọn "không" (NONE = xoá thuộc tính). */
  setValidationChoice(property: keyof SdFormGenericFieldValidation, value: string | null): void {
    this.setValidation(property, value === NONE ? undefined : value);
  }

  setRequired(required: boolean): void {
    this.setValidation('required', required ? true : undefined);
  }

  /** Regex và câu báo lỗi của nó; cả hai rỗng thì bỏ `pattern`. */
  setPattern(part: 'value' | 'message', text: string): void {
    const current = this.validation().pattern;
    const value = part === 'value' ? (text ?? '') : (current?.value ?? '');
    const message = part === 'message' ? (text ?? '') : (current?.message ?? '');
    this.setValidation('pattern', value || message ? { value, ...(message ? { message } : {}) } : undefined, true);
  }

  /** Điều kiện động (`rules.*`), lưu thẳng `Filter`. */
  setRule(name: keyof SdFormGenericRules, filter: Filter | undefined): void {
    this.#update(next => {
      const rules = { ...((next['rules'] ?? {}) as SdFormGenericRules) };
      if (sdIsEmptyFilter(filter)) delete rules[name];
      else rules[name] = filter;
      if (Object.keys(rules).length) next['rules'] = rules;
      else delete next['rules'];
    });
  }

  /**
   * Đổi preset textfield. Sang mật khẩu thì bỏ giá trị mặc định (không lưu mật khẩu vào schema) và
   * regex (ô regex ẩn với mật khẩu — giữ lại là ràng buộc vô hình).
   */
  setTextSubtype(subtype: string): void {
    this.#update(next => {
      next['subtype'] = subtype;
      if (subtype === 'password') delete next['defaultValue'];
      const validation = { ...((next['validation'] ?? {}) as SdFormGenericFieldValidation) };
      if (subtype !== 'phone') delete validation.phoneCountry;
      if (subtype === 'password') delete validation.pattern;
      if (Object.keys(validation).length) next['validation'] = validation;
      else delete next['validation'];
    });
  }

  /** Bật/tắt chọn nhiều; giá trị mặc định đổi dạng theo (chuỗi ↔ mảng) để khớp control. */
  setMultiple(multiple: boolean): void {
    this.#update(next => {
      if (multiple) next['multiple'] = true;
      else delete next['multiple'];
      const value = next['defaultValue'];
      if (multiple && typeof value === 'string') next['defaultValue'] = [value];
      if (!multiple && Array.isArray(value)) {
        if (value.length) next['defaultValue'] = value[0];
        else delete next['defaultValue'];
      }
    });
  }

  setNumberSubtype(subtype: string): void {
    this.#update(next => {
      if (subtype === 'number') delete next['subtype'];
      else next['subtype'] = subtype;
      if (subtype === 'currency' && !next['currency']) next['currency'] = 'VND';
      if (subtype !== 'currency') delete next['currency'];
      if (subtype === 'integer' || subtype === 'number') delete next['precision'];
    });
  }

  setDefaultText(value: string): void {
    this.set('defaultValue', value, true);
  }

  setDefaultNumber(value: number | null): void {
    this.set('defaultValue', typeof value === 'number' && Number.isFinite(value) ? value : undefined, true);
  }

  setDefaultBoolean(value: string): void {
    this.set('defaultValue', value === 'true' ? true : value === 'false' ? false : undefined);
  }

  defaultBooleanValue = (): string => {
    const value = this.field()?.['defaultValue'];
    return value === true ? 'true' : value === false ? 'false' : NONE;
  };

  setStaticItems(items: SdFormGenericOption[], coalesceKey?: string): void {
    this.#update(next => (next['options'] = { source: 'static', items }), coalesceKey);
  }

  /**
   * Đổi nguồn: tĩnh ↔ catalog. Đổi catalog thì bỏ `params`/`fill` của catalog cũ; sang catalog thì bỏ
   * giá trị mặc định (chọn từ danh sách tĩnh cũ, và ô mặc định không hiện với catalog).
   */
  setOptionSource(choice: string | null): void {
    if (!choice || choice === this.optionSource()) return;
    this.#update(next => {
      next['options'] = choice === STATIC_SOURCE ? { source: 'static', items: [] } : { source: 'catalog', catalog: choice };
      if (choice !== STATIC_SOURCE) delete next['defaultValue'];
    });
  }

  #patchCatalog(property: 'params' | 'fill', value: readonly unknown[] | null | undefined): void {
    this.#update(next => {
      const options = next['options'] as SdFormGenericOptions | undefined;
      if (options?.source !== 'catalog') return;
      const patched: Record<string, unknown> = { ...options };
      if (value?.length) patched[property] = [...value];
      else delete patched[property];
      next['options'] = patched;
    });
  }

  setCatalogParams(params: SdFormGenericParam[]): void {
    this.#patchCatalog('params', params);
  }

  setCatalogFill(fill: SdFormGenericFill[]): void {
    this.#patchCatalog('fill', fill);
  }

  setUploadParams(params: SdFormGenericParam[]): void {
    this.set('params', params?.length ? params : undefined);
  }

  // ── Bố cục ────────────────────────────────────────────────────────────────

  /** Span của mức đang xem. */
  setSpan(span: number | null): void {
    const id = this.#id();
    if (id && span) this.store.setSpan(id, span, this.viewport());
  }

  /** Xoá span của mức đang xem → về kế thừa ("Theo Desktop" / "Mặc định"). */
  clearSpan(): void {
    const id = this.#id();
    if (id) this.store.setSpan(id, null, this.viewport());
  }

  setNewRow(newRow: boolean): void {
    const id = this.#id();
    if (id) this.store.setNewRow(id, newRow);
  }

  levelLabel = (level: SpanLevel): string => {
    const name = this.store.t(`core.component.form-builder.viewport.${level.level}`);
    if (level.source === 'own') return `${name} ${level.span}`;
    const inherited = this.store.t(
      level.source === 'desktop' ? 'core.component.form-builder.span.follow-desktop' : 'core.component.form-builder.span.default'
    );
    return `${name} ${level.span} (${inherited})`;
  };

  /** Chuyển field sang vùng chứa khác (cuối vùng đó) — cùng lệnh với menu ⋮ của thẻ. */
  moveToContainer(choice: string | null): void {
    const id = this.#id();
    const location = this.location();
    if (!id || !location || !choice) return;
    const parentId = choice === NONE ? null : choice;
    if (parentId !== location.parentId) this.store.moveTo(id, parentId);
  }

  setExtensions(value: string): void {
    const extensions = (value ?? '')
      .split(',')
      .map(part => part.trim())
      .filter(Boolean);
    this.set('extensions', extensions.length ? extensions : undefined, true);
  }

  extensionsText = (): string => ((this.field()?.['extensions'] ?? []) as string[]).join(', ');

  /**
   * Áp một mẫu của portal: giữ `id` và bố cục hiện tại, lấy cấu hình của mẫu. Key của mẫu khác key
   * hiện tại (và chưa có ở field khác) thì đổi key qua CÙNG xác nhận Có/Không với "Áp dụng" mã —
   * tham chiếu có cấu trúc đi theo; Không thì vẫn áp cấu hình nhưng giữ key hiện tại.
   */
  async applyTemplate(value: string | null): Promise<void> {
    const template = this.templates().find(entry => entry.id === value);
    const field = this.field();
    if (!field || !template?.field || this.#renaming) return;
    const from = `${field.key ?? ''}`;
    const templateKey = template.field.key;
    let rename = !!templateKey && templateKey !== from && !collectKeys(this.store.doc(), field.id).has(templateKey);
    if (rename && from) {
      this.#renaming = true;
      try {
        await this.#confirm.confirm(this.#renameMessage(field, from, templateKey), {
          title: this.store.t('core.component.form-builder.key.confirm-title'),
          yesTitle: this.store.t('core.confirm.yes-short'),
          noTitle: this.store.t('core.confirm.no-short'),
        });
      } catch {
        rename = false;
      } finally {
        this.#renaming = false;
      }
      // why: hộp thoại là bất đồng bộ — người dùng có thể đã chọn field khác.
      if (this.field()?.id !== field.id) return;
    }
    const nextKey = rename ? templateKey : null;
    this.store.applyTemplate(
      field.id,
      item => {
        const next = cloneJson(template.field) as AnyField;
        const current = item as AnyField;
        // why: field chưa có key nhận luôn key của mẫu (không có tham chiếu nào để đổi).
        next.key = rename && !from ? templateKey : current.key;
        if (current.layout) next.layout = cloneJson(current.layout);
        return { ...next, id: field.id } as BuilderItem;
      },
      from ? nextKey : null
    );
  }

  /** Chọn html definition của portal (nội dung do portal cấp) hoặc bỏ chọn để nhập nội dung tĩnh. */
  applyHtmlDefinition(value: string | null): void {
    this.#update(next => {
      delete next['query'];
      delete next['variables'];
      if (value) {
        next['definition'] = value;
        delete next['content'];
      } else {
        delete next['definition'];
        next['content'] = next['content'] ?? '';
      }
    });
  }

  /** Giá trị một biến của html definition; rỗng = dùng mặc định của definition. */
  setHtmlVariable(key: string, value: string): void {
    this.#update(next => {
      const variables = { ...((next['variables'] ?? {}) as Record<string, string>) };
      if (value) variables[key] = value;
      else delete variables[key];
      if (Object.keys(variables).length) next['variables'] = variables;
      else delete next['variables'];
    }, `${this.#id()}:html-variable:${key}`);
  }

  setHtmlQuery(query: SdFormGenericParam[]): void {
    this.set('query', query?.length ? query : undefined);
  }

  // ── Mã trường ─────────────────────────────────────────────────────────────

  #renaming = false;

  /**
   * Đổi key sau khi người dùng xác nhận Có/Không. Câu xác nhận nói rõ hệ quả (tham chiếu nào tự cập
   * nhật, chỗ nào phải sửa tay, dữ liệu cũ không tự chuyển) — thay cho gợi ý thường trực trên panel.
   */
  async applyKey(): Promise<void> {
    const field = this.field();
    const from = `${field?.key ?? ''}`;
    const to = this.keyDraft().trim();
    if (!field || this.#renaming || this.keyError() || to === from) return;
    this.#renaming = true;
    try {
      await this.#confirm.confirm(this.#renameMessage(field, from, to), {
        title: this.store.t('core.component.form-builder.key.confirm-title'),
        yesTitle: this.store.t('core.confirm.yes-short'),
        noTitle: this.store.t('core.confirm.no-short'),
      });
    } catch {
      return;
    } finally {
      this.#renaming = false;
    }
    // why: hộp thoại là bất đồng bộ — chỉ đổi khi vẫn đúng field đó và bản nháp vẫn hợp lệ.
    if (this.field()?.id !== field.id || this.keyError() || this.keyDraft().trim() !== to) return;
    if (!from) {
      // Field chưa có key (vd html): gán key, không có tham chiếu nào để đổi.
      this.store.update(field.id, item => ({ ...item, key: to }) as BuilderItem);
      this.keyMessage.set(this.store.t('core.component.form-builder.key.renamed', { key: to }));
      return;
    }
    const updated = this.store.renameKey(field.id, to);
    if (updated < 0) return;
    this.keyMessage.set(
      updated
        ? this.store.t('core.component.form-builder.key.renamed-references', { key: to, count: updated })
        : this.store.t('core.component.form-builder.key.renamed', { key: to })
    );
  }

  #renameMessage(field: AnyField, from: string, to: string): string {
    const t = this.store.t;
    const code = (value: string) => `<code>${escapeHtml(value)}</code>`;
    const label = escapeHtml(this.store.labelOf(field));
    const lines = [
      from
        ? t('core.component.form-builder.key.confirm', { label, from: code(from), to: code(to) })
        : t('core.component.form-builder.key.confirm-set', { label, to: code(to) }),
    ];
    const structured = this.structuredReferences();
    const text = this.textReferences();
    if (structured) lines.push(t('core.component.form-builder.key.confirm-references', { count: structured }));
    if (text) lines.push(t('core.component.form-builder.key.confirm-manual', { count: text }));
    if (from) lines.push(t('core.component.form-builder.key.confirm-data'));
    return lines.map(line => `<p>${line}</p>`).join('');
  }

  generateKey(): void {
    const field = this.field();
    if (!field) return;
    const key = randomKey(paletteIdOf(field), collectKeys(this.store.doc(), field.id));
    this.store.update(field.id, item => ({ ...item, key }) as BuilderItem);
  }

  // ── Group ─────────────────────────────────────────────────────────────────

  pickIcon(icon: string): void {
    this.set('icon', icon);
  }

  pickColor(color: string): void {
    this.set('color', color);
  }

  /** `collapsible` của group luôn ghi rõ `true`/`false`. */
  setCollapsible(collapsible: boolean): void {
    this.#update(next => (next['collapsible'] = !!collapsible));
  }

  remove(): void {
    const id = this.#id();
    if (id) this.requestRemove.emit(id);
  }

  sealHistory(): void {
    this.store.sealHistory();
  }

  numberOrNull(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }
}
