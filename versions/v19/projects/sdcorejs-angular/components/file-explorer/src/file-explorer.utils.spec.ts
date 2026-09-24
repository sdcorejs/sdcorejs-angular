import type { SdFileExplorerItem } from './file-explorer.model';
import {
  sdFileExplorerErrorMessage,
  sdFileExplorerExtension,
  sdFileExplorerFileType,
  sdFileExplorerFormatDate,
  sdFileExplorerFormatDateTime,
  sdFileExplorerFormatSize,
  sdFileExplorerIconName,
  sdFileExplorerIconUrl,
  sdFileExplorerIsAbort,
  sdFileExplorerLocale,
  sdFileExplorerNormalize,
  sdFileExplorerParseDate,
  sdFileExplorerPreviewKind,
  sdFileExplorerFoldersFirst,
  sdFileExplorerSafeId,
} from './file-explorer.utils';

const file = (name: string, mimeType?: string): Pick<SdFileExplorerItem, 'kind' | 'name' | 'mimeType'> => ({
  kind: 'file',
  name,
  mimeType,
});

describe('file-explorer utils', () => {
  describe('sdFileExplorerFileType', () => {
    it('treats folders as folders regardless of name or MIME type', () => {
      expect(sdFileExplorerFileType({ kind: 'folder', name: 'report.pdf', mimeType: 'application/pdf' })).toBe('folder');
    });

    it('prefers the MIME type over the extension', () => {
      expect(sdFileExplorerFileType(file('scan.bin', 'image/png'))).toBe('image');
      expect(sdFileExplorerFileType(file('export', 'application/pdf'))).toBe('pdf');
      expect(sdFileExplorerFileType(file('a', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))).toBe('spreadsheet');
      expect(sdFileExplorerFileType(file('a', 'application/vnd.ms-excel'))).toBe('spreadsheet');
      expect(sdFileExplorerFileType(file('a', 'text/csv'))).toBe('spreadsheet');
      expect(sdFileExplorerFileType(file('a', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'))).toBe(
        'presentation'
      );
      expect(sdFileExplorerFileType(file('a', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))).toBe('document');
      expect(sdFileExplorerFileType(file('a', 'application/msword'))).toBe('document');
      expect(sdFileExplorerFileType(file('a', 'video/mp4'))).toBe('video');
      expect(sdFileExplorerFileType(file('a', 'audio/mpeg'))).toBe('audio');
      expect(sdFileExplorerFileType(file('a', 'application/zip'))).toBe('archive');
      expect(sdFileExplorerFileType(file('a', 'application/json'))).toBe('text');
      expect(sdFileExplorerFileType(file('a', 'text/plain'))).toBe('text');
    });

    it('falls back to the extension when the MIME type is missing or unknown', () => {
      expect(sdFileExplorerFileType(file('Photo.JPG'))).toBe('image');
      expect(sdFileExplorerFileType(file('guide.pdf'))).toBe('pdf');
      expect(sdFileExplorerFileType(file('plan.xlsx'))).toBe('spreadsheet');
      expect(sdFileExplorerFileType(file('deck.pptx'))).toBe('presentation');
      expect(sdFileExplorerFileType(file('memo.docx'))).toBe('document');
      expect(sdFileExplorerFileType(file('clip.webm'))).toBe('video');
      expect(sdFileExplorerFileType(file('song.flac'))).toBe('audio');
      expect(sdFileExplorerFileType(file('backup.tar'))).toBe('archive');
      expect(sdFileExplorerFileType(file('notes.md'))).toBe('text');
      expect(sdFileExplorerFileType(file('data.bin', 'application/octet-stream'))).toBe('other');
      expect(sdFileExplorerFileType(file('README'))).toBe('other');
    });
  });

  describe('sdFileExplorerIconName', () => {
    it('uses the closed / open folder icons for folders', () => {
      expect(sdFileExplorerIconName({ kind: 'folder', name: 'report.pdf' })).toBe('folder-closed');
      expect(sdFileExplorerIconName({ kind: 'folder', name: 'x' }, { open: true })).toBe('folder-open');
    });

    it('resolves extensions case-insensitively, longest compound suffix first', () => {
      expect(sdFileExplorerIconName(file('Guide.PDF'))).toBe('file-pdf');
      expect(sdFileExplorerIconName(file('plan.xlsx'))).toBe('file-spreadsheet');
      expect(sdFileExplorerIconName(file('photo.jpeg'))).toBe('file-jpg');
      expect(sdFileExplorerIconName(file('backup.tar.gz'))).toBe('file-tar');
      expect(sdFileExplorerIconName(file('types.d.ts'))).toBe('file-ts');
      expect(sdFileExplorerIconName(file('folder/sub\\main.py'))).toBe('file-python');
    });

    it('handles dot-files', () => {
      expect(sdFileExplorerIconName(file('.gitignore'))).toBe('file-code');
      expect(sdFileExplorerIconName(file('.env'))).toBe('file-code');
      expect(sdFileExplorerIconName(file('.env.production'))).toBe('file-code');
    });

    it('falls back to the MIME type (exact, then family, parameters ignored) and then to the generic icon', () => {
      expect(sdFileExplorerIconName(file('scan', 'application/pdf'))).toBe('file-pdf');
      expect(sdFileExplorerIconName(file('export', 'text/csv; charset=utf-8'))).toBe('file-csv');
      expect(sdFileExplorerIconName(file('capture', 'IMAGE/HEIC'))).toBe('file-image');
      expect(sdFileExplorerIconName(file('clip', 'video/x-unknown'))).toBe('file-video');
      expect(sdFileExplorerIconName(file('blob.bin', 'application/octet-stream'))).toBe('file-generic');
      expect(sdFileExplorerIconName(file('README'))).toBe('file-generic');
    });

    it('never returns Object.prototype members for unusual names', () => {
      expect(sdFileExplorerIconName(file('odd.constructor'))).toBe('file-generic');
      expect(sdFileExplorerIconName(file('odd.__proto__', 'toString'))).toBe('file-generic');
    });
  });

  it('builds cached data: URLs for the embedded SVG icons', () => {
    const url = sdFileExplorerIconUrl('file-pdf');
    expect(url.startsWith('data:image/svg+xml;charset=utf-8,%3Csvg')).toBeTrue();
    expect(decodeURIComponent(url)).toContain('viewBox="0 0 64 64"');
    expect(decodeURIComponent(url)).not.toContain('<title');
    expect(sdFileExplorerIconUrl('file-pdf')).toBe(url);
    expect(sdFileExplorerIconUrl('folder-open')).not.toBe(url);
  });

  it('extracts lower-cased extensions and ignores dot-files and trailing dots', () => {
    expect(sdFileExplorerExtension('Report.Final.PDF')).toBe('pdf');
    expect(sdFileExplorerExtension('.gitignore')).toBe('');
    expect(sdFileExplorerExtension('name.')).toBe('');
    expect(sdFileExplorerExtension('plain')).toBe('');
  });

  it('maps file types to preview renderers', () => {
    expect(sdFileExplorerPreviewKind('image')).toBe('image');
    expect(sdFileExplorerPreviewKind('pdf')).toBe('pdf');
    expect(sdFileExplorerPreviewKind('document')).toBe('none');
    expect(sdFileExplorerPreviewKind('folder')).toBe('none');
  });

  it('maps Core UI languages to Intl locales with a Vietnamese fallback', () => {
    expect(sdFileExplorerLocale('en')).toBe('en-US');
    expect(sdFileExplorerLocale('vi')).toBe('vi-VN');
    expect(sdFileExplorerLocale('zh')).toBe('zh-CN');
    expect(sdFileExplorerLocale('xx')).toBe('vi-VN');
  });

  describe('sdFileExplorerFormatSize', () => {
    it('keeps one decimal below 10 units and none above', () => {
      expect(sdFileExplorerFormatSize(2_516_582, 'en-US')).toBe('2.4 MB');
      expect(sdFileExplorerFormatSize(2_516_582, 'vi-VN')).toBe('2,4 MB');
      expect(sdFileExplorerFormatSize(866_304, 'en-US')).toBe('846 KB');
      expect(sdFileExplorerFormatSize(1024 * 1024, 'en-US')).toBe('1 MB');
      expect(sdFileExplorerFormatSize(5 * 1024 ** 4, 'en-US')).toBe('5 TB');
    });

    it('prints bytes below 1 KB and nothing for invalid input', () => {
      expect(sdFileExplorerFormatSize(0, 'en-US')).toBe('0 B');
      expect(sdFileExplorerFormatSize(512, 'en-US')).toBe('512 B');
      expect(sdFileExplorerFormatSize(undefined, 'en-US')).toBe('');
      expect(sdFileExplorerFormatSize(null, 'en-US')).toBe('');
      expect(sdFileExplorerFormatSize(-1, 'en-US')).toBe('');
      expect(sdFileExplorerFormatSize(Number.NaN, 'en-US')).toBe('');
    });
  });

  describe('dates', () => {
    const now = new Date(2026, 8, 24, 10, 0, 0);
    const labels = { today: 'TODAY', yesterday: 'YESTERDAY' };

    it('uses the today / yesterday labels based on local midnight', () => {
      expect(sdFileExplorerFormatDate(new Date(2026, 8, 24, 0, 1), now, 'en-US', labels)).toBe('TODAY');
      expect(sdFileExplorerFormatDate(new Date(2026, 8, 23, 23, 59), now, 'en-US', labels)).toBe('YESTERDAY');
    });

    it('shows day and month within the year and the full date otherwise', () => {
      expect(sdFileExplorerFormatDate(new Date(2026, 8, 21), now, 'vi-VN', labels)).toBe('21/09');
      expect(sdFileExplorerFormatDate(new Date(2025, 0, 5), now, 'vi-VN', labels)).toBe('05/01/2025');
    });

    it('accepts ISO strings and epoch numbers and ignores invalid values', () => {
      expect(sdFileExplorerParseDate('2026-09-21T08:00:00Z')?.getUTCDate()).toBe(21);
      expect(sdFileExplorerParseDate(0)?.getTime()).toBe(0);
      expect(sdFileExplorerParseDate('not a date')).toBeNull();
      expect(sdFileExplorerParseDate('')).toBeNull();
      expect(sdFileExplorerFormatDate(undefined, now, 'en-US', labels)).toBe('');
      expect(sdFileExplorerFormatDateTime(undefined, 'en-US')).toBe('');
    });

    it('formats a full date time for tooltips', () => {
      expect(sdFileExplorerFormatDateTime(new Date(2026, 8, 21, 14, 5), 'vi-VN')).toContain('21/09/2026');
    });
  });

  it('normalises Vietnamese accents and case for search', () => {
    expect(sdFileExplorerNormalize('  Tài Liệu Đặc biệt ')).toBe('tai lieu dac biet');
  });

  it('extracts readable error messages', () => {
    expect(sdFileExplorerErrorMessage(new Error('Quota exceeded'))).toBe('Quota exceeded');
    expect(sdFileExplorerErrorMessage('Offline')).toBe('Offline');
    expect(sdFileExplorerErrorMessage({ message: 'From API' })).toBe('From API');
    expect(sdFileExplorerErrorMessage({ status: 500 })).toBe('');
    expect(sdFileExplorerErrorMessage(null)).toBe('');
  });

  it('recognises abort errors', () => {
    expect(sdFileExplorerIsAbort(new DOMException('stop', 'AbortError'))).toBeTrue();
    expect(sdFileExplorerIsAbort(new Error('x'))).toBeFalse();
    expect(sdFileExplorerIsAbort(undefined)).toBeFalse();
  });

  it('moves folders first and otherwise keeps the callback order', () => {
    const items: SdFileExplorerItem[] = [
      { id: '1', parentId: null, name: 'z.txt', kind: 'file' },
      { id: '2', parentId: null, name: 'b', kind: 'folder' },
      { id: '3', parentId: null, name: 'a.txt', kind: 'file' },
      { id: '4', parentId: null, name: 'A', kind: 'folder' },
    ];
    expect(sdFileExplorerFoldersFirst(items).map(item => item.id)).toEqual(['2', '4', '1', '3']);
    expect(items[0].id).toBe('1');
  });

  it('builds DOM-safe ids', () => {
    expect(sdFileExplorerSafeId('a/b c:1')).toBe('a-b-c-1');
  });
});
