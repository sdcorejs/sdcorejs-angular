import { Injectable, inject, isSignal } from '@angular/core';
import { SdFormatDatePipe, SdFormatDatetimePipe, SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { EMPTY_STR } from '@sdcorejs/utils/constants';
import { Utilities } from '@sdcorejs/utils/fns';
import { ArrayUtilities, NumberUtilities } from '@sdcorejs/utils/fns';

import { SdTableColumn, SdTableColumnNormal } from '../../models/table-column.model';
import { MapToSdTableItem, SdTableDisplay, SdTableItem } from '../../models/table-item.model';

/**
 * Giá trị thô của một ô, do consumer cung cấp nên lib không ràng buộc được kiểu.
 *
 * why: từ `@sdcorejs/utils` 1.2, `getNestedValue` trả về `T | undefined` với `T = unknown` thay vì
 * `any`. Để mặc định thì mọi chỗ dùng giá trị đều phải ép kiểu; alias này giữ đúng kiểu cũ tại một
 * nơi và đánh dấu rõ đây là ranh giới dữ liệu động (giống Core Legacy).
 */
type SdTableCellValue = any;

@Injectable()
export class TableFormatService {
  // Keep table display formatting aligned with the public template pipes.
  #formatDatePipe = inject(SdFormatDatePipe);
  #formatDatetimePipe = inject(SdFormatDatetimePipe);
  #formatNumberPipe = inject(SdFormatNumberPipe);

  // ==========================================
  // PUBLIC METHODS
  // ==========================================

  /**
   * Tải và cache các giá trị từ điển cho cột 'values'
   */
  async loadValues(
    columns: SdTableColumn[],
    cacheValues: Record<string, any[]>,
    cacheObjValues: Record<string, Record<string, string>>
  ): Promise<void> {
    const promises: Promise<
      | {
          key: string;
          valueField: string;
          displayField: string;
          data: any[];
        }
      | undefined
    >[] = [];

    // why: lookup chỉ phục vụ nhãn hiển thị và ô lọc; lookup lỗi không được chặn dữ liệu của bảng.
    // Không ghi cache cho cột lỗi để lần cấu hình sau thử lại, ô tạm hiện mã thô.
    const reportLookupError = (field: string, error: unknown) =>
      console.error(`[sd-table] Lookup for column "${field}" failed; showing raw values.`, error);

    for (const column of columns) {
      if (column.type === 'values' && !cacheValues[column.field]) {
        try {
          // TRƯỜNG HỢP 1: Nếu items là một Signal
          if (isSignal(column.option.items)) {
            // Đọc giá trị hiện tại của Signal
            const data = column.option.items();

            cacheValues[column.field] = (Array.isArray(data) ? data : []).map(e => ({
              ...e,
              [column.option.valueField]: Utilities.getNestedValue<SdTableCellValue>(e, column.option.valueField),
              [column.option.displayField]: Utilities.getNestedValue<SdTableCellValue>(e, column.option.displayField),
            }));

            cacheObjValues[column.field] = ArrayUtilities.toObject(column.option.valueField, cacheValues[column.field]);
          }
          // TRƯỜNG HỢP 2: Nếu items là hàm trả về Promise (API Call)
          else if (typeof column.option.items === 'function') {
            const load = column.option.items;
            const field = column.field;
            const { valueField, displayField } = column.option;
            promises.push(
              // why: bọc trong async để cả lỗi đồng bộ lẫn Promise reject đều rơi vào cùng một catch.
              (async () => {
                const data = await load();
                return { key: field, valueField, displayField, data: Array.isArray(data) ? data : [] };
              })().catch(error => {
                reportLookupError(field, error);
                return undefined;
              })
            );
          }

          // TRƯỜNG HỢP 3: Mảng tĩnh (K[]) bình thường
          else {
            cacheValues[column.field] = column.option.items.map(e => ({
              ...e,
              [column.option.valueField]: Utilities.getNestedValue<SdTableCellValue>(e, column.option.valueField),
              [column.option.displayField]: Utilities.getNestedValue<SdTableCellValue>(e, column.option.displayField),
            }));

            cacheObjValues[column.field] = ArrayUtilities.toObject(column.option.valueField, cacheValues[column.field]);
          }
        } catch (error) {
          delete cacheValues[column.field];
          delete cacheObjValues[column.field];
          reportLookupError(column.field, error);
        }
      }
    }

    if (promises.length) {
      const results = await Promise.all(promises);
      for (const result of results) {
        if (!result) continue;
        cacheValues[result.key] = result.data.map(e => ({
          ...e,
          [result.valueField]: Utilities.getNestedValue<SdTableCellValue>(e, result.valueField),
          [result.displayField]: Utilities.getNestedValue<SdTableCellValue>(e, result.displayField),
        }));
        cacheObjValues[result.key] = ArrayUtilities.toObject(result.valueField, cacheValues[result.key]);
      }
    }
  }

  /**
   * Chuyển đổi dữ liệu thô thành SdTableItem kèm các thiết lập hiển thị (Display Meta)
   */
  // why: `columns` phải là `SdTableColumn<T>` chứ không phải `SdTableColumn` (mặc định `unknown`).
  // Cột mang callback nhận `rowData: T` (`transform`, `tooltip`, `click`, `useBadge`) nên tham số
  // đứng ở vị trí contravariant — khi default generic còn là `any` thì mọi thứ gán được cho nhau nhờ
  // bivariance của `any`; đổi default sang `unknown` làm lộ ra rằng service đang nhận cột "kiểu khác"
  // với hàng nó format. Ràng buộc theo cùng `T` là cách sửa đúng, không phải cast.
  async format<T = unknown>(
    rawItems: T[],
    columns: SdTableColumn<T>[],
    cacheValues: Record<string, any[]>,
    cacheObjValues: Record<string, Record<string, string>>,
    rowKey?: string
  ): Promise<SdTableItem<T>[]> {
    // why: KHÔNG dùng `rawItems.map(MapToSdTableItem)` — `map` truyền cả index làm
    // tham số thứ 2, tức index sẽ bị nhận nhầm thành `rowKey`.
    const items = rawItems.map(item => MapToSdTableItem(item, rowKey));
    const execute = async (column: SdTableColumnNormal<T>) => {
      const { field, click, tooltip, htmlTemplate, transform } = column;
      const fieldStr = field;
      // why: callback hiển thị do consumer cung cấp; lỗi của nó chỉ được làm hỏng ô (hiện giá trị thô),
      // không được biến một lần đọc API thành công thành "Không thể tải dữ liệu" (NSP-4877).
      // Log một lần cho mỗi cột mỗi lượt format để không spam theo từng dòng.
      let reported = false;
      const report = (error: unknown) => {
        if (reported) return;
        reported = true;
        console.error(`[sd-table] Column "${fieldStr}" failed to format; showing raw values.`, error);
      };

      // Xử lý nạp từ điển động (lazy-values)
      if (!transform && !htmlTemplate && column.type === 'lazy-values' && typeof column.option.views === 'function') {
        const {
          option: { views, valueField, displayField },
        } = column;

        cacheObjValues[fieldStr] = cacheObjValues[fieldStr] || {};

        const values = ArrayUtilities.distinct(
          items
            .map(item => Utilities.getNestedValue<SdTableCellValue>(item.data, fieldStr))
            .filter(val => val?.toString())
            .reduce<string[]>((current, next) => [...current, ...(Array.isArray(next) ? next : [next])], [])
            .filter(val => !Object.keys(cacheObjValues[fieldStr]).includes(val))
        );

        if (values.length) {
          let fetched: unknown = [];
          try {
            fetched = await views(values);
          } catch (err) {
            console.error(err);
          }
          const lazyItems: any[] = (Array.isArray(fetched) ? fetched : [])
            .filter((item: any) => values.includes(Utilities.getNestedValue<SdTableCellValue>(item, valueField)))
            .map((e: any) => ({
              [valueField]: Utilities.getNestedValue<SdTableCellValue>(e, valueField),
              [displayField]: Utilities.getNestedValue<SdTableCellValue>(e, displayField),
            }));
          Object.assign(cacheObjValues[fieldStr], ArrayUtilities.toObject(valueField, lazyItems) || {});
        }
      }

      // Format dữ liệu cho từng hàng
      for (const item of items) {
        const rowData = item.data;
        const value = Utilities.getNestedValue<SdTableCellValue>(rowData, fieldStr);
        item.meta.display[fieldStr] = {
          badge: undefined,
          cellStyle: column.align === 'right' ? { 'text-align': 'right!important' } : undefined,
          data: value,
          isHtml: false,
          tooltip: undefined,
          click: typeof click === 'function' ? () => click(value, rowData) : undefined,
        };

        const display = item.meta.display[fieldStr];

        if (typeof tooltip === 'function') {
          try {
            display.tooltip = tooltip(value, rowData);
          } catch (error) {
            report(error);
          }
        }

        try {
          await this.#formatCell(display, column, value, rowData, cacheValues, cacheObjValues);
        } catch (error) {
          report(error);
          display.isHtml = false;
          display.badge = undefined;
          display.data = this.#rawDisplay(value);
        }
      }
    };

    // Duyệt qua tất cả các cột
    for (const column of columns.filter(e => !e.hidden)) {
      if (column.type === 'children') {
        for (const childColumn of column.children?.filter(e => !e.hidden) || []) {
          await execute(childColumn);
        }
      } else {
        await execute(column);
      }
    }
    return items;
  }

  // ==========================================
  // PRIVATE HELPERS
  // ==========================================

  /** Format một ô; ném lỗi nếu callback của consumer lỗi, để `format` rơi về giá trị thô. */
  async #formatCell<T>(
    display: SdTableDisplay,
    column: SdTableColumnNormal<T>,
    value: SdTableCellValue,
    rowData: T,
    cacheValues: Record<string, any[]>,
    cacheObjValues: Record<string, Record<string, string>>
  ): Promise<void> {
    const { htmlTemplate, transform } = column;
    if (typeof htmlTemplate === 'function') {
      display.isHtml = true;
      display.data = htmlTemplate(value, rowData);
      return;
    }
    if (typeof transform === 'function') {
      const newValue = transform(value, rowData);
      display.data = newValue instanceof Promise ? await newValue : newValue;
      return;
    }
    // Xử lý các type cơ bản
    if (column.type === 'date' || column.type === 'datetime' || column.type === 'time') {
      display.data = this.#formatDateDisplay(value, column.type);
      display.isHtml = column.type === 'datetime';
    }
    if (column.type === 'values' || column.type === 'lazy-values') {
      display.data = this.#processValuesDisplay(value, column, column.field, cacheObjValues);
    }
    if (column.type === 'number' && NumberUtilities.isNumber(value)) {
      display.data = this.#formatNumberPipe.transform(value);
    }
    if (column.type === 'boolean') {
      const { option } = column;
      if (value != null && value !== '') {
        display.data = value === true ? option?.displayOnTrue || 'True' : option?.displayOnFalse || 'False';
      } else {
        display.data = '';
      }
    }

    // Xử lý Badge
    const badgeResult = this.#createBadge(column, value, rowData, cacheValues);
    if (badgeResult) {
      display.badge = badgeResult.badge;
      if (badgeResult.title) {
        display.data = badgeResult.title;
      }
    }

    if (display.data === null || display.data === undefined || display.data === '') {
      display.data = EMPTY_STR;
      display.badge = undefined;
    }
  }

  /** Giá trị thô an toàn để hiển thị khi callback format lỗi: primitive giữ nguyên, mảng nối bằng dấu phẩy. */
  #rawDisplay(value: unknown): string {
    const text = (Array.isArray(value) ? value : [value])
      .filter(entry => entry !== null && entry !== undefined && entry !== '' && typeof entry !== 'object')
      .map(entry => String(entry))
      .join(', ');
    return text || EMPTY_STR;
  }

  #formatDateDisplay(value: any, type: 'date' | 'datetime' | 'time'): string {
    const date = this.#formatDatePipe.transform(value);
    const time = this.#formatDatetimePipe.transform(value, 'HH:mm:ss');
    if (type === 'datetime') {
      return time && date ? `<div class="T14R">${date}<span class="T14R text-secondary ml-4">${time}</span></div>` : '';
    }
    if (type === 'date') return date ?? '';
    if (type === 'time') return time ?? '';
    return '';
  }

  #processValuesDisplay<T>(
    value: any,
    column: SdTableColumnNormal<T> & { type: 'values' | 'lazy-values' },
    field: string,
    cacheObjValues: Record<string, Record<string, string>>
  ): string {
    const vals = (Array.isArray(value) ? value : [value]).filter(e => e?.toString());
    return vals.map(val => cacheObjValues[field]?.[val]?.[column.option.displayField as any] || val).join(', ');
  }

  #createBadge<T>(
    column: SdTableColumnNormal<T>,
    value: any,
    rowData: T,
    cacheValues: Record<string, any[]>
  ): { badge: SdTableDisplay['badge']; title?: string | number | null } | undefined {
    if (column.useBadge) {
      const badge = column.type === 'values' ? column.useBadge(value, rowData, cacheValues[column.field]) : column.useBadge(value, rowData);

      if (badge) {
        return {
          badge: {
            type: badge.type ?? 'round',
            color: badge.color,
            icon: badge.icon,
          },
          title: badge.title,
        };
      }
    }
    if (column.type === 'boolean') {
      return {
        badge: {
          type: 'round',
          color: value ? 'success' : 'error',
        },
      };
    }
    return undefined;
  }
}
