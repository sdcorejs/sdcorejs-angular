import '@angular/compiler';
import { Component, inject } from '@angular/core';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideSdCore } from '@sdcorejs/angular/core';
import { provideAppInitializer } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';

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
      providers: [provideClientHydration(), ...serverProviders, provideSdCore({ language }), provideAppInitializer(beforeLoad)],
    },
    context
  );
}
