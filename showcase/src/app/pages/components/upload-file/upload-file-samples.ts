import { SdUploadFileDetail } from '@sdcorejs/angular/components/upload-file';

// Dữ liệu mẫu của trang Upload File (đợt 3 · 4b–4d): ảnh SVG dựng sẵn, một PDF nhỏ thật (blob) và vài tệp không xem trước
// được, để thử popup, filmstrip, zoom và các trạng thái của ô tải lên mà không cần server.

const svg = (width: number, height: number, from: string, to: string, label: string): string =>
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/>` +
      `<stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
      `<rect width="100%" height="100%" fill="url(#g)"/>` +
      `<text x="50%" y="50%" fill="#ffffff" font-family="Roboto, sans-serif" font-size="${Math.round(height / 9)}" ` +
      `text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`
  );

// why: một trang PDF tối thiểu (trình xem PDF của trình duyệt tự dựng lại bảng xref) để popup nhúng PDF thật.
const pdfUrl = (): string => {
  if (typeof URL === 'undefined' || !URL.createObjectURL) return '';
  const pdf = [
    '%PDF-1.4',
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj',
    '4 0 obj<</Length 52>>stream',
    'BT /F1 28 Tf 72 760 Td (Hop dong mau HD-2026-118) Tj ET',
    'endstream endobj',
    '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj',
    'trailer<</Root 1 0 R>>',
    '%%EOF',
  ].join('\n');
  return URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
};

let samples: Record<string, SdUploadFileDetail> | undefined;

/** Chi tiết mẫu theo id (dựng một lần, PDF là blob URL sống suốt trang). */
export const uploadSamples = (): Record<string, SdUploadFileDetail> =>
  (samples ??= {
    'img-hien-truong-1': {
      idOrKey: 'img-hien-truong-1',
      cdn: svg(1600, 1000, '#1e6b3a', '#81c995', 'Hiện trường 1'),
      name: 'hien-truong-1.jpg',
      extension: 'jpg',
      size: 1.8 * 1024 * 1024,
    },
    'img-hien-truong-2': {
      idOrKey: 'img-hien-truong-2',
      cdn: svg(900, 1200, '#004a99', '#8ab4f8', 'Hiện trường 2'),
      name: 'hien-truong-2.jpg',
      extension: 'jpg',
      size: 920 * 1024,
    },
    'img-bien-ban': {
      idOrKey: 'img-bien-ban',
      cdn: svg(1200, 800, '#8a5300', '#ffb95c', 'Biên bản'),
      name: 'bien-ban-ban-giao.png',
      extension: 'png',
      size: 2.4 * 1024 * 1024,
    },
    'img-mat-truoc': {
      idOrKey: 'img-mat-truoc',
      cdn: svg(1000, 640, '#5b2a86', '#c58af9', 'CCCD mặt trước'),
      name: 'cccd-mat-truoc.jpg',
      extension: 'jpg',
      size: 640 * 1024,
    },
    'doc-hop-dong': { idOrKey: 'doc-hop-dong', cdn: pdfUrl(), name: 'hop-dong-HD-2026-118.pdf', extension: 'pdf', size: 3.1 * 1024 * 1024 },
    'doc-bang-ke': { idOrKey: 'doc-bang-ke', cdn: '', name: 'bang-ke-chi-phi-quy-3.xlsx', extension: 'xlsx', size: 640 * 1024 },
    'doc-phu-luc': { idOrKey: 'doc-phu-luc', cdn: '', name: 'phu-luc-01.docx', extension: 'docx', size: 85 * 1024 },
    'doc-ho-so': { idOrKey: 'doc-ho-so', cdn: '', name: 'ho-so-nang-luc.zip', extension: 'zip', size: 12.6 * 1024 * 1024 },
  });

/** Mô phỏng server lưu file vừa tải lên: `details` trả được chi tiết của id mới (ảnh / PDF xem qua object URL). */
export const registerUploadedSample = (id: string, file: File): void => {
  const dot = file.name.lastIndexOf('.');
  uploadSamples()[id] = {
    idOrKey: id,
    cdn: typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(file) : '',
    name: file.name,
    extension: dot > 0 ? file.name.slice(dot + 1).toLowerCase() : undefined,
    size: file.size,
  };
};

export const uploadSampleDetails = async (ids: (string | number)[]): Promise<SdUploadFileDetail[]> =>
  ids.map(id => uploadSamples()[String(id)]).filter((detail): detail is SdUploadFileDetail => !!detail);
