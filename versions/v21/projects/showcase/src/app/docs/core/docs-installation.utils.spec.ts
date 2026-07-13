import { buildCoreUiInstallCommand, buildCoreUiSetupCommand, resolveDocsAngularMajor } from './docs-installation.utils';

describe('docs installation utilities', () => {
  it('reads the Angular major from concrete and v-prefixed versions', () => {
    expect(resolveDocsAngularMajor('21.1.2')).toBe(21);
    expect(resolveDocsAngularMajor('v19.0.4')).toBe(19);
  });

  it('pins Core UI and Angular Material packages to the selected major', () => {
    expect(buildCoreUiInstallCommand('20.0.10')).toBe('npm install @sdcorejs/angular@^20');
    expect(buildCoreUiSetupCommand('21.1.2')).toBe(
      'npm install @sdcorejs/angular@^21 @angular/material@^21 @angular/material-date-fns-adapter@^21'
    );
  });

  it('keeps a safe unpinned fallback while the latest version is unresolved', () => {
    expect(resolveDocsAngularMajor('latest')).toBeNull();
    expect(buildCoreUiInstallCommand('latest')).toBe('npm install @sdcorejs/angular');
  });
});
