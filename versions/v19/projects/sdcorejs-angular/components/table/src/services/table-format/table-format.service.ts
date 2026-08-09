import { Injectable, inject, isSignal } from '@angular/core';
import { SdFormatDatePipe, SdFormatDatetimePipe, SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { EMPTY_STR } from '@sdcorejs/utils/constants';
import { Utilities } from '@sdcorejs/utils/fns';
import { ArrayUtilities, NumberUtilities } from '@sdcorejs/angular/utilities/extensions';

import { SdTableColumn, SdTableColumnNormal } from '../../models/table-column.model';
import { MapToSdTableItem, SdTableDisplay, SdTableItem } from '../../models/table-item.model';

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
    const promises: Promise<{
      key: string;
      valueField: string;
      displayField: string;
      data: any[];
    }>[] = [];

    for (const column of columns) {
      if (column.type === 'values' && !cacheValues[column.field]) {
        // TRƯỜNG HỢP 1: Nếu items là một Signal
        if (isSignal(column.option.items)) {
          // Đọc giá trị hiện tại của Signal
          const data = column.option.items();

          cacheValues[column.field] = (Array.isArray(data) ? data : []).map(e => ({
            ...e,
            [column.option.valueField]: Utilities.getNestedValue(e, column.option.valueField),
            [column.option.displayField]: Utilities.getNestedValue(e, column.option.displayField),
          }));

          cacheObjValues[column.field] = ArrayUtilities.toObject(column.option.valueField, cacheValues[column.field]);
        }
        // TRƯỜNG HỢP 2: Nếu items là hàm trả về Promise (API Call)
        else if (typeof column.option.items === 'function') {
          promises.push(
            column.option.items().then(data => ({
              key: column.field,
              valueField: column.option.valueField,
              displayField: column.option.displayField,
              data: Array.isArray(data) ? data : [],
            }))
            // ... catch error giữ nguyên
          );
        }

        // TRƯỜNG HỢP 3: Mảng tĩnh (K[]) bình thường
        else {
          cacheValues[column.field] = column.option.items.map(e => ({
            ...e,
            [column.option.valueField]: Utilities.getNestedValue(e, column.option.valueField),
            [column.option.displayField]: Utilities.getNestedValue(e, column.option.displayField),
          }));

          cacheObjValues[column.field] = ArrayUtilities.toObject(column.option.valueField, cacheValues[column.field]);
        }
      }
    }

    if (promises.length) {
      const results = await Promise.all(promises);
      for (const result of results) {
        cacheValues[result.key] = result.data.map(e => ({
          ...e,
          [result.valueField]: Utilities.getNestedValue(e, result.valueField),
          [result.displayField]: Utilities.getNestedValue(e, result.displayField),
        }));
        cacheObjValues[result.key] = ArrayUtilities.toObject(result.valueField, cacheValues[result.key]);
      }
    }
  }

  /**
   * Chuyển đổi dữ liệu thô thành SdTableItem kèm các thiết lập hiển thị (Display Meta)
   */
  async format<T = any>(
    rawItems: T[],
    columns: SdTableColumn[],
    cacheValues: Record<string, any[]>,
    cacheObjValues: Record<string, Record<string, string>>,
    rowKey?: string
  ): Promise<SdTableItem<T>[]> {
    // why: KHÔNG dùng `rawItems.map(MapToSdTableItem)` — `map` truyền cả index làm
    // tham số thứ 2, tức index sẽ bị nhận nhầm thành `rowKey`.
    const items = rawItems.map(item => MapToSdTableItem(item, rowKey));
    const execute = async (column: SdTableColumnNormal) => {
      const { field, click, tooltip, htmlTemplate, transform } = column;
      const fieldStr = field;

      // Xử lý nạp từ điển động (lazy-values)
      if (!transform && !htmlTemplate && column.type === 'lazy-values' && typeof column.option.views === 'function') {
        const {
          option: { views, valueField, displayField },
        } = column;

        cacheObjValues[fieldStr] = cacheObjValues[fieldStr] || {};

        const values = ArrayUtilities.distinct(
          items
            .map(item => Utilities.getNestedValue(item.data, fieldStr))
            .filter(val => val?.toString())
            .reduce<string[]>((current, next) => [...current, ...(Array.isArray(next) ? next : [next])], [])
            .filter(val => !Object.keys(cacheObjValues[fieldStr]).includes(val))
        );

        if (values.length) {
          const lazyItems: any[] = (
            await views(values).catch((err: any) => {
              console.error(err);
              return [];
            })
          )
            .filter((item: any) => values.includes(Utilities.getNestedValue(item, valueField)))
            .map((e: any) => ({
              [valueField]: Utilities.getNestedValue(e, valueField),
              [displayField]: Utilities.getNestedValue(e, displayField),
            }));
          Object.assign(cacheObjValues[fieldStr], ArrayUtilities.toObject(valueField, lazyItems) || {});
        }
      }

      // Format dữ liệu cho từng hàng
      for (const item of items) {
        const rowData = item.data;
        const value = Utilities.getNestedValue(rowData, fieldStr);
        item.meta.display[fieldStr] = {
          badge: undefined,
          cellStyle: column.align === 'right' ? { 'text-align': 'right!important' } : undefined,
          data: value,
          isHtml: false,
          tooltip: typeof tooltip === 'function' ? tooltip(value, rowData) : undefined,
          click: typeof click === 'function' ? () => click(value, rowData) : undefined,
        };

        const display = item.meta.display[fieldStr];

        if (typeof htmlTemplate === 'function') {
          display.isHtml = true;
          display.data = htmlTemplate(value, rowData);
        } else if (typeof transform === 'function') {
          const newValue = transform(value, rowData);
          display.data = newValue instanceof Promise ? await newValue : newValue;
        } else {
          // Xử lý các type cơ bản
          if (column.type === 'date' || column.type === 'datetime' || column.type === 'time') {
            display.data = this.#formatDateDisplay(value, column.type);
            display.isHtml = column.type === 'datetime';
          }
          if (column.type === 'values' || column.type === 'lazy-values') {
            display.data = this.#processValuesDisplay(value, column, fieldStr, cacheObjValues);
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

  #processValuesDisplay(
    value: any,
    column: SdTableColumnNormal & { type: 'values' | 'lazy-values' },
    field: string,
    cacheObjValues: Record<string, Record<string, string>>
  ): string {
    const vals = (Array.isArray(value) ? value : [value]).filter(e => e?.toString());
    return vals.map(val => cacheObjValues[field]?.[val]?.[column.option.displayField as any] || val).join(', ');
  }

  #createBadge(
    column: SdTableColumnNormal,
    value: any,
    rowData: any,
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
