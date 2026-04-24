import { Inject, Injectable, Optional, signal, Signal } from '@angular/core';
import { from, Observable, Subject } from 'rxjs';
import { ISdAuthConfiguration, SD_AUTH_CONFIGURATION } from '../configurations';
import { SdNormalizeAsync, SdResolveMaybeAsync } from '@sdcorejs/angular/utilities';
import { SdAuthInfo } from './auth.model';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class SdAuthService {
  // ÄÄƒng nháº­p
  // #signin = new Subject<void>();
  // signin$?: Observable<void>;
  getAuthInfo?: Signal<SdAuthInfo | undefined>;

  // ÄÄƒng xuáº¥t
  #signout = new Subject<void>();
  signout$?: Observable<void>;

  // Thay Ä‘á»•i máº­t kháº©u
  #changePassword = new Subject<void>();
  changePassword$?: Observable<void>;

  constructor(@Optional() @Inject(SD_AUTH_CONFIGURATION) private authConfiguration: ISdAuthConfiguration) {
    // this.#handleSignin();
    this.#handleSignout();
    this.#handleChangePassword();
    const defaultUser = {
      id: 'guest-id',
      username: 'guest',
      firstName: 'Guest',
      email: 'guest@gmail.com',
    };
    if (this.authConfiguration?.guard?.authInfo) {
      this.getAuthInfo = toSignal(SdNormalizeAsync(this.authConfiguration.guard?.authInfo()), {
        initialValue: defaultUser,
      });
    } else {
      this.getAuthInfo = signal(defaultUser);
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
      SdResolveMaybeAsync(this.authConfiguration.action.signout()).then(() => {
        this.#signout.next();
      });
    }
  };

  changePassword = () => {
    if (this.authConfiguration?.action?.changePassword) {
      SdResolveMaybeAsync(this.authConfiguration.action.changePassword()).then(() => {
        this.#changePassword.next();
      });
    }
  };
}

