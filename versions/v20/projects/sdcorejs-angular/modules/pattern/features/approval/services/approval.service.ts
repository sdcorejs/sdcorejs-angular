import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { BaseApiService } from '../../../services/base-api.service';
import type { ApprovalDecisionReq, ApprovalDto, ApprovalListReq, ApprovalListRes } from './approval.model';

@Injectable()
export class ApprovalService extends BaseApiService {
  list(req: ApprovalListReq): Observable<ApprovalListRes> {
    return this.http.get<ApprovalListRes>(this.apiUrl('approvals'), { params: this.buildPagingReq(req) });
  }

  detail(id: string): Observable<ApprovalDto> {
    return this.http.get<ApprovalDto>(this.apiUrl('approvals', id));
  }

  approve(req: ApprovalDecisionReq): Observable<ApprovalDto> {
    return this.http.post<ApprovalDto>(this.apiUrl('approvals', req.id, 'approve'), {});
  }

  reject(req: ApprovalDecisionReq): Observable<ApprovalDto> {
    return this.http.post<ApprovalDto>(this.apiUrl('approvals', req.id, 'reject'), { reason: req.reason });
  }
}
