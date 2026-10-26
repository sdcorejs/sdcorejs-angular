import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { PagingReq } from '@sdcorejs/utils/models';
import { SD_PATTERN_CONFIGURATION } from '../configurations/pattern.configuration';
import { resourceUrl } from '../utils/resource-url';

/**
 * HttpClient, configuration and URL helpers shared by the API services of the pattern features.
 * The services do not know whether the mock API or a real API answers.
 */
@Injectable()
export abstract class BaseApiService {
  protected readonly http = inject(HttpClient);
  protected readonly configuration = inject(SD_PATTERN_CONFIGURATION);

  protected apiUrl(...segments: string[]): string {
    return resourceUrl(this.configuration.apiBaseUrl, ...segments);
  }

  /** Wire format of the sample API: scalar paging + JSON for filters/orders/fields. */
  protected buildPagingReq<T>(req: PagingReq<T>): HttpParams {
    let params = new HttpParams();
    if (req.pageNumber !== undefined) params = params.set('pageNumber', req.pageNumber);
    if (req.pageSize !== undefined) params = params.set('pageSize', req.pageSize);
    for (const key of ['filters', 'orders', 'fields'] as const) {
      if (req[key] !== undefined) params = params.set(key, JSON.stringify(req[key]));
    }
    return params;
  }
}
