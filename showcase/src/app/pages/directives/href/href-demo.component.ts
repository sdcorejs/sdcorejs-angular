import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdHrefDirective } from '@sdcorejs/angular/directives';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-href-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdHrefDirective],
  template: `
    <demo-page
      #demoPage
      title="Href Directive"
      description="a[sdHref] nhận MỘT chuỗi url rồi tự chọn cách đi: link nội bộ đi qua Router (không reload), link http/https ra ngoài mở tab mới kèm noopener.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-link-noi-bo-di-qua-router') {
        <demo-section
          heading="Link nội bộ đi qua Router"
          [props]="[{ name: '[sdHref]', value: 'url' }]"
          note="Chuỗi không phải http/https được tách path + query rồi đẩy sang Router.navigate — bấm không nạp lại trang.">
          <a class="demo-link" [sdHref]="internalUrl" data-href-internal>Mở trang Tooltip Directive</a>
          <code>{{ internalUrl }}</code>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-link-ngoai-mo-tab-moi-an-toan') {
        <demo-section
          heading="Link ngoài mở tab mới an toàn"
          [props]="[{ name: '[sdHref]', value: 'https url' }]"
          note="Chỉ url parse ra đúng scheme http:/https: mới được coi là link ngoài, và luôn mở kèm noopener,noreferrer để chặn reverse tabnabbing.">
          <a class="demo-link" [sdHref]="externalUrl" data-href-external>Mở angular.dev</a>
          <code>{{ externalUrl }}</code>
        </demo-section>
      }
    </demo-page>
  `,
  styles: `
    .demo-link {
      display: inline-block;
      padding: 10px 14px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #eef4ff;
      color: var(--sd-primary, #005cbb);
      font-weight: 600;
      text-decoration: none;
    }

    code {
      padding: 8px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
      font-size: 13px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HrefDemoComponent {
  readonly internalUrl = '/v/latest/directives/tooltip';
  readonly externalUrl = 'https://angular.dev';
}
