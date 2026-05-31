import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { SdPermissionService } from '../services';

@Directive({
  selector: '[sdPermission]',
})
export class SdPermissionDirective {
  readonly #templateRef: TemplateRef<Record<string, never>> = inject(TemplateRef);
  readonly #viewContainerRef = inject(ViewContainerRef);
  readonly #permissionService = inject(SdPermissionService);

  // Nếu là mảng thì chỉ cần có 1 permission trong mảng đó xem như có quyền
  readonly sdPermission = input<string | string[] | undefined | null>(undefined);
  readonly sdPermissionKey = input<string | undefined>(undefined);

  constructor() {
    effect(() => {
      const permission = this.sdPermission();
      const permissionKey = this.sdPermissionKey();

      this.#viewContainerRef.clear();

      // Nếu không gắn permission thì render
      if (!permission?.toString()) {
        this.#viewContainerRef.createEmbeddedView(this.#templateRef);
        return;
      }

      // Kiểm tra permission theo key (nếu có)
      if (this.#permissionService.hasPermission(permission, permissionKey)) {
        this.#viewContainerRef.createEmbeddedView(this.#templateRef);
      }
    });
  }
}
