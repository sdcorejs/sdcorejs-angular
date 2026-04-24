import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SdButton } from '@sdcorejs/angular/components';

// NOTE: Import ná»™i bá»™ trong module layout thÃ¬ dÃ¹ng path tÆ°Æ¡ng Ä‘á»‘i
import { SdPageComponent } from '../../../../components';
import { SdLayoutService, SdLayoutStorageService } from '../../../../services';
// End

@Component({
  templateUrl: './root.component.html',
  styleUrls: ['./root.component.scss'],
  imports: [SdButton, SdPageComponent],
})
export class RootComponent {
  // ==========================================
  // INJECT SERVICES (Modern Angular)
  // ==========================================
  readonly #route = inject(ActivatedRoute);
  readonly #layoutService = inject(SdLayoutService);

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
    })}`;
  }

  // ==========================================
  // PUBLIC METHODS
  // ==========================================
  reload() {
    window.location.href = '';
  }
}

