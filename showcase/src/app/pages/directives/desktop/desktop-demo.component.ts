import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdDesktopDirective, SdMobileDirective } from '@sdcorejs/angular/directives';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-desktop-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdDesktopDirective, SdMobileDirective],
  template: `
    <demo-page
      #demoPage
      title="Desktop Directive"
      description="*sdDesktop chỉ tạo embedded view khi thiết bị KHÔNG phải mobile. Quyết định diễn ra một lần trong constructor, không theo dõi resize.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chi-render-tren-desktop') {
        <demo-section
          heading="Chỉ render trên desktop"
          [props]="[{ name: '*sdDesktop', value: 'true' }]"
          note="Khối bên dưới chỉ tồn tại trong DOM khi BrowserUtilities.isMobile() trả về false — không phải ẩn bằng CSS.">
          <div class="device-box">
            <div *sdDesktop class="device-card device-card--desktop" data-desktop-block>Nội dung chỉ dành cho desktop</div>
            <code data-is-mobile>BrowserUtilities.isMobile() = {{ isMobile }}</code>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cap-doi-voi-sdmobile') {
        <demo-section
          heading="Cặp đôi với sdMobile"
          [props]="[
            { name: '*sdDesktop', value: 'true' },
            { name: '*sdMobile', value: 'true' },
          ]"
          note="Hai directive loại trừ nhau, nên đặt cạnh nhau là cách rẽ nhánh markup theo thiết bị mà không cần *ngIf thủ công.">
          <div class="device-box">
            <div *sdDesktop class="device-card device-card--desktop">Bố cục desktop: bảng nhiều cột</div>
            <div *sdMobile class="device-card device-card--mobile">Bố cục mobile: danh sách thẻ</div>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: `
    .device-box {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }

    .device-card {
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid #dfe3e8;
    }

    .device-card--desktop {
      background: #eef4ff;
    }

    .device-card--mobile {
      background: #fff4e6;
    }

    code {
      padding: 8px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesktopDemoComponent {
  readonly isMobile = BrowserUtilities.isMobile();
}
