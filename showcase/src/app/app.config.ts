import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import {
  LucideChevronDown,
  LucideChevronRight,
  LucideCircleAlert,
  LucideCircleCheck,
  LucideDownload,
  LucideEllipsisVertical,
  LucideEye,
  LucideGripVertical,
  LucideInfo,
  LucidePencil,
  LucidePlus,
  LucideRefreshCw,
  LucideSave,
  LucideSearch,
  LucideSettings,
  LucideTag,
  LucideTrash2,
  LucideTriangleAlert,
  LucideUpload,
  LucideX,
} from '@lucide/angular';
import { ISdCoreConfiguration, SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { provideSdIcon } from '@sdcorejs/angular/modules/icon';
import { routes } from './app.routes';

const SHOWCASE_CORE_CONFIG: ISdCoreConfiguration = {
  language: 'vi',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideHttpClient(withFetch()),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })),
    provideSdIcon({
      defaultFontSet: 'material-icons-outlined',
      lucideIcons: [
        LucideChevronDown,
        LucideChevronRight,
        LucideCircleAlert,
        LucideCircleCheck,
        LucideDownload,
        LucideEllipsisVertical,
        LucideEye,
        LucideGripVertical,
        LucideInfo,
        LucidePencil,
        LucidePlus,
        LucideRefreshCw,
        LucideSave,
        LucideSearch,
        LucideSettings,
        LucideTag,
        LucideTrash2,
        LucideTriangleAlert,
        LucideUpload,
        LucideX,
      ],
    }),
    { provide: SD_CORE_CONFIGURATION, useValue: SHOWCASE_CORE_CONFIG },
  ],
};
