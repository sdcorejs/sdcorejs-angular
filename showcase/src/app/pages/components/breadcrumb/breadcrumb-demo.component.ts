import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdBreadcrumb, SdBreadcrumbItem } from '@sdcorejs/angular/components/breadcrumb';
import { BehaviorSubject } from 'rxjs';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-breadcrumb-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdBreadcrumb],
  template: `
    <demo-page
      #demoPage
      title="Breadcrumb"
      description="SdBreadcrumb – semantic navigation cho static items hoặc route.data.breadcrumb, hỗ trợ label async và overflow.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-danh-sach-tinh') {
        <demo-section
          heading="Danh sách tĩnh"
          [props]="[
            { name: 'items', value: '6 items' },
            { name: 'maxItems', value: '4' },
          ]"
          note="Root, dấu rút gọn và context cuối được giữ; item disabled không trở thành control tương tác.">
          <sd-breadcrumb [items]="staticItems" [maxItems]="4"></sd-breadcrumb>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-router-generated') {
        <demo-section
          heading="Router-generated"
          [props]="[{ name: 'route.data.breadcrumb', value: 'resolver' }]"
          note="Không truyền items: component đọc primary route chain của chính trang tài liệu này và cập nhật sau NavigationEnd.">
          <sd-breadcrumb></sd-breadcrumb>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhan-async') {
        <demo-section
          heading="Nhãn async"
          [props]="[{ name: 'label', value: 'Observable<string>' }]"
          note="Observable label được cập nhật trực tiếp và tự unsubscribe khi source/component bị thay thế.">
          <sd-breadcrumb [items]="asyncItems"></sd-breadcrumb>
          <button type="button" data-resolve-label (click)="resolveAsyncLabel()">Resolve label</button>
        </demo-section>
      }
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbDemoComponent {
  readonly #asyncLabel = new BehaviorSubject('Đang tải nhãn');

  readonly staticItems: SdBreadcrumbItem[] = [
    { label: 'Trang chủ', icon: 'home', url: '/' },
    { label: 'Vận hành', url: '/operations' },
    { label: 'Đơn hàng', url: '/operations/orders' },
    { label: 'Đã lưu trữ', disabled: true },
    { label: 'Tháng 7', url: '/operations/orders/july' },
    { label: 'ORD-0042' },
  ];

  readonly asyncItems: SdBreadcrumbItem[] = [{ label: 'Đơn hàng', url: '/orders' }, { label: this.#asyncLabel }];

  resolveAsyncLabel(): void {
    this.#asyncLabel.next('Đơn hàng #42');
  }
}
