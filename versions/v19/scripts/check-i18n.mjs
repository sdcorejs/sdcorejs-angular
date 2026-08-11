import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = 'projects/sdcorejs-angular';
export const VIETNAMESE_CHARACTER =
  /[ÀÁẢÃẠẰẮẲẴẶÂẦẤẨẪẬĂÈÉẺẼẸỀẾỂỄỆÊÌÍỈĨỊÒÓỎÕỌỒỐỔỖỘÔỜỚỞỠỢƠÙÚỦŨỤỪỨỬỮỰƯỲÝỶỸỴĐàáảãạằắẳẵặâầấẩẫậăèéẻẽẹềếểễệêìíỉĩịòóỏõọồốổỗộôờớởỡợơùúủũụừứửữựưỳýỷỹỵđ]/;
const WHITELIST = [
  /\/i18n\/src\/vi\.ts$/,
  /\.spec\.ts$/,
  // vendor blob (minified pdf.js worker as one string literal) — same exclusion the lint config uses
  /\/pdf-worker-inline\.generated\.ts$/,
];
// `// @i18n-ignore` on the flagged line or the line right above it marks a
// deliberate non-UX Vietnamese literal (dev-facing console text, diagnostics).
// Documented in i18n/i18n.md ("When NOT to use").
export const IGNORE_MARKER = '@i18n-ignore';

// Existing localization debt is tracked as a per-file ceiling instead of a
// broad directory whitelist. New files fail immediately, and an existing file
// may only reduce (never increase) its debt without an intentional review.
const LEGACY_VIETNAMESE_BUDGET = Object.freeze({
  'projects/sdcorejs-angular/components/autoid-inspector/src/autoid-inspector.component.html': 37,
  'projects/sdcorejs-angular/components/autoid-inspector/src/autoid-inspector.component.ts': 3,
  'projects/sdcorejs-angular/components/autoid-inspector/src/services/autoid-scanner.service.ts': 1,
  'projects/sdcorejs-angular/components/code-editor/src/code-editor.component.ts': 1,
  'projects/sdcorejs-angular/components/form-generic/src/models/form-generic-component.model.ts': 10,
  'projects/sdcorejs-angular/components/form-generic/src/models/form-generic-expression.model.ts': 24,
  'projects/sdcorejs-angular/components/form-generic/src/models/form-generic-validation.model.ts': 2,
  'projects/sdcorejs-angular/components/modal-resizable/src/modal-resizable.component.html': 5,
  'projects/sdcorejs-angular/components/query-bar/src/components/chip-popover/chip-popover.component.html': 15,
  'projects/sdcorejs-angular/components/query-bar/src/components/field-picker/field-picker.component.html': 1,
  'projects/sdcorejs-angular/components/query-bar/src/components/saved-filters-menu/saved-filters-menu.component.html': 4,
  'projects/sdcorejs-angular/components/query-bar/src/components/saved-filters-menu/saved-filters-menu.component.ts': 1,
  'projects/sdcorejs-angular/components/table/src/models/table-item.model.ts': 2,
  'projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.html': 2,
  'projects/sdcorejs-angular/forms/date-range/src/date-range.component.html': 1,
  'projects/sdcorejs-angular/forms/date/src/date.component.html': 2,
  'projects/sdcorejs-angular/forms/datetime/src/datetime.component.html': 2,
  'projects/sdcorejs-angular/forms/input-color/src/input-color.component.html': 3,
  'projects/sdcorejs-angular/forms/input-number/src/input-number.component.html': 1,
  'projects/sdcorejs-angular/forms/input/src/input.component.html': 1,
  'projects/sdcorejs-angular/forms/models/src/sd-form-control-connector.ts': 4,
  'projects/sdcorejs-angular/forms/select/src/select.component.html': 3,
  'projects/sdcorejs-angular/modules/keycloak/htmls/auth-keycloak-error.html': 5,
  'projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/menu-tree.component.html': 1,
  'projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html': 6,
  'projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts': 1,
  'projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html': 5,
  'projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html': 4,
  'projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html': 3,
  'projects/sdcorejs-angular/services/api/src/api.module.ts': 3,
  'projects/sdcorejs-angular/services/notify/src/components/toast-container.component.ts': 2,
  'projects/sdcorejs-angular/utilities/extensions/src/utility.extension.ts': 9,
});

// why: kí tự đứng trước một dấu `/` quyết định nó là phép chia hay MỞ ĐẦU regex literal.
// Sau identifier / số / `)` / `]` là phép chia; sau toán tử, `(`, `,`, `=`, `return`… là regex.
// Thiếu nhánh này thì một regex chứa quote/backtick (vd `changeAliasLowerCase`) đẩy máy trạng
// thái vào 'string' vĩnh viễn và MỌI comment phía sau bị đếm như code.
function isRegexStart(previousCode) {
  const trimmed = previousCode.trimEnd();
  if (trimmed === '') return true;
  const last = trimmed[trimmed.length - 1];
  if (/[A-Za-z0-9_$)\]]/.test(last)) {
    // `return /.../` — keyword ngay trước vẫn là vị trí regex hợp lệ
    return /\b(return|typeof|instanceof|in|of|case|do|else|void|new|delete|yield|await)$/.test(trimmed);
  }
  return true;
}

