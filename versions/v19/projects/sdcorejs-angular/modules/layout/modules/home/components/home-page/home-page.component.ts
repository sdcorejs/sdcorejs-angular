import { Component, inject, signal } from '@angular/core';
import { SdTabComponent } from '@sdcorejs/angular/components';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { Language } from '@sdcorejs/angular/models';

// NOTE: Import nội bộ trong module layout thì dùng path tương đối
import { SdPageComponent } from '../../../../components';
import { SdLayoutService } from '../../../../services';
import { resolveTabName } from '../../../../utils';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
// End

@Component({
  selector: 'app-home-page',
  imports: [SdIcon, SdPageComponent, SdTranslatePipe],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  standalone: true,
})
@SdTabComponent({
  component: HomePageComponent,
  name: () => resolveTabName('core.module.layout.home.tab-name'),
  icon: 'home',
  color: 'primary',
})
export class HomePageComponent {
  // ==========================================
  // INJECT SERVICES (Modern Angular)
  // ==========================================
  readonly #layoutService = inject(SdLayoutService);
  readonly #i18n = inject(I18nService);

  // Map Language code → BCP 47 locale tag dùng cho Intl date formatting
  // WHY: must be declared before todayInfo — field init runs top-to-bottom; #getTodayInfo reads #localeMap.
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
  // Lấy snapshot một lần lúc khởi tạo và đưa vào signal
  readonly todayInfo = signal<string>(this.#getTodayInfo(new Date()));
  userInfo = this.#layoutService.userInfo;

  // WHY: static data, không cần signal. `storage` + `schema` thay cho `database` + `account_tree`
  // để đảm bảo render trên mọi version của Material Icons mặc định.
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
    // WHY: weekday names i18n hóa qua key core.module.layout.weekday.<0..6>
    const weekday = this.#i18n.t(`core.module.layout.weekday.${date.getDay()}`);
    // WHY: dùng locale theo ngôn ngữ hiện tại để định dạng số (dd/mm/yyyy vs mm/dd/yyyy ...)
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
