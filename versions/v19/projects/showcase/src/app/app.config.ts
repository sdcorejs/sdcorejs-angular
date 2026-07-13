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

// why: licenseKey gắn với từng domain. Key dưới đây cấp cho `sdcorejs.github.io`
// (showcase deploy lên GitHub Pages). Local dev không cần key — components có thể
// hiển thị watermark hoặc disable feature gated tùy license.
const SHOWCASE_CORE_CONFIG: ISdCoreConfiguration = {
  language: 'vi',
  licenseKey: 'OTYyMDUwNzg2c2lnbmVk',
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
