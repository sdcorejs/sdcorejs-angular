// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const unusedImports = require('eslint-plugin-unused-imports');

const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

const angularTsRuleOverrides = {
  ...(angular.tsPlugin?.rules?.['prefer-inject'] ? { '@angular-eslint/prefer-inject': 'off' } : {}),
};
const angularTemplateRuleOverrides = {
  ...(angular.templatePlugin?.rules?.['prefer-control-flow'] ? { '@angular-eslint/template/prefer-control-flow': 'off' } : {}),
};

// why (R-018, D-016): colours come from `--sd-*` tokens so presets and dark mode reach every component.
// Same heuristic as scripts/check-scss-hex.mjs: a hex that opens a string or follows `:` `(` `,` `=`,
// except the fallback of `var(--x, #hex)`. Exempt like the scanner: specs, *.generated.ts and the
// input-color data values; plus the static Keycloak fallback page, served outside the app without the theme.
const COLOR_HEX = String.raw`(?<!var\(\s*--[\w-]+\s*)(?:^|[:(,=]\s*)#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w-])`;
const COLOR_HEX_MESSAGE = 'Raw colour hex: use a --sd-* token (a var(--sd-x, #hex) fallback is allowed). See THEME.md.';
const colorHexIgnores = ['**/*.spec.ts', '**/*.generated.ts', '**/forms/input-color/**', '**/modules/keycloak/htmls/**'];

module.exports = tseslint.config(
  {
    // why: pdf-worker-inline.generated.ts is a ~1.4MB machine-generated string literal produced by
    // `npm run generate:pdf-worker`. Linting it is pure cost, and `--fix` previously rewrote its
    // `/* eslint-disable */` header, which broke `npm run check:pdf-worker`.
    ignores: ['projects/sdcorejs-angular/components/preview/src/preview-pdf/pdf-worker-inline.generated.ts'],
  },
  {
    files: ['**/*.ts'],
    plugins: {
      // @ts-ignore
      'unused-imports': unusedImports,
    },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      eslintPluginPrettierRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/class-literal-property-style': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/prefer-for-of': 'off',
      'no-unused-private-class-members': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': 'off',
      '@angular-eslint/no-input-rename': 'off',
      '@angular-eslint/no-output-native': 'off',
      '@angular-eslint/no-empty-lifecycle-method': 'off',
      '@angular-eslint/directive-selector': 'off',
      '@angular-eslint/component-selector': 'off',
      '@angular-eslint/component-class-suffix': ['off'],
      ...angularTsRuleOverrides,
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      // why: bốn rule accessibility này từng bị TẮT hoàn toàn. Đó là nguyên nhân gốc của tình trạng
      // a11y: `aria-hidden="true"` bị dùng như một cách dập cảnh báo lint thay vì sửa markup, khiến
      // 10 `<input>` thật biến mất khỏi accessibility tree — tệ hơn là không làm gì. Bật lại.
      '@angular-eslint/template/click-events-have-key-events': 'error',
      '@angular-eslint/template/interactive-supports-focus': 'error',
      '@angular-eslint/template/label-has-associated-control': 'error',
      '@angular-eslint/template/role-has-required-aria': 'error',
      ...angularTemplateRuleOverrides,
    },
  },
  {
    files: ['**/*.ts'],
    ignores: colorHexIgnores,
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: `Literal[value=/${COLOR_HEX}/]`, message: COLOR_HEX_MESSAGE },
        { selector: `TemplateElement[value.raw=/${COLOR_HEX}/]`, message: COLOR_HEX_MESSAGE },
      ],
    },
  },
  {
    files: ['**/*.html'],
    ignores: colorHexIgnores,
    rules: {
      'no-restricted-syntax': [
        'error',
        // Anchors such as href="#fade" are not colours.
        { selector: `TextAttribute[name!=/^(?:href|xlink:href|fragment|routerLink)$/][value=/${COLOR_HEX}/]`, message: COLOR_HEX_MESSAGE },
        // Expression nodes carry no ESLint location, so report the bound attribute that contains one.
        { selector: `BoundAttribute:has(LiteralPrimitive[value=/${COLOR_HEX}/])`, message: COLOR_HEX_MESSAGE },
      ],
    },
  }
);
