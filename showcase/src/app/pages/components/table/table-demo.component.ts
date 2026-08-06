import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdButton } from '@sdcorejs/angular/components/button';
import {
  SdTable,
  SdTableOption,
  SdTableCellDefDirective,
  SdTableExpandDefDirective,
  SdTableGroupDefDirective,
  SdMaterialFooterDefDirective,
  SdTableItem,
} from '@sdcorejs/angular/components/table';

interface Employee {
  id: number;
  name: string;
  department: string;
  position: string;
  salary: number;
  status: 'ACTIVE' | 'PROBATION' | 'RESIGNED';
  joinDate: Date;
  active: boolean;
  email: string;
}

interface Product {
  id: number;
  code: string;
  name: string;
  amount: number;
  stock: number;
  active: boolean;
}

interface OrgNode {
  id: number;
  name: string;
  role: string;
  headcount: number;
  children?: OrgNode[];
}

interface Task {
  id: number;
  title: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
  progress: number;
  description: string;
}

interface Order {
  id: number;
  code: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  product: string;
  qty: number;
  amount: number;
  date: Date;
}

const EMPLOYEES: Employee[] = [
  { id: 1, name: 'Nguyễn Văn An', department: 'TECH', position: 'Trưởng phòng', salary: 35_000_000, status: 'ACTIVE', joinDate: new Date(2020, 0, 15), active: true, email: 'an.nv@company.vn' },
  { id: 2, name: 'Trần Thị Bình', department: 'SALES', position: 'Nhân viên', salary: 18_000_000, status: 'ACTIVE', joinDate: new Date(2021, 4, 1), active: true, email: 'binh.tt@company.vn' },
  { id: 3, name: 'Lê Hoàng Cường', department: 'TECH', position: 'Senior Dev', salary: 28_000_000, status: 'PROBATION', joinDate: new Date(2024, 11, 1), active: true, email: 'cuong.lh@company.vn' },
  { id: 4, name: 'Phạm Thị Dung', department: 'HR', position: 'Chuyên viên', salary: 16_000_000, status: 'ACTIVE', joinDate: new Date(2022, 2, 10), active: true, email: 'dung.pt@company.vn' },
  { id: 5, name: 'Hoàng Minh Em', department: 'FINANCE', position: 'Kế toán', salary: 17_500_000, status: 'RESIGNED', joinDate: new Date(2019, 7, 20), active: false, email: 'em.hm@company.vn' },
  { id: 6, name: 'Vũ Văn Phúc', department: 'MARKETING', position: 'Trưởng nhóm', salary: 22_000_000, status: 'ACTIVE', joinDate: new Date(2021, 9, 5), active: true, email: 'phuc.vv@company.vn' },
  { id: 7, name: 'Đỗ Thu Giang', department: 'SALES', position: 'Trưởng phòng', salary: 32_000_000, status: 'ACTIVE', joinDate: new Date(2018, 1, 12), active: true, email: 'giang.dt@company.vn' },
  { id: 8, name: 'Bùi Quang Huy', department: 'TECH', position: 'Junior Dev', salary: 14_000_000, status: 'PROBATION', joinDate: new Date(2025, 0, 4), active: true, email: 'huy.bq@company.vn' },
];

const PRODUCTS: Product[] = [
  { id: 1, code: 'SP-001', name: 'Laptop Dell Latitude 5430', amount: 22_500_000, stock: 12, active: true },
  { id: 2, code: 'SP-002', name: 'Màn hình LG UltraWide 34"', amount: 9_800_000, stock: 8, active: true },
  { id: 3, code: 'SP-003', name: 'Bàn phím cơ Keychron K6', amount: 2_300_000, stock: 0, active: false },
  { id: 4, code: 'SP-004', name: 'Chuột Logitech MX Master 3S', amount: 2_750_000, stock: 25, active: true },
  { id: 5, code: 'SP-005', name: 'Tai nghe Sony WH-1000XM5', amount: 7_500_000, stock: 4, active: true },
];

const ORG: OrgNode[] = [
  {
    id: 1, name: 'Khối Công nghệ', role: 'Division', headcount: 42, children: [
      { id: 11, name: 'Phòng Backend', role: 'Department', headcount: 18, children: [
        { id: 111, name: 'Nhóm API', role: 'Team', headcount: 8 },
        { id: 112, name: 'Nhóm Data', role: 'Team', headcount: 10 },
      ] },
      { id: 12, name: 'Phòng Frontend', role: 'Department', headcount: 14 },
      { id: 13, name: 'Phòng QA', role: 'Department', headcount: 10 },
    ],
  },
  {
    id: 2, name: 'Khối Kinh doanh', role: 'Division', headcount: 28, children: [
      { id: 21, name: 'Phòng Sales Bắc', role: 'Department', headcount: 16 },
      { id: 22, name: 'Phòng Sales Nam', role: 'Department', headcount: 12 },
    ],
  },
];

