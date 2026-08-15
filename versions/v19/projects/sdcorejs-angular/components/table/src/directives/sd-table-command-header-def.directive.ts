import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Nội dung cho ô HEADER của cột command.
 *
 * Ô đó vốn để trống — chỉ giữ chỗ cho các nút thao tác bên dưới — nên đây là chỗ tự nhiên để đặt
 * một hành động cấp bảng (thường là "thêm dòng") mà không tốn thêm một dải riêng dưới bảng.
 *
 * Không có input: cột command chỉ có một, khác `sdTableCellDef` / `sdTableTitleDef` vốn phải chỉ
 * đích danh field.
 *
 * ```html
 * <sd-table [option]="option">
 *   <ng-template sdTableCommandHeaderDef>
 *     <sd-button prefixIcon="add" type="text" (click)="addRow()"></sd-button>
 *   </ng-template>
 * </sd-table>
 * ```
 */
@Directive({
  selector: '[sdTableCommandHeaderDef]',
})
export class SdTableCommandHeaderDefDirective {
  templateRef: TemplateRef<unknown> = inject(TemplateRef);
}
