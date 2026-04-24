import { SdTableColumn } from './table-column.model';

export interface TableOptionConfig {
  visible?: boolean;
}

export interface OriginColumn {
  field: string;
  title: string;
  width?: string;
  invisible?: boolean;
}

export interface ConfiguredColumn {
  origin: OriginColumn;
  title?: string;
  width?: string;
  invisible?: boolean;
  fixed?: boolean;
  charLimited?: boolean;
}

export interface ConfiguredTable {
  columns?: ConfiguredColumn[];
}

export interface ConfiguredTableResult {
  column: Record<
    string,
    {
      title?: string;
      width?: string;
    }
  >;
  fixedColumn: Record<
    string,
    {
      title?: string;
      width?: string;
    }
  >;
  charLimitedColumn: Record<
    string,
    {
      title?: string;
      width?: string;
    }
  >;
  firstColumns: SdTableColumn[];
  secondColumns: SdTableColumn[];
  firstHeaders: string[];
  secondHeaders: string[];
  displayedColumns: string[];
  displayedFooters: string[];
  multipleHeader: boolean;
}
