import { Component, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { languages, providers } from './providers';

@Component({
  selector: 'fixture-app',
  imports: [SdTranslatePipe],
  template: `
    <main [attr.lang]="i18n.language()">
      <h1>{{ 'core.module.layout.home.tab-name' | sdTranslate }}</h1>
      @for (language of languages; track language) {
        <button (click)="i18n.setLanguage(language)" [attr.aria-pressed]="i18n.language() === language">{{ language.toUpperCase() }}</button>
      }
      <p>{{ 'core.common.cancel' | sdTranslate }}</p>
    </main>
  `,
})
class FixtureApp {
  readonly languages = languages;
  readonly i18n = inject(I18nService);
}

bootstrapApplication(FixtureApp, { providers }).catch(() => {
  document.body.textContent = 'Language unavailable. Reload to retry.';
});
