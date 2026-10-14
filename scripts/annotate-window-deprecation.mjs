import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const ALIAS = 'SdModalResizable';
const WINDOW_ENTRY = '@sdcorejs/angular/components/window';
const LEGACY_ENTRY = '@sdcorejs/angular/components/modal-resizable';
const DEPRECATION = '/** @deprecated Use SdWindow from @sdcorejs/angular/components/window. This alias has the same component identity. */ ';

/** Restore only alias JSDoc discarded by declaration flattening; leave runtime and signatures intact. */
export function annotateWindowDeprecation(packageDirectory) {
  const root = resolve(packageDirectory);
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  if (manifest.name !== '@sdcorejs/angular') throw new Error('Expected the @sdcorejs/angular package.');
  // CI installs one Angular line per job; use that artifact's own workspace parser.
  const ts = createRequire(join(root, 'package.json'))('typescript');
  const withinPackage = path => {
    const absolute = resolve(path);
    if (!absolute.toLowerCase().startsWith((root + sep).toLowerCase())) throw new Error('Declaration path is outside the package.');
    if (!absolute.endsWith('.d.ts') || !existsSync(absolute)) throw new Error(`Missing declaration path: ${relative(root, absolute)}`);
    return absolute;
  };
  const entryPath = key => {
    const target = manifest.exports?.[key]?.types;
    if (typeof target !== 'string' || isAbsolute(target)) throw new Error(`Missing or invalid types path for ${key}.`);
    return withinPackage(resolve(root, target));
  };
  const paths = ['.', './components', './components/modal-resizable'].map(entryPath);
  const parsed = new Map();
  const sourceAt = file => {
    if (!parsed.has(file)) {
      const text = readFileSync(file, 'utf8');
      parsed.set(file, { text, source: ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true) });
    }
    return parsed.get(file);
  };
  const forwardedPath = (file, moduleName) => {
    if (moduleName.startsWith('.')) {
      const candidate = resolve(dirname(file), moduleName);
      for (const path of [candidate + '.d.ts', join(candidate, 'index.d.ts')]) if (existsSync(path)) return withinPackage(path);
      throw new Error(`Missing relative declaration forwarder: ${moduleName}`);
    }
    if (moduleName.startsWith('@sdcorejs/angular/')) return entryPath('./' + moduleName.slice('@sdcorejs/angular/'.length));
    return undefined;
  };
  const findAliases = (file, seen = new Set()) => {
    if (seen.has(file)) return [];
    seen.add(file);
    const { source } = sourceAt(file);
    const aliases = [];
    for (const statement of source.statements) {
      if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const moduleName = statement.moduleSpecifier.text;
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const node of statement.exportClause.elements) {
          if (node.name.text !== ALIAS) continue;
          if (statement.isTypeOnly || node.isTypeOnly) throw new Error('The compatibility alias must remain a value re-export.');
          const importedName = node.propertyName?.text || node.name.text;
          const isWindowAlias = moduleName === WINDOW_ENTRY && importedName === 'SdWindow';
          const isForwardedAlias = importedName === ALIAS && (moduleName === LEGACY_ENTRY || moduleName.startsWith('.'));
          if (!isWindowAlias && !isForwardedAlias) throw new Error('Unexpected compatibility alias re-export.');
          aliases.push({ file, node, source, isWindowAlias });
        }
      } else if (!statement.exportClause) {
        const target = forwardedPath(file, moduleName);
        if (target) aliases.push(...findAliases(target, seen));
      }
    }
    return aliases;
  };
  const aliasesByEntry = paths.map(path => findAliases(path));
  if (aliasesByEntry.some(aliases => aliases.length === 0) || !aliasesByEntry[2].some(alias => alias.isWindowAlias)) {
    throw new Error('Expected the existing SdModalResizable class alias in every public entry point.');
  }
  const changes = new Map();
  for (const { file, node, source } of aliasesByEntry.flat()) {
    if (ts.getJSDocTags(node).some(tag => tag.tagName.text === 'deprecated')) continue;
    if (!changes.has(file)) changes.set(file, new Set());
    changes.get(file).add(node.getStart(source));
  }
  // Validate every entry first. A bad path or replaced class must not partially rewrite the artifact.
  const updated = [];
  for (const [file, offsets] of changes) {
    let text = sourceAt(file).text;
    for (const offset of [...offsets].sort((a, b) => b - a)) text = text.slice(0, offset) + DEPRECATION + text.slice(offset);
    writeFileSync(file, text);
    updated.push(relative(root, file).split(sep).join('/'));
  }
  return { updated };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = annotateWindowDeprecation(join(process.cwd(), 'dist/sdcorejs-angular'));
  console.log(`[window-deprecation] checked public aliases; annotated ${result.updated.length} declaration(s).`);
}
