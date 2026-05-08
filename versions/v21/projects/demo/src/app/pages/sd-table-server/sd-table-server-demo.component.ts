import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { SdMaterialSubInformationDefDirective, SdTableColumn } from '@sdcorejs/angular/components/table';
import { SdTable, SdTableOption } from '@sdcorejs/angular/components/table';

// â”€â”€â”€ Interfaces â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface Employee {
  id: number;
  name: string;
  department: string;
  position: string;
  salary: number;
  status: string;
  joinDate: Date;
  active: boolean;
  email: string;
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@Component({
  selector: 'sd-table-server-demo',
  templateUrl: './sd-table-server-demo.component.html',
  styleUrls: ['./sd-table-server-demo.component.scss'],
  imports: [CommonModule, FormsModule, MatTabsModule, MatChipsModule, MatIconModule, SdTable, SdMaterialSubInformationDefDirective],
})
export class SdTableServerDemoComponent implements OnInit {
  // â”€â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  activeTabIndex = signal(0);
  selectedEmployee = signal<Employee | null>(null);
  selectedEmployees = signal<Employee[]>([]);
  log = signal<string[]>([]);

  // â”€â”€â”€ Lookup data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  statusOptions = [
    { value: 'ACTIVE', display: 'Äang lÃ m viá»‡c' },
    { value: 'PROBATION', display: 'Thá»­ viá»‡c' },
    { value: 'RESIGNED', display: 'ÄÃ£ nghá»‰' },
    { value: 'SUSPENDED', display: 'Táº¡m nghá»‰' },
  ];

  departmentOptions = [
    { value: 'TECH', display: 'CÃ´ng nghá»‡' },
    { value: 'SALES', display: 'Kinh doanh' },
    { value: 'HR', display: 'NhÃ¢n sá»±' },
    { value: 'FINANCE', display: 'TÃ i chÃ­nh' },
    { value: 'MARKETING', display: 'Marketing' },
  ];

  // â”€â”€â”€ Table Options â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /** 1. Server Mode â€“ multi select + actions */
  serverMultiSelectOption!: SdTableOption<Employee>;

  /** 2. Server Mode â€“ single select (radio button) */
  serverSingleSelectOption!: SdTableOption<Employee>;

  /** 3. Server Mode â€“ with expand row */
  serverExpandOption!: SdTableOption<Employee>;

  /** 4. Server Mode â€“ with row commands */
  serverCommandOption!: SdTableOption<Employee>;

  /** 5. defaultSelected â€“ programmatic pre-selection */
  serverDefaultSelectedOption!: SdTableOption<Employee>;

  // IDs muá»‘n pre-select (simulate external state)
  preSelectedIds = signal<number[]>([1, 3, 5, 7, 9]);
  preSelectedResult = signal<Employee[]>([]);

  // â”€â”€â”€ Lifecycle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  ngOnInit(): void {
    this.#buildMultiSelectOption();
    this.#buildSingleSelectOption();
    this.#buildExpandOption();
    this.#buildCommandOption();
    this.#buildDefaultSelectedOption();
  }

  // â”€â”€â”€ Table Builders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  #buildMultiSelectOption(): void {
    this.serverMultiSelectOption = {
      type: 'server',
      key: 'demo-server-multi',
      columns: this.#baseColumns(),
      paginate: { pageSize: 10, pages: [10, 25, 50] },
      sort: { enable: true },
      filter: { hideExternalFilterToolbar: true },
      selector: {
        visible: true,
        actions: [
          {
            icon: 'mail',
            title: 'Gá»­i email',
            tooltip: 'Gá»­i email tá»›i nhÃ¢n viÃªn Ä‘Ã£ chá»n',
            click: items => {
              this.#addLog(`ðŸ“§ Gá»­i email tá»›i ${items?.length} nhÃ¢n viÃªn`);
              alert(`Gá»­i email tá»›i: ${items?.map(e => e.name).join(', ')}`);
            },
          },
          {
            icon: 'delete',
            title: 'XoÃ¡',
            color: 'error',
            tooltip: 'XoÃ¡ nhÃ¢n viÃªn Ä‘Ã£ chá»n',
            click: items => {
              this.#addLog(`ðŸ—‘ XoÃ¡ ${items?.length} nhÃ¢n viÃªn`);
              alert(`XoÃ¡: ${items?.map(e => e.name).join(', ')}`);
            },
          },
        ],
        message: items => `ÄÃ£ chá»n ${items?.length ?? 0} nhÃ¢n viÃªn`,
        onSelect: (row, items) => {
          this.selectedEmployees.set(items ?? []);
          this.#addLog(`âœ… Chá»n: ${row?.name} (tá»•ng: ${items?.length})`);
        },
        onSelectAll: items => {
          this.selectedEmployees.set(items);
          this.#addLog(`âœ… Chá»n táº¥t cáº£: ${items.length} nhÃ¢n viÃªn`);
        },
      },
      export: {
        visible: 'EXCEL',
      },
      reload: { visible: true },
      items: async filterReq => {
        return this.#fetchEmployees(filterReq.pageNumber, filterReq.pageSize);
      },
    };
  }

  #buildSingleSelectOption(): void {
    this.serverSingleSelectOption = {
      type: 'server',
      key: 'demo-server-single',
      columns: this.#baseColumns(),
      paginate: { pageSize: 10, pages: [10, 25, 50] },
      sort: { enable: true },
      filter: { hideExternalFilterToolbar: true },
      selector: {
        visible: true,
        single: true,
        onSelect: (row, items) => {
          this.selectedEmployee.set(row ?? null);
          this.#addLog(`ðŸ”˜ Radio chá»n: ${row?.name}`);
        },
      },
      items: async filterReq => {
        return this.#fetchEmployees(filterReq.pageNumber, filterReq.pageSize);
      },
    };
  }

  #buildExpandOption(): void {
    this.serverExpandOption = {
      type: 'server',
      key: 'demo-server-expand',
      columns: [
        { field: 'name', title: 'Há» tÃªn', type: 'string', width: '200px', sortable: true },
        {
          field: 'department',
          title: 'PhÃ²ng ban',
          type: 'values',
          option: { items: this.departmentOptions, valueField: 'value', displayField: 'display' },
          width: '150px',
        },
        { field: 'position', title: 'Chá»©c vá»¥', type: 'string', width: '180px' },
        {
          field: 'status',
          title: 'Tráº¡ng thÃ¡i',
          type: 'values',
          option: { items: this.statusOptions, valueField: 'value', displayField: 'display' },
          width: '150px',
        },
      ],
      paginate: { pageSize: 8, pages: [8, 20, 50] },
      expand: {
        multiple: false,
        onExpand: row => row,
      },
      items: async filterReq => {
        return this.#fetchEmployees(filterReq.pageNumber, filterReq.pageSize);
      },
    };
  }

  #buildCommandOption(): void {
    this.serverCommandOption = {
      type: 'server',
      key: 'demo-server-command',
      columns: this.#baseColumns(),
      paginate: { pageSize: 10, pages: [10, 25, 50] },
      sort: { enable: true },
      command: {
        align: 'right',
        commands: [
          {
            icon: 'edit',
            title: 'Chá»‰nh sá»­a',
            click: (item: Employee) => {
              this.#addLog(`âœï¸ Sá»­a: ${item.name}`);
              alert(`Sá»­a nhÃ¢n viÃªn: ${item.name}`);
            },
          },
          {
            icon: 'visibility',
            title: 'Xem chi tiáº¿t',
            click: (item: Employee) => {
              this.#addLog(`ðŸ‘ Xem: ${item.name}`);
              alert(`Chi tiáº¿t: ${item.name} | ${item.department} | ${item.email}`);
            },
          },
          {
            icon: 'delete',
            title: 'XoÃ¡',
            color: 'error' as const,
            click: (item: Employee) => {
              this.#addLog(`ðŸ—‘ XoÃ¡: ${item.name}`);
              alert(`XoÃ¡: ${item.name}`);
            },
          },
        ],
      },
      items: async filterReq => {
        return this.#fetchEmployees(filterReq.pageNumber, filterReq.pageSize);
      },
    };
  }

  #buildDefaultSelectedOption(): void {
    this.serverDefaultSelectedOption = {
      type: 'server',
      key: 'demo-server-default-selected',
      columns: this.#baseColumns(),
      paginate: { pageSize: 10, pages: [10, 25, 50] },
      sort: { enable: true },
      filter: { hideExternalFilterToolbar: true },
      selector: {
        visible: true,
        defaultSelected: (item: Employee) => this.preSelectedIds().includes(item.id),
        onSelect: (row, items) => {
          this.preSelectedResult.set(items ?? []);
          this.#addLog(`ðŸŽ¯ defaultSelected â€“ chá»n: ${row?.name}`);
        },
      },
      items: async filterReq => {
        return this.#fetchEmployees(filterReq.pageNumber, filterReq.pageSize);
      },
    };
  }

  // â”€â”€â”€ Columns helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  #baseColumns(): SdTableColumn<Employee>[] {
    return [
      {
        field: 'name',
        title: 'Há» tÃªn',
        type: 'string' as const,
        width: '180px',
        sortable: true,
        filter: {},
      },
      {
        field: 'department',
        title: 'PhÃ²ng ban',
        type: 'values' as const,
        option: { items: this.departmentOptions, valueField: 'value', displayField: 'display' },
        width: '140px',
        filter: {},
      },
      {
        field: 'position',
        title: 'Chá»©c vá»¥',
        type: 'string' as const,
        width: '160px',
        filter: {},
      },
      {
        field: 'salary',
        title: 'LÆ°Æ¡ng (VNÄ)',
        type: 'number' as const,
        width: '150px',
        align: 'right' as const,
        sortable: true,
        transform: (val: number) => new Intl.NumberFormat('vi-VN').format(val),
      },
      {
        field: 'status',
        title: 'Tráº¡ng thÃ¡i',
        type: 'values' as const,
        option: { items: this.statusOptions, valueField: 'value', displayField: 'display' },
        width: '140px',
        filter: {},
      },
      {
        field: 'joinDate',
        title: 'NgÃ y vÃ o',
        type: 'date' as const,
        width: '130px',
        sortable: true,
      },
      {
        field: 'active',
        title: 'Hoáº¡t Ä‘á»™ng',
        type: 'boolean' as const,
        width: '110px',
      },
    ];
  }

  // â”€â”€â”€ Mock data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  #fetchEmployees(pageNumber = 0, pageSize = 10): Promise<{ items: Employee[]; total: number }> {
    return new Promise(resolve => {
      const allData = this.#generateEmployees(100);
      const start = pageNumber * pageSize;
      const end = Math.min(start + pageSize, allData.length);
      setTimeout(() => {
        resolve({ items: allData.slice(start, end), total: allData.length });
      }, 300);
    });
  }

  #generateEmployees(count: number): Employee[] {
    const names = [
      'Nguyá»…n VÄƒn An',
      'Tráº§n Thá»‹ BÃ¬nh',
      'LÃª Minh CÆ°á»ng',
      'Pháº¡m Thu Dung',
      'HoÃ ng VÄƒn Em',
      'VÅ© Thá»‹ PhÆ°á»£ng',
      'Äáº·ng Quá»‘c HÃ¹ng',
      'BÃ¹i Thá»‹ Lan',
      'NgÃ´ VÄƒn KhÃ¡nh',
      'Äinh Thu HÃ ',
      'LÃ½ Thanh TÃ¹ng',
      'TrÆ°Æ¡ng Minh Long',
      'Phan Thá»‹ Mai',
      'Há»“ VÄƒn Nam',
      'DÆ°Æ¡ng Thá»‹ Oanh',
    ];
    const positions = [
      'Ká»¹ sÆ° pháº§n má»m',
      'TrÆ°á»Ÿng nhÃ³m',
      'GiÃ¡m Ä‘á»‘c',
      'ChuyÃªn viÃªn',
      'Káº¿ toÃ¡n',
      'HR Specialist',
      'Product Manager',
      'BA',
      'Tester QA',
      'DevOps',
    ];
    const depts = ['TECH', 'SALES', 'HR', 'FINANCE', 'MARKETING'];
    const statuses = ['ACTIVE', 'PROBATION', 'RESIGNED', 'SUSPENDED'];
    const data: Employee[] = [];
    for (let i = 0; i < count; i++) {
      data.push({
        id: i + 1,
        name: `${names[i % names.length]} ${Math.floor(i / names.length) > 0 ? Math.floor(i / names.length) + 1 : ''}`.trim(),
        department: depts[i % depts.length],
        position: positions[i % positions.length],
        salary: Math.floor(Math.random() * 50_000_000) + 8_000_000,
        status: statuses[i % statuses.length],
        joinDate: new Date(Date.now() - Math.floor(Math.random() * 5 * 365 * 24 * 3600 * 1000)),
        active: i % 4 !== 2,
        email: `user${i + 1}@company.vn`,
      });
    }
    return data;
  }

  // â”€â”€â”€ Utils â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  #addLog(msg: string): void {
    const time = new Date().toLocaleTimeString('vi-VN');
    this.log.update(prev => [`[${time}] ${msg}`, ...prev].slice(0, 20));
  }

  clearLog(): void {
    this.log.set([]);
  }

  get selectedEmployeesPreview(): string {
    const list = this.selectedEmployees();
    const names = list
      .slice(0, 3)
      .map(e => e.name)
      .join(', ');
    return list.length > 3 ? `${names} ...` : names;
  }

  get preSelectedIdsPreview(): string {
    return `ID: [${this.preSelectedIds().join(', ')}]`;
  }

  addPreSelectedId(): void {
    const next = (this.preSelectedIds().at(-1) ?? 0) + 2;
    this.preSelectedIds.update(ids => [...ids, next]);
    this.#addLog(`ðŸŽ¯ ThÃªm ID ${next} vÃ o danh sÃ¡ch pre-select`);
    this.#rebuildDefaultSelected();
  }

  removePreSelectedId(): void {
    const ids = this.preSelectedIds();
    if (!ids.length) return;
    const removed = ids.at(-1);
    this.preSelectedIds.update(list => list.slice(0, -1));
    this.#addLog(`ðŸŽ¯ XoÃ¡ ID ${removed} khá»i danh sÃ¡ch pre-select`);
    this.#rebuildDefaultSelected();
  }

  #rebuildDefaultSelected(): void {
    // Rebuild option Ä‘á»ƒ Angular detect thay Ä‘á»•i trong defaultSelected predicate
    this.serverDefaultSelectedOption = {
      ...this.serverDefaultSelectedOption,
      selector: {
        ...this.serverDefaultSelectedOption.selector,
        defaultSelected: (item: Employee) => this.preSelectedIds().includes(item.id),
      },
    };
  }
}

