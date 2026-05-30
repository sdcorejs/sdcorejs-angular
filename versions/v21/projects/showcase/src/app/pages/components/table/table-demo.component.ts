import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
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
  { id: 1, name: 'Nguyá»…n VÄƒn An', department: 'TECH', position: 'TrÆ°á»Ÿng phÃ²ng', salary: 35_000_000, status: 'ACTIVE', joinDate: new Date(2020, 0, 15), active: true, email: 'an.nv@company.vn' },
  { id: 2, name: 'Tráº§n Thá»‹ BÃ¬nh', department: 'SALES', position: 'NhÃ¢n viÃªn', salary: 18_000_000, status: 'ACTIVE', joinDate: new Date(2021, 4, 1), active: true, email: 'binh.tt@company.vn' },
  { id: 3, name: 'LÃª HoÃ ng CÆ°á»ng', department: 'TECH', position: 'Senior Dev', salary: 28_000_000, status: 'PROBATION', joinDate: new Date(2024, 11, 1), active: true, email: 'cuong.lh@company.vn' },
  { id: 4, name: 'Pháº¡m Thá»‹ Dung', department: 'HR', position: 'ChuyÃªn viÃªn', salary: 16_000_000, status: 'ACTIVE', joinDate: new Date(2022, 2, 10), active: true, email: 'dung.pt@company.vn' },
  { id: 5, name: 'HoÃ ng Minh Em', department: 'FINANCE', position: 'Káº¿ toÃ¡n', salary: 17_500_000, status: 'RESIGNED', joinDate: new Date(2019, 7, 20), active: false, email: 'em.hm@company.vn' },
  { id: 6, name: 'VÅ© VÄƒn PhÃºc', department: 'MARKETING', position: 'TrÆ°á»Ÿng nhÃ³m', salary: 22_000_000, status: 'ACTIVE', joinDate: new Date(2021, 9, 5), active: true, email: 'phuc.vv@company.vn' },
  { id: 7, name: 'Äá»— Thu Giang', department: 'SALES', position: 'TrÆ°á»Ÿng phÃ²ng', salary: 32_000_000, status: 'ACTIVE', joinDate: new Date(2018, 1, 12), active: true, email: 'giang.dt@company.vn' },
  { id: 8, name: 'BÃ¹i Quang Huy', department: 'TECH', position: 'Junior Dev', salary: 14_000_000, status: 'PROBATION', joinDate: new Date(2025, 0, 4), active: true, email: 'huy.bq@company.vn' },
];

const PRODUCTS: Product[] = [
  { id: 1, code: 'SP-001', name: 'Laptop Dell Latitude 5430', amount: 22_500_000, stock: 12, active: true },
  { id: 2, code: 'SP-002', name: 'MÃ n hÃ¬nh LG UltraWide 34"', amount: 9_800_000, stock: 8, active: true },
  { id: 3, code: 'SP-003', name: 'BÃ n phÃ­m cÆ¡ Keychron K6', amount: 2_300_000, stock: 0, active: false },
  { id: 4, code: 'SP-004', name: 'Chuá»™t Logitech MX Master 3S', amount: 2_750_000, stock: 25, active: true },
  { id: 5, code: 'SP-005', name: 'Tai nghe Sony WH-1000XM5', amount: 7_500_000, stock: 4, active: true },
];

const ORG: OrgNode[] = [
  {
    id: 1, name: 'Khá»‘i CÃ´ng nghá»‡', role: 'Division', headcount: 42, children: [
      { id: 11, name: 'PhÃ²ng Backend', role: 'Department', headcount: 18, children: [
        { id: 111, name: 'NhÃ³m API', role: 'Team', headcount: 8 },
        { id: 112, name: 'NhÃ³m Data', role: 'Team', headcount: 10 },
      ] },
      { id: 12, name: 'PhÃ²ng Frontend', role: 'Department', headcount: 14 },
      { id: 13, name: 'PhÃ²ng QA', role: 'Department', headcount: 10 },
    ],
  },
  {
    id: 2, name: 'Khá»‘i Kinh doanh', role: 'Division', headcount: 28, children: [
      { id: 21, name: 'PhÃ²ng Sales Báº¯c', role: 'Department', headcount: 16 },
      { id: 22, name: 'PhÃ²ng Sales Nam', role: 'Department', headcount: 12 },
    ],
  },
];

