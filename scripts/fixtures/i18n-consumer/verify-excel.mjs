import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [before, after, output] = process.argv.slice(2);
const sha256 = value => createHash('sha256').update(value).digest('hex');
async function inspect(directory) {
  const read = name => readFile(resolve(directory, name));
  const { packages } = JSON.parse(await read('package-lock.json'));
  const excel = packages['node_modules/exceljs'];
  const bundle = await read('node_modules/exceljs/dist/exceljs.min.js');
  const map = JSON.parse(await read('node_modules/exceljs/dist/exceljs.min.js.map'));
  const uuidSources = map.sources.filter(s => /(^|\/)node_modules\/uuid\//.test(s));
  const helper = map.sources.indexOf('lib/utils/uuid.js');
  const identicalHelper =
    helper >= 0 && map.sourcesContent[helper]?.trim() === (await read('node_modules/exceljs/lib/utils/uuid.js')).toString().trim();
  const runtimeUuid = Object.entries(packages)
    .filter(([path, pkg]) => path.endsWith('/node_modules/uuid') || path === 'node_modules/uuid')
    .filter(([, pkg]) => !pkg.dev)
    .map(([path, pkg]) => ({ path, version: pkg.version }));
  return {
    name: excel.name ?? 'exceljs',
    version: excel.version,
    integrity: excel.integrity,
    browserSha256: sha256(bundle),
    uuidSources,
    runtimeUuid,
    localHelperMatchesSourceMap: identicalHelper,
    tarSandboxInBrowserMap: map.sources.some(s => s.endsWith('/tar-stream/sandbox.js')),
  };
}
const baseline = await inspect(before);
const candidate = await inspect(after);
assert.ok(baseline.uuidSources.some(s => s.endsWith('/v5.js')));
assert.ok(baseline.runtimeUuid.some(pkg => pkg.version === '8.3.2'));
assert.deepEqual(candidate.uuidSources, []);
assert.deepEqual(candidate.runtimeUuid, []);
assert.equal(candidate.localHelperMatchesSourceMap, true);
await mkdir(output, { recursive: true });
await writeFile(resolve(output, 'excel-results.json'), JSON.stringify({ baseline, candidate }, null, 2) + '\n');
console.log('Verified the packed consumer dependency tree and the ExcelJS browser bundle source map.');
