import { DOCUMENT } from '@angular/common';
import { InjectionToken, inject } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdUnsavedChangesConfirmationAdapter, SdUnsavedChangesDecision, SdUnsavedChangesPromptContext } from './unsaved-changes.model';

export interface SdUnsavedChangesWindow {
  addEventListener(type: 'beforeunload', listener: (event: BeforeUnloadEvent) => void): void;
  removeEventListener(type: 'beforeunload', listener: (event: BeforeUnloadEvent) => void): void;
  confirm?(message?: string): boolean;
}

export const SD_UNSAVED_CHANGES_WINDOW = new InjectionToken<SdUnsavedChangesWindow | null>('SD_UNSAVED_CHANGES_WINDOW', {
  factory: () => inject(DOCUMENT).defaultView as SdUnsavedChangesWindow | null,
});

export const SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER = new InjectionToken<SdUnsavedChangesConfirmationAdapter>(
  'SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER',
  {
    factory: () => {
      const windowRef = inject(SD_UNSAVED_CHANGES_WINDOW);
      const i18n = inject(I18nService);
      return {
        confirm: (context: SdUnsavedChangesPromptContext): SdUnsavedChangesDecision => {
          if (!windowRef?.confirm) return 'cancel';
          const message = context.message || i18n.t('core.service.unsaved-changes.message');
          return windowRef.confirm(message) ? 'discard' : 'cancel';
        },
      };
    },
  }
);
