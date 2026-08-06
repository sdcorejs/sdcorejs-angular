import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-viewport-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent],
  template: `
    <demo-page
      #demoPage
      title="Viewport"
      description="SdViewportService – một nguồn signal SSR-safe cho kích thước viewport và breakpoint mobile/tablet/desktop.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai-truc-tiep') {
        <demo-section
          heading="Trạng thái trực tiếp"
          [props]="[
            { name: 'width / height', value: 'Signal<number>' },
            { name: 'currentBreakpoint', value: viewport.currentBreakpoint() },
          ]"
          note="Thay đổi kích thước cửa sổ để quan sát các signal cập nhật từ cùng một resize listener.">
          <div class="viewport-state">
            <strong data-viewport-size>{{ viewport.width() }} × {{ viewport.height() }}</strong>
            <span data-current-breakpoint>{{ viewport.currentBreakpoint() }}</span>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-breakpoint-mac-dinh') {
        <demo-section
          heading="Breakpoint mặc định"
          [props]="[
            { name: 'mobile', value: viewport.breakpoints.mobile },
            { name: 'tablet', value: viewport.breakpoints.tablet },
            { name: 'desktop', value: viewport.breakpoints.desktop },
          ]"
          note="Các mốc dùng min-width semantics; có thể override toàn bộ qua SD_VIEWPORT_BREAKPOINTS.">
          <div class="breakpoint-list">
            <code>mobile: {{ viewport.breakpoints.mobile }}</code>
            <code>tablet: {{ viewport.breakpoints.tablet }}</code>
            <code>desktop: {{ viewport.breakpoints.desktop }}</code>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-signal-theo-breakpoint') {
        <demo-section
          heading="Signal theo breakpoint"
          [props]="[
            { name: 'isMobile()', value: viewport.isMobile() },
            { name: 'isTablet()', value: viewport.isTablet() },
            { name: 'isDesktop()', value: viewport.isDesktop() },
          ]"
          note="Consumer chỉ đọc signal, không tự đăng ký hoặc cleanup listener.">
          <div class="breakpoint-list">
            <code>isMobile: {{ viewport.isMobile() }}</code>
            <code>isTablet: {{ viewport.isTablet() }}</code>
            <code>isDesktop: {{ viewport.isDesktop() }}</code>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: `
    .viewport-state,
    .breakpoint-list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }

    .viewport-state strong,
    .viewport-state span,
    .breakpoint-list code {
      padding: 8px 12px;
      border: 1px solid #dfe3e8;
      border-radius: 8px;
      background: #f7f9fb;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewportDemoComponent {
  readonly viewport = inject(SdViewportService);
}
