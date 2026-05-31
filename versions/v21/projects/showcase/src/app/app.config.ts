import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { ISdCoreConfiguration, SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
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
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    { provide: SD_CORE_CONFIGURATION, useValue: SHOWCASE_CORE_CONFIG },
  ],
};