// Lazy tree demo: chỉ có root sẵn, children nạp theo yêu cầu (giả lập API trễ).
const LAZY_ROOTS: OrgNode[] = [
  { id: 1, name: 'Khối Công nghệ', role: 'Division', headcount: 42 },
  { id: 2, name: 'Khối Kinh doanh', role: 'Division', headcount: 28 },
];
const LAZY_CHILDREN: Record<number, OrgNode[]> = {
  1: [
    { id: 11, name: 'Phòng Backend', role: 'Department', headcount: 18 },
    { id: 12, name: 'Phòng Frontend', role: 'Department', headcount: 14 },
  ],
  11: [
    { id: 111, name: 'Nhóm API', role: 'Team', headcount: 8 },
    { id: 112, name: 'Nhóm Data', role: 'Team', headcount: 10 },
  ],
  2: [
    { id: 21, name: 'Phòng Sales Bắc', role: 'Department', headcount: 16 },
    { id: 22, name: 'Phòng Sales Nam', role: 'Department', headcount: 12 },
  ],
};

const ORDERS: Order[] = [
  { id: 1, code: 'ORD-001', customerId: 1, customerName: 'Nguyễn Văn An', customerPhone: '0912345678', product: 'Laptop Dell', qty: 1, amount: 22_500_000, date: new Date(2026, 4, 1) },
  { id: 2, code: 'ORD-002', customerId: 1, customerName: 'Nguyễn Văn An', customerPhone: '0912345678', product: 'Chuột Logitech', qty: 2, amount: 5_500_000, date: new Date(2026, 4, 3) },
  { id: 3, code: 'ORD-003', customerId: 1, customerName: 'Nguyễn Văn An', customerPhone: '0912345678', product: 'Tai nghe Sony', qty: 1, amount: 7_500_000, date: new Date(2026, 4, 10) },
  { id: 4, code: 'ORD-004', customerId: 2, customerName: 'Trần Thị Bình', customerPhone: '0987654321', product: 'Màn hình LG', qty: 1, amount: 9_800_000, date: new Date(2026, 4, 2) },
  { id: 5, code: 'ORD-005', customerId: 2, customerName: 'Trần Thị Bình', customerPhone: '0987654321', product: 'Bàn phím Keychron', qty: 1, amount: 2_300_000, date: new Date(2026, 4, 8) },
  { id: 6, code: 'ORD-006', customerId: 3, customerName: 'Lê Hoàng Cường', customerPhone: '0901234567', product: 'Laptop Macbook', qty: 1, amount: 45_000_000, date: new Date(2026, 4, 5) },
  { id: 7, code: 'ORD-007', customerId: 3, customerName: 'Lê Hoàng Cường', customerPhone: '0901234567', product: 'Magic Mouse', qty: 1, amount: 2_500_000, date: new Date(2026, 4, 6) },
  { id: 8, code: 'ORD-008', customerId: 4, customerName: 'Phạm Thị Dung', customerPhone: '0934567890', product: 'iPad Pro', qty: 1, amount: 28_000_000, date: new Date(2026, 4, 12) },
];

const TASKS: Task[] = [
  { id: 1, title: 'Tích hợp cổng thanh toán VNPay', assignee: 'An', priority: 'high', progress: 65, description: 'Triển khai SDK VNPay phase 1 — sandbox + production switch, log audit, retry policy 3 lần.' },
  { id: 2, title: 'Sửa lỗi NaN cột STT', assignee: 'Bình', priority: 'medium', progress: 100, description: 'Cột STT hiển thị NaN khi multiTemplateDataRows=true. Đã đổi sang renderIndex.' },
  { id: 3, title: 'Migrate import sdcorejs/utils', assignee: 'Cường', priority: 'low', progress: 80, description: 'Chuyển 80 file production code dùng @sdcorejs/angular/utilities sang @sdcorejs/utils. 4 batch parallel.' },
];

