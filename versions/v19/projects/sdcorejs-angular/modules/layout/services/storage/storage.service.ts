import { Injectable, inject } from '@angular/core';
import { SdStorage, SdStorageService } from '@sdcorejs/angular/services';
import { ISdLayoutConfiguration, SD_LAYOUT_CONFIGURATION } from '../../configurations';
import { SdLayoutChildrenMenu } from '../menu/menu.model';

@Injectable({
  providedIn: 'root',
})
export class SdLayoutStorageService {
  // Thông tin state của sidebar
  isShowSidebar: SdStorage<boolean>;
  menuLockStatus: SdStorage<boolean>;
  lastActiveMenuGroupId: SdStorage<string>;
  pinnedMenuGroup: SdStorage<SdLayoutChildrenMenu>;
  // End

  constructor(private sdStorageService: SdStorageService) {
    // State sidebar
    this.isShowSidebar = this.sdStorageService.create('cb07c316-ed6d-4620-9e92-53dbef6aa983');
    this.menuLockStatus = this.sdStorageService.create('2c2f4816-18b3-4ec3-8177-7b90bff036c3');
    this.lastActiveMenuGroupId = this.sdStorageService.create('2e6961d0-3380-4a94-a6a1-38837560cd96');
    this.pinnedMenuGroup = this.sdStorageService.create('e81da122-5dab-4250-b309-64197fb19d44');
    // End
  }
}
