import { Injectable, computed, inject, signal } from '@angular/core';
import { ResolvedSidebarRecentConfiguration } from '../../configurations';
import { SdLayoutMenu } from '../menu/menu.model';
import { getMenuStableKey, resolveMenuKeys } from '../menu/menu.utils';
import { SdLayoutStorageService, SdLayoutVersionState } from '../storage/storage.service';

@Injectable({ providedIn: 'root' })
export class SdLayoutNavigationStateService {
  readonly #storage = inject(SdLayoutStorageService);
  readonly #menus = signal<SdLayoutMenu[]>([]);
  readonly pinnedKeys = signal<string[]>([]);
  readonly recentKeys = signal<string[]>([]);
  readonly pinnedMenus = computed(() => resolveMenuKeys(this.#menus(), this.pinnedKeys()));
  readonly recentMenus = computed(() => resolveMenuKeys(this.#menus(), this.recentKeys()));

  hydrate(menus: SdLayoutMenu[], recentMaximum = 5): void {
    this.#menus.set(menus);
    this.pinnedKeys.set(this.#storage.readPinnedMenuKeys(menus));
    this.recentKeys.set(this.#storage.readRecentMenuKeys(menus, recentMaximum));
  }

  togglePinned(menu: SdLayoutMenu): void {
    const key = getMenuStableKey(menu);
    if (!key) return;
    const nextKeys = this.pinnedKeys().includes(key)
      ? this.pinnedKeys().filter(currentKey => currentKey !== key)
      : [...this.pinnedKeys(), key];
    this.pinnedKeys.set(nextKeys);
    this.#storage.writePinnedMenuKeys(nextKeys);
  }

  recordRecent(menu: SdLayoutMenu, configuration: ResolvedSidebarRecentConfiguration): void {
    if (!configuration.enabled) return;
    const key = getMenuStableKey(menu);
    if (!key) return;
    const maximum = Number.isFinite(configuration.maxItems) && configuration.maxItems > 0 ? Math.floor(configuration.maxItems) : 5;
    const nextKeys = [key, ...this.recentKeys().filter(currentKey => currentKey !== key)].slice(0, maximum);
    this.recentKeys.set(nextKeys);
    this.#storage.writeRecentMenuKeys(nextKeys);
  }

  patchVersionState(version: 1 | 2 | 3, patch: SdLayoutVersionState): void {
    this.#storage.patchVersionState(version, patch);
  }

  versionState(version: 1 | 2 | 3): SdLayoutVersionState {
    return this.#storage.readVersionState(version);
  }
}
