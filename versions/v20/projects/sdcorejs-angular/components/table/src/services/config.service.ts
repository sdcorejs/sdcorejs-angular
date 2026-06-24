import { Inject, Injectable, Optional } from '@angular/core';
import { SdStorage, SdStorageService } from '@sdcorejs/angular/services';
import { Subject } from 'rxjs';
import { ConfiguredColumn, ConfiguredTable, ConfiguredTableResult } from '../models/table-option-config.model';
import { SdTableOption } from '../models/table-option.model';
import { ISdTableConfiguration, SD_TABLE_CONFIGURATION } from '../configurations';
import { Utilities } from '@sdcorejs/utils/fns';

@Injectable()
export class ConfigService {
  #COLUMNS = {
    SUBINFORMATION: 'sdSubInformationAction',
    COMMAND: 'sdCommand',
    SELECTION: 'sdSelection',
    GROUP: 'sdGroup',
    REORDER: 'sdReorder',
    INDEX: 'sdIndex',
    FILLER: 'sdFiller',
  };
  #prefix = 'TABLE_CONFIG';
  #storage?: SdStorage<ConfiguredTable>;
  #widthChange = new Subject<{ field: string; width: string }>();
  widthChange$ = this.#widthChange.asObservable();

  constructor(
    private storageService: SdStorageService,
    @Inject(SD_TABLE_CONFIGURATION) @Optional() public tableConfiguration: ISdTableConfiguration
  ) {}

  #loadConfiguredTable = (option: SdTableOption): SdStorage<ConfiguredTable> => {
    // Nếu không có key thì không lấy được setting
    if (!option?.key) {
      return this.storageService.create<ConfiguredTable>(Utilities.hash(option), {
        type: 'session', // Nếu không có key thì lưu theo session
        default: this.#default(option),
      });
    }
    // Key của setting là tổ hợp từ key truyền vào và prefix để tránh chung key với các tính năng khác cũng dùng key trong core table
    return this.storageService.create<ConfiguredTable>(
      { prefix: this.#prefix, key: option?.key },
      {
        default: this.#default(option),
      }
    );
  };

  loadConfiguredTable = (option: SdTableOption) => {
    // Nếu không có key thì trả về thông tin mặc định
    if (!option?.key) {
      return this.#default(option);
    }
    const storage = this.#loadConfiguredTable(option)!;
    return storage.get();
  };

  loadConfigurationResult = (option: SdTableOption, configuration: ConfiguredTable): ConfiguredTableResult => {
    const result: ConfiguredTableResult = {
      column: {},
      fixedColumn: {},
      firstColumns: [],
      secondColumns: [],
      firstHeaders: [],
      secondHeaders: [],
      displayedColumns: [],
      displayedFooters: [],
      multipleHeader: false,
    };
    const { selector, group } = option || {};
    const commands = option?.command?.commands || option?.commands || [];
    const isCommandRight = option?.command?.align === 'right' || false; // 👈 thêm dòng này
    const columns = option?.columns?.filter(e => !e.hidden) || [];
    if (selector?.visible) {
      result.firstHeaders.push(this.#COLUMNS.SELECTION);
      result.displayedColumns.push(this.#COLUMNS.SELECTION);
    }
    // why: tree toggle KHÔNG còn là cột riêng — icon expand được nhúng vào cột
    // đầu tiên (cột Index nếu có, ngược lại là cột data đầu). Xem table.component.html.
    // 👇 Chỉ push vào đầu nếu là left (mặc định)
    if (commands?.length && !isCommandRight) {
      result.firstHeaders.push(this.#COLUMNS.COMMAND);
      result.displayedColumns.push(this.#COLUMNS.COMMAND);
    }
    // why: group header row dùng matRowDef RIÊNG với column list ['sdGroupHeader'] qua predicate
    // when:isGroupHeader — KHÔNG inject vào displayedColumns/firstHeaders để tránh colspan trick
    // (TDs khác vẫn render gây overflow row). Data row dùng displayedColumns nguyên vẹn.
    // group option vẫn cần khai báo (qua option.group) để SdGroupPipe biết bucket items.
    // sdIndex đặt sau selector / tree / command-left / group, ngay trước data columns
    if (option.index?.enabled) {
      result.firstHeaders.push(this.#COLUMNS.INDEX);
      result.displayedColumns.push(this.#COLUMNS.INDEX);
    }
    configuration?.columns
      ?.filter(col => !col.invisible)
      .forEach(col => {
        // Kiểm tra column trong config có còn được khai báo trong option
        // Nếu không thì ẩn column đó đi
        const column = columns.find(e => e.field === col.origin.field);
        if (column) {
          const title =
            typeof column.title === 'string' ? col.title || col.origin.title : { ...column.title, title: col.title || col.origin.title };
          const cell = {
            ...column.cell,
            truncate: {
              ...column.cell?.truncate,
              enable: col?.truncate ?? col.origin.truncate,
              type: column?.cell?.truncate?.type ?? 'tooltip',
            },
          };

          result.column[col.origin.field] = {
            title: col.title || col.origin.title,
            width: col.width || col.origin.width,
          };

          if (col.fixed) {
            result.fixedColumn[col.origin.field] = {
              title: col.title || col.origin.title,
              width: col.width || col.origin.width,
            };
          }

          result.firstColumns.push({
            ...column,
            title: title,
            width: col.width || col.origin.width,
            cell: cell,
          });
          result.firstHeaders.push(col.origin.field);
          result.displayedColumns.push(col.origin.field);

          if (column.type === 'children') {
            column.children?.forEach(childColumn => {
              result.secondColumns.push(childColumn);
              result.secondHeaders.push(childColumn.field);
              result.displayedColumns.push(childColumn.field);
            });
          }
        }
      });
    // Nếu có thêm các column mới, chèn các column đó vào cuối
    columns
      ?.filter(column => !configuration?.columns?.some(e => e.origin.field === column.field))
      .forEach(column => {
        result.firstColumns.push({
          ...column,
          title: column.title,
          width: column.width,
        });
        result.firstHeaders.push(column.field);
        result.displayedColumns.push(column.field);
        if (column.type === 'children') {
          column.children?.forEach(childColumn => {
            result.secondColumns.push(childColumn);
            result.secondHeaders.push(childColumn.field);
            result.displayedColumns.push(childColumn.field);
          });
        }
      });
    if (option.expand) {
      result.firstHeaders.push(this.#COLUMNS.SUBINFORMATION);
      result.displayedColumns.push(this.#COLUMNS.SUBINFORMATION);
    }
    if (commands?.length && isCommandRight) {
      result.firstHeaders.push(this.#COLUMNS.COMMAND);
      result.displayedColumns.push(this.#COLUMNS.COMMAND);
    }
    // why: filler column ở cuối hấp thụ leftover space — opt-in qua option.filler.enabled.
    // Khi bật, ngăn các cột utility (selection, index, command) bị table-layout auto stretch trên màn rộng.
    if (option.filler?.enabled) {
      result.firstHeaders.push(this.#COLUMNS.FILLER);
      result.displayedColumns.push(this.#COLUMNS.FILLER);
    }
    result.multipleHeader = result.secondHeaders.length > 0;
    // Sub infomation không thể có footer; filler cũng không cần footer cell.
    result.displayedFooters = result.displayedColumns.filter(val => val !== this.#COLUMNS.SUBINFORMATION && val !== this.#COLUMNS.FILLER);
    if (option.filler?.enabled) {
      // Footer cũng cần filler cuối để giữ width đồng bộ với data row
      result.displayedFooters.push(this.#COLUMNS.FILLER);
    }
    if (option?.rowReorder?.enabled) {
      result.displayedColumns.unshift(this.#COLUMNS.REORDER);
      result.firstHeaders.unshift(this.#COLUMNS.REORDER);
      result.displayedFooters.unshift(this.#COLUMNS.REORDER);
    }
    return result;
  };

  init = (tableOption: SdTableOption) => {
    this.#storage = this.#loadConfiguredTable(tableOption);
    return this.#storage;
  };

  persistColumnWidth = (field: string, width: string) => {
    if (!this.#storage) return;
    const current = this.#storage.get();
    const columns = current?.columns ? [...current.columns] : [];
    const idx = columns.findIndex(c => c.origin.field === field);
    if (idx < 0) {
      // Cột chưa có trong storage (vd cột mới thêm vào option) — bỏ qua;
      // sẽ được pick up qua flow loadConfigurationResult bình thường.
      return;
    }
    columns[idx] = { ...columns[idx], width };
    this.#storage.setSilent({ ...current, columns });
    this.#widthChange.next({ field, width });
  };

  #default = (tableOption: SdTableOption): ConfiguredTable => {
    const columns: ConfiguredColumn[] =
      tableOption?.columns
        ?.filter(e => !e.hidden)
        .map(e => ({
          origin: {
            field: e.field,
            title: typeof e.title === 'string' ? e.title : e.title?.title,
            width: e.width,
            invisible: e.invisible,
            fixed: e.fixed,
            truncate: e?.cell?.truncate?.enable,
          },
          title: typeof e.title === 'string' ? e.title : e.title?.title,
          width: e.width,
          invisible: e.invisible,
          fixed: e.fixed,
          truncate: e?.cell?.truncate?.enable,
        })) || [];
    return {
      columns,
    };
  };
}
