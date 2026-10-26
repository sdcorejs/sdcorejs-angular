import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { type SdUnsavedChangesConfirmationAdapter, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';

/**
 * Guard rời trang của `sd-page-form`: còn thay đổi chưa lưu (watcher của `SdUnsavedChangesService`, thường đăng ký
 * bằng `registerSdUnsavedChangesForm(..., { dirty: 'value' })`) thì hỏi bằng dialog xác nhận của Core.
 *
 * why: adapter của service là của cả app (mặc định `window.confirm`); guard này truyền adapter riêng cho lần hỏi
 * này nên app đang dùng `sdUnsavedChangesGuard` không đổi hành vi.
 */
export const sdPageFormLeaveGuard: CanDeactivateFn<unknown> = () => {
  const confirmService = inject(SdConfirmService);
  const i18n = inject(I18nService);
  const adapter: SdUnsavedChangesConfirmationAdapter = {
    confirm: async context => {
      const message = context.watchers.find(watcher => watcher.message)?.message ?? i18n.t('core.module.layout.page.leave.message');
      try {
        await confirmService.confirm(message, {
          title: i18n.t('core.module.layout.page.leave.title'),
          yesTitle: i18n.t('core.module.layout.page.leave.leave'),
          noTitle: i18n.t('core.module.layout.page.leave.stay'),
          yesButtonColor: 'warning',
        });
        return 'discard';
      } catch {
        return 'cancel';
      }
    },
  };
  return inject(SdUnsavedChangesService).confirmLeave({ reason: 'navigation', adapter });
};