@Component({
  selector: 'app-table-demo',
  standalone: true,
  imports: [
    DemoPageComponent,
    DemoSectionComponent,
    DecimalPipe,
    SdTable,
    SdTableCellDefDirective,
    SdTableExpandDefDirective,
    SdTableGroupDefDirective,
    SdMaterialFooterDefDirective,
    SdButton,
  ],
  template: `
    <demo-page #demoPage
      title="Table"
      description="Bảng dữ liệu mặc định của SDCoreJS — phân trang, sắp xếp, lọc, chọn nhiều, lệnh dòng, export Excel/CSV. Hỗ trợ chế độ local và server.">

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-full-demo-local') {
      <demo-section heading="Full demo (local)" [props]="[{ name: 'selector', value: 'true' }, { name: 'command', value: 'true' }, { name: 'export', value: 'true' }, { name: 'index', value: 'true' }, { name: 'filler', value: 'true' }, { name: 'paginate', value: 'true' }]">
        <div class="table-box">
          <sd-table [option]="employeeOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-toi-gian') {
      <demo-section heading="Tối giản" [props]="[{ name: 'paginate', value: 'true' }]">
        <div class="table-box">
          <sd-table [option]="productOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-filter-onchange') {
      <demo-section
        heading="Filter onChange"
        [props]="[
          { name: 'columns[].filter.onChange', value: 'callback' },
          { name: 'input / input-number', value: 'Enter / blur' }
        ]"
        note="Callback chỉ chạy khi giá trị filter đã commit và khác lần trước; input text/number commit bằng Enter hoặc blur.">
        <div class="table-box">
          <div class="filter-change-log">
            <span class="filter-change-log__label">Callback cuối:</span>
            <span>{{ filterOnChangeEvent() }}</span>
          </div>
          <sd-table [option]="filterOnChangeOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chon-mot-dong') {
      <demo-section heading="Chọn một dòng" [props]="[{ name: 'selector.single', value: 'true' }]">
        <div class="table-box">
          <sd-table [option]="singleSelectOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tree-rows-search-o-cap-con-go-ten-don-vi-con-de-loc') {
      <demo-section
        heading="Tree rows + search ở cấp con (gõ tên đơn vị con để lọc)"
        [props]="[
          { name: 'tree.loadType', value: 'static' },
          { name: 'tree.childrenKey', value: 'children' },
          { name: 'tree.defaultExpanded', value: '1' },
          { name: 'columns[].filter', value: 'config' }
        ]"
        note="Search trên table 'local' + tree 'static' lọc cả cấp con: giữ nhánh cha của node khớp, prune sibling không khớp, tự bung tới node khớp.">
        <div class="table-box">
          <sd-table [option]="treeOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tree-lazy-nap-con-khi-bung-co-loading') {
      <demo-section
        heading="Tree lazy — nạp con khi bung (có loading)"
        [props]="[
          { name: 'tree.loadType', value: 'lazy' },
          { name: 'tree.onExpandChildren', value: 'Promise' },
          { name: 'tree.hasChildren', value: 'method' }
        ]"
        note="loadType 'lazy': bung dòng → gọi onExpandChildren (giả lập trễ 800ms) → spinner loading hiện trong ô chevron tới khi nạp xong. hasChildren quyết định dòng nào có icon expand (Nhóm/Team là lá → không icon).">
        <div class="table-box">
          <sd-table [option]="treeLazyOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tree-khong-cot-stt-chevron-nam-trong-cot-dau-don-vi') {
      <demo-section
        heading="Tree KHÔNG cột STT — chevron nằm trong cột đầu (Đơn vị)"
        [props]="[
          { name: 'tree.loadType', value: 'static' },
          { name: 'index', value: 'false' }
        ]"
        note="Không bật index → icon expand + indent nhúng thẳng vào cột data đầu tiên (kiểu file explorer).">
        <div class="table-box">
          <sd-table [option]="treeNoIndexOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tree-selector-command-chinh-indent') {
      <demo-section
        heading="Tree + selector + command + chỉnh indent"
        [props]="[
          { name: 'tree.indentSize', value: treeCommandIndentSize() + 'px' },
          { name: 'selector.visible', value: 'true' },
          { name: 'command.align', value: 'right' }
        ]"
        note="Demo phối hợp tree rows với checkbox selector, bulk actions, command theo từng dòng và thay đổi indent trực tiếp.">
        <div class="table-box">
          <div class="tree-command-toolbar">
            <span class="tree-command-toolbar__label">Indent: {{ treeCommandIndentSize() }}px</span>
            <sd-button
              type="light"
              color="secondary"
              prefixIcon="format_indent_decrease"
              title="Giảm indent"
              [disabled]="treeCommandIndentSize() <= 8"
              (click)="decreaseTreeCommandIndent()">
            </sd-button>
            <sd-button
              type="light"
              color="primary"
              prefixIcon="format_indent_increase"
              title="Tăng indent"
              [disabled]="treeCommandIndentSize() >= 32"
              (click)="increaseTreeCommandIndent()">
            </sd-button>
          </div>
          <sd-table [option]="treeCommandOption()"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhom-dong') {
      <demo-section heading="Nhóm dòng" [props]="[{ name: 'group', value: 'true' }, { name: 'sdTableGroupDef', value: 'template' }]">
        <div class="table-box">
          <sd-table [option]="groupOption">
            <ng-template sdTableGroupDef let-values="values" let-data="data" let-isExpanded="isExpanded">
              <div class="group-header-cell">
                <span class="group-label">Phòng <b>{{ values['department'] }}</b></span>
                <span class="group-meta">— {{ data.length }} nhân viên · trạng thái: {{ isExpanded ? 'expand' : 'collapse' }}</span>
              </div>
            </ng-template>
          </sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhom-don-hang-theo-khach') {
      <demo-section heading="Nhóm đơn hàng theo khách" [props]="[{ name: 'group', value: 'true' }, { name: 'sdTableGroupDef', value: 'template' }]">
        <div class="table-box">
          <sd-table [option]="customerOrderOption">
            <ng-template sdTableGroupDef let-values="values" let-data="data">
              <div class="group-header-cell">
                <span class="group-label">
                  Khách: <b>{{ values['customerId'] === 1 ? 'Nguyễn Văn An' : values['customerId'] === 2 ? 'Trần Thị Bình' : values['customerId'] === 3 ? 'Lê Hoàng Cường' : 'Phạm Thị Dung' }}</b>
                </span>
                <span class="group-meta">
                  — {{ data.length }} đơn · Tổng: {{ totalOrderAmount(data) | number: '1.0-0' }} ₫
                </span>
              </div>
            </ng-template>
          </sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dong-mo-rong') {
      <demo-section heading="Dòng mở rộng" [props]="[{ name: 'expand', value: 'true' }, { name: 'sdTableExpandDef', value: 'template' }]">
        <div class="table-box">
          <sd-table [option]="expandOption">
            <ng-template sdTableExpandDef let-item="item">
              <div class="expand-box">
                <div class="expand-title">Mô tả task #{{ item.data.id }}</div>
                <p>{{ item.data.description }}</p>
                <div class="expand-meta">
                  Người phụ trách: <b>{{ item.data.assignee }}</b> · Tiến độ: <b>{{ item.data.progress }}%</b>
                </div>
              </div>
            </ng-template>
          </sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-lenh-dong-phai') {
      <demo-section heading="Lệnh dòng phải" [props]="[{ name: 'command.align', value: 'right' }]">
        <div class="table-box">
          <sd-table [option]="commandRightOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-lenh-dong-co-menu-con') {
      <demo-section
        heading="Lệnh dòng có menu con"
        [props]="[
          { name: 'command.commands[].children', value: 'SdTableCommandNormal[]' },
          { name: 'command.align', value: 'right' }
        ]"
        note="Command có children sẽ render thành nút menu; các child command vẫn hỗ trợ icon, title, color, disabled, hidden và click theo từng row.">
        <div class="table-box">
          <sd-table [option]="commandChildrenOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-keo-tha-doi-thu-tu') {
      <demo-section heading="Kéo thả đổi thứ tự" [props]="[{ name: 'rowReorder', value: 'true' }]">
        <div class="table-box">
          <sd-table [option]="reorderOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cell-template-tuy-chinh') {
      <demo-section heading="Cell template tùy chỉnh" [props]="[{ name: 'sdTableCellDef', value: 'template' }]">
        <div class="table-box">
          <sd-table [option]="customCellOption">
            <ng-template [sdTableCellDef]="'name'" let-item="item">
              <div class="name-cell">
                <span class="avatar">{{ item.name.charAt(0) }}</span>
                <div>
                  <div class="name-line">{{ item.name }}</div>
                  <div class="email-line">{{ item.email }}</div>
                </div>
              </div>
            </ng-template>
            <ng-template [sdTableCellDef]="'status'" let-item="item">
              <span class="chip chip-{{ item.status.toLowerCase() }}">{{ item.status }}</span>
            </ng-template>
          </sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-footer-tong-hop') {
      <demo-section heading="Footer tổng hợp" [props]="[{ name: 'sdTableFooterDef', value: 'template' }]">
        <div class="table-box">
          <sd-table [option]="footerOption">
            <ng-template [sdTableFooterDef]="'salary'" let-items="items">
              <b>Tổng: {{ totalSalary(items) | number: '1.0-0' }} ₫</b>
            </ng-template>
            <ng-template [sdTableFooterDef]="'name'" let-items="items">
              <span>{{ items.length }} nhân viên</span>
            </ng-template>
          </sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-khong-co-filler') {
      <demo-section heading="Không có filler" [props]="[{ name: 'filler', value: 'false' }]">
        <div class="table-box">
          <sd-table [option]="noFillerOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-server-side') {
      <demo-section heading="Server-side" [props]="[{ name: 'type', value: 'server' }]">
        <div class="table-box">
          <sd-table [option]="serverOption"></sd-table>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-giu-selection-xuyen-trang') {
      <demo-section heading="Giữ selection xuyên trang" [props]="[{ name: 'selector.preserveSelection', value: 'true' }]">
        <div class="table-box">
          <sd-table [option]="preserveSelectionOption"></sd-table>
        </div>
      </demo-section>
      }
    </demo-page>
  `,
  styles: [`
    .table-box { width: 100%; }
    .tree-command-toolbar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      margin-bottom: 10px;
    }
    .tree-command-toolbar__label {
      color: #4b5563;
      font-size: 13px;
      font-weight: 600;
    }
    .expand-box {
      padding: 12px 16px;
      background: #fafafa;
      border-left: 3px solid var(--sd-primary, #005cbb);
    }
    .expand-title {
      font-weight: 600;
      margin-bottom: 6px;
    }
    .expand-meta {
      margin-top: 8px;
      font-size: 12px;
      color: #555;
    }
    .name-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--sd-primary, #005cbb);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 12px;
    }
    .name-line { font-weight: 600; }
    .email-line { font-size: 12px; color: #777; }
    .chip {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .chip-active { background: #e6f7ec; color: #1f7a3e; }
    .chip-probation { background: #fff4e0; color: #b3691a; }
    .chip-resigned { background: #fde7e7; color: #b32626; }
    .group-header-cell {
      display: inline-flex;
      align-items: baseline;
      gap: 8px;
      font-size: 14px;
    }
    .group-label { font-weight: 600; }
    .group-meta { color: #777; font-size: 12px; }
    .filter-change-log {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      color: #374151;
      font-size: 13px;
    }
    .filter-change-log__label {
      color: #6b7280;
      font-weight: 600;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableDemoComponent {
  readonly filterOnChangeEvent = signal('Chưa có thay đổi');

  readonly employeeOption: SdTableOption<Employee> = {
    type: 'local',
    key: 'showcase-employee-table',
    items: () => EMPLOYEES,
    sort: { enable: true },
    paginate: { pageSize: 5, pages: [5, 10, 25] },
    config: { visible: true, resizable: true },
    index: { enabled: true },
    filler: { enabled: true },
    selector: {
      visible: true,
      actions: [
        { icon: 'mail', title: 'Gửi email', click: items => alert(`Gửi email tới ${items?.length} nhân viên`) },
        { icon: 'delete', title: 'Xóa', color: 'error', click: items => alert(`Xóa ${items?.length} nhân viên`) },
      ],
      message: items => `Đã chọn ${items?.length ?? 0} nhân viên`,
    },
    command: {
      align: 'right',
      commands: [
        { icon: 'edit', title: 'Sửa', click: (e: Employee) => alert(`Sửa: ${e.name}`) },
        { icon: 'delete', title: 'Xóa', color: 'error', click: (e: Employee) => alert(`Xóa: ${e.name}`) },
      ],
    },
    export: { visible: 'EXCEL' },
    columns: [
      { field: 'name', type: 'string', title: 'Họ và tên', width: '180px', sortable: true },
      { field: 'email', type: 'string', title: 'Email', width: '220px' },
      {
        field: 'department', type: 'values', title: 'Phòng ban', width: '140px',
        option: {
          items: [
            { value: 'TECH', display: 'Công nghệ' },
            { value: 'SALES', display: 'Kinh doanh' },
            { value: 'HR', display: 'Nhân sự' },
            { value: 'FINANCE', display: 'Tài chính' },
            { value: 'MARKETING', display: 'Marketing' },
          ],
          valueField: 'value',
          displayField: 'display',
        },
      },
      { field: 'position', type: 'string', title: 'Chức vụ', width: '160px' },
      { field: 'salary', type: 'number', title: 'Lương', width: '140px', align: 'right', sortable: true },
      {
        field: 'status', type: 'values', title: 'Trạng thái', width: '130px',
        option: {
          items: [
            { value: 'ACTIVE', display: 'Đang làm việc' },
            { value: 'PROBATION', display: 'Thử việc' },
            { value: 'RESIGNED', display: 'Đã nghỉ' },
          ],
          valueField: 'value',
          displayField: 'display',
        },
        useBadge: (v: string) => v === 'ACTIVE'
          ? { title: 'Đang làm việc', color: 'success' }
          : v === 'PROBATION'
            ? { title: 'Thử việc', color: 'warning' }
            : { title: 'Đã nghỉ', color: 'error' },
      },
      { field: 'joinDate', type: 'date', title: 'Ngày vào', width: '130px' },
    ],
    style: { shadow: true, maxHeight: '460px' },
  };

  readonly productOption: SdTableOption<Product> = {
    type: 'local',
    items: () => PRODUCTS,
    sort: { enable: true },
    paginate: { pageSize: 5, hidePageSize: true },
    filler: { enabled: true },
    columns: [
      { field: 'code', type: 'string', title: 'Mã SP', width: '120px' },
      { field: 'name', type: 'string', title: 'Tên sản phẩm', width: '320px' },
      { field: 'amount', type: 'number', title: 'Giá bán (VND)', width: '160px', align: 'right' },
      {
        field: 'stock', type: 'number', title: 'Tồn kho', width: '120px', align: 'right',
        useBadge: (v: number) => v === 0
          ? { title: 'Hết hàng', color: 'error' }
          : v < 5
            ? { title: `${v} (sắp hết)`, color: 'warning' }
            : { title: `${v}`, color: 'success' },
      },
      { field: 'active', type: 'boolean', title: 'Kích hoạt', width: '120px', option: { displayOnTrue: 'Có', displayOnFalse: 'Không' } },
    ],
    style: { shadow: true },
  };

  readonly filterOnChangeOption: SdTableOption<Product> = {
    type: 'local',
    key: 'showcase-filter-on-change-table',
    items: () => PRODUCTS,
    sort: { enable: true },
    paginate: { pageSize: 5, hidePageSize: true },
    filler: { enabled: true },
    columns: [
      { field: 'code', type: 'string', title: 'Mã SP', width: '120px' },
      {
        field: 'name',
        type: 'string',
        title: 'Tên sản phẩm',
        width: '320px',
        filter: {
          default: '',
          onChange: value => this.recordFilterOnChange('Tên sản phẩm', value),
        },
      },
      {
        field: 'stock',
        type: 'number',
        title: 'Tồn kho',
        width: '120px',
        align: 'right',
        filter: {
          onChange: value => this.recordFilterOnChange('Tồn kho', value),
        },
      },
      {
        field: 'active',
        type: 'boolean',
        title: 'Kích hoạt',
        width: '120px',
        option: { displayOnTrue: 'Có', displayOnFalse: 'Không' },
      },
    ],
    style: { shadow: true },
  };

  readonly singleSelectOption: SdTableOption<Employee> = {
    type: 'local',
    items: () => EMPLOYEES.slice(0, 5),
    selector: { visible: true, single: true, message: items => `Đã chọn: ${items?.[0]?.name ?? '(chưa chọn)'}` },
    index: { enabled: true },
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'Họ tên', width: '200px' },
      { field: 'department', type: 'string', title: 'Phòng ban', width: '140px' },
      { field: 'position', type: 'string', title: 'Chức vụ', width: '180px' },
    ],
    style: { shadow: true },
  };

  readonly treeOption: SdTableOption<OrgNode> = {
    type: 'local',
    items: () => ORG,
    tree: { loadType: 'static', childrenKey: 'children', defaultExpanded: 1, indentSize: 16 },
    index: { enabled: true },
    filler: { enabled: true },
    // why: bật inline filter để demo search ở cấp con — gõ tên đơn vị con,
    // table giữ nhánh cha + tự bung tới node khớp (static + type 'local').
    columns: [
      { field: 'name', type: 'string', title: 'Đơn vị', width: '280px', filter: { default: '' } },
      { field: 'role', type: 'string', title: 'Cấp', width: '140px' },
      { field: 'headcount', type: 'number', title: 'Số nhân sự', width: '140px', align: 'right' },
    ],
    style: { shadow: true },
  };

  readonly treeLazyOption: SdTableOption<OrgNode> = {
    type: 'local',
    items: () => LAZY_ROOTS,
    tree: {
      loadType: 'lazy',
      indentSize: 16,
      // hasChildren: chỉ dòng thực sự có con mới hiện icon expand.
      hasChildren: row => !!LAZY_CHILDREN[row.id]?.length,
      // onExpandChildren: giả lập API trễ 800ms để thấy spinner loading khi bung.
      onExpandChildren: row =>
        new Promise<OrgNode[]>(resolve => setTimeout(() => resolve(LAZY_CHILDREN[row.id] ?? []), 800)),
    },
    index: { enabled: true },
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'Đơn vị', width: '280px' },
      { field: 'role', type: 'string', title: 'Cấp', width: '140px' },
      { field: 'headcount', type: 'number', title: 'Số nhân sự', width: '140px', align: 'right' },
    ],
    style: { shadow: true },
  };

  // Tree không bật index → chevron + indent nhúng vào cột data đầu (Đơn vị).
  readonly treeNoIndexOption: SdTableOption<OrgNode> = {
    type: 'local',
    items: () => ORG,
    tree: { loadType: 'static', childrenKey: 'children', defaultExpanded: 1, indentSize: 16 },
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'Đơn vị', width: '320px' },
      { field: 'role', type: 'string', title: 'Cấp', width: '160px' },
      { field: 'headcount', type: 'number', title: 'Số nhân sự', width: '160px', align: 'right' },
    ],
    style: { shadow: true },
  };

  readonly treeCommandIndentSize = signal(16);

  readonly treeCommandOption = computed<SdTableOption<OrgNode>>(() => ({
    type: 'local',
    key: 'showcase-tree-selector-command-table',
    items: () => ORG,
    tree: { loadType: 'static', childrenKey: 'children', defaultExpanded: true, indentSize: this.treeCommandIndentSize() },
    selector: {
      visible: true,
      actions: [
        { icon: 'download', title: 'Xuất đơn vị', click: items => alert(`Xuất ${items?.length ?? 0} đơn vị`) },
        { icon: 'account_tree', title: 'Gộp báo cáo', click: items => alert(`Gộp báo cáo cho ${items?.length ?? 0} đơn vị`) },
      ],
      message: items => `Đã chọn ${items?.length ?? 0} đơn vị`,
    },
    command: {
      align: 'right',
      commands: [
        {
          icon: row => row.children?.length ? 'account_tree' : 'person',
          title: row => `Xem ${this.describeOrgNode(row)}`,
          click: row => alert(`Xem ${this.describeOrgNode(row)}`),
        },
        {
          icon: 'add',
          title: 'Thêm đơn vị con',
          hidden: row => !row.children?.length,
          click: row => alert(`Thêm đơn vị con vào ${row.name}`),
        },
        {
          icon: 'delete',
          title: 'Xóa đơn vị lá',
          color: 'error',
          hidden: row => !!row.children?.length,
          click: row => alert(`Xóa ${row.name}`),
        },
      ],
    },
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'Đơn vị', width: '320px', filter: { default: '' } },
      { field: 'role', type: 'string', title: 'Cấp', width: '140px' },
      { field: 'headcount', type: 'number', title: 'Số nhân sự', width: '140px', align: 'right' },
    ],
    style: { shadow: true, maxHeight: '420px' },
  }));

  readonly groupOption: SdTableOption<Employee> = {
    type: 'local',
    items: () => EMPLOYEES,
    group: { fields: ['department'], collapsible: true },
    selector: { visible: true, message: items => `Đã chọn ${items?.length ?? 0} nhân viên` },
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'Họ tên', width: '200px' },
      { field: 'position', type: 'string', title: 'Chức vụ', width: '180px' },
      { field: 'salary', type: 'number', title: 'Lương', width: '140px', align: 'right' },
    ],
    style: { shadow: true },
  };

  // Demo "đơn hàng × khách hàng" — group orders theo customerName.
  readonly customerOrderOption: SdTableOption<Order> = {
    type: 'local',
    items: () => ORDERS,
    group: { fields: ['customerId'], collapsible: true },
    selector: {
      visible: true,
      message: items => `Đã chọn ${items?.length ?? 0} đơn`,
      actions: [
        { icon: 'print', title: 'In', click: items => alert(`In ${items?.length} đơn`) },
        { icon: 'send', title: 'Gửi mail', click: items => alert(`Gửi mail cho ${items?.length} đơn`) },
      ],
    },
    filler: { enabled: true },
    columns: [
      { field: 'code', type: 'string', title: 'Mã đơn', width: '120px' },
      { field: 'product', type: 'string', title: 'Sản phẩm', width: '260px' },
      { field: 'qty', type: 'number', title: 'SL', width: '80px', align: 'right' },
      { field: 'amount', type: 'number', title: 'Thành tiền', width: '160px', align: 'right' },
      { field: 'date', type: 'date', title: 'Ngày', width: '120px' },
    ],
    style: { shadow: true, maxHeight: '500px' },
  };

  readonly expandOption: SdTableOption<Task> = {
    type: 'local',
    items: () => TASKS,
    expand: { multiple: true },
    index: { enabled: true },
    filler: { enabled: true },
    columns: [
      { field: 'title', type: 'string', title: 'Task', width: '320px' },
      { field: 'assignee', type: 'string', title: 'Phụ trách', width: '140px' },
      { field: 'priority', type: 'string', title: 'Ưu tiên', width: '120px' },
      { field: 'progress', type: 'number', title: 'Tiến độ %', width: '120px', align: 'right' },
    ],
    style: { shadow: true },
  };

  readonly commandRightOption: SdTableOption<Product> = {
    type: 'local',
    items: () => PRODUCTS,
    filler: { enabled: true },
    command: {
      align: 'right',
      commands: [
        { icon: 'visibility', title: 'Xem', click: (p: Product) => alert(`Xem ${p.code}`) },
        { icon: 'edit', title: 'Sửa', click: (p: Product) => alert(`Sửa ${p.code}`) },
        { icon: 'delete', title: 'Xóa', color: 'error', click: (p: Product) => alert(`Xóa ${p.code}`) },
      ],
    },
    columns: [
      { field: 'code', type: 'string', title: 'Mã', width: '120px' },
      { field: 'name', type: 'string', title: 'Tên', width: '320px' },
      { field: 'amount', type: 'number', title: 'Giá', width: '160px', align: 'right' },
    ],
    style: { shadow: true },
  };

  readonly commandChildrenOption: SdTableOption<Product> = {
    type: 'local',
    items: () => PRODUCTS,
    filler: { enabled: true },
    command: {
      align: 'right',
      commands: [
        { icon: 'visibility', title: 'Xem nhanh', click: (p: Product) => alert(`Xem nhanh ${p.code}`) },
        {
          icon: 'more_vert',
          title: 'Thao tác thêm',
          children: [
            { icon: 'content_copy', title: 'Nhân bản', click: (p: Product) => alert(`Nhân bản ${p.code}`) },
            {
              icon: 'inventory_2',
              title: 'Kiểm kho',
              disabled: (p: Product) => p.stock === 0,
              click: (p: Product) => alert(`Kiểm kho ${p.code}: ${p.stock}`),
            },
            {
              icon: 'block',
              title: 'Ngừng bán',
              color: 'warning',
              hidden: (p: Product) => !p.active,
              click: (p: Product) => alert(`Ngừng bán ${p.code}`),
            },
            { icon: 'delete', title: 'Xóa', color: 'error', click: (p: Product) => alert(`Xóa ${p.code}`) },
          ],
        },
      ],
    },
    columns: [
      { field: 'code', type: 'string', title: 'Mã', width: '120px' },
      { field: 'name', type: 'string', title: 'Tên', width: '320px' },
      { field: 'stock', type: 'number', title: 'Tồn', width: '100px', align: 'right' },
      { field: 'active', type: 'boolean', title: 'Kích hoạt', width: '120px', option: { displayOnTrue: 'Có', displayOnFalse: 'Không' } },
    ],
    style: { shadow: true },
  };

  readonly reorderOption: SdTableOption<Product> = {
    type: 'local',
    items: () => [...PRODUCTS],
    rowReorder: {
      enabled: true,
      onChange: (rows, moved, from, to) => console.log(`Reordered ${moved.name} from ${from} to ${to}`, rows),
    },
    filler: { enabled: true },
    columns: [
      { field: 'code', type: 'string', title: 'Mã', width: '120px' },
      { field: 'name', type: 'string', title: 'Tên', width: '320px' },
      { field: 'stock', type: 'number', title: 'Tồn', width: '100px', align: 'right' },
    ],
    style: { shadow: true },
  };

  readonly customCellOption: SdTableOption<Employee> = {
    type: 'local',
    items: () => EMPLOYEES.slice(0, 6),
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'Nhân sự', width: '260px' },
      { field: 'department', type: 'string', title: 'Phòng', width: '140px' },
      { field: 'status', type: 'string', title: 'Trạng thái', width: '160px' },
    ],
    style: { shadow: true },
  };

  readonly footerOption: SdTableOption<Employee> = {
    type: 'local',
    items: () => EMPLOYEES,
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'Họ tên', width: '200px' },
      { field: 'department', type: 'string', title: 'Phòng', width: '140px' },
      { field: 'salary', type: 'number', title: 'Lương', width: '180px', align: 'right' },
    ],
    style: { shadow: true },
  };

  readonly noFillerOption: SdTableOption<Product> = {
    type: 'local',
    items: () => PRODUCTS,
    selector: { visible: true },
    index: { enabled: true },
    // filler: KHÔNG bật → so sánh visual với các demo trên (cột utility sẽ bị browser nới rộng).
    columns: [
      { field: 'code', type: 'string', title: 'Mã', width: '120px' },
      { field: 'name', type: 'string', title: 'Tên', width: '320px' },
    ],
    style: { shadow: true },
  };

  readonly preserveSelectionOption: SdTableOption<Employee> = {
    type: 'local',
    items: () => EMPLOYEES,
    sort: { enable: true },
    paginate: { pageSize: 3, pages: [3, 5, 8] },
    filler: { enabled: true },
    selector: {
      visible: true,
      preserveSelection: true,
      actions: [
        { icon: 'mail', title: 'Gửi email', click: items => alert(`Gửi email tới ${items?.length} nhân viên: ${items?.map(e => e.name).join(', ')}`) },
      ],
      message: items => `Đã chọn ${items?.length ?? 0} nhân viên xuyên trang`,
    },
    columns: [
      { field: 'name', type: 'string', title: 'Họ tên', width: '200px', sortable: true },
      { field: 'department', type: 'string', title: 'Phòng', width: '140px' },
      { field: 'position', type: 'string', title: 'Chức vụ', width: '180px' },
    ],
    style: { shadow: true },
  };

  readonly serverOption: SdTableOption<Employee> = {
    type: 'server',
    items: async (_filterReq, pagingReq) => {
      // Mock fetch: chia EMPLOYEES theo pagingReq để minh hoạ kiểu server-side.
      await new Promise(r => setTimeout(r, 300));
      const page = pagingReq?.pageNumber ?? 0;
      const size = pagingReq?.pageSize ?? 3;
      return { items: EMPLOYEES.slice(page * size, (page + 1) * size), total: EMPLOYEES.length };
    },
    paginate: { pageSize: 3, pages: [3, 5, 8] },
    sort: { enable: true },
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'Họ tên', width: '200px', sortable: true },
      { field: 'department', type: 'string', title: 'Phòng', width: '160px' },
      { field: 'salary', type: 'number', title: 'Lương', width: '160px', align: 'right', sortable: true },
    ],
    style: { shadow: true },
  };

  totalSalary(items: SdTableItem<Employee>[]): number {
    return (items || []).reduce((sum, e) => sum + (e?.data?.salary ?? 0), 0);
  }

  totalOrderAmount(orders: Order[]): number {
    return (orders || []).reduce((sum, o) => sum + (o?.amount ?? 0), 0);
  }

  recordFilterOnChange(label: string, value: unknown): void {
    const displayValue = this.formatFilterValue(value);
    this.filterOnChangeEvent.set(`${label}: ${displayValue}`);
  }

  formatFilterValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '(trống)';
    if (value instanceof Date) return value.toLocaleDateString('vi-VN');
    if (Array.isArray(value)) return value.map(item => this.formatFilterValue(item)).join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return `${value}`;
  }

  increaseTreeCommandIndent(): void {
    this.treeCommandIndentSize.update(value => Math.min(value + 4, 32));
  }

  decreaseTreeCommandIndent(): void {
    this.treeCommandIndentSize.update(value => Math.max(value - 4, 8));
  }

  describeOrgNode(row: OrgNode): string {
    return `${row.name} (${row.role}, ${row.headcount} nhân sự)`;
  }
}
