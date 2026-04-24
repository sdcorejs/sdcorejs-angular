import { ModelRange } from 'ckeditor5';

/**
 * Comment status based on text changes
 */
export type CkCommentStatus = 'normal' | 'modified' | 'broken';

/**
 * Color configuration for comment markers
 */
export interface CkCommentColors {
  marker?: string; // Màu nền của marker thường (normal)
  markerSelected?: string; // Màu nền khi được chọn
  markerPending?: string; // Màu nền của pending marker
  markerModified?: string; // Màu nền khi text bị thay đổi
  markerBroken?: string; // Màu nền khi marker bị hỏng
}

/**
 * Comment data structure for CkCommentPlugin
 */
export interface CkComment<T = any> {
  id: string | number;
  startPath: number[];
  endPath: number[];
  originalText: string;
  currentText: string;
  status: CkCommentStatus;
  data?: T;
}

/**
 * Config for CkCommentPlugin
 */
export interface CkCommentConfig {
  onPendingComment?: (comment: CkComment) => void; // Callback khi click nút "Thêm góp ý"
  onAddComment?: (comment: CkComment) => void; // Callback khi comment được thêm thực sự
  onSelectComment?: (id: string | number) => void; // Callback khi chọn comment
  onRemoveComment?: (id: string | number) => void; // Callback khi xóa comment
  onChange?: (comments: CkComment[]) => void; // Callback khi danh sách comments thay đổi
  onCancelPending?: () => void; // Callback khi pending selection bị hủy
  onError?: (error: { code: string; message: string; data?: any }) => void; // Callback khi có lỗi
  searchRange?: number; // Số node tìm kiếm xung quanh path gốc (mặc định: 5)
  debug?: boolean; // Bật debug logging (mặc định: false)
  colors?: CkCommentColors; // Cấu hình màu sắc cho markers
  maxTextLength?: number; // Độ dài text tối đa để tạo marker (mặc định: 1000)
  allowCreating?: boolean; // Cho phép tạo comment mới khi bôi đen text (mặc định: true)
}

/**
 * Data returned when user selects text for comment
 */
export interface CkCommentSelection {
  range: ModelRange;
  startPath: number[];
  endPath: number[];
  text: string;
}