const ORDERS: Order[] = [
  { id: 1, code: 'ORD-001', customerId: 1, customerName: 'Nguyá»…n VÄƒn An', customerPhone: '0912345678', product: 'Laptop Dell', qty: 1, amount: 22_500_000, date: new Date(2026, 4, 1) },
  { id: 2, code: 'ORD-002', customerId: 1, customerName: 'Nguyá»…n VÄƒn An', customerPhone: '0912345678', product: 'Chuá»™t Logitech', qty: 2, amount: 5_500_000, date: new Date(2026, 4, 3) },
  { id: 3, code: 'ORD-003', customerId: 1, customerName: 'Nguyá»…n VÄƒn An', customerPhone: '0912345678', product: 'Tai nghe Sony', qty: 1, amount: 7_500_000, date: new Date(2026, 4, 10) },
  { id: 4, code: 'ORD-004', customerId: 2, customerName: 'Tráº§n Thá»‹ BÃ¬nh', customerPhone: '0987654321', product: 'MÃ n hÃ¬nh LG', qty: 1, amount: 9_800_000, date: new Date(2026, 4, 2) },
  { id: 5, code: 'ORD-005', customerId: 2, customerName: 'Tráº§n Thá»‹ BÃ¬nh', customerPhone: '0987654321', product: 'BÃ n phÃ­m Keychron', qty: 1, amount: 2_300_000, date: new Date(2026, 4, 8) },
  { id: 6, code: 'ORD-006', customerId: 3, customerName: 'LÃª HoÃ ng CÆ°á»ng', customerPhone: '0901234567', product: 'Laptop Macbook', qty: 1, amount: 45_000_000, date: new Date(2026, 4, 5) },
  { id: 7, code: 'ORD-007', customerId: 3, customerName: 'LÃª HoÃ ng CÆ°á»ng', customerPhone: '0901234567', product: 'Magic Mouse', qty: 1, amount: 2_500_000, date: new Date(2026, 4, 6) },
  { id: 8, code: 'ORD-008', customerId: 4, customerName: 'Pháº¡m Thá»‹ Dung', customerPhone: '0934567890', product: 'iPad Pro', qty: 1, amount: 28_000_000, date: new Date(2026, 4, 12) },
];

