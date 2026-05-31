import { InjectionToken } from '@angular/core';
import { CanActivate } from '@angular/router';
import { MaybeAsync } from '@sdcorejs/utils/models';
import { SdAuthInfo } from '../services';

export interface ISdAuthConfiguration {
  action?: IAuthConfigurationAction;
  guard?: IAuthConfigurationGuard;
}

export const SD_AUTH_CONFIGURATION = new InjectionToken<ISdAuthConfiguration>('sd.auth.configuration');

interface IAuthConfigurationAction {
  signout: () => MaybeAsync<void>;
  changePassword?: () => MaybeAsync<void>;
}

interface IAuthConfigurationGuard {
  auth?: CanActivate['canActivate'];
  portal?: CanActivate['canActivate'];
  authInfo: () => MaybeAsync<SdAuthInfo>;
}
