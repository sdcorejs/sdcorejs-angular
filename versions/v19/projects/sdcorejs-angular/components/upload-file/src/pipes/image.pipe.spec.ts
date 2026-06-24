import { FilterImagePipe } from './image.pipe';
import { PreviewFile } from '../services';

describe('FilterImagePipe', () => {
  let pipe: FilterImagePipe;

  const file = (over: Partial<PreviewFile>): PreviewFile => ({
    previewSrc: null,
    isPreviewImage: false,
    ...over,
  });

  beforeEach(() => {
    pipe = new FilterImagePipe();
  });

  it('returns empty array when given empty array', () => {
    expect(pipe.transform([])).toEqual([]);
  });

  it('keeps image with file blob', () => {
    const item = file({ isPreviewImage: true, file: new File([], 'i.png') });
    expect(pipe.transform([item])).toEqual([item]);
  });

  it('keeps image with src url', () => {
    const item = file({ isPreviewImage: true, src: 'http://x/i.png' });
    expect(pipe.transform([item])).toEqual([item]);
  });

  it('drops non-image even when it has file or src', () => {
    const items = [file({ isPreviewImage: false, file: new File([], 'a.pdf') }), file({ isPreviewImage: false, src: 'http://x/b.txt' })];
    expect(pipe.transform(items)).toEqual([]);
  });

  it('drops image when both file and src are missing (broken preview)', () => {
    const item = file({ isPreviewImage: true, file: null, src: null });
    expect(pipe.transform([item])).toEqual([]);
  });

  it('mixed: keeps only images with a source', () => {
    const pdf = file({ isPreviewImage: false, fileName: 'a.pdf' });
    const imgOk = file({ isPreviewImage: true, file: new File([], 'b.png') });
    const imgBroken = file({ isPreviewImage: true });
    expect(pipe.transform([pdf, imgOk, imgBroken])).toEqual([imgOk]);
  });
});
