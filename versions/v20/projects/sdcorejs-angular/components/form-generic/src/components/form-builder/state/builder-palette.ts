import type { SdFormGenericField, SdFormGenericLayout } from '../../../models/form-generic-field.model';
import type { SdFormGenericGroup } from '../../../models/form-generic-schema.model';
import { BuilderItem, createId, randomKey } from './builder-document';

/** Nhóm của palette. */
export type PaletteCategory = 'basic' | 'number' | 'choice' | 'datetime' | 'advanced' | 'layout';

export const PALETTE_CATEGORIES: readonly PaletteCategory[] = ['basic', 'number', 'choice', 'datetime', 'advanced', 'layout'];

/** Dịch key i18n (truyền từ component để palette không phụ thuộc DI). */
export type PaletteTranslate = (key: string, params?: Record<string, string | number>) => string;

export interface PaletteCreateContext {
  /** Key đang dùng trong form — key mới không được trùng. */
  readonly takenKeys: ReadonlySet<string>;
  readonly t: PaletteTranslate;
}

/**
 * Một mục palette. `id` riêng theo PRESET — nhiều preset cùng map vào `textfield`/`number`, nên
 * palette không bao giờ định danh mục chỉ bằng `type`.
 */
export interface PaletteItem {
  readonly id: string;
  readonly category: PaletteCategory;
  /** Tên icon Material Icons Outlined. */
  readonly icon: string;
  /** Key i18n của tên hiển thị. */
  readonly labelKey: string;
  /** Từ khoá tìm kiếm phụ (không dịch — type/preset kỹ thuật). */
  readonly keywords: readonly string[];
  /** `type` schema tạo ra — để hiển thị, KHÔNG phải định danh. */
  readonly type: BuilderItem['type'];
  readonly create: (context: PaletteCreateContext) => BuilderItem;
}

const LABEL = (preset: string) => `core.component.form-builder.preset.${preset}`;
const PLACEHOLDER = (preset: string) => `core.component.form-builder.preset.${preset}.placeholder`;

/** Bố cục mặc định của field mới: cả hàng ở mọi mức (desktop 12, tablet theo desktop, mobile 12). */
const newLayout = (): SdFormGenericLayout => ({ span: { desktop: 12 } });

const field = (
  context: PaletteCreateContext,
  preset: string,
  shape: Record<string, any>,
  options: { placeholder?: boolean } = {}
): SdFormGenericField =>
  ({
    id: createId(),
    key: randomKey(preset, context.takenKeys),
    label: context.t(LABEL(preset)),
    ...(options.placeholder ? { placeholder: context.t(PLACEHOLDER(preset)) } : {}),
    layout: newLayout(),
    ...shape,
  }) as SdFormGenericField;

const sampleOptions = (context: PaletteCreateContext) => ({
  source: 'static' as const,
  items: [
    { value: 'option_1', label: context.t('core.component.form-builder.preset.option', { index: 1 }) },
    { value: 'option_2', label: context.t('core.component.form-builder.preset.option', { index: 2 }) },
  ],
});

/**
 * Palette của builder. Preset TÁI SỬ DỤNG type/control nền của schema (`textfield` + `subtype`,
 * `number` + `subtype`) — không có component/runtime riêng cho từng preset.
 */
