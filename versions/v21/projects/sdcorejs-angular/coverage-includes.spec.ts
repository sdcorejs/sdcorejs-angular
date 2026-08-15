/**
 * Pulls EVERY library source file into the test bundle so coverage measures the whole library,
 * not just the files some spec happens to import.
 *
 * why: the karma builder builds its entry from `**\/*.spec.ts` plus whatever those specs import
 * transitively (`build-angular/src/builders/karma/find-tests-plugin.js`). A file no spec reaches
 * never enters the bundle, so istanbul never instruments it and it lands in NEITHER the numerator
 * nor the denominator — coverage used to be reported over 405 of 639 source files, and adding the
 * first test to an untested area could make the percentage go DOWN.
 *
 * `coverageReporter.includeAllSources` cannot fix that here: it only reads the coverage map loaded
 * by karma-coverage's own preprocessor, which this setup never runs (instrumentation happens inside
 * webpack via babel-plugin-istanbul). Measured 2026-08-10: flipping the flag changed nothing.
 * Importing the files is the only lever that does.
 *
 * Three mechanics worth knowing before editing this file — each one cost a run to find:
 *   1. `require.context` (the pattern every guide shows) does NOT work here. `require` exists as a
 *      function in this bundle but carries no `context`. The working API is webpack 5's
 *      `import.meta.webpackContext`.
 *   2. webpack rewrites the `import.meta.webpackContext(...)` CALL at build time; the property does
 *      not exist at runtime. A `typeof import.meta.webpackContext === 'function'` guard therefore
 *      always fails — the call has to be made unconditionally. If the karma builder is ever switched
 *      to `builderMode: "application"` (esbuild) the BUILD fails here, which is the loud failure we
 *      want: coverage must never quietly shrink back to "only what the specs import".
 *   3. The options are parsed statically, so `regExp` must be an inline literal. Hoisting it into a
 *      `const` fails with 'Unknown value for property "regExp", expected type RegExp'.
 *
 * `tsconfig.spec.json` also has to `include` the sources (`**\/*.ts`, not just `**\/*.spec.ts`):
 * `@ngtools/webpack` refuses to build a file outside the TypeScript program, so every source file
 * failed with "missing from the TypeScript compilation" until that was widened.
 *
 * The import is side-effect-only: this file asserts nothing about behaviour. Every module's
 * top-level code DOES run, which is deliberate — a source file that throws on import is a real
 * defect and should fail loudly here instead of hiding behind "no test".
 */

interface WebpackModuleContext {
  keys(): string[];
  (id: string): unknown;
}

const webpackMeta = import.meta as unknown as {
  webpackContext(path: string, options?: { recursive?: boolean; regExp?: RegExp }): WebpackModuleContext;
};

// why: `.spec.ts` is excluded because those modules are already entry points — pulling them in again
// would re-register their suites. Generated blobs hold no logic to cover, and one of them
// (`pdf-worker-inline.generated.ts`) is a single 1.4 MB string literal that would inflate every test
// bundle for one statement.
const sources = webpackMeta.webpackContext('./', {
  recursive: true,
  regExp: /^(?!.*\.spec\.ts$)(?!.*\.generated\.ts$)(?!.*\.d\.ts$).*\.ts$/,
});

describe('coverage includes every library source', () => {
  const files = sources.keys();

  it('imports every non-spec source file without throwing', () => {
    const failures: string[] = [];
    for (const file of files) {
      try {
        sources(file);
      } catch (error) {
        failures.push(`${file}: ${(error as Error)?.message ?? error}`);
      }
    }
    expect(failures).toEqual([]);
  });

  // why: guard against the glob silently going empty (bad regex, moved files, builder change). The
  // exact count moves with the codebase, so this asserts a floor rather than an equality.
  it('reaches the whole library, not a handful of files', () => {
    expect(files.length).toBeGreaterThan(500);
  });
});
