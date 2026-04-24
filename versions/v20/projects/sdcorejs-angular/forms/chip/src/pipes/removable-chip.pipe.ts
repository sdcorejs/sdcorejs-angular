import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'sdRemovableChip'
})
export class SdRemovableChipPipe implements PipeTransform {
  constructor() { }
  transform(item: any, removable: boolean | ((item: any) => boolean)): boolean {
    if(typeof(removable) === 'boolean') {
      return removable;
    }
    return removable(item);
  }
}
