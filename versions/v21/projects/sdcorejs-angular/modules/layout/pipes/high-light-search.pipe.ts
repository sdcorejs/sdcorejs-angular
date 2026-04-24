import { Pipe, PipeTransform } from '@angular/core';
import { SdUtilities } from '@sdcorejs/angular/utilities';

@Pipe({
  name: 'highLightSearch',
})
export class HighlightSearchPipe implements PipeTransform {
  transform(
    value: string,
    keyword: string,
    args?: {
      color?: string;
    }
  ): string {
    const { color = '#ffff00' } = args ?? {};
    keyword = this.#normalizeValue(keyword);
    if (!keyword || keyword.length < 3) {
      return value;
    }
    value = value?.trim() || '';
    const regex = new RegExp(SdUtilities.changeAliasLowerCase(keyword), 'gi'); //'gi' for case insensitive and can use 'g' if you want the search to be case sensitive.
    const aliasLowerCaseStr = SdUtilities.changeAliasLowerCase(value);
    const strs: string[] = [];
    let previousOffset = 0;
    aliasLowerCaseStr.replace(regex, (_, offset) => {
      strs.push(value.substring(previousOffset, offset));
      strs.push(`<mark style="background-color: ${color}">${value.substring(offset, offset + keyword.length)}</mark>`);
      previousOffset = offset + keyword.length;
      return `<mark style="background-color: ${color}">${value.substring(offset, offset + keyword.length)}</mark>`;
    });
    strs.push(value.substring(previousOffset, value.length));
    return strs.join('');
  }

  #normalizeValue = (keyword: string) => {
    let str: string = keyword?.toString() ?? '';
    /* eslint-disable no-useless-escape */
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, '');
    str = str.replace(/ + /g, ' ');
    str = str.trim();
    return str;
  };
}

