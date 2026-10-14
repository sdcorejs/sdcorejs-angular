import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const require = createRequire(new URL('../versions/v19/package.json', import.meta.url));
const ts = require('typescript');
const aliasPath = fileURLToPath(new URL('../versions/v19/projects/sdcorejs-angular/components/modal-resizable/src/modal-resizable.component.ts', import.meta.url));

test('the compatibility alias carries a TypeScript deprecation tag without wrapping the Angular class', () => {
  const program = ts.createProgram([aliasPath], { noLib: true, noResolve: true, noEmit: true });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(aliasPath);
  const alias = checker.getExportsOfModule(checker.getSymbolAtLocation(source)).find(symbol => symbol.name === 'SdModalResizable');
  assert.ok(alias, 'missing public compatibility alias');
  assert.ok(alias.getJsDocTags(checker).some(tag => tag.name === 'deprecated'), 'IDE consumers need an actual deprecation tag');
  const declaration = alias.declarations[0];
  assert.ok(ts.isExportSpecifier(declaration), 'keep an exact class re-export, not a second Angular component');
  assert.equal(declaration.propertyName.text, 'SdWindow');
  assert.equal(declaration.parent.parent.moduleSpecifier.text, '@sdcorejs/angular/components/window');
});
