import { Pipe, PipeTransform } from '@angular/core';
import { StringUtilities } from '@sdcorejs/utils/fns';

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
    if (!keyword || keyword.length < 2) {
      return value;
    }
    value = value?.trim() || '';
    const aliasKeyword = StringUtilities.changeAliasLowerCase(keyword);
    const aliasLowerCaseStr = StringUtilities.changeAliasLowerCase(value);

    // Ưu tiên highlight theo chuỗi con liền nhau (khớp trực tiếp với tiêu đề/route)
    const substringHighlight = this.#highlightSubstring(value, aliasLowerCaseStr, aliasKeyword, color);
    if (substringHighlight !== null) {
      return substringHighlight;
    }

    // Không có chuỗi con nào khớp -> thử highlight theo ký tự đầu (viết tắt), vd "sp" -> "Sản phẩm"
    return this.#highlightOrderedInitials(value, aliasLowerCaseStr, aliasKeyword, color) ?? value;
  }

  #highlightSubstring = (value: string, aliasLowerCaseStr: string, aliasKeyword: string, color: string): string | null => {
    const regex = new RegExp(aliasKeyword, 'gi'); //'gi' for case insensitive and can use 'g' if you want the search to be case sensitive.
    const strs: string[] = [];
    let previousOffset = 0;
    let hasMatch = false;
    aliasLowerCaseStr.replace(regex, (_, offset) => {
      hasMatch = true;
      strs.push(value.substring(previousOffset, offset));
      strs.push(`<mark style="background-color: ${color}">${value.substring(offset, offset + aliasKeyword.length)}</mark>`);
      previousOffset = offset + aliasKeyword.length;
      return `<mark style="background-color: ${color}">${value.substring(offset, offset + aliasKeyword.length)}</mark>`;
    });
    if (!hasMatch) {
      return null;
    }
    strs.push(value.substring(previousOffset, value.length));
    return strs.join('');
  };

  #highlightOrderedInitials = (value: string, aliasLowerCaseStr: string, aliasKeyword: string, color: string): string | null => {
    const wordRegex = /\S+/g;
    const matchedPositions: number[] = [];
    let matchedCount = 0;
    let wordMatch: RegExpExecArray | null;
    while ((wordMatch = wordRegex.exec(aliasLowerCaseStr))) {
      if (matchedCount >= aliasKeyword.length) {
        break;
      }
      if (wordMatch[0][0] === aliasKeyword[matchedCount]) {
        matchedPositions.push(wordMatch.index);
        matchedCount++;
      }
    }
    if (matchedCount !== aliasKeyword.length) {
      return null;
    }

    let result = '';
    let cursor = 0;
    for (const position of matchedPositions) {
      result += value.substring(cursor, position);
      result += `<mark style="background-color: ${color}">${value.charAt(position)}</mark>`;
      cursor = position + 1;
    }
    result += value.substring(cursor);
    return result;
  };

  #normalizeValue = (keyword: string) => {
    let str: string = keyword?.toString() ?? '';
    /* eslint-disable no-useless-escape */
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, '');
    str = str.replace(/ + /g, ' ');
    str = str.trim();
    return str;
  };
}
