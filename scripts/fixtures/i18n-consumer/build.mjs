// Usage: node scripts/fixtures/i18n-consumer/build.mjs <isolated-directory> <npm-version-or-tarball> <legacy|vi|vi-en|layout>
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [directory, dependency, mode] = process.argv.slice(2);
if (!directory || !dependency || !['legacy', 'vi', 'vi-en', 'layout'].includes(mode))
  throw new Error('Expected directory, package and fixture mode');
const cwd = resolve(directory);
const here = dirname(fileURLToPath(import.meta.url));
const lock = JSON.parse(readFileSync(resolve(here, '../../../versions/v22/package-lock.json'))).packages;
const writeJson = (name, value) => writeFileSync(resolve(cwd, name), JSON.stringify(value, null, 2));
mkdirSync(cwd, { recursive: true });
const dependencies = {};
const devDependencies = {};
for (const name of [
  '@angular/cli',
  '@angular/build',
  '@angular/compiler-cli',
  '@angular/compiler',
  '@angular/core',
  '@angular/common',
  '@angular/forms',
  '@angular/platform-browser',
  '@angular/router',
  '@angular/animations',
  '@angular/material',
  '@angular/cdk',
  '@angular/material-date-fns-adapter',
  'typescript',
  'rxjs',
  'tslib',
]) {
  const target = ['@angular/cli', '@angular/build', '@angular/compiler-cli', 'typescript'].includes(name) ? devDependencies : dependencies;
  target[name] = lock['node_modules/' + name].version;
}
devDependencies['@angular/platform-server'] = dependencies['@angular/core'];
dependencies['@sdcorejs/angular'] = dependency;
writeJson('package.json', { name: 'sd-i18n-consumer', version: '0.0.0', private: true, dependencies, devDependencies });
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Set npm_execpath to npm-cli.js or invoke via npm exec');
execFileSync(process.execPath, [npmCli, 'install', '--no-audit', '--no-fund', '--prefer-offline'], { cwd, stdio: 'inherit' });
const options = {
  browser: 'main.ts',
  tsConfig: 'tsconfig.json',
  index: 'index.html',
  styles: mode === 'layout' ? ['node_modules/@sdcorejs/angular/assets/scss/sd-core.scss', 'layout.scss'] : [],
  outputPath: 'dist/' + mode,
  optimization: true,
  statsJson: true,
  outputHashing: 'all',
  ...(mode === 'legacy' ? {} : { define: { SD_I18N_LAZY_ONLY: 'true' } }),
};
writeJson('angular.json', {
  version: 1,
  projects: {
    fixture: {
      projectType: 'application',
      root: '',
      sourceRoot: '.',
      architect: { build: { builder: '@angular/build:application', options } },
    },
  },
  cli: { analytics: false },
});
writeJson('tsconfig.json', {
  compilerOptions: {
    target: 'ES2022',
    module: 'ES2022',
    moduleResolution: 'bundler',
    strict: true,
    skipLibCheck: true,
    experimentalDecorators: true,
  },
  files: ['main.ts'],
  angularCompilerOptions: { strictTemplates: true },
});
if (mode === 'layout')
  writeFileSync(
    resolve(cwd, 'layout.scss'),
    "html, body { height: 100%; margin: 0; } fixture-app { display:grid; grid-template-rows:auto minmax(0,1fr); height:100%; } nav[aria-label='Fixture routes'] { display:flex; gap:12px; align-items:center; padding:8px 16px; background:white; }"
  );
copyFileSync(resolve(here, mode === 'layout' ? 'layout.ts' : 'main.ts'), resolve(cwd, 'main.ts'));
writeFileSync(
  resolve(cwd, 'index.html'),
  '<!doctype html><html><head><title>Core UI</title><link rel="icon" href="data:,"><base href="/"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><fixture-app></fixture-app></body></html>'
);
const languages = mode !== 'vi' ? ['vi', 'en'] : ['vi'];
const loaders = languages
  .map(lang => `    ${lang}: () => import('@sdcorejs/angular/i18n/locales/${lang}').then(m => m.${lang.toUpperCase()}_MESSAGES),`)
  .join('\n');
writeFileSync(
  resolve(cwd, 'providers.ts'),
  mode === 'legacy'
    ? "export const providers = []; export const languages = ['vi', 'en'] as const;"
    : `import { provideSdI18n } from '@sdcorejs/angular/i18n';
export const languages = ${JSON.stringify(languages)} as const;
export const providers = [provideSdI18n({ defaultLanguage: 'vi', loaders: {\n${loaders}\n} })];`
);
execFileSync(process.execPath, ['node_modules/@angular/cli/bin/ng.js', 'build', 'fixture'], { cwd, stdio: 'inherit' });
