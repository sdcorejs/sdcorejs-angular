import { Pipe, PipeTransform } from '@angular/core';
import { IsImage, PreviewFile } from '../services';
@Pipe({
  name: 'filterDocument',
  standalone: true,
})
export class FilterDocumentPipe implements PipeTransform {
  transform(files: PreviewFile[]) {
    return files.filter(e => !e.isPreviewImage || (!e.file && !e.src));
  }
}
