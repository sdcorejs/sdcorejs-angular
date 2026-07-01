import { type LucideConfig, type LucideIcon, type LucideIconData } from '@lucide/angular';
import { type Size } from '@sdcorejs/utils/models';
import { DefaultMaterialIconFontSet, type MaterialIconFontSet } from '@sdcorejs/angular/utilities/models';

/**
 * Chọn renderer icon chính cho `SdIcon`.
 *
 * Material dùng đúng tên font set để tránh thêm mapping nội bộ; `lucide` chuyển sang renderer SVG của `@lucide/angular`.
 */
export type SdIconSet = 'material-icons' | 'material-icons-outlined' | 'lucide';

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
export interface SdIconConfig {
  /** Bộ icon mặc định khi component không truyền `set`. */
  defaultSet?: SdIconSet;
  /** Font Material fallback khi cần override thủ công hoặc khi đọc cấu hình từ provider. */
  materialFontSet?: MaterialIconFontSet;
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
export interface SdIconResolvedConfig {
  defaultSet: SdIconSet;
  materialFontSet: MaterialIconFontSet;
  materialAliases: Record<string, string>;
  lucideAliases: Record<string, string>;
  lucideConfig: Partial<LucideConfig>;
}

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
  contact_page: 'contact',
  content_copy: 'copy',
  dashboard: 'layout-dashboard',
  delete: 'trash-2',
  description: 'file-text',
  done: 'check',
  done_all: 'check-check',
  edit: 'pencil',
  edit_note: 'file-pen-line',
  error: 'circle-alert',
  error_outline: 'circle-alert',
  expand_less: 'chevron-up',
  expand_more: 'chevron-down',
  file_download: 'download',
  file_upload: 'upload',
  first_page: 'chevrons-left',
  format_indent_decrease: 'list-indent-decrease',
  format_indent_increase: 'list-indent-increase',
  fullscreen: 'maximize',
  fullscreen_exit: 'minimize',
  group: 'users',
  hourglass_top: 'hourglass',
  info: 'info',
  info_outline: 'info',
  insert_drive_file: 'file',
  inventory_2: 'package',
  keyboard_arrow_down: 'chevron-down',
  keyboard_arrow_left: 'chevron-left',
  keyboard_arrow_right: 'chevron-right',
  keyboard_arrow_up: 'chevron-up',
  last_page: 'chevrons-right',
  local_offer: 'tag',
  lock_outline: 'lock-keyhole',
  login: 'log-in',
  logout: 'log-out',
  menu_open: 'panel-left-close',
  more_horiz: 'ellipsis',
  more_vert: 'ellipsis-vertical',
  notifications: 'bell',
  open_in_new: 'external-link',
  person: 'user',
  print: 'printer',
  refresh: 'refresh-cw',
  remove: 'minus',
  remove_circle: 'circle-minus',
  restart_alt: 'rotate-ccw',
  share: 'share-2',
  space_dashboard: 'layout-dashboard',
  storefront: 'store',
  task_alt: 'circle-check',
  today: 'calendar',
  upload_file: 'upload',
  visibility: 'eye',
  visibility_off: 'eye-off',
  warning: 'triangle-alert',
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
  'file-down': 'file_download',
  'file-pen-line': 'edit_note',
  'file-text': 'description',
  'file-up': 'upload_file',
  'layout-dashboard': 'dashboard',
  'layout-grid': 'widgets',
  'list-indent-decrease': 'format_indent_decrease',
  'list-indent-increase': 'format_indent_increase',
  'lock-keyhole': 'lock',
  'log-in': 'login',
  'log-out': 'logout',
  'panel-left-close': 'menu_open',
  'party-popper': 'celebration',
  'refresh-cw': 'refresh',
  'rotate-ccw': 'restart_alt',
  'share-2': 'share',
  'square-pen': 'edit',
  'trash-2': 'delete',
  'triangle-alert': 'warning',
  'zoom-in': 'zoom_in',
  ban: 'block',
  contact: 'contact_page',
  copy: 'content_copy',
  download: 'file_download',
  ellipsis: 'more_horiz',
  'ellipsis-vertical': 'more_vert',
  error_outline: 'error',
  eye: 'visibility',
  'eye-off': 'visibility_off',
  file: 'insert_drive_file',
  fullscreen: 'fullscreen',
  hourglass: 'hourglass_top',
  info_outline: 'info',
  landmark: 'account_balance',
  lock_outline: 'lock',
  maximize: 'fullscreen',
  megaphone: 'campaign',
  minimize: 'fullscreen_exit',
  minus: 'remove',
  package: 'inventory_2',
  pencil: 'edit',
  plus: 'add',
  printer: 'print',
  'save-all': 'done_all',
  store: 'storefront',
  tag: 'local_offer',
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
export const SD_ICON_DEFAULT_CONFIG: SdIconResolvedConfig = {
  defaultSet: 'material-icons-outlined',
  materialFontSet: DefaultMaterialIconFontSet,
  materialAliases: SD_DEFAULT_MATERIAL_ALIASES,
  lucideAliases: SD_DEFAULT_LUCIDE_ALIASES,
  lucideConfig: {},
};
