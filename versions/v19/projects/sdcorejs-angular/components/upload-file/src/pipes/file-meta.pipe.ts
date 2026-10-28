import { Pipe, PipeTransform } from '@angular/core';

import { sdFileExtension, sdFileMeta } from '../helpers/file-type';
import { PreviewFile } from '../services';

/** Dòng phụ `{EXT} · {dung lượng}` của một file (đợt 3 · 4a). `locale` truyền vào để pipe vẫn pure khi đổi ngôn ngữ. */
@Pipe({ name: 'sdUploadFileMeta' })
export class SdUploadFileMetaPipe implements PipeTransform {
  transform(file: PreviewFile | null | undefined, locale?: string): string {
    if (!file) return '';
    return sdFileMeta(file.extension || sdFileExtension(file.fileName) || sdFileExtension(file.src), file.fileSize, locale);
  }
}
