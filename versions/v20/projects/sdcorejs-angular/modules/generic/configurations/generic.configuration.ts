import { InjectionToken } from '@angular/core';
import { SdRegister, SdRegisterArgs } from '../models';

export interface ISdGenericConfiguration<TData = any> {
  // Configuration này sẽ áp dụng cho các module nào
  // Ví dụ Core Commerce có các module như pcm, oms, promotion ...
  modules: string[];
  register: <T = any>(module: string, typeCode: string, args?: SdRegisterArgs<TData>) => SdRegister<T>;
}

export const SD_GENERIC_CONFIGURATION = new InjectionToken<ISdGenericConfiguration>('sd.generic.configuration');
