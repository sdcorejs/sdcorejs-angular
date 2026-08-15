/*
 * Public API Surface of sd-angular
 *
 * why: these were previously bare `import '...'` statements, which meant the primary
 * entry point re-exported NOTHING — `import { SdButton } from '@sdcorejs/angular'`
 * resolved to nothing for every symbol, and the built FESM bundle was 517 bytes with
 * no `export` statement. Deep imports (`@sdcorejs/angular/components/button`) remain
 * the recommended path for bundle size; this barrel exists so the root import works.
 */
export * from '@sdcorejs/angular/configurations';
export * from '@sdcorejs/angular/i18n';
export * from '@sdcorejs/angular/utilities';
export * from '@sdcorejs/angular/pipes';
export * from '@sdcorejs/angular/directives';
export * from '@sdcorejs/angular/services';
export * from '@sdcorejs/angular/interceptors';
export * from '@sdcorejs/angular/handlers';
export * from '@sdcorejs/angular/components';
export * from '@sdcorejs/angular/forms';
export * from '@sdcorejs/angular/modules';
