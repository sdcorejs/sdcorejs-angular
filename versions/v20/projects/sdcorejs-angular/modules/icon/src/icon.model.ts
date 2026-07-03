import { type LucideConfig, type LucideIcon, type LucideIconData } from '@lucide/angular';
import { type Size } from '@sdcorejs/utils/models';
import { DefaultSdIconSet, type SdIconSet, type SdMaterialIconSet } from '@sdcorejs/angular/utilities/models';

/**
 * Chọn renderer icon chính cho `SdIcon`.
 *
 * Material dùng đúng tên font set để tránh thêm mapping nội bộ; `lucide` chuyển sang renderer SVG của `@lucide/angular`.
 */
export type { SdIconSet, SdMaterialIconSet };

/** @deprecated Use `SdIconSet` instead. */
export type SdIconFontSet = SdIconSet;


/**
 * Một icon Lucide có thể đăng ký bằng class icon Angular hoặc dữ liệu path thuần.
 */
export type SdLucideIconRegistration = LucideIcon | LucideIconData;

/**
 * Danh sách đăng ký Lucide cho provider, hỗ trợ cả array và object map để app có thể giữ cấu trúc import riêng.
 */
export type SdLucideIconRegistrations = SdLucideIconRegistration[] | Record<string, SdLucideIconRegistration>;

/**
 * Cấu hình app-level cho `SdIcon`.
 *
 * Các alias tách riêng theo renderer để app có thể giữ tên Material trong template trong lúc chuyển dần sang Lucide.
 */
export interface ISdIconConfiguration {
  /** Default icon font set when component does not pass `fontSet`. */
  defaultFontSet?: SdIconSet;
  /** Alias áp dụng khi renderer hiện tại là Material. */
  materialAliases?: Record<string, string>;
  /** Alias áp dụng khi renderer hiện tại là Lucide. */
  lucideAliases?: Record<string, string>;
  /** Cấu hình stroke toàn cục cho Lucide SVG. */
  lucideConfig?: Partial<LucideConfig>;
  /** Icon Lucide cần đăng ký vào `@lucide/angular`. */
  lucideIcons?: SdLucideIconRegistrations;
}

/**
 * Cấu hình đã resolve đầy đủ để component không phải tự xử lý fallback nhiều lần.
 */
export interface ISdIconResolvedConfiguration
  extends Required<Omit<ISdIconConfiguration, 'lucideIcons'>> {}

/**
 * Quy đổi token `Size` chung của SDCoreJS sang pixel cho icon.
 */
export const SD_ICON_SIZE_MAP: Record<Size, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

/**
 * Alias mặc định giúp template giữ tên Material trong khi renderer có thể là Lucide.
 */
export const SD_DEFAULT_LUCIDE_ALIASES: Record<string, string> = {
  account_balance: 'landmark',
  account_circle: 'circle-user-round',
  account_tree: 'workflow',
  add: 'plus',
  add_circle: 'circle-plus',
  arrow_back: 'arrow-left',
  arrow_downward: 'arrow-down',
  arrow_drop_down: 'chevron-down',
  arrow_drop_up: 'chevron-up',
  arrow_forward: 'arrow-right',
  arrow_upward: 'arrow-up',
  bar_chart: 'chart-column',
  block: 'ban',
  bookmark_add: 'bookmark-plus',
  bookmark_border: 'bookmark',
  build: 'wrench',
  calendar_month: 'calendar-days',
  campaign: 'megaphone',
  cancel: 'circle-x',
  celebration: 'party-popper',
  chevron_left: 'chevron-left',
  chevron_right: 'chevron-right',
  check: 'check',
  check_circle: 'circle-check',
  close: 'x',
  cloud_download: 'cloud-download',
  contact_page: 'contact',
  content_copy: 'copy',
  dashboard: 'layout-dashboard',
  delete: 'trash-2',
  delete_sweep: 'trash-2',
  description: 'file-text',
  done: 'check',
  done_all: 'check-check',
  drag_indicator: 'grip-vertical',
  edit: 'pencil',
  edit_note: 'file-pen-line',
  error: 'circle-alert',
  error_outline: 'circle-alert',
  expand_less: 'chevron-up',
  expand_more: 'chevron-down',
  filter_alt: 'list-filter',
  file_download: 'download',
  file_upload: 'upload',
  fiber_manual_record: 'circle',
  fit_screen: 'scan',
  folder: 'folder',
  first_page: 'chevrons-left',
  format_indent_decrease: 'list-indent-decrease',
  format_indent_increase: 'list-indent-increase',
  fullscreen: 'maximize',
  fullscreen_exit: 'minimize',
  get_app: 'download',
  group: 'users',
  hourglass_empty: 'hourglass',
  hourglass_top: 'hourglass',
  image: 'image',
  image_not_supported: 'image-off',
  info: 'info',
  info_outline: 'info',
  insert_drive_file: 'file',
  inventory_2: 'package',
  keyboard_arrow_down: 'chevron-down',
  keyboard_arrow_left: 'chevron-left',
  keyboard_arrow_right: 'chevron-right',
  keyboard_arrow_up: 'chevron-up',
  last_page: 'chevrons-right',
  list: 'list',
  local_offer: 'tag',
  lock: 'lock-keyhole',
  lock_outline: 'lock-keyhole',
  login: 'log-in',
  logout: 'log-out',
  match_case: 'case-sensitive',
  menu: 'menu',
  menu_open: 'panel-left-close',
  more_horiz: 'ellipsis',
  more_vert: 'ellipsis-vertical',
  notifications: 'bell',
  open_in_new: 'external-link',
  open_in_full: 'maximize',
  person: 'user',
  picture_as_pdf: 'file-text',
  play_arrow: 'play',
  print: 'printer',
  refresh: 'refresh-cw',
  remove: 'minus',
  remove_circle: 'circle-minus',
  restart_alt: 'rotate-ccw',
  rotate_right: 'rotate-cw',
  search_off: 'search-x',
  settings: 'settings',
  share: 'share-2',
  smart_toy: 'bot',
  space_dashboard: 'layout-dashboard',
  storefront: 'store',
  swap_horiz: 'arrow-left-right',
  table_chart: 'table',
  table_view: 'table-2',
  task_alt: 'circle-check',
  text_fields: 'text',
  today: 'calendar',
  unfold_more: 'chevrons-up-down',
  upload_file: 'upload',
  view_carousel: 'gallery-horizontal',
  view_day: 'panel-top',
  view_list: 'list',
  visibility: 'eye',
  visibility_off: 'eye-off',
  warning: 'triangle-alert',
  warning_amber: 'triangle-alert',
  widgets: 'layout-grid',
  zoom_in: 'zoom-in',
};

