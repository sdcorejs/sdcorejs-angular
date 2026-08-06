import { parseMarkdownDocument, parseMarkdownSections, toMarkdownBlocks } from './markdown-parser';

const markdown = `# \`<sd-button>\`

**Type**: Component
**Selector**: \`sd-button\`

## One-line purpose
Primary action button.

## Inputs
| Name | Type | Default |
| --- | --- | --- |
| \`loading\` | \`boolean\` | \`false\` |

## Examples
\`\`\`html
<sd-button title="Save"></sd-button>
\`\`\`
`;

describe('published Markdown parser', () => {
  it('extracts the document title, metadata and named sections', () => {
    const result = parseMarkdownDocument(markdown);

    expect(result.title).toBe('`<sd-button>`');
    expect(result.metadata['Type']).toBe('Component');
    expect(result.metadata['Selector']).toBe('`sd-button`');
    expect(result.sections.map((section) => section.heading)).toEqual(['One-line purpose', 'Inputs', 'Examples']);
  });

  it('keeps fenced code intact while splitting headings', () => {
    const sections = parseMarkdownSections(markdown);

    expect(sections.find((section) => section.heading === 'Examples')?.markdown).toContain(
      '<sd-button title="Save"></sd-button>',
    );
  });

  it('promotes nested composite headings into classifiable sections', () => {
    const sections = parseMarkdownSections([
      '## `<sd-splitter>`',
      'Composite component.',
      '### One-line purpose',
      'Resizable panes.',
      '### Examples',
      'A horizontal splitter.',
    ].join('\n'));

    expect(sections.map((section) => [section.level, section.heading])).toEqual([
      [2, '`<sd-splitter>`'],
      [3, 'One-line purpose'],
      [3, 'Examples'],
    ]);
  });

  it('keeps repeated composite headings deep-linkable with unique ids', () => {
    const sections = parseMarkdownSections('## First\n### Inputs\nA\n## Second\n### Inputs\nB');

    expect(sections.filter((section) => section.heading === 'Inputs').map((section) => section.id))
      .toEqual(['inputs', 'inputs-2']);
  });

  it('tokenizes semantic tables, fenced code and Markdown links without executing HTML', () => {
    const blocks = toMarkdownBlocks(`| Name | Type |\n| --- | --- |\n| value | string |\n\n[Guide](https://example.test)\n\n\`\`\`ts\nconst ok = true;\n\`\`\``);

    expect(blocks[0]?.kind).toBe('table');
    expect(blocks.some((block) => block.kind === 'paragraph' && block.text.includes('[Guide]'))).toBeTrue();
    expect(blocks.some((block) => block.kind === 'code' && block.language === 'ts')).toBeTrue();
  });

  it('keeps escaped union pipes inside a single Markdown table cell', () => {
    const [table] = toMarkdownBlocks('| Name | Type |\n| --- | --- |\n| value | `string \\| null` |');

    expect(table?.kind).toBe('table');
    if (table?.kind === 'table') {
      expect(table.rows[0]?.length).toBe(2);
      expect(table.rows[0]?.[1]).toBe('`string | null`');
    }
  });

  it('returns displayable content when expected headings are missing or malformed', () => {
    const result = parseMarkdownDocument('Plain documentation without section headings.\n\n| broken table');

    expect(result.sections.length).toBe(1);
    expect(result.sections[0]?.markdown).toContain('Plain documentation');
    expect(toMarkdownBlocks(result.sections[0]?.markdown ?? '').length).toBeGreaterThan(0);
  });
});
