import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage } from '../../../../utils/api-error';
import { CustomerService } from '../../services/customer.service';
import { customerStatusBadge, customerTypeName, type CustomerDto } from '../../services/customer.model';
import { GeneralInformationViewComponent } from '../general-information-view/general-information-view.component';

/**
 * Chi tiết khách hàng trong drawer, mở từ mã khách hàng bằng `@if` (không đổi URL). Drawer mở ngay rồi tải bản ghi
 * bằng `detail(id)`, không lấy dữ liệu của dòng; trạng thái tải và lỗi do `sd-data-state` hiện. Chỉ đóng bằng X (cùng
 * Esc, backdrop): không có nút Đóng (E4). Xoá là tác vụ hiếm dùng và phá huỷ: nút chỉ có icon màu đỏ ở header, cạnh X;
 * footer giữ tác vụ thường dùng. Cập nhật và Hồ sơ 360° báo lên danh sách, danh sách thay drawer này.
 */
@Component({
  selector: 'detail-side-drawer',
  standalone: true,
  imports: [SdSideDrawer, SdBadge, SdButton, SdDataState, SdPermissionDirective, GeneralInformationViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let customer = entity();
    <sd-side-drawer width="600px" autoId="customer-detail" (sdClosed)="closed.emit()">
      <div sdHeaderLeft class="d-flex flex-column">
        @if (customer) {
          @let _badge = badge();
          <div class="d-flex align-items-center gap-8">
            <span class="T16M">Chi tiết khách hàng #{{ customer.code }}</span>
            <sd-badge size="md" [type]="_badge?.type ?? 'round'" [title]="_badge?.title" [color]="_badge?.color" />
          </div>
          <span class="T14R text-secondary">{{ typeName() }} · {{ customer.phone }}</span>
        } @else {
          <span class="T16M">Chi tiết khách hàng</span>
        }
      </div>
      <sd-button
        sdHeaderRight
        *sdPermission="'PATTERN_CUSTOMER_D_DELETE'"
        prefixIcon="delete"
        tooltip="Xoá khách hàng"
        type="text"
        color="error"
        autoId="customer-delete"
        [disabled]="!customer"
        [loading]="deleting()"
        (click)="delete()" />
      <sd-data-state [state]="state()" retryable (sdRetry)="load()">
        @if (customer) {
          <general-information-view [customer]="customer" />
        }
      </sd-data-state>
      <div sdFooterRight class="d-flex align-items-center gap-8">
        <sd-button title="Hồ sơ 360°" prefixIcon="contact_page" type="outline" autoId="customer-profile" (click)="profile.emit()" />
        <sd-button
          *sdPermission="'PATTERN_CUSTOMER_U_UPDATE'"
          title="Cập nhật khách hàng"
          prefixIcon="edit"
          type="fill"
          color="primary"
          autoId="customer-update"
          (click)="update.emit()" />
      </div>
    </sd-side-drawer>
  `,
})
export class DetailSideDrawerComponent implements OnInit {
  readonly #customerService = inject(CustomerService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly id = input.required<string>();
  /** Người dùng chọn Cập nhật: danh sách thay drawer này bằng drawer cập nhật, không chồng hai lớp. */
  readonly update = output<void>();
  /** Người dùng chọn Hồ sơ 360°: danh sách đóng drawer này và mở trang hồ sơ. */
  readonly profile = output<void>();
  /** Drawer đã đóng (X, Esc, backdrop hoặc xoá xong): danh sách gỡ drawer khỏi màn. */
  readonly closed = output<void>();
  private readonly drawer = viewChild.required(SdSideDrawer);
  protected readonly state = signal<'loading' | 'error' | 'success'>('loading');
  protected readonly entity = signal<CustomerDto | null>(null);
  protected readonly badge = computed(() => {
    const customer = this.entity();
    return customer ? customerStatusBadge(customer.status) : null;
  });
  protected readonly typeName = computed(() => {
    const customer = this.entity();
    return customer ? customerTypeName(customer.type) : '';
  });
  protected readonly deleting = signal(false);

  constructor() {
    afterNextRender(() => this.drawer().open());
  }

  ngOnInit(): void {
    void this.load();
  }

  /** Tải bản ghi bằng `detail(id)`, không dùng object của dòng; lỗi hiện trong drawer kèm nút thử lại. */
  protected async load(): Promise<void> {
    this.state.set('loading');
    try {
      this.entity.set(await firstValueFrom(this.#customerService.detail(this.id()).pipe(timeout(10_000))));
      this.state.set('success');
    } catch {
      this.state.set('error');
    }
  }

  protected async delete(): Promise<void> {
    const customer = this.entity();
    if (!customer) return;
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
