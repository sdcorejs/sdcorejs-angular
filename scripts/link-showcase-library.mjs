/**
 * Places the built library inside showcase/node_modules/@sdcorejs/angular.
 *
 * WHY a copy instead of a tsconfig path straight at versions/v19/dist:
 * the dist lives OUTSIDE the showcase workspace, so its own bare `@angular/*`
 * imports resolve upwards into versions/v19/node_modules — a second physical
 * copy of Angular next to showcase/node_modules. Two copies means two DI
 * containers, and every demo the Examples tab lazy-loads died with NG0203
 * ("inject() must be called from an injection context"). Sitting inside
 * showcase/node_modules, the library resolves the SAME framework as the app,
 * exactly like a consumer that installed it from npm.
 *
 * A copy, not a symlink: Node resolves a symlink to its real path and would
 * walk back up into versions/v19/node_modules, reintroducing the duplicate.
 */
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(REPO_ROOT, 'versions', 'v19', 'dist', 'sdcorejs-angular');
const TARGET = join(REPO_ROOT, 'showcase', 'node_modules', '@sdcorejs', 'angular');

export function linkShowcaseLibrary() {
  if (!existsSync(SOURCE)) {
    throw new Error(
      `Library build not found: ${SOURCE}\n` +
        'Build it first: cd versions/v19 && npx ng build sdcorejs-angular',
    );
  }

  rmSync(TARGET, { recursive: true, force: true });
  cpSync(SOURCE, TARGET, { recursive: true });
  console.log('[link-library] showcase/node_modules/@sdcorejs/angular <- versions/v19/dist/sdcorejs-angular');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  linkShowcaseLibrary();
}
