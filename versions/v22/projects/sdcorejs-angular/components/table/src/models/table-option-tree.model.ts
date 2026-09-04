import { NestedKeyOf } from '@sdcorejs/utils/models';

/**
 * Cấu hình tree-rows cho `<sd-table>` — render dòng con inline dưới dòng cha
 * kèm expand/collapse.
 *
 * Đây là discriminated union theo `loadType`:
 * - `'static'` ({@link TableOptionTreeStatic}) — children đã nằm sẵn trong data
 *   (embedded array tại `childrenKey`). Không gọi API khi bung.
 * - `'lazy'`  ({@link TableOptionTreeLazy})  — children nạp theo yêu cầu qua
 *   `onExpandChildren` khi người dùng bung dòng lần đầu.
 *
 * `loadType` là discriminant: TypeScript dựa vào nó để narrow union (vd chỉ
 * `static` mới có `childrenKey`/`defaultExpanded`, chỉ `lazy` mới có
 * `onExpandChildren`). Dùng type-guard `isLazyTree()` trong `tree.util.ts` để
 * narrow an toàn thay vì truy cập field trực tiếp trên union.
 *
 * @example Static (children embedded)
 * ```ts
 * tree: { loadType: 'static', childrenKey: 'children', defaultExpanded: 1 }
 * ```
 * @example Lazy (nạp theo yêu cầu)
 * ```ts
 * tree: { loadType: 'lazy', onExpandChildren: row => api.getChildren(row.id) }
 * ```
 */
export type SdTableOptionTree<T = any> = TableOptionTreeStatic<T> | TableOptionTreeLazy<T>;

/**
 * Tree với dữ liệu children **embedded** sẵn trong mỗi row.
 *
 * Table đọc mảng con tại `childrenKey` ngay trên object data; không có lời gọi
 * bất đồng bộ nào khi bung dòng. Đây cũng là chế độ hỗ trợ **search ở cấp con**
 * cho table `type: 'local'` (xem `tree.util.ts#subtreeMatches` /
 * `filterMatchingChildren`): khi lọc, một nhánh được giữ lại nếu chính nó hoặc
 * bất kỳ hậu duệ nào khớp từ khoá, và nhánh khớp sẽ tự bung.
 */
export interface TableOptionTreeStatic<T = any> {
  /** Chế độ nạp children: dữ liệu đã embedded sẵn trong row. */
  loadType: 'static';
  /**
   * Key trên object row chứa mảng children.
   * Mặc định: `'children'`.
   */
  childrenKey?: NestedKeyOf<T> | 'children';
  /**
   * Giới hạn độ sâu cây (level gốc = 0).
   * `undefined` = không giới hạn.
   */
  maxDepth?: number;
  /**
   * Trạng thái bung mặc định khi load:
   * - `false` — thu gọn hết (mặc định)
   * - `true`  — bung toàn bộ
   * - `number N` — bung tới cấp `N` (row có `level < N` được bung)
   */
  defaultExpanded?: boolean | number;
  /**
   * Số pixel thụt lề (indent) cho mỗi cấp sâu.
   * Mặc định: `20`.
   */
  indentSize?: number;
}

/**
 * Tree với children **nạp lười (lazy)** theo yêu cầu.
 *
 * Khi người dùng bung một dòng lần đầu mà dòng đó chưa có children embedded,
 * table gọi `onExpandChildren(row)` để nạp; kết quả được cache lại trên row
 * (ghi vào key `'children'`) nên các lần bung sau không gọi lại.
 *
 * Lazy tree **không hỗ trợ** `childrenKey` tuỳ biến (luôn dùng `'children'` làm
 * nơi lưu kết quả) và **không hỗ trợ** `defaultExpanded` (không thể bung mặc
 * định nhánh chưa nạp).
 */
export interface TableOptionTreeLazy<T = any> {
  /** Chế độ nạp children: nạp lười theo yêu cầu khi bung. */
  loadType: 'lazy';
  /**
   * Giới hạn độ sâu cây (level gốc = 0).
   * `undefined` = không giới hạn.
   */
  maxDepth?: number;
  /**
   * Hàm nạp children khi bung dòng chưa có children embedded.
   * Trả về `Promise<T[]>`; kết quả được ghi vào key `'children'` của row data
   * và cache cho các lần bung sau.
   */
  onExpandChildren: (rowData: T) => Promise<T[]>;
  /**
   * Xác định một row có con hay không — để quyết định có hiển thị icon expand.
   * - Không truyền: MỌI lazy node đều hiện icon expand (không biết trước được).
   * - Truyền: chỉ hiện icon khi trả `true`; trả `false` ⇒ row là lá (ẩn icon,
   *   không gọi `onExpandChildren`).
   * Lưu ý: nếu row đã có children embedded sẵn thì luôn coi là có con (bỏ qua hàm này).
   */
  hasChildren?: (rowData: T) => boolean;
  /**
   * Số pixel thụt lề (indent) cho mỗi cấp sâu.
   * Mặc định: `20`.
   */
  indentSize?: number;
}
