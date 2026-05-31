export interface SdTableOptionTree<T = any> {
  /** Key trên object row chứa mảng children. Mặc định: 'children' */
  childrenKey?: string;
  /** Giới hạn độ sâu cây. undefined = không giới hạn. */
  maxDepth?: number;
  /** false | true | number (mở tới cấp N) */
  defaultExpanded?: boolean | number;
  /** Lazy load khi row chưa có children embedded */
  onExpandChildren?: (rowData: T) => Promise<T[]> | T[];
  /** Pixel indent mỗi cấp. Mặc định: 20 */
  indentSize?: number;
}
