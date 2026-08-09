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

module.exports = tseslint.config(
  {
    // why: Showcase generators own formatting for these deterministic build artifacts.
    // why: pdf-worker-inline.generated.ts is a ~1.4MB machine-generated string literal produced by
    // `npm run generate:pdf-worker`. Linting it is pure cost, and `--fix` previously rewrote its
    // `/* eslint-disable */` header, which broke `npm run check:pdf-worker`.
    ignores: [
      'projects/showcase/src/app/docs/generated/**/*.ts',
      'projects/sdcorejs-angular/components/preview/src/preview-pdf/pdf-worker-inline.generated.ts',
    ],
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
      '@angular-eslint/template/click-events-have-key-events': 'off',
      '@angular-eslint/template/interactive-supports-focus': 'off',
      '@angular-eslint/template/label-has-associated-control': 'off',
      '@angular-eslint/template/role-has-required-aria': 'off',
      ...angularTemplateRuleOverrides,
    },
  }
);
