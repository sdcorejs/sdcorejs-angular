import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SdTabDecoratorService } from './tab-decorator.service';
import { SdTabRouterService } from './tab-router.service';
import { SdTabComponent, ɵsdConnectTabComponentBuilders, ɵsdResetTabComponentBuilders } from '../decorators/tab.decorator';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '',
})
class FooComponent {}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '',
})
class BarComponent {}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '',
})
class BazComponent {}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '',
})
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
    // why: decorator giờ chỉ ghi vào một collection tĩnh; outlet (qua ɵsdConnectTabComponentBuilders)
    // là bên drain collection đó vào SdTabRouterService. Không còn subscription nào để rò rỉ.
    let disconnect: (() => void) | undefined;

    beforeEach(() => {
      ɵsdResetTabComponentBuilders();
      disconnect = undefined;
    });

    afterEach(() => {
      disconnect?.();
      ɵsdResetTabComponentBuilders();
    });

    it('drains builders registered before the router service exists', () => {
      SdTabComponent<Type<unknown>>({ component: FooComponent, name: 'Foo' })(FooComponent);

      TestBed.configureTestingModule({ providers: [SdTabRouterService] });
      const router = TestBed.inject(SdTabRouterService);
      const addSpy = spyOn(router, 'addBuilder').and.callThrough();

      disconnect = ɵsdConnectTabComponentBuilders(builder => router.addBuilder(builder));

      expect(addSpy).toHaveBeenCalledOnceWith(jasmine.objectContaining({ component: FooComponent, name: 'Foo' }));
      expect(router.builders.getValue().some(builder => builder.component === FooComponent)).toBeTrue();
    });

    it('forwards builders registered after the outlet connected', () => {
      TestBed.configureTestingModule({ providers: [SdTabRouterService] });
      const router = TestBed.inject(SdTabRouterService);
      disconnect = ɵsdConnectTabComponentBuilders(builder => router.addBuilder(builder));
      const addSpy = spyOn(router, 'addBuilder').and.callThrough();

      SdTabComponent({ component: BarComponent, name: 'Bar' })(BarComponent);

      expect(addSpy).toHaveBeenCalledOnceWith(jasmine.objectContaining({ component: BarComponent, name: 'Bar' }));
    });

    it('replays the collection for a second connect and dedupes through addBuilder', () => {
      SdTabComponent({ component: BazComponent, name: 'Baz' })(BazComponent);

      TestBed.configureTestingModule({ providers: [SdTabRouterService] });
      const router = TestBed.inject(SdTabRouterService);
      ɵsdConnectTabComponentBuilders(builder => router.addBuilder(builder))();
      disconnect = ɵsdConnectTabComponentBuilders(builder => router.addBuilder(builder));

      expect(router.builders.getValue().filter(builder => builder.component === BazComponent).length).toBe(1);
    });

    it('stops forwarding once the outlet disconnects', () => {
      TestBed.configureTestingModule({ providers: [SdTabRouterService] });
      const router = TestBed.inject(SdTabRouterService);
      ɵsdConnectTabComponentBuilders(builder => router.addBuilder(builder))();
      const addSpy = spyOn(router, 'addBuilder').and.callThrough();

      SdTabComponent({ component: LateComponent, name: 'Late' })(LateComponent);

      expect(addSpy).not.toHaveBeenCalled();
    });

    it('never subscribes to the static BehaviorSubject', () => {
      SdTabComponent({ component: LateComponent, name: 'Late' })(LateComponent);

      expect(SdTabDecoratorService.tabRouterService.observed).toBeFalse();
    });
  });
});
