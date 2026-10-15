import { TestBed } from '@angular/core/testing';
import { setInput } from '../../../testing/test-utils';
import { SD_DATA_TYPE_ICON, SD_DATA_TYPE_LABEL, SD_DATA_TYPE_LUCIDE_ICONS, sdDataTypeIcon, type SdDataTypeIconKey } from './data-type-icon';
import { SdIcon } from './icon.component';
import { SD_DEFAULT_LUCIDE_ALIASES, SD_DEFAULT_MATERIAL_ALIASES, type SdLucideIconRegistration } from './icon.model';
import { provideSdIcon } from './icon.provider';

/** [Material name, Lucide target] of every key, as approved in the architecture (D-013, D-015). */
const EXPECTED: Record<SdDataTypeIconKey, readonly [string, string]> = {
  string: ['text_fields', 'text'],
  'string-list': ['label', 'tag'],
  email: ['mail', 'mail'],
  phone: ['call', 'phone'],
  url: ['link', 'link'],
  password: ['lock', 'lock-keyhole'],
  text: ['notes', 'align-left'],
  number: ['numbers', 'hash'],
  integer: ['pin', 'binary'],
  decimal: ['calculate', 'calculator'],
  currency: ['payments', 'banknote'],
  percent: ['percent', 'percent'],
  boolean: ['check_box', 'square-check'],
  date: ['calendar_month', 'calendar-days'],
  'date-list': ['event_note', 'calendar-range'],
  datetime: ['schedule', 'clock'],
  time: ['access_time', 'clock'],
  enum: ['arrow_drop_down_circle', 'circle-chevron-down'],
  'enum-multiple': ['checklist', 'list-checks'],
  relation: ['hub', 'network'],
  json: ['data_object', 'braces'],
  file: ['upload_file', 'upload'],
};
const KEYS = Object.keys(EXPECTED) as SdDataTypeIconKey[];

function lucideNames(registration: SdLucideIconRegistration): string[] {
  // why: một registration có thể là class icon (mang `static icon`) hoặc dữ liệu path thuần.
  const data = ('icon' in registration ? registration.icon : registration) as { name: string; aliases?: string[] };
  return [data.name, ...(data.aliases ?? [])];
}

describe('data-type icon set', () => {
  it('declares exactly the 22 data-type keys', () => {
    expect(Object.keys(SD_DATA_TYPE_ICON).sort()).toEqual([...KEYS].sort());
    expect(Object.keys(SD_DATA_TYPE_LABEL).sort()).toEqual([...KEYS].sort());
  });

  it('maps every key to its Material name', () => {
    for (const key of KEYS) expect(SD_DATA_TYPE_ICON[key]).withContext(key).toBe(EXPECTED[key][0]);
  });

  it('resolves a key through sdDataTypeIcon and falls back to tune', () => {
    for (const key of KEYS) expect(sdDataTypeIcon(key)).withContext(key).toBe(EXPECTED[key][0]);
    expect(sdDataTypeIcon('unknown-type')).toBe('tune');
    expect(sdDataTypeIcon('')).toBe('tune');
    expect(sdDataTypeIcon(null)).toBe('tune');
    expect(sdDataTypeIcon(undefined)).toBe('tune');
  });

  it('keeps every Material name free of a Material alias', () => {
    // why: `SdIcon` áp alias Material lên mọi tên — `tag` từng bị đổi thành `local_offer` (D-013).
    for (const key of KEYS) expect(SD_DEFAULT_MATERIAL_ALIASES[SD_DATA_TYPE_ICON[key]]).withContext(key).toBeUndefined();
  });

  it('maps every Material name to its Lucide target', () => {
    for (const key of KEYS) {
      const name = SD_DATA_TYPE_ICON[key];
      expect(SD_DEFAULT_LUCIDE_ALIASES[name] ?? name)
        .withContext(key)
        .toBe(EXPECTED[key][1]);
    }
  });

  it('ships a Lucide registration for every target', () => {
    const registered = new Set(SD_DATA_TYPE_LUCIDE_ICONS.flatMap(lucideNames));
    for (const key of KEYS) expect(registered.has(EXPECTED[key][1])).withContext(key).toBeTrue();
  });

  it('labels every key with an i18n key core.data-type.<key>', () => {
    for (const key of KEYS) expect(SD_DATA_TYPE_LABEL[key]).withContext(key).toBe(`core.data-type.${key}`);
  });

  it('renders every data-type icon as an svg under the Lucide renderer', async () => {
    await TestBed.configureTestingModule({
      imports: [SdIcon],
      providers: [provideSdIcon({ defaultFontSet: 'lucide', lucideIcons: [...SD_DATA_TYPE_LUCIDE_ICONS] })],
    }).compileComponents();

    for (const key of KEYS) {
      const fixture = TestBed.createComponent(SdIcon);
      setInput(fixture, 'name', sdDataTypeIcon(key));
      const svg = (fixture.nativeElement as HTMLElement).querySelector('svg.sd-icon__svg');
      expect(svg?.querySelector('path, rect, circle, line, polyline, polygon, ellipse')).withContext(key).not.toBeNull();
      fixture.destroy();
    }
  });
});
