/** Vietnamese person names shared by the seeds, so an order's customer is a customer of the customer seed. */
export const PERSON_NAMES = [
  'Nguyễn An',
  'Trần Bình',
  'Lê Chi',
  'Phạm Dũng',
  'Hoàng Giang',
  'Vũ Hà',
  'Đặng Khoa',
  'Bùi Lan',
  'Đỗ Minh',
  'Hồ Ngọc',
  'Ngô Phúc',
  'Dương Quân',
  'Lý Sơn',
  'Mai Thảo',
  'Trịnh Uyên',
  'Phan Vy',
] as const;

export const COMPANY_NAMES = [
  'Công ty TNHH Minh Phát',
  'Công ty CP Thực phẩm Sao Việt',
  'Công ty TNHH Bình Minh',
  'Siêu thị Hoà Bình',
  'Công ty CP Phân phối Đông Á',
  'Công ty TNHH An Khang',
  'Chuỗi cửa hàng Tiện Lợi 24h',
  'Công ty CP Thương mại Hưng Thịnh',
] as const;

/** `nguyen.an` from `Nguyễn An`: lowercase ASCII for sample e-mails. */
export function slug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '');
}
