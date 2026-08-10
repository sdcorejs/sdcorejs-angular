import { EditorConfig, MentionFeed, MentionFeedObjectItem } from 'ckeditor5';

export type { MentionFeedObjectItem };

export type SdMiniEditorOutputFormat = 'html' | 'markdown';

export interface SdMiniEditorMentionConfig {
  /** Feed data cho mention - có thể là array hoặc function trả về Promise
   * CKEditor MentionFeed đã hỗ trợ: marker, minChars, dropdownLimit, itemRenderer
   */
  feeds?: MentionFeed[];
  /** Custom render function cho giá trị mention khi chèn vào editor
   * Trả về object với text và các attributes tùy chỉnh
   */
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

export type SdMiniEditorConfig = EditorConfig & {
  getOption?: () => SdMiniEditorOption;
};
