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
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(REPO_ROOT, 'versions', 'v19', 'dist', 'sdcorejs-angular');
const TARGET = join(REPO_ROOT, 'showcase', 'node_modules', '@sdcorejs', 'angular');
const VITE_CACHE = join(REPO_ROOT, 'showcase', '.angular', 'cache');

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

  clearVitePreBundle();
}

/**
 * `ng serve` chạy trên Vite, và Vite PRE-BUNDLE mọi dependency trong node_modules vào
 * `.angular/cache/<version>/<project>/vite/deps`. Cache đó chỉ bị vô hiệu khi package.json /
 * lockfile đổi — copy đè thư mục thì Vite không hay biết, nên dev server tiếp tục phục vụ bản
 * pre-bundle CŨ. Biểu hiện: sửa lib xong showcase vẫn hiện hành vi cũ, và khi lib thêm export mới
 * thì lazy chunk chết với "does not provide an export named 'X'".
 *
 * Chỉ xoá thư mục `vite`, KHÔNG xoá cả `.angular/cache`: `angular-compiler.db` bị dev server giữ
 * (EBUSY trên Windows) và nó không liên quan tới việc pre-bundle.
 */
function clearVitePreBundle() {
  if (!existsSync(VITE_CACHE)) return;

  const removed = [];
  const stack = [VITE_CACHE];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const child = join(current, entry.name);
      if (entry.name === 'vite') {
        try {
          rmSync(child, { recursive: true, force: true });
          removed.push(child);
        } catch (cause) {
          // Dev server đang chạy có thể giữ file trong đó — cảnh báo là đủ, đừng làm vỡ luồng copy.
          console.warn(`[link-library] could not clear ${child}: ${cause?.code ?? cause}. Restart the dev server.`);
        }
      } else {
        stack.push(child);
      }
    }
  }

  if (removed.length) console.log(`[link-library] cleared Vite pre-bundle (${removed.length} dir) — restart dev server if it is running`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  linkShowcaseLibrary();
}
