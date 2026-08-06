/** Returns the Angular major encoded in a concrete documentation version. */
export function resolveDocsAngularMajor(version: string | null | undefined): number | null {
  const match = /^v?(\d+)(?:\.|$)/.exec(version?.trim() ?? '');
  return match ? Number(match[1]) : null;
}

/** Builds the package-only installation command for the selected documentation version. */
export function buildCoreUiInstallCommand(version: string | null | undefined): string {
  const major = resolveDocsAngularMajor(version);
  return `npm install @sdcorejs/angular${major ? `@^${major}` : ''}`;
}

/** Builds the complete setup command while keeping Angular peer packages on the same major. */
export function buildCoreUiSetupCommand(version: string | null | undefined): string {
  const major = resolveDocsAngularMajor(version);
  const range = major ? `@^${major}` : '';
  return `npm install @sdcorejs/angular${range} @angular/material${range} @angular/material-date-fns-adapter${range}`;
}
