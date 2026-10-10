import type { Color, Filter } from '@sdcorejs/utils/models';
import type { SdFormGenericField } from './form-generic-field.model';

/**
 * Schema form generic — phiên bản đầu tiên, JSON do consumer lưu trữ.
 *
 * Ngữ pháp cố định: Form → pages → (group | element); group chỉ chứa element, không lồng group.
 * Form một trang vẫn lưu `pages: [ … ]` với một phần tử.
 */
export interface SdFormGenericSchema {
  pages: SdFormGenericPage[];
  /** Tabs or steps across visible pages. Absent preserves first-page rendering. */
  navigation?: SdFormGenericNavigation;
  /** Biến do consumer cấp qua `[variables]`; dùng chung không gian key với field. */
  variables?: SdFormGenericVariable[];
  /** Validation cấp form, chạy trong `validate()`. */
  validations?: SdFormGenericValidation[];
}

/** Steps default to `linear: false`; linear forward navigation validates visible predecessor fields. */
export type SdFormGenericNavigation = { type: 'tabs' } | { type: 'steps'; linear?: boolean };

/** Điều kiện ẩn/hiện của trang hoặc group. */
export interface SdFormGenericVisibilityRules {
  visible?: Filter;
  hidden?: Filter;
}

export interface SdFormGenericPage {
  id: string;
  label?: string;
  icon?: string;
  rules?: SdFormGenericVisibilityRules;
  elements: SdFormGenericPageElement[];
}

export type SdFormGenericPageElement = SdFormGenericGroup | SdFormGenericElement;

/** Group luôn chiếm trọn một hàng và chỉ chứa element (không lồng group). */
export interface SdFormGenericGroup {
  id: string;
  type: 'group';
  label: string;
  icon?: string;
  color?: Color;
  collapsible?: boolean;
  hidden?: boolean;
  rules?: SdFormGenericVisibilityRules;
  elements: SdFormGenericElement[];
}

/**
 * Phần tử đặt trên lưới. Các đợt sau THÊM thành viên vào union (static, button, table) mà không đổi
 * shape thành viên cũ; renderer bỏ qua type chưa biết, builder giữ nguyên khi phát lại.
 */
export type SdFormGenericElement = SdFormGenericField;

export interface SdFormGenericVariable {
  key: string;
  label: string;
}

export type SdFormGenericAlert = 'error' | 'warning';

export interface SdFormGenericFilterValidation {
  type: 'filter';
  /** Filter đúng thì hiện `message`. */
  filter: Filter;
  message: string;
  alert: SdFormGenericAlert;
}

export interface SdFormGenericFunctionValidation {
  type: 'function';
  /** Id của validator đăng ký trong `provideSdFormGeneric({ validators })`. */
  validator: string;
  alert: SdFormGenericAlert;
}

export type SdFormGenericValidation = SdFormGenericFilterValidation | SdFormGenericFunctionValidation;
