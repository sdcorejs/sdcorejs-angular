import { Injectable, inject } from '@angular/core';
import { SdStorage, SdStorageService } from '@sdcorejs/angular/services';
import { SdLayoutChildrenMenu, SdLayoutMenu } from '../menu/menu.model';
import { getMenuStableKey, resolveMenuKeys } from '../menu/menu.utils';

@Injectable({
  providedIn: 'root',
})
export class SdLayoutStorageService {
  readonly #sdStorageService = inject(SdStorageService);

  readonly isShowSidebar: SdStorage<boolean> = this.#sdStorageService.create('cb07c316-ed6d-4620-9e92-53dbef6aa983');
  readonly menuLockStatus: SdStorage<boolean> = this.#sdStorageService.create('2c2f4816-18b3-4ec3-8177-7b90bff036c3');
  readonly lastActiveMenuGroupId: SdStorage<string> = this.#sdStorageService.create('2e6961d0-3380-4a94-a6a1-38837560cd96');
  readonly pinnedMenuGroup: SdStorage<SdLayoutChildrenMenu> = this.#sdStorageService.create('e81da122-5dab-4250-b309-64197fb19d44');
  readonly pinnedMenuKeys: SdStorage<string[]> = this.#sdStorageService.create('4bdc7f80-9ff4-4fe0-908f-6c9f7fe4100a');
  readonly recentMenuKeys: SdStorage<string[]> = this.#sdStorageService.create('fb989dc1-f6e7-4b62-a611-861a8f214a51');
  readonly versionStates: SdStorage<Record<string, SdLayoutVersionState>> = this.#sdStorageService.create(
    'ca8e4261-fbd4-4209-af88-2dbe278c1a1b'
  );

  readPinnedMenuKeys(menus: SdLayoutMenu[]): string[] {
    const storedKeys = this.pinnedMenuKeys.has() ? this.pinnedMenuKeys.get() : this.#getLegacyPinnedKeys();
    const validKeys = this.#resolveValidKeys(menus, storedKeys ?? []);
    if (!this.pinnedMenuKeys.has() || !this.#sameKeys(storedKeys ?? [], validKeys)) {
      this.pinnedMenuKeys.set(validKeys);
    }
    return validKeys;
  }

  writePinnedMenuKeys(keys: string[]): void {
    this.pinnedMenuKeys.set([...new Set(keys.filter(Boolean))]);
  }

  readRecentMenuKeys(menus: SdLayoutMenu[], maximum = 5): string[] {
    const storedKeys = this.recentMenuKeys.get() ?? [];
    const limit = Number.isFinite(maximum) && maximum > 0 ? Math.floor(maximum) : 5;
    const validKeys = this.#resolveValidKeys(menus, storedKeys).slice(0, limit);
    if (!this.#sameKeys(storedKeys, validKeys)) this.recentMenuKeys.set(validKeys);
    return validKeys;
  }

  writeRecentMenuKeys(keys: string[]): void {
    this.recentMenuKeys.set([...new Set(keys.filter(Boolean))]);
  }

  readVersionState(version: 1 | 2 | 3): SdLayoutVersionState {
    return this.versionStates.get()?.[String(version)] ?? {};
  }

  patchVersionState(version: 1 | 2 | 3, patch: SdLayoutVersionState): SdLayoutVersionState {
    const states = this.versionStates.get() ?? {};
    const nextState = { ...(states[String(version)] ?? {}), ...patch };
    this.versionStates.set({ ...states, [String(version)]: nextState });
    return nextState;
  }

  #getLegacyPinnedKeys(): string[] {
    const legacyGroup = this.pinnedMenuGroup.get();
    if (!legacyGroup || !Array.isArray(legacyGroup.children)) return [];
    return legacyGroup.children.map(menu => getMenuStableKey(menu)).filter(Boolean);
  }

  #resolveValidKeys(menus: SdLayoutMenu[], keys: string[]): string[] {
    return resolveMenuKeys(menus, keys)
      .map(menu => getMenuStableKey(menu))
      .filter(Boolean);
  }

  #sameKeys(left: string[], right: string[]): boolean {
    return left.length === right.length && left.every((key, index) => key === right[index]);
  }
}

export interface SdLayoutVersionState {
  activeGroupKey?: string;
  locked?: boolean;
  collapsed?: boolean;
}
