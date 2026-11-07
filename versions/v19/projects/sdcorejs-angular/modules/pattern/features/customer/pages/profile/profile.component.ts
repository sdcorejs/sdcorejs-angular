import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import { DebtsViewComponent } from '../../components/debts-view/debts-view.component';
import { DocumentsViewComponent } from '../../components/documents-view/documents-view.component';
import { GeneralInformationViewComponent } from '../../components/general-information-view/general-information-view.component';
import { OrdersViewComponent } from '../../components/orders-view/orders-view.component';
import { UpdateSideDrawerComponent } from '../../components/update-side-drawer/update-side-drawer.component';
import { customerStatusBadge, customerTypeName, type CustomerDto } from '../../services/customer.model';

const TABS = [
  { key: 'info', label: 'Thông tin' },
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'debts', label: 'Công nợ' },
  { key: 'documents', label: 'Tài liệu' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

/**
 * Hồ sơ 360° (`:id/360`): thông tin chung và các quan hệ của khách hàng theo tab. Tab ghi trên URL (`?tab=`);
 * mở tab nào mới tải tab đó, mỗi tab tự có trạng thái đang tải, rỗng và lỗi. Cập nhật mở drawer ngay trên hồ sơ,
 * không đổi URL; lưu xong hồ sơ hiện bản ghi mới.
 */
@Component({
  selector: 'profile',
  standalone: true,
  imports: [
    SdPageComponent,
    SdButton,
    SdTabGroup,
    SdTab,
    SdPermissionDirective,
    GeneralInformationViewComponent,
    OrdersViewComponent,
    DebtsViewComponent,
    DocumentsViewComponent,
    UpdateSideDrawerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let customer = entity();
    <sd-page-detail
      [title]="'Hồ sơ khách hàng #' + customer.code"
      [description]="customer.name + ' · ' + typeName()"
      [badges]="badges()"
      [backLink]="['../..']">
      <sd-button
        headerRight
        *sdPermission="'PATTERN_CUSTOMER_U_UPDATE'"
        title="Cập nhật khách hàng"
        prefixIcon="edit"
        type="fill"
        color="primary"
        autoId="customer-profile-update"
        (click)="updating.set(true)" />
      <sd-tab-group sdSubheader [selectedIndex]="tabIndex()" (selectedIndexChange)="selectTab($event)">
        @for (tab of tabs; track tab.key) {
          <sd-tab [label]="tab.label" />
        }
      </sd-tab-group>
      <div class="py-16">
        @for (tab of tabs; track tab.key; let index = $index) {
          @if (opened().has(tab.key)) {
            <div [hidden]="tabIndex() !== index" [attr.data-customer-tab]="tab.key">
              @switch (tab.key) {
                @case ('info') {
                  <general-information-view [customer]="customer" />
                }
                @case ('orders') {
                  <orders-view [customerId]="customer.id" />
                }
                @case ('debts') {
                  <debts-view [customerId]="customer.id" />
                }
                @case ('documents') {
                  <documents-view [customerId]="customer.id" />
                }
              }
            </div>
          }
        }
      </div>
    </sd-page-detail>
    @if (updating()) {
      <update-side-drawer [id]="customer.id" (saved)="entity.set($event)" (closed)="updating.set(false)" />
    }
  `,
})
export class ProfileComponent {
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  protected readonly tabs = TABS;
  readonly #resolved = toSignal(this.#route.data.pipe(map(data => data['entity'] as CustomerDto)), { requireSync: true });
  /** Bản ghi do resolver tải; lưu ở drawer cập nhật thì thay bằng bản ghi API trả về, không tải lại cả trang. */
  protected readonly entity = linkedSignal(() => this.#resolved());
  readonly #id = computed(() => this.entity().id);
  protected readonly updating = signal(false);
  protected readonly badges = computed(() => [customerStatusBadge(this.entity().status)]);
  protected readonly typeName = computed(() => customerTypeName(this.entity().type));
  readonly #tabParam = toSignal(this.#route.queryParamMap.pipe(map(params => params.get('tab'))), { requireSync: true });
  protected readonly tabIndex = computed(() =>
    Math.max(
      0,
      TABS.findIndex(tab => tab.key === this.#tabParam())
    )
  );
  /** Tab đã mở ít nhất một lần: giữ lại khi chuyển tab, không tải lại. Đổi khách hàng thì bắt đầu lại. */
  protected readonly opened = linkedSignal<string, ReadonlySet<TabKey>>({
    source: this.#id,
    // untracked: đổi tab không được đặt lại các tab đã mở; chỉ đổi khách hàng mới bắt đầu lại.
    computation: () => new Set<TabKey>([TABS[untracked(this.tabIndex)].key]),
  });

  protected selectTab(index: number): void {
    const key = TABS[index]?.key ?? 'info';
    this.opened.update(opened => new Set([...opened, key]));
    void this.#router.navigate([], {
      relativeTo: this.#route,
      queryParams: { tab: key === 'info' ? null : key },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
