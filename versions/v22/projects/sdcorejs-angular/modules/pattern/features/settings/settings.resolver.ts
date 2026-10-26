import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { timeout } from 'rxjs';
import { SettingsService } from './services/settings.service';
import type { SettingsDto } from './services/settings.model';

/** Tải cài đặt trước khi mở trang; lỗi đi tới navigation error handler của host. */
export const settingsResolver: ResolveFn<SettingsDto> = () => inject(SettingsService).detail().pipe(timeout(10_000));
