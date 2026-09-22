import { ChangeDetectionStrategy, Component, TemplateRef, computed, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SdButton } from '@sdcorejs/angular/components/button';
import {
  SdTable,
  SdTableOption,
  SdTableAggregateOperation,
  SdTableAggregateTemplateContext,
  SdMaterialFooterDefDirective,
  SdTableRowMobileDefDirective,
} from '@sdcorejs/angular/components/table';

interface AggregateRecord {
  name: string;
  code?: string | null;
  group: string;
  amount?: number | null;
  average?: number | null;
  active?: boolean | null;
  tags?: number[] | null;
  date?: string | null;
  updated?: string | null;
  children?: AggregateRecord[];
}

const RECORDS: AggregateRecord[] = [
  {
    name: 'Đơn A',
    code: 'A',
    group: 'Miền Bắc',
    amount: 40,
    average: 40,
    active: true,
    tags: [1, 2],
    date: '2026-01-01',
    updated: '2026-01-03T09:00:00+07:00',
  },
  { name: 'Đơn B', code: '', group: 'Miền Bắc', amount: 0, average: 0, active: false, tags: [], date: null },
  { name: 'Đơn C', code: null, group: 'Miền Nam', amount: null, average: null, active: null, tags: null, date: '' },
  { name: 'Đơn D', group: 'Miền Nam', amount: undefined, average: undefined, active: undefined, tags: undefined },
  {
    name: 'Đơn E',
    code: 'E',
    group: 'Miền Nam',
    amount: 60,
    average: 60,
    active: false,
    tags: [2],
    date: '2026-01-02',
    updated: '2026-01-04T10:00:00+07:00',
  },
];

@Component({
  selector: 'app-table-aggregate-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdTable, SdButton, DecimalPipe, SdMaterialFooterDefDirective, SdTableRowMobileDefDirective],
  templateUrl: './table-aggregate-example.component.html',
})
export class TableAggregateDemoComponent {
  readonly operations: SdTableAggregateOperation[] = ['SUM', 'AVERAGE', 'MIN', 'MAX', 'COUNT'];
  readonly operation = signal<SdTableAggregateOperation>('SUM');
  readonly scope = signal<'page' | 'filtered'>('page');
  readonly treeMode = signal<'roots' | 'leaves' | 'all'>('leaves');
  readonly amountSummary = viewChild<TemplateRef<SdTableAggregateTemplateContext<AggregateRecord>>>('amountSummary');
  readonly labelSummary = viewChild<TemplateRef<SdTableAggregateTemplateContext<AggregateRecord>>>('labelSummary');
  readonly option = computed<SdTableOption<AggregateRecord> | undefined>(() => {
    const amount = this.amountSummary(),
      label = this.labelSummary();
    if (!amount || !label) return undefined;
    return {
      type: 'local',
      items: () => RECORDS,
      rowKey: 'name',
      paginate: { pageSize: 3 },
      filter: { quickSearch: { containFields: ['name', 'group'] } },
      group: { fields: ['group'], collapsible: true },
      aggregate: { scope: this.scope(), group: true },
      columns: [
        { field: 'name', type: 'string', title: 'Tên', width: '200px', aggregate: { templateRef: label } },
        { field: 'code', type: 'string', title: 'Mã (COUNT)', aggregate: 'COUNT' },
        {
          field: 'money',
          type: 'children',
          title: 'Số liệu',
          children: [
            {
              field: 'amount',
              type: 'number',
              title: 'Số tiền',
              minWidth: '140px',
              align: 'right',
              aggregate: { calculate: this.operation(), templateRef: amount },
            },
            { field: 'average', type: 'number', title: 'Bình quân', aggregate: 'AVERAGE' },
          ],
        },
        { field: 'active', type: 'boolean', title: 'Active (COUNT)', aggregate: 'COUNT' },
        {
          field: 'tags',
          type: 'values',
          title: 'Tags (COUNT)',
          aggregate: 'COUNT',
          option: {
            items: [
              { id: 1, label: 'A' },
              { id: 2, label: 'B' },
            ],
            valueField: 'id',
            displayField: 'label',
            selection: 'MULTIPLE',
          },
        },
        { field: 'date', type: 'date', title: 'Ngày (MIN)', aggregate: 'MIN' },
        { field: 'updated', type: 'datetime', title: 'Cập nhật (MAX)', aggregate: 'MAX' },
        { field: 'group', type: 'string', title: 'Khu vực', aggregate: items => `${items.length} bản ghi trong scope` },
      ],
    };
  });
  readonly treeOption = computed<SdTableOption<AggregateRecord>>(() => ({
    type: 'local',
    items: () => [{ name: 'Tổng hợp', group: '', amount: 100, children: [RECORDS[0], RECORDS[4]] }],
    columns: [
      {
        field: 'name',
        title: 'Nhánh',
        type: 'string',
        aggregate: (items, context) => (context.kind === 'tree' ? `Nhánh ${context.parent?.name}` : `${items.length} node`),
      },
      { field: 'amount', title: 'Số tiền', type: 'number', aggregate: 'SUM' },
    ],
    tree: { loadType: 'static', defaultExpanded: true },
    aggregate: { tree: { items: this.treeMode(), subtotal: true } },
    filter: { disabled: true },
  }));
  readonly lazyOption: SdTableOption<AggregateRecord> = {
    type: 'local',
    items: () => [{ name: 'Mở để tải children', group: '', amount: 100 }],
    columns: [
      {
        field: 'name',
        title: 'Nhánh lazy',
        type: 'string',
        aggregate: (items, context) => (context.isComplete ? `${items.length} node lá` : 'Chưa đủ dữ liệu'),
      },
      { field: 'amount', title: 'Số tiền', type: 'number', aggregate: 'SUM' },
    ],
    tree: {
      loadType: 'lazy',
      hasChildren: row => row.name === 'Mở để tải children',
      onExpandChildren: async () => [RECORDS[0], RECORDS[4]],
    },
    aggregate: { tree: { subtotal: true } },
    filter: { disabled: true },
  };
}
