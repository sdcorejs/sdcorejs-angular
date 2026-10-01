import type { SdFormGenericField, SdFormGenericHtml, SdFormGenericOption } from './form-generic-field.model';

/** Mục trả về từ catalog; `data` là dữ liệu thêm để `fill` đọc (`item.data[from]`). */
export interface SdFormGenericCatalogItem<TData extends Record<string, unknown> = Record<string, unknown>> extends SdFormGenericOption {
  data?: TData;
}

/** Ngữ cảnh truyền cho callback của portal. Chỉ đọc. */
export interface SdFormGenericCatalogContext {
  field: SdFormGenericField;
  value: Readonly<Record<string, unknown>>;
  variables: Readonly<Record<string, unknown>>;
}

/** Nguồn dữ liệu lựa chọn do portal đăng ký. Component không tự gọi HTTP. */
export interface SdFormGenericCatalog {
  id: string;
  label: string;
  /** Tham số catalog nhận; builder dùng để dựng editor `options.params`. */
  params?: { name: string; label: string; required?: boolean }[];
  /** Thuộc tính trong `item.data` mà `options.fill` có thể đọc. */
  fields?: { name: string; label: string }[];
  load: (params: Record<string, unknown>, context: SdFormGenericCatalogContext) => Promise<SdFormGenericCatalogItem[]>;
  /** Có thì select tìm theo từ khoá thay vì tải toàn bộ. */
  search?: (term: string, params: Record<string, unknown>, context: SdFormGenericCatalogContext) => Promise<SdFormGenericCatalogItem[]>;
  /** Có thì dùng để lấy nhãn của giá trị đã chọn ở chế độ chỉ xem / viewEntities thay vì `load`. */
  labels?: (values: string[], params: Record<string, unknown>) => Promise<SdFormGenericOption[]>;
}

/** Mẫu field chọn nhanh trong builder. */
export interface SdFormGenericTemplate {
  id: string;
  label: string;
  field: Exclude<SdFormGenericField, SdFormGenericHtml>;
}

interface SdFormGenericHtmlDefinitionBase {
  id: string;
  label: string;
  /** Biến thay vào `${key}` của nội dung (nhập ở builder). */
  variables?: { key: string; label: string; value?: string }[];
}

export interface SdFormGenericHtmlStaticDefinition extends SdFormGenericHtmlDefinitionBase {
  type: 'static';
  content: string;
}

export interface SdFormGenericHtmlQueryDefinition extends SdFormGenericHtmlDefinitionBase {
  type: 'query';
  /** Tham số mà `content` nhận; field html gán giá trị qua `query`. */
  params: { name: string; label: string }[];
  content: (params: Record<string, unknown>) => Promise<string>;
}

export type SdFormGenericHtmlDefinition = SdFormGenericHtmlStaticDefinition | SdFormGenericHtmlQueryDefinition;

/** Validator hàm dùng cho validation cấp form `{ type: 'function', validator: id }`. */
export interface SdFormGenericValidator {
  id: string;
  label: string;
  /** Trả message (có thể là HTML) khi lỗi; `null`/`undefined`/`''` khi hợp lệ. */
  validate: (value: Readonly<Record<string, unknown>>) => Promise<string | null | undefined> | string | null | undefined;
}

type SdFormGenericMaybeAsyncList<T> = T[] | (() => T[] | Promise<T[]>);

/** Cấu hình của portal cho `provideSdFormGeneric`. */
export interface SdFormGenericConfig {
  catalogs?: SdFormGenericCatalog[];
  templates?: SdFormGenericTemplate[];
  htmlDefinitions?: SdFormGenericMaybeAsyncList<SdFormGenericHtmlDefinition>;
  validators?: SdFormGenericValidator[];
  /** Ghi đè từng phần `SD_FORM_GENERIC_BREAKPOINTS` (px, bề rộng form). */
  breakpoints?: { tablet?: number; desktop?: number };
}
