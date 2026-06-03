import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdInputColor } from '@sdcorejs/angular/forms/input-color';

@Component({
  selector: 'app-input-color-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdInputColor, FormsModule],
  template: `
    <demo-page
      title="Input Color"
      description="Ô nhập mã màu HEX với swatch hiển thị màu hiện tại. Bấm swatch để mở bảng chọn màu hoặc gõ tay mã HEX (#RGB / #RRGGBB / #RRGGBBAA).">

      <demo-section heading="Cơ bản" note="Giá trị bind hai chiều — pick hoặc gõ tay đều cập nhật signal.">
        <div class="row">
          <sd-input-color label="Màu thương hiệu" [(model)]="brand" />
          <span class="value">Đang chọn: <code>{{ brand() || '(trống)' }}</code></span>
        </div>
      </demo-section>

      <demo-section heading="Validator (required + hex)" note="Để trống hoặc gõ chuỗi sai định dạng (vd 'red') sẽ hiện lỗi.">
        <sd-input-color
          label="required"
          helperText="Định dạng #RGB, #RRGGBB hoặc #RRGGBBAA"
          [required]="true"
          [(model)]="tagColor" />
      </demo-section>

      <demo-section heading="Trạng thái (state)">
        <sd-input-color label="disabled" [model]="'#1565C0'" [disabled]="true" />
        <sd-input-color label="readonly" [model]="'#4CAF50'" [readonly]="true" />
        <sd-input-color label="viewed" [model]="'#F82C13'" [viewed]="true" />
      </demo-section>

      <demo-section heading="Hex dạng ngắn / kèm alpha" note="Picker tự normalize #RGB → #RRGGBB và bỏ alpha; swatch giữ giá trị thật.">
        <div class="row">
          <sd-input-color label="Hex 3 ký tự" [(model)]="shortHex" />
          <span class="value">Swatch hiển thị: <code>{{ shortHex() }}</code></span>
        </div>
        <div class="row">
          <sd-input-color label="Hex 8 ký tự (có alpha)" [(model)]="alphaHex" />
          <span class="value">Swatch hiển thị: <code>{{ alphaHex() }}</code></span>
        </div>
      </demo-section>

      <demo-section heading="Inline edit ('inline')" note="Hiển thị như text — bấm vào để sửa. Khi disabled thì rơi về xem tĩnh (viewed=true).">
        <div class="row">
          <sd-input-color label="Màu inline" [viewed]="'inline'" [(model)]="inlineColor" />
          <span class="value">Giá trị: <b>{{ inlineColor() ?? '(trống)' }}</b></span>
        </div>
        <div class="row">
          <sd-input-color label="disabled + inline → tĩnh" [viewed]="'inline'" [(model)]="inlineColor" [disabled]="true" />
        </div>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    :host ::ng-deep demo-section .demo-section__body {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .value {
      font-size: 13px;
      color: #4a4a4a;
    }
    code {
      background: #f0f3f7;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputColorDemoComponent {
  readonly brand = signal<string | undefined>('#1565C0');
  readonly tagColor = signal<string | undefined>(undefined);
  readonly shortHex = signal<string | undefined>('#0AF');
  readonly alphaHex = signal<string | undefined>('#1565C088');
  readonly inlineColor = signal<string | undefined>('#1565C0');
}
