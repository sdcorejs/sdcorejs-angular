import { Component, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SdTabDecoratorService } from './tab-decorator.service';
import { SdTabRouterService } from './tab-router.service';
import { SdTabComponent } from '../decorators/tab.decorator';

@Component({ standalone: true, template: '' })
class FooComponent {}

@Component({ standalone: true, template: '' })
class BarComponent {}

@Component({ standalone: true, template: '' })
class BazComponent {}

@Component({ standalone: true, template: '' })
class LateComponent {}

describe('SdTabDecoratorService', () => {
  let originalSubject: typeof SdTabDecoratorService.tabRouterService;

  beforeEach(() => {
    // Backup-and-reset the static BehaviorSubject so each test starts clean.
    // The service uses a STATIC BehaviorSubject — without reset, prior tests leak state.
    originalSubject = SdTabDecoratorService.tabRouterService;
    (SdTabDecoratorService as any).tabRouterService = new (originalSubject.constructor as any)(undefined);
  });

  afterEach(() => {
    (SdTabDecoratorService as any).tabRouterService = originalSubject;
  });

  it('publishes the SdTabRouterService into static BehaviorSubject on construction', () => {
    TestBed.configureTestingModule({
      providers: [SdTabRouterService, SdTabDecoratorService],
    });

    expect(SdTabDecoratorService.tabRouterService.getValue()).toBeUndefined();

    const router = TestBed.inject(SdTabRouterService);
    TestBed.inject(SdTabDecoratorService);

    expect(SdTabDecoratorService.tabRouterService.getValue()).toBe(router);
  });

  describe('@SdTabComponent decorator', () => {
    it('registers a builder once the service becomes available', () => {
      // Apply decorator BEFORE service is constructed → waits in BehaviorSubject pipeline.
      const decorator = SdTabComponent<Type<unknown>>({ component: FooComponent, name: 'Foo' });
      decorator(FooComponent);

      TestBed.configureTestingModule({
        providers: [SdTabRouterService, SdTabDecoratorService],
      });
      const router = TestBed.inject(SdTabRouterService);
      const addSpy = spyOn(router, 'addBuilder').and.callThrough();

      TestBed.inject(SdTabDecoratorService);

      expect(addSpy).toHaveBeenCalledOnceWith(jasmine.objectContaining({ component: FooComponent, name: 'Foo' }));
    });

    it('registers immediately if service was already constructed', () => {
      TestBed.configureTestingModule({
        providers: [SdTabRouterService, SdTabDecoratorService],
      });
      const router = TestBed.inject(SdTabRouterService);
      TestBed.inject(SdTabDecoratorService);

      const addSpy = spyOn(router, 'addBuilder').and.callThrough();
      SdTabComponent({ component: BarComponent, name: 'Bar' })(BarComponent);

      expect(addSpy).toHaveBeenCalledOnceWith(jasmine.objectContaining({ component: BarComponent, name: 'Bar' }));
    });

    it('take(1): does not re-fire when service is republished', () => {
      const decorator = SdTabComponent({ component: BazComponent, name: 'Baz' });
      decorator(BazComponent);

      TestBed.configureTestingModule({
        providers: [SdTabRouterService, SdTabDecoratorService],
      });
      const router = TestBed.inject(SdTabRouterService);
      const addSpy = spyOn(router, 'addBuilder').and.callThrough();

      TestBed.inject(SdTabDecoratorService);
      expect(addSpy).toHaveBeenCalledTimes(1);

      // Republish — but the decorator subscription used take(1) so it has already
      // completed. Another emission must NOT trigger addBuilder again.
      SdTabDecoratorService.tabRouterService.next(router);
      expect(addSpy).toHaveBeenCalledTimes(1);
    });

    it('ignores undefined emissions (filter guards against null/undefined)', () => {
      const decorator = SdTabComponent({ component: LateComponent, name: 'Late' });
      decorator(LateComponent);

      // Push an undefined value manually
      SdTabDecoratorService.tabRouterService.next(undefined);

      // Now construct the service properly
      TestBed.configureTestingModule({
        providers: [SdTabRouterService, SdTabDecoratorService],
      });
      const router = TestBed.inject(SdTabRouterService);
      const addSpy = spyOn(router, 'addBuilder').and.callThrough();

      TestBed.inject(SdTabDecoratorService);

      expect(addSpy).toHaveBeenCalledOnceWith(jasmine.objectContaining({ component: LateComponent }));
    });
  });
});
