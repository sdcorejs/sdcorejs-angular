import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SdTable, type SdTableOption } from '@sdcorejs/angular/components/table';
import type { ImportPreviewRowDto } from '../../services/import.model';

const RESULTS = [
  { id: 'new', name: 'Thêm mới', color: 'success' },
  { id: 'duplicate', name: 'Trùng mã', color: 'warning' },
  { id: 'invalid', name: 'Lỗi', color: 'error' },
] as const;

/** Bước "Xem trước & xung đột": từng dòng với kết quả kiểm tra của API. */
@Component({
  selector: 'preview-view',
  standalone: true,
  imports: [SdTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<sd-table autoId="import-preview" [option]="option()" />`,
})
export class PreviewViewComponent {
  readonly rows = input.required<readonly ImportPreviewRowDto[]>();
  protected readonly option = computed<SdTableOption<ImportPreviewRowDto>>(() => {
    const rows = [...this.rows()];
    return {
      type: 'local',
      items: () => rows,
      paginate: { pageSize: 50 },
      filter: { hideInlineFilter: 'auto' },
      columns: [
        { field: 'code', title: 'Mã', type: 'string', width: '110px' },
        { field: 'name', title: 'Tên sản phẩm', type: 'string', minWidth: '180px' },
        { field: 'price', title: 'Giá bán (₫)', type: 'number', width: '120px', align: 'right' },
        {
          field: 'result',
          title: 'Kết quả',
          type: 'values',
          width: '130px',
          option: { items: [...RESULTS], valueField: 'id', displayField: 'name' },
          useBadge: result => ({ type: 'round', color: RESULTS.find(item => item.id === result)?.color }),
        },
        { field: 'message', title: 'Ghi chú', type: 'string', minWidth: '160px' },
      ],
    };
  });
}
