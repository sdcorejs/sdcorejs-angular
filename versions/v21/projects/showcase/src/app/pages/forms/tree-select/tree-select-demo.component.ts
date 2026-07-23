import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdTreeItemLazy, SdTreeItemStatic } from '@sdcorejs/angular/components/tree';
import { SdTreeSelect, SdTreeSelectNodeTemplateDirective } from '@sdcorejs/angular/forms/tree-select';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

interface Department {
  id: number;
  name: string;
  locked?: boolean;
}

const FINANCE: Department = { id: 1, name: 'Tài chính' };
const PAYABLE: Department = { id: 2, name: 'Công nợ phải trả' };
const RECEIVABLE: Department = { id: 3, name: 'Công nợ phải thu' };
const HR: Department = { id: 4, name: 'Nhân sự', locked: true };

const STATIC_ITEMS: SdTreeItemStatic<Department>[] = [
  {
    id: 'finance',
    label: FINANCE.name,
    data: FINANCE,
    children: [
      { id: 'payable', label: PAYABLE.name, data: PAYABLE },
      { id: 'receivable', label: RECEIVABLE.name, data: RECEIVABLE },
    ],
  },
  { id: 'hr', label: HR.name, data: HR },
];

@Component({
  selector: 'app-tree-select-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdTreeSelect, SdTreeSelectNodeTemplateDirective],
  template: `
    <demo-page
      #demoPage
      title="Tree Select"
      description="SdTreeSelect giữ model theo stable key và compose SdTree static/lazy với keyboard, cascade và indeterminate semantics.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-static-single-select') {
        <demo-section heading="Static single-select" [props]="[{ name: 'model', value: single() ?? 'null' }]">
          <sd-tree-select style="max-width: 520px" [items]="staticItems" valueField="id" displayField="name" [(model)]="single" />
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-multiple-cascade') {
        <demo-section
          heading="Multiple cascade"
          [props]="[
            { name: 'cascade', value: 'descendants' },
            { name: 'model', value: multiple().join(', ') },
          ]"
          note="Chọn parent áp dụng cho descendants đã load; partial selection hiển thị indeterminate, node locked không tương tác.">
          <sd-tree-select
            style="max-width: 520px"
            [items]="staticItems"
            valueField="id"
            displayField="name"
            multiple
            cascade="descendants"
            [disabledNode]="disabledDepartment"
            [(model)]="multiple" />
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-lazy-tree') {
        <demo-section heading="Lazy tree" note="Children chỉ tải khi mở branch; lỗi được giữ ở node và có retry riêng.">
          <sd-tree-select
            style="max-width: 520px"
            [items]="lazyItems"
            [tree]="lazyTree"
            valueField="id"
            displayField="name"
            multiple
            [model]="[3]">
            <ng-template sdTreeSelectNode let-item let-loading="loading">
              {{ item.name }}
              @if (loading) {
                · loading
              }
            </ng-template>
          </sd-tree-select>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-unloaded-key-va-viewed') {
        <demo-section
          heading="Unloaded key và viewed"
          [props]="[{ name: 'model', value: '[99]' }]"
          note="Key chưa load không bị xóa bởi filter/page/lazy state; viewed mode hiển thị fallback key ổn định.">
          <sd-tree-select
            style="max-width: 520px"
            [items]="lazyItems"
            [tree]="lazyTree"
            valueField="id"
            displayField="name"
            multiple
            viewed
            [model]="[99]" />
        </demo-section>
      }
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeSelectDemoComponent {
  readonly staticItems = STATIC_ITEMS;
  readonly single = signal<number | null>(2);
  readonly multiple = signal<number[]>([2]);
  readonly lazyItems: SdTreeItemLazy<Department>[] = [{ id: 'finance', label: FINANCE.name, data: FINANCE, hasChildren: true }];
  readonly lazyTree = {
    loadType: 'lazy' as const,
    onExpandChildren: async (): Promise<SdTreeItemLazy<Department>[]> => {
      await Promise.resolve();
      return [
        { id: 'payable', label: PAYABLE.name, data: PAYABLE, hasChildren: false },
        { id: 'receivable', label: RECEIVABLE.name, data: RECEIVABLE, hasChildren: false },
      ];
    },
  };
  readonly disabledDepartment = (item: Department): boolean => !!item.locked;
}
