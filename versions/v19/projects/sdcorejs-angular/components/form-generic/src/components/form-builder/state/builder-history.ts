import type { BuilderDocument } from './builder-document';

export interface HistoryRecordOptions {
  /**
   * Gộp các lần sửa liên tiếp cùng khoá (vd gõ nhãn của một field) thành MỘT bước undo, miễn là
   * cách nhau không quá `coalesceMs` và không có thao tác khác xen giữa.
   */
  readonly coalesceKey?: string | null;
  /** Thời điểm (ms) — cho phép test điều khiển thời gian. */
  readonly now?: number;
}

/**
 * Lịch sử undo/redo của MỘT builder. Lưu tham chiếu tới các tài liệu bất biến (chia sẻ cấu trúc),
 * không deep-clone toàn form. Giới hạn số bước để bộ nhớ không tăng vô hạn.
 */
export class BuilderHistory {
  #past: BuilderDocument[] = [];
  #future: BuilderDocument[] = [];
  #lastKey: string | null = null;
  #lastTime = 0;

  constructor(
    readonly limit = 100,
    readonly coalesceMs = 1200
  ) {}

  get canUndo(): boolean {
    return this.#past.length > 0;
  }

  get canRedo(): boolean {
    return this.#future.length > 0;
  }

  get size(): { past: number; future: number } {
    return { past: this.#past.length, future: this.#future.length };
  }

  /** Ghi nhận `before` (trạng thái TRƯỚC khi áp thay đổi mới). Trả `true` nếu tạo bước mới. */
  record(before: BuilderDocument, options: HistoryRecordOptions = {}): boolean {
    const now = options.now ?? Date.now();
    const key = options.coalesceKey ?? null;
    const coalesce = key !== null && key === this.#lastKey && now - this.#lastTime <= this.coalesceMs && this.#past.length > 0;
    this.#future = [];
    this.#lastTime = now;
    if (coalesce) return false;
    this.#lastKey = key;
    this.#past.push(before);
    if (this.#past.length > this.limit) this.#past.splice(0, this.#past.length - this.limit);
    return true;
  }

  /** Kết thúc phiên gộp hiện tại (vd rời ô nhập, đổi selection). */
  seal(): void {
    this.#lastKey = null;
  }

  undo(current: BuilderDocument): BuilderDocument | null {
    const previous = this.#past.pop();
    if (!previous) return null;
    this.#future.push(current);
    this.seal();
    return previous;
  }

  redo(current: BuilderDocument): BuilderDocument | null {
    const next = this.#future.pop();
    if (!next) return null;
    this.#past.push(current);
    this.seal();
    return next;
  }

  clear(): void {
    this.#past = [];
    this.#future = [];
    this.seal();
  }
}
