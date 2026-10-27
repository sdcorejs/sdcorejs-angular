import { ChangeDetectionStrategy, Component, effect, inject, untracked, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdButton, SdButtonItem } from '@sdcorejs/angular/components/button';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdPageList } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { ProductService } from '../../services/product.service';
import { PRODUCT_STATUS_OPTIONS, productStatusBadge, type ProductDto } from '../../services/product.model';

@Component({
  selector: 'list',
  standalone: true,
  templateUrl: './list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SdPageList, SdButton, SdButtonItem, SdTable, SdTableCellDefDirective, SdPermissionDirective],
})
export class ListComponent {
  readonly #productService = inject(ProductService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  private readonly pageList = viewChild.required(SdPageList);
  private readonly table = viewChild.required(SdTable);
  // Route guard đã nạp quyền trước khi tạo page; dùng cho text thay link khi thiếu quyền xem chi tiết.
  protected readonly canOpenDetail = inject(SdPermissionService).hasPermission('PATTERN_PRODUCT_R_DETAIL');

  protected readonly tableOption: SdTableOption<ProductDto> = {
    type: 'server',
    items: (_, req) => firstValueFrom(this.#productService.list(req)),
    sort: { enable: true },
    filter: {
      quickSearch: {
        containFields: ['code', 'name'],
        placeholder: 'Tìm theo mã hoặc tên sản phẩm',
      },
    },
    columns: [
      { field: 'code', title: 'Mã sản phẩm', type: 'string', width: '160px', sortable: true },
      { field: 'name', title: 'Tên sản phẩm', type: 'string', minWidth: '240px', sortable: true },
      { field: 'unit', title: 'Đơn vị tính', type: 'string', width: '140px' },
      { field: 'price', title: 'Giá bán (₫)', type: 'number', width: '150px', align: 'right', sortable: true },
      {
        field: 'status',
        title: 'Trạng thái',
        type: 'values',
        width: '180px',
        option: { items: PRODUCT_STATUS_OPTIONS, valueField: 'id', displayField: 'name' },
        useBadge: status => productStatusBadge(status),
      },
    ],
  };

  constructor() {
    // Lưu ở trang con xong rồi quay về: tải lại đúng trang, bộ lọc và vị trí cuộn đang có.
    let seen = this.#productService.changes();
    effect(() => {
      const changes = this.#productService.changes();
      if (this.pageList().childActive() || changes === seen) return;
      seen = changes;
      untracked(() => void this.table().reload(true, false));
    });
  }

  protected openImport(): void {
    void this.#router.navigate(['../import'], { relativeTo: this.#route });
  }

  protected exportData(): void {
    this.table().exportExcel();
  }
}
