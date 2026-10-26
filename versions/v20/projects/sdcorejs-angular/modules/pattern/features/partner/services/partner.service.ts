import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { BaseApiService } from '../../../services/base-api.service';
import type { PartnerDto, PartnerSaveReq } from './partner.model';

@Injectable()
export class PartnerService extends BaseApiService {
  /** Mã còn dùng được không; gọi khi rời bước nhập mã, API vẫn kiểm tra lại lúc lưu. */
  checkCode(code: string): Observable<{ available: boolean }> {
    return this.http.get<{ available: boolean }>(this.apiUrl('partners', 'check-code'), { params: new HttpParams().set('code', code) });
  }

  create(req: PartnerSaveReq): Observable<PartnerDto> {
    return this.http.post<PartnerDto>(this.apiUrl('partners'), req);
  }
}
