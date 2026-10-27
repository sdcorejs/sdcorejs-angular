/** Opens the Source drawer of the pattern shell; injectable by every screen under the shell. */
export abstract class PatternSourceViewer {
  /**
   * Opens the drawer on a file, e.g. `docs/list.md` or `features/product/routes.ts`.
   * Without a path it opens the feature of the current route.
   */
  abstract openSource(path?: string): void;
}
