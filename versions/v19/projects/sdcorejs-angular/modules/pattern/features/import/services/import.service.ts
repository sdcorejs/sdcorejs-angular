import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { BaseApiService } from '../../../services/base-api.service';
import type { ImportCommitRes, ImportDuplicatePolicy, ImportPreviewRowDto } from './import.model';

type ImportRowReq = Readonly<Record<'code' | 'name' | 'unit' | 'price', string>>;

/** Nhập sản phẩm theo lô: API phân loại từng dòng trước, rồi ghi theo cách xử lý dòng trùng. */
@Injectable()
export class ImportService extends BaseApiService {
  preview(rows: readonly ImportRowReq[]): Observable<{ rows: ImportPreviewRowDto[] }> {
    return this.http.post<{ rows: ImportPreviewRowDto[] }>(this.apiUrl('products', 'import', 'preview'), { rows });
  }

  commit(rows: readonly ImportRowReq[], duplicates: ImportDuplicatePolicy): Observable<ImportCommitRes> {
    return this.http.post<ImportCommitRes>(this.apiUrl('products', 'import'), { rows, duplicates });
  }
}
