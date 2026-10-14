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
