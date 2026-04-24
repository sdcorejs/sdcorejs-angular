import { InjectionToken } from '@angular/core';
import { CanActivate } from '@angular/router';
import { SdMaybeAsync } from '@sdcorejs/angular/utilities';
import { SdAuthInfo } from '../services';

export interface ISdAuthConfiguration {
  action?: IAuthConfigurationAction;
  guard?: IAuthConfigurationGuard;
}

export const SD_AUTH_CONFIGURATION = new InjectionToken<ISdAuthConfiguration>('sd.auth.configuration');

interface IAuthConfigurationAction {
  signout: () => SdMaybeAsync<void>;
  changePassword?: () => SdMaybeAsync<void>;
}

interface IAuthConfigurationGuard {
  auth?: CanActivate['canActivate'];
  portal?: CanActivate['canActivate'];
  authInfo: () => SdMaybeAsync<SdAuthInfo>;
}