export const SD_FORM_BUILDER_PALETTE: readonly PaletteItem[] = [
  // ── Cơ bản ────────────────────────────────────────────────────────────────
  {
    id: 'text',
    category: 'basic',
    icon: 'text_fields',
    labelKey: LABEL('text'),
    keywords: ['textfield', 'text', 'input'],
    type: 'textfield',
    create: c => field(c, 'text', { type: 'textfield', subtype: 'text' }),
  },
  {
    id: 'email',
    category: 'basic',
    icon: 'mail',
    labelKey: LABEL('email'),
    keywords: ['textfield', 'email', 'mail'],
    type: 'textfield',
    create: c => field(c, 'email', { type: 'textfield', subtype: 'email' }, { placeholder: true }),
  },
  {
    id: 'phone',
    category: 'basic',
    icon: 'call',
    labelKey: LABEL('phone'),
    keywords: ['textfield', 'phone', 'tel'],
    type: 'textfield',
    create: c => field(c, 'phone', { type: 'textfield', subtype: 'phone' }, { placeholder: true }),
  },
  {
    id: 'url',
    category: 'basic',
    icon: 'link',
    labelKey: LABEL('url'),
    keywords: ['textfield', 'url', 'link', 'website'],
    type: 'textfield',
    create: c => field(c, 'url', { type: 'textfield', subtype: 'url' }, { placeholder: true }),
  },
  {
    id: 'password',
    category: 'basic',
    icon: 'lock',
    labelKey: LABEL('password'),
    keywords: ['textfield', 'password'],
    type: 'textfield',
    create: c => field(c, 'password', { type: 'textfield', subtype: 'password' }),
  },
  {
    id: 'textarea',
    category: 'basic',
    icon: 'notes',
    labelKey: LABEL('textarea'),
    keywords: ['textarea', 'multiline'],
    type: 'textarea',
    create: c => field(c, 'textarea', { type: 'textarea' }),
  },
  // ── Số ────────────────────────────────────────────────────────────────────
  {
    id: 'integer',
    category: 'number',
    icon: 'pin',
    labelKey: LABEL('integer'),
    keywords: ['number', 'integer'],
    type: 'number',
    create: c => field(c, 'integer', { type: 'number', subtype: 'integer' }),
  },
  {
    id: 'decimal',
    category: 'number',
    icon: 'calculate',
    labelKey: LABEL('decimal'),
    keywords: ['number', 'decimal', 'float'],
    type: 'number',
    create: c => field(c, 'decimal', { type: 'number', subtype: 'decimal', precision: 2 }),
  },
  {
    id: 'currency',
    category: 'number',
    icon: 'payments',
    labelKey: LABEL('currency'),
    keywords: ['number', 'currency', 'money', 'amount'],
    type: 'number',
    create: c =>
      field(c, 'currency', {
        type: 'number',
        subtype: 'currency',
        validation: { min: 0 },
        currency: 'VND',
        precision: 0,
      }),
  },
  {
    id: 'percent',
    category: 'number',
    icon: 'percent',
    labelKey: LABEL('percent'),
    keywords: ['number', 'percent', 'rate'],
    type: 'number',
    create: c =>
      field(c, 'percent', {
        type: 'number',
        subtype: 'percent',
        validation: { min: 0, max: 100 },
        precision: 2,
      }),
  },
  // ── Lựa chọn ──────────────────────────────────────────────────────────────
  {
    id: 'select',
    category: 'choice',
    icon: 'arrow_drop_down_circle',
    labelKey: LABEL('select'),
    keywords: ['select', 'dropdown'],
    type: 'select',
    create: c => field(c, 'select', { type: 'select', options: sampleOptions(c), multiple: false }),
  },
  {
    id: 'multiselect',
    category: 'choice',
    icon: 'checklist',
    labelKey: LABEL('multiselect'),
    keywords: ['select', 'multiple'],
    type: 'select',
    create: c => field(c, 'multiselect', { type: 'select', options: sampleOptions(c), multiple: true }),
  },
  {
    id: 'radio',
    category: 'choice',
    icon: 'radio_button_checked',
    labelKey: LABEL('radio'),
    keywords: ['radio', 'option'],
    type: 'radio',
    create: c => field(c, 'radio', { type: 'radio', options: sampleOptions(c), direction: 'row' }),
  },
  {
    id: 'checkbox',
    category: 'choice',
    icon: 'check_box',
    labelKey: LABEL('checkbox'),
    keywords: ['checkbox', 'boolean', 'agree'],
    type: 'checkbox',
    create: c => field(c, 'checkbox', { type: 'checkbox' }),
  },
  // ── Ngày giờ ──────────────────────────────────────────────────────────────
  {
    id: 'date',
    category: 'datetime',
    icon: 'calendar_month',
    labelKey: LABEL('date'),
    keywords: ['datetime', 'date'],
    type: 'datetime',
    create: c => field(c, 'date', { type: 'datetime', subtype: 'date' }),
  },
  {
    id: 'datetime',
    category: 'datetime',
    icon: 'schedule',
    labelKey: LABEL('datetime'),
    keywords: ['datetime', 'time'],
    type: 'datetime',
    create: c => field(c, 'datetime', { type: 'datetime', subtype: 'datetime' }),
  },
  // ── Nâng cao ──────────────────────────────────────────────────────────────
  {
    id: 'chip-string',
    category: 'advanced',
    icon: 'label',
    labelKey: LABEL('chip-string'),
    keywords: ['chip', 'tags'],
    type: 'chip-string',
    create: c => field(c, 'chip-string', { type: 'chip-string' }),
  },
  {
    id: 'chip-calendar',
    category: 'advanced',
    icon: 'event_note',
    labelKey: LABEL('chip-calendar'),
    keywords: ['chip', 'dates'],
    type: 'chip-calendar',
    create: c => field(c, 'chip-calendar', { type: 'chip-calendar' }),
  },
  {
    id: 'upload',
    category: 'advanced',
    icon: 'upload_file',
    labelKey: LABEL('upload'),
    keywords: ['upload', 'file', 'image'],
    type: 'upload',
    create: c => field(c, 'upload', { type: 'upload', accept: 'file', source: 'ALL' }),
  },
  // ── Bố cục ────────────────────────────────────────────────────────────────
  {
    id: 'group',
    category: 'layout',
    icon: 'category',
    labelKey: LABEL('group'),
    keywords: ['group', 'section'],
    type: 'group',
    create: c =>
      ({
        id: createId(),
        type: 'group',
        label: c.t(LABEL('group')),
        icon: 'category',
        color: 'primary',
        collapsible: false,
        elements: [],
      }) as SdFormGenericGroup,
  },
  {
    id: 'html',
    category: 'layout',
    icon: 'article',
    labelKey: LABEL('html'),
    keywords: ['html', 'content', 'text'],
    type: 'html',
    create: c =>
      ({
        id: createId(),
        type: 'html',
        label: c.t(LABEL('html')),
        content: `<p>${escapeHtml(c.t('core.component.form-builder.preset.html.content'))}</p>`,
        layout: newLayout(),
      }) as SdFormGenericField,
  },
];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string);
}

