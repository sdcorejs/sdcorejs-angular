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
    TREE_TOGGLE: 'sdTreeToggle',
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
    // Náº¿u khÃ´ng cÃ³ key thÃ¬ khÃ´ng láº¥y Ä‘Æ°á»£c setting
    if (!option?.key) {
      return this.storageService.create<ConfiguredTable>(Utilities.hash(option), {
        type: 'session', // Náº¿u khÃ´ng cÃ³ key thÃ¬ lÆ°u theo session
        default: this.#default(option),
      });
    }
    // Key cá»§a setting lÃ  tá»• há»£p tá»« key truyá»n vÃ o vÃ  prefix Ä‘á»ƒ trÃ¡nh chung key vá»›i cÃ¡c tÃ­nh nÄƒng khÃ¡c cÅ©ng dÃ¹ng key trong core table
    return this.storageService.create<ConfiguredTable>(
      { prefix: this.#prefix, key: option?.key },
      {
        default: this.#default(option),
      }
    );
  };

  loadConfiguredTable = (option: SdTableOption) => {
    // Náº¿u khÃ´ng cÃ³ key thÃ¬ tráº£ vá» thÃ´ng tin máº·c Ä‘á»‹nh
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
    const isCommandRight = option?.command?.align === 'right' || false; // ðŸ‘ˆ thÃªm dÃ²ng nÃ y
    const columns = option?.columns?.filter(e => !e.hidden) || [];
    if (selector?.visible) {
      result.firstHeaders.push(this.#COLUMNS.SELECTION);
      result.displayedColumns.push(this.#COLUMNS.SELECTION);
    }
    if (option.tree) {
      result.firstHeaders.push(this.#COLUMNS.TREE_TOGGLE);
      result.displayedColumns.push(this.#COLUMNS.TREE_TOGGLE);
    }
    // ðŸ‘‡ Chá»‰ push vÃ o Ä‘áº§u náº¿u lÃ  left (máº·c Ä‘á»‹nh)
    if (commands?.length && !isCommandRight) {
      result.firstHeaders.push(this.#COLUMNS.COMMAND);
      result.displayedColumns.push(this.#COLUMNS.COMMAND);
    }
    // why: group header row dÃ¹ng matRowDef RIÃŠNG vá»›i column list ['sdGroupHeader'] qua predicate
    // when:isGroupHeader â€” KHÃ”NG inject vÃ o displayedColumns/firstHeaders Ä‘á»ƒ trÃ¡nh colspan trick
    // (TDs khÃ¡c váº«n render gÃ¢y overflow row). Data row dÃ¹ng displayedColumns nguyÃªn váº¹n.
    // group option váº«n cáº§n khai bÃ¡o (qua option.group) Ä‘á»ƒ SdGroupPipe biáº¿t bucket items.
    // sdIndex Ä‘áº·t sau selector / tree / command-left / group, ngay trÆ°á»›c data columns
    if (option.index?.enabled) {
      result.firstHeaders.push(this.#COLUMNS.INDEX);
      result.displayedColumns.push(this.#COLUMNS.INDEX);
    }
    configuration?.columns
      ?.filter(col => !col.invisible)
      .forEach(col => {
        // Kiá»ƒm tra column trong config cÃ³ cÃ²n Ä‘Æ°á»£c khai bÃ¡o trong option
        // Náº¿u khÃ´ng thÃ¬ áº©n column Ä‘Ã³ Ä‘i
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
    // Náº¿u cÃ³ thÃªm cÃ¡c column má»›i, chÃ¨n cÃ¡c column Ä‘Ã³ vÃ o cuá»‘i
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
    // why: filler column á»Ÿ cuá»‘i háº¥p thá»¥ leftover space â€” opt-in qua option.filler.enabled.
    // Khi báº­t, ngÄƒn cÃ¡c cá»™t utility (selection, index, command) bá»‹ table-layout auto stretch trÃªn mÃ n rá»™ng.
    if (option.filler?.enabled) {
      result.firstHeaders.push(this.#COLUMNS.FILLER);
      result.displayedColumns.push(this.#COLUMNS.FILLER);
    }
    result.multipleHeader = result.secondHeaders.length > 0;
    // Sub infomation khÃ´ng thá»ƒ cÃ³ footer; filler cÅ©ng khÃ´ng cáº§n footer cell.
    result.displayedFooters = result.displayedColumns.filter(
      val => val !== this.#COLUMNS.SUBINFORMATION && val !== this.#COLUMNS.TREE_TOGGLE && val !== this.#COLUMNS.FILLER
    );
    if (option.filler?.enabled) {
      // Footer cÅ©ng cáº§n filler cuá»‘i Ä‘á»ƒ giá»¯ width Ä‘á»“ng bá»™ vá»›i data row
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
      // Cá»™t chÆ°a cÃ³ trong storage (vd cá»™t má»›i thÃªm vÃ o option) â€” bá» qua;
      // sáº½ Ä‘Æ°á»£c pick up qua flow loadConfigurationResult bÃ¬nh thÆ°á»ng.
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

