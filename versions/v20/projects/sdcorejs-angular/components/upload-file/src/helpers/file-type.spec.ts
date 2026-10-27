import {
  SD_FILE_TYPE_ICONS,
  sdFileExtension,
  sdFileMeta,
  sdFileTypeGroup,
  sdFileTypeIcon,
  sdFileTypeSymbol,
  sdFormatFileSize,
} from './file-type';

// Đợt 3 · 4a (design handoff `upload-file.md`, mục H1): icon theo đuôi file và dung lượng.
describe('upload-file helpers (wave 3 · 4a)', () => {
  describe('sdFileTypeIcon', () => {
    it('maps an extension with an SVG to itself, case and leading dot aside', () => {
      expect(sdFileTypeIcon('pdf')).toBe('pdf');
      expect(sdFileTypeIcon('.DOCX')).toBe('docx');
      expect(sdFileTypeIcon('Xlsx')).toBe('xlsx');
    });

    // why: bảng cũ map ppt/pptx sang icon xls/xlsx.
    it('gives ppt and pptx their own icons', () => {
      expect(sdFileTypeIcon('ppt')).toBe('ppt');
      expect(sdFileTypeIcon('pptx')).toBe('pptx');
    });

    it('maps spelling variants to the icon of their type', () => {
      expect(sdFileTypeIcon('jpeg')).toBe('jpg');
      expect(sdFileTypeIcon('tif')).toBe('tiff');
      expect(sdFileTypeIcon('htm')).toBe('html');
    });

    it('falls back to the generic file icon', () => {
      expect(sdFileTypeIcon('heic')).toBe('file');
      expect(sdFileTypeIcon('')).toBe('file');
      expect(sdFileTypeIcon(undefined)).toBe('file');
      expect(sdFileTypeIcon(null)).toBe('file');
    });

    it('covers the 51 SVGs of the set, each once, including the fallback', () => {
      expect(SD_FILE_TYPE_ICONS.length).toBe(51);
      expect(new Set(SD_FILE_TYPE_ICONS).size).toBe(SD_FILE_TYPE_ICONS.length);
      expect(SD_FILE_TYPE_ICONS).toContain('file');
    });
  });

  describe('sdFileExtension', () => {
    it('reads the extension of a name or URL, without query or fragment', () => {
      expect(sdFileExtension('Hop dong.PDF')).toBe('pdf');
      expect(sdFileExtension('https://cdn.example.com/a/b/photo.jpeg?w=200#x')).toBe('jpeg');
      expect(sdFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('returns undefined without an extension', () => {
      expect(sdFileExtension('README')).toBeUndefined();
      expect(sdFileExtension('.env')).toBeUndefined();
      expect(sdFileExtension('https://cdn.example.com/v1.2/file')).toBeUndefined();
      expect(sdFileExtension(undefined)).toBeUndefined();
    });
  });

  describe('sdFileTypeGroup / sdFileTypeSymbol', () => {
    it('groups PDF, Word and Excel for the filmstrip colours', () => {
      expect(sdFileTypeGroup('PDF')).toBe('pdf');
      expect(sdFileTypeGroup('docx')).toBe('word');
      expect(sdFileTypeGroup('csv')).toBe('excel');
      expect(sdFileTypeGroup('zip')).toBe('archive');
      expect(sdFileTypeGroup('xyz')).toBe('other');
      expect(sdFileTypeGroup(undefined)).toBe('other');
    });

    it('picks a one-colour Material icon per group', () => {
      expect(sdFileTypeSymbol('pdf')).toBe('picture_as_pdf');
      expect(sdFileTypeSymbol('doc')).toBe('description');
      expect(sdFileTypeSymbol('xlsx')).toBe('table_chart');
      expect(sdFileTypeSymbol('zip')).toBe('folder_zip');
      expect(sdFileTypeSymbol('png')).toBe('image');
      expect(sdFileTypeSymbol('bin')).toBe('draft');
    });
  });

  describe('sdFormatFileSize', () => {
    it('shows whole kilobytes, rounded up, at least 1 KB, below 1 MB', () => {
      expect(sdFormatFileSize(1, 'vi-VN')).toBe('1 KB');
      expect(sdFormatFileSize(1024, 'vi-VN')).toBe('1 KB');
      expect(sdFormatFileSize(1025, 'vi-VN')).toBe('2 KB');
      expect(sdFormatFileSize(640 * 1024, 'vi-VN')).toBe('640 KB');
    });

    it('shows megabytes with one decimal from 1 MB, in the number format of the locale', () => {
      expect(sdFormatFileSize(1024 * 1024, 'vi-VN')).toBe('1,0 MB');
      expect(sdFormatFileSize(2.4 * 1024 * 1024, 'vi-VN')).toBe('2,4 MB');
      expect(sdFormatFileSize(2.4 * 1024 * 1024, 'en-US')).toBe('2.4 MB');
      expect(sdFormatFileSize(1536 * 1024 * 1024, 'en-US')).toBe('1,536.0 MB');
    });

    it('is empty without a positive size', () => {
      expect(sdFormatFileSize(0)).toBe('');
      expect(sdFormatFileSize(-5)).toBe('');
      expect(sdFormatFileSize(Number.NaN)).toBe('');
      expect(sdFormatFileSize(undefined)).toBe('');
      expect(sdFormatFileSize(null)).toBe('');
    });
  });

  describe('sdFileMeta', () => {
    it('joins the upper-case extension and the size with a middle dot', () => {
      expect(sdFileMeta('jpg', 1.8 * 1024 * 1024, 'vi-VN')).toBe('JPG · 1,8 MB');
      expect(sdFileMeta('.docx', 640 * 1024, 'vi-VN')).toBe('DOCX · 640 KB');
    });

    it('leaves out the part it does not have', () => {
      expect(sdFileMeta('pdf', undefined)).toBe('PDF');
      expect(sdFileMeta(undefined, 2048, 'vi-VN')).toBe('2 KB');
      expect(sdFileMeta(undefined, undefined)).toBe('');
    });
  });
});
