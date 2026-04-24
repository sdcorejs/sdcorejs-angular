import { Inject, Injectable, Optional } from '@angular/core';
import { SdStorage, SdStorageService } from '@sdcorejs/angular/services';
import { ConfiguredColumn, ConfiguredTable, ConfiguredTableResult } from '../models/table-option-config.model';
import { SdTableOption } from '../models/table-option.model';
import { ISdTableConfiguration, SD_TABLE_CONFIGURATION } from '../configurations';
import { SdUtilities } from '@sdcorejs/angular/utilities/extensions';

@Injectable()
export class ConfigService {
  #COLUMNS = {
    SUBINFORMATION: 'sdSubInformationAction',
    COMMAND: 'sdCommand',
    SELECTION: 'sdSelection',
    GROUP: 'sdGroup',
  };
  #prefix = 'TABLE_CONFIG';
  constructor(
    private storageService: SdStorageService,
    @Inject(SD_TABLE_CONFIGURATION) @Optional() public tableConfiguration: ISdTableConfiguration
  ) {}

  #loadConfiguredTable = (option: SdTableOption): SdStorage<ConfiguredTable> => {
    // Náº¿u khÃ´ng cÃ³ key thÃ¬ khÃ´ng láº¥y Ä‘Æ°á»£c setting
    if (!option?.key) {
      return this.storageService.create<ConfiguredTable>(SdUtilities.hash(option), {
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
      charLimitedColumn: {},
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
    // ðŸ‘‡ Chá»‰ push vÃ o Ä‘áº§u náº¿u lÃ  left (máº·c Ä‘á»‹nh)
    if (commands?.length && !isCommandRight) {
      result.firstHeaders.push(this.#COLUMNS.COMMAND);
      result.displayedColumns.push(this.#COLUMNS.COMMAND);
    }
    if (group?.fields?.length) {
      result.firstHeaders.push(this.#COLUMNS.GROUP);
      result.displayedColumns.push(this.#COLUMNS.GROUP);
    }
    configuration?.columns
      ?.filter(col => !col.invisible)
      .forEach(col => {
        // Kiá»ƒm tra column trong config cÃ³ cÃ²n Ä‘Æ°á»£c khai bÃ¡o trong option
        // Náº¿u khÃ´ng thÃ¬ áº©n column Ä‘Ã³ Ä‘i
        const column = columns.find(e => e.field === col.origin.field);
        if (column) {
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

          if (col.charLimited) {
            result.charLimitedColumn[col.origin.field] = {
              title: col.title || col.origin.title,
              width: col.width || col.origin.width,
            };
          }

          result.firstColumns.push({
            ...column,
            title: col.title || col.origin.title,
            width: col.width || col.origin.width,
            charLimited: {
              enable: !!col?.charLimited,
              expandType: column?.charLimited?.expandType ?? 'tooltip',
            },
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
    result.multipleHeader = result.secondHeaders.length > 0;
    // Sub infomation khÃ´ng thá»ƒ cÃ³ footer
    result.displayedFooters = result.displayedColumns.filter(val => val !== this.#COLUMNS.SUBINFORMATION);
    return result;
  };

  init = (tableOption: SdTableOption) => {
    return this.#loadConfiguredTable(tableOption);
  };

  #default = (tableOption: SdTableOption): ConfiguredTable => {
    const columns: ConfiguredColumn[] =
      tableOption?.columns
        ?.filter(e => !e.hidden)
        .map(e => ({
          origin: {
            field: e.field,
            title: e.title,
            width: e.width,
            invisible: e.invisible,
          },
          invisible: e.invisible,
          fixed: e.fixed,
          charLimited: !!e?.charLimited?.enable,
        })) || [];
    return {
      columns,
    };
  };
}

