import { Type } from '@angular/core';
import { Color } from '@sdcorejs/utils/models';

export interface SdTabComponentArgs {
  url?: string;
  params?: any;
  queryParams?: any;
  data?: Record<string, any>;
}

export declare interface SdTabComponentBuilder {
  component: Type<any>;
  name: string | ((args: SdTabComponentArgs) => string);
  icon?: string | ((args: SdTabComponentArgs) => string);
  tooltip?: string | ((args: SdTabComponentArgs) => string);
  color?: Color | ((args: SdTabComponentArgs) => Color);
}

// why: decorator chạy lúc class ĐƯỢC ĐỊNH NGHĨA (module evaluation), tức trước cả khi Angular
// bootstrap. Bản cũ subscribe vào BehaviorSubject tĩnh ngay tại đó: nếu app không bao giờ provide
// SdTabRouterService thì `take(1)` không bao giờ fire → mỗi class được decorate để lại một
// Subscriber sống suốt vòng đời app, giữ cả class component lẫn closure của nó.
// Thay bằng một collection tĩnh thuần: đăng ký là O(1), không có subscription nào để rò rỉ, và
// outlet sẽ "drain" (replay) collection này vào SdTabRouterService khi nó khởi tạo.
const sdRegisteredTabBuilders: SdTabComponentBuilder[] = [];
// why: TẬP sink, không phải một slot duy nhất. Hai `<sd-tab-router-outlet>` sống song song là hợp
// lệ; với một slot thì outlet thứ hai ghi đè outlet thứ nhất (outlet #1 im lặng ngừng nhận builder
// lazy), và khi outlet #2 disconnect nó xoá luôn sink dù outlet #1 vẫn còn sống. BehaviorSubject cũ
// vốn multicast, nên một slot là bước lùi.
const sdTabBuilderSinks = new Set<(builder: SdTabComponentBuilder) => void>();

export function SdTabComponent<T>(builder: SdTabComponentBuilder) {
  return (_constructor: T) => {
    sdRegisteredTabBuilders.push(builder);
    // why: class load lazy (route lazy) có thể được decorate SAU khi outlet đã connect —
    // đẩy thẳng vào mọi sink để không phải chờ outlet khác khởi tạo.
    for (const sink of sdTabBuilderSinks) sink(builder);
  };
}

/**
 * @internal Outlet gọi khi khởi tạo: replay mọi builder đã đăng ký rồi nhận tiếp các builder mới.
 * Trả về hàm ngắt kết nối để outlet gọi trong teardown.
 */
export function ɵsdConnectTabComponentBuilders(register: (builder: SdTabComponentBuilder) => void): () => void {
  sdTabBuilderSinks.add(register);
  // why: replay chứ không cắt khỏi mảng — outlet có thể bị destroy rồi tạo lại, và
  // SdTabRouterService.addBuilder đã dedupe theo `component` nên replay là idempotent.
  // Mảng vì thế PHẢI giữ lại builder, tức decorator vẫn pin class component suốt vòng đời app.
  // Đó là bản chất của một decorator đăng ký toàn cục (class là thứ được đăng ký), và không đổi
  // so với trước; thứ ĐÃ bỏ được là Subscriber rò rỉ khi không ai provide SdTabRouterService.
  for (const builder of [...sdRegisteredTabBuilders]) {
    register(builder);
  }
  return () => {
    sdTabBuilderSinks.delete(register);
  };
}

/**
 * @internal CHỈ dùng cho test — xoá collection tĩnh để các spec không rò rỉ state sang nhau.
 *
 * why: KHÔNG export từ `components/tab-router/index.ts`. Consumer gọi nhầm hàm này sẽ xoá sạch mọi
 * builder mà app đã đăng ký. Spec import bằng đường dẫn tương đối.
 */
export function ɵsdResetTabComponentBuilders(): void {
  sdRegisteredTabBuilders.length = 0;
  sdTabBuilderSinks.clear();
}
