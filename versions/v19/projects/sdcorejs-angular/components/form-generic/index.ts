// Public API of `@sdcorejs/angular/components/form-generic`.
// Runtime: SdFormRender, SdFormBuilder, SdFormRenderService, provideSdFormGeneric, SD_FORM_GENERIC_BREAKPOINTS.
// Everything else is a type (schema, field, config models). Guarded by `src/public-api.spec.ts`.
export * from './src/configurations';
export type * from './src/models';
export * from './src/components';
export { SdFormRenderService } from './src/services';
