import { Injectable, Signal, signal } from '@angular/core';
import type { SdLabelPlacement } from '@sdcorejs/angular/forms/models';
import type { SdFormGenericBreakpoint } from '../../configurations/form-generic-breakpoints';
import type { SdFormGenericScope } from '../../rules/form-generic-filter';

/**
 * Ngữ cảnh dùng chung cho mọi field của MỘT `<sd-form-render>` (provide ở component).
 *
 * why: value, biến, chế độ xem và vị trí nhãn là quyết định cấp form. Field đọc/ghi qua DI thay vì
 * luồn input qua `lib-item` và cả 11 field component. `sd-form-render` gán các signal này lúc khởi tạo.
 */
@Injectable()
export class FormRenderContext {
  labelPlacement: Signal<SdLabelPlacement> = signal<SdLabelPlacement>('top');
  viewed: Signal<boolean> = signal(false);
  value: Signal<Readonly<Record<string, unknown>>> = signal({});
  variables: Signal<Readonly<Record<string, unknown>>> = signal({});
  /** `{ ...value, ...variables }` — nơi Filter, value ref và hyperlink được giải. */
  scope: Signal<SdFormGenericScope> = signal({});
  level: Signal<SdFormGenericBreakpoint> = signal('desktop');
  /** Ghi một phần giá trị; renderer phát object value mới, không mutate object cũ. */
  patch: (patch: Record<string, unknown>) => void = () => undefined;
}
