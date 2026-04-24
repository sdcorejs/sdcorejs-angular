import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { SdHttpInterceptor } from './interceptors/api.interceptor';

@NgModule({
  imports: [],
  exports: [],
  providers: [provideHttpClient(withInterceptorsFromDi()), { provide: HTTP_INTERCEPTORS, useClass: SdHttpInterceptor, multi: true }],
})
export class SdApiModule {}
