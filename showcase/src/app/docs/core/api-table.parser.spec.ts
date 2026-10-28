import {
  apiRowsOfMarkdown,
  isApiTable,
  matchesApiQuery,
  parseApiMethod,
  sharedOptionNames,
  splitUnion,
  typeChips,
} from './api-table.parser';

const CONFIRM = [
  'Plain confirm dialog. Resolves with `result.value` on accept.',
  '',
  '```typescript',
  'confirm(',
  '  message: string,',
  '  option?: {',
  "    icon?: string;                   // optional; blank uses the contextual default",
  "    iconShape?: SdIconShape;         // 'square' | 'circle' | 'none'; default: 'square'",
  "    title?: string;                  // default: 'Xác nhận'",
  "    width?: string;                  // default: '440px'",
  '    disableBackdropClose?: boolean;  // default: true',
  '  }',
  '): Promise<unknown>;',
  '```',
].join('\n');

const WITH_INPUT = [
  'Confirm dialog with a text input.',
  '',
  '```typescript',
  'withInput(',
  '  message?: string,',
  '  option?: {',
  '    icon?: string;',
  "    title?: string;                  // default: 'Xác nhận'",
  '    required?: boolean;',
  '    maxlength?: number;              // default: 255',
  '    disableBackdropClose?: boolean;  // default: true',
  '  }',
  '): Promise<string>;',
  '```',
].join('\n');

describe('API method parser', () => {
  it('reads the signature, description and options of a method section', () => {
    const method = parseApiMethod('`confirm(message, option?): Promise<unknown>`', CONFIRM, 'public-api');

    expect(method?.id).toBe('api-public-api-confirm');
    expect(method?.params).toBe('(message, option?)');
    expect(method?.returns).toBe('Promise<unknown>');
    expect(method?.description).toContain('Plain confirm dialog');
    expect(method?.options.map(option => option.name)).toEqual(['icon', 'iconShape', 'title', 'width', 'disableBackdropClose']);
    expect(method?.options[1]).toEqual(
      jasmine.objectContaining({ defaultValue: "'square'", description: "'square' | 'circle' | 'none'" })
    );
    expect(method?.options[0].description).toBe('optional; blank uses the contextual default');
    expect(method?.options[4].types.map(type => type.text)).toEqual(['boolean']);
  });

  it('ignores headings that are not method signatures', () => {
    expect(parseApiMethod('Configuration / DI tokens', 'text')).toBeNull();
  });

  it('collects options every method shares', () => {
    const methods = [
      parseApiMethod('`confirm(message, option?): Promise<unknown>`', CONFIRM),
      parseApiMethod('`withInput(message?, option?): Promise<string>`', WITH_INPUT),
    ].filter(method => method !== null);

    expect([...sharedOptionNames(methods)]).toEqual(['icon', 'title', 'disableBackdropClose']);
    expect(sharedOptionNames(methods.slice(0, 1)).size).toBe(0);
  });
});

const INPUTS = [
  '| Name | Type | Default | Notes |',
  '| --- | --- | --- | --- |',
  "| `type` | `'fill' \\| 'light' \\| 'outline' \\| 'text'` | `'light'` | Visual variant. `fill`=primary action. |",
  '| `autoId` | `string \\| null \\| undefined` | `undefined` | Generates `data-autoId`. |',
  '| `disabled` | `boolean` | `false` | Disables clicks. |',
  '| `onSelect` | `(item: Item \\| null) => void` | — | Callback. |',
  '',
  '> **Coerce note**: `disabled` uses `booleanAttribute` transform.',
].join('\n');

describe('API table parser', () => {
  it('recognises member tables and leaves other tables alone', () => {
    expect(isApiTable(['Name', 'Type', 'Default', 'Notes'])).toBeTrue();
    expect(isApiTable(['Output', 'Payload', 'Notes'])).toBeTrue();
    expect(isApiTable(['Slot', 'Purpose'])).toBeTrue();
    expect(isApiTable(['Class', 'Condition', 'Effect'])).toBeFalse();
    expect(isApiTable(['Key', 'VI', 'EN'])).toBeFalse();
  });

  it('splits unions only at the top level', () => {
    expect(splitUnion("'fill' | 'light'")).toEqual(["'fill'", "'light'"]);
    expect(splitUnion('(item: Item | null) => void')).toEqual(['(item: Item | null) => void']);
    expect(splitUnion('Array<string | number> | null')).toEqual(['Array<string | number>', 'null']);
    expect(splitUnion("'a|b' | 'c'")).toEqual(["'a|b'", "'c'"]);
  });

  it('marks string literals so they can use the string colour', () => {
    expect(typeChips("`'sm' | 'md'`")).toEqual([
      { text: "'sm'", literal: true },
      { text: "'md'", literal: true },
    ]);
    expect(typeChips('`SdButtonColor` = `Color | black`')).toEqual([{ text: 'SdButtonColor', literal: false }]);
    expect(typeChips('—')).toEqual([]);
  });

  it('turns each table row into one API row with a stable id, chips, flag and default', () => {
    const rows = apiRowsOfMarkdown(INPUTS, 'inputs');

    expect(rows.map(row => row.id)).toEqual(['api-inputs-type', 'api-inputs-autoId', 'api-inputs-disabled', 'api-inputs-onSelect']);
    expect(rows[0].types.map(type => type.text)).toEqual(["'fill'", "'light'", "'outline'", "'text'"]);
    expect(rows[0].defaultValue).toBe("'light'");
    expect(rows[0].description).toBe('Visual variant. `fill`=primary action.');
    expect(rows[1].types.map(type => type.text)).toEqual(['string', 'null', 'undefined']);
    expect(rows[2].flag).toBe('booleanAttribute');
    expect(rows[0].flag).toBeNull();
    expect(rows[3].defaultValue).toBeNull();
    expect(rows[3].types.length).toBe(1);
  });

  it('keeps columns without a slot in the description and reads return and value columns as types', () => {
    const [field] = apiRowsOfMarkdown(
      ['| Field | Type | Required | Notes |', '| --- | --- | --- | --- |', '| `key` | `string` | yes | Row key. |'].join('\n'),
      'fields'
    );
    const [method] = apiRowsOfMarkdown(
      ['| Method | Returns | Notes |', '| --- | --- | --- |', '| `open()` | `Promise<void>` | Opens the editor. |'].join('\n'),
      'methods'
    );
    const [parameter] = apiRowsOfMarkdown(
      ['| Parameter | Accepted values | Default |', '| --- | --- | --- |', "| `size` | `'sm' \\| 'md'` | `'md'` |"].join('\n'),
      'parameters'
    );

    expect(field.description).toBe('Row key. · **Required:** yes');
    expect(method.types.map(type => type.text)).toEqual(['Promise<void>']);
    expect(parameter.types.map(type => type.text)).toEqual(["'sm'", "'md'"]);
    expect(parameter.defaultValue).toBe("'md'");
    expect(parameter.description).toBe('');
  });

  it('filters by name, type or description', () => {
    const [type, autoId, disabled] = apiRowsOfMarkdown(INPUTS, 'inputs');

    expect(matchesApiQuery(type, 'outline')).toBeTrue();
    expect(matchesApiQuery(autoId, 'null')).toBeTrue();
    expect(matchesApiQuery(disabled, 'clicks')).toBeTrue();
    expect(matchesApiQuery(disabled, 'outline')).toBeFalse();
    expect(matchesApiQuery(disabled, '  ')).toBeTrue();
  });
});
