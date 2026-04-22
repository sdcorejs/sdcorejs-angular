import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SdTabRouterService } from './tab-router.service';
@Injectable({
  providedIn: 'root',
})
export class SdTabDecoratorService {
  static tabRouterService = new BehaviorSubject<SdTabRouterService | undefined>(undefined);
  constructor(tabRouterService: SdTabRouterService) {
    SdTabDecoratorService.tabRouterService.next(tabRouterService);
  }
}
