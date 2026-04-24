import { Component, inject, signal } from '@angular/core';
import { SdTabComponent } from '@sdcorejs/angular/components';

// NOTE: Import ná»™i bá»™ trong module layout thÃ¬ dÃ¹ng path tÆ°Æ¡ng Ä‘á»‘i
import { SdPageComponent } from '../../../../components';
import { SdLayoutService, SdLayoutStorageService } from '../../../../services';
import { ActivatedRoute } from '@angular/router';
// End

@Component({
  selector: 'app-home-page',
  imports: [SdPageComponent],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  standalone: true,
})
@SdTabComponent({
  component: HomePageComponent,
  name: 'Trang chá»§',
  icon: 'home',
  color: 'primary',
})
export class HomePageComponent {
  // ==========================================
  // INJECT SERVICES (Modern Angular)
  // ==========================================
  readonly #route = inject(ActivatedRoute);
  readonly #layoutService = inject(SdLayoutService);

  // ==========================================
  // SIGNALS (STATE)
  // ==========================================
  // Láº¥y snapshot má»™t láº§n lÃºc khá»Ÿi táº¡o vÃ  Ä‘Æ°a vÃ o signal
  readonly todayInfo = signal<string>(this.#getTodayInfo(new Date()));
  userInfo = this.#layoutService.userInfo;
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
    const mapping = {
      0: 'Chá»§ Nháº­t',
      1: 'Thá»© 2',
      2: 'Thá»© 3',
      3: 'Thá»© 4',
      4: 'Thá»© 5',
      5: 'Thá»© 6',
      6: 'Thá»© 7',
    };
    return `${mapping[date.getDay() as keyof typeof mapping]}, ngÃ y ${date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })} (${this.#getTimezone()})`;
  }
}

