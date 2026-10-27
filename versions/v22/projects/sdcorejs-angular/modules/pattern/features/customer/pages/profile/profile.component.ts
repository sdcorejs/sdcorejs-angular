import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import { DebtsViewComponent } from '../../components/debts-view/debts-view.component';
import { DocumentsViewComponent } from '../../components/documents-view/documents-view.component';
import { GeneralInformationViewComponent } from '../../components/general-information-view/general-information-view.component';
import { OrdersViewComponent } from '../../components/orders-view/orders-view.component';
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
 * mở tab nào mới tải tab đó, mỗi tab tự có trạng thái đang tải, rỗng và lỗi.
 */
@Component({
  selector: 'profile',
  standalone: true,
  imports: [
    RouterLink,
    SdPageComponent,
    SdButton,
    SdTabGroup,
    SdTab,
    SdPermissionDirective,
    GeneralInformationViewComponent,
    OrdersViewComponent,
    DebtsViewComponent,
    DocumentsViewComponent,
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
        [routerLink]="['../update']" />
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
  `,
})
export class ProfileComponent {
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  protected readonly tabs = TABS;
  protected readonly entity = toSignal(this.#route.data.pipe(map(data => data['entity'] as CustomerDto)), { requireSync: true });
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
  protected readonly opened = linkedSignal<CustomerDto, ReadonlySet<TabKey>>({
    source: this.entity,
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
