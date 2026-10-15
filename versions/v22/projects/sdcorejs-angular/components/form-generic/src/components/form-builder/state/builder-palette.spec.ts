import { SD_DATA_TYPE_ICON, type SdDataTypeIconKey } from '@sdcorejs/angular/modules/icon';
import { SD_FORM_BUILDER_PALETTE, type PaletteCreateContext } from './builder-palette';

const context: PaletteCreateContext = { takenKeys: new Set<string>(), t: key => key };
const item = (id: string) => SD_FORM_BUILDER_PALETTE.find(entry => entry.id === id);

describe('form builder palette · time and json', () => {
  it('offers a time preset in the date/time group that creates a time field', () => {
    const preset = item('time');
    expect(preset).toBeDefined();
    expect(preset!.category).toBe('datetime');
    expect(preset!.type).toBe('time');
    expect(preset!.labelKey).toBe('core.component.form-builder.preset.time');
    const created = preset!.create(context) as unknown as Record<string, unknown>;
    expect(created['type']).toBe('time');
    expect(typeof created['key']).toBe('string');
  });

  it('offers a json preset in the advanced group that creates a json field', () => {
    const preset = item('json');
    expect(preset).toBeDefined();
    expect(preset!.category).toBe('advanced');
    expect(preset!.type).toBe('json');
    expect(preset!.labelKey).toBe('core.component.form-builder.preset.json');
    const created = preset!.create(context) as unknown as Record<string, unknown>;
    expect(created['type']).toBe('json');
  });

  it('keeps preset ids unique', () => {
    const ids = SD_FORM_BUILDER_PALETTE.map(entry => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('form builder palette · icons', () => {
  // why: the palette moved to the shared data-type icon set; the icons the builder shows must not change (AC-008).
  const ICONS: Record<string, string> = {
    text: 'text_fields',
    email: 'mail',
    phone: 'call',
    url: 'link',
    password: 'lock',
    textarea: 'notes',
    integer: 'pin',
    decimal: 'calculate',
    currency: 'payments',
    percent: 'percent',
    select: 'arrow_drop_down_circle',
    multiselect: 'checklist',
    radio: 'radio_button_checked',
    checkbox: 'check_box',
    date: 'calendar_month',
    datetime: 'schedule',
    time: 'access_time',
    'chip-string': 'label',
    'chip-calendar': 'event_note',
    upload: 'upload_file',
    json: 'data_object',
    group: 'category',
    html: 'article',
  };
  const DATA_ITEMS: Record<string, SdDataTypeIconKey> = {
    text: 'string',
    email: 'email',
    phone: 'phone',
    url: 'url',
    password: 'password',
    textarea: 'text',
    integer: 'integer',
    decimal: 'decimal',
    currency: 'currency',
    percent: 'percent',
    select: 'enum',
    multiselect: 'enum-multiple',
    checkbox: 'boolean',
    date: 'date',
    datetime: 'datetime',
    time: 'time',
    'chip-string': 'string-multiple',
    'chip-calendar': 'date-multiple',
    upload: 'file',
    json: 'json',
  };

  it('keeps every palette icon unchanged (AC-008)', () => {
    expect(Object.fromEntries(SD_FORM_BUILDER_PALETTE.map(entry => [entry.id, entry.icon]))).toEqual(ICONS);
  });

  it('shows the shared data-type icon on every data item (INV-003)', () => {
    for (const [id, key] of Object.entries(DATA_ITEMS)) expect(item(id)!.icon).withContext(id).toBe(SD_DATA_TYPE_ICON[key]);
  });
});
