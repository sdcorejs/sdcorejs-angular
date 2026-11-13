import { ChangeDetectionStrategy, Component, ViewChild, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  SdTree,
  SdTreeCommand,
  SdTreeComponentOption,
  SdTreeEmptyDefDirective,
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

/** Một danh mục của ví dụ tree-detail; `parentId` đóng vai "server" để tải con, tìm đường đi và tìm kiếm. */
interface TreeDemoCategory {
  id: string;
  title: string;
  parentId: string | null;
  count: number;
}

const TREE_DEMO_CATEGORIES: TreeDemoCategory[] = [
  { id: 'dien-tu', title: 'Điện tử', parentId: null, count: 1284 },
  { id: 'dien-thoai', title: 'Điện thoại', parentId: 'dien-tu', count: 612 },
  { id: 'dien-thoai-gap', title: 'Điện thoại gập', parentId: 'dien-thoai', count: 48 },
  { id: 'op-lung', title: 'Ốp lưng điện thoại', parentId: 'dien-thoai', count: 310 },
  { id: 'may-tinh-bang', title: 'Máy tính bảng', parentId: 'dien-tu', count: 96 },
  { id: 'laptop', title: 'Laptop', parentId: 'dien-tu', count: 576 },
  { id: 'gia-dung', title: 'Gia dụng', parentId: null, count: 842 },
  { id: 'nha-bep', title: 'Nhà bếp', parentId: 'gia-dung', count: 530 },
  { id: 'noi-chien', title: 'Nồi chiên không dầu', parentId: 'nha-bep', count: 64 },
  { id: 'may-hut-bui', title: 'Máy hút bụi', parentId: 'gia-dung', count: 0 },
  { id: 'thoi-trang', title: 'Thời trang', parentId: null, count: 2310 },
  { id: 'ao-nam', title: 'Áo nam', parentId: 'thoi-trang', count: 1120 },
  { id: 'giay-dep', title: 'Giày dép', parentId: 'thoi-trang', count: 1190 },
  { id: 'sach', title: 'Sách', parentId: null, count: 15 },
];

@Component({
  selector: 'app-tree-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdTree, SdTreeEmptyDefDirective, SdTreeItemDefDirective],
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
          { name: 'showLines', value: 'true' },
        ]">
        <div class="tree-demo-panel">
          <sd-tree showLines [option]="staticDemoOption"></sd-tree>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-selection-va-command') {
      <demo-section
        heading="Selection và command"
        note="Checkbox chọn nhiều dòng. Thanh chọn nằm trong khung của cây (cùng thanh với sd-table): hai lệnh đầu là nút, phần còn lại gom vào nút Thêm. Command ở cuối dòng hiện khi hover hoặc khi hàng có focus."
        [props]="[
          { name: 'selectedItemsChange', value: 'T[]' },
          { name: 'commands', value: 'SdTreeCommand[]' },
        ]">
        <div class="tree-demo-grid">
          <div class="tree-demo-panel">
            <sd-tree
              [option]="selectionDemoOption"
              (selectedItemsChange)="selectedItems = $event"
              (selectChange)="lastEvent = 'select: ' + $event.item.title"
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

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tree-detail') {
      <demo-section
        heading="Tree detail"
        note="Chế độ điều hướng: bấm hàng hoặc Enter mở danh mục, activeId gắn hai chiều với ?category= trên URL (mở lại link là cây tự mở tới nút đó). Số đếm sau nhãn, tìm trên server có tô phần khớp, thêm danh mục con bằng reloadNode → expand → activeId."
        [props]="[
          { name: 'navigation', value: 'true' },
          { name: '[(activeId)]', value: 'string | null' },
          { name: '[(expandedIds)]', value: 'readonly string[]' },
          { name: 'onResolvePath / onSearch', value: 'lazy' },
        ]">
        <div class="tree-detail">
          <div class="tree-detail__side">
            <div class="tree-filter">
              <input
                type="search"
                data-autoid="showcase-tree-detail-search"
                placeholder="Tìm danh mục..."
                [value]="detailSearch()"
                (input)="onDetailSearch(($any($event.target)).value)" />
            </div>
            <div class="tree-detail__scroll">
              <sd-tree
                #detailTree
                [option]="detailOption"
                [(activeId)]="categoryId"
                [(expandedIds)]="detailExpandedIds"
                (activeChange)="onCategoryActivate($event.item.id)">
                <ng-template sdTreeEmptyDef let-searching="searching" let-text="text">
                  {{ searching ? 'Không có danh mục nào khớp “' + text + '”' : 'Chưa có danh mục nào' }}
                </ng-template>
              </sd-tree>
            </div>
          </div>
          <div class="tree-detail__main" data-autoid="showcase-tree-detail-panel">
            @if (activeCategory(); as category) {
              <strong>{{ category.title }}</strong>
              <span>Mã: {{ category.id }} · {{ category.count }} sản phẩm</span>
              <button type="button" data-autoid="showcase-tree-detail-add" (click)="addChildCategory()">Thêm danh mục con</button>
            } @else {
              <span>Chọn một danh mục ở cây bên trái</span>
            }
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
            showLines
            [option]="lazyDemoOption"
            (expandChange)="lastEvent = 'expand: ' + $event.item.title"
            (collapseChange)="lastEvent = 'collapse: ' + $event.item.title"
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

      .tree-detail {
        display: grid;
        grid-template-columns: minmax(260px, 340px) minmax(220px, 1fr);
        gap: 16px;
        align-items: start;
      }

      .tree-detail__side {
        min-width: 0;
        padding: 12px;
        background: var(--sd-surface, #ffffff);
        border: 1px solid var(--sd-border, #e5eaf1);
        border-radius: 8px;
      }

      /* Vùng cuộn của cây: reveal cuộn ở đây và thanh chọn dính đáy ở đây. */
      .tree-detail__scroll {
        height: 320px;
        overflow: auto;
      }

      .tree-detail__main {
        display: grid;
        gap: 8px;
        justify-items: start;
        min-height: 120px;
        padding: 12px;
        color: var(--sd-text, #102047);
        background: var(--sd-surface, #ffffff);
        border: 1px solid var(--sd-border, #e5eaf1);
        border-radius: 8px;
      }

      .tree-detail__main span {
        color: var(--sd-text-secondary, #60708a);
      }

      .tree-detail__main button {
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
        .tree-demo-grid,
        .tree-detail {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeDemoComponent {
  @ViewChild('filterTree') filterTree?: SdTree<TreeDemoItem>;
  @ViewChild('detailTree') detailTree?: SdTree<TreeDemoCategory>;

  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  // Theo dõi queryParamMap (không đọc snapshot một lần): cùng path khác query là cùng một component.
  readonly #query = toSignal(this.#route.queryParamMap, { requireSync: true });
  readonly #categories = signal<TreeDemoCategory[]>(TREE_DEMO_CATEGORIES);

  /** Nút đang mở của ví dụ tree-detail: lấy từ `?category=`, và ghi lại vào URL khi người dùng mở nút khác. */
  readonly categoryId = linkedSignal<string | null>(() => this.#query().get('category'));
  readonly detailExpandedIds = signal<readonly string[] | undefined>([]);
  readonly detailSearch = signal('');
  readonly activeCategory = () => this.#categories().find(category => category.id === this.categoryId());

  readonly detailOption: SdTreeComponentOption<TreeDemoCategory> = {
    autoId: 'showcase-detail',
    navigation: true,
    items: () => this.#server(this.#childrenOf(null)),
    tree: {
      loadType: 'lazy',
      onExpandChildren: item => this.#server(this.#childrenOf(item.id)),
      onResolvePath: id => this.#server(this.#ancestorIds(id)),
      onSearch: text => this.#server(this.#searchPaths(text)),
    },
    commands: [
      {
        key: 'rename',
        title: 'Đổi tên',
        icon: 'edit',
        click: item => (this.lastEvent = `command: đổi tên ${item.title}`),
      },
    ],
  };

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
      {
        icon: 'drive_file_move',
        title: 'Chuyển',
        click: items => (this.lastEvent = `quick action: chuyển ${items.length} mục`),
      },
      {
        icon: 'label',
        title: 'Gán nhãn',
        click: items => (this.lastEvent = `quick action: gán nhãn ${items.length} mục`),
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

  onDetailSearch(value: string): void {
    this.detailSearch.set(value);
    this.detailTree?.filter(value);
  }

  onCategoryActivate(id: string): void {
    void this.#router.navigate([], {
      relativeTo: this.#route,
      queryParams: { category: id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** Luồng thêm nút con của sd-tree.md: reloadNode(cha) → expand(cha) → activeId = nút mới. */
  async addChildCategory(): Promise<void> {
    const parent = this.activeCategory();
    const tree = this.detailTree;
    if (!parent || !tree) return;
    const index = this.#categories().filter(category => category.parentId === parent.id).length + 1;
    const child: TreeDemoCategory = { id: `${parent.id}-moi-${index}`, title: `${parent.title} mới ${index}`, parentId: parent.id, count: 0 };
    this.#categories.update(categories => [...categories, child]);
    await tree.reloadNode(parent.id);
    await tree.expand(parent.id);
    this.categoryId.set(child.id);
    this.onCategoryActivate(child.id);
  }

  #toTreeItem(category: TreeDemoCategory): SdTreeItemLazy<TreeDemoCategory> {
    return {
      id: category.id,
      label: category.title,
      data: category,
      count: category.count,
      hasChildren: this.#categories().some(other => other.parentId === category.id),
    };
  }

  #childrenOf(parentId: string | null): SdTreeItemLazy<TreeDemoCategory>[] {
    return this.#categories()
      .filter(category => category.parentId === parentId)
      .map(category => this.#toTreeItem(category));
  }

  #ancestors(id: string): TreeDemoCategory[] {
    const byId = new Map(this.#categories().map(category => [category.id, category]));
    const path: TreeDemoCategory[] = [];
    for (let current = byId.get(byId.get(id)?.parentId ?? ''); current; current = byId.get(current.parentId ?? '')) {
      path.unshift(current);
    }
    return path;
  }

  #ancestorIds(id: string): string[] {
    return this.#ancestors(id).map(category => category.id);
  }

  #searchPaths(text: string): { path: SdTreeItemLazy<TreeDemoCategory>[] }[] {
    const needle = plainText(text);
    return this.#categories()
      .filter(category => plainText(category.title).includes(needle))
      .map(category => ({ path: [...this.#ancestors(category.id), category].map(item => this.#toTreeItem(item)) }));
  }

  /** Giả lập một lần gọi server. */
  #server<T>(value: T): Promise<T> {
    return new Promise(resolve => window.setTimeout(() => resolve(value), 250));
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

function plainText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
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
