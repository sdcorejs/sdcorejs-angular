import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SdButton, SdTabComponent } from '@sdcorejs/angular/components';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';

// NOTE: Import nội bộ trong module layout thì dùng path tương đối
import { SdPageComponent } from '../../../../components';
import { SdLayoutService } from '../../../../services';
import { resolveTabName } from '../../../../utils';
// End

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  templateUrl: './root.component.html',
  styleUrl: './root.component.scss',
  imports: [SdButton, SdPageComponent, SdTranslatePipe],
})
@SdTabComponent({
  component: RootComponent,
  name: () => resolveTabName('core.module.layout.forbidden.tab-name'),
  icon: 'block',
  color: 'error',
})
export class RootComponent {
  // ==========================================
  // INJECT SERVICES (Modern Angular)
  // ==========================================
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #layoutService = inject(SdLayoutService);
  readonly #i18n = inject(I18nService);

  // ==========================================
  // SIGNALS (STATE)
  // ==========================================
  // Lấy snapshot một lần lúc khởi tạo và đưa vào signal
  readonly url = signal<string>(this.#route.snapshot.queryParams?.['url'] || '');
  readonly todayInfo = signal<string>(this.#getTodayInfo(new Date()));
  userInfo = this.#layoutService.userInfo;
  // ==========================================
  // PRIVATE METHODS
  // ==========================================
  #getTodayInfo(date: Date): string {
    // WHY: weekday names i18n hóa qua key core.module.layout.weekday.<0..6>
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
  /**
   * why: `window.location.href = ''` vừa là global thô (throw khi SSR vì không có `window`), vừa chỉ
   * reload lại đúng trang lỗi này thay vì rời khỏi nó — trong khi nút mang nhãn "Về trang chủ".
   * Điều hướng bằng Router tới `homeUrl` mà consumer đã khai trong SD_LAYOUT_CONFIGURATION.
   */
  reload(): void {
    void this.#router.navigateByUrl(this.#layoutService.homeUrl);
  }
}