export function withoutTypeScriptComments(source) {
  let result = '';
  let state = 'code';
  let quote = '';

  for (let index = 0; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1];

    if (state === 'line-comment') {
      if (current === '\n') {
        result += current;
        state = 'code';
      } else {
        result += ' ';
      }
      continue;
    }

    if (state === 'block-comment') {
      if (current === '*' && next === '/') {
        result += '  ';
        index += 1;
        state = 'code';
      } else {
        result += current === '\n' ? '\n' : ' ';
      }
      continue;
    }

    if (state === 'string') {
      result += current;
      if (current === '\\') {
        if (next !== undefined) {
          result += next;
          index += 1;
        }
      } else if (current === quote) {
        state = 'code';
      }
      continue;
    }

    if (state === 'regex') {
      result += current;
      if (current === '\\') {
        if (next !== undefined) {
          result += next;
          index += 1;
        }
      } else if (current === '[') {
        quote = ']'; // trong character class, `/` không kết thúc regex
      } else if (current === ']' && quote === ']') {
        quote = '';
      } else if (current === '/' && quote !== ']') {
        state = 'code';
      } else if (current === '\n') {
        state = 'code'; // regex literal không có newline — thoát an toàn nếu đoán sai
      }
      continue;
    }

    if (current === '/' && next === '/') {
      result += '  ';
      index += 1;
      state = 'line-comment';
    } else if (current === '/' && next === '*') {
      result += '  ';
      index += 1;
      state = 'block-comment';
    } else if (current === '/' && isRegexStart(result.slice(result.lastIndexOf('\n') + 1))) {
      result += current;
      quote = '';
      state = 'regex';
    } else {
      result += current;
      if (current === "'" || current === '"' || current === '`') {
        quote = current;
        state = 'string';
      }
    }
  }

  return result;
}

export function withoutHtmlComments(source) {
  return source.replace(/<!--[\s\S]*?-->/g, match => match.replace(/[^\n]/g, ' '));
}

export function findViolations(original, { html = false } = {}) {
  const searchable = html ? withoutHtmlComments(original) : withoutTypeScriptComments(original);
  const sourceLines = original.split('\n');
  const searchableLines = searchable.split('\n');
  const violations = [];

  for (let index = 0; index < searchableLines.length; index += 1) {
    if (!VIETNAMESE_CHARACTER.test(searchableLines[index])) continue;
    const markedHere = sourceLines[index]?.includes(IGNORE_MARKER);
    const markedAbove = index > 0 && sourceLines[index - 1]?.includes(IGNORE_MARKER);
    if (markedHere || markedAbove) continue;
    violations.push({ line: index + 1, text: sourceLines[index].trim() });
  }
  return violations;
}

function main() {
  const errors = [];
  const violationCounts = new Map();
  const showAll = process.argv.includes('--all');

  function check(file) {
    const path = relative(process.cwd(), file).replace(/\\/g, '/');
    if (WHITELIST.some(pattern => pattern.test(path))) return;

    const original = readFileSync(file, 'utf8');
    for (const violation of findViolations(original, { html: file.endsWith('.html') })) {
      errors.push(`${path}:${violation.line}: ${violation.text}`);
      violationCounts.set(path, (violationCounts.get(path) ?? 0) + 1);
    }
  }

  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') walk(fullPath);
      } else if (/\.(?:html|ts)$/.test(entry.name)) {
        check(fullPath);
      }
    }
  }

  walk(ROOT);

  const overBudgetPaths = [...violationCounts].filter(([path, count]) => count > (LEGACY_VIETNAMESE_BUDGET[path] ?? 0));

  if (overBudgetPaths.length > 0) {
    console.error('Found hardcoded Vietnamese debt above the approved per-file baseline:');
    for (const [path, count] of overBudgetPaths) {
      console.error(`  ${path}: ${count} found, ${LEGACY_VIETNAMESE_BUDGET[path] ?? 0} allowed`);
    }
    const failingPaths = new Set(overBudgetPaths.map(([path]) => path));
    const failingErrors = errors.filter(error => failingPaths.has(error.slice(0, error.indexOf(':'))));
    const visibleErrors = showAll ? failingErrors : failingErrors.slice(0, 50);
    for (const error of visibleErrors) console.error(`  ${error}`);
    if (!showAll && failingErrors.length > 50) console.error(`  ... and ${failingErrors.length - 50} more`);
    process.exitCode = 1;
  } else {
    console.log(`check:i18n OK (${errors.length} tracked legacy occurrence(s), no per-file budget increase)`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1].replace(/\\/g, '/')}`))) {
  main();
}
