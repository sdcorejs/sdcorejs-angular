import { InjectionToken } from '@angular/core';
import { CanActivate } from '@angular/router';
import { MaybeAsync } from '@sdcorejs/utils/models';
import { Observable } from 'rxjs';
import { SdAuthInfo } from '../services';

export interface ISdAuthConfiguration {
  action?: IAuthConfigurationAction;
  guard?: IAuthConfigurationGuard;
}

export const SD_AUTH_CONFIGURATION = new InjectionToken<ISdAuthConfiguration>('sd.auth.configuration');

// why: `MaybeAsync` của `@sdcorejs/utils` 1.1.x là `T | Promise<T> | Observable<T>` (RxJS). Từ 1.2 nó dùng
// `SubscribableLike<T>` cấu trúc, và kiểu này KHÔNG nhận `Observable` của kiểu hẹp hơn (vd `Observable<string>`
// cho slot `string | null | undefined`, hay Observable của một subtype). Giữ `Observable<T>` tường minh để
// consumer đang truyền Observable/BehaviorSubject vẫn compile như trước.
interface IAuthConfigurationAction {
  signout: () => MaybeAsync<void> | Observable<void>;
  changePassword?: () => MaybeAsync<void> | Observable<void>;
}

interface IAuthConfigurationGuard {
  auth?: CanActivate['canActivate'];
  portal?: CanActivate['canActivate'];
  authInfo: () => MaybeAsync<SdAuthInfo> | Observable<SdAuthInfo>;
}
