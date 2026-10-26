import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTable, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdPageList } from '@sdcorejs/angular/modules/layout';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { ORDER_STATUSES, ORDERS, type Order } from './page-list-demo.data';

@Component({
  selector: 'app-page-list-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdPageList, SdTable, SdButton, RouterLink],
  template: `
    <demo-page #demoPage
      title="Page List"
      description="Màn danh sách có sd-table: thân vừa khít màn hình, paginator luôn thấy, chi tiết là route con.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-danh-sach-vua-khit-khung') {
      <demo-section heading="Danh sách vừa khít khung" [props]="[{ name: 'sd-table', value: 'bảng chính' }, { name: 'autoCompact', value: 'true' }]" note="Khung cao 420px: bảng lấp phần còn lại, chỉ vùng dữ liệu cuộn, footer đứng yên.">
        <div class="frame">
          <sd-page-list title="Đơn hàng" description="Đơn bán lẻ từ mọi kênh.">
            <sd-button headerRight title="Tạo đơn hàng" prefixIcon="add" type="fill" color="primary"></sd-button>
            <sd-table [option]="option"></sd-table>
          </sd-page-list>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-man-song-toan-trang') {
      <demo-section heading="Màn sống toàn trang" [props]="[{ name: 'detail', value: 'page | drawer' }, { name: 'route', value: '/pattern/order' }]" note="Mở màn đơn hàng của @sdcorejs/angular/modules/pattern; cấu hình đổi bằng ?cfg= hoặc drawer Tuỳ chỉnh hiển thị (tab, score card, external filter, chọn nhiều, autoCompact, cách mở chi tiết).">
        <div class="links">
          @for (link of links; track link.label) {
            <a class="link" [routerLink]="base" [queryParams]="{ cfg: link.cfg }">{{ link.label }}</a>
          }
        </div>
      </demo-section>
      }
    </demo-page>
  `,
  styles: [`
    .frame {
      width: 100%;
      box-sizing: border-box;
      height: 420px;
      display: flex;
      flex-direction: column;
      border: 1px solid #e6e6e6;
      border-radius: 8px;
      overflow: hidden;
    }
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .link {
      padding: 6px 12px;
      border: 1px solid #e3e4ea;
      border-radius: 6px;
      color: var(--sd-primary, #005cbb);
      text-decoration: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageListDemoComponent {
  readonly base = '/pattern/order';
  readonly links = [
    { label: 'Mặc định (drawer)', cfg: JSON.stringify({}) },
    { label: 'Tab + score card', cfg: JSON.stringify({ tabs: true, score: true }) },
    { label: 'External filter', cfg: JSON.stringify({ quickSearch: false, externalFilter: true }) },
    { label: 'Chọn nhiều', cfg: JSON.stringify({ selector: true }) },
    { label: 'Chi tiết dạng trang', cfg: JSON.stringify({ detail: 'page' }) },
    { label: 'Tắt autoCompact', cfg: JSON.stringify({ tabs: true, score: true, externalFilter: true, quickSearch: false, autoCompact: false }) },
  ];
  readonly option: SdTableOption<Order> = {
    type: 'local',
    rowKey: 'id',
    items: () => ORDERS.slice(0, 40),
    columns: [
      { field: 'code', title: 'Mã đơn', type: 'string', width: '130px' },
      { field: 'customer', title: 'Khách hàng', type: 'string' },
      { field: 'total', title: 'Tổng tiền (₫)', type: 'number', width: '130px', align: 'right' },
      {
        field: 'status',
        title: 'Trạng thái',
        type: 'values',
        width: '150px',
        option: { items: [...ORDER_STATUSES], valueField: 'value', displayField: 'display' },
        useBadge: value => ({ type: 'round', color: ORDER_STATUSES.find(item => item.value === value)?.color }),
      },
    ],
    paginate: { pageSize: 10, pages: [10, 20] },
  } as SdTableOption<Order>;
}
