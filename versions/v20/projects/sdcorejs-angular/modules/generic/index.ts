// Public API of `@sdcorejs/angular/modules/generic`.
// Runtime: provideSdGeneric, provideSdGenericEntity, sdGenericRoutes, validateSdGenericSchema.
// Everything else is a type (schema, adapter, entity configuration, issue). Guarded by `src/public-api.spec.ts`.
export type * from './src/models';
export { provideSdGeneric, provideSdGenericEntity } from './src/registry/provide-sd-generic';
export { sdGenericRoutes } from './src/routes/sd-generic.routes';
export { validateSdGenericSchema } from './src/core/generic-validate';
