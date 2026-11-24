import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { ActivityViewComponent } from '../../components/activity-view/activity-view.component';
import { DebtsViewComponent } from '../../components/debts-view/debts-view.component';
import { DocumentsViewComponent } from '../../components/documents-view/documents-view.component';
import { OrdersViewComponent } from '../../components/orders-view/orders-view.component';
import { OverviewComponent } from '../../components/overview/overview.component';
import { OverviewAsideComponent } from '../../components/overview/overview-aside.component';
import { UpdateSideDrawerComponent } from '../../components/update-side-drawer/update-side-drawer.component';
import { customerResource } from '../../services/customer-resource';
import { customerStatusBadge, customerTypeName, type CustomerDto } from '../../services/customer.model';
import { CustomerService } from '../../services/customer.service';

const TABS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'debts', label: 'Công nợ' },
  { key: 'documents', label: 'Tài liệu' },
  { key: 'activity', label: 'Hoạt động' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

@Component({
  selector: 'profile',
  standalone: true,
  imports: [
    SdPageComponent,
    SdButton,
    SdTabGroup,
    SdTab,
    SdPermissionDirective,
    OverviewComponent,
    OverviewAsideComponent,
    OrdersViewComponent,
    DebtsViewComponent,
    DocumentsViewComponent,
    ActivityViewComponent,
    UpdateSideDrawerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #service = inject(CustomerService);
  private readonly overview = viewChild(OverviewComponent);
  private readonly activity = viewChild(ActivityViewComponent);
  readonly #canReadDebt = inject(SdPermissionService).hasPermission('PATTERN_CUSTOMER_R_DEBTS');
  protected readonly tabs = TABS.filter(tab => tab.key !== 'debts' || this.#canReadDebt);

  readonly #resolved = toSignal(this.#route.data.pipe(map(data => data['entity'] as CustomerDto)), { requireSync: true });
  protected readonly entity = linkedSignal(this.#resolved);
  readonly #id = computed(() => this.entity().id);
  protected readonly summary = customerResource(this.#id, id => this.#service.summary(id));
  protected readonly metrics = computed(() =>
    !this.summary.error() && !this.summary.isLoading() && this.summary.hasValue() ? this.summary.value() : undefined
  );
  protected readonly updating = signal(false);
  protected readonly badges = computed(() => [customerStatusBadge(this.entity().status)]);
  protected readonly typeName = computed(() => customerTypeName(this.entity().type));
  readonly #tabParam = toSignal(this.#route.queryParamMap.pipe(map(params => params.get('tab'))), { requireSync: true });
  protected readonly tabIndex = computed(() =>
    Math.max(
      0,
      this.tabs.findIndex(tab => tab.key === this.#tabParam())
    )
  );
  protected readonly activeTab = computed(() => this.tabs[this.tabIndex()].key);
  /** Include direct links and browser history in the cache; a new customer starts with only the active tab. */
  protected readonly opened = linkedSignal<{ id: string; tab: TabKey }, ReadonlySet<TabKey>>({
    source: () => ({ id: this.#id(), tab: this.activeTab() }),
    computation: ({ id, tab }, previous) => new Set([...(previous?.source.id === id ? previous.value : []), tab]),
  });

  protected selectTab(index: number): void {
    const key = this.tabs[index]?.key;
    if (!key || key === this.activeTab()) return;
    void this.#router.navigate([], {
      relativeTo: this.#route,
      queryParams: { tab: key === 'overview' ? null : key },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected saved(customer: CustomerDto): void {
    this.entity.set(customer);
    this.summary.reload();
    this.overview()?.reloadActivity();
    this.activity()?.activities.reload();
  }
}
