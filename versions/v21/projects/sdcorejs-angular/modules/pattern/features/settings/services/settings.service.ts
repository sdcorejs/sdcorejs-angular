import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { BaseApiService } from '../../../services/base-api.service';
import type { SettingsDto, SettingsSaveReq } from './settings.model';

@Injectable()
export class SettingsService extends BaseApiService {
  detail(): Observable<SettingsDto> {
    return this.http.get<SettingsDto>(this.apiUrl('settings'));
  }

  update(req: SettingsSaveReq): Observable<SettingsDto> {
    return this.http.put<SettingsDto>(this.apiUrl('settings'), req);
  }
}
