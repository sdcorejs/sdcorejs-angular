/** Hộp duyệt mà panel chi tiết dùng để tự chọn mục kế sau khi duyệt hoặc từ chối. */
export abstract class ApprovalInbox {
  /** Mục sau `id` trong các dòng đang hiện (mục trước nếu `id` là dòng cuối); `null` khi không còn mục nào. */
  abstract nextOf(id: string): string | null;
  /** Đọc lại danh sách, giữ bộ lọc, trang và vị trí cuộn. */
  abstract refresh(): Promise<void>;
}
