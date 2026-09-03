import { Pipe, PipeTransform } from '@angular/core';
import { SdTableOption } from '../models/table-option.model';
import { MapToSdTableItem, SdTableItem } from '../models/table-item.model';
import { Utilities } from '@sdcorejs/utils/fns';
import { buildGroupHeaderContext, SdGroupHeaderHost, syncGroupSelectionMeta } from '../services/table-selection/table-selection.util';

@Pipe({ name: 'sdGroup' })
export class SdGroupPipe implements PipeTransform {
  /**
   * Nhóm items theo `option.group.fields`. Mỗi group sinh ra 1 synthetic SdTableItem
   * (group header) đặt trước children. Header có `meta.group.isGroupHeader = true` + `key`
   * + `values` + `items` + `isExpanded` để template + table consume.
   *
   * Khi `option.group.collapsible = true` + group đang collapse → children bị lọc khỏi output.
   *
   * `expandState` (optional, owned by component) — Map<key, expanded> giữ trạng thái
   * expand/collapse qua các lần transform. Pipe đọc state từ Map; nếu key chưa tồn tại,
   * dùng `!option.group.defaultCollapsed`. Pipe ghi state về Map cho lần read sau.
   *
   * `host` (optional, owned by component) — nhận danh sách header vừa sinh (để component
   * sync selection state) và cung cấp callback toggle cho template context.
   *
   * @example
   * `_items | sdGroup: _tableOption : groupExpandState : groupHost`
   */
  transform(items: SdTableItem[], gridOption: SdTableOption, expandState?: Map<string, boolean>, host?: SdGroupHeaderHost): SdTableItem[] {
    // why: sink do component sở hữu, pipe reset TẠI CHỖ mỗi lần transform (không gán
    // mảng mới) để reference bên component luôn ổn định.
    if (host) host.headers.length = 0;
    if (gridOption?.tree) {
      if (typeof ngDevMode !== 'undefined' && ngDevMode && gridOption.group) {
        console.warn('[sd-table] option.tree and option.group cannot be used together. group is ignored.');
      }
      return items;
    }
    const group = gridOption?.group;
    if (!group?.fields?.length) return items;
    const fields = group.fields;
    const collapsible = !!group.collapsible;
    const defaultExpanded = !group.defaultCollapsed;

    // Bucket items theo combined field-value hash.
    // Field hỗ trợ dot-notation (vd 'customer.id') — resolve qua getNestedValue.
    const buckets = new Map<string, { values: Record<string, any>; items: SdTableItem[] }>();
    for (const item of items) {
      const values: Record<string, any> = {};
      for (const f of fields) values[f as string] = Utilities.getNestedValue(item.data, f as string);
      const key = Utilities.hash(values);
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { values, items: [] };
        buckets.set(key, bucket);
      }
      bucket.items.push(item);
    }

    const result: SdTableItem[] = [];
    buckets.forEach((bucket, key) => {
      const isExpanded = expandState?.has(key) ? !!expandState.get(key) : defaultExpanded;
      if (collapsible && expandState) expandState.set(key, isExpanded);

      const header = MapToSdTableItem({} as any);
      // why: `MapToSdTableItem({})` sinh id cho một object rỗng MỚI mỗi lần transform →
      // trackBy của mat-table đổi liên tục (và trước kia, khi id là hash nội dung, MỌI
      // header dùng CHUNG một id). Khoá id theo group key: duy nhất giữa các group và
      // ổn định qua mọi lần re-eval.
      header.meta.id = `sd-group-${key}`;
      header.meta.group = {
        isGroupHeader: true,
        key,
        values: bucket.values,
        items: bucket.items,
        // why: precompute 1 lần — template/context không map lại mỗi CD pass nữa.
        data: bucket.items.map(i => i.data),
        isExpanded,
      };
      header.meta.selector!.selectable = false;
      header.meta.group.context = buildGroupHeaderContext(header, host);
      syncGroupSelectionMeta(header);
      host?.headers.push(header);
      result.push(header);

      if (!collapsible || isExpanded) {
        for (const child of bucket.items) result.push(child);
      }
    });
    return result;
  }
}
