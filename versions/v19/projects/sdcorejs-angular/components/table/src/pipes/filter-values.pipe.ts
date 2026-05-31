import { Pipe, PipeTransform } from '@angular/core';

// Đối với filter loại values, items có thể là 1 mảng, có thể là 1 hàm, do đó cần xử lý nếu là hàm có thể xử lý gọi API
@Pipe({
  name: 'filterValues',
})
export class FilterValuesPipe implements PipeTransform {
  constructor() {}
  async transform(items: any[] | (() => Promise<any[]>) | undefined | null): Promise<any[]> {
    if (Array.isArray(items)) {
      return items;
    }
    if (typeof items === 'function') {
      const results = await items();
      if (Array.isArray(results)) {
        return results;
      }
    }
    return [];
  }
}
