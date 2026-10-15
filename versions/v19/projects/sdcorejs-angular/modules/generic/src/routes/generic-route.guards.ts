import { inject } from '@angular/core';
import type { ActivatedRouteSnapshot, CanActivateFn, ResolveFn } from '@angular/router';
import { I18nService } from '@sdcorejs/angular/i18n';
import type { SdGenericAction } from '../models';
import { SD_GENERIC_SCOPE } from '../registry';
import { SdGenericPermissionService, SdGenericSchemaService, type SdGenericResolvedSchema } from '../services';

/** Route data `generic` of the list and configuration routes. */
export interface SdGenericRouteData {
  module: string;
  entity: string;
  resolved: SdGenericResolvedSchema | null;
  /** Message when the schema could not be loaded (unknown module, adapter failure). */
  error: string | null;
}

/** `module`, `entity` and `id` of a generic route, read from every ancestor because nested routes do not inherit params. */
export const sdGenericRouteParams = (route: ActivatedRouteSnapshot): { module: string; entity: string; id: string | null } => {
  const read = (key: string) =>
    route.pathFromRoot
      .map(snapshot => snapshot.paramMap.get(key))
      .filter((value): value is string => value !== null)
      .pop() ?? null;
  return { module: read('module') ?? '', entity: read('entity') ?? '', id: read('id') };
};

/**
 * Module and entity names a route may carry: letters, digits, `_` and `-`, with single dots between parts. It
 * keeps decoded `/`, `..` and other separators away from permission codes and adapter calls.
 */
const NAME = /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/;

/**
 * Blocks a generic route without its permission code (INV-005), with an unsafe module / entity name, or whose
 * action the entity hides through `hiddenDefaults`. Permissions are loaded before the check.
 */
export const sdGenericPermissionGuard =
  (action: SdGenericAction): CanActivateFn =>
  async route => {
    const permission = inject(SdGenericPermissionService);
    const { module, entity } = sdGenericRouteParams(route);
    if (!NAME.test(module) || !NAME.test(entity)) return false;
    // why: a hidden route is refused before the permission list is loaded.
    if (permission.hides(module, entity, action)) return false;
    await permission.ensureLoaded();
    return permission.allows(module, entity, action);
  };

/** Resolves the effective schema before the page renders; a failure becomes `error` instead of a navigation error. */
export const sdGenericSchemaResolver: ResolveFn<SdGenericRouteData> = async route => {
  const schemas = inject(SdGenericSchemaService);
  const scope = inject(SD_GENERIC_SCOPE);
  const i18n = inject(I18nService);
  const { module, entity } = sdGenericRouteParams(route);
  if (!scope.adapter(module))
    return { module, entity, resolved: null, error: i18n.t('core.module.generic.error.adapter-missing', { module }) };
  try {
    return { module, entity, resolved: await schemas.resolve(module, entity), error: null };
  } catch (error) {
    return { module, entity, resolved: null, error: error instanceof Error ? error.message : String(error) };
  }
};
