import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import {
  SdTree,
  SdTreeCommand,
  SdTreeComponentOption,
  SdTreeItemDefDirective,
  SdTreeItemLazy,
  SdTreeItemStatic,
  SdTreeLazyOption,
  SdTreeSelectorOption,
  SdTreeStaticOption,
} from '@sdcorejs/angular/components/tree';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

interface TreeDemoItem {
  id: string;
  title: string;
  description?: string;
  locked?: boolean;
}

@Component({
  selector: 'app-tree-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdTree, SdTreeItemDefDirective],
  template: `
    <demo-page #demoPage
      title="Tree"
      description="Cây độc lập cho danh mục, thư mục, đơn vị tổ chức: hỗ trợ static/lazy, selection, command, custom template và filter tiếng Việt không dấu.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-static-tree') {
      <demo-section
        heading="Static tree"
        note="Static tree nhận SdTreeItemStatic đã bọc sẵn id, label, data và children. Branch dùng folder icon mặc định; leaf không hiện icon nếu không khai báo icon."
        [props]="[
          { name: 'items', value: 'SdTreeItemStatic<T>[]' },
          { name: 'loadType', value: 'static' },
          { name: 'defaultExpanded', value: '1' },
        ]">
        <div class="tree-demo-panel">
          <sd-tree [option]="staticDemoOption"></sd-tree>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-selection-va-command') {
      <demo-section
        heading="Selection và command"
        note="Checkbox chọn nhiều dòng. Command ở cuối dòng, hover vào row mới thấy nút ba chấm."
        [props]="[
          { name: 'selectedItemsChange', value: 'T[]' },
          { name: 'commands', value: 'SdTreeCommand[]' },
        ]">
        <div class="tree-demo-grid">
          <div class="tree-demo-panel">
            <sd-tree
              [option]="selectionDemoOption"
              (sdSelectedItemsChange)="selectedItems = $event"
              (sdSelectChange)="lastEvent = 'select: ' + $event.item.title"
            ></sd-tree>
          </div>

          <div class="tree-demo-state">
            <strong>Selected</strong>
            @if (selectedItems.length) {
              <ul>
                @for (item of selectedItems; track item.id) {
                  <li>{{ item.title }}</li>
                }
              </ul>
            } @else {
              <span>Chưa chọn dòng nào</span>
            }
            <small>{{ lastEvent }}</small>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-lazy-tree') {
      <demo-section
        heading="Lazy tree"
        note="Bấm mở node để giả lập tải children. Sau lần đầu, children được cache nội bộ trong component."
        [props]="[
          { name: 'loadType', value: 'lazy' },
          { name: 'onExpandChildren', value: 'Promise<SdTreeItemLazy<T>[]>' },
        ]">
        <div class="tree-demo-panel">
          <sd-tree
            [option]="lazyDemoOption"
            (sdExpandChange)="lastEvent = 'expand: ' + $event.item.title"
            (sdCollapseChange)="lastEvent = 'collapse: ' + $event.item.title"
          ></sd-tree>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-filter-tieng-viet-khong-dau') {
      <demo-section
        heading="Filter tiếng Việt không dấu"
        note="Filter chỉ tìm trên item đã load. Ví dụ gõ 'ke toan', 'cong no', 'nhan su'."
        [props]="[{ name: 'filter(searchText)', value: 'method' }]">
        <div class="tree-filter">
          <input
            type="search"
            placeholder="Tìm kiếm..."
            [value]="filterText"
            (input)="onFilter(($any($event.target)).value)" />
          <button type="button" (click)="onFilter('')">Xóa</button>
        </div>
        <div class="tree-demo-panel">
          <sd-tree #filterTree [option]="filterDemoOption"></sd-tree>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-custom-item-template') {
      <demo-section
        heading="Custom item template"
        note="sdTreeItemDef nhận context item, treeItem, level, selected, isLeaf, toggle, select."
        [props]="[
          { name: 'sdTreeItemDef', value: 'template' },
          { name: 'context', value: 'item / treeItem / level / toggle' },
        ]">
        <div class="tree-demo-panel">
          <sd-tree [option]="customDemoOption">
            <ng-template sdTreeItemDef let-item let-level="level" let-isLeaf="isLeaf" let-toggle="toggle">
              <button type="button" class="tree-custom-item" [class.tree-custom-item--leaf]="isLeaf" (click)="toggle()">
                <span>L{{ level + 1 }}</span>
                <strong>{{ item.title }}</strong>
                @if (item.description) {
                  <small>{{ item.description }}</small>
                }
              </button>
            </ng-template>
          </sd-tree>
        </div>
      </demo-section>
      }
    </demo-page>
  `,
  styles: [
    `
      .tree-demo-panel {
        width: 100%;
        max-width: 560px;
        padding: 12px;
        background: #fbfcfe;
        border: 1px solid #e5eaf1;
        border-radius: 8px;
      }

      .tree-demo-grid {
        display: grid;
        grid-template-columns: minmax(280px, 560px) minmax(220px, 1fr);
        gap: 16px;
        align-items: start;
      }

      .tree-demo-state {
        display: grid;
        gap: 8px;
        min-height: 120px;
        padding: 12px;
        color: #102047;
        background: #ffffff;
        border: 1px solid #e5eaf1;
        border-radius: 8px;
      }

      .tree-demo-state ul {
        margin: 0;
        padding-left: 18px;
      }

      .tree-demo-state small,
      .tree-demo-state span {
        color: #60708a;
      }

      .tree-filter {
        display: flex;
        width: 100%;
        max-width: 560px;
        gap: 8px;
        margin-bottom: 12px;
      }

      .tree-filter input {
        flex: 1 1 auto;
        min-width: 0;
        height: 36px;
        padding: 0 10px;
        color: #102047;
        background: #ffffff;
        border: 1px solid #cfd8e6;
        border-radius: 6px;
      }

      .tree-filter button {
        height: 36px;
        padding: 0 12px;
        color: #1f56d9;
        background: #edf3ff;
        border: 1px solid #cddcff;
        border-radius: 6px;
        cursor: pointer;
      }

      .tree-custom-item {
        display: grid;
        min-width: 0;
        gap: 2px;
        padding: 0;
        color: #102047;
        text-align: left;
        background: transparent;
        border: 0;
        cursor: pointer;
      }

      .tree-custom-item span {
        color: #60708a;
        font-size: 11px;
        font-weight: 700;
      }

      .tree-custom-item strong {
        overflow: hidden;
        font-size: 14px;
        font-weight: 700;
        line-height: 18px;
        text-overflow: ellipsis;
      }

      .tree-custom-item small {
        overflow: hidden;
        color: #60708a;
        font-size: 12px;
        line-height: 16px;
        text-overflow: ellipsis;
      }

      .tree-custom-item--leaf strong {
        font-weight: 600;
      }

      @media (max-width: 760px) {
        .tree-demo-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeDemoComponent {
  @ViewChild('filterTree') filterTree?: SdTree<TreeDemoItem>;

  filterText = '';
  selectedItems: TreeDemoItem[] = [];
  lastEvent = 'Chưa có event';

  readonly staticTree: SdTreeStaticOption<TreeDemoItem> = {
    loadType: 'static',
    defaultExpanded: 1,
  };

  readonly filterTreeOption: SdTreeStaticOption<TreeDemoItem> = {
    loadType: 'static',
    defaultExpanded: true,
  };

  readonly lazyTree: SdTreeLazyOption<TreeDemoItem> = {
    loadType: 'lazy',
    onExpandChildren: item => this.loadChildren(item),
  };

  get staticDemoOption(): SdTreeComponentOption<TreeDemoItem> {
    return {
      autoId: 'showcase-static',
      items: this.staticItems,
      tree: this.staticTree,
      commands: this.commands,
    };
  }

  get selectionDemoOption(): SdTreeComponentOption<TreeDemoItem> {
    return {
      autoId: 'showcase-select',
      items: this.staticItems,
      tree: this.staticTree,
      commands: this.commands,
      selector: this.selector,
      selectedItems: this.selectedItems,
    };
  }

  get lazyDemoOption(): SdTreeComponentOption<TreeDemoItem> {
    return {
      autoId: 'showcase-lazy',
      items: this.lazyItems,
      tree: this.lazyTree,
    };
  }

  get filterDemoOption(): SdTreeComponentOption<TreeDemoItem> {
    return {
      autoId: 'showcase-filter',
      items: this.staticItems,
      tree: this.filterTreeOption,
      commands: this.commands,
    };
  }

  get customDemoOption(): SdTreeComponentOption<TreeDemoItem> {
    return {
      autoId: 'showcase-custom',
      items: this.staticItems,
      tree: this.staticTree,
      commands: this.commands,
    };
  }

  readonly commands: SdTreeCommand<TreeDemoItem>[] = [
    {
      key: 'edit',
      title: item => `Sửa ${item.title}`,
      icon: 'edit',
      hidden: item => item.id === 'hr',
      click: item => (this.lastEvent = `command: edit ${item.title}`),
    },
    {
      key: 'delete',
      title: 'Xóa',
      icon: 'delete',
      disabled: item => !!item.locked,
      click: item => (this.lastEvent = `command: delete ${item.title}`),
    },
  ];

  readonly selector: SdTreeSelectorOption<TreeDemoItem> = {
    visible: true,
    message: items => `Đã chọn ${items.length} mục`,
    actions: [
      {
        icon: 'archive',
        title: 'Lưu trữ',
        color: 'primary',
        type: 'light',
        click: items => (this.lastEvent = `quick action: lưu trữ ${items.length} mục`),
      },
    ],
  };

  readonly staticItems: SdTreeItemStatic<TreeDemoItem>[] = [
    treeItem(
      {
        id: 'finance',
        title: 'Phòng Kế toán',
        description: 'Tài chính nội bộ',
      },
      [
        treeItem({ id: 'payable', title: 'Công nợ phải trả' }, undefined, 'description'),
        treeItem(
          {
            id: 'receivable',
            title: 'Công nợ phải thu rất dài cần hiển thị tối đa hai dòng và không đè lên command cuối dòng',
            description: 'Long label regression',
          },
          undefined,
          'description',
        ),
      ],
    ),
    treeItem(
      {
        id: 'hr',
        title: 'Nhân sự',
        description: 'People operations',
        locked: true,
      },
      [
        treeItem({ id: 'contract', title: 'Hợp đồng lao động' }, undefined, 'article'),
        treeItem({ id: 'onboarding', title: 'Onboarding nhân viên mới' }, undefined, 'checklist'),
      ],
    ),
    treeItem(
      {
        id: 'product',
        title: 'Sản phẩm',
        description: 'Product & Engineering',
      },
      [
        treeItem({ id: 'design', title: 'UI/UX Design' }),
        treeItem({ id: 'engineering', title: 'Engineering Platform' }),
      ],
    ),
  ];

  readonly lazyItems: SdTreeItemLazy<TreeDemoItem>[] = [
    {
      id: 'company',
      label: 'OneMount',
      data: { id: 'company', title: 'OneMount', description: 'Lazy root' },
      hasChildren: true,
    },
    lazyTreeItem({ id: 'archive', title: 'Kho lưu trữ', description: 'Leaf lazy node' }, false),
  ];

  onFilter(value: string): void {
    this.filterText = value;
    this.filterTree?.filter(value);
  }

  private loadChildren(item: SdTreeItemLazy<TreeDemoItem>): Promise<SdTreeItemLazy<TreeDemoItem>[]> {
    return new Promise(resolve => {
      window.setTimeout(() => {
        resolve([
          {
            id: `${item.id}-finance`,
            label: 'Finance lazy child',
            data: {
              id: `${item.id}-finance`,
              title: 'Finance lazy child',
            },
            hasChildren: item.id === 'company',
          },
          lazyTreeItem(
            {
              id: `${item.id}-ops`,
              title: 'Operations lazy child',
            },
            false,
            'folder_managed',
          ),
        ]);
      }, 650);
    });
  }
}

function treeItem(data: TreeDemoItem, children?: SdTreeItemStatic<TreeDemoItem>[], icon?: string): SdTreeItemStatic<TreeDemoItem> {
  return {
    id: data.id,
    label: data.title,
    icon,
    data,
    children,
  };
}

function lazyTreeItem(data: TreeDemoItem, hasChildren?: boolean, icon?: string): SdTreeItemLazy<TreeDemoItem> {
  return {
    id: data.id,
    label: data.title,
    icon,
    data,
    hasChildren,
  };
}
