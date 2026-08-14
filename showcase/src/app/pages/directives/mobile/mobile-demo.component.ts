import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdDesktopDirective, SdMobileDirective } from '@sdcorejs/angular/directives';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-mobile-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdDesktopDirective, SdMobileDirective],
  template: `
    <demo-page
      #demoPage
      title="Mobile Directive"
      description="*sdMobile chỉ tạo embedded view trên thiết bị mobile. Cùng một quyết định một-lần như *sdDesktop, chỉ đảo điều kiện.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chi-render-tren-mobile') {
        <demo-section
          heading="Chỉ render trên mobile"
          [props]="[{ name: '*sdMobile', value: 'true' }]"
          note="Mở DevTools ở chế độ device rồi tải lại trang để thấy khối này xuất hiện — directive đọc user agent lúc khởi tạo, không phản ứng với resize.">
          <div class="device-box">
            <div *sdMobile class="device-card device-card--mobile" data-mobile-block>Nội dung chỉ dành cho mobile</div>
            <code data-is-mobile>BrowserUtilities.isMobile() = {{ isMobile }}</code>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cap-doi-voi-sddesktop') {
        <demo-section
          heading="Cặp đôi với sdDesktop"
          [props]="[
            { name: '*sdMobile', value: 'true' },
            { name: '*sdDesktop', value: 'true' },
          ]"
          note="Đúng một trong hai nhánh tồn tại trong DOM, nên không có chi phí render cho nhánh còn lại.">
          <div class="device-box">
            <div *sdMobile class="device-card device-card--mobile">Thanh hành động dán đáy màn hình</div>
            <div *sdDesktop class="device-card device-card--desktop">Thanh hành động nằm trong toolbar</div>
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
export class MobileDemoComponent {
  readonly isMobile = BrowserUtilities.isMobile();
}
