import { provideHttpClient, withInterceptors, withRequestsMadeViaParent } from '@angular/common/http';
import { inject, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { Router } from '@angular/router';
import {
  SD_PERMISSION_CONFIGURATION,
  SdPermissionGuard,
  SdPermissionService,
  type ISdPermissionConfiguration,
} from '@sdcorejs/angular/modules/permission';
import { patternMockApiInterceptor } from '../core/mock-api/mock-api.interceptor';
import { PatternMockApiState } from '../core/mock-api/mock-api.state';
import { patternPermissionsOf } from '../core/permission/pattern-permission';
import { PatternRoleStore } from '../core/permission/pattern-role.store';
import { PatternSettingsStore } from '../core/pattern-shell/settings/pattern-settings.store';
import { SD_PATTERN_CONFIGURATION, type SdPatternConfiguration, type SdPatternResolvedConfiguration } from './pattern.configuration';

/**
 * Registers what the pattern routes need, in the environment injector of the route that mounts them:
 *
 * ```ts
 * {
 *   path: 'pattern',
 *   loadChildren: () => import('@sdcorejs/angular/modules/pattern').then(m => m.SD_PATTERN_ROUTES),
 *   providers: [provideSdPatterns({ mockApi: true })],
 * }
 * ```
 *
 * - The mock API interceptor runs on a child `HttpClient` of that route (`withRequestsMadeViaParent`), so other
 *   requests of the host are untouched and requests under `/pattern` still go through the host's interceptors.
 * - `SdPermissionService`, `SdPermissionGuard` and `SD_PERMISSION_CONFIGURATION` are provided again there with the
 *   sample roles, so the host's own permissions are neither read nor changed.
 */
export function provideSdPatterns(configuration: SdPatternConfiguration = {}): EnvironmentProviders {
  const value: SdPatternResolvedConfiguration = Object.freeze({
    mockApi: configuration.mockApi ?? true,
    apiBaseUrl: normalizeBaseUrl(configuration.apiBaseUrl ?? '/pattern-api'),
    latencyMs: Math.max(0, configuration.latencyMs ?? 400),
    storage: configuration.storage ?? 'session',
    forbiddenUrl: configuration.forbiddenUrl ?? null,
  });

  return makeEnvironmentProviders([
    { provide: SD_PATTERN_CONFIGURATION, useValue: value },
    value.mockApi
      ? [PatternMockApiState, provideHttpClient(withInterceptors([patternMockApiInterceptor]), withRequestsMadeViaParent())]
      : [],
    PatternRoleStore,
    PatternSettingsStore,
    SdPermissionService,
    SdPermissionGuard,
    { provide: SD_PERMISSION_CONFIGURATION, useFactory: patternPermissionConfiguration },
  ]);
}

function patternPermissionConfiguration(): ISdPermissionConfiguration {
  const roles = inject(PatternRoleStore);
  const router = inject(Router);
  const { forbiddenUrl } = inject(SD_PATTERN_CONFIGURATION);
  return {
    loadPermissions: () => patternPermissionsOf(roles.role()),
    onForbiden: () => {
      if (forbiddenUrl) void router.navigateByUrl(forbiddenUrl);
    },
  };
}

function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  const rootRelative = trimmed.startsWith('/') && !trimmed.startsWith('//');
  if (!rootRelative && !/^https?:\/\//i.test(trimmed)) {
    throw new Error('provideSdPatterns: apiBaseUrl must be a root-relative or HTTP(S) URL.');
  }
  if (trimmed.includes('?') || trimmed.includes('#')) {
    throw new Error('provideSdPatterns: apiBaseUrl must not contain a query or a hash.');
  }
  return trimmed.replace(/\/+$/, '') || '/';
}
