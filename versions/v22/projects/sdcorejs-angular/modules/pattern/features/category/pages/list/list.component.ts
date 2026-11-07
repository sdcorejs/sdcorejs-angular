import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdPageList } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage } from '../../../../utils/api-error';
import { CreateSideDrawerComponent } from '../../components/create-side-drawer/create-side-drawer.component';
import { UpdateSideDrawerComponent } from '../../components/update-side-drawer/update-side-drawer.component';
import { CategoryService } from '../../services/category.service';
import {
  CATEGORY_MAX_LEVEL,
  CATEGORY_STATUS_OPTIONS,
  categoryStatusBadge,
  type CategoryDto,
  type CategoryNodeDto,
} from '../../services/category.model';

/** Drawer đang mở trên bảng: tạo (gốc, hoặc con của `parent`) hay cập nhật danh mục `id`. */
type CategoryDrawer =
  | { readonly type: 'create'; readonly parent: Pick<CategoryDto, 'id' | 'name'> | null }
  | { readonly type: 'update'; readonly id: string };

/**
 * Bảng cây ba cấp. Tên mở drawer cập nhật; thao tác theo dòng: thêm danh mục con (drawer, tối đa cấp 3) và xoá
 * (hỏi xác nhận, API từ chối khi còn danh mục con). Drawer mở trên bảng, không đổi URL.
 */
@Component({
  selector: 'list',
  standalone: true,
  templateUrl: './list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SdPageList,
    SdButton,
    SdTable,
    SdTableCellDefDirective,
    SdPermissionDirective,
    CreateSideDrawerComponent,
    UpdateSideDrawerComponent,
  ],
})
export class ListComponent {
  readonly #categoryService = inject(CategoryService);
  readonly #permission = inject(SdPermissionService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  private readonly table = viewChild.required(SdTable);
  protected readonly canUpdate = this.#permission.hasPermission('PATTERN_CATEGORY_U_UPDATE');
  /** Mỗi lần mở dựng drawer mới (`@if`), nên form luôn bắt đầu từ dữ liệu mới; đóng thì gỡ khỏi màn. */
  protected readonly drawer = signal<CategoryDrawer | null>(null);

  protected readonly option: SdTableOption<CategoryNodeDto> = {
    type: 'local',
    rowKey: 'id',
    items: () => firstValueFrom(this.#categoryService.tree()),
    // Cây nhỏ (3 cấp): mở hết để danh mục con vừa tạo hiện ngay dưới danh mục cha.
    tree: { loadType: 'static', childrenKey: 'children', maxDepth: CATEGORY_MAX_LEVEL, defaultExpanded: true },
    filter: { quickSearch: { containFields: ['code', 'name'], placeholder: 'Tìm theo mã hoặc tên danh mục' } },
    paginate: { pageSize: 50 },
    columns: [
      { field: 'name', title: 'Tên danh mục', type: 'string', minWidth: '260px' },
      { field: 'code', title: 'Mã', type: 'string', width: '160px' },
      { field: 'productCount', title: 'Số sản phẩm', type: 'number', width: '140px', align: 'right' },
      {
        field: 'status',
        title: 'Trạng thái',
        type: 'values',
        width: '150px',
        option: { items: CATEGORY_STATUS_OPTIONS, valueField: 'id', displayField: 'name' },
        useBadge: status => categoryStatusBadge(status),
      },
    ],
    command: {
      commands: [
        {
          title: 'Thêm danh mục con',
          icon: 'add',
          hidden: row => !this.#permission.hasPermission('PATTERN_CATEGORY_C_CREATE') || row.level >= CATEGORY_MAX_LEVEL,
          click: row => this.drawer.set({ type: 'create', parent: row }),
        },
        {
          title: 'Xoá',
          icon: 'delete',
          color: 'error',
          hidden: () => !this.#permission.hasPermission('PATTERN_CATEGORY_D_DELETE'),
          click: row => void this.#delete(row),
        },
      ],
    },
  };

  constructor() {
    // Chỉ tải lại khi drawer đã lưu thành công, và sau khi drawer đóng: không phải mỗi lần đóng.
    let changes = this.#categoryService.changes();
    effect(() => {
      const next = this.#categoryService.changes();
      if (this.drawer() || next === changes) return;
      changes = next;
      untracked(() => void this.table().reload(true, false));
    });
  }

  /** Tên là link mở drawer cập nhật ngay trên bảng: chặn điều hướng của `href`, URL giữ nguyên. */
  protected openUpdate(event: Event, id: string): void {
    event.preventDefault();
    this.drawer.set({ type: 'update', id });
  }

  async #delete(category: CategoryNodeDto): Promise<void> {
    try {
      await this.#confirm.confirm(`Xoá danh mục ${category.name}?`, {
        title: 'Xoá danh mục',
        yesTitle: 'Xoá',
        noTitle: 'Không xoá',
        yesButtonColor: 'error',
      });
    } catch {
      return;
    }
    try {
      await firstValueFrom(this.#categoryService.delete(category.id));
      this.#notify.success(`Đã xoá danh mục ${category.name}.`);
      await this.table().reload(true, false);
    } catch (error) {
      this.#notify.error(apiErrorMessage(error, 'Không xoá được danh mục.'));
    }
  }
}