/**
 * Alias mac dinh giup template dung ten Lucide van render duoc khi quay ve Material font.
 */
export const SD_DEFAULT_MATERIAL_ALIASES: Record<string, string> = {
  'arrow-down': 'arrow_downward',
  'arrow-left': 'arrow_back',
  'arrow-right': 'arrow_forward',
  'arrow-up': 'arrow_upward',
  'calendar-days': 'calendar_month',
  'case-sensitive': 'match_case',
  'chart-column': 'bar_chart',
  'check-check': 'done_all',
  'chevron-down': 'expand_more',
  'chevron-left': 'chevron_left',
  'chevron-right': 'chevron_right',
  'chevron-up': 'expand_less',
  'chevrons-left': 'first_page',
  'chevrons-right': 'last_page',
  'circle-alert': 'error',
  'circle-check': 'check_circle',
  'circle-minus': 'remove_circle',
  'circle-plus': 'add_circle',
  'circle-user-round': 'account_circle',
  'circle-x': 'cancel',
  'cloud-download': 'cloud_download',
  'file-down': 'file_download',
  'file-pen-line': 'edit_note',
  'file-text': 'description',
  'file-up': 'upload_file',
  'gallery-horizontal': 'view_carousel',
  get_app: 'file_download',
  'grip-vertical': 'drag_indicator',
  'layout-dashboard': 'dashboard',
  'layout-grid': 'widgets',
  'list-indent-decrease': 'format_indent_decrease',
  'list-indent-increase': 'format_indent_increase',
  'list-filter': 'filter_alt',
  'lock-keyhole': 'lock',
  'log-in': 'login',
  'log-out': 'logout',
  'panel-left-close': 'menu_open',
  'party-popper': 'celebration',
  'refresh-cw': 'refresh',
  'rotate-ccw': 'restart_alt',
  'rotate-cw': 'rotate_right',
  'share-2': 'share',
  'square-pen': 'edit',
  'trash-2': 'delete',
  'triangle-alert': 'warning',
  'zoom-in': 'zoom_in',
  ban: 'block',
  contact: 'contact_page',
  copy: 'content_copy',
  circle: 'fiber_manual_record',
  download: 'file_download',
  ellipsis: 'more_horiz',
  'ellipsis-vertical': 'more_vert',
  error_outline: 'error',
  eye: 'visibility',
  'eye-off': 'visibility_off',
  file: 'insert_drive_file',
  folder: 'folder',
  fullscreen: 'fullscreen',
  hourglass: 'hourglass_top',
  image: 'image',
  'image-off': 'image_not_supported',
  info_outline: 'info',
  landmark: 'account_balance',
  list: 'list',
  lock_outline: 'lock',
  maximize: 'fullscreen',
  megaphone: 'campaign',
  menu: 'menu',
  minimize: 'fullscreen_exit',
  minus: 'remove',
  package: 'inventory_2',
  pencil: 'edit',
  plus: 'add',
  play: 'play_arrow',
  printer: 'print',
  scan: 'fit_screen',
  'search-x': 'search_off',
  settings: 'settings',
  'save-all': 'done_all',
  store: 'storefront',
  tag: 'local_offer',
  text: 'text_fields',
  upload: 'upload_file',
  user: 'person',
  users: 'group',
  workflow: 'account_tree',
  wrench: 'build',
  x: 'close',
};

/**
 * Cấu hình mặc định của Core UI icon.
 *
 * `material-icons-outlined` được giữ làm mặc định để không đổi visual của các component Material hiện có.
 */
export const SD_ICON_DEFAULT_CONFIG: ISdIconResolvedConfiguration = {
  defaultFontSet: DefaultSdIconSet,
  materialAliases: SD_DEFAULT_MATERIAL_ALIASES,
  lucideAliases: SD_DEFAULT_LUCIDE_ALIASES,
  lucideConfig: {},
};
