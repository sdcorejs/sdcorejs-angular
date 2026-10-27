import { inject, Pipe, type PipeTransform } from '@angular/core';
import { of, type Observable } from 'rxjs';
import { ProductService } from '../services/product.service';
import type { ProductDto } from '../services/product.model';

/**
 * Relation sản phẩm theo ID: `@let product = line.productId | productDetail | async;`.
 * ProductService cache và chia sẻ request theo ID; nơi dùng pipe phải có ProductService trong injector.
 */
@Pipe({ name: 'productDetail', standalone: true })
export class ProductDetailPipe implements PipeTransform {
  readonly #productService = inject(ProductService);

  transform(id: ProductDto['id'] | null | undefined): Observable<ProductDto | null> {
    if (id === null || id === undefined || id === '') return of(null);
    return this.#productService.cachedDetail(id);
  }
}
