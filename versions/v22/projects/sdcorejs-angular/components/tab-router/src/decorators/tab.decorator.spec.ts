import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';

import { SdTabComponent, ɵsdConnectTabComponentBuilders, ɵsdResetTabComponentBuilders } from './tab.decorator';
import { SdTabDecoratorService } from '../services/tab-decorator.service';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '',
})
class OrphanOneComponent {}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '',
})
class OrphanTwoComponent {}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '',
})
class OrphanThreeComponent {}

// ---------------------------------------------------------------------------
// why: decorator chạy lúc class ĐƯỢC ĐỊNH NGHĨA (module evaluation). Bản cũ subscribe vào
// BehaviorSubject tĩnh ngay tại đó — nếu app không bao giờ provide SdTabRouterService thì
// `take(1)` không bao giờ fire và Subscriber sống suốt vòng đời app, giữ luôn class component.
// Suite này đo trực tiếp hệ quả quan sát được: subject KHÔNG được có observer nào sau khi decorate.
//
// why (reset): registry builder là state TĨNH cấp module. Suite này từng decorate 3 class rồi bỏ
// mặc chúng nằm lại trong registry cho hết phiên Karma. Hai spec file anh em (tab-decorator.service,
// tab-router-outlet.lifecycle) reset trong beforeEach, nên câu hỏi "một lần connect drain được
// những builder nào" phụ thuộc THỨ TỰ FILE — pass hay fail đổi theo cách Karma xếp bundle. Dọn ở
// afterEach và chỉ khẳng định trên DELTA để suite này không phụ thuộc lẫn không gây phụ thuộc.
// ---------------------------------------------------------------------------

describe('@SdTabComponent registration', () => {
  afterEach(() => ɵsdResetTabComponentBuilders());

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

  // why: khẳng định trên DELTA (những builder MỚI thêm), không phải trên toàn bộ nội dung registry.
  // Registry là state tĩnh dùng chung; assert tuyệt đối sẽ vỡ ngay khi một spec file khác chạy trước.
  it('adds exactly the decorated builders to what a later connect drains', () => {
    const baseline: unknown[] = [];
    ɵsdConnectTabComponentBuilders(builder => baseline.push(builder.component))();

    SdTabComponent({ component: OrphanTwoComponent, name: 'Orphan two' })(OrphanTwoComponent);
    SdTabComponent({ component: OrphanThreeComponent, name: 'Orphan three' })(OrphanThreeComponent);

    const drained: unknown[] = [];
    ɵsdConnectTabComponentBuilders(builder => drained.push(builder.component))();

    expect(drained.length - baseline.length).toBe(2);
    expect(drained.slice(baseline.length)).toEqual([OrphanTwoComponent, OrphanThreeComponent]);
  });

  // why: đây chính xác là điều afterEach làm — chốt lại rằng reset thật sự dọn sạch, nên spec file
  // chạy sau không thừa hưởng builder nào của file này.
  it('leaves nothing for a later connect to drain once the registry is reset', () => {
    SdTabComponent({ component: OrphanOneComponent, name: 'Orphan one' })(OrphanOneComponent);
    ɵsdResetTabComponentBuilders();

    const drained: unknown[] = [];
    ɵsdConnectTabComponentBuilders(builder => drained.push(builder.component))();

    expect(drained.length).toBe(0);
  });
});