/** Icon hiển thị của một phần tử trên canvas/cấu trúc/inspector — theo preset nếu có. */
export const itemIcon = (item: BuilderItem): string => {
  if (item.type === 'group') return item.icon || 'category';
  const presetId = paletteIdOf(item);
  return SD_FORM_BUILDER_PALETTE.find(entry => entry.id === presetId)?.icon ?? 'help';
};

/** Preset (id palette) tương ứng với một phần tử có sẵn — dùng để đặt tên loại, icon. */
export const paletteIdOf = (item: BuilderItem): string => {
  switch (item.type) {
    case 'textfield':
      return item.subtype && item.subtype !== 'text' ? item.subtype : 'text';
    case 'number':
      return item.subtype ?? 'number';
    case 'select':
      return item.multiple ? 'multiselect' : 'select';
    case 'datetime':
      return item.subtype === 'datetime' ? 'datetime' : 'date';
    default:
      return item.type;
  }
};

/** Key i18n tên loại của phần tử (vd "Email", "Tiền tệ"). */
export const itemTypeLabelKey = (item: BuilderItem): string => {
  const presetId = paletteIdOf(item);
  if (presetId === 'number') return 'core.component.form-builder.preset.number';
  // why: an element type this version does not know (added by a later phase) has no preset label.
  if (!SD_FORM_BUILDER_PALETTE.some(entry => entry.id === presetId)) return 'core.component.form-builder.unsupported';
  return LABEL(presetId);
};
