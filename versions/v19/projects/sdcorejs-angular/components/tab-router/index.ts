export * from './src/components/tab-router-outlet/tab-router-outlet.component';
export * from './src/services/tab-router.service';
export * from './src/models/tab-router.model';
// why: named export tường minh, KHÔNG `export *`. File decorator còn chứa
// `ɵsdResetTabComponentBuilders` (chỉ dùng cho test — gọi nhầm là xoá sạch mọi builder app đã đăng
// ký) và `ɵsdConnectTabComponentBuilders` (outlet import bằng đường dẫn tương đối, không cần lộ ra
// entry point công khai).
export { SdTabComponent } from './src/decorators/tab.decorator';
export type { SdTabComponentArgs, SdTabComponentBuilder } from './src/decorators/tab.decorator';
