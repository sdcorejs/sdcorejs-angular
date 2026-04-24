import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SdInput } from '@sdcorejs/angular/forms';

@Component({
  selector: 'app-demo-input',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, SdInput],
  styles: [
    `
      .demo-container {
        padding: 32px;
        max-width: 700px;
        margin: auto;
        font-family: Roboto, 'Helvetica Neue', sans-serif;
      }
      .demo-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid #eee;
      }
      .demo-section {
        margin-bottom: 32px;
        padding: 24px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #fafafa;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
      }
      h3 {
        margin-top: 0;
        color: #2c3e50;
        font-size: 18px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .desc {
        font-size: 14px;
        color: #666;
        margin-bottom: 20px;
        line-height: 1.5;
      }
      .value-preview {
        margin-top: 12px;
        padding: 8px 12px;
        background: #e3f2fd;
        border-radius: 4px;
        font-size: 13px;
        color: #1565c0;
      }
    `,
  ],
  template: `
    <div class="demo-container">
      <div class="demo-header">
        <h2 style="margin: 0;">SdInput States Demo</h2>
        <button mat-raised-button [color]="isGlobalViewed ? 'accent' : 'primary'" (click)="toggleGlobalView()">
          <mat-icon>{{ isGlobalViewed ? 'visibility' : 'edit' }}</mat-icon>
          Tráº¡ng thÃ¡i toÃ n cá»¥c: {{ isGlobalViewed ? 'VIEW (XEM)' : 'EDIT (Sá»¬A)' }}
        </button>
      </div>

      <div class="demo-section">
        <h3><mat-icon color="primary">edit_note</mat-icon> 1. Tráº¡ng thÃ¡i Edit / Nháº­p liá»‡u</h3>
        <p class="desc">
          Tráº¡ng thÃ¡i nháº­p liá»‡u bÃ¬nh thÆ°á»ng. Thá»­ áº¥n nÃºt Ä‘á»•i tráº¡ng thÃ¡i bÃªn trÃªn Ä‘á»ƒ xem Ã´ input tá»± Ä‘á»™ng chuyá»ƒn thÃ nh dáº¡ng text tÄ©nh (View).
        </p>
        <sd-input
          label="TÃªn Ä‘Äƒng nháº­p"
          placeholder="Nháº­p tÃªn Ä‘Äƒng nháº­p"
          [(model)]="editModel"
          [required]="true"
          helperText="TrÆ°á»ng nÃ y báº¯t buá»™c nháº­p"
          [viewed]="isGlobalViewed">
        </sd-input>
        <div class="value-preview">
          GiÃ¡ trá»‹ Model hiá»‡n táº¡i: <strong>{{ editModel }}</strong>
        </div>
      </div>

      <div class="demo-section">
        <h3><mat-icon color="warn">block</mat-icon> 2. Tráº¡ng thÃ¡i Disabled (KhÃ³a)</h3>
        <p class="desc">Input bá»‹ khÃ³a cá»©ng báº±ng thuá»™c tÃ­nh <code>[disabled]="true"</code>, ngÆ°á»i dÃ¹ng khÃ´ng thá»ƒ tÆ°Æ¡ng tÃ¡c hay chá»‰nh sá»­a.</p>
        <sd-input
          label="MÃ£ API Key"
          [(model)]="disabledModel"
          [disabled]="true"
          helperText="Báº£o máº­t: KhÃ´ng thá»ƒ thay Ä‘á»•i giÃ¡ trá»‹ nÃ y"
          [viewed]="isGlobalViewed">
        </sd-input>
      </div>

      <div class="demo-section">
        <h3><mat-icon style="color: #4caf50;">visibility</mat-icon> 3. Tráº¡ng thÃ¡i Viewed (Máº·c Ä‘á»‹nh)</h3>
        <p class="desc">
          Báº­t cá»©ng <code>[viewed]="true"</code> nhÆ°ng khÃ´ng truyá»n custom template. <code>SdInput</code> sáº½ tá»± Ä‘á»™ng render Ä‘oáº¡n HTML
          fallback máº·c Ä‘á»‹nh (Label phÃ­a trÃªn, Value Ä‘áº­m phÃ­a dÆ°á»›i).
        </p>
        <sd-input label="Äá»‹a chá»‰ Email" [(model)]="viewModel" [viewed]="true"> </sd-input>
      </div>

      <div class="demo-section">
        <h3><mat-icon style="color: #ff9800;">dashboard_customize</mat-icon> 4. Custom Viewed (TÃ¹y biáº¿n cao)</h3>
        <p class="desc">
          Demo sá»± Ä‘á»“ng bá»™ vÃ  linh hoáº¡t: Dev truyá»n template <code>#sdLabel</code> Ä‘á»ƒ chÃ¨n icon vÃ o nhÃ£n, vÃ  <code>#sdValue</code> Ä‘á»ƒ format
          tiá»n tá»‡. CÃ¡ch nÃ y giáº£i quyáº¿t hoÃ n toÃ n lá»—i máº¥t Fallback khi dÃ¹ng tháº» div thÃ´ng thÆ°á»ng.
        </p>

        <sd-input [(model)]="customViewModel" [viewed]="true">
          <ng-template #sdLabel>
            <div style="color: #1976d2; font-weight: bold; display: flex; align-items: center; gap: 6px;">
              <mat-icon style="font-size: 20px; width: 20px; height: 20px;">payments</mat-icon>
              Má»¥c tiÃªu doanh thu
            </div>
          </ng-template>

          <ng-template #sdValue let-display let-value="value">
            <div style="font-size: 16px; font-weight: bold; color: #2e7d32;">+ {{ value | number: '1.0-0' }} VNÄ</div>
          </ng-template>
        </sd-input>
      </div>
    </div>
  `,
})
export class DemoInputComponent {
  // Dá»¯ liá»‡u binding cho cÃ¡c input
  editModel = 'sd_angular_dev';
  disabledModel = 'sk-live-abc123xyz890';
  viewModel = 'admin@example.com';
  customViewModel = 55000000;

  // Biáº¿n cá» báº­t/táº¯t Ä‘á»ƒ test tÃ­nh nÄƒng toggle view
  isGlobalViewed = false;

  toggleGlobalView() {
    this.isGlobalViewed = !this.isGlobalViewed;
  }
}

