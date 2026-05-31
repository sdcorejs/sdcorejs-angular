import { EditorConfig, EventInfo, ModelDocumentSelection, ViewDataTransfer } from 'ckeditor5';
import { I18nParams } from '@sdcorejs/angular/i18n';
import { CkCommentConfig } from './plugins/ck-comment/ck-comment.plugin.model';

/** Plain translator cho CKEditor plugin — tránh truyền thẳng I18nService (private fields mất `this` qua config). */
export interface DocumentBuilderI18n {
  t(key: string, params?: I18nParams): string;
}

export type DocumentBuilderOption = EditorConfig & {
  getOption?: () => SdDocumentBuilderOption;
  _i18n?: DocumentBuilderI18n;
};

export interface SdDocumentBuilderOption {
  onDropVariable?: (variable: SdDocumentBuilderVariable) => boolean | Promise<boolean | SdDocumentBuilderVariable>; // Callback khi thả variable vào editor (fires TRƯỚC khi insert — dùng để validate/transform)
  onAfterDropVariable?: (variable: SdDocumentBuilderVariable) => void; // Callback sau khi variable đã thực sự được insert vào model (dùng để refresh danh sách, gọi variable.all())
  onPasteVariable?: (display: string) => SdDocumentBuilderVariable | null | Promise<SdDocumentBuilderVariable | null>; // Callback tra cứu variable thực khi paste {{display}}
  comment?: CkCommentConfig; // Cấu hình comment
  onSelection?: (selection: ModelDocumentSelection, $event: EventInfo<string, unknown>) => void;
  onOrientation?: (orientation: 'PORTRAIT' | 'LANDSCAPE') => void; // Callback khi orientation thay đổi
  onPaste?: (data: SdPasteEventData) => void | Promise<void>; // Callback khi paste từ external sources
  orientation?: 'PORTRAIT' | 'LANDSCAPE'; // Orientation hiện tại
}

// 1. Interface cho Biến (Variable)
export interface SdDocumentBuilderVariable<T = any> {
  id: string;
  uuid?: string; // Mã này FE tự sinh sau khi biến được drop
  value: string; // Giá trị render ra (ví dụ: {{full_name}})
  display: string;
  bindingValue?: string; // Giá trị runtime đã binding (undefined = chưa bind)
  data?: T;
}

// 2. Interface cho Heading
export interface SdDocumentBuilderHeading {
  id: string; // ID định danh (do ta tự sinh ra lúc runtime để làm key scroll)
  text: string; // Nội dung tiêu đề
  level: number; // Cấp độ: 1 (H1), 2 (H2), 3 (H3)...
  type: string; // 'heading1', 'heading2'...
}

// 3. Interface cho Paste Event
export interface SdPasteEventData {
  html?: string; // HTML content từ clipboard
  text: string; // Plain text content
  source: 'word' | 'excel' | 'google-docs' | 'web' | 'unknown'; // Nguồn paste được detect
  dataTransfer: ViewDataTransfer; // ViewDataTransfer object từ CKEditor
}
