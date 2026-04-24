import { Pipe, PipeTransform } from '@angular/core';
import { IsImage, PreviewFile } from '../services';
@Pipe({
  name: 'filterImage',
  standalone: true,
})
export class FilterImagePipe implements PipeTransform {
  transform(files: PreviewFile[]) {
    return files.filter(e => e.isPreviewImage && (e.file || e.src));
  }
}
