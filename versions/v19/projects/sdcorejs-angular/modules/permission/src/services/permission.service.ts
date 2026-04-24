import { inject, Injectable } from '@angular/core';
import { SdCache, SdCacheService } from '@sdcorejs/angular/services/cache';
import { ArrayUtilities } from '@sdcorejs/angular/utilities/extensions';
import { ISdPermissionConfiguration, SD_PERMISSION_CONFIGURATION } from '../configurations';
import { SdMaybeAsync, SdResolveMaybeAsync } from '@sdcorejs/angular/utilities';

@Injectable({ providedIn: 'root' })
export class SdPermissionService {
  #permissionMapByKey: Record<string, Record<string, boolean>> = {};
  readonly #configuration = inject<ISdPermissionConfiguration | ISdPermissionConfiguration[]>(SD_PERMISSION_CONFIGURATION);
  readonly #cacheService = inject(SdCacheService);
  #permissionsByKey: SdCache<Record<string, string[]>> = this.#cacheService.create<Record<string, string[]>>('212a51fa-38d5-43b2-bd46-922d85950ba3', {
    type: 'session',
    default: {},
  });
  readonly #loadedKeys = new Set<string>();

  constructor() {
    this.#validateDuplicateConfigKeys();
  }

  #getConfigurations = (): ISdPermissionConfiguration[] => {
    const config = this.#configuration;
    if (!config) {
      return [];
    }
    return Array.isArray(config) ? config : [config];
  };

  #normalizeKey = (key?: string): string => {
    return key === undefined ? '__undefined__' : key;
  };

  #validateDuplicateConfigKeys = (): void => {
    const seen = new Set<string>();
    for (const config of this.#getConfigurations()) {
      const normalizedKey = this.#normalizeKey(config.key);
      if (seen.has(normalizedKey)) {
        const keyLabel = config.key === undefined ? 'undefined' : config.key;
        throw new Error(`[Permission] Duplicate permission configuration key: ${keyLabel}`);
      }
      seen.add(normalizedKey);
    }
  };

  #getConfigurationByKey = (key?: string): ISdPermissionConfiguration | undefined => {
    return this.#getConfigurations().find(config => config.key === key);
  };

  #getEffectivePermissionKey = (key?: string): string | undefined => {
    if (this.#getConfigurationByKey(key)) {
      return key;
    }

    // Portal-level config uses key = undefined and acts as default fallback
    if (key !== undefined && this.#getConfigurationByKey(undefined)) {
      return undefined;
    }

    return key;
  };

  #setPermissionsForKey = (normalizedKey: string, permissions: string[]): void => {
    const distinctPermissions = ArrayUtilities.distinct(permissions || []);
    const current = this.#permissionsByKey.get() || {};
    this.#permissionsByKey.set({
      ...current,
      [normalizedKey]: distinctPermissions,
    });

    const permissionMap: Record<string, boolean> = {};
    distinctPermissions.forEach(permission => {
      permissionMap[permission] = true;
    });
    this.#permissionMapByKey[normalizedKey] = permissionMap;
  };

  loadPermissions = async (key?: string): Promise<string[]> => {
    const effectiveKey = this.#getEffectivePermissionKey(key);
    const normalizedKey = this.#normalizeKey(effectiveKey);
    if (this.#loadedKeys.has(normalizedKey)) {
      return this.#permissionsByKey.get()?.[normalizedKey] || [];
    }

    const configuration = this.#getConfigurationByKey(effectiveKey);
    if (!configuration) {
      this.#setPermissionsForKey(normalizedKey, []);
      this.#loadedKeys.add(normalizedKey);
      return [];
    }

    try {
      const permissions: string[] = await SdResolveMaybeAsync(configuration.loadPermissions());
      this.#setPermissionsForKey(normalizedKey, permissions || []);
    } catch (err) {
      console.error(err);
      this.#setPermissionsForKey(normalizedKey, []);
    } finally {
      this.#loadedKeys.add(normalizedKey);
    }

    return this.#permissionsByKey.get()?.[normalizedKey] || [];
  };

  loadAllPermissions = async (): Promise<void> => {
    const configurations = this.#getConfigurations();
    if (!configurations.length) {
      await this.loadPermissions(undefined);
      return;
    }

    await Promise.all(configurations.map(config => this.loadPermissions(config.key)));
  };

  hasPermission = (permission: string | string[], key?: string) => {
    if (!permission?.toString()) {
      return true;
    }

    const effectiveKey = this.#getEffectivePermissionKey(key);
    const configuration = this.#getConfigurationByKey(effectiveKey);
    if (configuration?.disabled) {
      return true;
    }

    const normalizedKey = this.#normalizeKey(effectiveKey);
    const permissionMap = this.#permissionMapByKey[normalizedKey] || {};
    const permissions = Array.isArray(permission) ? permission : [permission];
    return permissions.some(val => permissionMap[val]);
  };

  getToken = async (key?: string) => {
    const effectiveKey = this.#getEffectivePermissionKey(key);
    const getToken = this.#getConfigurationByKey(effectiveKey)?.getToken as (() => SdMaybeAsync<string | undefined | null>) | undefined;
    if (!getToken) {
      throw new Error('[Permission] Method getToken');
    }

    const token = await SdResolveMaybeAsync(getToken());
    if (token === '') {
      return undefined;
    }
    return token;
  };

  decodeToken = async <T>(key?: string): Promise<T | null> => {
    const token = await this.getToken(key);
    if (!token) {
      return null;
    }
    try {
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Invalid token', error);
      return null;
    }
  };
}

