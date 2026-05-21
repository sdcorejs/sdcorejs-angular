import { FilterDocumentPipe } from './document.pipe';
import { PreviewFile } from '../services';

describe('FilterDocumentPipe', () => {
  let pipe: FilterDocumentPipe;

  const file = (over: Partial<PreviewFile>): PreviewFile => ({
    previewSrc: null,
    isPreviewImage: false,
    ...over,
  });

  beforeEach(() => {
    pipe = new FilterDocumentPipe();
  });

  it('returns empty array when given empty array', () => {
    expect(pipe.transform([])).toEqual([]);
  });

  it('keeps non-image files (isPreviewImage=false) regardless of file/src', () => {
    const items = [
      file({ isPreviewImage: false, fileName: 'a.pdf', file: new File([], 'a.pdf') }),
      file({ isPreviewImage: false, fileName: 'b.txt', src: 'http://x/b' }),
      file({ isPreviewImage: false, fileName: 'c.docx' }),
    ];
    expect(pipe.transform(items)).toEqual(items);
  });

  it('drops image files that have a file blob', () => {
    const items = [file({ isPreviewImage: true, file: new File([], 'i.png') })];
    expect(pipe.transform(items)).toEqual([]);
  });

  it('drops image files that have a src url', () => {
    const items = [file({ isPreviewImage: true, src: 'http://x/i.png' })];
    expect(pipe.transform(items)).toEqual([]);
  });

  it('keeps image files that have neither file nor src (broken preview)', () => {
    const broken = file({ isPreviewImage: true, file: null, src: null });
    expect(pipe.transform([broken])).toEqual([broken]);
  });

  it('mixed: keeps non-images + broken image, drops images with source', () => {
    const pdf = file({ isPreviewImage: false, fileName: 'a.pdf' });
    const imgOk = file({ isPreviewImage: true, file: new File([], 'b.png') });
    const imgBroken = file({ isPreviewImage: true });
    expect(pipe.transform([pdf, imgOk, imgBroken])).toEqual([pdf, imgBroken]);
  });
});
