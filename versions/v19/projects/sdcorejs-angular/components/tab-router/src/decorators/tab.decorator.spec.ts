import { Component } from '@angular/core';

import { SdTabComponent } from './tab.decorator';
import { SdTabDecoratorService } from '../services/tab-decorator.service';

@Component({ standalone: true, template: '' })
class OrphanOneComponent {}

@Component({ standalone: true, template: '' })
class OrphanTwoComponent {}

@Component({ standalone: true, template: '' })
class OrphanThreeComponent {}

// ---------------------------------------------------------------------------
// why: decorator chạy lúc class ĐƯỢC ĐỊNH NGHĨA (module evaluation). Bản cũ subscribe vào
// BehaviorSubject tĩnh ngay tại đó — nếu app không bao giờ provide SdTabRouterService thì
// `take(1)` không bao giờ fire và Subscriber sống suốt vòng đời app, giữ luôn class component.
// Suite này đo trực tiếp hệ quả quan sát được: subject KHÔNG được có observer nào sau khi decorate.
// ---------------------------------------------------------------------------

describe('@SdTabComponent registration', () => {
  it('leaves no subscriber on the static BehaviorSubject when a class is decorated', () => {
    expect(SdTabDecoratorService.tabRouterService.observed).toBeFalse();

    SdTabComponent({ component: OrphanOneComponent, name: 'Orphan one' })(OrphanOneComponent);

    expect(SdTabDecoratorService.tabRouterService.observed).toBeFalse();
  });

  it('keeps the observer count flat no matter how many classes are decorated', () => {
    const before = SdTabDecoratorService.tabRouterService.observers.length;

    SdTabComponent({ component: OrphanTwoComponent, name: 'Orphan two' })(OrphanTwoComponent);
    SdTabComponent({ component: OrphanThreeComponent, name: 'Orphan three' })(OrphanThreeComponent);

    expect(SdTabDecoratorService.tabRouterService.observers.length).toBe(before);
  });
});
