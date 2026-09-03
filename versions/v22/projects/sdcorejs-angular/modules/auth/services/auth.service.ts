import { inject, Injectable, signal, Signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ISdAuthConfiguration, SD_AUTH_CONFIGURATION } from '../configurations';
import { normalizeAsync, resolveMaybeAsync } from '@sdcorejs/utils/models';
import { SdAuthInfo } from './auth.model';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class SdAuthService {
  // Đăng nhập
  // #signin = new Subject<void>();
  // signin$?: Observable<void>;
  getAuthInfo?: Signal<SdAuthInfo | undefined>;

  // Đăng xuất
  #signout = new Subject<void>();
  signout$?: Observable<void>;

  // Thay đổi mật khẩu
  #changePassword = new Subject<void>();
  changePassword$?: Observable<void>;
  private readonly authConfiguration: ISdAuthConfiguration | null = inject(SD_AUTH_CONFIGURATION, { optional: true });

  constructor() {
    // this.#handleSignin();
    this.#handleSignout();
    this.#handleChangePassword();
    // why: code cũ dựng sẵn một identity giả (`guest` / `guest@gmail.com`) và dùng nó vừa làm giá trị
    // khi CHƯA cấu hình `guard.authInfo`, vừa làm `initialValue` trong lúc lookup thật còn pending.
    // Hệ quả: template thấy một user "đã đăng nhập" hợp lệ và render UI của người dùng đã xác thực,
    // dù thực tế chưa ai đăng nhập. `undefined` là trạng thái trung thực duy nhất cho cả hai ca —
    // template bắt buộc phải xử lý nhánh chưa xác thực (`@if (user(); as u)`) thay vì tin vào user giả.
    if (this.authConfiguration?.guard?.authInfo) {
      this.getAuthInfo = toSignal(normalizeAsync(this.authConfiguration.guard?.authInfo()));
    } else {
      this.getAuthInfo = signal<SdAuthInfo | undefined>(undefined);
    }
  }

  // #handleSignin = () => {
  //   this.signin$ = this.#signin.asObservable();
  // };

  #handleSignout = () => {
    this.signout$ = this.#signout.asObservable();
  };

  #handleChangePassword = () => {
    this.changePassword$ = this.#changePassword.asObservable();
  };
  signout = () => {
    if (this.authConfiguration?.action?.signout) {
      resolveMaybeAsync(this.authConfiguration.action.signout()).then(() => {
        this.#signout.next();
      });
    }
  };

  changePassword = () => {
    if (this.authConfiguration?.action?.changePassword) {
      resolveMaybeAsync(this.authConfiguration.action.changePassword()).then(() => {
        this.#changePassword.next();
      });
    }
  };
}
