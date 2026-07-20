import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SdTabRouterService } from './tab-router.service';
@Injectable({
  providedIn: 'root',
})
export class SdTabDecoratorService {
  static tabRouterService = new BehaviorSubject<SdTabRouterService | undefined>(undefined);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {
    const tabRouterService = inject(SdTabRouterService);

    SdTabDecoratorService.tabRouterService.next(tabRouterService);
  }
}
