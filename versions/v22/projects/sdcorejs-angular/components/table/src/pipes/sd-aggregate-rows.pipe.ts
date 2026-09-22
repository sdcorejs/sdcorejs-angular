import { Pipe, PipeTransform } from '@angular/core';
import { MapToSdTableItem, SdTableItem } from '../models/table-item.model';
import { SdTableOption } from '../models/table-option.model';
import { AggregateRow, AggregateSnapshot } from '../services/table-aggregate.util';

export interface AggregateRenderHost<T> {
  rows: WeakMap<SdTableItem<T>, AggregateRow<T>>;
  indices: WeakMap<SdTableItem<T>, number>;
}

/** Summary wrappers belong only to the render projection, never to items()/business selection. */
@Pipe({ name: 'sdAggregateRows' })
export class SdAggregateRowsPipe implements PipeTransform {
  transform<T>(
    rows: SdTableItem<T>[],
    snapshot: AggregateSnapshot<T>,
    option: SdTableOption<T>,
    host: AggregateRenderHost<T>
  ): SdTableItem<T>[] {
    host.rows = new WeakMap();
    host.indices = new WeakMap(rows.map((row, index) => [row, index]));
    if (!snapshot.total) return rows;
    const result: SdTableItem<T>[] = [];
    const append = (summary: AggregateRow<T>) => {
      const marker = MapToSdTableItem<T>(undefined as T);
      marker.meta.id = `sd-aggregate-${summary.key}`;
      host.rows.set(marker, summary);
      result.push(marker);
    };
    if (option.tree) {
      const stack: { level: number; summary: AggregateRow<T> }[] = [];
      for (const row of rows) {
        const level = row.meta.tree?.level ?? 0;
        while (stack.length && stack[stack.length - 1].level >= level) append(stack.pop()!.summary);
        result.push(row);
        const summary = snapshot.branches.get(row.data);
        if (summary && row.meta.tree?.isExpanded) stack.push({ level, summary });
      }
      while (stack.length) append(stack.pop()!.summary);
    } else {
      let pending: AggregateRow<T> | undefined;
      for (const row of rows) {
        if (row.meta.group?.isGroupHeader) {
          if (pending) append(pending);
          pending = !option.group?.collapsible || row.meta.group.isExpanded ? snapshot.groups.get(row.meta.group.key ?? '') : undefined;
        }
        result.push(row);
      }
      if (pending) append(pending);
    }
    return result;
  }
}
