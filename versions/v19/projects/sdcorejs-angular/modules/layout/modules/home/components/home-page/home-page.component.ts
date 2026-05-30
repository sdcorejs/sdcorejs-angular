import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SdTabComponent } from '@sdcorejs/angular/components';
import { I18N_STORAGE_KEY, I18N_MESSAGES, I18nService, TranslatePipe } from '@sdcorejs/angular/i18n';
import { Language } from '@sdcorejs/angular/models';

// NOTE: Import ná»™i bá»™ trong module layout thÃ¬ dÃ¹ng path tÆ°Æ¡ng Ä‘á»‘i
import { SdPageComponent } from '../../../../components';
import { SdLayoutService, SdLayoutStorageService } from '../../../../services';
import { ActivatedRoute } from '@angular/router';
// End

@Component({
  selector: 'app-home-page',
  imports: [SdPageComponent, TranslatePipe, MatIconModule],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  standalone: true,
})
@SdTabComponent({
  component: HomePageComponent,
  // WHY: decorator cháº¡y trÆ°á»›c Angular DI, nÃªn khÃ´ng inject Ä‘Æ°á»£c I18nService.
  // Äá»c ngÃ´n ngá»¯ hiá»‡n táº¡i trá»±c tiáº¿p tá»« localStorage + I18N_MESSAGES Ä‘á»ƒ cÃ³ giÃ¡ trá»‹ Ä‘Ã£ dá»‹ch.
  name: () => {
    const lang = ((): Language => {
      try {
        const stored = localStorage.getItem(I18N_STORAGE_KEY) as Language | null;
        if (stored) return stored;
      } catch { /* ignore */ }
      return 'vi';
    })();
    return I18N_MESSAGES[lang]?.['core.module.layout.home.tab-name'] ?? I18N_MESSAGES.vi['core.module.layout.home.tab-name'];
  },
  icon: 'home',
  color: 'primary',
})
export class HomePageComponent {
  // ==========================================
  // INJECT SERVICES (Modern Angular)
  // ==========================================
  readonly #layoutService = inject(SdLayoutService);
  readonly #i18n = inject(I18nService);

  // Map Language code â†’ BCP 47 locale tag dÃ¹ng cho Intl date formatting
  // WHY: must be declared before todayInfo â€” field init runs top-to-bottom; #getTodayInfo reads #localeMap.
  readonly #localeMap: Record<Language, string> = {
    vi: 'vi-VN',
    en: 'en-US',
    ja: 'ja-JP',
    ko: 'ko-KR',
    zh: 'zh-CN',
  };

  // ==========================================
  // SIGNALS (STATE)
  // ==========================================
  // Láº¥y snapshot má»™t láº§n lÃºc khá»Ÿi táº¡o vÃ  Ä‘Æ°a vÃ o signal
  readonly todayInfo = signal<string>(this.#getTodayInfo(new Date()));
  userInfo = this.#layoutService.userInfo;

  // WHY: static data, khÃ´ng cáº§n signal. `storage` + `schema` thay cho `database` + `account_tree`
  // Ä‘á»ƒ Ä‘áº£m báº£o render trÃªn má»i version cá»§a Material Icons máº·c Ä‘á»‹nh.
  readonly features = [
    { icon: 'storage', key: 'core.module.layout.home.feature.data', area: 'data' },
    { icon: 'insights', key: 'core.module.layout.home.feature.reports', area: 'report' },
    { icon: 'group', key: 'core.module.layout.home.feature.users', area: 'users' },
    { icon: 'schema', key: 'core.module.layout.home.feature.workflow', area: 'flow' },
    { icon: 'verified_user', key: 'core.module.layout.home.feature.audit', area: 'audit' },
    { icon: 'hub', key: 'core.module.layout.home.feature.integration', area: 'integ' },
  ] as const;
  // ==========================================
  // PRIVATE METHODS
  // ==========================================

  #getTimezone() {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset();
    const offsetHours = -timezoneOffset / 60;
    const sign = offsetHours >= 0 ? '+' : '';
    const simpleGmtString = `GMT${sign}${offsetHours}`;
    return simpleGmtString;
  }

  #getTodayInfo(date: Date) {
    // WHY: weekday names i18n hÃ³a qua key core.module.layout.weekday.<0..6>
    const weekday = this.#i18n.t(`core.module.layout.weekday.${date.getDay()}`);
    // WHY: dÃ¹ng locale theo ngÃ´n ngá»¯ hiá»‡n táº¡i Ä‘á»ƒ Ä‘á»‹nh dáº¡ng sá»‘ (dd/mm/yyyy vs mm/dd/yyyy ...)
    const locale = this.#localeMap[this.#i18n.language()] ?? 'vi-VN';
    const dateStr = date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const formatted = this.#i18n.t('core.module.layout.today-info.format', { weekday, date: dateStr });
    return `${formatted} (${this.#getTimezone()})`;
  }
}

