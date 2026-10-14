import { SdEditorEngineOptions, SdEditorMentionFeed, SdEditorMentionItem } from '@sdcorejs/angular/components/editor-engine';
export type { SdEditorImportDiagnostic, SdEditorMentionFeed, SdEditorMentionItem } from '@sdcorejs/angular/components/editor-engine';
/** @deprecated Use SdEditorMentionItem. CK DOM renderers are unsupported. */
export type MentionFeedObjectItem = SdEditorMentionItem;

export type SdMiniEditorOutputFormat = 'html' | 'markdown';

export interface SdMiniEditorMentionConfig {
  /** Library-owned feed arrays/functions. CK itemRenderer is unsupported and diagnosed. */
  feeds?: SdEditorMentionFeed[];
  /** Custom render function cho giá trị mention khi chèn vào editor
   * Trả về object với text và các attributes tùy chỉnh
   */
  /** @deprecated This previously unused callback has no rendering behavior. */
  valueRender?: (item: MentionFeedObjectItem) => {
    text: string;
    attributes?: Record<string, string>;
  };
}

export type SdMiniEditorMentionItem<T = unknown> = MentionFeedObjectItem & {
  data?: T;
};

export interface SdMiniEditorOption {
  /** Output format: 'html' hoặc 'markdown' (mặc định: 'html') */
  outputFormat?: SdMiniEditorOutputFormat;
  /** Placeholder text */
  placeholder?: string;
  /** Chiều cao editor (mặc định: auto) */
  height?: string;
  /** Chiều cao tối đa của editor (ví dụ: '300px') */
  maxHeight?: string;
  /** Bật/tắt mention plugin */
  enableMention?: boolean;
  /** Cấu hình mention */
  mentionConfig?: SdMiniEditorMentionConfig;
  /** Callback khi nội dung thay đổi */
  onChange?: (content: string) => void;
  /** Callback khi blur */
  onBlur?: (event: FocusEvent) => void;
  /** Callback khi focus */
  onFocus?: (event: FocusEvent) => void;
  /** Callback khi mention được chọn */
  onMentionSelect?: (item: SdMiniEditorMentionItem) => void;
}

/** @deprecated Use component options. CK plugins/config/licenseKey are unsupported. */
export type SdMiniEditorConfig = SdEditorEngineOptions;
