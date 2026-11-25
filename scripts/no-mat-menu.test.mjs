// MM-03 (gói design-tree-selection): sd-table và sd-tree không còn dùng mat-menu; mọi menu là Action Popover
// (sd-button + sd-button-item). Chặn việc thêm lại ở source của v19 (v20-v22 dẫn xuất từ đó).
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const library = join(root, 'versions', 'v19', 'projects', 'sdcorejs-angular');
const FORBIDDEN = /MatMenu|mat-menu|matMenuTriggerFor/;
const SOURCE = /\.(ts|html|scss)$/;

function* walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (SOURCE.test(entry.name)) yield path;
  }
}

for (const [id, directory] of [['MM-03', 'components/table'], ['MM-03', 'components/tree'], ['DP-11', 'forms']]) {
  test(`${id} ${directory} does not use mat-menu`, () => {
    const hits = [];
    for (const file of walk(join(library, directory))) {
      readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .forEach((line, index) => {
          if (FORBIDDEN.test(line)) hits.push(`${relative(root, file)}:${index + 1}: ${line.trim()}`);
        });
    }
    assert.deepEqual(hits, []);
  });
}
