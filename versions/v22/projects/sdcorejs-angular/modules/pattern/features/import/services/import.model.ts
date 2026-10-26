/** Field của sản phẩm nhận dữ liệu nhập. */
export type ImportField = 'code' | 'name' | 'unit' | 'price';

export const IMPORT_FIELDS: readonly {
  readonly field: ImportField;
  readonly label: string;
  readonly required: boolean;
  readonly aliases: readonly string[];
}[] = [
  { field: 'code', label: 'Mã sản phẩm', required: true, aliases: ['mã', 'ma', 'code', 'mã sản phẩm', 'ma san pham'] },
  { field: 'name', label: 'Tên sản phẩm', required: true, aliases: ['tên', 'ten', 'name', 'tên sản phẩm', 'ten san pham'] },
  { field: 'unit', label: 'Đơn vị tính', required: false, aliases: ['đơn vị', 'don vi', 'đvt', 'unit', 'đơn vị tính'] },
  { field: 'price', label: 'Giá bán', required: false, aliases: ['giá', 'gia', 'giá bán', 'gia ban', 'price'] },
];

/** Cột của nguồn được chọn cho từng field; `null` là bỏ qua field đó. */
export type ImportMapping = Record<ImportField, string | null>;

/** Bảng đọc từ nguồn: tên cột và các dòng (giá trị theo tên cột). */
export interface ImportSource {
  readonly columns: readonly string[];
  readonly rows: readonly Readonly<Record<string, string>>[];
}

/** Kết quả xem trước của một dòng. */
export interface ImportPreviewRowDto {
  readonly index: number;
  readonly code: string;
  readonly name: string;
  readonly unit: string;
  readonly price: number;
  readonly result: 'new' | 'duplicate' | 'invalid';
  readonly message?: string;
}

/** Xử lý dòng trùng mã sản phẩm đã có. */
export type ImportDuplicatePolicy = 'skip' | 'overwrite';

export interface ImportCommitRes {
  readonly created: number;
  readonly updated: number;
  readonly skipped: number;
}

/** Dữ liệu mẫu cho bước Nguồn dữ liệu: có dòng mới, dòng trùng mã và dòng lỗi. */
export const IMPORT_SAMPLE = [
  'Mã,Tên sản phẩm,Đơn vị,Giá bán',
  'SP-001,Nước suối 500ml (mẫu mới),Chai,6000',
  'SP-901,Sữa hạt óc chó 1L,Hộp,52000',
  'SP-902,Bánh quy yến mạch,Gói,28000',
  ',Sản phẩm thiếu mã,Cái,1000',
  'SP-903,Kẹo bạc hà,Gói,abc',
  'SP-904,Nước tăng lực 250ml,Lon,12000',
].join('\n');

/** Đọc CSV (dấu phẩy hoặc chấm phẩy) có dòng tiêu đề. */
export function parseCsv(text: string): ImportSource {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  if (lines.length < 2) return { columns: [], rows: [] };
  const separator = lines[0].includes(';') ? ';' : ',';
  const split = (line: string) => line.split(separator).map(cell => cell.trim().replace(/^"(.*)"$/, '$1'));
  const columns = split(lines[0]);
  const rows = lines.slice(1).map(line => {
    const cells = split(line);
    return Object.fromEntries(columns.map((column, index) => [column, cells[index] ?? '']));
  });
  return { columns, rows };
}

/** Ánh xạ tự động theo tên cột. */
export function guessMapping(columns: readonly string[]): ImportMapping {
  const normalized = columns.map(column => column.trim().toLowerCase());
  const mapping = {} as ImportMapping;
  for (const { field, aliases } of IMPORT_FIELDS) {
    const index = normalized.findIndex(column => aliases.includes(column));
    mapping[field] = index >= 0 ? columns[index] : null;
  }
  return mapping;
}
