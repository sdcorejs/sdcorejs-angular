import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

// Giả sử bạn có một service để đọc config
import { ISdLayoutConfiguration, SD_LAYOUT_CONFIGURATION } from '../../../configurations';

@Injectable({
  providedIn: 'root',
})
export class HomeRedirectGuard implements CanActivate {
  private readonly router = inject(Router);
  private readonly layoutConfiguration: ISdLayoutConfiguration = inject(SD_LAYOUT_CONFIGURATION);

  async canActivate() {
    const homeUrl = this.layoutConfiguration?.homeUrl;
    if (homeUrl) {
      // Nếu có config homeUrl, tạo một UrlTree để redirect
      // Đây là cách redirect chính thống từ trong guard
      return this.router.createUrlTree([homeUrl]);
    }
    // Nếu không có homeUrl, cho phép kích hoạt route
    return true;
  }
}
