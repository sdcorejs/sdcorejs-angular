import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'projects/sdcorejs-angular';
const VIETNAMESE_CHARACTER =
  /[ÀÁẢÃẠẰẮẲẴẶÂẦẤẨẪẬĂÈÉẺẼẸỀẾỂỄỆÊÌÍỈĨỊÒÓỎÕỌỒỐỔỖỘÔỜỚỞỠỢƠÙÚỦŨỤỪỨỬỮỰƯỲÝỶỸỴĐàáảãạằắẳẵặâầấẩẫậăèéẻẽẹềếểễệêìíỉĩịòóỏõọồốổỗộôờớởỡợơùúủũụừứửữựưỳýỷỹỵđ]/;
const WHITELIST = [/\/i18n\/src\/vi\.ts$/, /\.spec\.ts$/];
const errors = [];
const violationCounts = new Map();
const showAll = process.argv.includes('--all');

// Existing localization debt is tracked as a per-file ceiling instead of a
// broad directory whitelist. New files fail immediately, and an existing file
// may only reduce (never increase) its debt without an intentional review.
const LEGACY_VIETNAMESE_BUDGET = Object.freeze({
  'projects/sdcorejs-angular/components/autoid-inspector/src/autoid-inspector.component.html': 37,
  'projects/sdcorejs-angular/components/autoid-inspector/src/autoid-inspector.component.ts': 3,
  'projects/sdcorejs-angular/components/autoid-inspector/src/services/autoid-scanner.service.ts': 1,
  'projects/sdcorejs-angular/components/code-editor/src/code-editor.component.ts': 1,
  'projects/sdcorejs-angular/components/document-builder/src/components/header-footer-builder/header-footer-builder.component.ts': 3,
  'projects/sdcorejs-angular/components/document-builder/src/document-builder.component.ts': 9,
  'projects/sdcorejs-angular/components/document-builder/src/plugins/ck-comment/ck-comment.plugin.ts': 1,
  'projects/sdcorejs-angular/components/document-builder/src/plugins/variable/variable.plugin.ts': 2,
  'projects/sdcorejs-angular/components/form-generic/src/models/form-generic-component.model.ts': 10,
  'projects/sdcorejs-angular/components/form-generic/src/models/form-generic-expression.model.ts': 24,
  'projects/sdcorejs-angular/components/form-generic/src/models/form-generic-validation.model.ts': 2,
  'projects/sdcorejs-angular/components/modal-resizable/src/modal-resizable.component.html': 5,
  'projects/sdcorejs-angular/components/query-bar/src/components/actions-bar/actions-bar.component.html': 2,
  'projects/sdcorejs-angular/components/query-bar/src/components/build-chip/build-chip.component.html': 2,
  'projects/sdcorejs-angular/components/query-bar/src/components/chip-popover/chip-popover.component.html': 15,
  'projects/sdcorejs-angular/components/query-bar/src/components/field-picker/field-picker.component.html': 1,
  'projects/sdcorejs-angular/components/query-bar/src/components/inline-chip/inline-chip.component.html': 2,
  'projects/sdcorejs-angular/components/query-bar/src/components/inline-value-chip/inline-value-chip.component.ts': 3,
  'projects/sdcorejs-angular/components/query-bar/src/components/saved-filters-menu/saved-filters-menu.component.html': 4,
  'projects/sdcorejs-angular/components/query-bar/src/components/saved-filters-menu/saved-filters-menu.component.ts': 1,
  'projects/sdcorejs-angular/components/query-bar/src/query-bar.component.html': 3,
  'projects/sdcorejs-angular/components/query-bar/src/query-bar.component.ts': 2,
  'projects/sdcorejs-angular/components/query-builder/src/query-builder.component.html': 14,
  'projects/sdcorejs-angular/components/query-builder/src/query-builder.component.ts': 2,
  'projects/sdcorejs-angular/components/query-builder/src/query-builder.model.ts': 11,
  'projects/sdcorejs-angular/components/query-builder/src/query-builder.serializer.ts': 4,
  'projects/sdcorejs-angular/components/tree/src/tree.component.ts': 1,
  'projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.html': 2,
  'projects/sdcorejs-angular/forms/date/src/date.component.html': 2,
  'projects/sdcorejs-angular/forms/date-range/src/date-range.component.html': 1,
  'projects/sdcorejs-angular/forms/datetime/src/datetime.component.html': 2,
  'projects/sdcorejs-angular/forms/input/src/input.component.html': 1,
  'projects/sdcorejs-angular/forms/input-color/src/input-color.component.html': 3,
  'projects/sdcorejs-angular/forms/input-number/src/input-number.component.html': 1,
  'projects/sdcorejs-angular/forms/select/src/select.component.html': 3,
  'projects/sdcorejs-angular/modules/keycloak/htmls/auth-keycloak-error.html': 5,
  'projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/menu-tree.component.html': 1,
  'projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.html': 2,
  'projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.html': 6,
  'projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.ts': 1,
  'projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.html': 8,
  'projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.html': 1,
  'projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts': 1,
  'projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.html': 4,
  'projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.html': 6,
  'projects/sdcorejs-angular/modules/layout/services/layout.service.ts': 2,
  'projects/sdcorejs-angular/services/excel/src/lib/excel.service.ts': 22,
  'projects/sdcorejs-angular/services/notify/src/components/toast-container.component.ts': 2,
  'projects/sdcorejs-angular/utilities/extensions/src/utility.extension.ts': 14,
});

function withoutTypeScriptComments(source) {
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

    if (current === '/' && next === '/') {
      result += '  ';
      index += 1;
      state = 'line-comment';
    } else if (current === '/' && next === '*') {
      result += '  ';
      index += 1;
      state = 'block-comment';
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

function withoutHtmlComments(source) {
  return source.replace(/<!--[\s\S]*?-->/g, match => match.replace(/[^\n]/g, ' '));
}

function check(file) {
  const path = relative(process.cwd(), file).replace(/\\/g, '/');
  if (WHITELIST.some(pattern => pattern.test(path))) return;

  const original = readFileSync(file, 'utf8');
  const searchable = file.endsWith('.html') ? withoutHtmlComments(original) : withoutTypeScriptComments(original);
  const sourceLines = original.split('\n');
  const searchableLines = searchable.split('\n');

  for (let index = 0; index < searchableLines.length; index += 1) {
    if (VIETNAMESE_CHARACTER.test(searchableLines[index])) {
      errors.push(`${path}:${index + 1}: ${sourceLines[index].trim()}`);
      violationCounts.set(path, (violationCounts.get(path) ?? 0) + 1);
    }
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
