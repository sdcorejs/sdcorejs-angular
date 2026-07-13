import { MarkdownBlock, MarkdownSection, ParsedMarkdownDocument } from './published-docs.models';

export function toMarkdownAnchor(value: string): string {
  return value
    .toLowerCase()
    .replace(/[`<>]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function stripTableCell(value: string): string {
  let row = value.trim();
  if (row.startsWith('|')) row = row.slice(1);

  if (row.endsWith('|')) {
    let backslashes = 0;
    for (let index = row.length - 2; index >= 0 && row[index] === '\\'; index -= 1) {
      backslashes += 1;
    }
    if (backslashes % 2 === 0) row = row.slice(0, -1);
  }

  return row.trim();
}

function splitTableRow(value: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let escaped = false;

  for (const character of stripTableCell(value)) {
    if (escaped) {
      cell += character === '|' || character === '\\' ? character : `\\${character}`;
      escaped = false;
    } else if (character === '\\') {
      escaped = true;
    } else if (character === '|') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += character;
    }
  }

  if (escaped) cell += '\\';
  cells.push(cell.trim());
  return cells;
}

function isTableDelimiter(value: string): boolean {
  const cells = splitTableRow(value);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

export function parseMarkdownSections(markdown: string): MarkdownSection[] {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const sections: MarkdownSection[] = [];
  let heading = '';
  let level = 2;
  let content: string[] = [];
  let fenced = false;
  const sectionIds = new Map<string, number>();

  const push = (): void => {
    const body = content.join('\n').trim();
    if (!heading && !body) return;
    const baseId = toMarkdownAnchor(heading || 'documentation') || 'documentation';
    const occurrence = sectionIds.get(baseId) ?? 0;
    sectionIds.set(baseId, occurrence + 1);
    sections.push({
      heading: heading || 'Documentation',
      level,
      id: occurrence ? `${baseId}-${occurrence + 1}` : baseId,
      markdown: body,
    });
    content = [];
  };

  for (const line of lines) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const match = !fenced ? /^(#{2,4})\s+(.+?)\s*$/.exec(line) : null;
    if (match) {
      push();
      heading = match[2] ?? '';
      level = match[1]?.length ?? 2;
      continue;
    }
    content.push(line);
  }
  push();

  return sections;
}

export function parseMarkdownDocument(markdown: string): ParsedMarkdownDocument {
  const normalized = markdown.replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  const titleIndex = lines.findIndex((line) => /^#\s+/.test(line));
  const title = titleIndex >= 0 ? lines[titleIndex]?.replace(/^#\s+/, '').trim() ?? '' : 'Documentation';
  const firstSection = lines.findIndex((line) => /^##\s+/.test(line));
  const preambleEnd = firstSection >= 0 ? firstSection : lines.length;
  const metadata: Record<string, string> = {};

  for (const line of lines.slice(Math.max(0, titleIndex + 1), preambleEnd)) {
    const match = /^\*\*([^*]+)\*\*:\s*(.+?)\s*$/.exec(line);
    if (match?.[1] && match[2]) metadata[match[1].trim()] = match[2].trim();
  }

  const sectionSource = firstSection >= 0
    ? lines.slice(firstSection).join('\n')
    : lines.filter((_, index) => index !== titleIndex).join('\n');

  return {
    title,
    metadata,
    sections: parseMarkdownSections(sectionSource),
    raw: normalized,
  };
}

export function toMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = /^```\s*([^\s]*)/.exec(line);
    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index] ?? '')) {
        code.push(lines[index] ?? '');
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({ kind: 'code', language: fence[1] ?? '', code: code.join('\n') });
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      const text = heading[2] ?? '';
      blocks.push({ kind: 'heading', level: heading[1]?.length ?? 2, text, id: toMarkdownAnchor(text) });
      index += 1;
      continue;
    }

    if (line.includes('|') && index + 1 < lines.length && isTableDelimiter(lines[index + 1] ?? '')) {
      const headers = splitTableRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && (lines[index] ?? '').includes('|') && (lines[index] ?? '').trim()) {
        rows.push(splitTableRow(lines[index] ?? ''));
        index += 1;
      }
      blocks.push({ kind: 'table', headers, rows });
      continue;
    }

    const listMatch = /^\s*(?:([-*+])|(\d+)\.)\s+(.+)$/.exec(line);
    if (listMatch) {
      const ordered = !!listMatch[2];
      const items: string[] = [];
      while (index < lines.length) {
        const item = /^\s*(?:([-*+])|(\d+)\.)\s+(.+)$/.exec(lines[index] ?? '');
        if (!item || !!item[2] !== ordered) break;
        items.push(item[3] ?? '');
        index += 1;
      }
      blocks.push({ kind: 'list', ordered, items });
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index] ?? '')) {
        quote.push((lines[index] ?? '').replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push({ kind: 'quote', text: quote.join(' ') });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && (lines[index] ?? '').trim()) {
      const current = lines[index] ?? '';
      if (paragraph.length > 0 && (/^```/.test(current) || /^#{1,6}\s+/.test(current))) break;
      paragraph.push(current.trim());
      index += 1;
    }
    blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
  }

  return blocks;
}
