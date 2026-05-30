import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { ISdCoreConfiguration, SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { routes } from './app.routes';

const SHOWCASE_CORE_CONFIG: ISdCoreConfiguration = { language: 'vi' };

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