const TASKS: Task[] = [
  { id: 1, title: 'TÃ­ch há»£p cá»•ng thanh toÃ¡n VNPay', assignee: 'An', priority: 'high', progress: 65, description: 'Triá»ƒn khai SDK VNPay phase 1 â€” sandbox + production switch, log audit, retry policy 3 láº§n.' },
  { id: 2, title: 'Sá»­a lá»—i NaN cá»™t STT', assignee: 'BÃ¬nh', priority: 'medium', progress: 100, description: 'Cá»™t STT hiá»ƒn thá»‹ NaN khi multiTemplateDataRows=true. ÄÃ£ Ä‘á»•i sang renderIndex.' },
  { id: 3, title: 'Migrate import sdcorejs/utils', assignee: 'CÆ°á»ng', priority: 'low', progress: 80, description: 'Chuyá»ƒn 80 file production code dÃ¹ng @sdcorejs/angular/utilities sang @sdcorejs/utils. 4 batch parallel.' },
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
  ],
  template: `
    <demo-page
      title="Table"
      description="Báº£ng dá»¯ liá»‡u máº·c Ä‘á»‹nh cá»§a SDCoreJS â€” phÃ¢n trang, sáº¯p xáº¿p, lá»c, chá»n nhiá»u, lá»‡nh dÃ²ng, export Excel/CSV. Há»— trá»£ cháº¿ Ä‘á»™ local vÃ  server.">

      <demo-section heading="Full demo (local) â€” selection + command + export + STT + filler + paginate">
        <div class="table-box">
          <sd-table [option]="employeeOption"></sd-table>
        </div>
      </demo-section>

      <demo-section heading="Tá»‘i giáº£n â€” paginate + boolean/badge cell">
        <div class="table-box">
          <sd-table [option]="productOption"></sd-table>
        </div>
      </demo-section>

      <demo-section heading="Single selection (selector.single = true) â€” chá»‰ chá»n 1 dÃ²ng (radio)">
        <div class="table-box">
          <sd-table [option]="singleSelectOption"></sd-table>
        </div>
      </demo-section>

      <demo-section heading="Tree rows (option.tree) â€” children inline, indent theo depth">
        <div class="table-box">
          <sd-table [option]="treeOption"></sd-table>
        </div>
      </demo-section>

      <demo-section heading="Row grouping (option.group) â€” group theo field department, collapsible + select-all-in-group">
        <div class="table-box">
          <sd-table [option]="groupOption">
            <ng-template sdTableGroupDef let-values="values" let-data="data" let-isExpanded="isExpanded">
              <div class="group-header-cell">
                <span class="group-label">PhÃ²ng <b>{{ values['department'] }}</b></span>
                <span class="group-meta">â€” {{ data.length }} nhÃ¢n viÃªn Â· tráº¡ng thÃ¡i: {{ isExpanded ? 'expand' : 'collapse' }}</span>
              </div>
            </ng-template>
          </sd-table>
        </div>
      </demo-section>

      <demo-section heading="Group Ä‘Æ¡n hÃ ng theo khÃ¡ch hÃ ng (sdTableGroupDef + collapsible + select-all-in-group)">
        <div class="table-box">
          <sd-table [option]="customerOrderOption">
            <ng-template sdTableGroupDef let-values="values" let-data="data">
              <div class="group-header-cell">
                <span class="group-label">
                  KhÃ¡ch: <b>{{ values['customerId'] === 1 ? 'Nguyá»…n VÄƒn An' : values['customerId'] === 2 ? 'Tráº§n Thá»‹ BÃ¬nh' : values['customerId'] === 3 ? 'LÃª HoÃ ng CÆ°á»ng' : 'Pháº¡m Thá»‹ Dung' }}</b>
                </span>
                <span class="group-meta">
                  â€” {{ data.length }} Ä‘Æ¡n Â· Tá»•ng: {{ totalOrderAmount(data) | number: '1.0-0' }} â‚«
                </span>
              </div>
            </ng-template>
          </sd-table>
        </div>
      </demo-section>

      <demo-section heading="Expandable row (option.expand + sdTableExpandDef) â€” render sub-information">
        <div class="table-box">
          <sd-table [option]="expandOption">
            <ng-template sdTableExpandDef let-item="item">
              <div class="expand-box">
                <div class="expand-title">MÃ´ táº£ task #{{ item.data.id }}</div>
                <p>{{ item.data.description }}</p>
                <div class="expand-meta">
                  NgÆ°á»i phá»¥ trÃ¡ch: <b>{{ item.data.assignee }}</b> Â· Tiáº¿n Ä‘á»™: <b>{{ item.data.progress }}%</b>
                </div>
              </div>
            </ng-template>
          </sd-table>
        </div>
      </demo-section>

      <demo-section heading="Command align right (option.command.align = 'right')">
        <div class="table-box">
          <sd-table [option]="commandRightOption"></sd-table>
        </div>
      </demo-section>

      <demo-section heading="Row reorder (option.rowReorder.enabled = true) â€” kÃ©o-tháº£ Ä‘á»•i thá»© tá»±">
        <div class="table-box">
          <sd-table [option]="reorderOption"></sd-table>
        </div>
      </demo-section>

      <demo-section heading="Custom cell template (sdTableCellDef) â€” render giÃ¡ trá»‹ báº±ng template tá»± custom">
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

      <demo-section heading="Footer aggregation (sdMaterialFooterDef) â€” tá»•ng lÆ°Æ¡ng, count">
        <div class="table-box">
          <sd-table [option]="footerOption">
            <ng-template [sdTableFooterDef]="'salary'" let-items="items">
              <b>Tá»•ng: {{ totalSalary(items) | number: '1.0-0' }} â‚«</b>
            </ng-template>
            <ng-template [sdTableFooterDef]="'name'" let-items="items">
              <span>{{ items.length }} nhÃ¢n viÃªn</span>
            </ng-template>
          </sd-table>
        </div>
      </demo-section>

      <demo-section heading="KhÃ´ng cÃ³ filler (máº·c Ä‘á»‹nh) â€” so sÃ¡nh: cá»™t utility bá»‹ stretch trÃªn mÃ n rá»™ng">
        <div class="table-box">
          <sd-table [option]="noFillerOption"></sd-table>
        </div>
      </demo-section>

      <demo-section heading="Server-side (type='server') â€” mock async fetch + sort/paginate server">
        <div class="table-box">
          <sd-table [option]="serverOption"></sd-table>
        </div>
      </demo-section>

      <demo-section heading="Preserve selection (selector.preserveSelection = true) â€” chá»n item á»Ÿ page 1, chuyá»ƒn page 2 / sort / reload váº«n giá»¯; chá»‰ clear khi báº¥m X">
        <div class="table-box">
          <sd-table [option]="preserveSelectionOption"></sd-table>
        </div>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    .table-box { width: 100%; }
    .expand-box {
      padding: 12px 16px;
      background: #fafafa;
      border-left: 3px solid #1976d2;
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
      background: #1976d2;
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableDemoComponent {
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
        { icon: 'mail', title: 'Gá»­i email', click: items => alert(`Gá»­i email tá»›i ${items?.length} nhÃ¢n viÃªn`) },
        { icon: 'delete', title: 'XÃ³a', color: 'error', click: items => alert(`XÃ³a ${items?.length} nhÃ¢n viÃªn`) },
      ],
      message: items => `ÄÃ£ chá»n ${items?.length ?? 0} nhÃ¢n viÃªn`,
    },
    command: {
      align: 'right',
      commands: [
        { icon: 'edit', title: 'Sá»­a', click: (e: Employee) => alert(`Sá»­a: ${e.name}`) },
        { icon: 'delete', title: 'XÃ³a', color: 'error', click: (e: Employee) => alert(`XÃ³a: ${e.name}`) },
      ],
    },
    export: { visible: 'EXCEL' },
    columns: [
      { field: 'name', type: 'string', title: 'Há» vÃ  tÃªn', width: '180px', sortable: true },
      { field: 'email', type: 'string', title: 'Email', width: '220px' },
      {
        field: 'department', type: 'values', title: 'PhÃ²ng ban', width: '140px',
        option: {
          items: [
            { value: 'TECH', display: 'CÃ´ng nghá»‡' },
            { value: 'SALES', display: 'Kinh doanh' },
            { value: 'HR', display: 'NhÃ¢n sá»±' },
            { value: 'FINANCE', display: 'TÃ i chÃ­nh' },
            { value: 'MARKETING', display: 'Marketing' },
          ],
          valueField: 'value',
          displayField: 'display',
        },
      },
      { field: 'position', type: 'string', title: 'Chá»©c vá»¥', width: '160px' },
      { field: 'salary', type: 'number', title: 'LÆ°Æ¡ng', width: '140px', align: 'right', sortable: true },
      {
        field: 'status', type: 'values', title: 'Tráº¡ng thÃ¡i', width: '130px',
        option: {
          items: [
            { value: 'ACTIVE', display: 'Äang lÃ m viá»‡c' },
            { value: 'PROBATION', display: 'Thá»­ viá»‡c' },
            { value: 'RESIGNED', display: 'ÄÃ£ nghá»‰' },
          ],
          valueField: 'value',
          displayField: 'display',
        },
        useBadge: (v: string) => v === 'ACTIVE'
          ? { title: 'Äang lÃ m viá»‡c', color: 'success' }
          : v === 'PROBATION'
            ? { title: 'Thá»­ viá»‡c', color: 'warning' }
            : { title: 'ÄÃ£ nghá»‰', color: 'error' },
      },
      { field: 'joinDate', type: 'date', title: 'NgÃ y vÃ o', width: '130px' },
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
      { field: 'code', type: 'string', title: 'MÃ£ SP', width: '120px' },
      { field: 'name', type: 'string', title: 'TÃªn sáº£n pháº©m', width: '320px' },
      { field: 'amount', type: 'number', title: 'GiÃ¡ bÃ¡n (VND)', width: '160px', align: 'right' },
      {
        field: 'stock', type: 'number', title: 'Tá»“n kho', width: '120px', align: 'right',
        useBadge: (v: number) => v === 0
          ? { title: 'Háº¿t hÃ ng', color: 'error' }
          : v < 5
            ? { title: `${v} (sáº¯p háº¿t)`, color: 'warning' }
            : { title: `${v}`, color: 'success' },
      },
      { field: 'active', type: 'boolean', title: 'KÃ­ch hoáº¡t', width: '120px', option: { displayOnTrue: 'CÃ³', displayOnFalse: 'KhÃ´ng' } },
    ],
    style: { shadow: true },
  };

  readonly singleSelectOption: SdTableOption<Employee> = {
    type: 'local',
    items: () => EMPLOYEES.slice(0, 5),
    selector: { visible: true, single: true, message: items => `ÄÃ£ chá»n: ${items?.[0]?.name ?? '(chÆ°a chá»n)'}` },
    index: { enabled: true },
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'Há» tÃªn', width: '200px' },
      { field: 'department', type: 'string', title: 'PhÃ²ng ban', width: '140px' },
      { field: 'position', type: 'string', title: 'Chá»©c vá»¥', width: '180px' },
    ],
    style: { shadow: true },
  };

  readonly treeOption: SdTableOption<OrgNode> = {
    type: 'local',
    items: () => ORG,
    tree: { childrenKey: 'children', defaultExpanded: 1, indentSize: 24 },
    index: { enabled: true },
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'ÄÆ¡n vá»‹', width: '280px' },
      { field: 'role', type: 'string', title: 'Cáº¥p', width: '140px' },
      { field: 'headcount', type: 'number', title: 'Sá»‘ nhÃ¢n sá»±', width: '140px', align: 'right' },
    ],
    style: { shadow: true },
  };

  readonly groupOption: SdTableOption<Employee> = {
    type: 'local',
    items: () => EMPLOYEES,
    group: { fields: ['department'], collapsible: true },
    selector: { visible: true, message: items => `ÄÃ£ chá»n ${items?.length ?? 0} nhÃ¢n viÃªn` },
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'Há» tÃªn', width: '200px' },
      { field: 'position', type: 'string', title: 'Chá»©c vá»¥', width: '180px' },
      { field: 'salary', type: 'number', title: 'LÆ°Æ¡ng', width: '140px', align: 'right' },
    ],
    style: { shadow: true },
  };

  // Demo "Ä‘Æ¡n hÃ ng Ã— khÃ¡ch hÃ ng" â€” group orders theo customerName.
  readonly customerOrderOption: SdTableOption<Order> = {
    type: 'local',
    items: () => ORDERS,
    group: { fields: ['customerId'], collapsible: true },
    selector: {
      visible: true,
      message: items => `ÄÃ£ chá»n ${items?.length ?? 0} Ä‘Æ¡n`,
      actions: [
        { icon: 'print', title: 'In', click: items => alert(`In ${items?.length} Ä‘Æ¡n`) },
        { icon: 'send', title: 'Gá»­i mail', click: items => alert(`Gá»­i mail cho ${items?.length} Ä‘Æ¡n`) },
      ],
    },
    filler: { enabled: true },
    columns: [
      { field: 'code', type: 'string', title: 'MÃ£ Ä‘Æ¡n', width: '120px' },
      { field: 'product', type: 'string', title: 'Sáº£n pháº©m', width: '260px' },
      { field: 'qty', type: 'number', title: 'SL', width: '80px', align: 'right' },
      { field: 'amount', type: 'number', title: 'ThÃ nh tiá»n', width: '160px', align: 'right' },
      { field: 'date', type: 'date', title: 'NgÃ y', width: '120px' },
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
      { field: 'assignee', type: 'string', title: 'Phá»¥ trÃ¡ch', width: '140px' },
      { field: 'priority', type: 'string', title: 'Æ¯u tiÃªn', width: '120px' },
      { field: 'progress', type: 'number', title: 'Tiáº¿n Ä‘á»™ %', width: '120px', align: 'right' },
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
        { icon: 'edit', title: 'Sá»­a', click: (p: Product) => alert(`Sá»­a ${p.code}`) },
        { icon: 'delete', title: 'XÃ³a', color: 'error', click: (p: Product) => alert(`XÃ³a ${p.code}`) },
      ],
    },
    columns: [
      { field: 'code', type: 'string', title: 'MÃ£', width: '120px' },
      { field: 'name', type: 'string', title: 'TÃªn', width: '320px' },
      { field: 'amount', type: 'number', title: 'GiÃ¡', width: '160px', align: 'right' },
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
      { field: 'code', type: 'string', title: 'MÃ£', width: '120px' },
      { field: 'name', type: 'string', title: 'TÃªn', width: '320px' },
      { field: 'stock', type: 'number', title: 'Tá»“n', width: '100px', align: 'right' },
    ],
    style: { shadow: true },
  };

  readonly customCellOption: SdTableOption<Employee> = {
    type: 'local',
    items: () => EMPLOYEES.slice(0, 6),
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'NhÃ¢n sá»±', width: '260px' },
      { field: 'department', type: 'string', title: 'PhÃ²ng', width: '140px' },
      { field: 'status', type: 'string', title: 'Tráº¡ng thÃ¡i', width: '160px' },
    ],
    style: { shadow: true },
  };

  readonly footerOption: SdTableOption<Employee> = {
    type: 'local',
    items: () => EMPLOYEES,
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'Há» tÃªn', width: '200px' },
      { field: 'department', type: 'string', title: 'PhÃ²ng', width: '140px' },
      { field: 'salary', type: 'number', title: 'LÆ°Æ¡ng', width: '180px', align: 'right' },
    ],
    style: { shadow: true },
  };

  readonly noFillerOption: SdTableOption<Product> = {
    type: 'local',
    items: () => PRODUCTS,
    selector: { visible: true },
    index: { enabled: true },
    // filler: KHÃ”NG báº­t â†’ so sÃ¡nh visual vá»›i cÃ¡c demo trÃªn (cá»™t utility sáº½ bá»‹ browser ná»›i rá»™ng).
    columns: [
      { field: 'code', type: 'string', title: 'MÃ£', width: '120px' },
      { field: 'name', type: 'string', title: 'TÃªn', width: '320px' },
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
        { icon: 'mail', title: 'Gá»­i email', click: items => alert(`Gá»­i email tá»›i ${items?.length} nhÃ¢n viÃªn: ${items?.map(e => e.name).join(', ')}`) },
      ],
      message: items => `ÄÃ£ chá»n ${items?.length ?? 0} nhÃ¢n viÃªn xuyÃªn trang`,
    },
    columns: [
      { field: 'name', type: 'string', title: 'Há» tÃªn', width: '200px', sortable: true },
      { field: 'department', type: 'string', title: 'PhÃ²ng', width: '140px' },
      { field: 'position', type: 'string', title: 'Chá»©c vá»¥', width: '180px' },
    ],
    style: { shadow: true },
  };

  readonly serverOption: SdTableOption<Employee> = {
    type: 'server',
    items: async (_filterReq, pagingReq) => {
      // Mock fetch: chia EMPLOYEES theo pagingReq Ä‘á»ƒ minh hoáº¡ kiá»ƒu server-side.
      await new Promise(r => setTimeout(r, 300));
      const page = pagingReq?.pageNumber ?? 0;
      const size = pagingReq?.pageSize ?? 3;
      return { items: EMPLOYEES.slice(page * size, (page + 1) * size), total: EMPLOYEES.length };
    },
    paginate: { pageSize: 3, pages: [3, 5, 8] },
    sort: { enable: true },
    filler: { enabled: true },
    columns: [
      { field: 'name', type: 'string', title: 'Há» tÃªn', width: '200px', sortable: true },
      { field: 'department', type: 'string', title: 'PhÃ²ng', width: '160px' },
      { field: 'salary', type: 'number', title: 'LÆ°Æ¡ng', width: '160px', align: 'right', sortable: true },
    ],
    style: { shadow: true },
  };

  totalSalary(items: SdTableItem<Employee>[]): number {
    return (items || []).reduce((sum, e) => sum + (e?.data?.salary ?? 0), 0);
  }

  totalOrderAmount(orders: Order[]): number {
    return (orders || []).reduce((sum, o) => sum + (o?.amount ?? 0), 0);
  }
}

