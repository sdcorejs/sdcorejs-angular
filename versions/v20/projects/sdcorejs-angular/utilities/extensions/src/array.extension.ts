/* eslint-disable @typescript-eslint/no-explicit-any */
// export {};

import { StringUtilities } from './string.extension';

// declare global {
//   interface Array<T = any> {
//     search(searchText: string | number, fields?: (string | undefined) | (string | undefined)[], children?: string): T[];
//     paging(pageSize: number, page?: number): T[];
//     toObject(key: string): Record<string, T>;
//     union(key: string, ...args: T[][]): T[];
//     distinct(): T[];
//   }
//   interface ArrayConstructor {
//     search<T = any>(items: T[], searchText: string | number, fields?: (string | undefined) | (string | undefined)[]): T[];
//     union<T = any>(key: string, ...args: T[][]): T[];
//     toObject<T = any>(key: string, items: T[]): Record<string, T>;
//   }
// }

const search = <T = any>(items: T[], searchText: any, fields?: (string | undefined) | (string | undefined)[], children?: string): T[] => {
  if (!searchText?.toString()) {
    return items;
  }
  if (!items?.length) {
    return items;
  }
  if (Array.isArray(fields)) {
    const fs = fields.filter(e => e !== undefined && e !== null && e !== '') as string[];
    if (!fs.length) {
      return items.filter(item => item !== undefined && item !== null && StringUtilities.aliasIncludes(item, searchText));
    }
    return items.filter(
      item =>
        (item !== undefined && item !== null && fs.some(field => StringUtilities.aliasIncludes((item as any)[field], searchText))) ||
        (children && search((item as any)[children], searchText, fields, children)?.length)
    );
  }
  if (!fields) {
    return items.filter(item => item !== undefined && item !== null && StringUtilities.aliasIncludes(item, searchText));
  }
  return items.filter(
    item =>
      (item !== undefined && item !== null && StringUtilities.aliasIncludes((item as any)[fields], searchText)) ||
      (children && search((item as any)[children], searchText, fields, children)?.length)
  );
};

// Array.prototype.search = function <T = any>(
//   searchText: any,
//   fields?: (string | undefined) | (string | undefined)[],
//   children?: string
// ): T[] {
//   // eslint-disable-next-line @typescript-eslint/no-this-alias
//   const items: T[] = this;
//   return search(items, searchText, fields, children);
// };

// Array.prototype.paging = function <T extends Record<string, any> = any>(pageSize: number, page = 0): T[] {
//   // eslint-disable-next-line @typescript-eslint/no-this-alias
//   const items: T[] = this;
//   return items.filter((_, index) => {
//     return index >= page * pageSize && index < (page + 1) * pageSize;
//   });
// };

// Array.prototype.toObject = function <T = any>(key: string): Record<string, T> {
//   // eslint-disable-next-line @typescript-eslint/no-this-alias
//   const items: T[] = this;
//   return items
//     .filter(item => item !== undefined && item !== null)
//     .reduce<Record<string, any>>((obj, item: Record<string, any>) => {
//       const objKey = item?.[key]?.toString();
//       if (typeof objKey === 'string') {
//         obj[objKey] = item;
//       }
//       return obj;
//     }, {});
// };

// Array.prototype.union = function <T = Record<string, any>>(key: string, ...args: T[][]) {
//   // eslint-disable-next-line @typescript-eslint/no-this-alias
//   let results: T[] = this;
//   const filterUnion = <T = any>(val: T, index: number, self: T[]) =>
//     val !== undefined && val !== null && self.findIndex(e => (e as any)[key] === (val as any)[key]) === index;
//   if (!args?.length) {
//     return results.filter(filterUnion);
//   }
//   for (const arg of args) {
//     if (Array.isArray(arg)) {
//       results = [...results, ...arg].filter(filterUnion);
//     }
//   }
//   return results;
// };

// Array.prototype.distinct = function () {
//   if (Array.isArray(this)) {
//     return [...new Set(this)];
//   }
//   return this;
// };

const union = <T = unknown>(key: string, ...args: (T[] | undefined | null)[]) => {
  let results: T[] = [];
  const filterUnion = <T = any>(val: T, index: number, self: T[]) =>
    val !== undefined && val !== null && self.findIndex(e => (e as any)[key] === (val as any)[key]) === index;
  if (!args?.length) {
    return [];
  }
  for (const arg of args) {
    if (Array.isArray(arg)) {
      results = [...results, ...arg].filter(filterUnion);
    }
  }
  return results;
};

const toObject = <T>(key: string, items: T[] | undefined | null): Record<string, T> => {
  if (!Array.isArray(items)) {
    return {};
  }
  return items
    .filter(item => item !== undefined && item !== null)
    .reduce<Record<string, any>>((obj, item: Record<string, any>) => {
      const objKey = item?.[key]?.toString();
      if (typeof objKey === 'string') {
        obj[objKey] = item;
      }
      return obj;
    }, {});
};

const distinct = <T = any>(items: T[] | undefined | null) => {
  if (Array.isArray(items)) {
    return [...new Set(items)];
  }
  return [];
};

const paging = <T = any>(items: T[] | undefined | null, pageSize: number, page = 0): T[] => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.filter((_, index) => {
    return index >= page * pageSize && index < (page + 1) * pageSize;
  });
};

export const ArrayUtilities = {
  search,
  union,
  toObject,
  distinct,
  paging,
};
