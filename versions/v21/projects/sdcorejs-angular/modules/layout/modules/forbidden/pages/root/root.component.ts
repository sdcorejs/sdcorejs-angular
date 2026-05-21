import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SdButton } from '@sdcorejs/angular/components';
import { I18nService, TranslatePipe } from '@sdcorejs/angular/i18n';

// NOTE: Import ná»™i bá»™ trong module layout thÃ¬ dÃ¹ng path tÆ°Æ¡ng Ä‘á»‘i
import { SdPageComponent } from '../../../../components';
import { SdLayoutService, SdLayoutStorageService } from '../../../../services';
// End

@Component({
  templateUrl: './root.component.html',
  styleUrls: ['./root.component.scss'],
  imports: [SdButton, SdPageComponent, TranslatePipe],
})
export class RootComponent {
  // ==========================================
  // INJECT SERVICES (Modern Angular)
  // ==========================================
  readonly #route = inject(ActivatedRoute);
  readonly #layoutService = inject(SdLayoutService);
  readonly #i18n = inject(I18nService);

  // ==========================================
  // SIGNALS (STATE)
  // ==========================================
  // Láº¥y snapshot má»™t láº§n lÃºc khá»Ÿi táº¡o vÃ  Ä‘Æ°a vÃ o signal
  readonly url = signal<string>(this.#route.snapshot.queryParams?.['url'] || '');
  readonly todayInfo = signal<string>(this.#getTodayInfo(new Date()));
  userInfo = this.#layoutService.userInfo;
  // ==========================================
  // PRIVATE METHODS
  // ==========================================
  #getTodayInfo(date: Date): string {
    // WHY: weekday names i18n hÃ³a qua key core.module.layout.weekday.<0..6>
    const weekday = this.#i18n.t(`core.module.layout.weekday.${date.getDay()}`);
    const dateStr = date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return this.#i18n.t('core.module.layout.today-info.format', { weekday, date: dateStr });
  }

  // ==========================================
  // PUBLIC METHODS
  // ==========================================
  reload() {
    window.location.href = '';
  }
}

