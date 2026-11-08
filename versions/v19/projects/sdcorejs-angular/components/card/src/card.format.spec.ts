import { sdCardFileInfo, sdCardFormatNumber, sdCardStatDelta, sdCardStatValue } from './card.format';

const vi = { locale: 'vi-VN' };
const en = { locale: 'en-US' };
const plain = (value: string): string => value.replace(/[\u00a0\u202f]/g, ' ');

describe('card format helpers', () => {
  it('formats compact numbers per locale and honours compactDisplay', () => {
    expect(plain(sdCardFormatNumber(1_820_000_000, 'compact', undefined, vi))).toBe('1,82 tỷ');
    expect(sdCardFormatNumber(1_820_000_000, 'compact', undefined, en)).toBe('1.82B');
    expect(sdCardFormatNumber(86_400_000, 'compact', undefined, { locale: 'vi-VN', compactDisplay: 'short' })).not.toContain('triệu');
  });

  it('keeps string values and flags a format mismatch', () => {
    expect(sdCardStatValue({ label: 'x', value: 'N/A' }, vi)).toEqual({ display: 'N/A', full: 'N/A', mismatch: true });
    expect(sdCardStatValue({ label: 'x', value: 'N/A', format: 'text' }, vi).mismatch).toBeFalse();
  });

  it('formats the absolute delta in the stat format', () => {
    expect(sdCardStatDelta({ label: 'x', value: 1, format: 'percent', delta: { value: -0.052 } }, en)).toEqual({
      tone: 'bad',
      direction: 'down',
      display: '5.2%',
    });
  });

  it('infers file kinds from extensions and MIME types', () => {
    expect(sdCardFileInfo('Bao-cao.XLSX', undefined, '').kind).toBe('sheet');
    expect(sdCardFileInfo('hop-dong.docx', undefined, '').icon).toBe('description');
    expect(sdCardFileInfo('photo', 'image/heic', '').kind).toBe('image');
    expect(sdCardFileInfo('scan', 'application/pdf', '').kind).toBe('pdf');
    expect(sdCardFileInfo('data', 'csv', '').extension).toBe('CSV');
    expect(sdCardFileInfo('archive.zip', undefined, '')).toEqual({ kind: 'other', icon: 'draft', extension: 'ZIP', size: '' });
    expect(sdCardFileInfo('.env', undefined, '').extension).toBe('');
  });
});
