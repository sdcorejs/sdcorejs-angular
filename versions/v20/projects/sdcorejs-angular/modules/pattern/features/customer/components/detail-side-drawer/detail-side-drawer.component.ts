import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage } from '../../../../utils/api-error';
import { CustomerService } from '../../services/customer.service';
import { customerStatusBadge, customerTypeName, type CustomerDto } from '../../services/customer.model';
import { GeneralInformationViewComponent } from '../general-information-view/general-information-view.component';

/**
 * Chi tiết khách hàng trong drawer (route con `:id/detail` của danh sách). Bản ghi do resolver tải bằng
 * `detail(id)`, không lấy dữ liệu của dòng. Chỉ đóng bằng X (cùng Esc, backdrop): không có nút Đóng (E4).
 * Xoá là tác vụ hiếm dùng và phá huỷ: nút chỉ có icon màu đỏ ở header, cạnh X; footer giữ tác vụ thường dùng.
 */
@Component({
  selector: 'detail-side-drawer',
  standalone: true,
  imports: [RouterLink, SdSideDrawer, SdBadge, SdButton, SdPermissionDirective, GeneralInformationViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let customer = entity();
    <sd-side-drawer width="600px" autoId="customer-detail" (sdClosed)="closed()">
      <div sdHeaderLeft class="d-flex flex-column">
        <div class="d-flex align-items-center gap-8">
          <span class="T16M">Chi tiết khách hàng #{{ customer.code }}</span>
          <sd-badge size="md" [type]="badge().type ?? 'round'" [title]="badge().title" [color]="badge().color" />
        </div>
        <span class="T14R text-secondary">{{ typeName() }} · {{ customer.phone }}</span>
      </div>
      <sd-button
        sdHeaderRight
        *sdPermission="'PATTERN_CUSTOMER_D_DELETE'"
        prefixIcon="delete"
        tooltip="Xoá khách hàng"
        type="text"
        color="error"
        autoId="customer-delete"
        [loading]="deleting()"
        (click)="delete()" />
      <general-information-view [customer]="customer" />
      <div sdFooterRight class="d-flex align-items-center gap-8">
        <sd-button title="Hồ sơ 360°" prefixIcon="contact_page" type="outline" autoId="customer-profile" [routerLink]="['../360']" />
        <sd-button
          *sdPermission="'PATTERN_CUSTOMER_U_UPDATE'"
          title="Cập nhật khách hàng"
          prefixIcon="edit"
          type="fill"
          color="primary"
          autoId="customer-update"
          [routerLink]="['../update']" />
      </div>
    </sd-side-drawer>
  `,
})
export class DetailSideDrawerComponent {
  readonly #customerService = inject(CustomerService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  private readonly drawer = viewChild.required(SdSideDrawer);
  protected readonly entity = toSignal(this.#route.data.pipe(map(data => data['entity'] as CustomerDto)), { requireSync: true });
  protected readonly badge = computed(() => customerStatusBadge(this.entity().status));
  protected readonly typeName = computed(() => customerTypeName(this.entity().type));
  protected readonly deleting = signal(false);

  constructor() {
    afterNextRender(() => this.drawer().open());
  }

  protected closed(): void {
    // X, Esc, backdrop đều qua sdClosed; về danh sách bằng điều hướng để Back của trình duyệt cũng đóng được.
    // Sang drawer cập nhật hay hồ sơ 360° thì drawer này bị huỷ cùng route, không phát sdClosed.
    void this.#router.navigate(['../..'], { relativeTo: this.#route });
  }

  protected async delete(): Promise<void> {
    const customer = this.entity();
    try {
      await this.#confirm.confirm(`Xoá khách hàng ${customer.name}? Thao tác không hoàn tác được.`, {
        title: 'Xoá khách hàng',
        yesTitle: 'Xoá',
        noTitle: 'Không xoá',
        yesButtonColor: 'error',
      });
    } catch {
      return;
    }
    this.deleting.set(true);
    try {
      await firstValueFrom(this.#customerService.delete(customer.id));
      this.#notify.success(`Đã xoá khách hàng ${customer.name}.`);
      this.drawer().close();
    } catch (error) {
      this.#notify.error(apiErrorMessage(error, 'Không xoá được khách hàng.'));
    } finally {
      this.deleting.set(false);
    }
  }
}
