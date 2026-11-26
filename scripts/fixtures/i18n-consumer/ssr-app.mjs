import '@angular/compiler';
import { Component, inject } from '@angular/core';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { I18nService, provideSdI18n } from '@sdcorejs/angular/i18n';

class LanguagePage {
  i18n = inject(I18nService);
}
Component({
  selector: 'fixture-app',
  standalone: true,
  template: '<h1 [attr.lang]="i18n.language()">{{ i18n.t("core.module.layout.home.tab-name") }}</h1>',
})(LanguagePage);

export function bootstrapLocale(language, context, serverProviders = [], beforeLoad = async () => {}) {
  return bootstrapApplication(
    LanguagePage,
    {
      providers: [
        provideClientHydration(),
        ...serverProviders,
        provideSdI18n({
          defaultLanguage: language,
          loaders: {
            vi: async () => {
              await beforeLoad();
              return (await import('@sdcorejs/angular/i18n/locales/vi')).VI_MESSAGES;
            },
            en: async () => {
              await beforeLoad();
              return (await import('@sdcorejs/angular/i18n/locales/en')).EN_MESSAGES;
            },
          },
        }),
      ],
    },
    context
  );
}
