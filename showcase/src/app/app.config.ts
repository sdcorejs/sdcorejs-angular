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
import { provideSdIcon, SD_DATA_TYPE_LUCIDE_ICONS } from '@sdcorejs/angular/modules/icon';
import { routes } from './app.routes';
import { showcaseTimeZone } from './showcase-time-zone';

const SHOWCASE_CORE_CONFIG: ISdCoreConfiguration = {
  language: 'vi',
  // ?timeZone=Asia/Ho_Chi_Minh shows every date in that zone (read once; reload to change it).
  timeZone: showcaseTimeZone(typeof location === 'undefined' ? '' : location.search),
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
        // why: the data-type icons of the generic configuration screen and the Icon page (opt-in, D-014).
        ...SD_DATA_TYPE_LUCIDE_ICONS,
      ],
    }),
    { provide: SD_CORE_CONFIGURATION, useValue: SHOWCASE_CORE_CONFIG },
  ],
};
