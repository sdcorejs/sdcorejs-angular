import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { SdPermissionInput, SdPermissionService } from '../services';

@Directive({
  selector: '[sdPermission]',
})
export class SdPermissionDirective {
  readonly #templateRef: TemplateRef<Record<string, never>> = inject(TemplateRef);
  readonly #viewContainerRef = inject(ViewContainerRef);
  readonly #permissionService = inject(SdPermissionService);

  // Nếu là mảng thì chỉ cần có 1 permission trong mảng đó xem như có quyền
  readonly sdPermission = input<SdPermissionInput>(undefined);
  readonly sdPermissionKey = input<string | undefined>(undefined);

  constructor() {
    effect(() => {
      const permission = this.sdPermission();
      const permissionKey = this.sdPermissionKey();

      this.#viewContainerRef.clear();

      // why: code cũ render vô điều kiện khi `permission` rỗng, nên `*sdPermission="perm"` với `perm`
      // undefined (typo tên biến, dữ liệu chưa về, mã quyền rỗng từ API) hiện nút cho tất cả mọi
      // người. Giờ mọi quyết định đều đi qua `hasPermission` — nó fail closed và chỉ chấp nhận
      // `SD_PERMISSION_PUBLIC` như opt-out tường minh, nên không còn nhánh render ngầm nào nữa.
      if (this.#permissionService.hasPermission(permission, permissionKey)) {
        this.#viewContainerRef.createEmbeddedView(this.#templateRef);
      }
    });
  }
}
