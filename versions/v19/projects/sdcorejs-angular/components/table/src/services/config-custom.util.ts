import { ConfiguredColumn, ConfiguredTable } from '../models/table-option-config.model';
import { SdTableOption } from '../models/table-option.model';
import { SdTableOptionFilter } from './table-filter/table-filter.model';

/** The column setup of an option before anyone changes it: every column that is not `hidden`, in option order. */
export const defaultConfiguredTable = (option: SdTableOption | undefined): ConfiguredTable => ({
  columns:
    option?.columns
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
      })) || [],
});

// why: so với `origin` đã lưu chứ không với option hiện tại — tiêu đề dịch theo ngôn ngữ hay đổi trong code không
// phải là thiết lập của người dùng. Giá trị rỗng nghĩa là "dùng giá trị gốc", như `loadConfigurationResult` đọc.
const changedFromOrigin = (column: ConfiguredColumn): boolean => {
  const { origin } = column;
  return (
    (column.title || origin.title) !== origin.title ||
    (column.width || origin.width) !== origin.width ||
    !!column.invisible !== !!origin.invisible ||
    !!column.fixed !== !!origin.fixed ||
    !!(column.truncate ?? origin.truncate) !== !!origin.truncate
  );
};

/**
 * Whether the table uses a setup of its own: the stored columns differ from the defaults in order, visibility, title,
 * width (the settings modal or a resize on the table), fixed or truncate, the inline external filters differ from
 * `defaultShowing`, or the stored filter mode differs from `filter.mode` (only while `filter.modeSelectable` is not
 * `false`). Columns added to or removed from the option since the setup was stored do not count.
 */
export const sdTableHasCustomSetup = ({
  option,
  configuration,
  inlineExternal,
  filterMode,
}: {
  option: SdTableOption | undefined;
  configuration: ConfiguredTable | undefined;
  inlineExternal?: Record<string, boolean>;
  filterMode?: SdTableOptionFilter['mode'];
}): boolean => {
  const defaults = defaultConfiguredTable(option).columns!.map(column => column.origin.field);
  const known = new Set(defaults);
  const stored = (configuration?.columns ?? []).filter(column => known.has(column.origin.field));
  const storedFields = new Set(stored.map(column => column.origin.field));
  const order = defaults.filter(field => storedFields.has(field));
  if (stored.some((column, index) => column.origin.field !== order[index] || changedFromOrigin(column))) return true;

  const filter = option?.filter;
  if (filter?.disabled) return false;
  if (filterMode && filter?.modeSelectable !== false && filterMode !== (filter?.mode ?? 'default')) return true;
  if (!inlineExternal) return false;
  return (filter?.externalFilters ?? []).some(external => !!inlineExternal[external.field] !== !!external.defaultShowing);
};
