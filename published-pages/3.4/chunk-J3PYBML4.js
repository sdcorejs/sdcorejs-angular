import"./chunk-ZJ3UP5H2.js";var n={"docs/detail.md":`# Detail

Xem m\u1ED9t b\u1EA3n ghi: \`sd-page-detail\`. Route m\u1EABu: \`/pattern/product/:id/detail\` (section v\xE0 \`sd-view\`), \`/pattern/order/:id/detail\` (workflow duy\u1EC7t, c\u1ED9t ph\u1EE5 quy tr\xECnh), \`/pattern/customer/:id/360\` (h\u1ED3 s\u01A1 nhi\u1EC1u tab).

## Khi n\xE0o d\xF9ng / khi n\xE0o kh\xF4ng

- D\xF9ng khi b\u1EA3n ghi c\xF3 nhi\u1EC1u nh\xF3m th\xF4ng tin, quan h\u1EC7 ho\u1EB7c t\xE1c v\u1EE5 nghi\u1EC7p v\u1EE5.
- B\u1EA3n ghi ng\u1EAFn, xem nhanh ngay tr\xEAn danh s\xE1ch: d\xF9ng drawer chi ti\u1EBFt ([drawer](drawer.md)).
- Nhi\u1EC1u tab, b\u1EA3ng quan h\u1EC7 l\u1EDBn (h\u1ED3 s\u01A1 360\xB0): lu\xF4n l\xE0 trang, kh\xF4ng \u0111\u1EB7t v\xE0o drawer.

## Code m\u1EABu

B\u1EA3n ghi do resolver t\u1EA3i tr\u01B0\u1EDBc khi m\u1EDF trang; trang nh\u1EADn b\u1EA3n ghi qua \`ActivatedRoute.data\`, kh\xF4ng g\u1ECDi l\u1EA1i API ch\xEDnh.

<!-- @source features/product/entity.resolver.ts -->
\`\`\`ts
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { map, timeout } from 'rxjs';
import { ProductService } from './services/product.service';
import type { ProductDto } from './services/product.model';

/** T\u1EA3i s\u1EA3n ph\u1EA9m tr\u01B0\u1EDBc khi m\u1EDF detail/update; l\u1ED7i (404, 403, timeout) \u0111i t\u1EDBi navigation error handler c\u1EE7a host. */
export const entityResolver: ResolveFn<ProductDto> = route => {
  const id = route.paramMap.get('id');
  if (!id?.trim()) throw new HttpErrorResponse({ status: 404 });
  return inject(ProductService)
    .detail(id)
    .pipe(
      timeout(10_000),
      map(entity => {
        if (!entity || entity.id !== id) throw new HttpErrorResponse({ status: 404 });
        return entity;
      })
    );
};
\`\`\`

<!-- @source features/product/pages/detail/detail.component.ts -->
\`\`\`ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { PRODUCT_STATUS_OPTIONS, productStatusBadge, type ProductDto } from '../../services/product.model';

@Component({
  selector: 'detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SdPageComponent, SdButton, SdSection, SdView, SdPermissionDirective, SdFormatNumberPipe],
  template: \`
    @let product = entity();
    <sd-page-detail [title]="'Chi ti\u1EBFt s\u1EA3n ph\u1EA9m #' + product.code" [description]="product.name" [badges]="badges()" [backLink]="['../..']">
      <sd-button
        headerRight
        *sdPermission="'PATTERN_PRODUCT_U_UPDATE'"
        title="C\u1EADp nh\u1EADt s\u1EA3n ph\u1EA9m"
        prefixIcon="edit"
        type="fill"
        color="primary"
        autoId="product-update"
        [routerLink]="['../update']" />
      <div class="d-flex flex-column gap-16 py-16">
        <sd-section title="Th\xF4ng tin chung">
          <div class="row p-8">
            <div class="col-12 col-md-6 p-8"><sd-view label="M\xE3 s\u1EA3n ph\u1EA9m" [display]="product.code" /></div>
            <div class="col-12 col-md-6 p-8"><sd-view label="T\xEAn s\u1EA3n ph\u1EA9m" [display]="product.name" /></div>
            <div class="col-12 col-md-6 p-8"><sd-view label="Tr\u1EA1ng th\xE1i" [display]="statusName()" /></div>
          </div>
        </sd-section>
        <sd-section title="Gi\xE1 b\xE1n">
          <div class="row p-8">
            <div class="col-12 col-md-6 p-8"><sd-view label="Gi\xE1 b\xE1n (\u20AB)" [display]="product.price | sdFormatNumber: 0" /></div>
            <div class="col-12 col-md-6 p-8"><sd-view label="\u0110\u01A1n v\u1ECB t\xEDnh" [display]="product.unit" /></div>
          </div>
        </sd-section>
      </div>
    </sd-page-detail>
  \`,
})
export class DetailComponent {
  /** S\u1EA3n ph\u1EA9m do resolver t\u1EA3i tr\u01B0\u1EDBc khi m\u1EDF trang; \u0111\u1ED5i ID th\xEC nh\u1EADn b\u1EA3n ghi m\u1EDBi. */
  protected readonly entity = toSignal(inject(ActivatedRoute).data.pipe(map(data => data['entity'] as ProductDto)), { requireSync: true });
  protected readonly badges = computed(() => [productStatusBadge(this.entity().status)]);
  protected readonly statusName = computed(() => PRODUCT_STATUS_OPTIONS.find(option => option.id === this.entity().status)?.name);
}
\`\`\`

H\u1ED3 s\u01A1 360\xB0: tab trong \`sdSubheader\`, tab ghi tr\xEAn URL, m\u1EDF tab n\xE0o m\u1EDBi t\u1EA3i tab \u0111\xF3:

<!-- @source features/customer/pages/profile/profile.component.ts -->
\`\`\`ts
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
  { key: 'info', label: 'Th\xF4ng tin' },
  { key: 'orders', label: '\u0110\u01A1n h\xE0ng' },
  { key: 'debts', label: 'C\xF4ng n\u1EE3' },
  { key: 'documents', label: 'T\xE0i li\u1EC7u' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

/**
 * H\u1ED3 s\u01A1 360\xB0 (\`:id/360\`): th\xF4ng tin chung v\xE0 c\xE1c quan h\u1EC7 c\u1EE7a kh\xE1ch h\xE0ng theo tab. Tab ghi tr\xEAn URL (\`?tab=\`);
 * m\u1EDF tab n\xE0o m\u1EDBi t\u1EA3i tab \u0111\xF3, m\u1ED7i tab t\u1EF1 c\xF3 tr\u1EA1ng th\xE1i \u0111ang t\u1EA3i, r\u1ED7ng v\xE0 l\u1ED7i.
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
  template: \`
    @let customer = entity();
    <sd-page-detail
      [title]="'H\u1ED3 s\u01A1 kh\xE1ch h\xE0ng #' + customer.code"
      [description]="customer.name + ' \xB7 ' + typeName()"
      [badges]="badges()"
      [backLink]="['../..']">
      <sd-button
        headerRight
        *sdPermission="'PATTERN_CUSTOMER_U_UPDATE'"
        title="C\u1EADp nh\u1EADt kh\xE1ch h\xE0ng"
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
  \`,
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
  /** Tab \u0111\xE3 m\u1EDF \xEDt nh\u1EA5t m\u1ED9t l\u1EA7n: gi\u1EEF l\u1EA1i khi chuy\u1EC3n tab, kh\xF4ng t\u1EA3i l\u1EA1i. \u0110\u1ED5i kh\xE1ch h\xE0ng th\xEC b\u1EAFt \u0111\u1EA7u l\u1EA1i. */
  protected readonly opened = linkedSignal<CustomerDto, ReadonlySet<TabKey>>({
    source: this.entity,
    // untracked: \u0111\u1ED5i tab kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EB7t l\u1EA1i c\xE1c tab \u0111\xE3 m\u1EDF; ch\u1EC9 \u0111\u1ED5i kh\xE1ch h\xE0ng m\u1EDBi b\u1EAFt \u0111\u1EA7u l\u1EA1i.
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
\`\`\`

## Quy t\u1EAFc

- MUST \u0111\u1EB7t title "Chi ti\u1EBFt <entity> #<m\xE3>", badge tr\u1EA1ng th\xE1i c\u1EA1nh title qua \`[badges]\` (t\u1ED1i \u0111a hai: tr\u1EA1ng th\xE1i tr\u01B0\u1EDBc, thu\u1ED9c t\xEDnh sau), m\xF4 t\u1EA3 ng\u1EAFn \u1EDF d\xF2ng th\u1EE9 hai. Kh\xF4ng thay c\u1EA3 v\xF9ng tr\xE1i b\u1EB1ng \`headerLeft\` ch\u1EC9 \u0111\u1EC3 th\xEAm n\xFAt \u2190: d\xF9ng \`backLink\` (E2).
- MUST t\u1EA3i b\u1EA3n ghi b\u1EB1ng resolver g\u1ECDi \`detail(id)\` c\u1EE7a service s\u1EDF h\u1EEFu entity; l\u1ED7i (404, 403, timeout) \u0111\u1EC3 navigation error handler c\u1EE7a host x\u1EED l\xFD, kh\xF4ng m\u1EDF trang v\u1EDBi b\u1EA3n ghi r\u1ED7ng.
- MUST nh\u1EADn b\u1EA3n ghi m\u1EDBi khi \u0111\u1ED5i ID (\`runGuardsAndResolvers: 'paramsChange'\`, \u0111\u1ECDc \`data\` d\u1EA1ng signal).
- MUST \u0111\u1EB7t n\xFAt ch\xEDnh "C\u1EADp nh\u1EADt <entity>" (\`type="fill"\`) \u1EDF \`headerRight\`; t\u1ED1i \u0111a ba t\xE1c v\u1EE5 c\u1EA5p ngo\xE0i, t\u1EEB t\xE1c v\u1EE5 th\u1EE9 ba gom v\xE0o Action Popover ([header-actions](header-actions.md)).
- MUST hi\u1EC7n t\xE1c v\u1EE5 theo quy\u1EC1n (\`*sdPermission\`) v\xE0 theo tr\u1EA1ng th\xE1i nghi\u1EC7p v\u1EE5 (computed trong TS); quy\u1EC1n xem kh\xF4ng suy ra quy\u1EC1n c\u1EADp nh\u1EADt.
- SHOULD chia th\xF4ng tin theo \`sd-section\`; trong section d\xF9ng \`sd-view\` cho field ng\u1EAFn ho\u1EB7c \`sd-section-item\` cho d\u1EA1ng thu\u1ED9c t\xEDnh.
- SHOULD d\xF9ng \`sdAside\` cho th\xF4ng tin ph\u1EE5 (quy tr\xECnh duy\u1EC7t, ng\u01B0\u1EDDi ph\u1EE5 tr\xE1ch); d\u01B0\u1EDBi 1200px c\u1ED9t ph\u1EE5 xu\u1ED1ng d\u01B0\u1EDBi th\xE2n.

## L\u1ED7i hay g\u1EB7p

- G\u1ECDi API t\u1EA3i b\u1EA3n ghi trong \`ngOnInit\` c\u1EE7a trang: trang m\u1EDF tr\u01B0\u1EDBc khi c\xF3 d\u1EEF li\u1EC7u, l\u1ED7i 404 hi\u1EC7n th\xE0nh trang tr\u1ED1ng.
- Hi\u1EC7n ID quan h\u1EC7 thay v\xEC t\xEAn: d\xF9ng pipe [relation](relation.md).
- T\u1EA3i m\u1ECDi tab c\u1EE7a h\u1ED3 s\u01A1 360\xB0 ngay khi m\u1EDF trang: ch\u1EADm v\xE0 t\u1ED1n request cho tab ng\u01B0\u1EDDi d\xF9ng kh\xF4ng xem.
`,"docs/drawer.md":`# Drawer

Xem, t\u1EA1o, c\u1EADp nh\u1EADt ngay tr\xEAn danh s\xE1ch: \`sd-side-drawer\` trong route con c\u1EE7a danh s\xE1ch. Route m\u1EABu: \`/pattern/customer/create\`, \`/pattern/customer/:id/detail\`, \`/pattern/customer/:id/update\`, \`/pattern/category/create?parent=\`, \`/pattern/category/:id/update\`, chi ti\u1EBFt \u0111\u01A1n h\xE0ng m\u1EB7c \u0111\u1ECBnh c\u1EE7a \`/pattern/order\`.

## Khi n\xE0o d\xF9ng / khi n\xE0o kh\xF4ng

- D\xF9ng khi ng\u01B0\u1EDDi d\xF9ng c\u1EA7n gi\u1EEF ng\u1EEF c\u1EA3nh danh s\xE1ch: xem nhanh, s\u1EEDa v\xE0i field, t\u1EA1o b\u1EA3n ghi con.
- Nhi\u1EC1u tab, b\u1EA3ng quan h\u1EC7 l\u1EDBn, form nhi\u1EC1u b\u01B0\u1EDBc ho\u1EB7c r\u1ED9ng h\u01A1n 800px: d\xF9ng trang ([detail](detail.md), [form](form.md)).

## Code m\u1EABu

Chi ti\u1EBFt trong drawer: b\u1EA3n ghi t\u1EA3i b\u1EB1ng \`detail(id)\` qua resolver, footer c\xF3 H\u1ED3 s\u01A1 360\xB0 v\xE0 C\u1EADp nh\u1EADt, Xo\xE1 l\xE0 icon \u0111\u1ECF c\u1EA1nh X, \u0111\xF3ng b\u1EB1ng X \u0111i\u1EC1u h\u01B0\u1EDBng v\u1EC1 danh s\xE1ch:

<!-- @source features/customer/components/detail-side-drawer/detail-side-drawer.component.ts -->
\`\`\`ts
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
 * Chi ti\u1EBFt kh\xE1ch h\xE0ng trong drawer (route con \`:id/detail\` c\u1EE7a danh s\xE1ch). B\u1EA3n ghi do resolver t\u1EA3i b\u1EB1ng
 * \`detail(id)\`, kh\xF4ng l\u1EA5y d\u1EEF li\u1EC7u c\u1EE7a d\xF2ng. Ch\u1EC9 \u0111\xF3ng b\u1EB1ng X (c\xF9ng Esc, backdrop): kh\xF4ng c\xF3 n\xFAt \u0110\xF3ng (E4).
 * Xo\xE1 l\xE0 t\xE1c v\u1EE5 hi\u1EBFm d\xF9ng v\xE0 ph\xE1 hu\u1EF7: n\xFAt ch\u1EC9 c\xF3 icon m\xE0u \u0111\u1ECF \u1EDF header, c\u1EA1nh X; footer gi\u1EEF t\xE1c v\u1EE5 th\u01B0\u1EDDng d\xF9ng.
 */
@Component({
  selector: 'detail-side-drawer',
  standalone: true,
  imports: [RouterLink, SdSideDrawer, SdBadge, SdButton, SdPermissionDirective, GeneralInformationViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @let customer = entity();
    <sd-side-drawer width="600px" autoId="customer-detail" (sdClosed)="closed()">
      <div sdHeaderLeft class="d-flex flex-column">
        <div class="d-flex align-items-center gap-8">
          <span class="T16M">Chi ti\u1EBFt kh\xE1ch h\xE0ng #{{ customer.code }}</span>
          <sd-badge size="md" [type]="badge().type ?? 'round'" [title]="badge().title" [color]="badge().color" />
        </div>
        <span class="T14R text-secondary">{{ typeName() }} \xB7 {{ customer.phone }}</span>
      </div>
      <sd-button
        sdHeaderRight
        *sdPermission="'PATTERN_CUSTOMER_D_DELETE'"
        prefixIcon="delete"
        tooltip="Xo\xE1 kh\xE1ch h\xE0ng"
        type="text"
        color="error"
        autoId="customer-delete"
        [loading]="deleting()"
        (click)="delete()" />
      <general-information-view [customer]="customer" />
      <div sdFooterRight class="d-flex align-items-center gap-8">
        <sd-button title="H\u1ED3 s\u01A1 360\xB0" prefixIcon="contact_page" type="outline" autoId="customer-profile" [routerLink]="['../360']" />
        <sd-button
          *sdPermission="'PATTERN_CUSTOMER_U_UPDATE'"
          title="C\u1EADp nh\u1EADt kh\xE1ch h\xE0ng"
          prefixIcon="edit"
          type="fill"
          color="primary"
          autoId="customer-update"
          [routerLink]="['../update']" />
      </div>
    </sd-side-drawer>
  \`,
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
    // X, Esc, backdrop \u0111\u1EC1u qua sdClosed; v\u1EC1 danh s\xE1ch b\u1EB1ng \u0111i\u1EC1u h\u01B0\u1EDBng \u0111\u1EC3 Back c\u1EE7a tr\xECnh duy\u1EC7t c\u0169ng \u0111\xF3ng \u0111\u01B0\u1EE3c.
    // Sang drawer c\u1EADp nh\u1EADt hay h\u1ED3 s\u01A1 360\xB0 th\xEC drawer n\xE0y b\u1ECB hu\u1EF7 c\xF9ng route, kh\xF4ng ph\xE1t sdClosed.
    void this.#router.navigate(['../..'], { relativeTo: this.#route });
  }

  protected async delete(): Promise<void> {
    const customer = this.entity();
    try {
      await this.#confirm.confirm(\`Xo\xE1 kh\xE1ch h\xE0ng \${customer.name}? Thao t\xE1c kh\xF4ng ho\xE0n t\xE1c \u0111\u01B0\u1EE3c.\`, {
        title: 'Xo\xE1 kh\xE1ch h\xE0ng',
        yesTitle: 'Xo\xE1',
        noTitle: 'Kh\xF4ng xo\xE1',
        yesButtonColor: 'error',
      });
    } catch {
      return;
    }
    this.deleting.set(true);
    try {
      await firstValueFrom(this.#customerService.delete(customer.id));
      this.#notify.success(\`\u0110\xE3 xo\xE1 kh\xE1ch h\xE0ng \${customer.name}.\`);
      this.drawer().close();
    } catch (error) {
      this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng xo\xE1 \u0111\u01B0\u1EE3c kh\xE1ch h\xE0ng.'));
    } finally {
      this.deleting.set(false);
    }
  }
}
\`\`\`

C\u1EADp nh\u1EADt trong drawer: \`beforeClose\` h\u1ECFi tr\u01B0\u1EDBc khi b\u1ECF thay \u0111\u1ED5i, l\u01B0u xong \u0111\xF3ng drawer, danh s\xE1ch t\u1EA3i l\u1EA1i, focus tr\u1EDF v\u1EC1 d\xF2ng:

<!-- @source features/customer/components/update-side-drawer/update-side-drawer.component.ts -->
\`\`\`ts
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import { CustomerService } from '../../services/customer.service';
import type { CustomerDto } from '../../services/customer.model';
import {
  customerSaveReq,
  GeneralInformationFormComponent,
  invalidCustomerGroups,
  type CustomerForm,
  type CustomerFormGroup,
} from '../general-information-form/general-information-form.component';

/**
 * C\u1EADp nh\u1EADt kh\xE1ch h\xE0ng trong drawer (route con \`:id/update\`). X, Esc v\xE0 backdrop \u0111i qua \`beforeClose\`: c\xF2n thay \u0111\u1ED5i
 * th\xEC h\u1ECFi tr\u01B0\u1EDBc khi b\u1ECF. L\u01B0u th\xE0nh c\xF4ng th\xEC \u0111\xF3ng drawer; danh s\xE1ch t\u1EA3i l\u1EA1i v\xE0 focus tr\u1EDF v\u1EC1 d\xF2ng \u0111\xE3 m\u1EDF.
 */
@Component({
  selector: 'update-side-drawer',
  standalone: true,
  imports: [SdSideDrawer, SdButton, GeneralInformationFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-side-drawer
      [title]="'C\u1EADp nh\u1EADt kh\xE1ch h\xE0ng #' + entity().code"
      width="600px"
      autoId="customer-update"
      [beforeClose]="beforeClose"
      (sdClosed)="closed()">
      <general-information-form [form]="form" [seed]="entity()" [errors]="apiErrors.errors()" [invalidGroups]="invalidGroups()" />
      <div sdFooterRight class="d-flex align-items-center gap-8">
        <sd-button title="L\u01B0u" prefixIcon="save" type="fill" color="primary" autoId="customer-save" [loading]="saving()" (click)="save()" />
      </div>
    </sd-side-drawer>
  \`,
})
export class UpdateSideDrawerComponent {
  readonly #customerService = inject(CustomerService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #injector = inject(Injector);
  private readonly drawer = viewChild.required(SdSideDrawer);
  // why: sd-side-drawer chuy\u1EC3n n\u1ED9i dung ra body, n\xEAn t\xECm field l\u1ED7i trong form ch\u1EE9 kh\xF4ng trong host c\u1EE7a component.
  private readonly formElement = viewChild.required(GeneralInformationFormComponent, { read: ElementRef });
  protected readonly entity = toSignal(this.#route.data.pipe(map(data => data['entity'] as CustomerDto)), { requireSync: true });
  protected readonly form: CustomerForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  protected readonly invalidGroups = signal<CustomerFormGroup[]>([]);
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'customer-update', dirty: 'value' });

  /** \u0110\xF3ng khi c\xF2n thay \u0111\u1ED5i ch\u01B0a l\u01B0u: h\u1ECFi, \u0111\u1ED3ng \xFD th\xEC b\u1ECF thay \u0111\u1ED5i (guard r\u1EDDi route kh\xF4ng h\u1ECFi l\u1EA1i). */
  protected readonly beforeClose = async (): Promise<boolean> => {
    if (!this.#unsaved.dirty() || this.saving()) return !this.saving();
    try {
      await this.#confirm.confirm('Thay \u0111\u1ED5i ch\u01B0a l\u01B0u s\u1EBD b\u1ECB m\u1EA5t.', {
        title: '\u0110\xF3ng khi ch\u01B0a l\u01B0u?',
        yesTitle: 'B\u1ECF thay \u0111\u1ED5i',
        noTitle: 'Ti\u1EBFp t\u1EE5c s\u1EEDa',
        yesButtonColor: 'warning',
      });
    } catch {
      return false;
    }
    this.#unsaved.markPristine();
    return true;
  };

  constructor() {
    afterNextRender(() => this.drawer().open());
    inject(DestroyRef).onDestroy(() => this.#unsaved.destroy());
  }

  protected closed(): void {
    void this.#router.navigate(['../..'], { relativeTo: this.#route });
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.#showErrors();
      return;
    }
    this.saving.set(true);
    try {
      await firstValueFrom(this.#customerService.update(this.entity().id, customerSaveReq(this.form)));
      this.#unsaved.markPristine();
      this.#notify.success('\u0110\xE3 c\u1EADp nh\u1EADt kh\xE1ch h\xE0ng.');
      this.saving.set(false);
      this.drawer().close();
    } catch (error) {
      if (this.apiErrors.set(error)) this.#showErrors();
      else this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng th\u1EC3 l\u01B0u. D\u1EEF li\u1EC7u \u0111\xE3 nh\u1EADp v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF.'));
    } finally {
      this.saving.set(false);
    }
  }

  /** \`sd-inform\` trong t\u1EEBng nh\xF3m c\xF3 l\u1ED7i, r\u1ED3i focus field l\u1ED7i \u0111\u1EA7u ti\xEAn. */
  #showErrors(): void {
    this.invalidGroups.set(invalidCustomerGroups(this.form, this.apiErrors.errors()));
    afterNextRender(() => focusFirstInvalid(this.formElement().nativeElement), { injector: this.#injector });
  }
}
\`\`\`

Form ba nh\xF3m, nh\xF3m c\xF2n l\u1ED7i c\xF3 \`sd-inform\` c\u1EA3nh b\xE1o ngay trong nh\xF3m:

<!-- @source features/customer/components/general-information-form/general-information-form.component.ts -->
\`\`\`ts
import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import type { FormControl, FormGroup } from '@angular/forms';
import { SdInform } from '@sdcorejs/angular/components/inform';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdSwitch } from '@sdcorejs/angular/forms/switch';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import type { CustomerSaveReq, CustomerStatus, CustomerTier, CustomerType } from '../../services/customer.model';
import { CustomerTypeSelectComponent } from '../customer-type-select/customer-type-select.component';

/** C\xE1c field Core t\u1EF1 \u0111\u0103ng k\xFD control qua \`[form]\` + \`name\`. */
export type CustomerForm = FormGroup<{
  name?: FormControl<string>;
  type?: FormControl<CustomerType>;
  taxCode?: FormControl<string | null>;
  vip?: FormControl<boolean>;
  email?: FormControl<string>;
  phone?: FormControl<string>;
  address?: FormControl<string>;
  active?: FormControl<boolean>;
  note?: FormControl<string | null>;
}>;

/** Ba nh\xF3m c\u1EE7a form; nh\xF3m c\xF2n l\u1ED7i sau khi b\u1EA5m L\u01B0u hi\u1EC7n \`sd-inform\` c\u1EA3nh b\xE1o ngay trong nh\xF3m. */
export type CustomerFormGroup = 'general' | 'contact' | 'other';

const GROUP_FIELDS: Readonly<Record<CustomerFormGroup, readonly string[]>> = {
  general: ['name', 'type', 'taxCode', 'vip'],
  contact: ['email', 'phone', 'address'],
  other: ['active', 'note'],
};

/** Nh\xF3m c\xF3 field kh\xF4ng h\u1EE3p l\u1EC7: field c\xF2n l\u1ED7i validate ho\u1EB7c l\u1ED7i do API tr\u1EA3 v\u1EC1. */
export function invalidCustomerGroups(form: CustomerForm, apiErrors: Readonly<Record<string, string>>): CustomerFormGroup[] {
  return (Object.keys(GROUP_FIELDS) as CustomerFormGroup[]).filter(group =>
    GROUP_FIELDS[group].some(field => form.get(field)?.invalid || !!apiErrors[field])
  );
}

/** Gi\xE1 tr\u1ECB form \u2192 request l\u01B0u. */
export function customerSaveReq(form: CustomerForm): CustomerSaveReq {
  const value = form.getRawValue();
  const type: CustomerType = value.type ?? 'individual';
  const tier: CustomerTier = value.vip ? 'vip' : 'standard';
  const status: CustomerStatus = value.active === false ? 'inactive' : 'active';
  return {
    name: value.name ?? '',
    type,
    tier,
    email: value.email ?? '',
    phone: value.phone ?? '',
    address: value.address ?? '',
    taxCode: type === 'business' ? (value.taxCode ?? null) : null,
    status,
    note: value.note || null,
  };
}

/** Form kh\xE1ch h\xE0ng ba nh\xF3m, d\xF9ng chung cho drawer t\u1EA1o m\u1EDBi v\xE0 c\u1EADp nh\u1EADt. */
@Component({
  selector: 'general-information-form',
  standalone: true,
  imports: [SdSection, SdInput, SdTextarea, SdSwitch, SdInform, CustomerTypeSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @let invalid = invalidGroups();
    <div class="d-flex flex-column gap-16">
      <sd-section title="Th\xF4ng tin chung">
        <div class="d-flex flex-column gap-8 p-16">
          @if (invalid.includes('general')) {
            <sd-inform warning description="Ki\u1EC3m tra t\xEAn v\xE0 lo\u1EA1i kh\xE1ch h\xE0ng." autoId="customer-general-warning" />
          }
          <sd-input
            label="T\xEAn kh\xE1ch h\xE0ng"
            name="name"
            autoId="customer-name"
            [form]="form()"
            [model]="seed().name"
            [inlineError]="errors()['name']"
            maxlength="120"
            required />
          <customer-type-select [form]="form()" [model]="seed().type" (modelChange)="type.set($event ?? 'individual')" />
          @if (type() === 'business') {
            <sd-input
              label="M\xE3 s\u1ED1 thu\u1EBF"
              name="taxCode"
              autoId="customer-tax-code"
              [form]="form()"
              [model]="seed().taxCode"
              [inlineError]="errors()['taxCode']"
              maxlength="14"
              required />
          }
          <sd-switch label="Kh\xE1ch VIP" name="vip" [form]="form()" [model]="seed().tier === 'vip'" />
        </div>
      </sd-section>
      <sd-section title="Li\xEAn h\u1EC7">
        <div class="d-flex flex-column gap-8 p-16">
          @if (invalid.includes('contact')) {
            <sd-inform warning description="Ki\u1EC3m tra email v\xE0 s\u1ED1 \u0111i\u1EC7n tho\u1EA1i." autoId="customer-contact-warning" />
          }
          <sd-input
            label="Email"
            name="email"
            autoId="customer-email"
            [form]="form()"
            [model]="seed().email"
            [inlineError]="errors()['email']"
            pattern="EMAIL"
            required />
          <sd-input
            label="\u0110i\u1EC7n tho\u1EA1i"
            name="phone"
            autoId="customer-phone"
            [form]="form()"
            [model]="seed().phone"
            [inlineError]="errors()['phone']"
            maxlength="15"
            required />
          <sd-input label="\u0110\u1ECBa ch\u1EC9" name="address" autoId="customer-address" [form]="form()" [model]="seed().address" maxlength="200" />
        </div>
      </sd-section>
      <sd-section title="Kh\xE1c">
        <div class="d-flex flex-column gap-8 p-16">
          <sd-switch label="\u0110ang ho\u1EA1t \u0111\u1ED9ng" name="active" [form]="form()" [model]="seed().status !== 'inactive'" />
          <sd-textarea label="Ghi ch\xFA" name="note" [form]="form()" [model]="seed().note" maxlength="500" />
        </div>
      </sd-section>
    </div>
  \`,
})
export class GeneralInformationFormComponent {
  readonly form = input.required<CustomerForm>();
  readonly seed = input.required<CustomerSaveReq>();
  /** L\u1ED7i theo field do API tr\u1EA3 v\u1EC1. */
  readonly errors = input<Readonly<Record<string, string>>>({});
  readonly invalidGroups = input<readonly CustomerFormGroup[]>([]);
  /** Lo\u1EA1i kh\xE1ch \u0111ang ch\u1ECDn: doanh nghi\u1EC7p m\u1EDBi c\xF3 m\xE3 s\u1ED1 thu\u1EBF. */
  protected readonly type = linkedSignal(() => this.seed().type);
}
\`\`\`

Route con c\u1EE7a danh s\xE1ch; \`data.detail: 'page'\` cho route m\u1EDF th\xE0nh trang thay ch\u1ED7 danh s\xE1ch:

<!-- @source features/customer/routes.ts -->
\`\`\`ts
import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { entityResolver } from './entity.resolver';
import { CustomerService } from './services/customer.service';

/**
 * Chi ti\u1EBFt, t\u1EA1o v\xE0 c\u1EADp nh\u1EADt m\u1EDF trong drawer (route con c\u1EE7a danh s\xE1ch); h\u1ED3 s\u01A1 360\xB0 l\xE0 trang thay ch\u1ED7 danh s\xE1ch
 * (\`data.detail: 'page'\`). \u0110\xF3ng drawer hay quay l\u1EA1i \u0111\u1EC1u gi\u1EEF b\u1ED9 l\u1ECDc, trang v\xE0 v\u1ECB tr\xED cu\u1ED9n c\u1EE7a danh s\xE1ch.
 */
export const routes: Routes = [
  {
    path: '',
    providers: [CustomerService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: 'Kh\xE1ch h\xE0ng',
        data: { permission: 'PATTERN_CUSTOMER_R_LIST' },
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
        children: [
          {
            path: 'create',
            data: { permission: 'PATTERN_CUSTOMER_C_CREATE' },
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () =>
              import('./components/create-side-drawer/create-side-drawer.component').then(module => module.CreateSideDrawerComponent),
          },
          {
            path: ':id/detail',
            data: { permission: 'PATTERN_CUSTOMER_R_DETAIL' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () =>
              import('./components/detail-side-drawer/detail-side-drawer.component').then(module => module.DetailSideDrawerComponent),
          },
          {
            path: ':id/update',
            data: { permission: 'PATTERN_CUSTOMER_U_UPDATE' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () =>
              import('./components/update-side-drawer/update-side-drawer.component').then(module => module.UpdateSideDrawerComponent),
          },
          {
            path: ':id/360',
            title: 'H\u1ED3 s\u01A1 kh\xE1ch h\xE0ng',
            data: { permission: 'PATTERN_CUSTOMER_R_DETAIL', detail: 'page' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () => import('./pages/profile/profile.component').then(module => module.ProfileComponent),
          },
        ],
      },
    ],
  },
];
\`\`\`

## Quy t\u1EAFc

- MUST \u0111\u1EB7t drawer trong component c\u1EE7a route con (\`create\`, \`:id/detail\`, \`:id/update\`) v\xE0 m\u1EDF khi component s\u1EB5n s\xE0ng; \`sdClosed\` \u0111i\u1EC1u h\u01B0\u1EDBng v\u1EC1 danh s\xE1ch (\`'../..'\` t\u1EEB route hai segment), n\xEAn Back c\u1EE7a tr\xECnh duy\u1EC7t c\u0169ng \u0111\xF3ng drawer.
- MUST ch\u1EC9 \u0111\xF3ng b\u1EB1ng X, Esc, backdrop (E4); kh\xF4ng c\xF3 n\xFAt \u0110\xF3ng hay Hu\u1EF7 th\u01B0\u1EDDng tr\u1EF1c.
- MUST \u0111i qua \`beforeClose\` cho m\u1ECDi \u0111\u01B0\u1EDDng \u0111\xF3ng khi c\xF2n thay \u0111\u1ED5i; \u0111\u1ED3ng \xFD b\u1ECF th\xEC \`markPristine()\` \u0111\u1EC3 guard c\u1EE7a route kh\xF4ng h\u1ECFi l\u1EA7n hai.
- MUST \u0111\u1EB7t t\xE1c v\u1EE5 th\u01B0\u1EDDng d\xF9ng \u1EDF \`sdFooterRight\`: n\xFAt ch\xEDnh (\`fill\`, c\xF3 icon) \u1EDF ngo\xE0i c\xF9ng b\xEAn ph\u1EA3i, n\xFAt ph\u1EE5 (\`outline\`) b\xEAn tr\xE1i n\xF3. M\u1EDF m\xE0n kh\xE1c (H\u1ED3 s\u01A1 360\xB0) c\u0169ng l\xE0 n\xFAt, kh\xF4ng ph\u1EA3i link.
- MUST \u0111\u1EB7t t\xE1c v\u1EE5 ph\xE1 hu\u1EF7 \xEDt d\xF9ng (Xo\xE1) \u1EDF \`sdHeaderRight\`, c\u1EA1nh X: n\xFAt ch\u1EC9 c\xF3 icon m\xE0u \u0111\u1ECF (\`type="text"\`, \`color="error"\`) v\u1EDBi \`tooltip\` l\xE0m t\xEAn, v\xE0 v\u1EABn h\u1ECFi x\xE1c nh\u1EADn (E13).
- MUST t\u1EA3i chi ti\u1EBFt b\u1EB1ng \`detail(id)\`; kh\xF4ng d\xF9ng object c\u1EE7a d\xF2ng l\xE0m d\u1EEF li\u1EC7u chi ti\u1EBFt.
- MUST ch\u1EC9 t\u1EA3i l\u1EA1i danh s\xE1ch khi l\u01B0u th\xE0nh c\xF4ng; tr\u1EA3 focus v\u1EC1 ph\u1EA7n t\u1EED \u0111\xE3 m\u1EDF drawer (\`sd-page-list\` gi\u1EEF ph\u1EA7n t\u1EED n\xE0y k\u1EC3 c\u1EA3 khi chi ti\u1EBFt chuy\u1EC3n sang c\u1EADp nh\u1EADt).
- SHOULD d\xF9ng b\u1EC1 r\u1ED9ng 600px cho chi ti\u1EBFt v\xE0 form th\u01B0\u1EDDng, 480px cho n\u1ED9i dung ng\u1EAFn, t\u1ED1i \u0111a 800px (E9).
- SHOULD t\xE1ch \`detail-side-drawer\`, \`create-side-drawer\`, \`update-side-drawer\`; d\xF9ng chung \`-form\`/\`-view\`, kh\xF4ng g\u1ED9p ba ch\u1EBF \u0111\u1ED9 v\xE0o m\u1ED9t drawer.

## L\u1ED7i hay g\u1EB7p

- Drawer m\u1EDF b\u1EB1ng method m\xE0 kh\xF4ng c\xF3 route: Back c\u1EE7a tr\xECnh duy\u1EC7t r\u1EDDi c\u1EA3 m\xE0n danh s\xE1ch, link kh\xF4ng chia s\u1EBB \u0111\u01B0\u1EE3c.
- M\u1EDF ch\u1ED3ng drawer c\u1EADp nh\u1EADt l\xEAn drawer chi ti\u1EBFt: hai l\u1EDBp backdrop, Esc ch\u1EC9 \u0111\xF3ng m\u1ED9t l\u1EDBp.
- T\u1EA3i l\u1EA1i danh s\xE1ch m\u1ED7i l\u1EA7n \u0111\xF3ng drawer: m\u1EA5t v\u1ECB tr\xED cu\u1ED9n v\xE0 l\u1EF1a ch\u1ECDn d\xF9 kh\xF4ng c\xF3 g\xEC thay \u0111\u1ED5i.
`,"docs/flow.md":`# Flow

Quy tr\xECnh nhi\u1EC1u b\u01B0\u1EDBc: \`sd-page width="narrow"\` + \`sd-stepper\` trong th\xE2n + n\xFAt b\u01B0\u1EDBc \u1EDF \`sdFooterLeft\` / \`sdFooterRight\`. Route m\u1EABu: \`/pattern/import\` (b\u1ED1n b\u01B0\u1EDBc ngang: ngu\u1ED3n, \xE1nh x\u1EA1, xem tr\u01B0\u1EDBc & xung \u0111\u1ED9t, x\xE1c nh\u1EADn), \`/pattern/partner/create\` (b\u01B0\u1EDBc d\u1ECDc, r\u1EBD nh\xE1nh theo lo\u1EA1i, ki\u1EC3m tra tr\xF9ng m\xE3, l\u01B0u nh\xE1p).

## Khi n\xE0o d\xF9ng / khi n\xE0o kh\xF4ng

- D\xF9ng khi b\u01B0\u1EDBc sau ph\u1EE5 thu\u1ED9c k\u1EBFt qu\u1EA3 b\u01B0\u1EDBc tr\u01B0\u1EDBc (\xE1nh x\u1EA1 c\u1ED9t r\u1ED3i m\u1EDBi xem tr\u01B0\u1EDBc), ho\u1EB7c khi d\u1EEF li\u1EC7u nhi\u1EC1u \u0111\u1EBFn m\u1EE9c chia b\u01B0\u1EDBc gi\xFAp ng\u01B0\u1EDDi d\xF9ng.
- C\xE1c nh\xF3m \u0111\u1ED9c l\u1EADp, nh\u1EADp theo th\u1EE9 t\u1EF1 n\xE0o c\u0169ng \u0111\u01B0\u1EE3c: d\xF9ng [form](form.md) v\u1EDBi m\u1EE5c l\u1EE5c.

## Code m\u1EABu

B\u01B0\u1EDBc ngang, m\u1ED7i b\u01B0\u1EDBc c\xF3 c\u1ED5ng (\`stepControl\`) ch\u1EC9 m\u1EDF khi b\u01B0\u1EDBc \u0111\xE3 qua ki\u1EC3m tra; b\u01B0\u1EDBc cu\u1ED1i m\u1EDBi ghi d\u1EEF li\u1EC7u:

<!-- @source features/import/pages/flow/flow.component.ts -->
\`\`\`ts
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdInform } from '@sdcorejs/angular/components/inform';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdStep, SdStepper } from '@sdcorejs/angular/components/stepper';
import { SdSegmentedComponent, type SdSegmentedItem, type SdSegmentedModel } from '@sdcorejs/angular/forms/segmented';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage } from '../../../../utils/api-error';
import { MappingFormComponent } from '../../components/mapping-form/mapping-form.component';
import { PreviewViewComponent } from '../../components/preview-view/preview-view.component';
import { ImportService } from '../../services/import.service';
import {
  guessMapping,
  IMPORT_FIELDS,
  IMPORT_SAMPLE,
  parseCsv,
  type ImportCommitRes,
  type ImportDuplicatePolicy,
  type ImportMapping,
  type ImportPreviewRowDto,
} from '../../services/import.model';

const DUPLICATES: readonly SdSegmentedItem<ImportDuplicatePolicy>[] = [
  { value: 'skip', label: 'B\u1ECF qua d\xF2ng tr\xF9ng' },
  { value: 'overwrite', label: 'Ghi \u0111\xE8 s\u1EA3n ph\u1EA9m \u0111\xE3 c\xF3' },
];

/**
 * Pattern flow ngang: \`sd-page\` h\u1EB9p + \`sd-stepper\`, n\xFAt b\u01B0\u1EDBc \u1EDF footer. B\u1ED1n b\u01B0\u1EDBc gi\u1EEF d\u1EEF li\u1EC7u khi quay l\u1EA1i; m\u1ED7i b\u01B0\u1EDBc
 * ki\u1EC3m tra \u0111i\u1EC1u ki\u1EC7n c\u1EE7a ch\xEDnh n\xF3 tr\u01B0\u1EDBc khi sang b\u01B0\u1EDBc sau, b\u01B0\u1EDBc cu\u1ED1i m\u1EDBi ghi d\u1EEF li\u1EC7u.
 */
@Component({
  selector: 'flow',
  standalone: true,
  imports: [
    RouterLink,
    SdPageComponent,
    SdStepper,
    SdStep,
    SdButton,
    SdInform,
    SdSection,
    SdSectionItem,
    SdSegmentedComponent,
    SdTextarea,
    MappingFormComponent,
    PreviewViewComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-page title="Nh\u1EADp d\u1EEF li\u1EC7u s\u1EA3n ph\u1EA9m" description="Nh\u1EADp danh m\u1EE5c s\u1EA3n ph\u1EA9m t\u1EEB t\u1EC7p CSV." [backLink]="['..']" width="narrow">
      <sd-stepper linear [(selectedIndex)]="step" animationDuration="0ms" autoId="import-steps">
        <sd-step label="Ngu\u1ED3n d\u1EEF li\u1EC7u" [stepControl]="gates[0]">
          <div class="d-flex flex-column gap-8 py-16">
            <sd-inform type="tip" description="D\xE1n n\u1ED9i dung CSV c\xF3 d\xF2ng ti\xEAu \u0111\u1EC1, ho\u1EB7c d\xF9ng d\u1EEF li\u1EC7u m\u1EABu." />
            <sd-textarea
              label="N\u1ED9i dung CSV"
              name="source"
              autoId="import-source"
              [form]="sourceForm"
              [model]="source()"
              (modelChange)="editSource($event ?? '')"
              [inlineError]="showErrors() && !rows().length ? 'C\u1EA7n \xEDt nh\u1EA5t m\u1ED9t d\xF2ng d\u1EEF li\u1EC7u d\u01B0\u1EDBi d\xF2ng ti\xEAu \u0111\u1EC1.' : undefined"
              [maxlength]="20000"
              required />
            <div>
              <sd-button title="D\xF9ng d\u1EEF li\u1EC7u m\u1EABu" type="text" prefixIcon="description" autoId="import-sample" (click)="useSample()" />
            </div>
          </div>
        </sd-step>
        <sd-step label="Nh\u1EADn di\u1EC7n & \xE1nh x\u1EA1" [stepControl]="gates[1]">
          <div class="py-16">
            <p class="T14R text-secondary mt-0">\u0110\u1ECDc \u0111\u01B0\u1EE3c {{ rows().length }} d\xF2ng, {{ columns().length }} c\u1ED9t.</p>
            <mapping-form
              [sourceColumns]="columns()"
              [mapping]="mapping()"
              [showErrors]="showErrors()"
              (mappingChange)="mapping.set($event)" />
          </div>
        </sd-step>
        <sd-step label="Xem tr\u01B0\u1EDBc & xung \u0111\u1ED9t" [stepControl]="gates[2]">
          <div class="d-flex flex-column gap-12 py-16">
            @if (preview(); as rows) {
              <p class="T14R m-0">
                {{ counts().new }} d\xF2ng m\u1EDBi \xB7 {{ counts().duplicate }} d\xF2ng tr\xF9ng m\xE3 \xB7 {{ counts().invalid }} d\xF2ng l\u1ED7i (b\u1ECF qua)
              </p>
              <preview-view [rows]="rows" />
              @if (counts().duplicate) {
                <sd-segmented
                  ariaLabel="X\u1EED l\xFD d\xF2ng tr\xF9ng"
                  autoId="import-duplicates"
                  [items]="duplicateItems"
                  [model]="duplicates()"
                  (sdChange)="setDuplicates($event)" />
              }
            } @else {
              <p class="T14R text-secondary">\u0110ang ki\u1EC3m tra d\u1EEF li\u1EC7u\u2026</p>
            }
          </div>
        </sd-step>
        <sd-step label="X\xE1c nh\u1EADn">
          <div class="py-16">
            @if (result(); as done) {
              <sd-inform
                success
                title="\u0110\xE3 nh\u1EADp d\u1EEF li\u1EC7u"
                [description]="done.created + ' s\u1EA3n ph\u1EA9m m\u1EDBi, ' + done.updated + ' c\u1EADp nh\u1EADt, ' + done.skipped + ' b\u1ECF qua.'" />
              <a class="d-inline-block mt-12" [routerLink]="['../product']">Xem danh s\xE1ch s\u1EA3n ph\u1EA9m</a>
            } @else {
              <sd-section title="T\xF3m t\u1EAFt">
                <sd-section-item label="Th\xEAm m\u1EDBi">{{ counts().new }}</sd-section-item>
                <sd-section-item label="Tr\xF9ng m\xE3"
                  >{{ counts().duplicate }} ({{ duplicates() === 'overwrite' ? 'ghi \u0111\xE8' : 'b\u1ECF qua' }})</sd-section-item
                >
                <sd-section-item label="L\u1ED7i, b\u1ECF qua">{{ counts().invalid }}</sd-section-item>
              </sd-section>
            }
          </div>
        </sd-step>
      </sd-stepper>
      <sd-button
        sdFooterLeft
        title="Quay l\u1EA1i"
        type="outline"
        autoId="import-previous"
        [disabled]="step() === 0 || !!result()"
        (click)="step.set(step() - 1)" />
      @if (step() < 3) {
        <sd-button
          sdFooterRight
          title="Ti\u1EBFp t\u1EE5c"
          type="fill"
          color="primary"
          autoId="import-next"
          [loading]="checking()"
          (click)="next()" />
      } @else if (!result()) {
        <sd-button
          sdFooterRight
          title="Nh\u1EADp d\u1EEF li\u1EC7u"
          type="fill"
          color="primary"
          autoId="import-commit"
          [loading]="committing()"
          (click)="commit()" />
      }
    </sd-page>
  \`,
})
export class FlowComponent {
  readonly #importService = inject(ImportService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  protected readonly duplicateItems = DUPLICATES;
  protected readonly step = signal(0);
  /**
   * M\u1ED9t c\u1ED5ng cho m\u1ED7i b\u01B0\u1EDBc: ch\u1EC9 \u0111\xFAng sau khi b\u01B0\u1EDBc \u0111\xF3 qua ki\u1EC3m tra, n\xEAn stepper \`linear\` kh\xF4ng cho b\u1EA5m ti\xEAu \u0111\u1EC1 \u0111\u1EC3
   * v\u01B0\u1EE3t qua b\u01B0\u1EDBc ch\u01B0a ki\u1EC3m tra. \u0110\u1ED5i ngu\u1ED3n d\u1EEF li\u1EC7u th\xEC \u0111\xF3ng l\u1EA1i c\xE1c b\u01B0\u1EDBc sau.
   */
  protected readonly gates = [0, 1, 2].map(() => new FormControl(false, { nonNullable: true, validators: Validators.requiredTrue }));
  protected readonly showErrors = signal(false);
  /** Ch\u1EC9 \u0111\u1EC3 \u0111\xE1nh d\u1EA5u \u0111\xE3 ch\u1EA1m \xF4 ngu\u1ED3n khi b\u1EA5m Ti\u1EBFp: l\u1ED7i c\u1EE7a \xF4 hi\u1EC7n ngay c\u1EA3 khi ng\u01B0\u1EDDi d\xF9ng ch\u01B0a g\xF5 g\xEC. */
  protected readonly sourceForm = new FormGroup({});
  protected readonly source = signal('');
  readonly #parsed = computed(() => parseCsv(this.source()));
  protected readonly columns = computed(() => this.#parsed().columns);
  protected readonly rows = computed(() => this.#parsed().rows);
  protected readonly mapping = signal<ImportMapping>({ code: null, name: null, unit: null, price: null });
  protected readonly preview = signal<readonly ImportPreviewRowDto[] | null>(null);
  protected readonly duplicates = signal<ImportDuplicatePolicy>('skip');
  protected readonly checking = signal(false);
  protected readonly committing = signal(false);
  protected readonly result = signal<ImportCommitRes | null>(null);
  protected readonly counts = computed(() => {
    const rows = this.preview() ?? [];
    return {
      new: rows.filter(row => row.result === 'new').length,
      duplicate: rows.filter(row => row.result === 'duplicate').length,
      invalid: rows.filter(row => row.result === 'invalid').length,
    };
  });

  protected useSample(): void {
    this.editSource(IMPORT_SAMPLE);
  }

  /** \u0110\u1ED5i ngu\u1ED3n th\xEC c\xE1c b\u01B0\u1EDBc sau ph\u1EA3i ki\u1EC3m tra l\u1EA1i. */
  protected editSource(value: string): void {
    this.source.set(value);
    this.gates.forEach(gate => gate.setValue(false));
  }

  protected setDuplicates(value: SdSegmentedModel<ImportDuplicatePolicy>): void {
    if (value === 'skip' || value === 'overwrite') this.duplicates.set(value);
  }

  protected async next(): Promise<void> {
    const step = this.step();
    if (step === 0) {
      if (!this.rows().length) {
        this.sourceForm.markAllAsTouched();
        return this.showErrors.set(true);
      }
      // Ngu\u1ED3n m\u1EDBi: \xE1nh x\u1EA1 l\u1EA1i theo t\xEAn c\u1ED9t, b\u1ECF k\u1EBFt qu\u1EA3 ki\u1EC3m tra c\u0169.
      this.mapping.set(guessMapping(this.columns()));
      this.preview.set(null);
      this.gates.slice(1).forEach(gate => gate.setValue(false));
    }
    if (step === 1) {
      const missing = IMPORT_FIELDS.some(field => field.required && !this.mapping()[field.field]);
      if (missing) return this.showErrors.set(true);
      if (!(await this.#check())) return;
    }
    this.showErrors.set(false);
    this.gates[step].setValue(true);
    this.step.set(step + 1);
  }

  protected async commit(): Promise<void> {
    const { new: created, duplicate } = this.counts();
    const overwrite = this.duplicates() === 'overwrite' ? duplicate : 0;
    try {
      await this.#confirm.confirm(\`Th\xEAm \${created} s\u1EA3n ph\u1EA9m\${overwrite ? \`, ghi \u0111\xE8 \${overwrite} s\u1EA3n ph\u1EA9m\` : ''}?\`, {
        title: 'Nh\u1EADp d\u1EEF li\u1EC7u',
        yesTitle: 'Nh\u1EADp d\u1EEF li\u1EC7u',
        noTitle: 'Kh\xF4ng',
      });
    } catch {
      return;
    }
    this.committing.set(true);
    try {
      this.result.set(await firstValueFrom(this.#importService.commit(this.#mappedRows(), this.duplicates())));
    } catch (error) {
      this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng nh\u1EADp \u0111\u01B0\u1EE3c d\u1EEF li\u1EC7u. Th\u1EED l\u1EA1i.'));
    } finally {
      this.committing.set(false);
    }
  }

  async #check(): Promise<boolean> {
    this.checking.set(true);
    try {
      this.preview.set((await firstValueFrom(this.#importService.preview(this.#mappedRows()))).rows);
      return true;
    } catch (error) {
      this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng ki\u1EC3m tra \u0111\u01B0\u1EE3c d\u1EEF li\u1EC7u. Th\u1EED l\u1EA1i.'));
      return false;
    } finally {
      this.checking.set(false);
    }
  }

  #mappedRows() {
    const mapping = this.mapping();
    return this.rows().map(row => ({
      code: mapping.code ? (row[mapping.code] ?? '') : '',
      name: mapping.name ? (row[mapping.name] ?? '') : '',
      unit: mapping.unit ? (row[mapping.unit] ?? '') : '',
      price: mapping.price ? (row[mapping.price] ?? '') : '0',
    }));
  }
}
\`\`\`

B\u01B0\u1EDBc d\u1ECDc, r\u1EBD nh\xE1nh theo lo\u1EA1i \u0111\u1ED1i t\xE1c, ki\u1EC3m tra tr\xF9ng m\xE3 khi r\u1EDDi b\u01B0\u1EDBc \u0111\u1EA7u, l\u01B0u nh\xE1p m\u1ED7i l\u1EA7n thay \u0111\u1ED5i:

<!-- @source features/partner/pages/create/create.component.ts -->
\`\`\`ts
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, merge } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdInform } from '@sdcorejs/angular/components/inform';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdStep, SdStepper } from '@sdcorejs/angular/components/stepper';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdSegmentedComponent } from '@sdcorejs/angular/forms/segmented';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdFormatDatetimePipe } from '@sdcorejs/angular/pipes';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage, apiFieldErrors } from '../../../../utils/api-error';
import { PartnerService } from '../../services/partner.service';
import { PARTNER_TYPE_OPTIONS, type PartnerSaveReq, type PartnerType } from '../../services/partner.model';

/** B\u1EA3n nh\xE1p gi\u1EEF trong tab tr\xECnh duy\u1EC7t: t\u1EA3i l\u1EA1i trang v\u1EABn ti\u1EBFp t\u1EE5c \u0111\u01B0\u1EE3c. */
interface PartnerDraft extends PartnerSaveReq {
  readonly step: number;
  readonly savedAt: string;
}

const DRAFT_KEY = 'pattern.partner.create.draft';
const EMPTY: PartnerSaveReq = {
  code: '',
  type: 'individual',
  name: '',
  identity: '',
  representative: null,
  email: '',
  phone: '',
  address: '',
};

function readDraft(): PartnerDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as PartnerDraft) : null;
  } catch {
    return null;
  }
}

function writeDraft(draft: PartnerDraft | null): void {
  try {
    if (draft) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Kh\xF4ng l\u01B0u \u0111\u01B0\u1EE3c nh\xE1p (ch\u1EBF \u0111\u1ED9 ri\xEAng t\u01B0, h\u1EBFt dung l\u01B0\u1EE3ng): flow v\u1EABn ch\u1EA1y, ch\u1EC9 kh\xF4ng kh\xF4i ph\u1EE5c sau khi t\u1EA3i l\u1EA1i.
  }
}

/**
 * Pattern flow d\u1ECDc: \`sd-page\` h\u1EB9p + \`sd-stepper\` d\u1ECDc, n\xFAt b\u01B0\u1EDBc \u1EDF footer. B\u01B0\u1EDBc 2 r\u1EBD nh\xE1nh theo lo\u1EA1i \u0111\u1ED1i t\xE1c; r\u1EDDi b\u01B0\u1EDBc 1
 * th\xEC ki\u1EC3m tra tr\xF9ng m\xE3 v\u1EDBi API; m\u1ECDi thay \u0111\u1ED5i \u0111\u01B0\u1EE3c l\u01B0u nh\xE1p v\xE0 kh\xF4i ph\u1EE5c khi t\u1EA3i l\u1EA1i trang.
 */
@Component({
  selector: 'create',
  standalone: true,
  imports: [
    SdPageComponent,
    SdStepper,
    SdStep,
    SdButton,
    SdInform,
    SdSection,
    SdSectionItem,
    SdInput,
    SdSegmentedComponent,
    SdFormatDatetimePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @let value = seed();
    <sd-page title="T\u1EA1o \u0111\u1ED1i t\xE1c" description="\u0110\u1ED1i t\xE1c c\xE1 nh\xE2n ho\u1EB7c doanh nghi\u1EC7p." [backLink]="['../..']" width="narrow">
      @if (restored(); as draft) {
        <sd-inform
          info
          class="mt-16"
          autoId="partner-draft"
          [description]="'\u0110\xE3 kh\xF4i ph\u1EE5c b\u1EA3n nh\xE1p l\u01B0u l\xFAc ' + (draft.savedAt | sdFormatDatetime) + '.'"
          actionLabel="B\u1ECF nh\xE1p"
          (sdAction)="discard()" />
      }
      <sd-stepper linear orientation="vertical" animationDuration="0ms" autoId="partner-steps" [(selectedIndex)]="step">
        <sd-step label="Lo\u1EA1i v\xE0 m\xE3 \u0111\u1ED1i t\xE1c" [stepControl]="kind">
          <div class="d-flex flex-column gap-8 py-8">
            <sd-segmented
              name="type"
              ariaLabel="Lo\u1EA1i \u0111\u1ED1i t\xE1c"
              autoId="partner-type"
              [form]="kind"
              [items]="types"
              [model]="value.type"
              (sdChange)="type.set($any($event) ?? 'individual')" />
            <sd-input
              label="M\xE3 \u0111\u1ED1i t\xE1c"
              name="code"
              autoId="partner-code"
              [form]="kind"
              [model]="value.code"
              [inlineError]="codeError() ?? undefined"
              maxlength="20"
              required />
          </div>
        </sd-step>
        <sd-step [label]="type() === 'business' ? 'Th\xF4ng tin doanh nghi\u1EC7p' : 'Th\xF4ng tin c\xE1 nh\xE2n'" [stepControl]="identity">
          <div class="d-flex flex-column gap-8 py-8">
            @if (type() === 'business') {
              <sd-input label="T\xEAn doanh nghi\u1EC7p" name="name" autoId="partner-name" [form]="identity" [model]="value.name" required />
              <sd-input
                label="M\xE3 s\u1ED1 thu\u1EBF"
                name="identity"
                autoId="partner-identity"
                [form]="identity"
                [model]="value.identity"
                maxlength="14"
                required />
              <sd-input
                label="Ng\u01B0\u1EDDi \u0111\u1EA1i di\u1EC7n"
                name="representative"
                autoId="partner-representative"
                [form]="identity"
                [model]="value.representative"
                required />
            } @else {
              <sd-input label="H\u1ECD v\xE0 t\xEAn" name="name" autoId="partner-name" [form]="identity" [model]="value.name" required />
              <sd-input
                label="S\u1ED1 CCCD"
                name="identity"
                autoId="partner-identity"
                [form]="identity"
                [model]="value.identity"
                maxlength="12"
                required />
            }
          </div>
        </sd-step>
        <sd-step label="Li\xEAn h\u1EC7" [stepControl]="contact">
          <div class="d-flex flex-column gap-8 py-8">
            <sd-input label="Email" name="email" autoId="partner-email" [form]="contact" [model]="value.email" pattern="EMAIL" required />
            <sd-input
              label="\u0110i\u1EC7n tho\u1EA1i"
              name="phone"
              autoId="partner-phone"
              [form]="contact"
              [model]="value.phone"
              maxlength="15"
              required />
            <sd-input label="\u0110\u1ECBa ch\u1EC9" name="address" autoId="partner-address" [form]="contact" [model]="value.address" maxlength="200" />
          </div>
        </sd-step>
        <sd-step label="X\xE1c nh\u1EADn">
          @let summary = request();
          <sd-section title="Ki\u1EC3m tra l\u1EA1i" class="d-block my-8">
            <sd-section-item label="M\xE3 \u0111\u1ED1i t\xE1c">{{ summary.code }}</sd-section-item>
            <sd-section-item label="Lo\u1EA1i">{{ summary.type === 'business' ? 'Doanh nghi\u1EC7p' : 'C\xE1 nh\xE2n' }}</sd-section-item>
            <sd-section-item label="T\xEAn">{{ summary.name }}</sd-section-item>
            <sd-section-item [label]="summary.type === 'business' ? 'M\xE3 s\u1ED1 thu\u1EBF' : 'S\u1ED1 CCCD'">{{ summary.identity }}</sd-section-item>
            @if (summary.type === 'business') {
              <sd-section-item label="Ng\u01B0\u1EDDi \u0111\u1EA1i di\u1EC7n">{{ summary.representative }}</sd-section-item>
            }
            <sd-section-item label="Email">{{ summary.email }}</sd-section-item>
            <sd-section-item label="\u0110i\u1EC7n tho\u1EA1i">{{ summary.phone }}</sd-section-item>
          </sd-section>
        </sd-step>
      </sd-stepper>
      <sd-button
        sdFooterLeft
        title="Quay l\u1EA1i"
        type="outline"
        autoId="partner-previous"
        [disabled]="step() === 0"
        (click)="step.set(step() - 1)" />
      @if (step() < 3) {
        <sd-button
          sdFooterRight
          title="Ti\u1EBFp t\u1EE5c"
          type="fill"
          color="primary"
          autoId="partner-next"
          [loading]="checking()"
          (click)="next()" />
      } @else {
        <sd-button
          sdFooterRight
          title="T\u1EA1o \u0111\u1ED1i t\xE1c"
          type="fill"
          color="primary"
          autoId="partner-save"
          [loading]="saving()"
          (click)="save()" />
      }
    </sd-page>
  \`,
})
export class CreateComponent {
  readonly #partnerService = inject(PartnerService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #draft = readDraft();
  protected readonly types = PARTNER_TYPE_OPTIONS;
  /** Gi\xE1 tr\u1ECB ban \u0111\u1EA7u c\u1EE7a c\xE1c field: b\u1EA3n nh\xE1p n\u1EBFu c\xF3. */
  protected readonly seed = signal<PartnerSaveReq>(this.#draft ?? EMPTY);
  protected readonly restored = signal<PartnerDraft | null>(this.#draft);
  protected readonly step = signal(this.#draft?.step ?? 0);
  protected readonly type = signal<PartnerType>(this.#draft?.type ?? 'individual');
  // M\u1ED7i b\u01B0\u1EDBc m\u1ED9t FormGroup: stepper \`linear\` kh\xF4ng cho sang b\u01B0\u1EDBc sau khi b\u01B0\u1EDBc hi\u1EC7n t\u1EA1i c\xF2n l\u1ED7i.
  protected readonly kind = new FormGroup({});
  protected readonly identity = new FormGroup({});
  protected readonly contact = new FormGroup({});
  protected readonly codeError = signal<string | null>(null);
  protected readonly checking = signal(false);
  protected readonly saving = signal(false);
  readonly #values = signal(0);
  /** \u0110\xE3 t\u1EA1o xong: khi trang \u0111\xF3ng, field g\u1EE1 control kh\u1ECFi form v\xE0 ph\xE1t valueChanges; kh\xF4ng \u0111\u01B0\u1EE3c ghi l\u1EA1i nh\xE1p v\u1EEBa xo\xE1. */
  #created = false;
  protected readonly request = computed<PartnerSaveReq>(() => {
    this.#values();
    // why: n\u1ED9i dung b\u01B0\u1EDBc ch\u1EC9 t\u1EA1o khi b\u01B0\u1EDBc \u0111\u01B0\u1EE3c m\u1EDF; b\u01B0\u1EDBc ch\u01B0a m\u1EDF l\u1EA1i sau khi kh\xF4i ph\u1EE5c nh\xE1p l\u1EA5y gi\xE1 tr\u1ECB c\u1EE7a nh\xE1p.
    const value = {
      ...this.seed(),
      ...this.kind.getRawValue(),
      ...this.identity.getRawValue(),
      ...this.contact.getRawValue(),
    } as Partial<PartnerSaveReq>;
    const type = this.type();
    return {
      code: (value.code ?? '').trim().toUpperCase(),
      type,
      name: value.name ?? '',
      identity: value.identity ?? '',
      representative: type === 'business' ? (value.representative ?? '') : null,
      email: value.email ?? '',
      phone: value.phone ?? '',
      address: value.address ?? '',
    };
  });

  constructor() {
    // M\u1ED7i thay \u0111\u1ED5i l\u01B0u nh\xE1p; m\xE3 \u0111\u1ED5i th\xEC b\u1ECF l\u1ED7i tr\xF9ng m\xE3 c\u0169.
    const subscription = merge(this.kind.valueChanges, this.identity.valueChanges, this.contact.valueChanges).subscribe(() => {
      if (this.#created) return;
      this.#values.update(count => count + 1);
      this.#saveDraft();
    });
    const code = this.kind.valueChanges.subscribe(() => this.codeError.set(null));
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      code.unsubscribe();
    });
  }

  protected async next(): Promise<void> {
    const step = this.step();
    const group = [this.kind, this.identity, this.contact][step];
    group.markAllAsTouched();
    if (group.invalid) return;
    if (step === 0 && !(await this.#codeAvailable())) return;
    this.step.set(step + 1);
    this.#saveDraft();
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    try {
      const partner = await firstValueFrom(this.#partnerService.create(this.request()));
      this.#created = true;
      writeDraft(null);
      this.#notify.success(\`\u0110\xE3 t\u1EA1o \u0111\u1ED1i t\xE1c \${partner.code}.\`);
      await this.#router.navigate(['../..'], { relativeTo: this.#route });
    } catch (error) {
      const fields = apiFieldErrors(error);
      if (fields['code']) {
        // M\xE3 v\u1EEBa b\u1ECB ng\u01B0\u1EDDi kh\xE1c d\xF9ng: quay l\u1EA1i b\u01B0\u1EDBc nh\u1EADp m\xE3, d\u1EEF li\u1EC7u c\xE1c b\u01B0\u1EDBc kh\xE1c gi\u1EEF nguy\xEAn.
        this.codeError.set(fields['code']);
        this.step.set(0);
      } else this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng t\u1EA1o \u0111\u01B0\u1EE3c \u0111\u1ED1i t\xE1c. D\u1EEF li\u1EC7u v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF trong b\u1EA3n nh\xE1p.'));
    } finally {
      this.saving.set(false);
    }
  }

  protected async discard(): Promise<void> {
    try {
      await this.#confirm.confirm('Xo\xE1 b\u1EA3n nh\xE1p v\xE0 nh\u1EADp l\u1EA1i t\u1EEB \u0111\u1EA7u?', {
        title: 'B\u1ECF nh\xE1p',
        yesTitle: 'B\u1ECF nh\xE1p',
        noTitle: 'Gi\u1EEF l\u1EA1i',
        yesButtonColor: 'warning',
      });
    } catch {
      return;
    }
    writeDraft(null);
    this.restored.set(null);
    this.step.set(0);
    this.type.set('individual');
    this.seed.set({ ...EMPTY });
  }

  async #codeAvailable(): Promise<boolean> {
    this.checking.set(true);
    try {
      const { available } = await firstValueFrom(this.#partnerService.checkCode(this.request().code));
      if (!available) this.codeError.set(\`M\xE3 \${this.request().code} \u0111\xE3 \u0111\u01B0\u1EE3c d\xF9ng.\`);
      return available;
    } catch (error) {
      this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng ki\u1EC3m tra \u0111\u01B0\u1EE3c m\xE3. Th\u1EED l\u1EA1i.'));
      return false;
    } finally {
      this.checking.set(false);
    }
  }

  #saveDraft(): void {
    writeDraft({ ...this.request(), step: this.step(), savedAt: new Date().toISOString() });
  }
}
\`\`\`

## Quy t\u1EAFc

- MUST d\xF9ng \`sd-page\` v\u1EDBi \`backLink\` v\xE0 \`width="narrow"\`; n\xFAt b\u01B0\u1EDBc (Quay l\u1EA1i, Ti\u1EBFp t\u1EE5c, n\xFAt ho\xE0n t\u1EA5t) \u1EDF footer, kh\xF4ng \u1EDF header (E3).
- MUST gi\u1EEF d\u1EEF li\u1EC7u khi quay l\u1EA1i b\u01B0\u1EDBc tr\u01B0\u1EDBc ho\u1EB7c chuy\u1EC3n b\u01B0\u1EDBc (E8); \u0111\u1ED5i d\u1EEF li\u1EC7u ngu\u1ED3n th\xEC c\xE1c b\u01B0\u1EDBc sau ph\u1EA3i ki\u1EC3m tra l\u1EA1i.
- MUST ki\u1EC3m tra b\u01B0\u1EDBc hi\u1EC7n t\u1EA1i tr\u01B0\u1EDBc khi sang b\u01B0\u1EDBc sau (validation c\u1EE7a form b\u01B0\u1EDBc, ki\u1EC3m tra v\u1EDBi API nh\u01B0 tr\xF9ng m\xE3); d\xF9ng \`linear\` + \`stepControl\` \u0111\u1EC3 ng\u01B0\u1EDDi d\xF9ng kh\xF4ng v\u01B0\u1EE3t b\u01B0\u1EDBc b\u1EB1ng ti\xEAu \u0111\u1EC1.
- MUST ch\u1EC9 ghi d\u1EEF li\u1EC7u \u1EDF b\u01B0\u1EDBc cu\u1ED1i, sau khi h\u1ECFi x\xE1c nh\u1EADn; tr\u01B0\u1EDBc \u0111\xF3 ch\u1EC9 \u0111\u1ECDc ho\u1EB7c ki\u1EC3m tra.
- SHOULD l\u01B0u nh\xE1p v\xE0o storage c\u1EE7a tab khi quy tr\xECnh d\xE0i; t\u1EA3i l\u1EA1i trang th\xEC kh\xF4i ph\u1EE5c v\xE0 b\xE1o r\xF5, k\xE8m c\xE1ch b\u1ECF nh\xE1p.
- SHOULD hi\u1EC7n t\xF3m t\u1EAFt \u1EDF b\u01B0\u1EDBc X\xE1c nh\u1EADn \u0111\u1EC3 ng\u01B0\u1EDDi d\xF9ng ki\u1EC3m tra l\u1EA1i tr\u01B0\u1EDBc khi ghi.

## L\u1ED7i hay g\u1EB7p

- M\u1ED7i b\u01B0\u1EDBc l\xE0 m\u1ED9t route ri\xEAng: d\u1EEF li\u1EC7u m\u1EA5t khi t\u1EA3i l\u1EA1i ho\u1EB7c quay l\u1EA1i.
- B\u1EA5m ti\xEAu \u0111\u1EC1 b\u01B0\u1EDBc sau \u0111\u1EC3 b\u1ECF qua ki\u1EC3m tra: d\u1EEF li\u1EC7u l\u1ED7i t\u1EDBi b\u01B0\u1EDBc ghi.
- R\u1EBD nh\xE1nh b\u1EB1ng c\xE1ch \u1EA9n field b\u1EB1ng CSS: field \u1EA9n v\u1EABn c\xF2n validator v\xE0 ch\u1EB7n b\u01B0\u1EDBc.
- Thanh b\u01B0\u1EDBc c\u1EE7a \`mat-stepper\` cu\u1ED9n c\xF9ng n\u1ED9i dung; c\xF3 m\xE0n th\u1EE9 ba c\u1EA7n thanh b\u01B0\u1EDBc ghim th\xEC t\xE1ch th\xE0nh component ri\xEAng.
`,"docs/form.md":`# Form

T\u1EA1o ho\u1EB7c c\u1EADp nh\u1EADt m\u1ED9t b\u1EA3n ghi trong m\u1ED9t b\u01B0\u1EDBc: \`sd-page-form\`. Route m\u1EABu: \`/pattern/product/create\` v\xE0 \`/pattern/product/:id/update\` (m\u1ED9t section), \`/pattern/order/create\` v\xE0 \`/pattern/order/:id/update\` (d\xF2ng h\xE0ng nh\u1EADp tr\u1EF1c ti\u1EBFp, m\u1EE5c l\u1EE5c; th\xEAm \`?lines=sd-table\` \u0111\u1EC3 xem c\xF9ng b\u1EA3ng d\u1EF1ng b\u1EB1ng \`sd-table\`), \`/pattern/settings\` (m\u1ED9t b\u1EA3n ghi, nhi\u1EC1u nh\xF3m, tr\u1EA1ng th\xE1i l\u01B0u \u1EDF footer).

## Khi n\xE0o d\xF9ng / khi n\xE0o kh\xF4ng

- D\xF9ng khi form c\u1EA7n c\u1EA3 trang: nhi\u1EC1u nh\xF3m, b\u1EA3ng d\xF2ng chi ti\u1EBFt, ho\u1EB7c ng\u01B0\u1EDDi d\xF9ng c\u1EA7n t\u1EADp trung.
- Form ng\u1EAFn s\u1EEDa ngay tr\xEAn danh s\xE1ch: d\xF9ng drawer ([drawer](drawer.md)).
- Nhi\u1EC1u b\u01B0\u1EDBc c\xF3 \u0111i\u1EC1u ki\u1EC7n chuy\u1EC3n b\u01B0\u1EDBc: d\xF9ng [flow](flow.md).

## Code m\u1EABu

Nh\xF3m field n\u1EB1m trong component \`-form\` d\xF9ng chung cho t\u1EA1o v\xE0 c\u1EADp nh\u1EADt; field Core t\u1EF1 \u0111\u0103ng k\xFD control qua \`[form]\` + \`name\`. Th\xE2n section l\xE0 \`row px-16 pt-16 pb-8\`: field th\u1EB3ng l\u1EC1 16px v\u1EDBi title c\u1EE7a section; d\u01B0\u1EDBi h\xE0ng cu\u1ED1i c\xF2n ch\u1ED7 d\xE0nh cho l\u1ED7i c\u1EE7a field, n\xEAn \u0111\xE1y ch\u1EC9 c\u1EA7n 8px:

<!-- @source features/product/components/general-information-form/general-information-form.component.ts -->
\`\`\`ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FormControl, FormGroup } from '@angular/forms';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import type { ProductSaveReq, ProductStatus } from '../../services/product.model';
import { ProductStatusSelectComponent } from '../product-status-select/product-status-select.component';

/** C\xE1c field Core t\u1EF1 \u0111\u0103ng k\xFD control qua \`[form]\` + \`name\`; page kh\xF4ng khai b\xE1o tr\u01B0\u1EDBc control tr\xF9ng t\xEAn. */
export type ProductForm = FormGroup<{
  code?: FormControl<string>;
  name?: FormControl<string>;
  unit?: FormControl<string>;
  price?: FormControl<number>;
  status?: FormControl<ProductStatus>;
}>;

/** Gi\xE1 tr\u1ECB form \u2192 request l\u01B0u. \`code\` truy\u1EC1n v\xE0o khi c\u1EADp nh\u1EADt (m\xE3 b\u1ECB kho\xE1). */
export function productSaveReq(form: ProductForm, code?: string): ProductSaveReq {
  const value = form.getRawValue();
  return {
    code: code ?? value.code ?? '',
    name: value.name ?? '',
    unit: value.unit ?? '',
    price: value.price ?? 0,
    status: value.status ?? 'active',
  };
}

/** Nh\xF3m "Th\xF4ng tin chung" c\u1EE7a form s\u1EA3n ph\u1EA9m, d\xF9ng chung cho t\u1EA1o m\u1EDBi v\xE0 c\u1EADp nh\u1EADt. */
@Component({
  selector: 'general-information-form',
  standalone: true,
  imports: [SdInput, SdInputNumber, SdSection, ProductStatusSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<sd-section title="Th\xF4ng tin chung">
    <div class="row px-16 pt-16 pb-8">
      <div class="col-12 col-md-6">
        <sd-input
          label="M\xE3 s\u1EA3n ph\u1EA9m"
          name="code"
          autoId="product-code"
          [form]="form()"
          [model]="seed().code"
          [disabled]="editing()"
          [inlineError]="errors()['code']"
          maxlength="20"
          required />
      </div>
      <div class="col-12 col-md-6">
        <sd-input
          label="T\xEAn s\u1EA3n ph\u1EA9m"
          name="name"
          autoId="product-name"
          [form]="form()"
          [model]="seed().name"
          [inlineError]="errors()['name']"
          maxlength="100"
          required />
      </div>
      <div class="col-12 col-md-6">
        <sd-input label="\u0110\u01A1n v\u1ECB t\xEDnh" name="unit" autoId="product-unit" [form]="form()" [model]="seed().unit" maxlength="20" />
      </div>
      <div class="col-12 col-md-6">
        <sd-input-number
          label="Gi\xE1 b\xE1n (\u20AB)"
          name="price"
          autoId="product-price"
          type="positive"
          [precision]="0"
          [form]="form()"
          [model]="seed().price"
          [inlineError]="errors()['price']"
          required />
      </div>
      <div class="col-12 col-md-6">
        <product-status-select [form]="form()" [model]="seed().status" />
      </div>
    </div>
  </sd-section>\`,
})
export class GeneralInformationFormComponent {
  readonly form = input.required<FormGroup>();
  readonly seed = input.required<ProductSaveReq>();
  readonly editing = input(false);
  /** L\u1ED7i theo field do API tr\u1EA3 v\u1EC1. */
  readonly errors = input<Readonly<Record<string, string>>>({});
}
\`\`\`

Trang t\u1EA1o: Hu\u1EF7 \xB7 T\u1EA1o s\u1EA3n ph\u1EA9m \u1EDF \`headerRight\`, l\u01B0u l\u1ED7i th\xEC focus field l\u1ED7i \u0111\u1EA7u ti\xEAn v\xE0 g\u1EAFn l\u1ED7i c\u1EE7a API v\xE0o field, l\u01B0u xong sang chi ti\u1EBFt b\u1EB1ng \`replaceUrl\`:

<!-- @source features/product/pages/create/create.component.ts -->
\`\`\`ts
import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, Injector, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import {
  GeneralInformationFormComponent,
  productSaveReq,
  type ProductForm,
} from '../../components/general-information-form/general-information-form.component';
import { ProductService } from '../../services/product.service';
import type { ProductSaveReq } from '../../services/product.model';

@Component({
  selector: 'create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdPageComponent, SdButton, GeneralInformationFormComponent],
  template: \`
    <sd-page-form title="T\u1EA1o m\u1EDBi s\u1EA3n ph\u1EA9m" [backLink]="['..']">
      <div headerRight class="d-flex align-items-center gap-8">
        <sd-button title="Hu\u1EF7" type="outline" autoId="product-cancel" (click)="cancel()" />
        <sd-button
          title="T\u1EA1o s\u1EA3n ph\u1EA9m"
          prefixIcon="save"
          type="fill"
          color="primary"
          autoId="product-save"
          [loading]="saving()"
          (click)="save()" />
      </div>
      <div class="py-16">
        <general-information-form [form]="form" [seed]="seed" [errors]="apiErrors.errors()" />
      </div>
    </sd-page-form>
  \`,
})
export class CreateComponent {
  readonly #productService = inject(ProductService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  readonly #injector = inject(Injector);
  protected readonly seed: ProductSaveReq = { code: '', name: '', unit: 'C\xE1i', price: 0, status: 'active' };
  protected readonly form: ProductForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  // Dirty theo gi\xE1 tr\u1ECB: g\xF5 r\u1ED3i xo\xE1 v\u1EC1 nh\u01B0 c\u0169 th\xEC r\u1EDDi trang kh\xF4ng b\u1ECB h\u1ECFi.
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'product-create', dirty: 'value' });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#unsaved.destroy());
  }

  protected cancel(): void {
    void this.#router.navigate(['..'], { relativeTo: this.#route });
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.#focusFirstInvalid();
      return;
    }
    this.saving.set(true);
    try {
      const product = await firstValueFrom(this.#productService.create(productSaveReq(this.form)));
      this.#unsaved.markPristine();
      this.#notify.success(\`\u0110\xE3 t\u1EA1o s\u1EA3n ph\u1EA9m \${product.code}.\`);
      // replaceUrl: Back \u1EDF trang chi ti\u1EBFt v\u1EC1 danh s\xE1ch, kh\xF4ng quay l\u1EA1i form t\u1EA1o m\u1EDBi.
      await this.#router.navigate(['..', product.id, 'detail'], { relativeTo: this.#route, replaceUrl: true });
    } catch (error) {
      // L\u01B0u l\u1ED7i: gi\u1EEF nguy\xEAn d\u1EEF li\u1EC7u \u0111\xE3 nh\u1EADp; l\u1ED7i theo field hi\u1EC7n ngay tr\xEAn field.
      if (this.apiErrors.set(error)) this.#focusFirstInvalid();
      else this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng th\u1EC3 l\u01B0u. D\u1EEF li\u1EC7u \u0111\xE3 nh\u1EADp v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF.'));
    } finally {
      this.saving.set(false);
    }
  }

  #focusFirstInvalid(): void {
    afterNextRender(() => focusFirstInvalid(this.#host), { injector: this.#injector });
  }
}
\`\`\`

Trang c\u1EADp nh\u1EADt: m\xE3 b\u1ECB kho\xE1, dirty t\xEDnh theo gi\xE1 tr\u1ECB:

<!-- @source features/product/pages/update/update.component.ts -->
\`\`\`ts
import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, Injector, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import {
  GeneralInformationFormComponent,
  productSaveReq,
  type ProductForm,
} from '../../components/general-information-form/general-information-form.component';
import { ProductService } from '../../services/product.service';
import type { ProductDto } from '../../services/product.model';

@Component({
  selector: 'update',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdPageComponent, SdButton, GeneralInformationFormComponent],
  template: \`
    <sd-page-form [title]="'C\u1EADp nh\u1EADt s\u1EA3n ph\u1EA9m #' + entity().code" [backLink]="['../detail']">
      <div headerRight class="d-flex align-items-center gap-8">
        <sd-button title="Hu\u1EF7" type="outline" autoId="product-cancel" (click)="cancel()" />
        <sd-button title="L\u01B0u" prefixIcon="save" type="fill" color="primary" autoId="product-save" [loading]="saving()" (click)="save()" />
      </div>
      <div class="py-16">
        <general-information-form [form]="form" [seed]="entity()" [editing]="true" [errors]="apiErrors.errors()" />
      </div>
    </sd-page-form>
  \`,
})
export class UpdateComponent {
  readonly #productService = inject(ProductService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  readonly #injector = inject(Injector);
  /** S\u1EA3n ph\u1EA9m do resolver t\u1EA3i; draft kh\u1EDFi t\u1EA1o t\u1EEB \u0111\xE2y, s\u1EEDa draft kh\xF4ng \u0111\u1ED5i b\u1EA3n ghi tr\u01B0\u1EDBc khi l\u01B0u th\xE0nh c\xF4ng. */
  protected readonly entity = toSignal(this.#route.data.pipe(map(data => data['entity'] as ProductDto)), { requireSync: true });
  protected readonly form: ProductForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'product-update', dirty: 'value' });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#unsaved.destroy());
  }

  protected cancel(): void {
    void this.#router.navigate(['../detail'], { relativeTo: this.#route });
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.#focusFirstInvalid();
      return;
    }
    this.saving.set(true);
    try {
      // M\xE3 b\u1ECB kho\xE1 sau khi t\u1EA1o: g\u1EEDi m\xE3 c\u1EE7a b\u1EA3n ghi, kh\xF4ng l\u1EA5y t\u1EEB form.
      await firstValueFrom(this.#productService.update(this.entity().id, productSaveReq(this.form, this.entity().code)));
      this.#unsaved.markPristine();
      this.#notify.success('\u0110\xE3 c\u1EADp nh\u1EADt s\u1EA3n ph\u1EA9m.');
      await this.#router.navigate(['../detail'], { relativeTo: this.#route, replaceUrl: true });
    } catch (error) {
      // L\u01B0u l\u1ED7i: gi\u1EEF nguy\xEAn draft \u0111\u1EC3 s\u1EEDa v\xE0 th\u1EED l\u1EA1i.
      if (this.apiErrors.set(error)) this.#focusFirstInvalid();
      else this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng th\u1EC3 l\u01B0u. D\u1EEF li\u1EC7u \u0111\xE3 nh\u1EADp v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF.'));
    } finally {
      this.saving.set(false);
    }
  }

  #focusFirstInvalid(): void {
    afterNextRender(() => focusFirstInvalid(this.#host), { injector: this.#injector });
  }
}
\`\`\`

D\xF2ng h\xE0ng nh\u1EADp tr\u1EF1c ti\u1EBFp: tr\u1EA1ng th\xE1i c\u1EE7a d\xF2ng (FormArray \`form.lines\`, th\xE0nh ti\u1EC1n, t\u1ED5ng, ch\u1ECDn s\u1EA3n ph\u1EA9m th\xEC \u0111i\u1EC1n \u0111\u01A1n gi\xE1) n\u1EB1m trong m\u1ED9t h\xE0m d\xF9ng chung cho hai c\xE1ch d\u1EF1ng b\u1EA3ng b\xEAn d\u01B0\u1EDBi:

<!-- @source features/order/components/lines-form/order-lines.ts -->
\`\`\`ts
import { computed, DestroyRef, effect, inject, signal, untracked, type Signal } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ProductService } from '../../../product/services/product.service';
import type { OrderLineDto } from '../../services/order.model';
import type { OrderForm } from '../general-information-form/general-information-form.component';

/** M\u1ED9t d\xF2ng \u0111ang nh\u1EADp: field Core c\u1EE7a d\xF2ng t\u1EF1 \u0111\u0103ng k\xFD v\xE0o \`group\`; \`seed\` l\xE0 gi\xE1 tr\u1ECB ban \u0111\u1EA7u c\u1EE7a d\xF2ng. */
export interface OrderLineRow {
  readonly key: number;
  readonly group: FormGroup;
  readonly seed: OrderLineDto;
}

export interface OrderLines {
  readonly rows: Signal<readonly OrderLineRow[]>;
  /** Th\xE0nh ti\u1EC1n theo th\u1EE9 t\u1EF1 c\u1EE7a \`rows\`. */
  readonly amounts: Signal<readonly number[]>;
  readonly total: Signal<number>;
  add(): void;
  remove(row: OrderLineRow): void;
  /** Ch\u1ECDn s\u1EA3n ph\u1EA9m th\xEC \u0111i\u1EC1n \u0111\u01A1n gi\xE1 hi\u1EC7n h\xE0nh c\u1EE7a s\u1EA3n ph\u1EA9m. */
  pick(row: OrderLineRow, productId: string | null | undefined): Promise<void>;
  /** G\u1EAFn \`form.lines\` v\xE0o form khi field c\u1EE7a c\xE1c d\xF2ng v\u1EEBa n\u1EA1p \u0111\xE3 \u0111\u0103ng k\xFD; g\u1ECDi l\u1EA1i khi \u0111\xE3 g\u1EAFn th\xEC kh\xF4ng l\xE0m g\xEC. */
  attach(): void;
}

/**
 * D\xF2ng h\xE0ng c\u1EE7a form \u0111\u01A1n: m\u1ED7i d\xF2ng l\xE0 m\u1ED9t FormGroup trong \`form.lines\` (FormArray). Th\xE0nh ti\u1EC1n v\xE0 t\u1ED5ng t\xEDnh l\u1EA1i khi
 * gi\xE1 tr\u1ECB \u0111\u1ED5i. \`lines-form\` (b\u1EA3ng HTML) v\xE0 \`lines-table-form\` (\`sd-table\`) d\xF9ng chung, ch\u1EC9 kh\xE1c ph\u1EA7n hi\u1EC3n th\u1ECB.
 * G\u1ECDi trong injection context c\u1EE7a component.
 *
 * \`registerSdUnsavedChangesForm(..., { dirty: 'value' })\` l\u1EA5y gi\xE1 tr\u1ECB c\u1EE7a m\u1ED9t control l\xFAc n\xF3 v\xE0o form l\xE0m gi\xE1 tr\u1ECB \u0111\xE3
 * l\u01B0u, n\xEAn \`form.lines\` ch\u1EC9 v\xE0o form khi field c\u1EE7a c\xE1c d\xF2ng \u0111\xE3 \u0111\u0103ng k\xFD; v\xE0o s\u1EDBm h\u01A1n th\xEC form v\u1EEBa m\u1EDF \u0111\xE3 b\u1ECB coi l\xE0 c\xF3
 * thay \u0111\u1ED5i. \`<table>\` v\u1EBD d\xF2ng ngay trong l\u01B0\u1EE3t change detection \u0111\xF3 (\`attach: 'now'\`); \`sd-table\` v\u1EBD d\xF2ng sau l\u1EA7n \u0111\u1ECDc
 * \u0111\u1EA7u, n\xEAn \`lines-table-form\` d\xF9ng \`attach: 'manual'\` r\u1ED3i g\u1ECDi \`attach()\` khi b\u1EA3ng \u0111\xE3 v\u1EBD.
 */
export function orderLines(
  form: Signal<OrderForm>,
  seed: Signal<readonly OrderLineDto[]>,
  options: { readonly attach: 'now' | 'manual' } = { attach: 'now' }
): OrderLines {
  const productService = inject(ProductService);
  const array = new FormArray<FormGroup>([]);
  const version = signal(0);
  const rows = signal<readonly OrderLineRow[]>([]);
  let nextKey = 0;

  const attach = (): void => {
    if (form().get('lines') !== array) form().setControl('lines', array);
  };
  const push = (line: OrderLineDto): void => {
    const group = new FormGroup({});
    array.push(group);
    rows.update(items => [...items, { key: nextKey++, group, seed: line }]);
  };
  const load = (lines: readonly OrderLineDto[]): void => {
    // why: g\u1EE1 ra r\u1ED3i g\u1EAFn l\u1EA1i, \u0111\u1EC3 gi\xE1 tr\u1ECB \u0111\xE3 l\u01B0u c\u1EE7a \`lines\` l\xE0 c\xE1c d\xF2ng m\u1EDBi ch\u1EE9 kh\xF4ng ph\u1EA3i d\xF2ng c\u1EE7a \u0111\u01A1n tr\u01B0\u1EDBc.
    if (form().get('lines') === array) form().removeControl('lines');
    array.clear();
    rows.set([]);
    (lines.length ? lines : [{ productId: '', quantity: 1, unitPrice: 0 }]).forEach(push);
    if (options.attach === 'now') attach();
  };

  const subscription = array.valueChanges.subscribe(() => version.update(value => value + 1));
  inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  // why: trang c\u1EADp nh\u1EADt \u0111\u01B0\u1EE3c d\xF9ng l\u1EA1i khi ch\u1EC9 \u0111\u1ED5i \`:id\`; d\xF2ng h\xE0ng ph\u1EA3i theo \u0111\u01A1n m\u1EDBi, kh\xF4ng gi\u1EEF d\xF2ng c\u1EE7a \u0111\u01A1n tr\u01B0\u1EDBc.
  effect(() => {
    const lines = seed();
    untracked(() => load(lines));
  });

  const amounts = computed(() => {
    version();
    return rows().map(
      row => Number(row.group.get('quantity')?.value ?? row.seed.quantity) * Number(row.group.get('unitPrice')?.value ?? row.seed.unitPrice)
    );
  });

  return {
    rows: rows.asReadonly(),
    amounts,
    total: computed(() => amounts().reduce((sum, amount) => sum + amount, 0)),
    add: () => push({ productId: '', quantity: 1, unitPrice: 0 }),
    remove: row => {
      const index = rows().indexOf(row);
      if (index < 0) return;
      // why: \u0111\xE1nh d\u1EA5u \u0111\xE3 s\u1EEDa TR\u01AF\u1EDAC khi g\u1EE1, \u0111\u1EC3 dirty theo gi\xE1 tr\u1ECB so v\u1EDBi danh s\xE1ch d\xF2ng l\xFAc tr\u01B0\u1EDBc.
      array.markAsDirty();
      array.removeAt(index);
      rows.update(items => items.filter(item => item !== row));
    },
    pick: async (row, productId) => {
      if (!productId) return;
      const product = await firstValueFrom(productService.cachedDetail(productId));
      row.group.get('unitPrice')?.setValue(product.price);
    },
    attach,
  };
}
\`\`\`

B\u1EA3ng d\u1EF1ng b\u1EB1ng \`<table>\`: field trong \xF4 d\xF9ng \`size="sm"\` v\xE0 \`hideInlineError\`, m\u1ECDi \xF4 c\u0103n gi\u1EEFa theo chi\u1EC1u d\u1ECDc, l\u1ED7i c\u1EE7a API l\xE0 icon k\xE8m tooltip tr\xEAn \u0111\xFAng \xF4 n\xEAn d\xF2ng kh\xF4ng cao th\xEAm:

<!-- @source features/order/components/lines-form/lines-form.component.ts -->
\`\`\`ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { ProductSelectComponent } from '../../../product/components/product-select/product-select.component';
import type { OrderLineDto } from '../../services/order.model';
import type { OrderForm } from '../general-information-form/general-information-form.component';
import { orderLines } from './order-lines';

/**
 * B\u1EA3ng d\xF2ng h\xE0ng nh\u1EADp tr\u1EF1c ti\u1EBFp, d\u1EF1ng b\u1EB1ng \`<table>\`: m\u1ED7i d\xF2ng l\xE0 m\u1ED9t FormGroup trong \`form.lines\` (FormArray, do
 * \`orderLines()\` qu\u1EA3n l\xFD), c\xE1c field Core t\u1EF1 \u0111\u0103ng k\xFD v\xE0o d\xF2ng. Ch\u1ECDn s\u1EA3n ph\u1EA9m \u0111i\u1EC1n \u0111\u01A1n gi\xE1; th\xE0nh ti\u1EC1n v\xE0 t\u1ED5ng t\u1EF1
 * t\xEDnh. Field trong \xF4 d\xF9ng \`size="sm"\` v\xE0 \`hideInlineError\`: l\u1ED7i, k\u1EC3 c\u1EA3 l\u1ED7i API theo d\xF2ng (\`lines.<i>.<field>\`), l\xE0
 * icon k\xE8m tooltip ngay tr\xEAn \xF4 \u0111\xF3, d\xF2ng kh\xF4ng cao th\xEAm. C\xF9ng b\u1EA3ng d\u1EF1ng b\u1EB1ng \`sd-table\`: \`lines-table-form\`.
 */
@Component({
  selector: 'lines-form',
  standalone: true,
  imports: [SdSection, SdButton, SdInputNumber, SdFormatNumberPipe, ProductSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-section title="D\xF2ng h\xE0ng">
      <div sdHeaderRight>
        <sd-button title="Th\xEAm d\xF2ng" prefixIcon="add" type="text" autoId="order-line-add" (click)="lines.add()" />
      </div>
      <div class="lines-scroll">
        <table class="lines">
          <colgroup>
            <col />
            <col class="lines__quantity" />
            <col class="lines__money" />
            <col class="lines__money" />
            <col class="lines__action" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">S\u1EA3n ph\u1EA9m <span class="text-error" aria-hidden="true">*</span></th>
              <th scope="col" class="lines__number">S\u1ED1 l\u01B0\u1EE3ng <span class="text-error" aria-hidden="true">*</span></th>
              <th scope="col" class="lines__number">\u0110\u01A1n gi\xE1 (\u20AB) <span class="text-error" aria-hidden="true">*</span></th>
              <th scope="col" class="lines__number">Th\xE0nh ti\u1EC1n (\u20AB)</th>
              <th scope="col" class="lines__action"><span class="sd-visually-hidden">Xo\xE1 d\xF2ng</span></th>
            </tr>
          </thead>
          <tbody>
            @for (row of lines.rows(); track row.key; let index = $index) {
              <tr [attr.data-line]="index">
                <td>
                  <product-select
                    size="sm"
                    hideInlineError
                    [label]="undefined"
                    [form]="row.group"
                    [model]="row.seed.productId || null"
                    [inlineError]="errors()['lines.' + index + '.productId']"
                    [autoId]="'order-line-' + index + '-product'"
                    (modelChange)="lines.pick(row, $event)"
                    required />
                </td>
                <td class="lines__number">
                  <sd-input-number
                    name="quantity"
                    size="sm"
                    hideInlineError
                    type="positive"
                    [precision]="0"
                    [form]="row.group"
                    [model]="row.seed.quantity"
                    [inlineError]="errors()['lines.' + index + '.quantity']"
                    [autoId]="'order-line-' + index + '-quantity'"
                    required />
                </td>
                <td class="lines__number">
                  <sd-input-number
                    name="unitPrice"
                    size="sm"
                    hideInlineError
                    type="positive"
                    [precision]="0"
                    [form]="row.group"
                    [model]="row.seed.unitPrice"
                    [inlineError]="errors()['lines.' + index + '.unitPrice']"
                    [autoId]="'order-line-' + index + '-unit-price'"
                    required />
                </td>
                <td class="lines__number" [attr.data-autoid]="'order-line-' + index + '-amount'">
                  {{ lines.amounts()[index] | sdFormatNumber: 0 }}
                </td>
                <td class="lines__action">
                  <sd-button
                    prefixIcon="delete"
                    type="text"
                    color="error"
                    tooltip="Xo\xE1 d\xF2ng"
                    [autoId]="'order-line-' + index + '-remove'"
                    [disabled]="lines.rows().length === 1"
                    (click)="lines.remove(row)" />
                </td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colspan="3" class="lines__number">T\u1ED5ng ti\u1EC1n (\u20AB)</th>
              <td class="lines__number lines__total" data-autoid="order-total">{{ lines.total() | sdFormatNumber: 0 }}</td>
              <td class="lines__action"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </sd-section>
  \`,
  styles: \`
    /* M\xE0n h\u1EB9p th\xEC cu\u1ED9n ngang trong section thay v\xEC b\xF3p c\u1ED9t s\u1EA3n ph\u1EA9m. */
    .lines-scroll {
      overflow-x: auto;
    }
    /* C\u1ED9t c\u1ED1 \u0111\u1ECBnh, s\u1EA3n ph\u1EA9m l\u1EA5y ph\u1EA7n c\xF2n l\u1EA1i: v\u1EEBa th\xE2n 576px c\u1EE7a sd-page-form. */
    .lines {
      width: 100%;
      min-width: 544px;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .lines__quantity {
      width: 88px;
    }
    .lines__money {
      width: 120px;
    }
    .lines__action {
      width: 48px;
    }
    .lines th,
    .lines td {
      padding: 8px;
      text-align: left;
      vertical-align: middle;
    }
    /* C\u1ED9t \u0111\u1EA7u v\xE0 cu\u1ED1i th\u1EB3ng l\u1EC1 16px v\u1EDBi title v\xE0 n\xFAt "Th\xEAm d\xF2ng" c\u1EE7a section. */
    .lines th:first-child,
    .lines td:first-child {
      padding-left: 16px;
    }
    .lines th:last-child,
    .lines td:last-child {
      padding-right: 16px;
    }
    .lines thead th {
      color: var(--sd-text-secondary);
      font-size: 12px;
      font-weight: 500;
      border-bottom: 1px solid var(--sd-border);
    }
    .lines tbody tr:first-child td {
      padding-top: 12px;
    }
    .lines tbody tr:last-child td {
      padding-bottom: 12px;
    }
    .lines__number {
      text-align: right !important;
    }
    .lines tfoot th,
    .lines tfoot td {
      padding-top: 12px;
      padding-bottom: 12px;
      border-top: 1px solid var(--sd-border);
    }
    .lines__total {
      font-weight: 500;
    }
  \`,
})
export class LinesFormComponent {
  readonly form = input.required<OrderForm>();
  /** D\xF2ng ban \u0111\u1EA7u (c\u1EADp nh\u1EADt) ho\u1EB7c m\u1ED9t d\xF2ng tr\u1ED1ng (t\u1EA1o m\u1EDBi). */
  readonly seed = input.required<readonly OrderLineDto[]>();
  /** L\u1ED7i theo field do API tr\u1EA3 v\u1EC1, kho\xE1 d\u1EA1ng \`lines.<index>.<field>\`. */
  readonly errors = input<Readonly<Record<string, string>>>({});
  protected readonly lines = orderLines(this.form, this.seed);
}
\`\`\`

C\xF9ng d\xF2ng h\xE0ng d\u1EF1ng b\u1EB1ng \`sd-table\` (\`/pattern/order/create?lines=sd-table\`): n\xFAt th\xEAm d\xF2ng \u1EDF header c\u1ED9t command (\`sdTableCommandHeaderDef\`), xo\xE1 d\xF2ng l\xE0 command c\u1EE7a b\u1EA3ng, s\u1ED1 d\xF2ng v\xE0 t\u1ED5ng ti\u1EC1n d\u01B0\u1EDBi b\u1EA3ng. D\xF2ng \u0111\u1ED5i th\xEC \`reload()\` b\u1EA3ng; \`rowKey\` gi\u1EEF view c\u1EE7a c\xE1c d\xF2ng c\xF2n l\u1EA1i n\xEAn gi\xE1 tr\u1ECB \u0111ang nh\u1EADp kh\xF4ng m\u1EA5t. \`sd-table\` v\u1EBD d\xF2ng sau l\u1EA7n \u0111\u1ECDc \u0111\u1EA7u, n\xEAn \`form.lines\` ch\u1EC9 v\xE0o form khi b\u1EA3ng \u0111\xE3 v\u1EBD (\`attach: 'manual'\` r\u1ED3i \`attach()\` t\u1EEB \`reload.onReload\`):

<!-- @source features/order/components/lines-table-form/lines-table-form.component.ts -->
\`\`\`ts
import { afterNextRender, ChangeDetectionStrategy, Component, effect, inject, Injector, input, untracked, viewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import {
  SdTable,
  SdTableCellDefDirective,
  SdTableCommandHeaderDefDirective,
  SdTableTitleDefDirective,
  type SdTableOption,
} from '@sdcorejs/angular/components/table';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { ProductSelectComponent } from '../../../product/components/product-select/product-select.component';
import type { OrderLineDto } from '../../services/order.model';
import type { OrderForm } from '../general-information-form/general-information-form.component';
import { orderLines, type OrderLineRow } from '../lines-form/order-lines';

/** D\xF2ng c\u1EE7a \`sd-table\`: d\xF2ng form c\u1ED9ng t\xEAn c\xE1c c\u1ED9t. \xD4 c\u1EE7a m\u1ECDi c\u1ED9t v\u1EBD b\u1EB1ng \`sdTableCellDef\` t\u1EEB \`group\`/\`seed\`. */
interface LineItem extends OrderLineRow {
  readonly productId?: string;
  readonly quantity?: number;
  readonly unitPrice?: number;
  readonly amount?: number;
}

/**
 * D\xF2ng h\xE0ng nh\u1EADp tr\u1EF1c ti\u1EBFp, d\u1EF1ng b\u1EB1ng \`sd-table\` thay cho \`<table>\` c\u1EE7a \`lines-form\`; tr\u1EA1ng th\xE1i d\xF2ng v\u1EABn l\xE0
 * \`orderLines()\`. B\u1EA3ng local, kh\xF4ng ph\xE2n trang, kh\xF4ng l\u1ECDc. N\xFAt th\xEAm d\xF2ng n\u1EB1m \u1EDF header c\u1ED9t command
 * (\`sdTableCommandHeaderDef\`), ngay tr\xEAn n\xFAt xo\xE1 c\u1EE7a t\u1EEBng d\xF2ng; field trong \xF4 d\xF9ng \`size="sm"\` v\xE0 \`hideInlineError\`,
 * c\u1ED9t b\u1EAFt bu\u1ED9c c\xF3 \`*\` \u1EDF title; s\u1ED1 d\xF2ng v\xE0 t\u1ED5ng ti\u1EC1n \u1EDF d\u01B0\u1EDBi b\u1EA3ng. D\xF2ng \u0111\u1ED5i th\xEC \`reload()\` b\u1EA3ng; \`rowKey\` gi\u1EEF view
 * c\u1EE7a c\xE1c d\xF2ng c\xF2n l\u1EA1i n\xEAn gi\xE1 tr\u1ECB \u0111ang nh\u1EADp kh\xF4ng m\u1EA5t. \`form.lines\` ch\u1EC9 v\xE0o form khi b\u1EA3ng \u0111\xE3 v\u1EBD d\xF2ng (\`attach\`).
 */
@Component({
  selector: 'lines-table-form',
  standalone: true,
  imports: [
    SdSection,
    SdButton,
    SdTable,
    SdTableCellDefDirective,
    SdTableCommandHeaderDefDirective,
    SdTableTitleDefDirective,
    SdInputNumber,
    SdFormatNumberPipe,
    ProductSelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-section title="D\xF2ng h\xE0ng">
      <sd-table autoId="order-lines" [option]="option">
        <ng-template sdTableCommandHeaderDef>
          <sd-button
            tooltip="Th\xEAm d\xF2ng"
            prefixIcon="add"
            size="sm"
            type="light"
            color="primary"
            autoId="order-line-add"
            (click)="lines.add()" />
        </ng-template>
        <ng-template sdTableTitleDef="productId">S\u1EA3n ph\u1EA9m <span class="text-error" aria-hidden="true">*</span></ng-template>
        <ng-template sdTableTitleDef="quantity">S\u1ED1 l\u01B0\u1EE3ng <span class="text-error" aria-hidden="true">*</span></ng-template>
        <ng-template sdTableTitleDef="unitPrice">\u0110\u01A1n gi\xE1 (\u20AB) <span class="text-error" aria-hidden="true">*</span></ng-template>
        <ng-template sdTableCellDef="productId" let-row="item">
          @let index = lines.rows().indexOf(row);
          <product-select
            class="lines-table__input"
            size="sm"
            hideInlineError
            [label]="undefined"
            [form]="row.group"
            [model]="row.seed.productId || null"
            [inlineError]="errors()['lines.' + index + '.productId']"
            [autoId]="'order-line-' + index + '-product'"
            (modelChange)="lines.pick(row, $event)"
            required />
        </ng-template>
        <ng-template sdTableCellDef="quantity" let-row="item">
          @let index = lines.rows().indexOf(row);
          <sd-input-number
            class="lines-table__input"
            name="quantity"
            size="sm"
            hideInlineError
            type="positive"
            [precision]="0"
            [form]="row.group"
            [model]="row.seed.quantity"
            [inlineError]="errors()['lines.' + index + '.quantity']"
            [autoId]="'order-line-' + index + '-quantity'"
            required />
        </ng-template>
        <ng-template sdTableCellDef="unitPrice" let-row="item">
          @let index = lines.rows().indexOf(row);
          <sd-input-number
            class="lines-table__input"
            name="unitPrice"
            size="sm"
            hideInlineError
            type="positive"
            [precision]="0"
            [form]="row.group"
            [model]="row.seed.unitPrice"
            [inlineError]="errors()['lines.' + index + '.unitPrice']"
            [autoId]="'order-line-' + index + '-unit-price'"
            required />
        </ng-template>
        <ng-template sdTableCellDef="amount" let-row="item">
          @let index = lines.rows().indexOf(row);
          <strong class="lines-table__amount" [attr.data-autoid]="'order-line-' + index + '-amount'">
            {{ lines.amounts()[index] | sdFormatNumber: 0 }}
          </strong>
        </ng-template>
      </sd-table>
      <div class="lines-table__summary">
        <span>{{ lines.rows().length }} d\xF2ng h\xE0ng</span>
        <strong
          >T\u1ED5ng ti\u1EC1n: <span data-autoid="order-total">{{ lines.total() | sdFormatNumber: 0 }}</span> \u20AB</strong
        >
      </div>
    </sd-section>
  \`,
  styles: \`
    /* Field trong d\xF2ng: 6px tr\xEAn d\u01B0\u1EDBi \u0111\u1EC3 d\xF2ng 44px v\u1EABn tho\xE1ng. */
    .lines-table__input {
      display: block;
      padding-block: 6px;
    }
    .lines-table__amount {
      display: block;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .lines-table__summary {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      padding: 12px 16px;
      color: var(--sd-text-secondary);
    }
    .lines-table__summary strong {
      color: var(--sd-text);
    }
  \`,
})
export class LinesTableFormComponent {
  readonly form = input.required<OrderForm>();
  /** D\xF2ng ban \u0111\u1EA7u (c\u1EADp nh\u1EADt) ho\u1EB7c m\u1ED9t d\xF2ng tr\u1ED1ng (t\u1EA1o m\u1EDBi). */
  readonly seed = input.required<readonly OrderLineDto[]>();
  /** L\u1ED7i theo field do API tr\u1EA3 v\u1EC1, kho\xE1 d\u1EA1ng \`lines.<index>.<field>\`. */
  readonly errors = input<Readonly<Record<string, string>>>({});
  readonly #injector = inject(Injector);
  private readonly table = viewChild(SdTable<LineItem>);
  protected readonly lines = orderLines(this.form, this.seed, { attach: 'manual' });
  protected readonly option: SdTableOption<LineItem> = {
    type: 'local',
    items: () => [...this.lines.rows()],
    rowKey: 'key',
    filter: { disabled: true },
    paginate: { hidden: true, pageSize: 200 },
    reload: {
      visible: false,
      // why: sd-table v\u1EBD d\xF2ng sau l\u1EA7n \u0111\u1ECDc; field trong \xF4 \u0111\u0103ng k\xFD xong th\xEC m\u1EDBi g\u1EAFn \`form.lines\` (xem \`orderLines\`).
      onReload: () => {
        afterNextRender(() => this.lines.attach(), { injector: this.#injector });
      },
    },
    config: { visible: false },
    columns: [
      { field: 'productId', title: 'S\u1EA3n ph\u1EA9m', type: 'string', minWidth: '180px' },
      { field: 'quantity', title: 'S\u1ED1 l\u01B0\u1EE3ng', type: 'number', width: '88px' },
      { field: 'unitPrice', title: '\u0110\u01A1n gi\xE1 (\u20AB)', type: 'number', width: '120px' },
      { field: 'amount', title: 'Th\xE0nh ti\u1EC1n (\u20AB)', type: 'number', width: '120px', align: 'right' },
    ],
    command: {
      commands: [
        {
          title: 'Xo\xE1 d\xF2ng',
          icon: 'delete',
          color: 'error',
          disabled: () => this.lines.rows().length === 1,
          click: row => this.lines.remove(row),
        },
      ],
    },
  };

  constructor() {
    // why: b\u1EA3ng local ch\u1EC9 \u0111\u1ECDc \`items\` khi t\u1EA3i; th\xEAm, xo\xE1 d\xF2ng hay n\u1EA1p \u0111\u01A1n kh\xE1c \u0111\u1EC1u ph\u1EA3i \`reload()\` \u0111\u1EC3 v\u1EBD l\u1EA1i. G\u1ECDi sau
    // l\u01B0\u1EE3t render, khi \`option\` c\u1EE7a b\u1EA3ng \u0111\xE3 \u0111\u01B0\u1EE3c g\xE1n.
    effect(() => {
      this.lines.rows();
      untracked(() => afterNextRender(() => void this.table()?.reload(), { injector: this.#injector }));
    });
  }
}
\`\`\`

## Quy t\u1EAFc

- MUST \u0111\u1EB7t Hu\u1EF7 (outline) v\xE0 n\xFAt l\u01B0u (fill, primary) \u1EDF \`headerRight\` c\u1EE7a \`sd-page-form\` (E3); kh\xF4ng l\u1EB7p n\xFAt l\u01B0u \u1EDF cu\u1ED1i th\xE2n.
- SHOULD cho n\xFAt l\u01B0u icon \`save\`; trang t\u1EA1o ghi r\xF5 h\xE0nh \u0111\u1ED9ng ("T\u1EA1o \u0111\u01A1n h\xE0ng"), trang c\u1EADp nh\u1EADt ghi "L\u01B0u".
- MUST \u0111\u1EB7t title "T\u1EA1o m\u1EDBi <entity>" ho\u1EB7c "C\u1EADp nh\u1EADt <entity> #<m\xE3>" (E5).
- MUST b\u1EA3o v\u1EC7 thay \u0111\u1ED5i ch\u01B0a l\u01B0u: \`canDeactivate: [sdPageFormLeaveGuard]\` tr\xEAn route v\xE0 \`registerSdUnsavedChangesForm(..., { dirty: 'value' })\` trong trang. G\xF5 r\u1ED3i s\u1EEDa v\u1EC1 nh\u01B0 c\u0169 kh\xF4ng b\u1ECB h\u1ECFi; \u0111\xF3ng tab tr\xECnh duy\u1EC7t khi c\xF2n thay \u0111\u1ED5i c\xF3 h\u1ED9p tho\u1EA1i c\u1EE7a tr\xECnh duy\u1EC7t.
- MUST ki\u1EC3m tra khi r\u1EDDi field v\xE0 khi b\u1EA5m L\u01B0u (\`markAllAsTouched\`); l\u01B0u l\u1ED7i th\xEC focus field l\u1ED7i \u0111\u1EA7u ti\xEAn (E13).
- MUST g\u1EAFn l\u1ED7i theo field c\u1EE7a API v\xE0o \u0111\xFAng field (\`[inlineError]\`), gi\u1EEF nguy\xEAn d\u1EEF li\u1EC7u \u0111\xE3 nh\u1EADp; field \u0111\u1ED5i gi\xE1 tr\u1ECB th\xEC b\u1ECF l\u1ED7i c\u0169 c\u1EE7a n\xF3.
- MUST l\u01B0u xong th\xEC \`markPristine()\` tr\u01B0\u1EDBc khi \u0111i\u1EC1u h\u01B0\u1EDBng, sang chi ti\u1EBFt v\u1EDBi \`replaceUrl: true\` \u0111\u1EC3 Back kh\xF4ng quay l\u1EA1i form t\u1EA1o m\u1EDBi.
- MUST kh\xF4ng khai b\xE1o tr\u01B0\u1EDBc FormControl tr\xF9ng t\xEAn v\u1EDBi field Core t\u1EF1 \u0111\u0103ng k\xFD.
- MUST d\xF9ng \`size="sm"\` v\xE0 \`hideInlineError\` cho field trong \xF4 c\u1EE7a b\u1EA3ng d\xF2ng, d\xF9 b\u1EA3ng l\xE0 \`<table>\` hay \`sd-table\`; field trong \xF4 kh\xF4ng c\xF3 label, c\u1ED9t b\u1EAFt bu\u1ED9c c\xF3 \`*\` m\xE0u error sau title.
- SHOULD d\xF9ng \`toc\` khi form c\xF3 t\u1EEB ba nh\xF3m tr\u1EDF l\xEAn; m\u1EE5c l\u1EE5c l\u1EA5y c\xE1c \`sd-section\` c\xF3 title, c\u1EA3 section n\u1EB1m trong component \`-form\` con.
- SHOULD gi\u1EEF b\u1EA3n ghi m\u1ED9t d\xF2ng (c\xE0i \u0111\u1EB7t) \u1EDF l\u1EA1i trang sau khi l\u01B0u: \`form.markAsPristine()\` l\xE0m gi\xE1 tr\u1ECB v\u1EEBa l\u01B0u th\xE0nh m\u1ED1c so s\xE1nh m\u1EDBi, footer b\xE1o tr\u1EA1ng th\xE1i l\u01B0u.

## L\u1ED7i hay g\u1EB7p

- Ch\u1EE5p gi\xE1 tr\u1ECB ban \u0111\u1EA7u l\xFAc kh\u1EDFi t\u1EA1o form khi field Core ch\u01B0a \u0111\u0103ng k\xFD: form v\u1EEBa m\u1EDF \u0111\xE3 b\u1ECB coi l\xE0 c\xF3 thay \u0111\u1ED5i. D\xF9ng \`dirty: 'value'\` c\u1EE7a \`registerSdUnsavedChangesForm\`.
- B\u1EAFt m\u1ECDi l\u1ED7i l\u01B0u r\u1ED3i b\xE1o chung "Kh\xF4ng th\u1EC3 l\u01B0u": l\u1ED7i theo field c\u1EE7a API m\u1EA5t ch\u1ED7 hi\u1EC7n.
- \u0110i\u1EC1u h\u01B0\u1EDBng sau khi l\u01B0u m\xE0 ch\u01B0a \`markPristine()\`: guard h\u1ECFi "R\u1EDDi trang khi ch\u01B0a l\u01B0u?" ngay sau khi l\u01B0u xong.
- B\u1EA5m L\u01B0u li\xEAn ti\u1EBFp t\u1EA1o hai request: ch\u1EB7n b\u1EB1ng c\u1EDD \`saving\` v\xE0 tr\u1EA1ng th\xE1i \`loading\` c\u1EE7a n\xFAt.
- G\u1EAFn FormArray d\xF2ng h\xE0ng v\xE0o form tr\u01B0\u1EDBc khi field c\u1EE7a c\xE1c d\xF2ng \u0111\u0103ng k\xFD xong (\`sd-table\` v\u1EBD d\xF2ng sau l\u1EA7n \u0111\u1ECDc \u0111\u1EA7u): \`dirty: 'value'\` l\u1EA5y d\xF2ng c\xF2n tr\u1ED1ng l\xE0m gi\xE1 tr\u1ECB \u0111\xE3 l\u01B0u, form v\u1EEBa m\u1EDF \u0111\xE3 h\u1ECFi "R\u1EDDi trang khi ch\u01B0a l\u01B0u?".
- \u0110\u1EC3 field trong \xF4 b\u1EA3ng \u1EDF c\u1EE1 \`md\` v\xE0 l\u1ED7i hi\u1EC7n d\u01B0\u1EDBi field: \xF4 s\u1ED1 v\xE0 select cao kh\xE1c nhau, d\xF2ng c\xF3 l\u1ED7i cao h\u01A1n c\xE1c d\xF2ng kh\xE1c, c\u1ED9t th\xE0nh ti\u1EC1n v\xE0 n\xFAt xo\xE1 l\u1EC7ch d\xF2ng.
`,"docs/header-actions.md":`# Header actions

N\xFAt \u1EDF header c\u1EE7a trang v\xE0 t\xE1c v\u1EE5 tr\xEAn d\xF2ng, tr\xEAn thanh ch\u1ECDn nhi\u1EC1u. M\u1EABu: \`/pattern/product\` (menu Nh\u1EADp/Xu\u1EA5t + T\u1EA1o m\u1EDBi), \`/pattern/order/:id/detail\` (t\xE1c v\u1EE5 theo tr\u1EA1ng th\xE1i duy\u1EC7t), \`/pattern/order\` (t\xE1c v\u1EE5 h\xE0ng lo\u1EA1t), \`/pattern/category\` (thao t\xE1c theo d\xF2ng).

## Khi n\xE0o d\xF9ng / khi n\xE0o kh\xF4ng

- Header ch\u1EE9a t\xE1c v\u1EE5 c\u1EE7a c\u1EA3 trang: t\u1EA1o m\u1EDBi, nh\u1EADp, xu\u1EA5t, c\u1EADp nh\u1EADt b\u1EA3n ghi, t\xE1c v\u1EE5 tr\u1EA1ng th\xE1i.
- T\xE1c v\u1EE5 c\u1EE7a m\u1ED9t d\xF2ng: \`command\` c\u1EE7a \`sd-table\`; c\u1EE7a nhi\u1EC1u d\xF2ng \u0111\xE3 ch\u1ECDn: \`selector.actions\`.

## Code m\u1EABu

M\u1ED9t wrapper \`headerRight\`; n\xFAt ch\xEDnh \`type="fill"\` ngo\xE0i c\xF9ng b\xEAn ph\u1EA3i; menu d\xF9ng Action Popover c\u1EE7a \`sd-button\`:

<!-- @source features/product/pages/list/list.component.html -->
\`\`\`html
<sd-page-list title="S\u1EA3n ph\u1EA9m" description="Danh m\u1EE5c s\u1EA3n ph\u1EA9m \u0111ang kinh doanh.">
  <div headerRight class="d-flex align-items-center gap-8 flex-wrap">
    <sd-button
      *sdPermission="'PATTERN_PRODUCT_R_MENU'"
      title="Nh\u1EADp/Xu\u1EA5t"
      suffixIcon="expand_more"
      type="outline"
      autoId="product-data-menu">
      <sd-button-item *sdPermission="'PATTERN_PRODUCT_C_IMPORT'" prefixIcon="upload" (click)="openImport()">Nh\u1EADp d\u1EEF li\u1EC7u</sd-button-item>
      <sd-button-item *sdPermission="'PATTERN_PRODUCT_R_EXPORT'" prefixIcon="download" (click)="exportData()">Xu\u1EA5t d\u1EEF li\u1EC7u</sd-button-item>
    </sd-button>
    <sd-button
      *sdPermission="'PATTERN_PRODUCT_C_CREATE'"
      title="T\u1EA1o m\u1EDBi"
      prefixIcon="add"
      type="fill"
      color="primary"
      autoId="product-create"
      [routerLink]="['create']" />
  </div>

  <sd-table autoId="product-list" [option]="tableOption">
    <ng-template sdTableCellDef="code" let-product="item">
      <a *sdPermission="'PATTERN_PRODUCT_R_DETAIL'" [routerLink]="[product.id, 'detail']">{{ product.code }}</a>
      @if (!canOpenDetail) {
        <span>{{ product.code }}</span>
      }
    </ng-template>
  </sd-table>
</sd-page-list>
\`\`\`

T\xE1c v\u1EE5 theo quy\u1EC1n v\xE0 tr\u1EA1ng th\xE1i, x\xE1c nh\u1EADn tr\u01B0\u1EDBc khi \u0111\u1ED5i tr\u1EA1ng th\xE1i, T\u1EEB ch\u1ED1i b\u1EAFt bu\u1ED9c l\xFD do:

<!-- @source features/order/pages/detail/detail.component.ts -->
\`\`\`ts
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdView } from '@sdcorejs/angular/components/view';
import { SD_PAGE_LIST, SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import { SdEmptyPipe, SdFormatDatePipe, SdFormatDatetimePipe, SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage } from '../../../../utils/api-error';
import { CustomerDetailPipe } from '../../../customer/pipes/customer-detail.pipe';
import { ApprovalStepsComponent } from '../../components/approval-steps/approval-steps.component';
import { LinesViewComponent } from '../../components/lines-view/lines-view.component';
import { OrderService } from '../../services/order.service';
import { canUpdateOrder, orderApprovalBadge, orderStatusBadge, type OrderAction, type OrderDto } from '../../services/order.model';

/**
 * Chi ti\u1EBFt \u0111\u01A1n (\`:id/detail\`, route con c\u1EE7a danh s\xE1ch). M\u1EDF trong drawer 600px ho\u1EB7c trang \`sd-page-detail\` theo
 * \`detail\` c\u1EE7a \`sd-page-list\`. G\u1EEDi duy\u1EC7t, Duy\u1EC7t v\xE0 T\u1EEB ch\u1ED1i \u0111\u1EC1u h\u1ECFi x\xE1c nh\u1EADn; T\u1EEB ch\u1ED1i b\u1EAFt bu\u1ED9c l\xFD do (E13).
 */
@Component({
  selector: 'detail',
  standalone: true,
  imports: [
    AsyncPipe,
    NgTemplateOutlet,
    RouterLink,
    SdPageComponent,
    SdSideDrawer,
    SdBadge,
    SdButton,
    SdSection,
    SdSectionItem,
    SdView,
    SdPermissionDirective,
    SdEmptyPipe,
    SdFormatDatePipe,
    SdFormatDatetimePipe,
    SdFormatNumberPipe,
    CustomerDetailPipe,
    ApprovalStepsComponent,
    LinesViewComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @let order = entity();
    @let customer = order.customerId | customerDetail | async;
    <ng-template #actions>
      @if (order.approval === 'submitted') {
        <sd-button
          *sdPermission="'PATTERN_ORDER_U_REJECT'"
          title="T\u1EEB ch\u1ED1i"
          prefixIcon="close"
          type="light"
          color="warning"
          autoId="order-reject"
          [disabled]="pending()"
          (click)="act('reject')" />
        <sd-button
          *sdPermission="'PATTERN_ORDER_U_APPROVE'"
          title="Duy\u1EC7t"
          prefixIcon="check"
          type="fill"
          color="success"
          autoId="order-approve"
          [disabled]="pending()"
          (click)="act('approve')" />
      }
      @if (editable()) {
        <sd-button
          *sdPermission="'PATTERN_ORDER_U_SUBMIT'"
          title="G\u1EEDi duy\u1EC7t"
          prefixIcon="send"
          type="outline"
          autoId="order-submit"
          [disabled]="pending()"
          (click)="act('submit')" />
        <sd-button
          *sdPermission="'PATTERN_ORDER_U_UPDATE'"
          title="C\u1EADp nh\u1EADt \u0111\u01A1n h\xE0ng"
          prefixIcon="edit"
          type="fill"
          color="primary"
          autoId="order-update"
          [disabled]="pending()"
          [routerLink]="['../update']" />
      }
    </ng-template>

    @if (mode() === 'drawer') {
      <sd-side-drawer width="600px" autoId="order-detail" (sdClosed)="closed()">
        <div sdHeaderLeft class="d-flex align-items-center gap-8">
          <span class="T16M">\u0110\u01A1n h\xE0ng {{ order.code }}</span>
          <sd-badge size="md" type="round" [title]="statusBadge().title" [color]="statusBadge().color" />
        </div>
        <sd-section title="Th\xF4ng tin chung">
          <sd-section-item label="Kh\xE1ch h\xE0ng">{{ order.customer }}</sd-section-item>
          <sd-section-item label="K\xEAnh b\xE1n">{{ order.channel }}</sd-section-item>
          <sd-section-item label="Kho xu\u1EA5t">{{ order.warehouse }}</sd-section-item>
          <sd-section-item label="Thanh to\xE1n">{{ order.payment }}</sd-section-item>
          <sd-section-item label="Ng\xE0y t\u1EA1o">{{ order.createdAt | sdFormatDatetime }}</sd-section-item>
          <sd-section-item label="T\u1ED5ng ti\u1EC1n (\u20AB)">{{ order.total | sdFormatNumber: 0 }}</sd-section-item>
          <sd-section-item label="Tr\u1EA1ng th\xE1i">
            <div class="d-flex align-items-center gap-8 flex-wrap">
              @for (badge of badges(); track $index) {
                <sd-badge [type]="badge.type" [title]="badge.title" [color]="badge.color" />
              }
            </div>
          </sd-section-item>
        </sd-section>
        <div sdFooterRight class="d-flex align-items-center gap-8 flex-wrap">
          <ng-container [ngTemplateOutlet]="actions" />
        </div>
      </sd-side-drawer>
    } @else {
      <sd-page-detail
        [title]="'Chi ti\u1EBFt \u0111\u01A1n h\xE0ng #' + order.code"
        [description]="order.customer + ' \xB7 ' + order.channel"
        [badges]="badges()"
        [backLink]="['../..']">
        <div headerRight class="d-flex align-items-center gap-8 flex-wrap">
          <ng-container [ngTemplateOutlet]="actions" />
        </div>
        <div class="d-flex flex-column gap-16 py-16">
          <sd-section title="Th\xF4ng tin chung">
            <div class="row p-8">
              <div class="col-12 col-md-6 p-8"><sd-view label="Kh\xE1ch h\xE0ng" [display]="order.customer" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="\u0110i\u1EC7n tho\u1EA1i" [display]="customer?.phone" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="K\xEAnh b\xE1n" [display]="order.channel" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="Kho xu\u1EA5t" [display]="order.warehouse" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="Thanh to\xE1n" [display]="order.payment" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="Ng\xE0y t\u1EA1o" [display]="order.createdAt | sdFormatDatetime" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="Ng\xE0y giao" [display]="order.deliveredAt | sdFormatDate" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="M\xE3 v\u1EADn \u0111\u01A1n" [display]="order.tracking" /></div>
            </div>
          </sd-section>
          <lines-view [lines]="order.lines" />
          <sd-section title="Th\xF4ng tin ph\xEA duy\u1EC7t">
            <sd-section-item label="Tr\u1EA1ng th\xE1i duy\u1EC7t">
              <sd-badge [type]="approvalBadge().type" [title]="approvalBadge().title" [color]="approvalBadge().color" />
            </sd-section-item>
            <sd-section-item label="Ng\u01B0\u1EDDi g\u1EEDi duy\u1EC7t">{{ submitted()?.by | sdEmpty }}</sd-section-item>
            <sd-section-item label="Ng\u01B0\u1EDDi duy\u1EC7t">{{ decided()?.by | sdEmpty }}</sd-section-item>
            <sd-section-item label="L\xFD do t\u1EEB ch\u1ED1i">{{ decided()?.reason | sdEmpty }}</sd-section-item>
            <sd-section-item label="Ghi ch\xFA">{{ order.note | sdEmpty }}</sd-section-item>
          </sd-section>
        </div>
        <approval-steps sdAside [steps]="order.approvalHistory" />
      </sd-page-detail>
    }
  \`,
})
export class DetailComponent {
  readonly #orderService = inject(OrderService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  private readonly drawer = viewChild(SdSideDrawer);
  protected readonly mode = inject(SD_PAGE_LIST).detail;
  readonly #resolved = toSignal(this.#route.data.pipe(map(data => data['entity'] as OrderDto)), { requireSync: true });
  /** \u0110\u01A1n do resolver t\u1EA3i; sau m\u1ED7i t\xE1c v\u1EE5 thay b\u1EB1ng \u0111\u01A1n API tr\u1EA3 v\u1EC1. */
  protected readonly entity = linkedSignal(() => this.#resolved());
  protected readonly pending = signal(false);
  protected readonly statusBadge = computed(() => orderStatusBadge(this.entity().status));
  protected readonly approvalBadge = computed(() => orderApprovalBadge(this.entity().approval));
  /** Tr\u1EA1ng th\xE1i \u0111\u01A1n v\xE0 tr\u1EA1ng th\xE1i duy\u1EC7t: title c\u1EE7a trang, d\xF2ng "Tr\u1EA1ng th\xE1i" c\u1EE7a drawer. */
  protected readonly badges = computed(() => [this.statusBadge(), this.approvalBadge()]);
  protected readonly editable = computed(() => canUpdateOrder(this.entity()));
  protected readonly submitted = computed(() => [...this.entity().approvalHistory].reverse().find(step => step.action === 'submit'));
  protected readonly decided = computed(() =>
    this.entity().approval === 'approved' || this.entity().approval === 'rejected' ? this.entity().approvalHistory.at(-1) : undefined
  );

  constructor() {
    afterNextRender(() => this.drawer()?.open());
  }

  protected closed(): void {
    void this.#router.navigate(['../..'], { relativeTo: this.#route });
  }

  /** H\u1ECFi x\xE1c nh\u1EADn (T\u1EEB ch\u1ED1i k\xE8m l\xFD do), g\u1ECDi API, r\u1ED3i hi\u1EC3n th\u1ECB \u0111\u01A1n m\u1EDBi; l\u1ED7i gi\u1EEF nguy\xEAn m\xE0n \u0111\u1EC3 th\u1EED l\u1EA1i. */
  protected async act(action: Extract<OrderAction, 'submit' | 'approve' | 'reject'>): Promise<void> {
    const order = this.entity();
    let reason: string | undefined;
    try {
      if (action === 'reject') {
        reason = await this.#confirm.withInput(\`T\u1EEB ch\u1ED1i \u0111\u01A1n \${order.code}. L\xFD do \u0111\u01B0\u1EE3c g\u1EEDi cho ng\u01B0\u1EDDi l\u1EADp \u0111\u01A1n.\`, {
          title: 'T\u1EEB ch\u1ED1i \u0111\u01A1n h\xE0ng',
          label: 'L\xFD do t\u1EEB ch\u1ED1i',
          required: true,
          maxlength: 200,
          yesTitle: 'T\u1EEB ch\u1ED1i',
          noTitle: 'Kh\xF4ng',
          yesButtonColor: 'warning',
        });
      } else {
        await this.#confirm.confirm(action === 'approve' ? \`Duy\u1EC7t \u0111\u01A1n \${order.code}?\` : \`G\u1EEDi \u0111\u01A1n \${order.code} cho ng\u01B0\u1EDDi duy\u1EC7t?\`, {
          title: action === 'approve' ? 'Duy\u1EC7t \u0111\u01A1n h\xE0ng' : 'G\u1EEDi duy\u1EC7t',
          yesTitle: action === 'approve' ? 'Duy\u1EC7t' : 'G\u1EEDi duy\u1EC7t',
          noTitle: 'Kh\xF4ng',
        });
      }
    } catch {
      return;
    }
    this.pending.set(true);
    try {
      this.entity.set(await firstValueFrom(this.#orderService.act(action, { id: order.id, reason })));
      this.#notify.success(action === 'approve' ? '\u0110\xE3 duy\u1EC7t \u0111\u01A1n.' : action === 'reject' ? '\u0110\xE3 t\u1EEB ch\u1ED1i \u0111\u01A1n.' : '\u0110\xE3 g\u1EEDi duy\u1EC7t.');
    } catch (error) {
      this.#notify.error(apiErrorMessage(error));
    } finally {
      this.pending.set(false);
    }
  }
}
\`\`\`

T\xE1c v\u1EE5 h\xE0ng lo\u1EA1t b\xE1o k\u1EBFt qu\u1EA3 t\u1EEBng ph\u1EA7n, gi\u1EEF c\xE1c d\xF2ng l\u1ED7i \u0111ang ch\u1ECDn, cho th\u1EED l\u1EA1i ph\u1EA7n l\u1ED7i:

<!-- @source features/order/components/bulk-result/bulk-result.component.ts -->
\`\`\`ts
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SdInform } from '@sdcorejs/angular/components/inform';

/** K\u1EBFt qu\u1EA3 c\u1EE7a m\u1ED9t t\xE1c v\u1EE5 h\xE0ng lo\u1EA1t: s\u1ED1 th\xE0nh c\xF4ng tr\xEAn t\u1ED5ng v\xE0 t\u1EEBng \u0111\u01A1n l\u1ED7i. */
export interface OrderBulkSummary {
  /** \u0110\u1ED9ng t\u1EEB c\u1EE7a t\xE1c v\u1EE5, v\xED d\u1EE5 "\u0110\xE3 x\xE1c nh\u1EADn". */
  readonly done: string;
  readonly total: number;
  readonly failed: readonly { readonly id: string; readonly code: string; readonly message: string }[];
}

/** B\xE1o k\u1EBFt qu\u1EA3 t\u1EEBng ph\u1EA7n (E13): "\u0110\xE3 x\xE1c nh\u1EADn 8/10. 2 \u0111\u01A1n l\u1ED7i." k\xE8m l\u1ED7i t\u1EEBng \u0111\u01A1n v\xE0 n\xFAt th\u1EED l\u1EA1i ph\u1EA7n l\u1ED7i. */
@Component({
  selector: 'bulk-result',
  standalone: true,
  imports: [SdInform],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @let _result = result();
    <sd-inform
      autoId="order-bulk-result"
      [color]="_result.failed.length ? 'warning' : 'success'"
      [title]="title()"
      [description]="failures()"
      [actionLabel]="_result.failed.length ? 'Th\u1EED l\u1EA1i ph\u1EA7n l\u1ED7i' : undefined"
      closable
      (sdAction)="retry.emit()"
      (sdClosed)="dismiss.emit()" />
  \`,
})
export class BulkResultComponent {
  readonly result = input.required<OrderBulkSummary>();
  readonly retry = output<void>();
  readonly dismiss = output<void>();
  protected readonly title = computed(() => {
    const { done, total, failed } = this.result();
    return \`\${done} \${total - failed.length}/\${total}.\` + (failed.length ? \` \${failed.length} \u0111\u01A1n l\u1ED7i.\` : '');
  });
  // why: n\u1ED9i dung chi\u1EBFu v\xE0o sd-inform thay c\u1EA3 ti\xEAu \u0111\u1EC1 l\u1EABn n\xFAt h\xE0nh \u0111\u1ED9ng; l\u1ED7i t\u1EEBng \u0111\u01A1n \u0111i qua \`description\`.
  protected readonly failures = computed(
    () =>
      this.result()
        .failed.map(item => \`\${item.code}: \${item.message}\`)
        .join(' ') || undefined
  );
}
\`\`\`

## Quy t\u1EAFc

- MUST c\xF3 m\u1ED9t n\xFAt ch\xEDnh n\u1ED5i b\u1EADt; n\xFAt ph\u1EE5 d\xF9ng ki\u1EC3u nh\u1EB9 h\u01A1n v\xE0 th\u1EE9 t\u1EF1 \u1ED5n \u0111\u1ECBnh.
- MUST t\u1ED1i \u0111a ba t\xE1c v\u1EE5 c\u1EA5p ngo\xE0i trong m\u1ED7i v\xF9ng; t\u1EEB b\u1ED1n t\xE1c v\u1EE5, gi\u1EEF hai t\xE1c v\u1EE5 \u01B0u ti\xEAn v\xE0 gom t\u1EEB t\xE1c v\u1EE5 th\u1EE9 ba v\xE0o "Thao t\xE1c kh\xE1c".
- MUST d\xF9ng "C\u1EADp nh\u1EADt <entity>", kh\xF4ng d\xF9ng "Ch\u1EC9nh s\u1EEDa" (E5); n\xFAt c\u1EADp nh\u1EADt c\xF3 icon \`edit\`.
- MUST g\u1EAFn \`*sdPermission\` cho t\u1EEBng t\xE1c v\u1EE5 v\xE0 cho menu; \u0111i\u1EC1u ki\u1EC7n tr\u1EA1ng th\xE1i t\xEDnh trong TS. Kh\xF4ng c\xF3 nh\xF3m r\u1ED7ng khi m\u1ECDi t\xE1c v\u1EE5 con b\u1ECB \u1EA9n.
- MUST h\u1ECFi x\xE1c nh\u1EADn tr\u01B0\u1EDBc Xo\xE1, Duy\u1EC7t, T\u1EEB ch\u1ED1i v\xE0 m\u1ECDi t\xE1c v\u1EE5 \u0111\u1ED5i tr\u1EA1ng th\xE1i, c\u1EA3 t\u1EEBng b\u1EA3n ghi l\u1EABn h\xE0ng lo\u1EA1t; T\u1EEB ch\u1ED1i v\xE0 Hu\u1EF7 b\u1EAFt bu\u1ED9c l\xFD do (E13).
- MUST b\xE1o k\u1EBFt qu\u1EA3 h\xE0ng lo\u1EA1t theo t\u1EEBng b\u1EA3n ghi: "\u0110\xE3 x\xE1c nh\u1EADn 8/10. 2 \u0111\u01A1n l\u1ED7i.", gi\u1EEF d\xF2ng l\u1ED7i \u0111ang ch\u1ECDn, c\xF3 "Th\u1EED l\u1EA1i ph\u1EA7n l\u1ED7i".
- MUST ch\u1EB7n b\u1EA5m l\u1EB7p khi t\xE1c v\u1EE5 \u0111ang ch\u1EA1y (\`disabled\`, \`loading\`).

## L\u1ED7i hay g\u1EB7p

- Coi request h\xE0ng lo\u1EA1t tr\u1EA3 200 l\xE0 th\xE0nh c\xF4ng to\xE0n b\u1ED9: API tr\u1EA3 k\u1EBFt qu\u1EA3 t\u1EEBng b\u1EA3n ghi, ph\u1EA3i \u0111\u1ECDc.
- B\u1ECF ch\u1ECDn t\u1EA5t c\u1EA3 sau t\xE1c v\u1EE5 h\xE0ng lo\u1EA1t: ng\u01B0\u1EDDi d\xF9ng m\u1EA5t d\u1EA5u c\xE1c d\xF2ng l\u1ED7i.
- T\xE1c v\u1EE5 C\u1EADp nh\u1EADt, Chi ti\u1EBFt tr\xEAn d\xF2ng danh s\xE1ch: m\u1EDF chi ti\u1EBFt b\u1EB1ng link tr\xEAn m\xE3; c\u1EADp nh\u1EADt n\u1EB1m \u1EDF chi ti\u1EBFt.
`,"docs/list.md":`# List

Danh s\xE1ch c\xF3 b\u1EA3ng: \`sd-page-list\` + \`sd-table\`. Route m\u1EABu: \`/pattern/product\` (\u0111\u01A1n gi\u1EA3n), \`/pattern/order\` (tab, score card, ch\u1ECDn nhi\u1EC1u, t\xE1c v\u1EE5 h\xE0ng lo\u1EA1t), \`/pattern/customer\` (score card l\u1ECDc), \`/pattern/category\` (b\u1EA3ng c\xE2y).

## Khi n\xE0o d\xF9ng / khi n\xE0o kh\xF4ng

- D\xF9ng cho m\xE0n c\xF3 m\u1ED9t b\u1EA3ng ch\xEDnh: t\xECm, l\u1ECDc, ph\xE2n trang, m\u1EDF chi ti\u1EBFt.
- Danh s\xE1ch v\xE0 chi ti\u1EBFt c\u1EA7n c\u1EA1nh nhau \u0111\u1EC3 x\u1EED l\xFD nhanh t\u1EEBng m\u1EE5c: d\xF9ng [split](split.md).
- M\u1ED9t b\u1EA3n ghi duy nh\u1EA5t (c\xE0i \u0111\u1EB7t): d\xF9ng [form](form.md), kh\xF4ng d\u1EF1ng danh s\xE1ch m\u1ED9t d\xF2ng.

## Code m\u1EABu

Danh s\xE1ch \u0111\u01A1n gi\u1EA3n: quick search, filter d\u01B0\u1EDBi c\u1ED9t, m\xE3 l\xE0 link theo quy\u1EC1n, header c\xF3 menu Nh\u1EADp/Xu\u1EA5t v\xE0 T\u1EA1o m\u1EDBi.

<!-- @source features/product/pages/list/list.component.html -->
\`\`\`html
<sd-page-list title="S\u1EA3n ph\u1EA9m" description="Danh m\u1EE5c s\u1EA3n ph\u1EA9m \u0111ang kinh doanh.">
  <div headerRight class="d-flex align-items-center gap-8 flex-wrap">
    <sd-button
      *sdPermission="'PATTERN_PRODUCT_R_MENU'"
      title="Nh\u1EADp/Xu\u1EA5t"
      suffixIcon="expand_more"
      type="outline"
      autoId="product-data-menu">
      <sd-button-item *sdPermission="'PATTERN_PRODUCT_C_IMPORT'" prefixIcon="upload" (click)="openImport()">Nh\u1EADp d\u1EEF li\u1EC7u</sd-button-item>
      <sd-button-item *sdPermission="'PATTERN_PRODUCT_R_EXPORT'" prefixIcon="download" (click)="exportData()">Xu\u1EA5t d\u1EEF li\u1EC7u</sd-button-item>
    </sd-button>
    <sd-button
      *sdPermission="'PATTERN_PRODUCT_C_CREATE'"
      title="T\u1EA1o m\u1EDBi"
      prefixIcon="add"
      type="fill"
      color="primary"
      autoId="product-create"
      [routerLink]="['create']" />
  </div>

  <sd-table autoId="product-list" [option]="tableOption">
    <ng-template sdTableCellDef="code" let-product="item">
      <a *sdPermission="'PATTERN_PRODUCT_R_DETAIL'" [routerLink]="[product.id, 'detail']">{{ product.code }}</a>
      @if (!canOpenDetail) {
        <span>{{ product.code }}</span>
      }
    </ng-template>
  </sd-table>
</sd-page-list>
\`\`\`

<!-- @source features/product/pages/list/list.component.ts -->
\`\`\`ts
import { ChangeDetectionStrategy, Component, effect, inject, untracked, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdButton, SdButtonItem } from '@sdcorejs/angular/components/button';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdPageList } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { ProductService } from '../../services/product.service';
import { PRODUCT_STATUS_OPTIONS, productStatusBadge, type ProductDto } from '../../services/product.model';

@Component({
  selector: 'list',
  standalone: true,
  templateUrl: './list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SdPageList, SdButton, SdButtonItem, SdTable, SdTableCellDefDirective, SdPermissionDirective],
})
export class ListComponent {
  readonly #productService = inject(ProductService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  private readonly pageList = viewChild.required(SdPageList);
  private readonly table = viewChild.required(SdTable);
  // Route guard \u0111\xE3 n\u1EA1p quy\u1EC1n tr\u01B0\u1EDBc khi t\u1EA1o page; d\xF9ng cho text thay link khi thi\u1EBFu quy\u1EC1n xem chi ti\u1EBFt.
  protected readonly canOpenDetail = inject(SdPermissionService).hasPermission('PATTERN_PRODUCT_R_DETAIL');

  protected readonly tableOption: SdTableOption<ProductDto> = {
    type: 'server',
    items: (_, req) => firstValueFrom(this.#productService.list(req)),
    sort: { enable: true },
    filter: {
      quickSearch: {
        containFields: ['code', 'name'],
        placeholder: 'T\xECm theo m\xE3 ho\u1EB7c t\xEAn s\u1EA3n ph\u1EA9m',
      },
    },
    columns: [
      { field: 'code', title: 'M\xE3 s\u1EA3n ph\u1EA9m', type: 'string', width: '160px', sortable: true },
      { field: 'name', title: 'T\xEAn s\u1EA3n ph\u1EA9m', type: 'string', minWidth: '240px', sortable: true },
      { field: 'unit', title: '\u0110\u01A1n v\u1ECB t\xEDnh', type: 'string', width: '140px' },
      { field: 'price', title: 'Gi\xE1 b\xE1n (\u20AB)', type: 'number', width: '150px', align: 'right', sortable: true },
      {
        field: 'status',
        title: 'Tr\u1EA1ng th\xE1i',
        type: 'values',
        width: '180px',
        option: { items: PRODUCT_STATUS_OPTIONS, valueField: 'id', displayField: 'name' },
        useBadge: status => productStatusBadge(status),
      },
    ],
  };

  constructor() {
    // L\u01B0u \u1EDF trang con xong r\u1ED3i quay v\u1EC1: t\u1EA3i l\u1EA1i \u0111\xFAng trang, b\u1ED9 l\u1ECDc v\xE0 v\u1ECB tr\xED cu\u1ED9n \u0111ang c\xF3.
    let seen = this.#productService.changes();
    effect(() => {
      const changes = this.#productService.changes();
      if (this.pageList().childActive() || changes === seen) return;
      seen = changes;
      untracked(() => void this.table().reload(true, false));
    });
  }

  protected openImport(): void {
    void this.#router.navigate(['../import'], { relativeTo: this.#route });
  }

  protected exportData(): void {
    this.table().exportExcel();
  }
}
\`\`\`

Chi ti\u1EBFt, t\u1EA1o v\xE0 c\u1EADp nh\u1EADt l\xE0 route con c\u1EE7a danh s\xE1ch, n\xEAn quay l\u1EA1i v\u1EABn gi\u1EEF b\u1ED9 l\u1ECDc, trang v\xE0 v\u1ECB tr\xED cu\u1ED9n:

<!-- @source features/product/routes.ts -->
\`\`\`ts
import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { entityResolver } from './entity.resolver';
import { ProductService } from './services/product.service';

/** Detail, create v\xE0 update l\xE0 route con c\u1EE7a danh s\xE1ch: quay l\u1EA1i v\u1EABn gi\u1EEF b\u1ED9 l\u1ECDc, trang v\xE0 v\u1ECB tr\xED cu\u1ED9n. */
export const routes: Routes = [
  {
    path: '',
    providers: [ProductService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: 'S\u1EA3n ph\u1EA9m',
        data: { permission: 'PATTERN_PRODUCT_R_LIST' },
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
        children: [
          {
            path: 'create',
            title: 'T\u1EA1o s\u1EA3n ph\u1EA9m',
            data: { permission: 'PATTERN_PRODUCT_C_CREATE' },
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () => import('./pages/create/create.component').then(module => module.CreateComponent),
          },
          {
            path: ':id/detail',
            title: 'Chi ti\u1EBFt s\u1EA3n ph\u1EA9m',
            data: { permission: 'PATTERN_PRODUCT_R_DETAIL' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () => import('./pages/detail/detail.component').then(module => module.DetailComponent),
          },
          {
            path: ':id/update',
            title: 'C\u1EADp nh\u1EADt s\u1EA3n ph\u1EA9m',
            data: { permission: 'PATTERN_PRODUCT_U_UPDATE' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () => import('./pages/update/update.component').then(module => module.UpdateComponent),
          },
        ],
      },
    ],
  },
];
\`\`\`

Tab, score card v\xE0 request d\xF9ng chung m\u1ED9t state; \u0111\u1ED5i tr\u1EA1ng th\xE1i th\xEC \u0111\u1ECDc l\u1EA1i t\u1EEB trang 1:

<!-- @source features/order/pages/list/list.component.html -->
\`\`\`html
@let _settings = settings();
<sd-page-list title="\u0110\u01A1n h\xE0ng" description="\u0110\u01A1n b\xE1n l\u1EBB t\u1EEB m\u1ECDi k\xEAnh." [detail]="detailMode()" [autoCompact]="_settings.autoCompact">
  <div headerRight class="d-flex align-items-center gap-8 flex-wrap">
    <!-- Ch\u1EC9 c\xF3 \u1EDF /pattern. -->
    <sd-pattern-settings-button />
    <sd-button
      *sdPermission="'PATTERN_ORDER_C_CREATE'"
      title="T\u1EA1o \u0111\u01A1n h\xE0ng"
      prefixIcon="add"
      type="fill"
      color="primary"
      autoId="order-create"
      [routerLink]="['create']" />
  </div>

  @if (_settings.tabs) {
    <sd-tab-group sdSubheader [selectedIndex]="tabIndex()" (selectedIndexChange)="selectTab($event)">
      @for (tab of tabs; track tab.label) {
        <sd-tab [label]="tab.label" [badge]="counts()?.[tab.status ?? 'all']" />
      }
    </sd-tab-group>
  }
  @if (_settings.score) {
    <summary-cards [counts]="counts()" [(status)]="status" />
  }
  @if (bulkResult(); as result) {
    <bulk-result [result]="result" (retry)="retryFailed()" (dismiss)="bulkResult.set(null)" />
  }

  <sd-table autoId="orders" [option]="option()">
    <ng-template sdTableCellDef="code" let-order="item">
      <a *sdPermission="'PATTERN_ORDER_R_DETAIL'" [routerLink]="[order.id, 'detail']">{{ order.code }}</a>
      @if (!canOpenDetail) {
        <span>{{ order.code }}</span>
      }
    </ng-template>
  </sd-table>
</sd-page-list>
\`\`\`

<!-- @source features/order/pages/list/list.component.ts#state -->
\`\`\`ts
/** M\u1ED9t state cho tab, score card v\xE0 request: \u0111\u1ED5i tr\u1EA1ng th\xE1i th\xEC \u0111\u1ECDc l\u1EA1i t\u1EEB trang 1. */
protected readonly status = signal<OrderStatus | null>(null);
protected readonly tabIndex = computed(() => TABS.findIndex(tab => tab.status === this.status()));
protected readonly counts = signal<OrderCounts | null>(null);
\`\`\`

## Quy t\u1EAFc

- MUST d\xF9ng \`sd-page-list\`; b\u1EA3ng ch\xEDnh l\xE0 \`sd-table\` tr\u1EF1c ti\u1EBFp trong th\xE2n (ho\u1EB7c ph\u1EA7n t\u1EED g\u1EAFn \`sdPageListMain\`). Kh\xF4ng vi\u1EBFt \`h-full\`, \`overflow\` hay chi\u1EC1u cao cho danh s\xE1ch (E1).
- MUST m\u1EDF chi ti\u1EBFt b\u1EB1ng link tr\xEAn m\xE3 ho\u1EB7c t\xEAn \u1EDF c\u1ED9t d\u1EEF li\u1EC7u \u0111\u1EA7u ti\xEAn. Kh\xF4ng c\xF3 t\xE1c v\u1EE5 Xem/C\u1EADp nh\u1EADt tr\xEAn d\xF2ng, tr\xEAn thanh ch\u1ECDn nhi\u1EC1u hay \u1EDF header.
- MUST hi\u1EC7n m\xE3 d\u1EA1ng ch\u1EEF khi thi\u1EBFu quy\u1EC1n xem chi ti\u1EBFt; chu\u1EA9n b\u1ECB c\u1EDD quy\u1EC1n trong TS (\`hasPermission\` sau khi guard \u0111\xE3 n\u1EA1p quy\u1EC1n), kh\xF4ng g\u1ECDi service quy\u1EC1n trong template.
- MUST \u0111\u1EB7t chi ti\u1EBFt, t\u1EA1o, c\u1EADp nh\u1EADt l\xE0 route con c\u1EE7a danh s\xE1ch; \`detail="page"\` \u1EA9n danh s\xE1ch, \`detail="drawer"\` gi\u1EEF danh s\xE1ch tr\xEAn m\xE0n.
- MUST t\u1EA3i l\u1EA1i danh s\xE1ch khi trang con \u0111\xE3 l\u01B0u th\xE0nh c\xF4ng (service \u0111\u1EBFm s\u1ED1 l\u1EA7n thay \u0111\u1ED5i), kh\xF4ng t\u1EA3i l\u1EA1i m\u1ED7i l\u1EA7n \u0111\xF3ng.
- MUST gi\u1EEF m\u1ED9t ch\u1ED7 l\u1ECDc cho m\u1ED7i field (E6): field c\xF3 c\u1ED9t l\u1ECDc d\u01B0\u1EDBi c\u1ED9t; external filter ch\u1EC9 ch\u1EE9a field kh\xF4ng c\xF3 c\u1ED9t; c\xF3 tab tr\u1EA1ng th\xE1i th\xEC t\u1EAFt filter d\u01B0\u1EDBi c\u1ED9t Tr\u1EA1ng th\xE1i. Kh\xF4ng b\u1EADt quick search c\xF9ng external filter.
- MUST truy\u1EC1n nguy\xEAn \`PagingReq\` (tham s\u1ED1 th\u1EE9 hai c\u1EE7a \`items\`) v\xE0o service; service chuy\u1EC3n sang \u0111\u1ECBnh d\u1EA1ng c\u1EE7a API.
- SHOULD gi\u1EEF m\u1EB7c \u0111\u1ECBnh \`hideInlineFilter: false\`; m\xE0n \xEDt d\u1EEF li\u1EC7u d\xF9ng \`'auto'\`; kh\xF4ng d\xF9ng \`true\` (E7).
- SHOULD g\u1ECDi \`reloadFirstPage()\` c\u1EE7a \`sd-table\` khi m\u1ED9t \u0111i\u1EC1u ki\u1EC7n ngo\xE0i b\u1EA3ng (tab, score card) \u0111\u1ED5i; \`reload()\` gi\u1EEF trang hi\u1EC7n t\u1EA1i.

## L\u1ED7i hay g\u1EB7p

- B\u1ECDc \`sd-table\` trong \`div\` c\xF3 chi\u1EC1u cao c\u1ED1 \u0111\u1ECBnh ho\u1EB7c \`overflow: auto\`: sinh scrollbar th\u1EE9 hai, paginator b\u1ECB \u0111\u1EA9y kh\u1ECFi m\xE0n h\xECnh.
- L\u1ECDc tr\u1EA1ng th\xE1i \u1EDF c\u1EA3 tab, score card v\xE0 d\u01B0\u1EDBi c\u1ED9t: ba state l\u1EC7ch nhau, request kh\xF4ng kh\u1EDBp th\u1EE9 ng\u01B0\u1EDDi d\xF9ng th\u1EA5y.
- \u0110\u1ED5i tab m\xE0 v\u1EABn \u1EDF trang 3: danh s\xE1ch r\u1ED7ng d\xF9 c\xF3 d\u1EEF li\u1EC7u.
- L\u1EA5y d\u1EEF li\u1EC7u c\u1EE7a d\xF2ng l\xE0m chi ti\u1EBFt: d\xF2ng ch\u1EC9 c\xF3 v\xE0i field; chi ti\u1EBFt lu\xF4n t\u1EA3i b\u1EB1ng \`detail(id)\`.
`,"docs/relation.md":`# Relation

Hi\u1EC7n b\u1EA3n ghi li\xEAn quan theo ID b\u1EB1ng pipe \`<entity>Detail\` c\u1EE7a feature s\u1EDF h\u1EEFu entity. M\u1EABu: \`customerDetail\` (\u0111i\u1EC7n tho\u1EA1i kh\xE1ch tr\xEAn chi ti\u1EBFt \u0111\u01A1n h\xE0ng), \`productDetail\` (t\xEAn s\u1EA3n ph\u1EA9m tr\xEAn d\xF2ng h\xE0ng).

## Khi n\xE0o d\xF9ng / khi n\xE0o kh\xF4ng

- D\xF9ng khi b\u1EA3n ghi ch\u1EC9 c\xF3 ID c\u1EE7a entity kh\xE1c v\xE0 m\xE0n c\u1EA7n t\xEAn, m\xE3 hay field kh\xE1c c\u1EE7a entity \u0111\xF3.
- Response \u0111\xE3 c\xF3 t\xEAn (ch\u1EE9ng t\u1EEB gi\u1EEF snapshot t\xEAn kh\xE1ch l\xFAc l\u1EADp \u0111\u01A1n): hi\u1EC7n snapshot, kh\xF4ng tra l\u1EA1i t\xEAn hi\u1EC7n t\u1EA1i.

## Code m\u1EABu

<!-- @source features/customer/pipes/customer-detail.pipe.ts -->
\`\`\`ts
import { inject, Pipe, type PipeTransform } from '@angular/core';
import { of, type Observable } from 'rxjs';
import { CustomerService } from '../services/customer.service';
import type { CustomerDto } from '../services/customer.model';

/**
 * Relation kh\xE1ch h\xE0ng theo ID: \`@let customer = order.customerId | customerDetail | async;\`.
 * CustomerService cache v\xE0 chia s\u1EBB request theo ID; n\u01A1i d\xF9ng pipe ph\u1EA3i c\xF3 CustomerService trong injector.
 */
@Pipe({ name: 'customerDetail', standalone: true })
export class CustomerDetailPipe implements PipeTransform {
  readonly #customerService = inject(CustomerService);

  transform(id: CustomerDto['id'] | null | undefined): Observable<CustomerDto | null> {
    if (id === null || id === undefined || id === '') return of(null);
    return this.#customerService.cachedDetail(id);
  }
}
\`\`\`

Service s\u1EDF h\u1EEFu cache v\xE0 chia s\u1EBB request theo ID; l\u1ED7i tra c\u1EE9u kh\xF4ng \u0111\u01B0\u1EE3c cache:

<!-- @source features/customer/services/customer.service.ts -->
\`\`\`ts
import { HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { shareReplay, tap, type Observable } from 'rxjs';
import type { Filter, PagingRes } from '@sdcorejs/utils/models';
import { BaseApiService } from '../../../services/base-api.service';
import type {
  CustomerCounts,
  CustomerDebtDto,
  CustomerDocumentDto,
  CustomerDto,
  CustomerListReq,
  CustomerListRes,
  CustomerOrderDto,
  CustomerSaveReq,
} from './customer.model';

@Injectable()
export class CustomerService extends BaseApiService {
  readonly #details = new Map<string, Observable<CustomerDto>>();
  readonly #changes = signal(0);
  /** T\u0103ng sau m\u1ED7i l\u1EA7n t\u1EA1o, c\u1EADp nh\u1EADt ho\u1EB7c xo\xE1 th\xE0nh c\xF4ng: danh s\xE1ch ch\u1EC9 t\u1EA3i l\u1EA1i khi c\xF3 thay \u0111\u1ED5i. */
  readonly changes = this.#changes.asReadonly();

  list(req: CustomerListReq): Observable<CustomerListRes> {
    return this.http.get<CustomerListRes>(this.apiUrl('customers'), { params: this.buildPagingReq(req) });
  }

  /** S\u1ED1 kh\xE1ch theo nh\xF3m cho score card, theo c\xF9ng b\u1ED9 l\u1ECDc c\u1EE7a danh s\xE1ch. */
  counts(filters: Filter<CustomerDto>[]): Observable<CustomerCounts> {
    return this.http.get<CustomerCounts>(this.apiUrl('customers', 'counts'), {
      params: new HttpParams().set('filters', JSON.stringify(filters)),
    });
  }

  detail(id: string): Observable<CustomerDto> {
    return this.http.get<CustomerDto>(this.apiUrl('customers', id));
  }

  /** \`detail(id)\` c\xF3 cache, cho relation (\`customerDetail\`) v\xE0 gi\xE1 tr\u1ECB \u0111\xE3 ch\u1ECDn c\u1EE7a \`customer-select\`. */
  cachedDetail(id: string): Observable<CustomerDto> {
    let detail = this.#details.get(id);
    if (!detail) {
      detail = this.detail(id).pipe(shareReplay({ bufferSize: 1, refCount: false }));
      this.#details.set(id, detail);
      // L\u1ED7i tra c\u1EE9u kh\xF4ng \u0111\u01B0\u1EE3c cache: l\u1EA7n g\u1ECDi sau h\u1ECFi l\u1EA1i.
      detail.subscribe({ error: () => this.#details.delete(id) });
    }
    return detail;
  }

  create(req: CustomerSaveReq): Observable<CustomerDto> {
    return this.http.post<CustomerDto>(this.apiUrl('customers'), req).pipe(tap(() => this.#changed()));
  }

  update(id: string, req: CustomerSaveReq): Observable<CustomerDto> {
    return this.http.put<CustomerDto>(this.apiUrl('customers', id), req).pipe(tap(() => this.#changed(id)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(this.apiUrl('customers', id)).pipe(tap(() => this.#changed(id)));
  }

  orders(id: string): Observable<PagingRes<CustomerOrderDto>> {
    return this.http.get<PagingRes<CustomerOrderDto>>(this.apiUrl('customers', id, 'orders'));
  }

  debts(id: string): Observable<PagingRes<CustomerDebtDto>> {
    return this.http.get<PagingRes<CustomerDebtDto>>(this.apiUrl('customers', id, 'debts'));
  }

  documents(id: string): Observable<PagingRes<CustomerDocumentDto>> {
    return this.http.get<PagingRes<CustomerDocumentDto>>(this.apiUrl('customers', id, 'documents'));
  }

  #changed(id?: string): void {
    if (id) this.#details.delete(id);
    this.#changes.update(count => count + 1);
  }
}
\`\`\`

D\xF9ng trong template:

<!-- @source features/order/components/lines-view/lines-view.component.ts -->
\`\`\`ts
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { ProductDetailPipe } from '../../../product/pipes/product-detail.pipe';
import type { OrderLineDto } from '../../services/order.model';

/** D\xF2ng h\xE0ng ch\u1EC9 \u0111\u1ECDc; t\xEAn s\u1EA3n ph\u1EA9m l\u1EA5y qua relation \`productDetail\`, kh\xF4ng hi\u1EC7n ID th\xF4. */
@Component({
  selector: 'lines-view',
  standalone: true,
  imports: [AsyncPipe, SdSection, SdTable, SdTableCellDefDirective, ProductDetailPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-section title="D\xF2ng h\xE0ng">
      <sd-table autoId="order-lines" [option]="option()">
        <ng-template sdTableCellDef="productId" let-line="item">
          @let product = line.productId | productDetail | async;
          {{ product?.name ?? '\u2026' }}
        </ng-template>
      </sd-table>
    </sd-section>
  \`,
})
export class LinesViewComponent {
  readonly lines = input.required<readonly OrderLineDto[]>();
  protected readonly option = computed<SdTableOption<OrderLineDto & { amount: number }>>(() => {
    const items = this.lines().map(line => ({ ...line, amount: line.quantity * line.unitPrice }));
    return {
      type: 'local',
      items: () => items,
      paginate: { pageSize: 50 },
      filter: { hideInlineFilter: 'auto' },
      columns: [
        { field: 'productId', title: 'S\u1EA3n ph\u1EA9m', type: 'string', minWidth: '200px' },
        { field: 'quantity', title: 'S\u1ED1 l\u01B0\u1EE3ng', type: 'number', width: '110px', align: 'right' },
        { field: 'unitPrice', title: '\u0110\u01A1n gi\xE1 (\u20AB)', type: 'number', width: '140px', align: 'right' },
        { field: 'amount', title: 'Th\xE0nh ti\u1EC1n (\u20AB)', type: 'number', width: '150px', align: 'right' },
      ],
    };
  });
}
\`\`\`

## Quy t\u1EAFc

- MUST \u0111\u1EB7t pipe trong \`pipes/<entity>-detail.pipe.ts\` c\u1EE7a feature s\u1EDF h\u1EEFu entity; t\xEAn template \`<entity>Detail\`, tr\u1EA3 object c\xF3 ki\u1EC3u c\u1EE7a entity, kh\xF4ng tr\u1EA3 chu\u1ED7i.
- MUST g\u1ECDi service c\u1EE7a \u0111\xFAng entity; pipe kh\xF4ng t\u1EF1 g\u1ECDi HTTP.
- MUST tr\u1EA3 \`null\` kh\xF4ng g\u1ECDi API khi ID r\u1ED7ng.
- MUST \u0111\u1EC3 service chia s\u1EBB request theo ID; nhi\u1EC1u d\xF2ng c\xF9ng ID ch\u1EC9 m\u1ED9t request.
- MUST c\u1EA5p service c\u1EE7a entity \u1EDF route n\u01A1i pipe ch\u1EA1y.
- SHOULD hi\u1EC7n placeholder c\u1EE7a Core (\`sdEmpty\`, \`sd-view\`) khi gi\xE1 tr\u1ECB r\u1ED7ng; kh\xF4ng t\u1EF1 vi\u1EBFt \`--\`.

## L\u1ED7i hay g\u1EB7p

- G\u1ECDi h\xE0m tra t\xEAn trong template: ch\u1EA1y l\u1EA1i m\u1ED7i l\u1EA7n change detection, m\u1ED7i l\u1EA7n m\u1ED9t request.
- B\u1EAFt l\u1ED7i tra c\u1EE9u r\u1ED3i tr\u1EA3 \`null\` nh\u01B0 th\xE0nh c\xF4ng: ng\u01B0\u1EDDi d\xF9ng th\u1EA5y \`--\` thay v\xEC bi\u1EBFt l\xE0 l\u1ED7i.
- Hi\u1EC7n ID th\xF4 thay cho t\xEAn.
`,"docs/select.md":`# Select

Ch\u1ECDn entity ho\u1EB7c enum qua wrapper c\u1EE7a feature s\u1EDF h\u1EEFu entity. M\u1EABu: \`product-select\` v\xE0 \`customer-select\` (d\xF2ng \u0111\u01A1n h\xE0ng, \u0111\u1EA7u \u0111\u01A1n h\xE0ng), \`product-status-select\`, \`customer-type-select\`.

## Khi n\xE0o d\xF9ng / khi n\xE0o kh\xF4ng

- D\xF9ng wrapper m\u1ED7i khi m\u1ED9t m\xE0n ch\u1ECDn entity c\u1EE7a feature kh\xE1c, ho\u1EB7c ch\u1ECDn m\u1ED9t enum c\u1EE7a entity.
- Danh s\xE1ch l\u1EF1a ch\u1ECDn c\u1ED1 \u0111\u1ECBnh ch\u1EC9 d\xF9ng m\u1ED9t l\u1EA7n trong ch\xEDnh feature (k\xEAnh b\xE1n c\u1EE7a \u0111\u01A1n h\xE0ng): \`sd-select\` v\u1EDBi h\u1EB1ng s\u1ED1 trong \`<entity>.model.ts\` l\xE0 \u0111\u1EE7.

## Code m\u1EABu

Entity: l\u1EF1a ch\u1ECDn m\u1EDBi ch\u1EC9 g\u1ED3m b\u1EA3n ghi \u0111ang ho\u1EA1t \u0111\u1ED9ng (\`SEARCH\`); gi\xE1 tr\u1ECB \u0111\xE3 ch\u1ECDn t\u1EA3i theo ID (\`VALUE\`) n\xEAn b\u1EA3n ghi \u0111\xE3 ng\u1EEBng v\u1EABn hi\u1EC7n khi c\u1EADp nh\u1EADt. Option hai d\xF2ng c\xF3 avatar:

<!-- @source features/customer/components/customer-select/customer-select.component.ts -->
\`\`\`ts
import { booleanAttribute, ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SdAvatar } from '@sdcorejs/angular/components/avatar';
import { SdItemDefDefDirective } from '@sdcorejs/angular/forms/directives';
import type { SdSearchReq } from '@sdcorejs/angular/forms/models';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import type { Filter } from '@sdcorejs/utils/models';
import { CustomerService } from '../../services/customer.service';
import type { CustomerDto } from '../../services/customer.model';

/**
 * Ch\u1ECDn kh\xE1ch h\xE0ng cho m\xE0n kh\xE1c (\u0111\u01A1n h\xE0ng). L\u1EF1a ch\u1ECDn m\u1EDBi ch\u1EC9 g\u1ED3m kh\xE1ch \u0111ang ho\u1EA1t \u0111\u1ED9ng; gi\xE1 tr\u1ECB \u0111\xE3 ch\u1ECDn t\u1EA3i theo ID
 * (\`VALUE\`) n\xEAn kh\xE1ch \u0111\xE3 ng\u1EEBng v\u1EABn hi\u1EC7n khi c\u1EADp nh\u1EADt. Option hai d\xF2ng c\xF3 avatar: t\xEAn \xB7 m\xE3 \xB7 \u0111i\u1EC7n tho\u1EA1i.
 */
@Component({
  selector: 'customer-select',
  standalone: true,
  imports: [SdSelect, SdItemDefDefDirective, SdAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<sd-select
    [label]="label()"
    [name]="name()"
    [form]="form()"
    [(model)]="model"
    [items]="search"
    valueField="id"
    displayField="name"
    [required]="required()"
    [autoId]="autoId()">
    <ng-template sdItemDef let-item="item">
      <div class="d-flex align-items-center gap-8">
        <sd-avatar [src]="null" [name]="item.name" [size]="28" />
        <div class="d-flex flex-column">
          <span>{{ item.name }}</span>
          <small class="text-secondary"
            >{{ item.code }} \xB7 {{ item.phone }}{{ item.status === 'inactive' ? ' \xB7 Ng\u1EEBng ho\u1EA1t \u0111\u1ED9ng' : '' }}</small
          >
        </div>
      </div>
    </ng-template>
  </sd-select>\`,
})
export class CustomerSelectComponent {
  readonly #customerService = inject(CustomerService);
  readonly form = input<FormGroup>();
  readonly name = input('customerId');
  readonly label = input<string | undefined>('Kh\xE1ch h\xE0ng');
  readonly required = input(false, { transform: booleanAttribute });
  readonly autoId = input<string>();
  readonly model = model<string | null | undefined>();

  protected readonly search = async (req: SdSearchReq): Promise<CustomerDto[]> => {
    if (req.type === 'VALUE') {
      const ids = (Array.isArray(req.value) ? req.value : [req.value]).filter((id): id is string => !!id);
      return Promise.all(ids.map(id => firstValueFrom(this.#customerService.cachedDetail(id))));
    }
    const filters: Filter<CustomerDto>[] = [{ field: 'status', operator: 'EQUAL', data: 'active' }];
    if (req.searchText) {
      filters.push({
        operator: 'OR',
        data: [
          { field: 'name', operator: 'CONTAIN', data: req.searchText },
          { field: 'code', operator: 'CONTAIN', data: req.searchText },
          { field: 'phone', operator: 'CONTAIN', data: req.searchText },
        ],
      });
    }
    const res = await firstValueFrom(this.#customerService.list({ pageNumber: 0, pageSize: 20, filters }));
    return res.items;
  };
}
\`\`\`

<!-- @source features/product/components/product-select/product-select.component.ts -->
\`\`\`ts
import { booleanAttribute, ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SdItemDefDefDirective } from '@sdcorejs/angular/forms/directives';
import type { SdSearchReq } from '@sdcorejs/angular/forms/models';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import type { Filter, Size } from '@sdcorejs/utils/models';
import { ProductService } from '../../services/product.service';
import type { ProductDto } from '../../services/product.model';

/**
 * Ch\u1ECDn s\u1EA3n ph\u1EA9m cho m\xE0n kh\xE1c (d\xF2ng \u0111\u01A1n h\xE0ng). L\u1EF1a ch\u1ECDn m\u1EDBi ch\u1EC9 g\u1ED3m s\u1EA3n ph\u1EA9m \u0111ang ho\u1EA1t \u0111\u1ED9ng; gi\xE1 tr\u1ECB \u0111\xE3 ch\u1ECDn
 * \u0111\u01B0\u1EE3c t\u1EA3i theo ID (\`VALUE\`) n\xEAn s\u1EA3n ph\u1EA9m \u0111\xE3 ng\u1EEBng v\u1EABn hi\u1EC3n th\u1ECB khi c\u1EADp nh\u1EADt. Option hai d\xF2ng: t\xEAn \xB7 m\xE3 \xB7 \u0111\u01A1n v\u1ECB.
 * \`size\`, \`hideInlineError\` v\xE0 \`inlineError\` chuy\u1EC3n th\u1EB3ng xu\u1ED1ng \`sd-select\`, \u0111\u1EC3 d\xF9ng \u0111\u01B0\u1EE3c trong \xF4 c\u1EE7a b\u1EA3ng.
 */
@Component({
  selector: 'product-select',
  standalone: true,
  imports: [SdSelect, SdItemDefDefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<sd-select
    [label]="label()"
    [name]="name()"
    [form]="form()"
    [(model)]="model"
    [items]="search"
    valueField="id"
    displayField="name"
    [required]="required()"
    [size]="size()"
    [hideInlineError]="hideInlineError()"
    [inlineError]="inlineError()"
    [autoId]="autoId()">
    <ng-template sdItemDef let-item="item">
      <div class="d-flex flex-column">
        <span>{{ item.name }}</span>
        <small class="text-secondary">{{ item.code }} \xB7 {{ item.unit }}{{ item.status === 'inactive' ? ' \xB7 Ng\u1EEBng ho\u1EA1t \u0111\u1ED9ng' : '' }}</small>
      </div>
    </ng-template>
  </sd-select>\`,
})
export class ProductSelectComponent {
  readonly #productService = inject(ProductService);
  readonly form = input<FormGroup>();
  readonly name = input('productId');
  readonly label = input<string | undefined>('S\u1EA3n ph\u1EA9m');
  readonly required = input(false, { transform: booleanAttribute });
  readonly size = input<Size>('md');
  readonly hideInlineError = input(false, { transform: booleanAttribute });
  /** L\u1ED7i c\u1EE7a API cho field n\xE0y (vd \`lines.0.productId\`). */
  readonly inlineError = input<string>();
  readonly autoId = input<string>();
  readonly model = model<string | null | undefined>();

  protected readonly search = async (req: SdSearchReq): Promise<ProductDto[]> => {
    if (req.type === 'VALUE') {
      const ids = (Array.isArray(req.value) ? req.value : [req.value]).filter((id): id is string => !!id);
      return Promise.all(ids.map(id => firstValueFrom(this.#productService.cachedDetail(id))));
    }
    const filters: Filter<ProductDto>[] = [{ field: 'status', operator: 'EQUAL', data: 'active' }];
    if (req.searchText) {
      filters.push({
        operator: 'OR',
        data: [
          { field: 'name', operator: 'CONTAIN', data: req.searchText },
          { field: 'code', operator: 'CONTAIN', data: req.searchText },
        ],
      });
    }
    const res = await firstValueFrom(this.#productService.list({ pageNumber: 0, pageSize: 20, filters }));
    return res.items;
  };
}
\`\`\`

Enum: options v\xE0 label thu\u1ED9c model c\u1EE7a feature:

<!-- @source features/product/components/product-status-select/product-status-select.component.ts -->
\`\`\`ts
import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { PRODUCT_STATUS_OPTIONS, type ProductStatus } from '../../services/product.model';

/** Dropdown tr\u1EA1ng th\xE1i s\u1EA3n ph\u1EA9m: options v\xE0 label thu\u1ED9c feature, n\u01A1i d\xF9ng ch\u1EC9 bind model/form. */
@Component({
  selector: 'product-status-select',
  standalone: true,
  imports: [SdSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<sd-select
    [label]="label()"
    [name]="name()"
    [form]="form()"
    [(model)]="model"
    [items]="options"
    valueField="id"
    displayField="name"
    [required]="required()"
    [clearable]="false" />\`,
})
export class ProductStatusSelectComponent {
  readonly form = input<FormGroup>();
  readonly name = input('status');
  readonly label = input('Tr\u1EA1ng th\xE1i');
  readonly required = input(true);
  readonly model = model<ProductStatus | null | undefined>();
  protected readonly options = PRODUCT_STATUS_OPTIONS;
}
\`\`\`

## Quy t\u1EAFc

- MUST \u0111\u1EB7t wrapper trong \`components/\` c\u1EE7a feature s\u1EDF h\u1EEFu entity; m\xE0n d\xF9ng n\xF3 (\u0111\u01A1n h\xE0ng) kh\xF4ng t\u1EF1 g\u1ECDi API c\u1EE7a entity kh\xE1c, kh\xF4ng khai b\xE1o l\u1EA1i \`items\`, \`valueField\`, \`displayField\`.
- MUST t\xE1ch l\u1EF1a ch\u1ECDn m\u1EDBi (\`SEARCH\`, c\xF3 \u0111i\u1EC1u ki\u1EC7n nh\u01B0 \u0111ang ho\u1EA1t \u0111\u1ED9ng) v\u1EDBi gi\xE1 tr\u1ECB \u0111\xE3 ch\u1ECDn (\`VALUE\`, t\u1EA3i theo ID k\u1EC3 c\u1EA3 b\u1EA3n ghi \u0111\xE3 ng\u1EEBng).
- MUST c\u1EA5p service c\u1EE7a entity \u1EDF route c\u1EE7a m\xE0n d\xF9ng wrapper (\`providers\` c\u1EE7a route \u0111\u01A1n h\xE0ng c\xF3 \`CustomerService\`, \`ProductService\`).
- MUST gi\u1EEF option t\u1ED1i \u0111a hai d\xF2ng: d\xF2ng \u0111\u1EA7u l\xE0 t\xEAn, d\xF2ng hai l\xE0 m\xE3 v\xE0 th\xF4ng tin ph\xE2n bi\u1EC7t; trong b\u1EA3ng nh\u1EADp li\u1EC7u, gi\xE1 tr\u1ECB \u0111\xE3 ch\u1ECDn ch\u1EC9 hi\u1EC7n g\u1ECDn trong \xF4.
- SHOULD m\u1EDF input c\u1EE7a wrapper ch\u1EC9 cho th\u1EE9 n\u01A1i d\xF9ng c\u1EA7n (\`form\`, \`name\`, \`model\`, \`required\`, \`label\`).

## L\u1ED7i hay g\u1EB7p

- L\u1ECDc b\u1EA3n ghi \u0111ang ho\u1EA1t \u0111\u1ED9ng \u1EDF client cho c\u1EA3 gi\xE1 tr\u1ECB \u0111\xE3 ch\u1ECDn: \u0111\u01A1n c\u1EE7a kh\xE1ch \u0111\xE3 ng\u1EEBng m\u1EDF ra \xF4 tr\u1ED1ng.
- G\u1ECDi \`detail(id)\` cho t\u1EEBng option: d\xF9ng k\u1EBFt qu\u1EA3 t\xECm ki\u1EBFm cho danh s\xE1ch, ch\u1EC9 t\u1EA3i theo ID cho gi\xE1 tr\u1ECB \u0111\xE3 ch\u1ECDn.
`,"docs/split.md":`# Split

Danh s\xE1ch v\xE0 chi ti\u1EBFt c\u1EA1nh nhau \u0111\u1EC3 x\u1EED l\xFD nhanh t\u1EEBng m\u1EE5c: \`sd-page-list detail="none"\` + \`sd-splitter\` + route con \`:id\` trong panel ph\u1EA3i. Route m\u1EABu: \`/pattern/approval\`, \`/pattern/approval/:id\`.

## Khi n\xE0o d\xF9ng / khi n\xE0o kh\xF4ng

- D\xF9ng cho h\u1ED9p x\u1EED l\xFD: ng\u01B0\u1EDDi d\xF9ng \u0111i qua t\u1EEBng m\u1EE5c, duy\u1EC7t ho\u1EB7c t\u1EEB ch\u1ED1i, r\u1ED3i sang m\u1EE5c k\u1EBF.
- Xem chi ti\u1EBFt th\u1EC9nh tho\u1EA3ng: d\xF9ng [drawer](drawer.md) ho\u1EB7c [detail](detail.md).

## Code m\u1EABu

<!-- @source features/approval/pages/list/list.component.html -->
\`\`\`html
<sd-page-list title="Ph\xEA duy\u1EC7t" description="\u0110\u1EC1 ngh\u1ECB thanh to\xE1n ch\u1EDD x\u1EED l\xFD. D\xF9ng \u2191 \u2193 \u0111\u1EC3 chuy\u1EC3n m\u1EE5c." detail="none">
  <div sdPageListMain class="approval" [class.approval--narrow]="narrow()" [class.approval--active]="active()">
    <sd-splitter [option]="splitter">
      <!-- K\xE9o trong kho\u1EA3ng 360\u2013760px; panel chi ti\u1EBFt nh\u1EADn ph\u1EA7n c\xF2n l\u1EA1i (unit flex: minSize l\xE0 tr\u1ECDng s\u1ED1, kh\xF4ng ph\u1EA3i px). -->
      <sd-splitter-panel class="approval__list" panelId="list" [size]="520" unit="px" [minSize]="360" [maxSize]="760">
        <sd-table autoId="approval-list" [option]="option">
          <ng-template sdTableCellDef="code" let-item="item">
            <a [routerLink]="[item.id]" [attr.aria-current]="item.id === selectedId() ? 'true' : null">{{ item.code }}</a>
          </ng-template>
        </sd-table>
      </sd-splitter-panel>
      <sd-splitter-panel class="approval__detail" panelId="detail" [size]="1">
        <router-outlet (activate)="active.set(true)" (deactivate)="active.set(false)" />
        @if (!active()) {
          <sd-data-state state="empty" icon="inbox" title="Ch\u1ECDn m\u1ED9t m\u1EE5c" message="Ch\u1ECDn m\u1ED9t \u0111\u1EC1 ngh\u1ECB b\xEAn tr\xE1i \u0111\u1EC3 xem chi ti\u1EBFt v\xE0 x\u1EED l\xFD." />
        }
      </sd-splitter-panel>
    </sd-splitter>
  </div>
</sd-page-list>
\`\`\`

<!-- @source features/approval/pages/list/list.component.ts -->
\`\`\`ts
import { ChangeDetectionStrategy, Component, DestroyRef, effect, forwardRef, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, firstValueFrom, map, startWith } from 'rxjs';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import { SdSplitterComponent, SdSplitterPanelComponent, type SdSplitterOption } from '@sdcorejs/angular/components/splitter';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdPageList } from '@sdcorejs/angular/modules/layout';
import { ApprovalService } from '../../services/approval.service';
import { APPROVAL_STATUS_OPTIONS, approvalStatusBadge, type ApprovalDto } from '../../services/approval.model';
import { ApprovalInbox } from './approval-inbox';

/** D\u01B0\u1EDBi b\u1EC1 r\u1ED9ng n\xE0y chi ti\u1EBFt thay h\u1EB3n danh s\xE1ch, c\xF3 n\xFAt quay l\u1EA1i. */
const NARROW = '(max-width: 767.98px)';

/**
 * H\u1ED9p duy\u1EC7t (pattern split): danh s\xE1ch b\xEAn tr\xE1i, chi ti\u1EBFt l\xE0 route con \`:id\` trong panel ph\u1EA3i. \u2191 \u2193 chuy\u1EC3n m\u1EE5c;
 * duy\u1EC7t ho\u1EB7c t\u1EEB ch\u1ED1i xong panel chi ti\u1EBFt t\u1EF1 ch\u1ECDn m\u1EE5c k\u1EBF, b\u1ED9 l\u1ECDc v\xE0 v\u1ECB tr\xED cu\u1ED9n c\u1EE7a danh s\xE1ch gi\u1EEF nguy\xEAn.
 */
@Component({
  selector: 'list',
  standalone: true,
  templateUrl: './list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Ph\xEDm \u2191 \u2193 n\u1ED5i l\xEAn t\u1EEB d\xF2ng hay n\xFAt \u0111ang focus trong danh s\xE1ch ho\u1EB7c panel chi ti\u1EBFt.
  host: { '(keydown)': 'move($event)' },
  imports: [
    RouterLink,
    RouterOutlet,
    SdPageList,
    SdSplitterComponent,
    SdSplitterPanelComponent,
    SdTable,
    SdTableCellDefDirective,
    SdDataState,
  ],
  providers: [{ provide: ApprovalInbox, useExisting: forwardRef(() => ListComponent) }],
  styles: \`
    .approval > sd-splitter {
      flex: 1 1 0;
      min-height: 0;
    }
    .approval sd-splitter-panel {
      display: flex;
      flex-direction: column;
    }
    .approval__list {
      background: var(--sd-surface, #ffffff);
      border: 1px solid var(--sd-border, #e3e5ea);
      border-radius: 8px;
    }
    .approval__list > sd-table {
      flex: 1 1 0;
      min-height: 0;
    }
    .approval__detail {
      overflow-y: auto;
    }
    .approval--narrow.approval--active sd-splitter-panel:first-child,
    .approval--narrow:not(.approval--active) sd-splitter-panel:last-of-type {
      display: none;
    }
  \`,
})
export class ListComponent extends ApprovalInbox {
  readonly #approvalService = inject(ApprovalService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  private readonly table = viewChild.required(SdTable);
  protected readonly active = signal(false);
  protected readonly narrow = signal(false);
  /** ID \u0111ang m\u1EDF \u1EDF panel ph\u1EA3i, \u0111\u1ECDc t\u1EEB route con. */
  protected readonly selectedId = toSignal(
    this.#router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.#route.firstChild?.snapshot.paramMap.get('id') ?? null)
    ),
    { requireSync: true }
  );
  protected readonly splitter: SdSplitterOption = { storageKey: 'sd-pattern.approval.splitter' };
  protected readonly option: SdTableOption<ApprovalDto> = {
    type: 'server',
    rowKey: 'id',
    items: (_, req) => firstValueFrom(this.#approvalService.list(req)),
    filter: {
      quickSearch: { containFields: ['code', 'title', 'requester'], placeholder: 'T\xECm theo m\xE3, n\u1ED9i dung, ng\u01B0\u1EDDi \u0111\u1EC1 ngh\u1ECB' },
    },
    paginate: { pageSize: 20, pages: [20, 50] },
    columns: [
      { field: 'code', title: 'M\xE3', type: 'string', width: '96px' },
      { field: 'title', title: 'N\u1ED9i dung', type: 'string', minWidth: '140px' },
      { field: 'amount', title: 'S\u1ED1 ti\u1EC1n (\u20AB)', type: 'number', width: '120px', align: 'right' },
      {
        field: 'status',
        title: 'Tr\u1EA1ng th\xE1i',
        type: 'values',
        width: '128px',
        option: { items: APPROVAL_STATUS_OPTIONS, valueField: 'id', displayField: 'name' },
        useBadge: status => approvalStatusBadge(status),
        // H\u1ED9p duy\u1EC7t m\u1EDF s\u1EB5n c\xE1c \u0111\u1EC1 ngh\u1ECB \u0111ang ch\u1EDD; \u0111\u1ED5i b\u1ED9 l\u1ECDc \u0111\u1EC3 xem \u0111\u1EC1 ngh\u1ECB \u0111\xE3 x\u1EED l\xFD.
        filter: { default: 'pending' },
      },
    ],
    style: {
      rowCss: (row): Record<string, string> => (row.id === this.selectedId() ? { background: 'var(--sd-primary-light)' } : {}),
    },
  };

  constructor() {
    super();
    // D\xF2ng \u0111ang m\u1EDF \u0111\u01B0\u1EE3c t\xF4 n\u1EC1n: v\u1EBD l\u1EA1i b\u1EA3ng khi ch\u1ECDn m\u1EE5c kh\xE1c.
    effect(() => {
      this.selectedId();
      untracked(() => this.table().detectChanges());
    });
    const media = typeof matchMedia === 'function' ? matchMedia(NARROW) : null;
    if (media) {
      this.narrow.set(media.matches);
      const onChange = (event: MediaQueryListEvent): void => this.narrow.set(event.matches);
      media.addEventListener('change', onChange);
      inject(DestroyRef).onDestroy(() => media.removeEventListener('change', onChange));
    }
  }

  nextOf(id: string): string | null {
    const rows = this.table().dataItems;
    const index = rows.findIndex(row => row.id === id);
    if (index < 0) return rows[0]?.id ?? null;
    return rows[index + 1]?.id ?? rows[index - 1]?.id ?? null;
  }

  async refresh(): Promise<void> {
    await this.table().reload(true, false);
  }

  /** \u2191 \u2193 chuy\u1EC3n sang d\xF2ng tr\u01B0\u1EDBc/sau; b\u1ECF qua khi \u0111ang g\xF5 trong \xF4 nh\u1EADp. */
  protected move(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable="true"], mat-select, [role="separator"]')) return;
    const rows = this.table().dataItems;
    if (!rows.length) return;
    const index = rows.findIndex(row => row.id === this.selectedId());
    const next = rows[Math.min(rows.length - 1, Math.max(0, index < 0 ? 0 : index + (event.key === 'ArrowDown' ? 1 : -1)))];
    event.preventDefault();
    if (next.id !== this.selectedId()) void this.#router.navigate([next.id], { relativeTo: this.#route });
  }
}
\`\`\`

Panel chi ti\u1EBFt: x\u1EED l\xFD xong th\xEC t\u1EF1 m\u1EDF m\u1EE5c k\u1EBF trong danh s\xE1ch \u0111ang l\u1ECDc:

<!-- @source features/approval/pages/detail/detail.component.ts -->
\`\`\`ts
import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import { SdEmptyPipe, SdFormatDatetimePipe, SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage } from '../../../../utils/api-error';
import { ApprovalService } from '../../services/approval.service';
import { approvalStatusBadge, type ApprovalDto } from '../../services/approval.model';
import { ApprovalInbox } from '../list/approval-inbox';

/** Chi ti\u1EBFt m\u1ED9t \u0111\u1EC1 ngh\u1ECB trong panel ph\u1EA3i c\u1EE7a h\u1ED9p duy\u1EC7t (route con \`:id\`). */
@Component({
  selector: 'detail',
  standalone: true,
  imports: [
    RouterLink,
    SdBadge,
    SdButton,
    SdSection,
    SdSectionItem,
    SdPermissionDirective,
    SdEmptyPipe,
    SdFormatDatetimePipe,
    SdFormatNumberPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @let item = entity();
    <article class="d-flex flex-column gap-16 p-16" [attr.aria-label]="'\u0110\u1EC1 ngh\u1ECB ' + item.code">
      <header class="d-flex align-items-start justify-content-between gap-16 flex-wrap">
        <div class="d-flex flex-column gap-4">
          <!-- M\xE0n h\u1EB9p: chi ti\u1EBFt thay danh s\xE1ch, quay l\u1EA1i b\u1EB1ng li\xEAn k\u1EBFt n\xE0y. -->
          <a class="approval-back" [routerLink]="['..']">\u2190 Danh s\xE1ch</a>
          <div class="d-flex align-items-center gap-8">
            <h2 class="T18M m-0">{{ item.code }} \xB7 {{ item.title }}</h2>
            <sd-badge size="md" type="round" [title]="badge().title" [color]="badge().color" />
          </div>
          <span class="T14R text-secondary">{{ item.requester }} \xB7 {{ item.department }}</span>
        </div>
        @if (item.status === 'pending') {
          <div class="d-flex align-items-center gap-8">
            <sd-button
              *sdPermission="'PATTERN_APPROVAL_U_REJECT'"
              title="T\u1EEB ch\u1ED1i"
              prefixIcon="close"
              type="light"
              color="warning"
              autoId="approval-reject"
              [disabled]="pending()"
              (click)="decide('reject')" />
            <sd-button
              *sdPermission="'PATTERN_APPROVAL_U_APPROVE'"
              title="Duy\u1EC7t"
              prefixIcon="check"
              type="fill"
              color="success"
              autoId="approval-approve"
              [disabled]="pending()"
              (click)="decide('approve')" />
          </div>
        }
      </header>
      <sd-section title="Th\xF4ng tin \u0111\u1EC1 ngh\u1ECB">
        <sd-section-item label="S\u1ED1 ti\u1EC1n (\u20AB)">{{ item.amount | sdFormatNumber: 0 }}</sd-section-item>
        <sd-section-item label="Ng\xE0y g\u1EEDi">{{ item.submittedAt | sdFormatDatetime }}</sd-section-item>
        <sd-section-item label="Ghi ch\xFA">{{ item.note | sdEmpty }}</sd-section-item>
        <sd-section-item label="L\xFD do t\u1EEB ch\u1ED1i">{{ item.reason | sdEmpty }}</sd-section-item>
      </sd-section>
    </article>
  \`,
  styles: \`
    .approval-back {
      display: none;
      font-size: 13px;
    }
    @media (max-width: 767.98px) {
      .approval-back {
        display: inline;
      }
    }
  \`,
})
export class DetailComponent {
  readonly #approvalService = inject(ApprovalService);
  readonly #inbox = inject(ApprovalInbox);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #resolved = toSignal(this.#route.data.pipe(map(data => data['entity'] as ApprovalDto)), { requireSync: true });
  protected readonly entity = linkedSignal(() => this.#resolved());
  protected readonly badge = computed(() => approvalStatusBadge(this.entity().status));
  protected readonly pending = signal(false);

  /** H\u1ECFi x\xE1c nh\u1EADn (T\u1EEB ch\u1ED1i k\xE8m l\xFD do), x\u1EED l\xFD, r\u1ED3i t\u1EF1 m\u1EDF m\u1EE5c k\u1EBF trong danh s\xE1ch \u0111ang l\u1ECDc. */
  protected async decide(action: 'approve' | 'reject'): Promise<void> {
    const item = this.entity();
    let reason: string | undefined;
    try {
      if (action === 'reject') {
        reason = await this.#confirm.withInput(\`T\u1EEB ch\u1ED1i \${item.code}. L\xFD do \u0111\u01B0\u1EE3c g\u1EEDi cho \${item.requester}.\`, {
          title: 'T\u1EEB ch\u1ED1i \u0111\u1EC1 ngh\u1ECB',
          label: 'L\xFD do t\u1EEB ch\u1ED1i',
          required: true,
          maxlength: 200,
          yesTitle: 'T\u1EEB ch\u1ED1i',
          noTitle: 'Kh\xF4ng',
          yesButtonColor: 'warning',
        });
      } else {
        await this.#confirm.confirm(\`Duy\u1EC7t \${item.code}: \${item.title}?\`, { title: 'Duy\u1EC7t \u0111\u1EC1 ngh\u1ECB', yesTitle: 'Duy\u1EC7t', noTitle: 'Kh\xF4ng' });
      }
    } catch {
      return;
    }
    this.pending.set(true);
    try {
      const next = this.#inbox.nextOf(item.id);
      this.entity.set(
        await firstValueFrom(
          action === 'approve' ? this.#approvalService.approve({ id: item.id }) : this.#approvalService.reject({ id: item.id, reason })
        )
      );
      this.#notify.success(action === 'approve' ? \`\u0110\xE3 duy\u1EC7t \${item.code}.\` : \`\u0110\xE3 t\u1EEB ch\u1ED1i \${item.code}.\`);
      await this.#inbox.refresh();
      await this.#router.navigate(next ? ['..', next] : ['..'], { relativeTo: this.#route });
    } catch (error) {
      this.#notify.error(apiErrorMessage(error));
    } finally {
      this.pending.set(false);
    }
  }
}
\`\`\`

## Quy t\u1EAFc

- MUST d\xF9ng \`detail="none"\`: \`sd-page-list\` kh\xF4ng \u0111\u1EB7t router-outlet, m\xE0n \u0111\u1EB7t outlet trong panel ph\u1EA3i. B\u1ECDc \`sd-splitter\` trong ph\u1EA7n t\u1EED \`sdPageListMain\` \u0111\u1EC3 v\xF9ng chia \u0111\xF4i l\u1EA5p ph\u1EA7n c\xF2n l\u1EA1i c\u1EE7a trang.
- MUST hi\u1EC7n tr\u1EA1ng th\xE1i tr\u1ED1ng ("Ch\u1ECDn m\u1ED9t m\u1EE5c") khi ch\u01B0a m\u1EDF m\u1EE5c n\xE0o.
- MUST cho \u2191 \u2193 chuy\u1EC3n m\u1EE5c khi focus kh\xF4ng \u1EDF \xF4 nh\u1EADp; t\xF4 n\u1EC1n d\xF2ng \u0111ang m\u1EDF.
- MUST gi\u1EEF b\u1ED9 l\u1ECDc, trang v\xE0 v\u1ECB tr\xED cu\u1ED9n khi chuy\u1EC3n m\u1EE5c v\xE0 sau khi x\u1EED l\xFD; t\u1EA3i l\u1EA1i b\u1EB1ng \`reload(true, false)\`.
- MUST cho panel danh s\xE1ch b\u1EC1 r\u1ED9ng px (\`unit="px"\`) v\u1EDBi \`minSize\`/\`maxSize\` px, panel chi ti\u1EBFt \`unit="flex"\` nh\u1EADn ph\u1EA7n c\xF2n l\u1EA1i; \u0111\u1EB7t \`display: flex; flex-direction: column\` cho panel \u0111\u1EC3 b\u1EA3ng l\u1EA5p chi\u1EC1u cao v\xE0 paginator lu\xF4n hi\u1EC7n.
- SHOULD l\u01B0u b\u1EC1 r\u1ED9ng panel (\`storageKey\` c\u1EE7a \`sd-splitter\`).
- SHOULD d\u01B0\u1EDBi 768px cho chi ti\u1EBFt thay h\u1EB3n danh s\xE1ch, c\xF3 li\xEAn k\u1EBFt quay l\u1EA1i.

## L\u1ED7i hay g\u1EB7p

- \u0110\u1EC3 \`sd-page-list\` m\u1EB7c \u0111\u1ECBnh (\`detail="page"\`): route con hi\u1EC7n thay ch\u1ED7 c\u1EA3 danh s\xE1ch, kh\xF4ng c\xF2n c\u1EA1nh nhau.
- \u0110\u1EB7t \`sdPageListMain\` tr\u1EF1c ti\u1EBFp l\xEAn \`sd-splitter\`: ki\u1EC3u c\u1ED9t c\u1EE7a v\xF9ng ch\xEDnh \u0111\xE8 h\u01B0\u1EDBng ngang c\u1EE7a splitter.
- \u0110\u1EB7t \`[minSize]="360"\` l\xEAn panel \`unit="flex"\` \u0111\u1EC3 gi\u1EEF ch\u1ED7 cho chi ti\u1EBFt: v\u1EDBi panel flex, \`minSize\` l\xE0 tr\u1ECDng s\u1ED1 ch\u1EE9 kh\xF4ng ph\u1EA3i px, n\xEAn handle kh\xF4ng k\xE9o \u0111\u01B0\u1EE3c. Gi\u1EDBi h\u1EA1n b\u1EB1ng \`maxSize\` px c\u1EE7a panel danh s\xE1ch.
- \u0110\u1EC3 panel \u1EDF \`display: block\` m\u1EB7c \u0111\u1ECBnh: b\u1EA3ng \u1EDF ch\u1EBF \u0111\u1ED9 fill kh\xF4ng co theo panel, d\xF2ng cu\u1ED1i v\xE0 paginator b\u1ECB c\u1EAFt.
- Ch\u1ECDn m\u1EE5c k\u1EBF sau khi \u0111\xE3 t\u1EA3i l\u1EA1i danh s\xE1ch: m\u1EE5c v\u1EEBa x\u1EED l\xFD \u0111\xE3 bi\u1EBFn m\u1EA5t kh\u1ECFi b\u1ED9 l\u1ECDc, v\u1ECB tr\xED k\u1EBF b\u1ECB l\u1EC7ch. L\u1EA5y m\u1EE5c k\u1EBF tr\u01B0\u1EDBc khi t\u1EA3i l\u1EA1i.
`,"docs/states.md":`# States

\u0110ang t\u1EA3i, r\u1ED7ng, l\u1ED7i v\xE0 thi\u1EBFu quy\u1EC1n. Thanh c\xF4ng c\u1EE5 c\u1EE7a \`/pattern\` \u0111\u1ED5i \u0111\u1ED9 tr\u1EC5, l\u1ED7i gi\u1EA3 l\u1EADp (500, timeout, 404, 403) v\xE0 vai tr\xF2 \u0111\u1EC3 xem t\u1EEBng tr\u1EA1ng th\xE1i tr\xEAn m\u1ECDi route; drawer "Tu\u1EF3 ch\u1EC9nh hi\u1EC3n th\u1ECB" c\u1EE7a \`/pattern/order\` \xE9p tr\u1EA1ng th\xE1i \u0111\u1ECDc c\u1EE7a danh s\xE1ch.

## Khi n\xE0o d\xF9ng / khi n\xE0o kh\xF4ng

- M\u1ECDi v\xF9ng t\u1EA3i d\u1EEF li\u1EC7u \u0111\u1EC1u c\xF3 tr\u1EA1ng th\xE1i \u0111ang t\u1EA3i, r\u1ED7ng v\xE0 l\u1ED7i ri\xEAng.
- B\u1EA3ng \`sd-table\` \u0111\xE3 t\u1EF1 c\xF3 ba tr\u1EA1ng th\xE1i n\xE0y: kh\xF4ng b\u1ECDc th\xEAm.

## Code m\u1EABu

Tab t\u1EF1 t\u1EA3i, tr\u1EA1ng th\xE1i ri\xEAng b\u1EB1ng \`sd-data-state\`:

<!-- @source features/customer/components/documents-view/documents-view.component.ts -->
\`\`\`ts
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { CustomerService } from '../../services/customer.service';
import type { CustomerDocumentDto } from '../../services/customer.model';

/** Tab T\xE0i li\u1EC7u c\u1EE7a h\u1ED3 s\u01A1 360\xB0: danh s\xE1ch ng\u1EAFn, tr\u1EA1ng th\xE1i ri\xEAng b\u1EB1ng \`sd-data-state\`. */
@Component({
  selector: 'documents-view',
  standalone: true,
  imports: [SdDataState, SdSection, SdSectionItem, SdFormatNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-data-state
      [state]="state()"
      retryable
      title=""
      [message]="state() === 'empty' ? 'Kh\xE1ch h\xE0ng ch\u01B0a c\xF3 t\xE0i li\u1EC7u.' : undefined"
      (sdRetry)="load()">
      <sd-section title="T\xE0i li\u1EC7u">
        @for (document of documents(); track document.id) {
          <sd-section-item [label]="document.name">{{ document.size / 1024 | sdFormatNumber: 0 }} KB</sd-section-item>
        }
      </sd-section>
    </sd-data-state>
  \`,
})
export class DocumentsViewComponent implements OnInit {
  readonly #customerService = inject(CustomerService);
  readonly customerId = input.required<string>();
  protected readonly state = signal<'loading' | 'empty' | 'error' | 'success'>('loading');
  protected readonly documents = signal<readonly CustomerDocumentDto[]>([]);

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.state.set('loading');
    try {
      const res = await firstValueFrom(this.#customerService.documents(this.customerId()));
      this.documents.set(res.items);
      this.state.set(res.items.length ? 'success' : 'empty');
    } catch {
      this.state.set('error');
    }
  }
}
\`\`\`

L\u1ED7i tr\u01B0\u1EDBc khi m\u1EDF trang thu\u1ED9c resolver; host chuy\u1EC3n 404, 403, l\u1ED7i m\u1EA1ng sang trang l\u1ED7i c\u1EE7a m\xECnh:

<!-- @source features/customer/entity.resolver.ts -->
\`\`\`ts
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { map, timeout } from 'rxjs';
import { CustomerService } from './services/customer.service';
import type { CustomerDto } from './services/customer.model';

/** T\u1EA3i kh\xE1ch h\xE0ng b\u1EB1ng \`detail(id)\` tr\u01B0\u1EDBc khi m\u1EDF drawer/trang; l\u1ED7i \u0111i t\u1EDBi navigation error handler c\u1EE7a host. */
export const entityResolver: ResolveFn<CustomerDto> = route => {
  const id = route.paramMap.get('id');
  if (!id?.trim()) throw new HttpErrorResponse({ status: 404 });
  return inject(CustomerService)
    .detail(id)
    .pipe(
      timeout(10_000),
      map(entity => {
        if (!entity || entity.id !== id) throw new HttpErrorResponse({ status: 404 });
        return entity;
      })
    );
};
\`\`\`

Quy\u1EC1n v\xE0o route b\u1EB1ng \`canActivateChild: [SdPermissionGuard]\` v\xE0 \`data.permission\` tr\xEAn t\u1EEBng route:

<!-- @source features/order/routes.ts -->
\`\`\`ts
import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { CustomerService } from '../customer/services/customer.service';
import { ProductService } from '../product/services/product.service';
import { entityResolver, updatableEntityResolver } from './entity.resolver';
import { OrderService } from './services/order.service';

/**
 * Chi ti\u1EBFt l\xE0 route con c\u1EE7a danh s\xE1ch (drawer ho\u1EB7c trang theo \`detail\`); t\u1EA1o v\xE0 c\u1EADp nh\u1EADt l\xE0 trang thay ch\u1ED7 danh s\xE1ch
 * (\`data.detail: 'page'\`). CustomerService v\xE0 ProductService \u0111\u01B0\u1EE3c c\u1EA5p \u1EDF \u0111\xE2y cho \`customer-select\`, \`product-select\`
 * v\xE0 c\xE1c pipe relation: \u0111\u01A1n h\xE0ng d\xF9ng wrapper c\u1EE7a feature s\u1EDF h\u1EEFu entity, kh\xF4ng t\u1EF1 g\u1ECDi API c\u1EE7a entity kh\xE1c.
 */
export const routes: Routes = [
  {
    path: '',
    providers: [OrderService, CustomerService, ProductService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: '\u0110\u01A1n h\xE0ng',
        data: { permission: 'PATTERN_ORDER_R_LIST' },
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
        children: [
          {
            path: 'create',
            title: 'T\u1EA1o m\u1EDBi \u0111\u01A1n h\xE0ng',
            data: { permission: 'PATTERN_ORDER_C_CREATE', detail: 'page' },
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () => import('./pages/create/create.component').then(module => module.CreateComponent),
          },
          {
            path: ':id/detail',
            title: 'Chi ti\u1EBFt \u0111\u01A1n h\xE0ng',
            data: { permission: 'PATTERN_ORDER_R_DETAIL' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () => import('./pages/detail/detail.component').then(module => module.DetailComponent),
          },
          {
            path: ':id/update',
            title: 'C\u1EADp nh\u1EADt \u0111\u01A1n h\xE0ng',
            data: { permission: 'PATTERN_ORDER_U_UPDATE', detail: 'page' },
            resolve: { entity: updatableEntityResolver },
            runGuardsAndResolvers: 'paramsChange',
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () => import('./pages/update/update.component').then(module => module.UpdateComponent),
          },
        ],
      },
    ],
  },
];
\`\`\`

## Quy t\u1EAFc

- MUST \u0111\u1EC3 l\u1ED7i t\u1EA3i b\u1EA3n ghi b\u1EAFt bu\u1ED9c \u0111i qua resolver t\u1EDBi navigation error handler c\u1EE7a host; kh\xF4ng m\u1EDF trang r\u1ED3i m\u1EDBi b\xE1o l\u1ED7i.
- MUST khai b\xE1o \`data.permission\` cho m\u1ECDi route con; guard t\u1EEB ch\u1ED1i route qu\xEAn khai b\xE1o.
- MUST gi\u1EEF c\xE1c v\xF9ng ph\u1EE5 (tab c\u1EE7a h\u1ED3 s\u01A1, relation) c\xF3 tr\u1EA1ng th\xE1i ri\xEAng; l\u1ED7i m\u1ED9t v\xF9ng kh\xF4ng l\xE0m h\u1ECFng c\u1EA3 trang.
- MUST kh\xF4ng bi\u1EBFn l\u1ED7i th\xE0nh d\u1EEF li\u1EC7u r\u1ED7ng th\xE0nh c\xF4ng; c\xF3 n\xFAt th\u1EED l\u1EA1i khi l\u1ED7i c\xF3 th\u1EC3 h\u1EBFt.
- MUST gi\u1EEF d\u1EEF li\u1EC7u ng\u01B0\u1EDDi d\xF9ng \u0111\xE3 nh\u1EADp khi l\u01B0u l\u1ED7i (500, timeout).
- SHOULD d\xF9ng \`sd-data-state\` cho v\xF9ng kh\xF4ng ph\u1EA3i b\u1EA3ng; \`retryable\` khi th\u1EED l\u1EA1i c\xF3 \xFD ngh\u0129a.

## L\u1ED7i hay g\u1EB7p

- B\u1EAFt l\u1ED7i API r\u1ED3i tr\u1EA3 m\u1EA3ng r\u1ED7ng: ng\u01B0\u1EDDi d\xF9ng th\u1EA5y "Kh\xF4ng c\xF3 d\u1EEF li\u1EC7u" khi m\xE1y ch\u1EE7 \u0111ang l\u1ED7i.
- Ch\u1EC9 \u1EA9n n\xFAt theo quy\u1EC1n m\xE0 kh\xF4ng ch\u1EB7n route: m\u1EDF URL tr\u1EF1c ti\u1EBFp v\u1EABn v\xE0o \u0111\u01B0\u1EE3c.
- \u0110\u1ED5i vai tr\xF2 m\xE0 kh\xF4ng ch\u1EA1y l\u1EA1i guard: n\xFAt theo quy\u1EC1n c\u0169 c\xF2n tr\xEAn m\xE0n. \`*sdPermission\` \u0111\u1ECDc quy\u1EC1n l\xFAc t\u1EA1o, n\xEAn m\xE0n ph\u1EA3i m\u1EDF l\u1EA1i.
`,"features/approval/entity.resolver.ts":`import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { map, timeout } from 'rxjs';
import { ApprovalService } from './services/approval.service';
import type { ApprovalDto } from './services/approval.model';

/** T\u1EA3i \u0111\u1EC1 ngh\u1ECB b\u1EB1ng \`detail(id)\` tr\u01B0\u1EDBc khi m\u1EDF panel chi ti\u1EBFt; l\u1ED7i \u0111i t\u1EDBi navigation error handler c\u1EE7a host. */
export const entityResolver: ResolveFn<ApprovalDto> = route => {
  const id = route.paramMap.get('id');
  if (!id?.trim()) throw new HttpErrorResponse({ status: 404 });
  return inject(ApprovalService)
    .detail(id)
    .pipe(
      timeout(10_000),
      map(entity => {
        if (!entity || entity.id !== id) throw new HttpErrorResponse({ status: 404 });
        return entity;
      })
    );
};
`,"features/approval/pages/detail/detail.component.ts":`import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import { SdEmptyPipe, SdFormatDatetimePipe, SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage } from '../../../../utils/api-error';
import { ApprovalService } from '../../services/approval.service';
import { approvalStatusBadge, type ApprovalDto } from '../../services/approval.model';
import { ApprovalInbox } from '../list/approval-inbox';

/** Chi ti\u1EBFt m\u1ED9t \u0111\u1EC1 ngh\u1ECB trong panel ph\u1EA3i c\u1EE7a h\u1ED9p duy\u1EC7t (route con \`:id\`). */
@Component({
  selector: 'detail',
  standalone: true,
  imports: [
    RouterLink,
    SdBadge,
    SdButton,
    SdSection,
    SdSectionItem,
    SdPermissionDirective,
    SdEmptyPipe,
    SdFormatDatetimePipe,
    SdFormatNumberPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @let item = entity();
    <article class="d-flex flex-column gap-16 p-16" [attr.aria-label]="'\u0110\u1EC1 ngh\u1ECB ' + item.code">
      <header class="d-flex align-items-start justify-content-between gap-16 flex-wrap">
        <div class="d-flex flex-column gap-4">
          <!-- M\xE0n h\u1EB9p: chi ti\u1EBFt thay danh s\xE1ch, quay l\u1EA1i b\u1EB1ng li\xEAn k\u1EBFt n\xE0y. -->
          <a class="approval-back" [routerLink]="['..']">\u2190 Danh s\xE1ch</a>
          <div class="d-flex align-items-center gap-8">
            <h2 class="T18M m-0">{{ item.code }} \xB7 {{ item.title }}</h2>
            <sd-badge size="md" type="round" [title]="badge().title" [color]="badge().color" />
          </div>
          <span class="T14R text-secondary">{{ item.requester }} \xB7 {{ item.department }}</span>
        </div>
        @if (item.status === 'pending') {
          <div class="d-flex align-items-center gap-8">
            <sd-button
              *sdPermission="'PATTERN_APPROVAL_U_REJECT'"
              title="T\u1EEB ch\u1ED1i"
              prefixIcon="close"
              type="light"
              color="warning"
              autoId="approval-reject"
              [disabled]="pending()"
              (click)="decide('reject')" />
            <sd-button
              *sdPermission="'PATTERN_APPROVAL_U_APPROVE'"
              title="Duy\u1EC7t"
              prefixIcon="check"
              type="fill"
              color="success"
              autoId="approval-approve"
              [disabled]="pending()"
              (click)="decide('approve')" />
          </div>
        }
      </header>
      <sd-section title="Th\xF4ng tin \u0111\u1EC1 ngh\u1ECB">
        <sd-section-item label="S\u1ED1 ti\u1EC1n (\u20AB)">{{ item.amount | sdFormatNumber: 0 }}</sd-section-item>
        <sd-section-item label="Ng\xE0y g\u1EEDi">{{ item.submittedAt | sdFormatDatetime }}</sd-section-item>
        <sd-section-item label="Ghi ch\xFA">{{ item.note | sdEmpty }}</sd-section-item>
        <sd-section-item label="L\xFD do t\u1EEB ch\u1ED1i">{{ item.reason | sdEmpty }}</sd-section-item>
      </sd-section>
    </article>
  \`,
  styles: \`
    .approval-back {
      display: none;
      font-size: 13px;
    }
    @media (max-width: 767.98px) {
      .approval-back {
        display: inline;
      }
    }
  \`,
})
export class DetailComponent {
  readonly #approvalService = inject(ApprovalService);
  readonly #inbox = inject(ApprovalInbox);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #resolved = toSignal(this.#route.data.pipe(map(data => data['entity'] as ApprovalDto)), { requireSync: true });
  protected readonly entity = linkedSignal(() => this.#resolved());
  protected readonly badge = computed(() => approvalStatusBadge(this.entity().status));
  protected readonly pending = signal(false);

  /** H\u1ECFi x\xE1c nh\u1EADn (T\u1EEB ch\u1ED1i k\xE8m l\xFD do), x\u1EED l\xFD, r\u1ED3i t\u1EF1 m\u1EDF m\u1EE5c k\u1EBF trong danh s\xE1ch \u0111ang l\u1ECDc. */
  protected async decide(action: 'approve' | 'reject'): Promise<void> {
    const item = this.entity();
    let reason: string | undefined;
    try {
      if (action === 'reject') {
        reason = await this.#confirm.withInput(\`T\u1EEB ch\u1ED1i \${item.code}. L\xFD do \u0111\u01B0\u1EE3c g\u1EEDi cho \${item.requester}.\`, {
          title: 'T\u1EEB ch\u1ED1i \u0111\u1EC1 ngh\u1ECB',
          label: 'L\xFD do t\u1EEB ch\u1ED1i',
          required: true,
          maxlength: 200,
          yesTitle: 'T\u1EEB ch\u1ED1i',
          noTitle: 'Kh\xF4ng',
          yesButtonColor: 'warning',
        });
      } else {
        await this.#confirm.confirm(\`Duy\u1EC7t \${item.code}: \${item.title}?\`, { title: 'Duy\u1EC7t \u0111\u1EC1 ngh\u1ECB', yesTitle: 'Duy\u1EC7t', noTitle: 'Kh\xF4ng' });
      }
    } catch {
      return;
    }
    this.pending.set(true);
    try {
      const next = this.#inbox.nextOf(item.id);
      this.entity.set(
        await firstValueFrom(
          action === 'approve' ? this.#approvalService.approve({ id: item.id }) : this.#approvalService.reject({ id: item.id, reason })
        )
      );
      this.#notify.success(action === 'approve' ? \`\u0110\xE3 duy\u1EC7t \${item.code}.\` : \`\u0110\xE3 t\u1EEB ch\u1ED1i \${item.code}.\`);
      await this.#inbox.refresh();
      await this.#router.navigate(next ? ['..', next] : ['..'], { relativeTo: this.#route });
    } catch (error) {
      this.#notify.error(apiErrorMessage(error));
    } finally {
      this.pending.set(false);
    }
  }
}
`,"features/approval/pages/list/approval-inbox.ts":`/** H\u1ED9p duy\u1EC7t m\xE0 panel chi ti\u1EBFt d\xF9ng \u0111\u1EC3 t\u1EF1 ch\u1ECDn m\u1EE5c k\u1EBF sau khi duy\u1EC7t ho\u1EB7c t\u1EEB ch\u1ED1i. */
export abstract class ApprovalInbox {
  /** M\u1EE5c sau \`id\` trong c\xE1c d\xF2ng \u0111ang hi\u1EC7n (m\u1EE5c tr\u01B0\u1EDBc n\u1EBFu \`id\` l\xE0 d\xF2ng cu\u1ED1i); \`null\` khi kh\xF4ng c\xF2n m\u1EE5c n\xE0o. */
  abstract nextOf(id: string): string | null;
  /** \u0110\u1ECDc l\u1EA1i danh s\xE1ch, gi\u1EEF b\u1ED9 l\u1ECDc, trang v\xE0 v\u1ECB tr\xED cu\u1ED9n. */
  abstract refresh(): Promise<void>;
}
`,"features/approval/pages/list/list.component.html":`<sd-page-list title="Ph\xEA duy\u1EC7t" description="\u0110\u1EC1 ngh\u1ECB thanh to\xE1n ch\u1EDD x\u1EED l\xFD. D\xF9ng \u2191 \u2193 \u0111\u1EC3 chuy\u1EC3n m\u1EE5c." detail="none">
  <div sdPageListMain class="approval" [class.approval--narrow]="narrow()" [class.approval--active]="active()">
    <sd-splitter [option]="splitter">
      <!-- K\xE9o trong kho\u1EA3ng 360\u2013760px; panel chi ti\u1EBFt nh\u1EADn ph\u1EA7n c\xF2n l\u1EA1i (unit flex: minSize l\xE0 tr\u1ECDng s\u1ED1, kh\xF4ng ph\u1EA3i px). -->
      <sd-splitter-panel class="approval__list" panelId="list" [size]="520" unit="px" [minSize]="360" [maxSize]="760">
        <sd-table autoId="approval-list" [option]="option">
          <ng-template sdTableCellDef="code" let-item="item">
            <a [routerLink]="[item.id]" [attr.aria-current]="item.id === selectedId() ? 'true' : null">{{ item.code }}</a>
          </ng-template>
        </sd-table>
      </sd-splitter-panel>
      <sd-splitter-panel class="approval__detail" panelId="detail" [size]="1">
        <router-outlet (activate)="active.set(true)" (deactivate)="active.set(false)" />
        @if (!active()) {
          <sd-data-state state="empty" icon="inbox" title="Ch\u1ECDn m\u1ED9t m\u1EE5c" message="Ch\u1ECDn m\u1ED9t \u0111\u1EC1 ngh\u1ECB b\xEAn tr\xE1i \u0111\u1EC3 xem chi ti\u1EBFt v\xE0 x\u1EED l\xFD." />
        }
      </sd-splitter-panel>
    </sd-splitter>
  </div>
</sd-page-list>
`,"features/approval/pages/list/list.component.ts":`import { ChangeDetectionStrategy, Component, DestroyRef, effect, forwardRef, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, firstValueFrom, map, startWith } from 'rxjs';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import { SdSplitterComponent, SdSplitterPanelComponent, type SdSplitterOption } from '@sdcorejs/angular/components/splitter';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdPageList } from '@sdcorejs/angular/modules/layout';
import { ApprovalService } from '../../services/approval.service';
import { APPROVAL_STATUS_OPTIONS, approvalStatusBadge, type ApprovalDto } from '../../services/approval.model';
import { ApprovalInbox } from './approval-inbox';

/** D\u01B0\u1EDBi b\u1EC1 r\u1ED9ng n\xE0y chi ti\u1EBFt thay h\u1EB3n danh s\xE1ch, c\xF3 n\xFAt quay l\u1EA1i. */
const NARROW = '(max-width: 767.98px)';

/**
 * H\u1ED9p duy\u1EC7t (pattern split): danh s\xE1ch b\xEAn tr\xE1i, chi ti\u1EBFt l\xE0 route con \`:id\` trong panel ph\u1EA3i. \u2191 \u2193 chuy\u1EC3n m\u1EE5c;
 * duy\u1EC7t ho\u1EB7c t\u1EEB ch\u1ED1i xong panel chi ti\u1EBFt t\u1EF1 ch\u1ECDn m\u1EE5c k\u1EBF, b\u1ED9 l\u1ECDc v\xE0 v\u1ECB tr\xED cu\u1ED9n c\u1EE7a danh s\xE1ch gi\u1EEF nguy\xEAn.
 */
@Component({
  selector: 'list',
  standalone: true,
  templateUrl: './list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Ph\xEDm \u2191 \u2193 n\u1ED5i l\xEAn t\u1EEB d\xF2ng hay n\xFAt \u0111ang focus trong danh s\xE1ch ho\u1EB7c panel chi ti\u1EBFt.
  host: { '(keydown)': 'move($event)' },
  imports: [
    RouterLink,
    RouterOutlet,
    SdPageList,
    SdSplitterComponent,
    SdSplitterPanelComponent,
    SdTable,
    SdTableCellDefDirective,
    SdDataState,
  ],
  providers: [{ provide: ApprovalInbox, useExisting: forwardRef(() => ListComponent) }],
  styles: \`
    .approval > sd-splitter {
      flex: 1 1 0;
      min-height: 0;
    }
    .approval sd-splitter-panel {
      display: flex;
      flex-direction: column;
    }
    .approval__list {
      background: var(--sd-surface, #ffffff);
      border: 1px solid var(--sd-border, #e3e5ea);
      border-radius: 8px;
    }
    .approval__list > sd-table {
      flex: 1 1 0;
      min-height: 0;
    }
    .approval__detail {
      overflow-y: auto;
    }
    .approval--narrow.approval--active sd-splitter-panel:first-child,
    .approval--narrow:not(.approval--active) sd-splitter-panel:last-of-type {
      display: none;
    }
  \`,
})
export class ListComponent extends ApprovalInbox {
  readonly #approvalService = inject(ApprovalService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  private readonly table = viewChild.required(SdTable);
  protected readonly active = signal(false);
  protected readonly narrow = signal(false);
  /** ID \u0111ang m\u1EDF \u1EDF panel ph\u1EA3i, \u0111\u1ECDc t\u1EEB route con. */
  protected readonly selectedId = toSignal(
    this.#router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.#route.firstChild?.snapshot.paramMap.get('id') ?? null)
    ),
    { requireSync: true }
  );
  protected readonly splitter: SdSplitterOption = { storageKey: 'sd-pattern.approval.splitter' };
  protected readonly option: SdTableOption<ApprovalDto> = {
    type: 'server',
    rowKey: 'id',
    items: (_, req) => firstValueFrom(this.#approvalService.list(req)),
    filter: {
      quickSearch: { containFields: ['code', 'title', 'requester'], placeholder: 'T\xECm theo m\xE3, n\u1ED9i dung, ng\u01B0\u1EDDi \u0111\u1EC1 ngh\u1ECB' },
    },
    paginate: { pageSize: 20, pages: [20, 50] },
    columns: [
      { field: 'code', title: 'M\xE3', type: 'string', width: '96px' },
      { field: 'title', title: 'N\u1ED9i dung', type: 'string', minWidth: '140px' },
      { field: 'amount', title: 'S\u1ED1 ti\u1EC1n (\u20AB)', type: 'number', width: '120px', align: 'right' },
      {
        field: 'status',
        title: 'Tr\u1EA1ng th\xE1i',
        type: 'values',
        width: '128px',
        option: { items: APPROVAL_STATUS_OPTIONS, valueField: 'id', displayField: 'name' },
        useBadge: status => approvalStatusBadge(status),
        // H\u1ED9p duy\u1EC7t m\u1EDF s\u1EB5n c\xE1c \u0111\u1EC1 ngh\u1ECB \u0111ang ch\u1EDD; \u0111\u1ED5i b\u1ED9 l\u1ECDc \u0111\u1EC3 xem \u0111\u1EC1 ngh\u1ECB \u0111\xE3 x\u1EED l\xFD.
        filter: { default: 'pending' },
      },
    ],
    style: {
      rowCss: (row): Record<string, string> => (row.id === this.selectedId() ? { background: 'var(--sd-primary-light)' } : {}),
    },
  };

  constructor() {
    super();
    // D\xF2ng \u0111ang m\u1EDF \u0111\u01B0\u1EE3c t\xF4 n\u1EC1n: v\u1EBD l\u1EA1i b\u1EA3ng khi ch\u1ECDn m\u1EE5c kh\xE1c.
    effect(() => {
      this.selectedId();
      untracked(() => this.table().detectChanges());
    });
    const media = typeof matchMedia === 'function' ? matchMedia(NARROW) : null;
    if (media) {
      this.narrow.set(media.matches);
      const onChange = (event: MediaQueryListEvent): void => this.narrow.set(event.matches);
      media.addEventListener('change', onChange);
      inject(DestroyRef).onDestroy(() => media.removeEventListener('change', onChange));
    }
  }

  nextOf(id: string): string | null {
    const rows = this.table().dataItems;
    const index = rows.findIndex(row => row.id === id);
    if (index < 0) return rows[0]?.id ?? null;
    return rows[index + 1]?.id ?? rows[index - 1]?.id ?? null;
  }

  async refresh(): Promise<void> {
    await this.table().reload(true, false);
  }

  /** \u2191 \u2193 chuy\u1EC3n sang d\xF2ng tr\u01B0\u1EDBc/sau; b\u1ECF qua khi \u0111ang g\xF5 trong \xF4 nh\u1EADp. */
  protected move(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable="true"], mat-select, [role="separator"]')) return;
    const rows = this.table().dataItems;
    if (!rows.length) return;
    const index = rows.findIndex(row => row.id === this.selectedId());
    const next = rows[Math.min(rows.length - 1, Math.max(0, index < 0 ? 0 : index + (event.key === 'ArrowDown' ? 1 : -1)))];
    event.preventDefault();
    if (next.id !== this.selectedId()) void this.#router.navigate([next.id], { relativeTo: this.#route });
  }
}
`,"features/approval/routes.ts":`import type { Routes } from '@angular/router';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { entityResolver } from './entity.resolver';
import { ApprovalService } from './services/approval.service';

/** Chi ti\u1EBFt l\xE0 route con \`:id\`, hi\u1EC7n trong panel ph\u1EA3i c\u1EE7a danh s\xE1ch (pattern split). */
export const routes: Routes = [
  {
    path: '',
    providers: [ApprovalService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: 'Ph\xEA duy\u1EC7t',
        data: { permission: 'PATTERN_APPROVAL_R_LIST' },
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
        children: [
          {
            path: ':id',
            data: { permission: 'PATTERN_APPROVAL_R_DETAIL' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () => import('./pages/detail/detail.component').then(module => module.DetailComponent),
          },
        ],
      },
    ],
  },
];
`,"features/approval/services/approval.model.ts":`import type { SdBadgeData } from '@sdcorejs/angular/components/badge';
import type { PagingReq, PagingRes } from '@sdcorejs/utils/models';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export const APPROVAL_STATUS_OPTIONS = [
  { id: 'pending', name: 'Ch\u1EDD duy\u1EC7t', color: 'warning' },
  { id: 'approved', name: '\u0110\xE3 duy\u1EC7t', color: 'success' },
  { id: 'rejected', name: 'B\u1ECB t\u1EEB ch\u1ED1i', color: 'error' },
] satisfies { id: ApprovalStatus; name: string; color: SdBadgeData['color'] }[];

/** \u0110\u1EC1 ngh\u1ECB thanh to\xE1n ch\u1EDD ng\u01B0\u1EDDi duy\u1EC7t x\u1EED l\xFD. */
export interface ApprovalDto {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly requester: string;
  readonly department: string;
  /** S\u1ED1 ti\u1EC1n \u0111\u1EC1 ngh\u1ECB (\u20AB). */
  readonly amount: number;
  readonly submittedAt: string;
  readonly status: ApprovalStatus;
  readonly reason: string | null;
  readonly note: string | null;
}

export type ApprovalListReq = PagingReq<ApprovalDto>;
export type ApprovalListRes = PagingRes<ApprovalDto>;

export interface ApprovalDecisionReq {
  readonly id: string;
  readonly reason?: string;
}

export function approvalStatusBadge(status: ApprovalStatus): SdBadgeData {
  const option = APPROVAL_STATUS_OPTIONS.find(item => item.id === status);
  return { type: 'round', title: option?.name ?? status, color: option?.color };
}
`,"features/approval/services/approval.service.ts":`import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { BaseApiService } from '../../../services/base-api.service';
import type { ApprovalDecisionReq, ApprovalDto, ApprovalListReq, ApprovalListRes } from './approval.model';

@Injectable()
export class ApprovalService extends BaseApiService {
  list(req: ApprovalListReq): Observable<ApprovalListRes> {
    return this.http.get<ApprovalListRes>(this.apiUrl('approvals'), { params: this.buildPagingReq(req) });
  }

  detail(id: string): Observable<ApprovalDto> {
    return this.http.get<ApprovalDto>(this.apiUrl('approvals', id));
  }

  approve(req: ApprovalDecisionReq): Observable<ApprovalDto> {
    return this.http.post<ApprovalDto>(this.apiUrl('approvals', req.id, 'approve'), {});
  }

  reject(req: ApprovalDecisionReq): Observable<ApprovalDto> {
    return this.http.post<ApprovalDto>(this.apiUrl('approvals', req.id, 'reject'), { reason: req.reason });
  }
}
`,"features/category/components/create-side-drawer/create-side-drawer.component.ts":`import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import { CategoryService } from '../../services/category.service';
import type { CategoryDto, CategorySaveReq } from '../../services/category.model';
import {
  categorySaveReq,
  GeneralInformationFormComponent,
  type CategoryForm,
} from '../general-information-form/general-information-form.component';

/**
 * T\u1EA1o danh m\u1EE5c trong drawer (route con \`create\`, \`?parent=<id>\` cho danh m\u1EE5c con). Danh m\u1EE5c cha do resolver t\u1EA3i.
 * X, Esc v\xE0 backdrop h\u1ECFi tr\u01B0\u1EDBc khi b\u1ECF thay \u0111\u1ED5i; l\u01B0u xong \u0111\xF3ng drawer v\xE0 danh s\xE1ch t\u1EA3i l\u1EA1i.
 */
@Component({
  selector: 'create-side-drawer',
  standalone: true,
  imports: [SdSideDrawer, SdButton, GeneralInformationFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-side-drawer
      [title]="parent() ? 'Th\xEAm danh m\u1EE5c con c\u1EE7a ' + parent()!.name : 'T\u1EA1o danh m\u1EE5c'"
      autoId="category-create"
      [beforeClose]="beforeClose"
      (sdClosed)="closed()">
      <general-information-form [form]="form" [seed]="seed" [parentName]="parent()?.name ?? null" [errors]="apiErrors.errors()" />
      <div sdFooterRight class="d-flex align-items-center gap-8">
        <sd-button
          title="T\u1EA1o danh m\u1EE5c"
          prefixIcon="save"
          type="fill"
          color="primary"
          autoId="category-save"
          [loading]="saving()"
          (click)="save()" />
      </div>
    </sd-side-drawer>
  \`,
})
export class CreateSideDrawerComponent {
  readonly #categoryService = inject(CategoryService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #injector = inject(Injector);
  private readonly drawer = viewChild.required(SdSideDrawer);
  private readonly formElement = viewChild.required(GeneralInformationFormComponent, { read: ElementRef });
  protected readonly parent = toSignal(this.#route.data.pipe(map(data => (data['parent'] as CategoryDto | null) ?? null)), {
    requireSync: true,
  });
  protected readonly seed: CategorySaveReq = { code: '', name: '', parentId: null, status: 'active' };
  protected readonly form: CategoryForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'category-create', dirty: 'value' });

  protected readonly beforeClose = async (): Promise<boolean> => {
    if (this.saving()) return false;
    if (!this.#unsaved.dirty()) return true;
    try {
      await this.#confirm.confirm('Thay \u0111\u1ED5i ch\u01B0a l\u01B0u s\u1EBD b\u1ECB m\u1EA5t.', {
        title: '\u0110\xF3ng khi ch\u01B0a l\u01B0u?',
        yesTitle: 'B\u1ECF thay \u0111\u1ED5i',
        noTitle: 'Ti\u1EBFp t\u1EE5c s\u1EEDa',
        yesButtonColor: 'warning',
      });
    } catch {
      return false;
    }
    this.#unsaved.markPristine();
    return true;
  };

  constructor() {
    afterNextRender(() => this.drawer().open());
    inject(DestroyRef).onDestroy(() => this.#unsaved.destroy());
  }

  protected closed(): void {
    void this.#router.navigate(['..'], { relativeTo: this.#route });
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.#focusFirstInvalid();
      return;
    }
    this.saving.set(true);
    try {
      const category = await firstValueFrom(this.#categoryService.create(categorySaveReq(this.form, this.parent()?.id ?? null)));
      this.#unsaved.markPristine();
      this.#notify.success(\`\u0110\xE3 t\u1EA1o danh m\u1EE5c \${category.name}.\`);
      this.saving.set(false);
      this.drawer().close();
    } catch (error) {
      if (this.apiErrors.set(error)) this.#focusFirstInvalid();
      else this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng th\u1EC3 l\u01B0u. D\u1EEF li\u1EC7u \u0111\xE3 nh\u1EADp v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF.'));
    } finally {
      this.saving.set(false);
    }
  }

  #focusFirstInvalid(): void {
    afterNextRender(() => focusFirstInvalid(this.formElement().nativeElement), { injector: this.#injector });
  }
}
`,"features/category/components/general-information-form/general-information-form.component.ts":`import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FormControl, FormGroup } from '@angular/forms';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdSwitch } from '@sdcorejs/angular/forms/switch';
import type { CategorySaveReq } from '../../services/category.model';

export type CategoryForm = FormGroup<{
  code?: FormControl<string>;
  name?: FormControl<string>;
  active?: FormControl<boolean>;
}>;

/** Gi\xE1 tr\u1ECB form \u2192 request l\u01B0u; danh m\u1EE5c cha do drawer quy\u1EBFt \u0111\u1ECBnh, kh\xF4ng s\u1EEDa trong form. */
export function categorySaveReq(form: CategoryForm, parentId: string | null, code?: string): CategorySaveReq {
  const value = form.getRawValue();
  return { code: code ?? value.code ?? '', name: value.name ?? '', parentId, status: value.active === false ? 'inactive' : 'active' };
}

/** Form danh m\u1EE5c m\u1ED9t nh\xF3m, d\xF9ng chung cho drawer t\u1EA1o v\xE0 c\u1EADp nh\u1EADt. */
@Component({
  selector: 'general-information-form',
  standalone: true,
  imports: [SdSection, SdView, SdInput, SdSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-section title="Th\xF4ng tin chung">
      <div class="d-flex flex-column gap-8 p-16">
        <sd-view label="Danh m\u1EE5c cha" [display]="parentName()" />
        <sd-input
          label="M\xE3 danh m\u1EE5c"
          name="code"
          autoId="category-code"
          [form]="form()"
          [model]="seed().code"
          [disabled]="editing()"
          [inlineError]="errors()['code']"
          maxlength="30"
          required />
        <sd-input
          label="T\xEAn danh m\u1EE5c"
          name="name"
          autoId="category-name"
          [form]="form()"
          [model]="seed().name"
          [inlineError]="errors()['name']"
          maxlength="100"
          required />
        <sd-switch label="\u0110ang d\xF9ng" name="active" [form]="form()" [model]="seed().status !== 'inactive'" />
      </div>
    </sd-section>
  \`,
})
export class GeneralInformationFormComponent {
  readonly form = input.required<CategoryForm>();
  readonly seed = input.required<CategorySaveReq>();
  readonly parentName = input<string | null>(null);
  readonly editing = input(false);
  readonly errors = input<Readonly<Record<string, string>>>({});
}
`,"features/category/components/update-side-drawer/update-side-drawer.component.ts":`import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import { CategoryService } from '../../services/category.service';
import type { CategoryDto } from '../../services/category.model';
import {
  categorySaveReq,
  GeneralInformationFormComponent,
  type CategoryForm,
} from '../general-information-form/general-information-form.component';

/**
 * C\u1EADp nh\u1EADt danh m\u1EE5c trong drawer (route con \`:id/update\`, m\u1EDF t\u1EEB t\xEAn danh m\u1EE5c). M\xE3 b\u1ECB kho\xE1; danh m\u1EE5c cha gi\u1EEF nguy\xEAn.
 * X, Esc v\xE0 backdrop h\u1ECFi tr\u01B0\u1EDBc khi b\u1ECF thay \u0111\u1ED5i; l\u01B0u xong \u0111\xF3ng drawer v\xE0 danh s\xE1ch t\u1EA3i l\u1EA1i.
 */
@Component({
  selector: 'update-side-drawer',
  standalone: true,
  imports: [SdSideDrawer, SdButton, GeneralInformationFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-side-drawer
      [title]="'C\u1EADp nh\u1EADt danh m\u1EE5c ' + entity().code"
      autoId="category-update"
      [beforeClose]="beforeClose"
      (sdClosed)="closed()">
      <general-information-form
        [form]="form"
        [seed]="entity()"
        [parentName]="parentName()"
        [editing]="true"
        [errors]="apiErrors.errors()" />
      <div sdFooterRight class="d-flex align-items-center gap-8">
        <sd-button title="L\u01B0u" prefixIcon="save" type="fill" color="primary" autoId="category-save" [loading]="saving()" (click)="save()" />
      </div>
    </sd-side-drawer>
  \`,
})
export class UpdateSideDrawerComponent {
  readonly #categoryService = inject(CategoryService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #injector = inject(Injector);
  private readonly drawer = viewChild.required(SdSideDrawer);
  private readonly formElement = viewChild.required(GeneralInformationFormComponent, { read: ElementRef });
  protected readonly entity = toSignal(this.#route.data.pipe(map(data => data['entity'] as CategoryDto)), { requireSync: true });
  protected readonly parentName = signal<string | null>(null);
  protected readonly form: CategoryForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'category-update', dirty: 'value' });

  protected readonly beforeClose = async (): Promise<boolean> => {
    if (this.saving()) return false;
    if (!this.#unsaved.dirty()) return true;
    try {
      await this.#confirm.confirm('Thay \u0111\u1ED5i ch\u01B0a l\u01B0u s\u1EBD b\u1ECB m\u1EA5t.', {
        title: '\u0110\xF3ng khi ch\u01B0a l\u01B0u?',
        yesTitle: 'B\u1ECF thay \u0111\u1ED5i',
        noTitle: 'Ti\u1EBFp t\u1EE5c s\u1EEDa',
        yesButtonColor: 'warning',
      });
    } catch {
      return false;
    }
    this.#unsaved.markPristine();
    return true;
  };

  constructor() {
    afterNextRender(() => this.drawer().open());
    const parentId = this.entity().parentId;
    if (parentId) {
      firstValueFrom(this.#categoryService.detail(parentId)).then(
        parent => this.parentName.set(parent.name),
        () => this.parentName.set(null)
      );
    }
    inject(DestroyRef).onDestroy(() => this.#unsaved.destroy());
  }

  protected closed(): void {
    void this.#router.navigate(['../..'], { relativeTo: this.#route });
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.#focusFirstInvalid();
      return;
    }
    this.saving.set(true);
    try {
      const entity = this.entity();
      await firstValueFrom(this.#categoryService.update(entity.id, categorySaveReq(this.form, entity.parentId, entity.code)));
      this.#unsaved.markPristine();
      this.#notify.success('\u0110\xE3 c\u1EADp nh\u1EADt danh m\u1EE5c.');
      this.saving.set(false);
      this.drawer().close();
    } catch (error) {
      if (this.apiErrors.set(error)) this.#focusFirstInvalid();
      else this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng th\u1EC3 l\u01B0u. D\u1EEF li\u1EC7u \u0111\xE3 nh\u1EADp v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF.'));
    } finally {
      this.saving.set(false);
    }
  }

  #focusFirstInvalid(): void {
    afterNextRender(() => focusFirstInvalid(this.formElement().nativeElement), { injector: this.#injector });
  }
}
`,"features/category/entity.resolver.ts":`import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { map, of, timeout } from 'rxjs';
import { CategoryService } from './services/category.service';
import type { CategoryDto } from './services/category.model';

/** T\u1EA3i danh m\u1EE5c b\u1EB1ng \`detail(id)\` tr\u01B0\u1EDBc khi m\u1EDF drawer c\u1EADp nh\u1EADt; l\u1ED7i \u0111i t\u1EDBi navigation error handler c\u1EE7a host. */
export const entityResolver: ResolveFn<CategoryDto> = route => {
  const id = route.paramMap.get('id');
  if (!id?.trim()) throw new HttpErrorResponse({ status: 404 });
  return inject(CategoryService)
    .detail(id)
    .pipe(
      timeout(10_000),
      map(entity => {
        if (!entity || entity.id !== id) throw new HttpErrorResponse({ status: 404 });
        return entity;
      })
    );
};

/** Danh m\u1EE5c cha c\u1EE7a drawer t\u1EA1o (\`?parent=<id>\`); kh\xF4ng c\xF3 tham s\u1ED1 th\xEC t\u1EA1o danh m\u1EE5c g\u1ED1c. */
export const parentResolver: ResolveFn<CategoryDto | null> = route => {
  const id = route.queryParamMap.get('parent');
  return id ? inject(CategoryService).detail(id).pipe(timeout(10_000)) : of(null);
};
`,"features/category/pages/list/list.component.html":`<sd-page-list title="Danh m\u1EE5c" description="Danh m\u1EE5c s\u1EA3n ph\u1EA9m ba c\u1EA5p." detail="drawer">
  <sd-button
    headerRight
    *sdPermission="'PATTERN_CATEGORY_C_CREATE'"
    title="T\u1EA1o danh m\u1EE5c"
    prefixIcon="add"
    type="fill"
    color="primary"
    autoId="category-create"
    [routerLink]="['create']" />

  <sd-table autoId="categories" [option]="option">
    <ng-template sdTableCellDef="name" let-category="item">
      <a *sdPermission="'PATTERN_CATEGORY_U_UPDATE'" [routerLink]="[category.id, 'update']">{{ category.name }}</a>
      @if (!canUpdate) {
        <span>{{ category.name }}</span>
      }
    </ng-template>
  </sd-table>
</sd-page-list>
`,"features/category/pages/list/list.component.ts":`import { ChangeDetectionStrategy, Component, effect, inject, untracked, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdPageList } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage } from '../../../../utils/api-error';
import { CategoryService } from '../../services/category.service';
import { CATEGORY_MAX_LEVEL, CATEGORY_STATUS_OPTIONS, categoryStatusBadge, type CategoryNodeDto } from '../../services/category.model';

/**
 * B\u1EA3ng c\xE2y ba c\u1EA5p. T\xEAn m\u1EDF drawer c\u1EADp nh\u1EADt; thao t\xE1c theo d\xF2ng: th\xEAm danh m\u1EE5c con (drawer, t\u1ED1i \u0111a c\u1EA5p 3) v\xE0 xo\xE1
 * (h\u1ECFi x\xE1c nh\u1EADn, API t\u1EEB ch\u1ED1i khi c\xF2n danh m\u1EE5c con).
 */
@Component({
  selector: 'list',
  standalone: true,
  templateUrl: './list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SdPageList, SdButton, SdTable, SdTableCellDefDirective, SdPermissionDirective],
})
export class ListComponent {
  readonly #categoryService = inject(CategoryService);
  readonly #permission = inject(SdPermissionService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  private readonly pageList = viewChild.required(SdPageList);
  private readonly table = viewChild.required(SdTable);
  protected readonly canUpdate = this.#permission.hasPermission('PATTERN_CATEGORY_U_UPDATE');

  protected readonly option: SdTableOption<CategoryNodeDto> = {
    type: 'local',
    rowKey: 'id',
    items: () => firstValueFrom(this.#categoryService.tree()),
    // C\xE2y nh\u1ECF (3 c\u1EA5p): m\u1EDF h\u1EBFt \u0111\u1EC3 danh m\u1EE5c con v\u1EEBa t\u1EA1o hi\u1EC7n ngay d\u01B0\u1EDBi danh m\u1EE5c cha.
    tree: { loadType: 'static', childrenKey: 'children', maxDepth: CATEGORY_MAX_LEVEL, defaultExpanded: true },
    filter: { quickSearch: { containFields: ['code', 'name'], placeholder: 'T\xECm theo m\xE3 ho\u1EB7c t\xEAn danh m\u1EE5c' } },
    paginate: { pageSize: 50 },
    columns: [
      { field: 'name', title: 'T\xEAn danh m\u1EE5c', type: 'string', minWidth: '260px' },
      { field: 'code', title: 'M\xE3', type: 'string', width: '160px' },
      { field: 'productCount', title: 'S\u1ED1 s\u1EA3n ph\u1EA9m', type: 'number', width: '140px', align: 'right' },
      {
        field: 'status',
        title: 'Tr\u1EA1ng th\xE1i',
        type: 'values',
        width: '150px',
        option: { items: CATEGORY_STATUS_OPTIONS, valueField: 'id', displayField: 'name' },
        useBadge: status => categoryStatusBadge(status),
      },
    ],
    command: {
      commands: [
        {
          title: 'Th\xEAm danh m\u1EE5c con',
          icon: 'add',
          hidden: row => !this.#permission.hasPermission('PATTERN_CATEGORY_C_CREATE') || row.level >= CATEGORY_MAX_LEVEL,
          click: row => void this.#router.navigate(['create'], { relativeTo: this.#route, queryParams: { parent: row.id } }),
        },
        {
          title: 'Xo\xE1',
          icon: 'delete',
          color: 'error',
          hidden: () => !this.#permission.hasPermission('PATTERN_CATEGORY_D_DELETE'),
          click: row => void this.#delete(row),
        },
      ],
    },
  };

  constructor() {
    let changes = this.#categoryService.changes();
    effect(() => {
      const next = this.#categoryService.changes();
      if (this.pageList().childActive() || next === changes) return;
      changes = next;
      untracked(() => void this.table().reload(true, false));
    });
  }

  async #delete(category: CategoryNodeDto): Promise<void> {
    try {
      await this.#confirm.confirm(\`Xo\xE1 danh m\u1EE5c \${category.name}?\`, {
        title: 'Xo\xE1 danh m\u1EE5c',
        yesTitle: 'Xo\xE1',
        noTitle: 'Kh\xF4ng xo\xE1',
        yesButtonColor: 'error',
      });
    } catch {
      return;
    }
    try {
      await firstValueFrom(this.#categoryService.delete(category.id));
      this.#notify.success(\`\u0110\xE3 xo\xE1 danh m\u1EE5c \${category.name}.\`);
      await this.table().reload(true, false);
    } catch (error) {
      this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng xo\xE1 \u0111\u01B0\u1EE3c danh m\u1EE5c.'));
    }
  }
}
`,"features/category/routes.ts":`import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { entityResolver, parentResolver } from './entity.resolver';
import { CategoryService } from './services/category.service';

/** T\u1EA1o v\xE0 c\u1EADp nh\u1EADt m\u1EDF trong drawer (route con c\u1EE7a b\u1EA3ng c\xE2y). */
export const routes: Routes = [
  {
    path: '',
    providers: [CategoryService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: 'Danh m\u1EE5c',
        data: { permission: 'PATTERN_CATEGORY_R_LIST' },
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
        children: [
          {
            path: 'create',
            data: { permission: 'PATTERN_CATEGORY_C_CREATE' },
            resolve: { parent: parentResolver },
            runGuardsAndResolvers: 'paramsOrQueryParamsChange',
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () =>
              import('./components/create-side-drawer/create-side-drawer.component').then(module => module.CreateSideDrawerComponent),
          },
          {
            path: ':id/update',
            data: { permission: 'PATTERN_CATEGORY_U_UPDATE' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () =>
              import('./components/update-side-drawer/update-side-drawer.component').then(module => module.UpdateSideDrawerComponent),
          },
        ],
      },
    ],
  },
];
`,"features/category/services/category.model.ts":`import type { SdBadgeData } from '@sdcorejs/angular/components/badge';

export type CategoryStatus = 'active' | 'inactive';

export const CATEGORY_STATUS_OPTIONS = [
  { id: 'active', name: '\u0110ang d\xF9ng', color: 'success' },
  { id: 'inactive', name: 'Ng\u1EEBng d\xF9ng', color: 'secondary' },
] satisfies { id: CategoryStatus; name: string; color: SdBadgeData['color'] }[];

/** Danh m\u1EE5c c\xF3 t\u1ED1i \u0111a 3 c\u1EA5p. */
export const CATEGORY_MAX_LEVEL = 3;

export interface CategoryDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly status: CategoryStatus;
}

/** M\u1ED9t n\xFAt c\u1EE7a c\xE2y danh m\u1EE5c cho b\u1EA3ng c\xE2y. */
export interface CategoryNodeDto extends CategoryDto {
  /** 1 l\xE0 c\u1EA5p g\u1ED1c. */
  readonly level: number;
  readonly productCount: number;
  readonly children: readonly CategoryNodeDto[];
}

export interface CategorySaveReq {
  readonly code: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly status: CategoryStatus;
}

export function categoryStatusBadge(status: CategoryStatus): SdBadgeData {
  const option = CATEGORY_STATUS_OPTIONS.find(item => item.id === status);
  return { type: 'round', title: option?.name ?? status, color: option?.color };
}
`,"features/category/services/category.service.ts":`import { Injectable, signal } from '@angular/core';
import { tap, type Observable } from 'rxjs';
import { BaseApiService } from '../../../services/base-api.service';
import type { CategoryDto, CategoryNodeDto, CategorySaveReq } from './category.model';

@Injectable()
export class CategoryService extends BaseApiService {
  readonly #changes = signal(0);
  /** T\u0103ng sau m\u1ED7i l\u1EA7n t\u1EA1o, c\u1EADp nh\u1EADt ho\u1EB7c xo\xE1 th\xE0nh c\xF4ng: danh s\xE1ch ch\u1EC9 t\u1EA3i l\u1EA1i khi c\xF3 thay \u0111\u1ED5i. */
  readonly changes = this.#changes.asReadonly();

  /** C\u1EA3 c\xE2y danh m\u1EE5c, c\xE1c n\xFAt g\u1ED1c theo th\u1EE9 t\u1EF1. */
  tree(): Observable<CategoryNodeDto[]> {
    return this.http.get<CategoryNodeDto[]>(this.apiUrl('categories', 'tree'));
  }

  detail(id: string): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(this.apiUrl('categories', id));
  }

  create(req: CategorySaveReq): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(this.apiUrl('categories'), req).pipe(tap(() => this.#changed()));
  }

  update(id: string, req: CategorySaveReq): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(this.apiUrl('categories', id), req).pipe(tap(() => this.#changed()));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(this.apiUrl('categories', id)).pipe(tap(() => this.#changed()));
  }

  #changed(): void {
    this.#changes.update(count => count + 1);
  }
}
`,"features/customer/components/create-side-drawer/create-side-drawer.component.ts":`import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import { CustomerService } from '../../services/customer.service';
import type { CustomerSaveReq } from '../../services/customer.model';
import {
  customerSaveReq,
  GeneralInformationFormComponent,
  invalidCustomerGroups,
  type CustomerForm,
  type CustomerFormGroup,
} from '../general-information-form/general-information-form.component';

/**
 * T\u1EA1o kh\xE1ch h\xE0ng trong drawer (route con \`create\` c\u1EE7a danh s\xE1ch). Ba nh\xF3m, m\u1ED7i nh\xF3m c\xF2n l\u1ED7i hi\u1EC7n \`sd-inform\`; BE b\xE1o
 * tr\xF9ng email ngay tr\xEAn field. L\u01B0u th\xE0nh c\xF4ng th\xEC \u0111\xF3ng drawer, danh s\xE1ch t\u1EA3i l\u1EA1i.
 */
@Component({
  selector: 'create-side-drawer',
  standalone: true,
  imports: [SdSideDrawer, SdButton, GeneralInformationFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-side-drawer title="T\u1EA1o kh\xE1ch h\xE0ng" width="600px" autoId="customer-create" [beforeClose]="beforeClose" (sdClosed)="closed()">
      <general-information-form [form]="form" [seed]="seed" [errors]="apiErrors.errors()" [invalidGroups]="invalidGroups()" />
      <div sdFooterRight class="d-flex align-items-center gap-8">
        <sd-button
          title="T\u1EA1o kh\xE1ch h\xE0ng"
          prefixIcon="save"
          type="fill"
          color="primary"
          autoId="customer-save"
          [loading]="saving()"
          (click)="save()" />
      </div>
    </sd-side-drawer>
  \`,
})
export class CreateSideDrawerComponent {
  readonly #customerService = inject(CustomerService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #injector = inject(Injector);
  private readonly drawer = viewChild.required(SdSideDrawer);
  // why: sd-side-drawer chuy\u1EC3n n\u1ED9i dung ra body, n\xEAn t\xECm field l\u1ED7i trong form ch\u1EE9 kh\xF4ng trong host c\u1EE7a component.
  private readonly formElement = viewChild.required(GeneralInformationFormComponent, { read: ElementRef });
  protected readonly seed: CustomerSaveReq = {
    name: '',
    type: 'individual',
    tier: 'standard',
    email: '',
    phone: '',
    address: '',
    taxCode: null,
    status: 'active',
    note: null,
  };
  protected readonly form: CustomerForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  protected readonly invalidGroups = signal<CustomerFormGroup[]>([]);
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'customer-create', dirty: 'value' });

  /** \u0110\xF3ng khi c\xF2n thay \u0111\u1ED5i ch\u01B0a l\u01B0u: h\u1ECFi, \u0111\u1ED3ng \xFD th\xEC b\u1ECF thay \u0111\u1ED5i (guard r\u1EDDi route kh\xF4ng h\u1ECFi l\u1EA1i). */
  protected readonly beforeClose = async (): Promise<boolean> => {
    if (!this.#unsaved.dirty() || this.saving()) return !this.saving();
    try {
      await this.#confirm.confirm('Thay \u0111\u1ED5i ch\u01B0a l\u01B0u s\u1EBD b\u1ECB m\u1EA5t.', {
        title: '\u0110\xF3ng khi ch\u01B0a l\u01B0u?',
        yesTitle: 'B\u1ECF thay \u0111\u1ED5i',
        noTitle: 'Ti\u1EBFp t\u1EE5c s\u1EEDa',
        yesButtonColor: 'warning',
      });
    } catch {
      return false;
    }
    this.#unsaved.markPristine();
    return true;
  };

  constructor() {
    afterNextRender(() => this.drawer().open());
    inject(DestroyRef).onDestroy(() => this.#unsaved.destroy());
  }

  protected closed(): void {
    void this.#router.navigate(['..'], { relativeTo: this.#route });
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.#showErrors();
      return;
    }
    this.saving.set(true);
    try {
      const customer = await firstValueFrom(this.#customerService.create(customerSaveReq(this.form)));
      this.#unsaved.markPristine();
      this.#notify.success(\`\u0110\xE3 t\u1EA1o kh\xE1ch h\xE0ng \${customer.code}.\`);
      this.saving.set(false);
      this.drawer().close();
    } catch (error) {
      if (this.apiErrors.set(error)) this.#showErrors();
      else this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng th\u1EC3 l\u01B0u. D\u1EEF li\u1EC7u \u0111\xE3 nh\u1EADp v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF.'));
    } finally {
      this.saving.set(false);
    }
  }

  /** \`sd-inform\` trong t\u1EEBng nh\xF3m c\xF3 l\u1ED7i, r\u1ED3i focus field l\u1ED7i \u0111\u1EA7u ti\xEAn. */
  #showErrors(): void {
    this.invalidGroups.set(invalidCustomerGroups(this.form, this.apiErrors.errors()));
    afterNextRender(() => focusFirstInvalid(this.formElement().nativeElement), { injector: this.#injector });
  }
}
`,"features/customer/components/customer-select/customer-select.component.ts":`import { booleanAttribute, ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SdAvatar } from '@sdcorejs/angular/components/avatar';
import { SdItemDefDefDirective } from '@sdcorejs/angular/forms/directives';
import type { SdSearchReq } from '@sdcorejs/angular/forms/models';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import type { Filter } from '@sdcorejs/utils/models';
import { CustomerService } from '../../services/customer.service';
import type { CustomerDto } from '../../services/customer.model';

/**
 * Ch\u1ECDn kh\xE1ch h\xE0ng cho m\xE0n kh\xE1c (\u0111\u01A1n h\xE0ng). L\u1EF1a ch\u1ECDn m\u1EDBi ch\u1EC9 g\u1ED3m kh\xE1ch \u0111ang ho\u1EA1t \u0111\u1ED9ng; gi\xE1 tr\u1ECB \u0111\xE3 ch\u1ECDn t\u1EA3i theo ID
 * (\`VALUE\`) n\xEAn kh\xE1ch \u0111\xE3 ng\u1EEBng v\u1EABn hi\u1EC7n khi c\u1EADp nh\u1EADt. Option hai d\xF2ng c\xF3 avatar: t\xEAn \xB7 m\xE3 \xB7 \u0111i\u1EC7n tho\u1EA1i.
 */
@Component({
  selector: 'customer-select',
  standalone: true,
  imports: [SdSelect, SdItemDefDefDirective, SdAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<sd-select
    [label]="label()"
    [name]="name()"
    [form]="form()"
    [(model)]="model"
    [items]="search"
    valueField="id"
    displayField="name"
    [required]="required()"
    [autoId]="autoId()">
    <ng-template sdItemDef let-item="item">
      <div class="d-flex align-items-center gap-8">
        <sd-avatar [src]="null" [name]="item.name" [size]="28" />
        <div class="d-flex flex-column">
          <span>{{ item.name }}</span>
          <small class="text-secondary"
            >{{ item.code }} \xB7 {{ item.phone }}{{ item.status === 'inactive' ? ' \xB7 Ng\u1EEBng ho\u1EA1t \u0111\u1ED9ng' : '' }}</small
          >
        </div>
      </div>
    </ng-template>
  </sd-select>\`,
})
export class CustomerSelectComponent {
  readonly #customerService = inject(CustomerService);
  readonly form = input<FormGroup>();
  readonly name = input('customerId');
  readonly label = input<string | undefined>('Kh\xE1ch h\xE0ng');
  readonly required = input(false, { transform: booleanAttribute });
  readonly autoId = input<string>();
  readonly model = model<string | null | undefined>();

  protected readonly search = async (req: SdSearchReq): Promise<CustomerDto[]> => {
    if (req.type === 'VALUE') {
      const ids = (Array.isArray(req.value) ? req.value : [req.value]).filter((id): id is string => !!id);
      return Promise.all(ids.map(id => firstValueFrom(this.#customerService.cachedDetail(id))));
    }
    const filters: Filter<CustomerDto>[] = [{ field: 'status', operator: 'EQUAL', data: 'active' }];
    if (req.searchText) {
      filters.push({
        operator: 'OR',
        data: [
          { field: 'name', operator: 'CONTAIN', data: req.searchText },
          { field: 'code', operator: 'CONTAIN', data: req.searchText },
          { field: 'phone', operator: 'CONTAIN', data: req.searchText },
        ],
      });
    }
    const res = await firstValueFrom(this.#customerService.list({ pageNumber: 0, pageSize: 20, filters }));
    return res.items;
  };
}
`,"features/customer/components/customer-type-select/customer-type-select.component.ts":`import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { CUSTOMER_TYPE_OPTIONS, type CustomerType } from '../../services/customer.model';

/** Dropdown lo\u1EA1i kh\xE1ch h\xE0ng. */
@Component({
  selector: 'customer-type-select',
  standalone: true,
  imports: [SdSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<sd-select
    [label]="label()"
    [name]="name()"
    [form]="form()"
    [(model)]="model"
    [items]="options"
    valueField="id"
    displayField="name"
    [required]="required()"
    [clearable]="false" />\`,
})
export class CustomerTypeSelectComponent {
  readonly form = input<FormGroup>();
  readonly name = input('type');
  readonly label = input('Lo\u1EA1i kh\xE1ch h\xE0ng');
  readonly required = input(true);
  readonly model = model<CustomerType | null | undefined>();
  protected readonly options = CUSTOMER_TYPE_OPTIONS;
}
`,"features/customer/components/debts-view/debts-view.component.ts":`import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SdTable, type SdTableOption } from '@sdcorejs/angular/components/table';
import { CustomerService } from '../../services/customer.service';
import type { CustomerDebtDto } from '../../services/customer.model';

/** Tab C\xF4ng n\u1EE3 c\u1EE7a h\u1ED3 s\u01A1 360\xB0. */
@Component({
  selector: 'debts-view',
  standalone: true,
  imports: [SdTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<sd-table autoId="customer-debts" [option]="option" />\`,
})
export class DebtsViewComponent {
  readonly #customerService = inject(CustomerService);
  readonly customerId = input.required<string>();
  protected readonly option: SdTableOption<CustomerDebtDto> = {
    type: 'server',
    items: () => firstValueFrom(this.#customerService.debts(this.customerId())),
    paginate: { pageSize: 10 },
    columns: [
      { field: 'orderCode', title: '\u0110\u01A1n h\xE0ng', type: 'string', width: '140px' },
      { field: 'dueDate', title: 'H\u1EA1n thanh to\xE1n', type: 'date', width: '160px' },
      { field: 'amount', title: 'C\xF2n n\u1EE3 (\u20AB)', type: 'number', align: 'right' },
    ],
  };
}
`,"features/customer/components/detail-side-drawer/detail-side-drawer.component.ts":`import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
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
 * Chi ti\u1EBFt kh\xE1ch h\xE0ng trong drawer (route con \`:id/detail\` c\u1EE7a danh s\xE1ch). B\u1EA3n ghi do resolver t\u1EA3i b\u1EB1ng
 * \`detail(id)\`, kh\xF4ng l\u1EA5y d\u1EEF li\u1EC7u c\u1EE7a d\xF2ng. Ch\u1EC9 \u0111\xF3ng b\u1EB1ng X (c\xF9ng Esc, backdrop): kh\xF4ng c\xF3 n\xFAt \u0110\xF3ng (E4).
 * Xo\xE1 l\xE0 t\xE1c v\u1EE5 hi\u1EBFm d\xF9ng v\xE0 ph\xE1 hu\u1EF7: n\xFAt ch\u1EC9 c\xF3 icon m\xE0u \u0111\u1ECF \u1EDF header, c\u1EA1nh X; footer gi\u1EEF t\xE1c v\u1EE5 th\u01B0\u1EDDng d\xF9ng.
 */
@Component({
  selector: 'detail-side-drawer',
  standalone: true,
  imports: [RouterLink, SdSideDrawer, SdBadge, SdButton, SdPermissionDirective, GeneralInformationViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @let customer = entity();
    <sd-side-drawer width="600px" autoId="customer-detail" (sdClosed)="closed()">
      <div sdHeaderLeft class="d-flex flex-column">
        <div class="d-flex align-items-center gap-8">
          <span class="T16M">Chi ti\u1EBFt kh\xE1ch h\xE0ng #{{ customer.code }}</span>
          <sd-badge size="md" [type]="badge().type ?? 'round'" [title]="badge().title" [color]="badge().color" />
        </div>
        <span class="T14R text-secondary">{{ typeName() }} \xB7 {{ customer.phone }}</span>
      </div>
      <sd-button
        sdHeaderRight
        *sdPermission="'PATTERN_CUSTOMER_D_DELETE'"
        prefixIcon="delete"
        tooltip="Xo\xE1 kh\xE1ch h\xE0ng"
        type="text"
        color="error"
        autoId="customer-delete"
        [loading]="deleting()"
        (click)="delete()" />
      <general-information-view [customer]="customer" />
      <div sdFooterRight class="d-flex align-items-center gap-8">
        <sd-button title="H\u1ED3 s\u01A1 360\xB0" prefixIcon="contact_page" type="outline" autoId="customer-profile" [routerLink]="['../360']" />
        <sd-button
          *sdPermission="'PATTERN_CUSTOMER_U_UPDATE'"
          title="C\u1EADp nh\u1EADt kh\xE1ch h\xE0ng"
          prefixIcon="edit"
          type="fill"
          color="primary"
          autoId="customer-update"
          [routerLink]="['../update']" />
      </div>
    </sd-side-drawer>
  \`,
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
    // X, Esc, backdrop \u0111\u1EC1u qua sdClosed; v\u1EC1 danh s\xE1ch b\u1EB1ng \u0111i\u1EC1u h\u01B0\u1EDBng \u0111\u1EC3 Back c\u1EE7a tr\xECnh duy\u1EC7t c\u0169ng \u0111\xF3ng \u0111\u01B0\u1EE3c.
    // Sang drawer c\u1EADp nh\u1EADt hay h\u1ED3 s\u01A1 360\xB0 th\xEC drawer n\xE0y b\u1ECB hu\u1EF7 c\xF9ng route, kh\xF4ng ph\xE1t sdClosed.
    void this.#router.navigate(['../..'], { relativeTo: this.#route });
  }

  protected async delete(): Promise<void> {
    const customer = this.entity();
    try {
      await this.#confirm.confirm(\`Xo\xE1 kh\xE1ch h\xE0ng \${customer.name}? Thao t\xE1c kh\xF4ng ho\xE0n t\xE1c \u0111\u01B0\u1EE3c.\`, {
        title: 'Xo\xE1 kh\xE1ch h\xE0ng',
        yesTitle: 'Xo\xE1',
        noTitle: 'Kh\xF4ng xo\xE1',
        yesButtonColor: 'error',
      });
    } catch {
      return;
    }
    this.deleting.set(true);
    try {
      await firstValueFrom(this.#customerService.delete(customer.id));
      this.#notify.success(\`\u0110\xE3 xo\xE1 kh\xE1ch h\xE0ng \${customer.name}.\`);
      this.drawer().close();
    } catch (error) {
      this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng xo\xE1 \u0111\u01B0\u1EE3c kh\xE1ch h\xE0ng.'));
    } finally {
      this.deleting.set(false);
    }
  }
}
`,"features/customer/components/documents-view/documents-view.component.ts":`import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { CustomerService } from '../../services/customer.service';
import type { CustomerDocumentDto } from '../../services/customer.model';

/** Tab T\xE0i li\u1EC7u c\u1EE7a h\u1ED3 s\u01A1 360\xB0: danh s\xE1ch ng\u1EAFn, tr\u1EA1ng th\xE1i ri\xEAng b\u1EB1ng \`sd-data-state\`. */
@Component({
  selector: 'documents-view',
  standalone: true,
  imports: [SdDataState, SdSection, SdSectionItem, SdFormatNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-data-state
      [state]="state()"
      retryable
      title=""
      [message]="state() === 'empty' ? 'Kh\xE1ch h\xE0ng ch\u01B0a c\xF3 t\xE0i li\u1EC7u.' : undefined"
      (sdRetry)="load()">
      <sd-section title="T\xE0i li\u1EC7u">
        @for (document of documents(); track document.id) {
          <sd-section-item [label]="document.name">{{ document.size / 1024 | sdFormatNumber: 0 }} KB</sd-section-item>
        }
      </sd-section>
    </sd-data-state>
  \`,
})
export class DocumentsViewComponent implements OnInit {
  readonly #customerService = inject(CustomerService);
  readonly customerId = input.required<string>();
  protected readonly state = signal<'loading' | 'empty' | 'error' | 'success'>('loading');
  protected readonly documents = signal<readonly CustomerDocumentDto[]>([]);

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.state.set('loading');
    try {
      const res = await firstValueFrom(this.#customerService.documents(this.customerId()));
      this.documents.set(res.items);
      this.state.set(res.items.length ? 'success' : 'empty');
    } catch {
      this.state.set('error');
    }
  }
}
`,"features/customer/components/general-information-form/general-information-form.component.ts":`import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import type { FormControl, FormGroup } from '@angular/forms';
import { SdInform } from '@sdcorejs/angular/components/inform';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdSwitch } from '@sdcorejs/angular/forms/switch';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import type { CustomerSaveReq, CustomerStatus, CustomerTier, CustomerType } from '../../services/customer.model';
import { CustomerTypeSelectComponent } from '../customer-type-select/customer-type-select.component';

/** C\xE1c field Core t\u1EF1 \u0111\u0103ng k\xFD control qua \`[form]\` + \`name\`. */
export type CustomerForm = FormGroup<{
  name?: FormControl<string>;
  type?: FormControl<CustomerType>;
  taxCode?: FormControl<string | null>;
  vip?: FormControl<boolean>;
  email?: FormControl<string>;
  phone?: FormControl<string>;
  address?: FormControl<string>;
  active?: FormControl<boolean>;
  note?: FormControl<string | null>;
}>;

/** Ba nh\xF3m c\u1EE7a form; nh\xF3m c\xF2n l\u1ED7i sau khi b\u1EA5m L\u01B0u hi\u1EC7n \`sd-inform\` c\u1EA3nh b\xE1o ngay trong nh\xF3m. */
export type CustomerFormGroup = 'general' | 'contact' | 'other';

const GROUP_FIELDS: Readonly<Record<CustomerFormGroup, readonly string[]>> = {
  general: ['name', 'type', 'taxCode', 'vip'],
  contact: ['email', 'phone', 'address'],
  other: ['active', 'note'],
};

/** Nh\xF3m c\xF3 field kh\xF4ng h\u1EE3p l\u1EC7: field c\xF2n l\u1ED7i validate ho\u1EB7c l\u1ED7i do API tr\u1EA3 v\u1EC1. */
export function invalidCustomerGroups(form: CustomerForm, apiErrors: Readonly<Record<string, string>>): CustomerFormGroup[] {
  return (Object.keys(GROUP_FIELDS) as CustomerFormGroup[]).filter(group =>
    GROUP_FIELDS[group].some(field => form.get(field)?.invalid || !!apiErrors[field])
  );
}

/** Gi\xE1 tr\u1ECB form \u2192 request l\u01B0u. */
export function customerSaveReq(form: CustomerForm): CustomerSaveReq {
  const value = form.getRawValue();
  const type: CustomerType = value.type ?? 'individual';
  const tier: CustomerTier = value.vip ? 'vip' : 'standard';
  const status: CustomerStatus = value.active === false ? 'inactive' : 'active';
  return {
    name: value.name ?? '',
    type,
    tier,
    email: value.email ?? '',
    phone: value.phone ?? '',
    address: value.address ?? '',
    taxCode: type === 'business' ? (value.taxCode ?? null) : null,
    status,
    note: value.note || null,
  };
}

/** Form kh\xE1ch h\xE0ng ba nh\xF3m, d\xF9ng chung cho drawer t\u1EA1o m\u1EDBi v\xE0 c\u1EADp nh\u1EADt. */
@Component({
  selector: 'general-information-form',
  standalone: true,
  imports: [SdSection, SdInput, SdTextarea, SdSwitch, SdInform, CustomerTypeSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @let invalid = invalidGroups();
    <div class="d-flex flex-column gap-16">
      <sd-section title="Th\xF4ng tin chung">
        <div class="d-flex flex-column gap-8 p-16">
          @if (invalid.includes('general')) {
            <sd-inform warning description="Ki\u1EC3m tra t\xEAn v\xE0 lo\u1EA1i kh\xE1ch h\xE0ng." autoId="customer-general-warning" />
          }
          <sd-input
            label="T\xEAn kh\xE1ch h\xE0ng"
            name="name"
            autoId="customer-name"
            [form]="form()"
            [model]="seed().name"
            [inlineError]="errors()['name']"
            maxlength="120"
            required />
          <customer-type-select [form]="form()" [model]="seed().type" (modelChange)="type.set($event ?? 'individual')" />
          @if (type() === 'business') {
            <sd-input
              label="M\xE3 s\u1ED1 thu\u1EBF"
              name="taxCode"
              autoId="customer-tax-code"
              [form]="form()"
              [model]="seed().taxCode"
              [inlineError]="errors()['taxCode']"
              maxlength="14"
              required />
          }
          <sd-switch label="Kh\xE1ch VIP" name="vip" [form]="form()" [model]="seed().tier === 'vip'" />
        </div>
      </sd-section>
      <sd-section title="Li\xEAn h\u1EC7">
        <div class="d-flex flex-column gap-8 p-16">
          @if (invalid.includes('contact')) {
            <sd-inform warning description="Ki\u1EC3m tra email v\xE0 s\u1ED1 \u0111i\u1EC7n tho\u1EA1i." autoId="customer-contact-warning" />
          }
          <sd-input
            label="Email"
            name="email"
            autoId="customer-email"
            [form]="form()"
            [model]="seed().email"
            [inlineError]="errors()['email']"
            pattern="EMAIL"
            required />
          <sd-input
            label="\u0110i\u1EC7n tho\u1EA1i"
            name="phone"
            autoId="customer-phone"
            [form]="form()"
            [model]="seed().phone"
            [inlineError]="errors()['phone']"
            maxlength="15"
            required />
          <sd-input label="\u0110\u1ECBa ch\u1EC9" name="address" autoId="customer-address" [form]="form()" [model]="seed().address" maxlength="200" />
        </div>
      </sd-section>
      <sd-section title="Kh\xE1c">
        <div class="d-flex flex-column gap-8 p-16">
          <sd-switch label="\u0110ang ho\u1EA1t \u0111\u1ED9ng" name="active" [form]="form()" [model]="seed().status !== 'inactive'" />
          <sd-textarea label="Ghi ch\xFA" name="note" [form]="form()" [model]="seed().note" maxlength="500" />
        </div>
      </sd-section>
    </div>
  \`,
})
export class GeneralInformationFormComponent {
  readonly form = input.required<CustomerForm>();
  readonly seed = input.required<CustomerSaveReq>();
  /** L\u1ED7i theo field do API tr\u1EA3 v\u1EC1. */
  readonly errors = input<Readonly<Record<string, string>>>({});
  readonly invalidGroups = input<readonly CustomerFormGroup[]>([]);
  /** Lo\u1EA1i kh\xE1ch \u0111ang ch\u1ECDn: doanh nghi\u1EC7p m\u1EDBi c\xF3 m\xE3 s\u1ED1 thu\u1EBF. */
  protected readonly type = linkedSignal(() => this.seed().type);
}
`,"features/customer/components/general-information-view/general-information-view.component.ts":`import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdEmptyPipe, SdFormatDatePipe, SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { customerTypeName, type CustomerDto } from '../../services/customer.model';

/** Th\xF4ng tin kh\xE1ch h\xE0ng d\u1EA1ng h\xE0ng \`sd-section-item\`: nh\xE3n b\xEAn tr\xE1i, gi\xE1 tr\u1ECB b\xEAn ph\u1EA3i. */
@Component({
  selector: 'general-information-view',
  standalone: true,
  imports: [SdSection, SdSectionItem, SdEmptyPipe, SdFormatDatePipe, SdFormatNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @let item = customer();
    <div class="d-flex flex-column gap-16">
      <sd-section title="Th\xF4ng tin chung">
        <sd-section-item label="M\xE3 kh\xE1ch h\xE0ng">{{ item.code }}</sd-section-item>
        <sd-section-item label="T\xEAn kh\xE1ch h\xE0ng">{{ item.name }}</sd-section-item>
        <sd-section-item label="Lo\u1EA1i kh\xE1ch h\xE0ng">{{ typeName() }}{{ item.tier === 'vip' ? ' \xB7 VIP' : '' }}</sd-section-item>
        @if (item.type === 'business') {
          <sd-section-item label="M\xE3 s\u1ED1 thu\u1EBF">{{ item.taxCode | sdEmpty }}</sd-section-item>
        }
        <sd-section-item label="Ng\xE0y t\u1EA1o">{{ item.createdAt | sdFormatDate }}</sd-section-item>
      </sd-section>
      <sd-section title="Li\xEAn h\u1EC7">
        <sd-section-item label="Email">{{ item.email }}</sd-section-item>
        <sd-section-item label="\u0110i\u1EC7n tho\u1EA1i">{{ item.phone }}</sd-section-item>
        <sd-section-item label="\u0110\u1ECBa ch\u1EC9">{{ item.address | sdEmpty }}</sd-section-item>
      </sd-section>
      <sd-section title="Kh\xE1c">
        <sd-section-item label="C\xF4ng n\u1EE3 (\u20AB)">{{ item.debt | sdFormatNumber: 0 }}</sd-section-item>
        <sd-section-item label="Ghi ch\xFA">{{ item.note | sdEmpty }}</sd-section-item>
      </sd-section>
    </div>
  \`,
})
export class GeneralInformationViewComponent {
  readonly customer = input.required<CustomerDto>();
  protected readonly typeName = computed(() => customerTypeName(this.customer().type));
}
`,"features/customer/components/orders-view/orders-view.component.ts":`import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { CustomerService } from '../../services/customer.service';
import type { CustomerOrderDto } from '../../services/customer.model';

/** Tab \u0110\u01A1n h\xE0ng c\u1EE7a h\u1ED3 s\u01A1 360\xB0: t\u1EA3i khi tab \u0111\u01B0\u1EE3c m\u1EDF l\u1EA7n \u0111\u1EA7u; b\u1EA3ng t\u1EF1 c\xF3 tr\u1EA1ng th\xE1i \u0111ang t\u1EA3i, r\u1ED7ng v\xE0 l\u1ED7i. */
@Component({
  selector: 'orders-view',
  standalone: true,
  imports: [RouterLink, SdTable, SdTableCellDefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-table autoId="customer-orders" [option]="option">
      <ng-template sdTableCellDef="code" let-order="item">
        <a [routerLink]="['../../../order', order.id, 'detail']">{{ order.code }}</a>
      </ng-template>
    </sd-table>
  \`,
})
export class OrdersViewComponent {
  readonly #customerService = inject(CustomerService);
  readonly customerId = input.required<string>();
  protected readonly option: SdTableOption<CustomerOrderDto> = {
    type: 'server',
    items: () => firstValueFrom(this.#customerService.orders(this.customerId())),
    paginate: { pageSize: 10 },
    columns: [
      { field: 'code', title: 'M\xE3 \u0111\u01A1n', type: 'string', width: '140px' },
      { field: 'createdAt', title: 'Ng\xE0y t\u1EA1o', type: 'date', width: '160px' },
      { field: 'total', title: 'T\u1ED5ng ti\u1EC1n (\u20AB)', type: 'number', align: 'right' },
    ],
  };
}
`,"features/customer/components/summary-cards/summary-cards.component.ts":`import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, model } from '@angular/core';
import { SdCard, SdCardGroup } from '@sdcorejs/angular/components/card';
import { SD_PAGE_LIST } from '@sdcorejs/angular/modules/layout';
import type { CustomerCounts, CustomerSegment } from '../../services/customer.model';

const CARDS: readonly { readonly key: 'all' | CustomerSegment; readonly label: string }[] = [
  { key: 'all', label: 'T\u1EA5t c\u1EA3 kh\xE1ch h\xE0ng' },
  { key: 'individual', label: 'C\xE1 nh\xE2n' },
  { key: 'business', label: 'Doanh nghi\u1EC7p' },
  { key: 'vip', label: 'Kh\xE1ch VIP' },
];

/**
 * Score card c\u1EE7a danh s\xE1ch kh\xE1ch h\xE0ng: m\u1ED7i th\u1EBB l\xE0 m\u1ED9t nh\xF3m kh\xE1ch v\xE0 l\xE0 b\u1ED9 l\u1ECDc c\u1EE7a danh s\xE1ch.
 * Khi \`sd-page-list\` thu g\u1ECDn (m\xE0n th\u1EA5p), c\xE1c th\u1EBB th\xE0nh m\u1ED9t d\xF2ng 36px.
 */
@Component({
  selector: 'summary-cards',
  standalone: true,
  imports: [SdCard, SdCardGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-card-group
      class="summary"
      autoId="customer-segments"
      aria-label="Nh\xF3m kh\xE1ch h\xE0ng"
      [class.summary--compact]="compact()"
      [(model)]="selected"
      (sdChange)="choose($event)">
      @for (card of cards(); track card.key) {
        <sd-card class="summary__card" [value]="card.key" [autoId]="'customer-segment-' + card.key">
          <span class="summary__label">{{ card.label }}</span>
          <strong class="summary__value">{{ card.value }}</strong>
        </sd-card>
      }
    </sd-card-group>
  \`,
  styles: \`
    .summary {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .summary__card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px 16px;
    }
    .summary__label {
      color: var(--sd-text-secondary);
      font-size: 13px;
    }
    .summary__value {
      font-size: 22px;
      line-height: 28px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
    .summary--compact {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 36px;
    }
    .summary--compact .summary__card {
      flex-direction: row;
      align-items: baseline;
      gap: 6px;
      padding: 4px 10px;
    }
    .summary--compact .summary__value {
      font-size: 14px;
      line-height: 20px;
    }
    @media (max-width: 767px) {
      .summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  \`,
})
export class SummaryCardsComponent {
  readonly #list = inject(SD_PAGE_LIST);
  readonly counts = input<CustomerCounts | null>(null);
  /** Nh\xF3m \u0111ang l\u1ECDc; \`null\` l\xE0 t\u1EA5t c\u1EA3. */
  readonly segment = model<CustomerSegment | null>(null);
  protected readonly compact = this.#list.compact;
  protected readonly selected = linkedSignal<'all' | CustomerSegment | null>(() => this.segment() ?? 'all');
  protected readonly cards = computed(() => {
    const counts = this.counts();
    return CARDS.map(card => ({ ...card, value: counts ? counts[card.key].toLocaleString('vi-VN') : '\u2026' }));
  });

  protected choose(key: unknown): void {
    // B\u1EA5m l\u1EA1i th\u1EBB \u0111ang ch\u1ECDn (model v\u1EC1 null) ho\u1EB7c th\u1EBB "T\u1EA5t c\u1EA3" \u0111\u1EC1u l\xE0 b\u1ECF l\u1ECDc.
    const segment = key === null || key === 'all' ? null : (key as CustomerSegment);
    this.selected.set(segment ?? 'all');
    this.segment.set(segment);
  }
}
`,"features/customer/components/update-side-drawer/update-side-drawer.component.ts":`import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import { CustomerService } from '../../services/customer.service';
import type { CustomerDto } from '../../services/customer.model';
import {
  customerSaveReq,
  GeneralInformationFormComponent,
  invalidCustomerGroups,
  type CustomerForm,
  type CustomerFormGroup,
} from '../general-information-form/general-information-form.component';

/**
 * C\u1EADp nh\u1EADt kh\xE1ch h\xE0ng trong drawer (route con \`:id/update\`). X, Esc v\xE0 backdrop \u0111i qua \`beforeClose\`: c\xF2n thay \u0111\u1ED5i
 * th\xEC h\u1ECFi tr\u01B0\u1EDBc khi b\u1ECF. L\u01B0u th\xE0nh c\xF4ng th\xEC \u0111\xF3ng drawer; danh s\xE1ch t\u1EA3i l\u1EA1i v\xE0 focus tr\u1EDF v\u1EC1 d\xF2ng \u0111\xE3 m\u1EDF.
 */
@Component({
  selector: 'update-side-drawer',
  standalone: true,
  imports: [SdSideDrawer, SdButton, GeneralInformationFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-side-drawer
      [title]="'C\u1EADp nh\u1EADt kh\xE1ch h\xE0ng #' + entity().code"
      width="600px"
      autoId="customer-update"
      [beforeClose]="beforeClose"
      (sdClosed)="closed()">
      <general-information-form [form]="form" [seed]="entity()" [errors]="apiErrors.errors()" [invalidGroups]="invalidGroups()" />
      <div sdFooterRight class="d-flex align-items-center gap-8">
        <sd-button title="L\u01B0u" prefixIcon="save" type="fill" color="primary" autoId="customer-save" [loading]="saving()" (click)="save()" />
      </div>
    </sd-side-drawer>
  \`,
})
export class UpdateSideDrawerComponent {
  readonly #customerService = inject(CustomerService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #injector = inject(Injector);
  private readonly drawer = viewChild.required(SdSideDrawer);
  // why: sd-side-drawer chuy\u1EC3n n\u1ED9i dung ra body, n\xEAn t\xECm field l\u1ED7i trong form ch\u1EE9 kh\xF4ng trong host c\u1EE7a component.
  private readonly formElement = viewChild.required(GeneralInformationFormComponent, { read: ElementRef });
  protected readonly entity = toSignal(this.#route.data.pipe(map(data => data['entity'] as CustomerDto)), { requireSync: true });
  protected readonly form: CustomerForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  protected readonly invalidGroups = signal<CustomerFormGroup[]>([]);
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'customer-update', dirty: 'value' });

  /** \u0110\xF3ng khi c\xF2n thay \u0111\u1ED5i ch\u01B0a l\u01B0u: h\u1ECFi, \u0111\u1ED3ng \xFD th\xEC b\u1ECF thay \u0111\u1ED5i (guard r\u1EDDi route kh\xF4ng h\u1ECFi l\u1EA1i). */
  protected readonly beforeClose = async (): Promise<boolean> => {
    if (!this.#unsaved.dirty() || this.saving()) return !this.saving();
    try {
      await this.#confirm.confirm('Thay \u0111\u1ED5i ch\u01B0a l\u01B0u s\u1EBD b\u1ECB m\u1EA5t.', {
        title: '\u0110\xF3ng khi ch\u01B0a l\u01B0u?',
        yesTitle: 'B\u1ECF thay \u0111\u1ED5i',
        noTitle: 'Ti\u1EBFp t\u1EE5c s\u1EEDa',
        yesButtonColor: 'warning',
      });
    } catch {
      return false;
    }
    this.#unsaved.markPristine();
    return true;
  };

  constructor() {
    afterNextRender(() => this.drawer().open());
    inject(DestroyRef).onDestroy(() => this.#unsaved.destroy());
  }

  protected closed(): void {
    void this.#router.navigate(['../..'], { relativeTo: this.#route });
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.#showErrors();
      return;
    }
    this.saving.set(true);
    try {
      await firstValueFrom(this.#customerService.update(this.entity().id, customerSaveReq(this.form)));
      this.#unsaved.markPristine();
      this.#notify.success('\u0110\xE3 c\u1EADp nh\u1EADt kh\xE1ch h\xE0ng.');
      this.saving.set(false);
      this.drawer().close();
    } catch (error) {
      if (this.apiErrors.set(error)) this.#showErrors();
      else this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng th\u1EC3 l\u01B0u. D\u1EEF li\u1EC7u \u0111\xE3 nh\u1EADp v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF.'));
    } finally {
      this.saving.set(false);
    }
  }

  /** \`sd-inform\` trong t\u1EEBng nh\xF3m c\xF3 l\u1ED7i, r\u1ED3i focus field l\u1ED7i \u0111\u1EA7u ti\xEAn. */
  #showErrors(): void {
    this.invalidGroups.set(invalidCustomerGroups(this.form, this.apiErrors.errors()));
    afterNextRender(() => focusFirstInvalid(this.formElement().nativeElement), { injector: this.#injector });
  }
}
`,"features/customer/entity.resolver.ts":`import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { map, timeout } from 'rxjs';
import { CustomerService } from './services/customer.service';
import type { CustomerDto } from './services/customer.model';

/** T\u1EA3i kh\xE1ch h\xE0ng b\u1EB1ng \`detail(id)\` tr\u01B0\u1EDBc khi m\u1EDF drawer/trang; l\u1ED7i \u0111i t\u1EDBi navigation error handler c\u1EE7a host. */
export const entityResolver: ResolveFn<CustomerDto> = route => {
  const id = route.paramMap.get('id');
  if (!id?.trim()) throw new HttpErrorResponse({ status: 404 });
  return inject(CustomerService)
    .detail(id)
    .pipe(
      timeout(10_000),
      map(entity => {
        if (!entity || entity.id !== id) throw new HttpErrorResponse({ status: 404 });
        return entity;
      })
    );
};
`,"features/customer/pages/list/list.component.html":`<sd-page-list title="Kh\xE1ch h\xE0ng" description="Kh\xE1ch c\xE1 nh\xE2n v\xE0 doanh nghi\u1EC7p \u0111ang giao d\u1ECBch." [detail]="detailMode()">
  <sd-button
    headerRight
    *sdPermission="'PATTERN_CUSTOMER_C_CREATE'"
    title="T\u1EA1o kh\xE1ch h\xE0ng"
    prefixIcon="add"
    type="fill"
    color="primary"
    autoId="customer-create"
    [routerLink]="['create']" />

  <summary-cards [counts]="counts()" [(segment)]="segment" />

  <sd-table autoId="customer-list" [option]="tableOption">
    <ng-template sdTableCellDef="code" let-customer="item">
      <a *sdPermission="'PATTERN_CUSTOMER_R_DETAIL'" [routerLink]="[customer.id, 'detail']">{{ customer.code }}</a>
      @if (!canOpenDetail) {
        <span>{{ customer.code }}</span>
      }
    </ng-template>
  </sd-table>
</sd-page-list>
`,"features/customer/pages/list/list.component.ts":`import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, firstValueFrom, map, startWith } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdPageList, type SdPageListDetail } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import type { Filter } from '@sdcorejs/utils/models';
import { SummaryCardsComponent } from '../../components/summary-cards/summary-cards.component';
import { CustomerService } from '../../services/customer.service';
import {
  CUSTOMER_STATUS_OPTIONS,
  CUSTOMER_TYPE_OPTIONS,
  customerStatusBadge,
  type CustomerCounts,
  type CustomerDto,
  type CustomerSegment,
} from '../../services/customer.model';

/** \u0110i\u1EC1u ki\u1EC7n c\u1EE7a nh\xF3m kh\xE1ch \u0111ang ch\u1ECDn tr\xEAn score card. */
const SEGMENT_FILTER: Readonly<Record<CustomerSegment, Filter<CustomerDto>>> = {
  individual: { field: 'type', operator: 'EQUAL', data: 'individual' },
  business: { field: 'type', operator: 'EQUAL', data: 'business' },
  vip: { field: 'tier', operator: 'EQUAL', data: 'vip' },
};

@Component({
  selector: 'list',
  standalone: true,
  templateUrl: './list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SdPageList, SdButton, SdTable, SdTableCellDefDirective, SdPermissionDirective, SummaryCardsComponent],
})
export class ListComponent {
  readonly #customerService = inject(CustomerService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  private readonly pageList = viewChild.required(SdPageList);
  private readonly table = viewChild.required(SdTable);
  protected readonly canOpenDetail = inject(SdPermissionService).hasPermission('PATTERN_CUSTOMER_R_DETAIL');

  /** M\u1ED9t state cho score card v\xE0 request: \u0111\u1ED5i nh\xF3m th\xEC \u0111\u1ECDc l\u1EA1i t\u1EEB trang 1. */
  protected readonly segment = signal<CustomerSegment | null>(null);
  protected readonly counts = signal<CustomerCounts | null>(null);
  /** Detail, create, update m\u1EDF trong drawer; h\u1ED3 s\u01A1 360\xB0 (\`data.detail: 'page'\`) thay ch\u1ED7 danh s\xE1ch. */
  protected readonly detailMode = toSignal(
    this.#router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map((): SdPageListDetail => (this.#route.firstChild?.snapshot.data['detail'] === 'page' ? 'page' : 'drawer'))
    ),
    { requireSync: true }
  );

  protected readonly tableOption: SdTableOption<CustomerDto> = {
    type: 'server',
    rowKey: 'id',
    items: async (_, req) => {
      const segment = untracked(this.segment);
      // S\u1ED1 tr\xEAn th\u1EBB theo c\xF9ng b\u1ED9 l\u1ECDc c\u1EE7a b\u1EA3ng, ch\u01B0a t\xEDnh nh\xF3m \u0111ang ch\u1ECDn.
      void firstValueFrom(this.#customerService.counts(req.filters ?? [])).then(counts => this.counts.set(counts));
      const filters = segment ? [...(req.filters ?? []), SEGMENT_FILTER[segment]] : req.filters;
      return firstValueFrom(this.#customerService.list({ ...req, filters }));
    },
    sort: { enable: true },
    filter: {
      quickSearch: { containFields: ['code', 'name', 'phone'], placeholder: 'T\xECm theo m\xE3, t\xEAn ho\u1EB7c s\u1ED1 \u0111i\u1EC7n tho\u1EA1i' },
    },
    columns: [
      { field: 'code', title: 'M\xE3 kh\xE1ch h\xE0ng', type: 'string', width: '150px', sortable: true },
      { field: 'name', title: 'T\xEAn kh\xE1ch h\xE0ng', type: 'string', minWidth: '220px', sortable: true },
      {
        field: 'type',
        title: 'Lo\u1EA1i',
        type: 'values',
        width: '140px',
        option: { items: CUSTOMER_TYPE_OPTIONS, valueField: 'id', displayField: 'name' },
        // Score card l\xE0 ch\u1ED7 l\u1ECDc theo lo\u1EA1i kh\xE1ch: m\u1ED7i field ch\u1EC9 m\u1ED9t ch\u1ED7 l\u1ECDc (E6).
        filter: { disabled: true },
      },
      { field: 'phone', title: '\u0110i\u1EC7n tho\u1EA1i', type: 'string', width: '140px' },
      { field: 'email', title: 'Email', type: 'string', minWidth: '200px' },
      { field: 'debt', title: 'C\xF4ng n\u1EE3 (\u20AB)', type: 'number', width: '150px', align: 'right', sortable: true },
      {
        field: 'status',
        title: 'Tr\u1EA1ng th\xE1i',
        type: 'values',
        width: '170px',
        option: { items: CUSTOMER_STATUS_OPTIONS, valueField: 'id', displayField: 'name' },
        useBadge: status => customerStatusBadge(status),
      },
    ],
  };

  constructor() {
    let segment = this.segment();
    effect(() => {
      const next = this.segment();
      if (next === segment) return;
      segment = next;
      untracked(() => void this.table().reloadFirstPage());
    });
    // Ch\u1EC9 t\u1EA3i l\u1EA1i danh s\xE1ch khi drawer/trang con \u0111\xE3 l\u01B0u th\xE0nh c\xF4ng, kh\xF4ng ph\u1EA3i m\u1ED7i l\u1EA7n \u0111\xF3ng.
    let changes = this.#customerService.changes();
    effect(() => {
      const next = this.#customerService.changes();
      if (this.pageList().childActive() || next === changes) return;
      changes = next;
      untracked(() => void this.table().reload(true, false));
    });
  }
}
`,"features/customer/pages/profile/profile.component.ts":`import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, untracked } from '@angular/core';
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
  { key: 'info', label: 'Th\xF4ng tin' },
  { key: 'orders', label: '\u0110\u01A1n h\xE0ng' },
  { key: 'debts', label: 'C\xF4ng n\u1EE3' },
  { key: 'documents', label: 'T\xE0i li\u1EC7u' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

/**
 * H\u1ED3 s\u01A1 360\xB0 (\`:id/360\`): th\xF4ng tin chung v\xE0 c\xE1c quan h\u1EC7 c\u1EE7a kh\xE1ch h\xE0ng theo tab. Tab ghi tr\xEAn URL (\`?tab=\`);
 * m\u1EDF tab n\xE0o m\u1EDBi t\u1EA3i tab \u0111\xF3, m\u1ED7i tab t\u1EF1 c\xF3 tr\u1EA1ng th\xE1i \u0111ang t\u1EA3i, r\u1ED7ng v\xE0 l\u1ED7i.
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
  template: \`
    @let customer = entity();
    <sd-page-detail
      [title]="'H\u1ED3 s\u01A1 kh\xE1ch h\xE0ng #' + customer.code"
      [description]="customer.name + ' \xB7 ' + typeName()"
      [badges]="badges()"
      [backLink]="['../..']">
      <sd-button
        headerRight
        *sdPermission="'PATTERN_CUSTOMER_U_UPDATE'"
        title="C\u1EADp nh\u1EADt kh\xE1ch h\xE0ng"
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
  \`,
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
  /** Tab \u0111\xE3 m\u1EDF \xEDt nh\u1EA5t m\u1ED9t l\u1EA7n: gi\u1EEF l\u1EA1i khi chuy\u1EC3n tab, kh\xF4ng t\u1EA3i l\u1EA1i. \u0110\u1ED5i kh\xE1ch h\xE0ng th\xEC b\u1EAFt \u0111\u1EA7u l\u1EA1i. */
  protected readonly opened = linkedSignal<CustomerDto, ReadonlySet<TabKey>>({
    source: this.entity,
    // untracked: \u0111\u1ED5i tab kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EB7t l\u1EA1i c\xE1c tab \u0111\xE3 m\u1EDF; ch\u1EC9 \u0111\u1ED5i kh\xE1ch h\xE0ng m\u1EDBi b\u1EAFt \u0111\u1EA7u l\u1EA1i.
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
`,"features/customer/pipes/customer-detail.pipe.ts":`import { inject, Pipe, type PipeTransform } from '@angular/core';
import { of, type Observable } from 'rxjs';
import { CustomerService } from '../services/customer.service';
import type { CustomerDto } from '../services/customer.model';

/**
 * Relation kh\xE1ch h\xE0ng theo ID: \`@let customer = order.customerId | customerDetail | async;\`.
 * CustomerService cache v\xE0 chia s\u1EBB request theo ID; n\u01A1i d\xF9ng pipe ph\u1EA3i c\xF3 CustomerService trong injector.
 */
@Pipe({ name: 'customerDetail', standalone: true })
export class CustomerDetailPipe implements PipeTransform {
  readonly #customerService = inject(CustomerService);

  transform(id: CustomerDto['id'] | null | undefined): Observable<CustomerDto | null> {
    if (id === null || id === undefined || id === '') return of(null);
    return this.#customerService.cachedDetail(id);
  }
}
`,"features/customer/routes.ts":`import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { entityResolver } from './entity.resolver';
import { CustomerService } from './services/customer.service';

/**
 * Chi ti\u1EBFt, t\u1EA1o v\xE0 c\u1EADp nh\u1EADt m\u1EDF trong drawer (route con c\u1EE7a danh s\xE1ch); h\u1ED3 s\u01A1 360\xB0 l\xE0 trang thay ch\u1ED7 danh s\xE1ch
 * (\`data.detail: 'page'\`). \u0110\xF3ng drawer hay quay l\u1EA1i \u0111\u1EC1u gi\u1EEF b\u1ED9 l\u1ECDc, trang v\xE0 v\u1ECB tr\xED cu\u1ED9n c\u1EE7a danh s\xE1ch.
 */
export const routes: Routes = [
  {
    path: '',
    providers: [CustomerService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: 'Kh\xE1ch h\xE0ng',
        data: { permission: 'PATTERN_CUSTOMER_R_LIST' },
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
        children: [
          {
            path: 'create',
            data: { permission: 'PATTERN_CUSTOMER_C_CREATE' },
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () =>
              import('./components/create-side-drawer/create-side-drawer.component').then(module => module.CreateSideDrawerComponent),
          },
          {
            path: ':id/detail',
            data: { permission: 'PATTERN_CUSTOMER_R_DETAIL' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () =>
              import('./components/detail-side-drawer/detail-side-drawer.component').then(module => module.DetailSideDrawerComponent),
          },
          {
            path: ':id/update',
            data: { permission: 'PATTERN_CUSTOMER_U_UPDATE' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () =>
              import('./components/update-side-drawer/update-side-drawer.component').then(module => module.UpdateSideDrawerComponent),
          },
          {
            path: ':id/360',
            title: 'H\u1ED3 s\u01A1 kh\xE1ch h\xE0ng',
            data: { permission: 'PATTERN_CUSTOMER_R_DETAIL', detail: 'page' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () => import('./pages/profile/profile.component').then(module => module.ProfileComponent),
          },
        ],
      },
    ],
  },
];
`,"features/customer/services/customer.model.ts":`import type { SdBadgeData } from '@sdcorejs/angular/components/badge';
import type { PagingReq, PagingRes } from '@sdcorejs/utils/models';

export type CustomerType = 'individual' | 'business';
export type CustomerTier = 'standard' | 'vip';
export type CustomerStatus = 'active' | 'inactive';

export const CUSTOMER_TYPE_OPTIONS = [
  { id: 'individual', name: 'C\xE1 nh\xE2n' },
  { id: 'business', name: 'Doanh nghi\u1EC7p' },
] satisfies { id: CustomerType; name: string }[];

export const CUSTOMER_STATUS_OPTIONS = [
  { id: 'active', name: '\u0110ang ho\u1EA1t \u0111\u1ED9ng', color: 'success' },
  { id: 'inactive', name: 'Ng\u1EEBng ho\u1EA1t \u0111\u1ED9ng', color: 'secondary' },
] satisfies { id: CustomerStatus; name: string; color: SdBadgeData['color'] }[];

/** Nh\xF3m kh\xE1ch c\u1EE7a score card; \`null\` l\xE0 t\u1EA5t c\u1EA3. */
export type CustomerSegment = 'individual' | 'business' | 'vip';

export interface CustomerDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly type: CustomerType;
  readonly tier: CustomerTier;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly taxCode: string | null;
  readonly status: CustomerStatus;
  /** C\xF4ng n\u1EE3 hi\u1EC7n t\u1EA1i (\u20AB). */
  readonly debt: number;
  readonly createdAt: string;
  readonly note: string | null;
}

export type CustomerListReq = PagingReq<CustomerDto>;
export type CustomerListRes = PagingRes<CustomerDto>;

/** S\u1ED1 kh\xE1ch theo nh\xF3m, c\xF9ng b\u1ED9 l\u1ECDc v\u1EDBi danh s\xE1ch (tr\u1EEB nh\xF3m \u0111ang ch\u1ECDn). */
export type CustomerCounts = Record<'all' | CustomerSegment, number>;

export interface CustomerSaveReq {
  readonly name: string;
  readonly type: CustomerType;
  readonly tier: CustomerTier;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly taxCode: string | null;
  readonly status: CustomerStatus;
  readonly note: string | null;
}

/** D\xF2ng c\u1EE7a tab \u0110\u01A1n h\xE0ng trong h\u1ED3 s\u01A1 360\xB0. */
export interface CustomerOrderDto {
  readonly id: string;
  readonly code: string;
  readonly createdAt: string;
  readonly total: number;
  readonly status: string;
}

/** D\xF2ng c\u1EE7a tab C\xF4ng n\u1EE3. */
export interface CustomerDebtDto {
  readonly id: string;
  readonly orderCode: string;
  readonly dueDate: string;
  readonly amount: number;
}

/** D\xF2ng c\u1EE7a tab T\xE0i li\u1EC7u. */
export interface CustomerDocumentDto {
  readonly id: string;
  readonly name: string;
  readonly size: number;
}

export function customerStatusBadge(status: CustomerStatus): SdBadgeData {
  const option = CUSTOMER_STATUS_OPTIONS.find(item => item.id === status);
  return { type: 'round', title: option?.name ?? status, color: option?.color };
}

export function customerTypeName(type: CustomerType): string {
  return CUSTOMER_TYPE_OPTIONS.find(item => item.id === type)?.name ?? type;
}
`,"features/customer/services/customer.service.ts":`import { HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { shareReplay, tap, type Observable } from 'rxjs';
import type { Filter, PagingRes } from '@sdcorejs/utils/models';
import { BaseApiService } from '../../../services/base-api.service';
import type {
  CustomerCounts,
  CustomerDebtDto,
  CustomerDocumentDto,
  CustomerDto,
  CustomerListReq,
  CustomerListRes,
  CustomerOrderDto,
  CustomerSaveReq,
} from './customer.model';

@Injectable()
export class CustomerService extends BaseApiService {
  readonly #details = new Map<string, Observable<CustomerDto>>();
  readonly #changes = signal(0);
  /** T\u0103ng sau m\u1ED7i l\u1EA7n t\u1EA1o, c\u1EADp nh\u1EADt ho\u1EB7c xo\xE1 th\xE0nh c\xF4ng: danh s\xE1ch ch\u1EC9 t\u1EA3i l\u1EA1i khi c\xF3 thay \u0111\u1ED5i. */
  readonly changes = this.#changes.asReadonly();

  list(req: CustomerListReq): Observable<CustomerListRes> {
    return this.http.get<CustomerListRes>(this.apiUrl('customers'), { params: this.buildPagingReq(req) });
  }

  /** S\u1ED1 kh\xE1ch theo nh\xF3m cho score card, theo c\xF9ng b\u1ED9 l\u1ECDc c\u1EE7a danh s\xE1ch. */
  counts(filters: Filter<CustomerDto>[]): Observable<CustomerCounts> {
    return this.http.get<CustomerCounts>(this.apiUrl('customers', 'counts'), {
      params: new HttpParams().set('filters', JSON.stringify(filters)),
    });
  }

  detail(id: string): Observable<CustomerDto> {
    return this.http.get<CustomerDto>(this.apiUrl('customers', id));
  }

  /** \`detail(id)\` c\xF3 cache, cho relation (\`customerDetail\`) v\xE0 gi\xE1 tr\u1ECB \u0111\xE3 ch\u1ECDn c\u1EE7a \`customer-select\`. */
  cachedDetail(id: string): Observable<CustomerDto> {
    let detail = this.#details.get(id);
    if (!detail) {
      detail = this.detail(id).pipe(shareReplay({ bufferSize: 1, refCount: false }));
      this.#details.set(id, detail);
      // L\u1ED7i tra c\u1EE9u kh\xF4ng \u0111\u01B0\u1EE3c cache: l\u1EA7n g\u1ECDi sau h\u1ECFi l\u1EA1i.
      detail.subscribe({ error: () => this.#details.delete(id) });
    }
    return detail;
  }

  create(req: CustomerSaveReq): Observable<CustomerDto> {
    return this.http.post<CustomerDto>(this.apiUrl('customers'), req).pipe(tap(() => this.#changed()));
  }

  update(id: string, req: CustomerSaveReq): Observable<CustomerDto> {
    return this.http.put<CustomerDto>(this.apiUrl('customers', id), req).pipe(tap(() => this.#changed(id)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(this.apiUrl('customers', id)).pipe(tap(() => this.#changed(id)));
  }

  orders(id: string): Observable<PagingRes<CustomerOrderDto>> {
    return this.http.get<PagingRes<CustomerOrderDto>>(this.apiUrl('customers', id, 'orders'));
  }

  debts(id: string): Observable<PagingRes<CustomerDebtDto>> {
    return this.http.get<PagingRes<CustomerDebtDto>>(this.apiUrl('customers', id, 'debts'));
  }

  documents(id: string): Observable<PagingRes<CustomerDocumentDto>> {
    return this.http.get<PagingRes<CustomerDocumentDto>>(this.apiUrl('customers', id, 'documents'));
  }

  #changed(id?: string): void {
    if (id) this.#details.delete(id);
    this.#changes.update(count => count + 1);
  }
}
`,"features/import/components/mapping-form/mapping-form.component.ts":`import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { IMPORT_FIELDS, type ImportField, type ImportMapping } from '../../services/import.model';

/** B\u01B0\u1EDBc "Nh\u1EADn di\u1EC7n & \xE1nh x\u1EA1": ch\u1ECDn c\u1ED9t c\u1EE7a ngu\u1ED3n cho t\u1EEBng field; m\xE3 v\xE0 t\xEAn l\xE0 b\u1EAFt bu\u1ED9c. */
@Component({
  selector: 'mapping-form',
  standalone: true,
  imports: [SdSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <div class="d-flex flex-column gap-8">
      @for (item of fields; track item.field) {
        <sd-select
          [label]="item.label"
          [items]="columns()"
          valueField="value"
          displayField="value"
          [required]="item.required"
          [autoId]="'import-map-' + item.field"
          [model]="mapping()[item.field]"
          [inlineError]="
            item.required && showErrors() && !mapping()[item.field] ? 'Ch\u1ECDn c\u1ED9t cho ' + item.label.toLowerCase() + '.' : undefined
          "
          (modelChange)="change(item.field, $event)" />
      }
    </div>
  \`,
})
export class MappingFormComponent {
  readonly sourceColumns = input.required<readonly string[]>();
  readonly mapping = input.required<ImportMapping>();
  readonly showErrors = input(false);
  readonly mappingChange = output<ImportMapping>();
  protected readonly fields = IMPORT_FIELDS;
  protected readonly columns = computed(() => this.sourceColumns().map(value => ({ value })));

  protected change(field: ImportField, value: unknown): void {
    this.mappingChange.emit({ ...this.mapping(), [field]: typeof value === 'string' && value ? value : null });
  }
}
`,"features/import/components/preview-view/preview-view.component.ts":`import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SdTable, type SdTableOption } from '@sdcorejs/angular/components/table';
import type { ImportPreviewRowDto } from '../../services/import.model';

const RESULTS = [
  { id: 'new', name: 'Th\xEAm m\u1EDBi', color: 'success' },
  { id: 'duplicate', name: 'Tr\xF9ng m\xE3', color: 'warning' },
  { id: 'invalid', name: 'L\u1ED7i', color: 'error' },
] as const;

/** B\u01B0\u1EDBc "Xem tr\u01B0\u1EDBc & xung \u0111\u1ED9t": t\u1EEBng d\xF2ng v\u1EDBi k\u1EBFt qu\u1EA3 ki\u1EC3m tra c\u1EE7a API. */
@Component({
  selector: 'preview-view',
  standalone: true,
  imports: [SdTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<sd-table autoId="import-preview" [option]="option()" />\`,
})
export class PreviewViewComponent {
  readonly rows = input.required<readonly ImportPreviewRowDto[]>();
  protected readonly option = computed<SdTableOption<ImportPreviewRowDto>>(() => {
    const rows = [...this.rows()];
    return {
      type: 'local',
      items: () => rows,
      paginate: { pageSize: 50 },
      filter: { hideInlineFilter: 'auto' },
      columns: [
        { field: 'code', title: 'M\xE3', type: 'string', width: '110px' },
        { field: 'name', title: 'T\xEAn s\u1EA3n ph\u1EA9m', type: 'string', minWidth: '180px' },
        { field: 'price', title: 'Gi\xE1 b\xE1n (\u20AB)', type: 'number', width: '120px', align: 'right' },
        {
          field: 'result',
          title: 'K\u1EBFt qu\u1EA3',
          type: 'values',
          width: '130px',
          option: { items: [...RESULTS], valueField: 'id', displayField: 'name' },
          useBadge: result => ({ type: 'round', color: RESULTS.find(item => item.id === result)?.color }),
        },
        { field: 'message', title: 'Ghi ch\xFA', type: 'string', minWidth: '160px' },
      ],
    };
  });
}
`,"features/import/pages/flow/flow.component.ts":`import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdInform } from '@sdcorejs/angular/components/inform';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdStep, SdStepper } from '@sdcorejs/angular/components/stepper';
import { SdSegmentedComponent, type SdSegmentedItem, type SdSegmentedModel } from '@sdcorejs/angular/forms/segmented';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage } from '../../../../utils/api-error';
import { MappingFormComponent } from '../../components/mapping-form/mapping-form.component';
import { PreviewViewComponent } from '../../components/preview-view/preview-view.component';
import { ImportService } from '../../services/import.service';
import {
  guessMapping,
  IMPORT_FIELDS,
  IMPORT_SAMPLE,
  parseCsv,
  type ImportCommitRes,
  type ImportDuplicatePolicy,
  type ImportMapping,
  type ImportPreviewRowDto,
} from '../../services/import.model';

const DUPLICATES: readonly SdSegmentedItem<ImportDuplicatePolicy>[] = [
  { value: 'skip', label: 'B\u1ECF qua d\xF2ng tr\xF9ng' },
  { value: 'overwrite', label: 'Ghi \u0111\xE8 s\u1EA3n ph\u1EA9m \u0111\xE3 c\xF3' },
];

/**
 * Pattern flow ngang: \`sd-page\` h\u1EB9p + \`sd-stepper\`, n\xFAt b\u01B0\u1EDBc \u1EDF footer. B\u1ED1n b\u01B0\u1EDBc gi\u1EEF d\u1EEF li\u1EC7u khi quay l\u1EA1i; m\u1ED7i b\u01B0\u1EDBc
 * ki\u1EC3m tra \u0111i\u1EC1u ki\u1EC7n c\u1EE7a ch\xEDnh n\xF3 tr\u01B0\u1EDBc khi sang b\u01B0\u1EDBc sau, b\u01B0\u1EDBc cu\u1ED1i m\u1EDBi ghi d\u1EEF li\u1EC7u.
 */
@Component({
  selector: 'flow',
  standalone: true,
  imports: [
    RouterLink,
    SdPageComponent,
    SdStepper,
    SdStep,
    SdButton,
    SdInform,
    SdSection,
    SdSectionItem,
    SdSegmentedComponent,
    SdTextarea,
    MappingFormComponent,
    PreviewViewComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-page title="Nh\u1EADp d\u1EEF li\u1EC7u s\u1EA3n ph\u1EA9m" description="Nh\u1EADp danh m\u1EE5c s\u1EA3n ph\u1EA9m t\u1EEB t\u1EC7p CSV." [backLink]="['..']" width="narrow">
      <sd-stepper linear [(selectedIndex)]="step" animationDuration="0ms" autoId="import-steps">
        <sd-step label="Ngu\u1ED3n d\u1EEF li\u1EC7u" [stepControl]="gates[0]">
          <div class="d-flex flex-column gap-8 py-16">
            <sd-inform type="tip" description="D\xE1n n\u1ED9i dung CSV c\xF3 d\xF2ng ti\xEAu \u0111\u1EC1, ho\u1EB7c d\xF9ng d\u1EEF li\u1EC7u m\u1EABu." />
            <sd-textarea
              label="N\u1ED9i dung CSV"
              name="source"
              autoId="import-source"
              [form]="sourceForm"
              [model]="source()"
              (modelChange)="editSource($event ?? '')"
              [inlineError]="showErrors() && !rows().length ? 'C\u1EA7n \xEDt nh\u1EA5t m\u1ED9t d\xF2ng d\u1EEF li\u1EC7u d\u01B0\u1EDBi d\xF2ng ti\xEAu \u0111\u1EC1.' : undefined"
              [maxlength]="20000"
              required />
            <div>
              <sd-button title="D\xF9ng d\u1EEF li\u1EC7u m\u1EABu" type="text" prefixIcon="description" autoId="import-sample" (click)="useSample()" />
            </div>
          </div>
        </sd-step>
        <sd-step label="Nh\u1EADn di\u1EC7n & \xE1nh x\u1EA1" [stepControl]="gates[1]">
          <div class="py-16">
            <p class="T14R text-secondary mt-0">\u0110\u1ECDc \u0111\u01B0\u1EE3c {{ rows().length }} d\xF2ng, {{ columns().length }} c\u1ED9t.</p>
            <mapping-form
              [sourceColumns]="columns()"
              [mapping]="mapping()"
              [showErrors]="showErrors()"
              (mappingChange)="mapping.set($event)" />
          </div>
        </sd-step>
        <sd-step label="Xem tr\u01B0\u1EDBc & xung \u0111\u1ED9t" [stepControl]="gates[2]">
          <div class="d-flex flex-column gap-12 py-16">
            @if (preview(); as rows) {
              <p class="T14R m-0">
                {{ counts().new }} d\xF2ng m\u1EDBi \xB7 {{ counts().duplicate }} d\xF2ng tr\xF9ng m\xE3 \xB7 {{ counts().invalid }} d\xF2ng l\u1ED7i (b\u1ECF qua)
              </p>
              <preview-view [rows]="rows" />
              @if (counts().duplicate) {
                <sd-segmented
                  ariaLabel="X\u1EED l\xFD d\xF2ng tr\xF9ng"
                  autoId="import-duplicates"
                  [items]="duplicateItems"
                  [model]="duplicates()"
                  (sdChange)="setDuplicates($event)" />
              }
            } @else {
              <p class="T14R text-secondary">\u0110ang ki\u1EC3m tra d\u1EEF li\u1EC7u\u2026</p>
            }
          </div>
        </sd-step>
        <sd-step label="X\xE1c nh\u1EADn">
          <div class="py-16">
            @if (result(); as done) {
              <sd-inform
                success
                title="\u0110\xE3 nh\u1EADp d\u1EEF li\u1EC7u"
                [description]="done.created + ' s\u1EA3n ph\u1EA9m m\u1EDBi, ' + done.updated + ' c\u1EADp nh\u1EADt, ' + done.skipped + ' b\u1ECF qua.'" />
              <a class="d-inline-block mt-12" [routerLink]="['../product']">Xem danh s\xE1ch s\u1EA3n ph\u1EA9m</a>
            } @else {
              <sd-section title="T\xF3m t\u1EAFt">
                <sd-section-item label="Th\xEAm m\u1EDBi">{{ counts().new }}</sd-section-item>
                <sd-section-item label="Tr\xF9ng m\xE3"
                  >{{ counts().duplicate }} ({{ duplicates() === 'overwrite' ? 'ghi \u0111\xE8' : 'b\u1ECF qua' }})</sd-section-item
                >
                <sd-section-item label="L\u1ED7i, b\u1ECF qua">{{ counts().invalid }}</sd-section-item>
              </sd-section>
            }
          </div>
        </sd-step>
      </sd-stepper>
      <sd-button
        sdFooterLeft
        title="Quay l\u1EA1i"
        type="outline"
        autoId="import-previous"
        [disabled]="step() === 0 || !!result()"
        (click)="step.set(step() - 1)" />
      @if (step() < 3) {
        <sd-button
          sdFooterRight
          title="Ti\u1EBFp t\u1EE5c"
          type="fill"
          color="primary"
          autoId="import-next"
          [loading]="checking()"
          (click)="next()" />
      } @else if (!result()) {
        <sd-button
          sdFooterRight
          title="Nh\u1EADp d\u1EEF li\u1EC7u"
          type="fill"
          color="primary"
          autoId="import-commit"
          [loading]="committing()"
          (click)="commit()" />
      }
    </sd-page>
  \`,
})
export class FlowComponent {
  readonly #importService = inject(ImportService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  protected readonly duplicateItems = DUPLICATES;
  protected readonly step = signal(0);
  /**
   * M\u1ED9t c\u1ED5ng cho m\u1ED7i b\u01B0\u1EDBc: ch\u1EC9 \u0111\xFAng sau khi b\u01B0\u1EDBc \u0111\xF3 qua ki\u1EC3m tra, n\xEAn stepper \`linear\` kh\xF4ng cho b\u1EA5m ti\xEAu \u0111\u1EC1 \u0111\u1EC3
   * v\u01B0\u1EE3t qua b\u01B0\u1EDBc ch\u01B0a ki\u1EC3m tra. \u0110\u1ED5i ngu\u1ED3n d\u1EEF li\u1EC7u th\xEC \u0111\xF3ng l\u1EA1i c\xE1c b\u01B0\u1EDBc sau.
   */
  protected readonly gates = [0, 1, 2].map(() => new FormControl(false, { nonNullable: true, validators: Validators.requiredTrue }));
  protected readonly showErrors = signal(false);
  /** Ch\u1EC9 \u0111\u1EC3 \u0111\xE1nh d\u1EA5u \u0111\xE3 ch\u1EA1m \xF4 ngu\u1ED3n khi b\u1EA5m Ti\u1EBFp: l\u1ED7i c\u1EE7a \xF4 hi\u1EC7n ngay c\u1EA3 khi ng\u01B0\u1EDDi d\xF9ng ch\u01B0a g\xF5 g\xEC. */
  protected readonly sourceForm = new FormGroup({});
  protected readonly source = signal('');
  readonly #parsed = computed(() => parseCsv(this.source()));
  protected readonly columns = computed(() => this.#parsed().columns);
  protected readonly rows = computed(() => this.#parsed().rows);
  protected readonly mapping = signal<ImportMapping>({ code: null, name: null, unit: null, price: null });
  protected readonly preview = signal<readonly ImportPreviewRowDto[] | null>(null);
  protected readonly duplicates = signal<ImportDuplicatePolicy>('skip');
  protected readonly checking = signal(false);
  protected readonly committing = signal(false);
  protected readonly result = signal<ImportCommitRes | null>(null);
  protected readonly counts = computed(() => {
    const rows = this.preview() ?? [];
    return {
      new: rows.filter(row => row.result === 'new').length,
      duplicate: rows.filter(row => row.result === 'duplicate').length,
      invalid: rows.filter(row => row.result === 'invalid').length,
    };
  });

  protected useSample(): void {
    this.editSource(IMPORT_SAMPLE);
  }

  /** \u0110\u1ED5i ngu\u1ED3n th\xEC c\xE1c b\u01B0\u1EDBc sau ph\u1EA3i ki\u1EC3m tra l\u1EA1i. */
  protected editSource(value: string): void {
    this.source.set(value);
    this.gates.forEach(gate => gate.setValue(false));
  }

  protected setDuplicates(value: SdSegmentedModel<ImportDuplicatePolicy>): void {
    if (value === 'skip' || value === 'overwrite') this.duplicates.set(value);
  }

  protected async next(): Promise<void> {
    const step = this.step();
    if (step === 0) {
      if (!this.rows().length) {
        this.sourceForm.markAllAsTouched();
        return this.showErrors.set(true);
      }
      // Ngu\u1ED3n m\u1EDBi: \xE1nh x\u1EA1 l\u1EA1i theo t\xEAn c\u1ED9t, b\u1ECF k\u1EBFt qu\u1EA3 ki\u1EC3m tra c\u0169.
      this.mapping.set(guessMapping(this.columns()));
      this.preview.set(null);
      this.gates.slice(1).forEach(gate => gate.setValue(false));
    }
    if (step === 1) {
      const missing = IMPORT_FIELDS.some(field => field.required && !this.mapping()[field.field]);
      if (missing) return this.showErrors.set(true);
      if (!(await this.#check())) return;
    }
    this.showErrors.set(false);
    this.gates[step].setValue(true);
    this.step.set(step + 1);
  }

  protected async commit(): Promise<void> {
    const { new: created, duplicate } = this.counts();
    const overwrite = this.duplicates() === 'overwrite' ? duplicate : 0;
    try {
      await this.#confirm.confirm(\`Th\xEAm \${created} s\u1EA3n ph\u1EA9m\${overwrite ? \`, ghi \u0111\xE8 \${overwrite} s\u1EA3n ph\u1EA9m\` : ''}?\`, {
        title: 'Nh\u1EADp d\u1EEF li\u1EC7u',
        yesTitle: 'Nh\u1EADp d\u1EEF li\u1EC7u',
        noTitle: 'Kh\xF4ng',
      });
    } catch {
      return;
    }
    this.committing.set(true);
    try {
      this.result.set(await firstValueFrom(this.#importService.commit(this.#mappedRows(), this.duplicates())));
    } catch (error) {
      this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng nh\u1EADp \u0111\u01B0\u1EE3c d\u1EEF li\u1EC7u. Th\u1EED l\u1EA1i.'));
    } finally {
      this.committing.set(false);
    }
  }

  async #check(): Promise<boolean> {
    this.checking.set(true);
    try {
      this.preview.set((await firstValueFrom(this.#importService.preview(this.#mappedRows()))).rows);
      return true;
    } catch (error) {
      this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng ki\u1EC3m tra \u0111\u01B0\u1EE3c d\u1EEF li\u1EC7u. Th\u1EED l\u1EA1i.'));
      return false;
    } finally {
      this.checking.set(false);
    }
  }

  #mappedRows() {
    const mapping = this.mapping();
    return this.rows().map(row => ({
      code: mapping.code ? (row[mapping.code] ?? '') : '',
      name: mapping.name ? (row[mapping.name] ?? '') : '',
      unit: mapping.unit ? (row[mapping.unit] ?? '') : '',
      price: mapping.price ? (row[mapping.price] ?? '') : '0',
    }));
  }
}
`,"features/import/routes.ts":`import type { Routes } from '@angular/router';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { ImportService } from './services/import.service';

export const routes: Routes = [
  {
    path: '',
    providers: [ImportService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: 'Nh\u1EADp d\u1EEF li\u1EC7u s\u1EA3n ph\u1EA9m',
        data: { permission: 'PATTERN_IMPORT_C_IMPORT' },
        loadComponent: () => import('./pages/flow/flow.component').then(module => module.FlowComponent),
      },
    ],
  },
];
`,"features/import/services/import.model.ts":`/** Field c\u1EE7a s\u1EA3n ph\u1EA9m nh\u1EADn d\u1EEF li\u1EC7u nh\u1EADp. */
export type ImportField = 'code' | 'name' | 'unit' | 'price';

export const IMPORT_FIELDS: readonly {
  readonly field: ImportField;
  readonly label: string;
  readonly required: boolean;
  readonly aliases: readonly string[];
}[] = [
  { field: 'code', label: 'M\xE3 s\u1EA3n ph\u1EA9m', required: true, aliases: ['m\xE3', 'ma', 'code', 'm\xE3 s\u1EA3n ph\u1EA9m', 'ma san pham'] },
  { field: 'name', label: 'T\xEAn s\u1EA3n ph\u1EA9m', required: true, aliases: ['t\xEAn', 'ten', 'name', 't\xEAn s\u1EA3n ph\u1EA9m', 'ten san pham'] },
  { field: 'unit', label: '\u0110\u01A1n v\u1ECB t\xEDnh', required: false, aliases: ['\u0111\u01A1n v\u1ECB', 'don vi', '\u0111vt', 'unit', '\u0111\u01A1n v\u1ECB t\xEDnh'] },
  { field: 'price', label: 'Gi\xE1 b\xE1n', required: false, aliases: ['gi\xE1', 'gia', 'gi\xE1 b\xE1n', 'gia ban', 'price'] },
];

/** C\u1ED9t c\u1EE7a ngu\u1ED3n \u0111\u01B0\u1EE3c ch\u1ECDn cho t\u1EEBng field; \`null\` l\xE0 b\u1ECF qua field \u0111\xF3. */
export type ImportMapping = Record<ImportField, string | null>;

/** B\u1EA3ng \u0111\u1ECDc t\u1EEB ngu\u1ED3n: t\xEAn c\u1ED9t v\xE0 c\xE1c d\xF2ng (gi\xE1 tr\u1ECB theo t\xEAn c\u1ED9t). */
export interface ImportSource {
  readonly columns: readonly string[];
  readonly rows: readonly Readonly<Record<string, string>>[];
}

/** K\u1EBFt qu\u1EA3 xem tr\u01B0\u1EDBc c\u1EE7a m\u1ED9t d\xF2ng. */
export interface ImportPreviewRowDto {
  readonly index: number;
  readonly code: string;
  readonly name: string;
  readonly unit: string;
  readonly price: number;
  readonly result: 'new' | 'duplicate' | 'invalid';
  readonly message?: string;
}

/** X\u1EED l\xFD d\xF2ng tr\xF9ng m\xE3 s\u1EA3n ph\u1EA9m \u0111\xE3 c\xF3. */
export type ImportDuplicatePolicy = 'skip' | 'overwrite';

export interface ImportCommitRes {
  readonly created: number;
  readonly updated: number;
  readonly skipped: number;
}

/** D\u1EEF li\u1EC7u m\u1EABu cho b\u01B0\u1EDBc Ngu\u1ED3n d\u1EEF li\u1EC7u: c\xF3 d\xF2ng m\u1EDBi, d\xF2ng tr\xF9ng m\xE3 v\xE0 d\xF2ng l\u1ED7i. */
export const IMPORT_SAMPLE = [
  'M\xE3,T\xEAn s\u1EA3n ph\u1EA9m,\u0110\u01A1n v\u1ECB,Gi\xE1 b\xE1n',
  'SP-001,N\u01B0\u1EDBc su\u1ED1i 500ml (m\u1EABu m\u1EDBi),Chai,6000',
  'SP-901,S\u1EEFa h\u1EA1t \xF3c ch\xF3 1L,H\u1ED9p,52000',
  'SP-902,B\xE1nh quy y\u1EBFn m\u1EA1ch,G\xF3i,28000',
  ',S\u1EA3n ph\u1EA9m thi\u1EBFu m\xE3,C\xE1i,1000',
  'SP-903,K\u1EB9o b\u1EA1c h\xE0,G\xF3i,abc',
  'SP-904,N\u01B0\u1EDBc t\u0103ng l\u1EF1c 250ml,Lon,12000',
].join('\\n');

/** \u0110\u1ECDc CSV (d\u1EA5u ph\u1EA9y ho\u1EB7c ch\u1EA5m ph\u1EA9y) c\xF3 d\xF2ng ti\xEAu \u0111\u1EC1. */
export function parseCsv(text: string): ImportSource {
  const lines = text
    .split(/\\r?\\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  if (lines.length < 2) return { columns: [], rows: [] };
  const separator = lines[0].includes(';') ? ';' : ',';
  const split = (line: string) => line.split(separator).map(cell => cell.trim().replace(/^"(.*)"$/, '$1'));
  const columns = split(lines[0]);
  const rows = lines.slice(1).map(line => {
    const cells = split(line);
    return Object.fromEntries(columns.map((column, index) => [column, cells[index] ?? '']));
  });
  return { columns, rows };
}

/** \xC1nh x\u1EA1 t\u1EF1 \u0111\u1ED9ng theo t\xEAn c\u1ED9t. */
export function guessMapping(columns: readonly string[]): ImportMapping {
  const normalized = columns.map(column => column.trim().toLowerCase());
  const mapping = {} as ImportMapping;
  for (const { field, aliases } of IMPORT_FIELDS) {
    const index = normalized.findIndex(column => aliases.includes(column));
    mapping[field] = index >= 0 ? columns[index] : null;
  }
  return mapping;
}
`,"features/import/services/import.service.ts":`import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { BaseApiService } from '../../../services/base-api.service';
import type { ImportCommitRes, ImportDuplicatePolicy, ImportPreviewRowDto } from './import.model';

type ImportRowReq = Readonly<Record<'code' | 'name' | 'unit' | 'price', string>>;

/** Nh\u1EADp s\u1EA3n ph\u1EA9m theo l\xF4: API ph\xE2n lo\u1EA1i t\u1EEBng d\xF2ng tr\u01B0\u1EDBc, r\u1ED3i ghi theo c\xE1ch x\u1EED l\xFD d\xF2ng tr\xF9ng. */
@Injectable()
export class ImportService extends BaseApiService {
  preview(rows: readonly ImportRowReq[]): Observable<{ rows: ImportPreviewRowDto[] }> {
    return this.http.post<{ rows: ImportPreviewRowDto[] }>(this.apiUrl('products', 'import', 'preview'), { rows });
  }

  commit(rows: readonly ImportRowReq[], duplicates: ImportDuplicatePolicy): Observable<ImportCommitRes> {
    return this.http.post<ImportCommitRes>(this.apiUrl('products', 'import'), { rows, duplicates });
  }
}
`,"features/order/components/approval-steps/approval-steps.component.ts":`import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdFormatDatetimePipe } from '@sdcorejs/angular/pipes';
import type { OrderApprovalStepDto } from '../../services/order.model';

const ACTION_NAME: Readonly<Record<OrderApprovalStepDto['action'], string>> = {
  submit: 'G\u1EEDi duy\u1EC7t',
  approve: 'Duy\u1EC7t',
  reject: 'T\u1EEB ch\u1ED1i',
};

/** Quy tr\xECnh duy\u1EC7t c\u1EE7a \u0111\u01A1n, m\u1EDBi nh\u1EA5t \u1EDF cu\u1ED1i; d\xF9ng \u1EDF c\u1ED9t ph\u1EE5 c\u1EE7a trang chi ti\u1EBFt. */
@Component({
  selector: 'approval-steps',
  standalone: true,
  imports: [SdSection, SdFormatDatetimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-section title="Quy tr\xECnh duy\u1EC7t">
      <ol class="approval-steps">
        <li class="approval-steps__item approval-steps__item--done">
          <span class="T14M">T\u1EA1o \u0111\u01A1n</span>
        </li>
        @for (step of steps(); track $index) {
          <li class="approval-steps__item" [class.approval-steps__item--rejected]="step.action === 'reject'">
            <span class="T14M">{{ actionName[step.action] }}</span>
            <span class="T12R text-secondary">{{ step.by }} \xB7 {{ step.at | sdFormatDatetime }}</span>
            @if (step.reason) {
              <span class="T12R">L\xFD do: {{ step.reason }}</span>
            }
          </li>
        } @empty {
          <li class="approval-steps__item approval-steps__item--pending">
            <span class="T12R text-secondary">Ch\u01B0a g\u1EEDi duy\u1EC7t</span>
          </li>
        }
      </ol>
    </sd-section>
  \`,
  styles: \`
    .approval-steps {
      margin: 0;
      padding: 16px 16px 16px 32px;
      list-style: none;
    }
    .approval-steps__item {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-bottom: 16px;
    }
    .approval-steps__item::before {
      content: '';
      position: absolute;
      top: 4px;
      left: -18px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--sd-primary);
    }
    .approval-steps__item--rejected::before {
      background: var(--sd-error, currentColor);
    }
    .approval-steps__item--pending::before {
      background: var(--sd-border-strong);
    }
  \`,
})
export class ApprovalStepsComponent {
  readonly steps = input.required<readonly OrderApprovalStepDto[]>();
  protected readonly actionName = ACTION_NAME;
}
`,"features/order/components/bulk-result/bulk-result.component.ts":`import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SdInform } from '@sdcorejs/angular/components/inform';

/** K\u1EBFt qu\u1EA3 c\u1EE7a m\u1ED9t t\xE1c v\u1EE5 h\xE0ng lo\u1EA1t: s\u1ED1 th\xE0nh c\xF4ng tr\xEAn t\u1ED5ng v\xE0 t\u1EEBng \u0111\u01A1n l\u1ED7i. */
export interface OrderBulkSummary {
  /** \u0110\u1ED9ng t\u1EEB c\u1EE7a t\xE1c v\u1EE5, v\xED d\u1EE5 "\u0110\xE3 x\xE1c nh\u1EADn". */
  readonly done: string;
  readonly total: number;
  readonly failed: readonly { readonly id: string; readonly code: string; readonly message: string }[];
}

/** B\xE1o k\u1EBFt qu\u1EA3 t\u1EEBng ph\u1EA7n (E13): "\u0110\xE3 x\xE1c nh\u1EADn 8/10. 2 \u0111\u01A1n l\u1ED7i." k\xE8m l\u1ED7i t\u1EEBng \u0111\u01A1n v\xE0 n\xFAt th\u1EED l\u1EA1i ph\u1EA7n l\u1ED7i. */
@Component({
  selector: 'bulk-result',
  standalone: true,
  imports: [SdInform],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @let _result = result();
    <sd-inform
      autoId="order-bulk-result"
      [color]="_result.failed.length ? 'warning' : 'success'"
      [title]="title()"
      [description]="failures()"
      [actionLabel]="_result.failed.length ? 'Th\u1EED l\u1EA1i ph\u1EA7n l\u1ED7i' : undefined"
      closable
      (sdAction)="retry.emit()"
      (sdClosed)="dismiss.emit()" />
  \`,
})
export class BulkResultComponent {
  readonly result = input.required<OrderBulkSummary>();
  readonly retry = output<void>();
  readonly dismiss = output<void>();
  protected readonly title = computed(() => {
    const { done, total, failed } = this.result();
    return \`\${done} \${total - failed.length}/\${total}.\` + (failed.length ? \` \${failed.length} \u0111\u01A1n l\u1ED7i.\` : '');
  });
  // why: n\u1ED9i dung chi\u1EBFu v\xE0o sd-inform thay c\u1EA3 ti\xEAu \u0111\u1EC1 l\u1EABn n\xFAt h\xE0nh \u0111\u1ED9ng; l\u1ED7i t\u1EEBng \u0111\u01A1n \u0111i qua \`description\`.
  protected readonly failures = computed(
    () =>
      this.result()
        .failed.map(item => \`\${item.code}: \${item.message}\`)
        .join(' ') || undefined
  );
}
`,"features/order/components/general-information-form/general-information-form.component.ts":`import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FormArray, FormControl, FormGroup } from '@angular/forms';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { CustomerSelectComponent } from '../../../customer/components/customer-select/customer-select.component';
import { ORDER_CHANNELS, ORDER_PAYMENTS, ORDER_WAREHOUSES, type OrderLineDto, type OrderSaveReq } from '../../services/order.model';

/** Form \u0111\u01A1n h\xE0ng: field c\u1EE7a \u0111\u1EA7u ch\u1EE9ng t\u1EEB do Core t\u1EF1 \u0111\u0103ng k\xFD; \`lines\` l\xE0 FormArray do \`lines-form\` qu\u1EA3n l\xFD. */
export type OrderForm = FormGroup<{
  customerId?: FormControl<string | null>;
  channel?: FormControl<string>;
  warehouse?: FormControl<string>;
  payment?: FormControl<string>;
  note?: FormControl<string | null>;
  lines?: FormArray<FormGroup>;
}>;

/** Gi\xE1 tr\u1ECB form \u2192 request l\u01B0u. */
export function orderSaveReq(form: OrderForm): OrderSaveReq {
  const value = form.getRawValue();
  const lines = (value.lines ?? []) as Partial<OrderLineDto>[];
  return {
    customerId: value.customerId ?? '',
    channel: value.channel ?? ORDER_CHANNELS[0],
    warehouse: value.warehouse ?? ORDER_WAREHOUSES[0],
    payment: value.payment ?? ORDER_PAYMENTS[0],
    note: value.note || null,
    lines: lines.map(line => ({
      productId: line.productId ?? '',
      quantity: Number(line.quantity ?? 0),
      unitPrice: Number(line.unitPrice ?? 0),
    })),
  };
}

const options = (values: readonly string[]) => values.map(value => ({ value }));

/** Nh\xF3m "Th\xF4ng tin chung" c\u1EE7a \u0111\u01A1n h\xE0ng. */
@Component({
  selector: 'general-information-form',
  standalone: true,
  imports: [SdSection, SdSelect, CustomerSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-section title="Th\xF4ng tin chung">
      <div class="row px-16 pt-16 pb-8">
        <div class="col-12 col-md-6">
          <customer-select autoId="order-customer" [form]="form()" [model]="seed().customerId || null" required />
        </div>
        <div class="col-12 col-md-6">
          <sd-select
            label="K\xEAnh b\xE1n"
            name="channel"
            [form]="form()"
            [model]="seed().channel"
            [items]="channels"
            valueField="value"
            displayField="value"
            [clearable]="false"
            required />
        </div>
        <div class="col-12 col-md-6">
          <sd-select
            label="Kho xu\u1EA5t"
            name="warehouse"
            [form]="form()"
            [model]="seed().warehouse"
            [items]="warehouses"
            valueField="value"
            displayField="value"
            [clearable]="false"
            required />
        </div>
        <div class="col-12 col-md-6">
          <sd-select
            label="Thanh to\xE1n"
            name="payment"
            [form]="form()"
            [model]="seed().payment"
            [items]="payments"
            valueField="value"
            displayField="value"
            [clearable]="false"
            required />
        </div>
      </div>
    </sd-section>
  \`,
})
export class GeneralInformationFormComponent {
  readonly form = input.required<OrderForm>();
  readonly seed = input.required<OrderSaveReq>();
  protected readonly channels = options(ORDER_CHANNELS);
  protected readonly warehouses = options(ORDER_WAREHOUSES);
  protected readonly payments = options(ORDER_PAYMENTS);
}
`,"features/order/components/lines-form/lines-form.component.ts":`import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { ProductSelectComponent } from '../../../product/components/product-select/product-select.component';
import type { OrderLineDto } from '../../services/order.model';
import type { OrderForm } from '../general-information-form/general-information-form.component';
import { orderLines } from './order-lines';

/**
 * B\u1EA3ng d\xF2ng h\xE0ng nh\u1EADp tr\u1EF1c ti\u1EBFp, d\u1EF1ng b\u1EB1ng \`<table>\`: m\u1ED7i d\xF2ng l\xE0 m\u1ED9t FormGroup trong \`form.lines\` (FormArray, do
 * \`orderLines()\` qu\u1EA3n l\xFD), c\xE1c field Core t\u1EF1 \u0111\u0103ng k\xFD v\xE0o d\xF2ng. Ch\u1ECDn s\u1EA3n ph\u1EA9m \u0111i\u1EC1n \u0111\u01A1n gi\xE1; th\xE0nh ti\u1EC1n v\xE0 t\u1ED5ng t\u1EF1
 * t\xEDnh. Field trong \xF4 d\xF9ng \`size="sm"\` v\xE0 \`hideInlineError\`: l\u1ED7i, k\u1EC3 c\u1EA3 l\u1ED7i API theo d\xF2ng (\`lines.<i>.<field>\`), l\xE0
 * icon k\xE8m tooltip ngay tr\xEAn \xF4 \u0111\xF3, d\xF2ng kh\xF4ng cao th\xEAm. C\xF9ng b\u1EA3ng d\u1EF1ng b\u1EB1ng \`sd-table\`: \`lines-table-form\`.
 */
@Component({
  selector: 'lines-form',
  standalone: true,
  imports: [SdSection, SdButton, SdInputNumber, SdFormatNumberPipe, ProductSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-section title="D\xF2ng h\xE0ng">
      <div sdHeaderRight>
        <sd-button title="Th\xEAm d\xF2ng" prefixIcon="add" type="text" autoId="order-line-add" (click)="lines.add()" />
      </div>
      <div class="lines-scroll">
        <table class="lines">
          <colgroup>
            <col />
            <col class="lines__quantity" />
            <col class="lines__money" />
            <col class="lines__money" />
            <col class="lines__action" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">S\u1EA3n ph\u1EA9m <span class="text-error" aria-hidden="true">*</span></th>
              <th scope="col" class="lines__number">S\u1ED1 l\u01B0\u1EE3ng <span class="text-error" aria-hidden="true">*</span></th>
              <th scope="col" class="lines__number">\u0110\u01A1n gi\xE1 (\u20AB) <span class="text-error" aria-hidden="true">*</span></th>
              <th scope="col" class="lines__number">Th\xE0nh ti\u1EC1n (\u20AB)</th>
              <th scope="col" class="lines__action"><span class="sd-visually-hidden">Xo\xE1 d\xF2ng</span></th>
            </tr>
          </thead>
          <tbody>
            @for (row of lines.rows(); track row.key; let index = $index) {
              <tr [attr.data-line]="index">
                <td>
                  <product-select
                    size="sm"
                    hideInlineError
                    [label]="undefined"
                    [form]="row.group"
                    [model]="row.seed.productId || null"
                    [inlineError]="errors()['lines.' + index + '.productId']"
                    [autoId]="'order-line-' + index + '-product'"
                    (modelChange)="lines.pick(row, $event)"
                    required />
                </td>
                <td class="lines__number">
                  <sd-input-number
                    name="quantity"
                    size="sm"
                    hideInlineError
                    type="positive"
                    [precision]="0"
                    [form]="row.group"
                    [model]="row.seed.quantity"
                    [inlineError]="errors()['lines.' + index + '.quantity']"
                    [autoId]="'order-line-' + index + '-quantity'"
                    required />
                </td>
                <td class="lines__number">
                  <sd-input-number
                    name="unitPrice"
                    size="sm"
                    hideInlineError
                    type="positive"
                    [precision]="0"
                    [form]="row.group"
                    [model]="row.seed.unitPrice"
                    [inlineError]="errors()['lines.' + index + '.unitPrice']"
                    [autoId]="'order-line-' + index + '-unit-price'"
                    required />
                </td>
                <td class="lines__number" [attr.data-autoid]="'order-line-' + index + '-amount'">
                  {{ lines.amounts()[index] | sdFormatNumber: 0 }}
                </td>
                <td class="lines__action">
                  <sd-button
                    prefixIcon="delete"
                    type="text"
                    color="error"
                    tooltip="Xo\xE1 d\xF2ng"
                    [autoId]="'order-line-' + index + '-remove'"
                    [disabled]="lines.rows().length === 1"
                    (click)="lines.remove(row)" />
                </td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colspan="3" class="lines__number">T\u1ED5ng ti\u1EC1n (\u20AB)</th>
              <td class="lines__number lines__total" data-autoid="order-total">{{ lines.total() | sdFormatNumber: 0 }}</td>
              <td class="lines__action"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </sd-section>
  \`,
  styles: \`
    /* M\xE0n h\u1EB9p th\xEC cu\u1ED9n ngang trong section thay v\xEC b\xF3p c\u1ED9t s\u1EA3n ph\u1EA9m. */
    .lines-scroll {
      overflow-x: auto;
    }
    /* C\u1ED9t c\u1ED1 \u0111\u1ECBnh, s\u1EA3n ph\u1EA9m l\u1EA5y ph\u1EA7n c\xF2n l\u1EA1i: v\u1EEBa th\xE2n 576px c\u1EE7a sd-page-form. */
    .lines {
      width: 100%;
      min-width: 544px;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .lines__quantity {
      width: 88px;
    }
    .lines__money {
      width: 120px;
    }
    .lines__action {
      width: 48px;
    }
    .lines th,
    .lines td {
      padding: 8px;
      text-align: left;
      vertical-align: middle;
    }
    /* C\u1ED9t \u0111\u1EA7u v\xE0 cu\u1ED1i th\u1EB3ng l\u1EC1 16px v\u1EDBi title v\xE0 n\xFAt "Th\xEAm d\xF2ng" c\u1EE7a section. */
    .lines th:first-child,
    .lines td:first-child {
      padding-left: 16px;
    }
    .lines th:last-child,
    .lines td:last-child {
      padding-right: 16px;
    }
    .lines thead th {
      color: var(--sd-text-secondary);
      font-size: 12px;
      font-weight: 500;
      border-bottom: 1px solid var(--sd-border);
    }
    .lines tbody tr:first-child td {
      padding-top: 12px;
    }
    .lines tbody tr:last-child td {
      padding-bottom: 12px;
    }
    .lines__number {
      text-align: right !important;
    }
    .lines tfoot th,
    .lines tfoot td {
      padding-top: 12px;
      padding-bottom: 12px;
      border-top: 1px solid var(--sd-border);
    }
    .lines__total {
      font-weight: 500;
    }
  \`,
})
export class LinesFormComponent {
  readonly form = input.required<OrderForm>();
  /** D\xF2ng ban \u0111\u1EA7u (c\u1EADp nh\u1EADt) ho\u1EB7c m\u1ED9t d\xF2ng tr\u1ED1ng (t\u1EA1o m\u1EDBi). */
  readonly seed = input.required<readonly OrderLineDto[]>();
  /** L\u1ED7i theo field do API tr\u1EA3 v\u1EC1, kho\xE1 d\u1EA1ng \`lines.<index>.<field>\`. */
  readonly errors = input<Readonly<Record<string, string>>>({});
  protected readonly lines = orderLines(this.form, this.seed);
}
`,"features/order/components/lines-form/order-lines.ts":`import { computed, DestroyRef, effect, inject, signal, untracked, type Signal } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ProductService } from '../../../product/services/product.service';
import type { OrderLineDto } from '../../services/order.model';
import type { OrderForm } from '../general-information-form/general-information-form.component';

/** M\u1ED9t d\xF2ng \u0111ang nh\u1EADp: field Core c\u1EE7a d\xF2ng t\u1EF1 \u0111\u0103ng k\xFD v\xE0o \`group\`; \`seed\` l\xE0 gi\xE1 tr\u1ECB ban \u0111\u1EA7u c\u1EE7a d\xF2ng. */
export interface OrderLineRow {
  readonly key: number;
  readonly group: FormGroup;
  readonly seed: OrderLineDto;
}

export interface OrderLines {
  readonly rows: Signal<readonly OrderLineRow[]>;
  /** Th\xE0nh ti\u1EC1n theo th\u1EE9 t\u1EF1 c\u1EE7a \`rows\`. */
  readonly amounts: Signal<readonly number[]>;
  readonly total: Signal<number>;
  add(): void;
  remove(row: OrderLineRow): void;
  /** Ch\u1ECDn s\u1EA3n ph\u1EA9m th\xEC \u0111i\u1EC1n \u0111\u01A1n gi\xE1 hi\u1EC7n h\xE0nh c\u1EE7a s\u1EA3n ph\u1EA9m. */
  pick(row: OrderLineRow, productId: string | null | undefined): Promise<void>;
  /** G\u1EAFn \`form.lines\` v\xE0o form khi field c\u1EE7a c\xE1c d\xF2ng v\u1EEBa n\u1EA1p \u0111\xE3 \u0111\u0103ng k\xFD; g\u1ECDi l\u1EA1i khi \u0111\xE3 g\u1EAFn th\xEC kh\xF4ng l\xE0m g\xEC. */
  attach(): void;
}

/**
 * D\xF2ng h\xE0ng c\u1EE7a form \u0111\u01A1n: m\u1ED7i d\xF2ng l\xE0 m\u1ED9t FormGroup trong \`form.lines\` (FormArray). Th\xE0nh ti\u1EC1n v\xE0 t\u1ED5ng t\xEDnh l\u1EA1i khi
 * gi\xE1 tr\u1ECB \u0111\u1ED5i. \`lines-form\` (b\u1EA3ng HTML) v\xE0 \`lines-table-form\` (\`sd-table\`) d\xF9ng chung, ch\u1EC9 kh\xE1c ph\u1EA7n hi\u1EC3n th\u1ECB.
 * G\u1ECDi trong injection context c\u1EE7a component.
 *
 * \`registerSdUnsavedChangesForm(..., { dirty: 'value' })\` l\u1EA5y gi\xE1 tr\u1ECB c\u1EE7a m\u1ED9t control l\xFAc n\xF3 v\xE0o form l\xE0m gi\xE1 tr\u1ECB \u0111\xE3
 * l\u01B0u, n\xEAn \`form.lines\` ch\u1EC9 v\xE0o form khi field c\u1EE7a c\xE1c d\xF2ng \u0111\xE3 \u0111\u0103ng k\xFD; v\xE0o s\u1EDBm h\u01A1n th\xEC form v\u1EEBa m\u1EDF \u0111\xE3 b\u1ECB coi l\xE0 c\xF3
 * thay \u0111\u1ED5i. \`<table>\` v\u1EBD d\xF2ng ngay trong l\u01B0\u1EE3t change detection \u0111\xF3 (\`attach: 'now'\`); \`sd-table\` v\u1EBD d\xF2ng sau l\u1EA7n \u0111\u1ECDc
 * \u0111\u1EA7u, n\xEAn \`lines-table-form\` d\xF9ng \`attach: 'manual'\` r\u1ED3i g\u1ECDi \`attach()\` khi b\u1EA3ng \u0111\xE3 v\u1EBD.
 */
export function orderLines(
  form: Signal<OrderForm>,
  seed: Signal<readonly OrderLineDto[]>,
  options: { readonly attach: 'now' | 'manual' } = { attach: 'now' }
): OrderLines {
  const productService = inject(ProductService);
  const array = new FormArray<FormGroup>([]);
  const version = signal(0);
  const rows = signal<readonly OrderLineRow[]>([]);
  let nextKey = 0;

  const attach = (): void => {
    if (form().get('lines') !== array) form().setControl('lines', array);
  };
  const push = (line: OrderLineDto): void => {
    const group = new FormGroup({});
    array.push(group);
    rows.update(items => [...items, { key: nextKey++, group, seed: line }]);
  };
  const load = (lines: readonly OrderLineDto[]): void => {
    // why: g\u1EE1 ra r\u1ED3i g\u1EAFn l\u1EA1i, \u0111\u1EC3 gi\xE1 tr\u1ECB \u0111\xE3 l\u01B0u c\u1EE7a \`lines\` l\xE0 c\xE1c d\xF2ng m\u1EDBi ch\u1EE9 kh\xF4ng ph\u1EA3i d\xF2ng c\u1EE7a \u0111\u01A1n tr\u01B0\u1EDBc.
    if (form().get('lines') === array) form().removeControl('lines');
    array.clear();
    rows.set([]);
    (lines.length ? lines : [{ productId: '', quantity: 1, unitPrice: 0 }]).forEach(push);
    if (options.attach === 'now') attach();
  };

  const subscription = array.valueChanges.subscribe(() => version.update(value => value + 1));
  inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  // why: trang c\u1EADp nh\u1EADt \u0111\u01B0\u1EE3c d\xF9ng l\u1EA1i khi ch\u1EC9 \u0111\u1ED5i \`:id\`; d\xF2ng h\xE0ng ph\u1EA3i theo \u0111\u01A1n m\u1EDBi, kh\xF4ng gi\u1EEF d\xF2ng c\u1EE7a \u0111\u01A1n tr\u01B0\u1EDBc.
  effect(() => {
    const lines = seed();
    untracked(() => load(lines));
  });

  const amounts = computed(() => {
    version();
    return rows().map(
      row => Number(row.group.get('quantity')?.value ?? row.seed.quantity) * Number(row.group.get('unitPrice')?.value ?? row.seed.unitPrice)
    );
  });

  return {
    rows: rows.asReadonly(),
    amounts,
    total: computed(() => amounts().reduce((sum, amount) => sum + amount, 0)),
    add: () => push({ productId: '', quantity: 1, unitPrice: 0 }),
    remove: row => {
      const index = rows().indexOf(row);
      if (index < 0) return;
      // why: \u0111\xE1nh d\u1EA5u \u0111\xE3 s\u1EEDa TR\u01AF\u1EDAC khi g\u1EE1, \u0111\u1EC3 dirty theo gi\xE1 tr\u1ECB so v\u1EDBi danh s\xE1ch d\xF2ng l\xFAc tr\u01B0\u1EDBc.
      array.markAsDirty();
      array.removeAt(index);
      rows.update(items => items.filter(item => item !== row));
    },
    pick: async (row, productId) => {
      if (!productId) return;
      const product = await firstValueFrom(productService.cachedDetail(productId));
      row.group.get('unitPrice')?.setValue(product.price);
    },
    attach,
  };
}
`,"features/order/components/lines-table-form/lines-table-form.component.ts":`import { afterNextRender, ChangeDetectionStrategy, Component, effect, inject, Injector, input, untracked, viewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import {
  SdTable,
  SdTableCellDefDirective,
  SdTableCommandHeaderDefDirective,
  SdTableTitleDefDirective,
  type SdTableOption,
} from '@sdcorejs/angular/components/table';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { ProductSelectComponent } from '../../../product/components/product-select/product-select.component';
import type { OrderLineDto } from '../../services/order.model';
import type { OrderForm } from '../general-information-form/general-information-form.component';
import { orderLines, type OrderLineRow } from '../lines-form/order-lines';

/** D\xF2ng c\u1EE7a \`sd-table\`: d\xF2ng form c\u1ED9ng t\xEAn c\xE1c c\u1ED9t. \xD4 c\u1EE7a m\u1ECDi c\u1ED9t v\u1EBD b\u1EB1ng \`sdTableCellDef\` t\u1EEB \`group\`/\`seed\`. */
interface LineItem extends OrderLineRow {
  readonly productId?: string;
  readonly quantity?: number;
  readonly unitPrice?: number;
  readonly amount?: number;
}

/**
 * D\xF2ng h\xE0ng nh\u1EADp tr\u1EF1c ti\u1EBFp, d\u1EF1ng b\u1EB1ng \`sd-table\` thay cho \`<table>\` c\u1EE7a \`lines-form\`; tr\u1EA1ng th\xE1i d\xF2ng v\u1EABn l\xE0
 * \`orderLines()\`. B\u1EA3ng local, kh\xF4ng ph\xE2n trang, kh\xF4ng l\u1ECDc. N\xFAt th\xEAm d\xF2ng n\u1EB1m \u1EDF header c\u1ED9t command
 * (\`sdTableCommandHeaderDef\`), ngay tr\xEAn n\xFAt xo\xE1 c\u1EE7a t\u1EEBng d\xF2ng; field trong \xF4 d\xF9ng \`size="sm"\` v\xE0 \`hideInlineError\`,
 * c\u1ED9t b\u1EAFt bu\u1ED9c c\xF3 \`*\` \u1EDF title; s\u1ED1 d\xF2ng v\xE0 t\u1ED5ng ti\u1EC1n \u1EDF d\u01B0\u1EDBi b\u1EA3ng. D\xF2ng \u0111\u1ED5i th\xEC \`reload()\` b\u1EA3ng; \`rowKey\` gi\u1EEF view
 * c\u1EE7a c\xE1c d\xF2ng c\xF2n l\u1EA1i n\xEAn gi\xE1 tr\u1ECB \u0111ang nh\u1EADp kh\xF4ng m\u1EA5t. \`form.lines\` ch\u1EC9 v\xE0o form khi b\u1EA3ng \u0111\xE3 v\u1EBD d\xF2ng (\`attach\`).
 */
@Component({
  selector: 'lines-table-form',
  standalone: true,
  imports: [
    SdSection,
    SdButton,
    SdTable,
    SdTableCellDefDirective,
    SdTableCommandHeaderDefDirective,
    SdTableTitleDefDirective,
    SdInputNumber,
    SdFormatNumberPipe,
    ProductSelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-section title="D\xF2ng h\xE0ng">
      <sd-table autoId="order-lines" [option]="option">
        <ng-template sdTableCommandHeaderDef>
          <sd-button
            tooltip="Th\xEAm d\xF2ng"
            prefixIcon="add"
            size="sm"
            type="light"
            color="primary"
            autoId="order-line-add"
            (click)="lines.add()" />
        </ng-template>
        <ng-template sdTableTitleDef="productId">S\u1EA3n ph\u1EA9m <span class="text-error" aria-hidden="true">*</span></ng-template>
        <ng-template sdTableTitleDef="quantity">S\u1ED1 l\u01B0\u1EE3ng <span class="text-error" aria-hidden="true">*</span></ng-template>
        <ng-template sdTableTitleDef="unitPrice">\u0110\u01A1n gi\xE1 (\u20AB) <span class="text-error" aria-hidden="true">*</span></ng-template>
        <ng-template sdTableCellDef="productId" let-row="item">
          @let index = lines.rows().indexOf(row);
          <product-select
            class="lines-table__input"
            size="sm"
            hideInlineError
            [label]="undefined"
            [form]="row.group"
            [model]="row.seed.productId || null"
            [inlineError]="errors()['lines.' + index + '.productId']"
            [autoId]="'order-line-' + index + '-product'"
            (modelChange)="lines.pick(row, $event)"
            required />
        </ng-template>
        <ng-template sdTableCellDef="quantity" let-row="item">
          @let index = lines.rows().indexOf(row);
          <sd-input-number
            class="lines-table__input"
            name="quantity"
            size="sm"
            hideInlineError
            type="positive"
            [precision]="0"
            [form]="row.group"
            [model]="row.seed.quantity"
            [inlineError]="errors()['lines.' + index + '.quantity']"
            [autoId]="'order-line-' + index + '-quantity'"
            required />
        </ng-template>
        <ng-template sdTableCellDef="unitPrice" let-row="item">
          @let index = lines.rows().indexOf(row);
          <sd-input-number
            class="lines-table__input"
            name="unitPrice"
            size="sm"
            hideInlineError
            type="positive"
            [precision]="0"
            [form]="row.group"
            [model]="row.seed.unitPrice"
            [inlineError]="errors()['lines.' + index + '.unitPrice']"
            [autoId]="'order-line-' + index + '-unit-price'"
            required />
        </ng-template>
        <ng-template sdTableCellDef="amount" let-row="item">
          @let index = lines.rows().indexOf(row);
          <strong class="lines-table__amount" [attr.data-autoid]="'order-line-' + index + '-amount'">
            {{ lines.amounts()[index] | sdFormatNumber: 0 }}
          </strong>
        </ng-template>
      </sd-table>
      <div class="lines-table__summary">
        <span>{{ lines.rows().length }} d\xF2ng h\xE0ng</span>
        <strong
          >T\u1ED5ng ti\u1EC1n: <span data-autoid="order-total">{{ lines.total() | sdFormatNumber: 0 }}</span> \u20AB</strong
        >
      </div>
    </sd-section>
  \`,
  styles: \`
    /* Field trong d\xF2ng: 6px tr\xEAn d\u01B0\u1EDBi \u0111\u1EC3 d\xF2ng 44px v\u1EABn tho\xE1ng. */
    .lines-table__input {
      display: block;
      padding-block: 6px;
    }
    .lines-table__amount {
      display: block;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .lines-table__summary {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      padding: 12px 16px;
      color: var(--sd-text-secondary);
    }
    .lines-table__summary strong {
      color: var(--sd-text);
    }
  \`,
})
export class LinesTableFormComponent {
  readonly form = input.required<OrderForm>();
  /** D\xF2ng ban \u0111\u1EA7u (c\u1EADp nh\u1EADt) ho\u1EB7c m\u1ED9t d\xF2ng tr\u1ED1ng (t\u1EA1o m\u1EDBi). */
  readonly seed = input.required<readonly OrderLineDto[]>();
  /** L\u1ED7i theo field do API tr\u1EA3 v\u1EC1, kho\xE1 d\u1EA1ng \`lines.<index>.<field>\`. */
  readonly errors = input<Readonly<Record<string, string>>>({});
  readonly #injector = inject(Injector);
  private readonly table = viewChild(SdTable<LineItem>);
  protected readonly lines = orderLines(this.form, this.seed, { attach: 'manual' });
  protected readonly option: SdTableOption<LineItem> = {
    type: 'local',
    items: () => [...this.lines.rows()],
    rowKey: 'key',
    filter: { disabled: true },
    paginate: { hidden: true, pageSize: 200 },
    reload: {
      visible: false,
      // why: sd-table v\u1EBD d\xF2ng sau l\u1EA7n \u0111\u1ECDc; field trong \xF4 \u0111\u0103ng k\xFD xong th\xEC m\u1EDBi g\u1EAFn \`form.lines\` (xem \`orderLines\`).
      onReload: () => {
        afterNextRender(() => this.lines.attach(), { injector: this.#injector });
      },
    },
    config: { visible: false },
    columns: [
      { field: 'productId', title: 'S\u1EA3n ph\u1EA9m', type: 'string', minWidth: '180px' },
      { field: 'quantity', title: 'S\u1ED1 l\u01B0\u1EE3ng', type: 'number', width: '88px' },
      { field: 'unitPrice', title: '\u0110\u01A1n gi\xE1 (\u20AB)', type: 'number', width: '120px' },
      { field: 'amount', title: 'Th\xE0nh ti\u1EC1n (\u20AB)', type: 'number', width: '120px', align: 'right' },
    ],
    command: {
      commands: [
        {
          title: 'Xo\xE1 d\xF2ng',
          icon: 'delete',
          color: 'error',
          disabled: () => this.lines.rows().length === 1,
          click: row => this.lines.remove(row),
        },
      ],
    },
  };

  constructor() {
    // why: b\u1EA3ng local ch\u1EC9 \u0111\u1ECDc \`items\` khi t\u1EA3i; th\xEAm, xo\xE1 d\xF2ng hay n\u1EA1p \u0111\u01A1n kh\xE1c \u0111\u1EC1u ph\u1EA3i \`reload()\` \u0111\u1EC3 v\u1EBD l\u1EA1i. G\u1ECDi sau
    // l\u01B0\u1EE3t render, khi \`option\` c\u1EE7a b\u1EA3ng \u0111\xE3 \u0111\u01B0\u1EE3c g\xE1n.
    effect(() => {
      this.lines.rows();
      untracked(() => afterNextRender(() => void this.table()?.reload(), { injector: this.#injector }));
    });
  }
}
`,"features/order/components/lines-view/lines-view.component.ts":`import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { ProductDetailPipe } from '../../../product/pipes/product-detail.pipe';
import type { OrderLineDto } from '../../services/order.model';

/** D\xF2ng h\xE0ng ch\u1EC9 \u0111\u1ECDc; t\xEAn s\u1EA3n ph\u1EA9m l\u1EA5y qua relation \`productDetail\`, kh\xF4ng hi\u1EC7n ID th\xF4. */
@Component({
  selector: 'lines-view',
  standalone: true,
  imports: [AsyncPipe, SdSection, SdTable, SdTableCellDefDirective, ProductDetailPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-section title="D\xF2ng h\xE0ng">
      <sd-table autoId="order-lines" [option]="option()">
        <ng-template sdTableCellDef="productId" let-line="item">
          @let product = line.productId | productDetail | async;
          {{ product?.name ?? '\u2026' }}
        </ng-template>
      </sd-table>
    </sd-section>
  \`,
})
export class LinesViewComponent {
  readonly lines = input.required<readonly OrderLineDto[]>();
  protected readonly option = computed<SdTableOption<OrderLineDto & { amount: number }>>(() => {
    const items = this.lines().map(line => ({ ...line, amount: line.quantity * line.unitPrice }));
    return {
      type: 'local',
      items: () => items,
      paginate: { pageSize: 50 },
      filter: { hideInlineFilter: 'auto' },
      columns: [
        { field: 'productId', title: 'S\u1EA3n ph\u1EA9m', type: 'string', minWidth: '200px' },
        { field: 'quantity', title: 'S\u1ED1 l\u01B0\u1EE3ng', type: 'number', width: '110px', align: 'right' },
        { field: 'unitPrice', title: '\u0110\u01A1n gi\xE1 (\u20AB)', type: 'number', width: '140px', align: 'right' },
        { field: 'amount', title: 'Th\xE0nh ti\u1EC1n (\u20AB)', type: 'number', width: '150px', align: 'right' },
      ],
    };
  });
}
`,"features/order/components/summary-cards/summary-cards.component.ts":`import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, model } from '@angular/core';
import { SdCard, SdCardGroup } from '@sdcorejs/angular/components/card';
import { SD_PAGE_LIST } from '@sdcorejs/angular/modules/layout';
import type { OrderCounts, OrderStatus } from '../../services/order.model';

type CardKey = 'all' | 'pending' | 'shipping';

const CARDS: readonly { readonly key: CardKey; readonly label: string }[] = [
  { key: 'all', label: 'T\u1ED5ng \u0111\u01A1n' },
  { key: 'pending', label: 'Ch\u1EDD x\xE1c nh\u1EADn' },
  { key: 'shipping', label: '\u0110ang giao' },
];

/** 1.234.567.890 \u2192 "1,2 t\u1EF7"; 350.000.000 \u2192 "350 tri\u1EC7u". */
function money(value: number): string {
  if (value >= 1_000_000_000) return \`\${(value / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} t\u1EF7\`;
  return \`\${Math.round(value / 1_000_000).toLocaleString('vi-VN')} tri\u1EC7u\`;
}

/**
 * Score card c\u1EE7a danh s\xE1ch \u0111\u01A1n: ba th\u1EBB \u0111\u1EA7u l\u1ECDc theo tr\u1EA1ng th\xE1i, \u0111\u1ED3ng b\u1ED9 v\u1EDBi tab v\xEC c\xF9ng m\u1ED9t state; th\u1EBB doanh thu
 * ch\u1EC9 \u0111\u1EC3 xem. Khi \`sd-page-list\` thu g\u1ECDn (m\xE0n th\u1EA5p), c\xE1c th\u1EBB th\xE0nh m\u1ED9t d\xF2ng 36px.
 */
@Component({
  selector: 'summary-cards',
  standalone: true,
  imports: [SdCard, SdCardGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-card-group
      class="summary"
      autoId="order-summary"
      aria-label="T\xF3m t\u1EAFt \u0111\u01A1n h\xE0ng"
      [class.summary--compact]="compact()"
      [(model)]="selected"
      (sdChange)="choose($event)">
      @for (card of cards(); track card.key) {
        <sd-card class="summary__card" [value]="card.key" [autoId]="'order-summary-' + card.key">
          <span class="summary__label">{{ card.label }}</span>
          <strong class="summary__value">{{ card.value }}</strong>
        </sd-card>
      }
      <div class="summary__card summary__card--static" data-autoid="order-summary-revenue">
        <span class="summary__label">Doanh thu ho\xE0n t\u1EA5t</span>
        <strong class="summary__value">{{ revenue() }}</strong>
      </div>
    </sd-card-group>
  \`,
  styles: \`
    .summary {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .summary__card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px 16px;
    }
    .summary__card--static {
      border: 1px solid var(--sd-border);
      border-radius: 8px;
      background: var(--sd-surface);
    }
    .summary__label {
      color: var(--sd-text-secondary);
      font-size: 13px;
    }
    .summary__value {
      font-size: 22px;
      line-height: 28px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
    .summary--compact {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 36px;
    }
    .summary--compact .summary__card {
      flex-direction: row;
      align-items: baseline;
      gap: 6px;
      padding: 4px 10px;
    }
    .summary--compact .summary__card--static {
      border: 0;
      background: transparent;
    }
    .summary--compact .summary__value {
      font-size: 14px;
      line-height: 20px;
    }
    @media (max-width: 767px) {
      .summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  \`,
})
export class SummaryCardsComponent {
  readonly counts = input<OrderCounts | null>(null);
  /** Tr\u1EA1ng th\xE1i \u0111ang l\u1ECDc; \`null\` l\xE0 t\u1EA5t c\u1EA3. */
  readonly status = model<OrderStatus | null>(null);
  protected readonly cards = computed(() => {
    const counts = this.counts();
    return CARDS.map(card => ({ ...card, value: counts ? counts[card.key].toLocaleString('vi-VN') : '\u2026' }));
  });
  protected readonly compact = inject(SD_PAGE_LIST).compact;
  /** Tr\u1EA1ng th\xE1i ch\u1ECDn t\u1EEB tab m\xE0 kh\xF4ng c\xF3 th\u1EBB (Ho\xE0n t\u1EA5t, \u0110\xE3 hu\u1EF7): kh\xF4ng th\u1EBB n\xE0o s\xE1ng. */
  protected readonly selected = linkedSignal<CardKey | null>(() => {
    const status = this.status();
    return status === null ? 'all' : status === 'pending' || status === 'shipping' ? status : null;
  });
  protected readonly revenue = computed(() => {
    const counts = this.counts();
    return counts ? money(counts.revenue) : '\u2026';
  });

  protected choose(key: unknown): void {
    // B\u1EA5m l\u1EA1i th\u1EBB \u0111ang ch\u1ECDn (model v\u1EC1 null) ho\u1EB7c th\u1EBB T\u1ED5ng \u0111\u01A1n \u0111\u1EC1u l\xE0 b\u1ECF l\u1ECDc.
    const card = (key as CardKey | null) ?? 'all';
    this.selected.set(card);
    this.status.set(card === 'all' ? null : card);
  }
}
`,"features/order/entity.resolver.ts":`import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { createUrlTreeFromSnapshot, RedirectCommand, type ResolveFn } from '@angular/router';
import { map, timeout, type Observable } from 'rxjs';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { OrderService } from './services/order.service';
import { canUpdateOrder, type OrderDto } from './services/order.model';

/** T\u1EA3i \u0111\u01A1n h\xE0ng b\u1EB1ng \`detail(id)\` tr\u01B0\u1EDBc khi m\u1EDF chi ti\u1EBFt ho\u1EB7c form; l\u1ED7i \u0111i t\u1EDBi navigation error handler c\u1EE7a host. */
export const entityResolver: ResolveFn<OrderDto> = route => {
  const id = route.paramMap.get('id');
  if (!id?.trim()) throw new HttpErrorResponse({ status: 404 });
  return inject(OrderService)
    .detail(id)
    .pipe(
      timeout(10_000),
      map(entity => {
        if (!entity || entity.id !== id) throw new HttpErrorResponse({ status: 404 });
        return entity;
      })
    );
};

/**
 * Nh\u01B0 \`entityResolver\`, cho trang c\u1EADp nh\u1EADt: \u0111\u01A1n kh\xF4ng c\xF2n s\u1EEDa \u0111\u01B0\u1EE3c (\u0111\xE3 x\xE1c nh\u1EADn, \u0111ang duy\u1EC7t\u2026) m\u1EDF trang chi ti\u1EBFt, thay v\xEC
 * m\u1EDF form r\u1ED3i m\u1EDBi b\u1ECB API t\u1EEB ch\u1ED1i khi l\u01B0u.
 */
export const updatableEntityResolver: ResolveFn<OrderDto> = (route, state) => {
  const notify = inject(SdNotifyService);
  return (entityResolver(route, state) as Observable<OrderDto>).pipe(
    map(order => {
      if (canUpdateOrder(order)) return order;
      notify.info(\`\u0110\u01A1n \${order.code} kh\xF4ng c\xF2n s\u1EEDa \u0111\u01B0\u1EE3c.\`);
      return new RedirectCommand(createUrlTreeFromSnapshot(route, ['../detail']));
    })
  );
};
`,"features/order/pages/create/create.component.ts":`import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, Injector, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import {
  GeneralInformationFormComponent,
  orderSaveReq,
  type OrderForm,
} from '../../components/general-information-form/general-information-form.component';
import { LinesFormComponent } from '../../components/lines-form/lines-form.component';
import { LinesTableFormComponent } from '../../components/lines-table-form/lines-table-form.component';
import { OrderService } from '../../services/order.service';
import { ORDER_CHANNELS, ORDER_PAYMENTS, ORDER_WAREHOUSES, type OrderSaveReq } from '../../services/order.model';

/** T\u1EA1o \u0111\u01A1n h\xE0ng: form nhi\u1EC1u nh\xF3m c\xF3 m\u1EE5c l\u1EE5c (\`toc\`), d\xF2ng h\xE0ng nh\u1EADp tr\u1EF1c ti\u1EBFp, l\u01B0u xong sang chi ti\u1EBFt. */
@Component({
  selector: 'create',
  standalone: true,
  imports: [SdPageComponent, SdButton, SdSection, SdTextarea, GeneralInformationFormComponent, LinesFormComponent, LinesTableFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-page-form title="T\u1EA1o m\u1EDBi \u0111\u01A1n h\xE0ng" [backLink]="['..']" toc>
      <div headerRight class="d-flex align-items-center gap-8">
        <sd-button title="Hu\u1EF7" type="outline" autoId="order-cancel" (click)="cancel()" />
        <sd-button
          title="T\u1EA1o \u0111\u01A1n h\xE0ng"
          prefixIcon="save"
          type="fill"
          color="primary"
          autoId="order-save"
          [loading]="saving()"
          (click)="save()" />
      </div>
      <div class="d-flex flex-column gap-16 py-16">
        <general-information-form [form]="form" [seed]="seed" />
        @if (linesTable) {
          <lines-table-form [form]="form" [seed]="seed.lines" [errors]="apiErrors.errors()" />
        } @else {
          <lines-form [form]="form" [seed]="seed.lines" [errors]="apiErrors.errors()" />
        }
        <sd-section title="Ghi ch\xFA">
          <div class="px-16 pt-16 pb-8">
            <sd-textarea label="Ghi ch\xFA n\u1ED9i b\u1ED9" name="note" [form]="form" [model]="seed.note" maxlength="500" />
          </div>
        </sd-section>
      </div>
    </sd-page-form>
  \`,
})
export class CreateComponent {
  readonly #orderService = inject(OrderService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  /** \`?lines=sd-table\`: d\xF2ng h\xE0ng d\u1EF1ng b\u1EB1ng \`sd-table\` (\`lines-table-form\`) \u0111\u1EC3 so v\u1EDBi \`<table>\`. M\xE0n th\u1EADt ch\u1ECDn m\u1ED9t. */
  protected readonly linesTable = this.#route.snapshot.queryParamMap.get('lines') === 'sd-table';
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  readonly #injector = inject(Injector);
  protected readonly seed: OrderSaveReq = {
    customerId: '',
    channel: ORDER_CHANNELS[0],
    warehouse: ORDER_WAREHOUSES[0],
    payment: ORDER_PAYMENTS[0],
    note: null,
    lines: [],
  };
  protected readonly form: OrderForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'order-create', dirty: 'value' });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#unsaved.destroy());
  }

  protected cancel(): void {
    void this.#router.navigate(['..'], { relativeTo: this.#route });
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.#focusFirstInvalid();
      return;
    }
    this.saving.set(true);
    try {
      const order = await firstValueFrom(this.#orderService.create(orderSaveReq(this.form)));
      this.#unsaved.markPristine();
      this.#notify.success(\`\u0110\xE3 t\u1EA1o \u0111\u01A1n \${order.code}.\`);
      await this.#router.navigate(['..', order.id, 'detail'], { relativeTo: this.#route, replaceUrl: true });
    } catch (error) {
      if (this.apiErrors.set(error)) this.#focusFirstInvalid();
      else this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng th\u1EC3 l\u01B0u. D\u1EEF li\u1EC7u \u0111\xE3 nh\u1EADp v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF.'));
    } finally {
      this.saving.set(false);
    }
  }

  #focusFirstInvalid(): void {
    afterNextRender(() => focusFirstInvalid(this.#host), { injector: this.#injector });
  }
}
`,"features/order/pages/detail/detail.component.ts":`import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdView } from '@sdcorejs/angular/components/view';
import { SD_PAGE_LIST, SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import { SdEmptyPipe, SdFormatDatePipe, SdFormatDatetimePipe, SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage } from '../../../../utils/api-error';
import { CustomerDetailPipe } from '../../../customer/pipes/customer-detail.pipe';
import { ApprovalStepsComponent } from '../../components/approval-steps/approval-steps.component';
import { LinesViewComponent } from '../../components/lines-view/lines-view.component';
import { OrderService } from '../../services/order.service';
import { canUpdateOrder, orderApprovalBadge, orderStatusBadge, type OrderAction, type OrderDto } from '../../services/order.model';

/**
 * Chi ti\u1EBFt \u0111\u01A1n (\`:id/detail\`, route con c\u1EE7a danh s\xE1ch). M\u1EDF trong drawer 600px ho\u1EB7c trang \`sd-page-detail\` theo
 * \`detail\` c\u1EE7a \`sd-page-list\`. G\u1EEDi duy\u1EC7t, Duy\u1EC7t v\xE0 T\u1EEB ch\u1ED1i \u0111\u1EC1u h\u1ECFi x\xE1c nh\u1EADn; T\u1EEB ch\u1ED1i b\u1EAFt bu\u1ED9c l\xFD do (E13).
 */
@Component({
  selector: 'detail',
  standalone: true,
  imports: [
    AsyncPipe,
    NgTemplateOutlet,
    RouterLink,
    SdPageComponent,
    SdSideDrawer,
    SdBadge,
    SdButton,
    SdSection,
    SdSectionItem,
    SdView,
    SdPermissionDirective,
    SdEmptyPipe,
    SdFormatDatePipe,
    SdFormatDatetimePipe,
    SdFormatNumberPipe,
    CustomerDetailPipe,
    ApprovalStepsComponent,
    LinesViewComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @let order = entity();
    @let customer = order.customerId | customerDetail | async;
    <ng-template #actions>
      @if (order.approval === 'submitted') {
        <sd-button
          *sdPermission="'PATTERN_ORDER_U_REJECT'"
          title="T\u1EEB ch\u1ED1i"
          prefixIcon="close"
          type="light"
          color="warning"
          autoId="order-reject"
          [disabled]="pending()"
          (click)="act('reject')" />
        <sd-button
          *sdPermission="'PATTERN_ORDER_U_APPROVE'"
          title="Duy\u1EC7t"
          prefixIcon="check"
          type="fill"
          color="success"
          autoId="order-approve"
          [disabled]="pending()"
          (click)="act('approve')" />
      }
      @if (editable()) {
        <sd-button
          *sdPermission="'PATTERN_ORDER_U_SUBMIT'"
          title="G\u1EEDi duy\u1EC7t"
          prefixIcon="send"
          type="outline"
          autoId="order-submit"
          [disabled]="pending()"
          (click)="act('submit')" />
        <sd-button
          *sdPermission="'PATTERN_ORDER_U_UPDATE'"
          title="C\u1EADp nh\u1EADt \u0111\u01A1n h\xE0ng"
          prefixIcon="edit"
          type="fill"
          color="primary"
          autoId="order-update"
          [disabled]="pending()"
          [routerLink]="['../update']" />
      }
    </ng-template>

    @if (mode() === 'drawer') {
      <sd-side-drawer width="600px" autoId="order-detail" (sdClosed)="closed()">
        <div sdHeaderLeft class="d-flex align-items-center gap-8">
          <span class="T16M">\u0110\u01A1n h\xE0ng {{ order.code }}</span>
          <sd-badge size="md" type="round" [title]="statusBadge().title" [color]="statusBadge().color" />
        </div>
        <sd-section title="Th\xF4ng tin chung">
          <sd-section-item label="Kh\xE1ch h\xE0ng">{{ order.customer }}</sd-section-item>
          <sd-section-item label="K\xEAnh b\xE1n">{{ order.channel }}</sd-section-item>
          <sd-section-item label="Kho xu\u1EA5t">{{ order.warehouse }}</sd-section-item>
          <sd-section-item label="Thanh to\xE1n">{{ order.payment }}</sd-section-item>
          <sd-section-item label="Ng\xE0y t\u1EA1o">{{ order.createdAt | sdFormatDatetime }}</sd-section-item>
          <sd-section-item label="T\u1ED5ng ti\u1EC1n (\u20AB)">{{ order.total | sdFormatNumber: 0 }}</sd-section-item>
          <sd-section-item label="Tr\u1EA1ng th\xE1i">
            <div class="d-flex align-items-center gap-8 flex-wrap">
              @for (badge of badges(); track $index) {
                <sd-badge [type]="badge.type" [title]="badge.title" [color]="badge.color" />
              }
            </div>
          </sd-section-item>
        </sd-section>
        <div sdFooterRight class="d-flex align-items-center gap-8 flex-wrap">
          <ng-container [ngTemplateOutlet]="actions" />
        </div>
      </sd-side-drawer>
    } @else {
      <sd-page-detail
        [title]="'Chi ti\u1EBFt \u0111\u01A1n h\xE0ng #' + order.code"
        [description]="order.customer + ' \xB7 ' + order.channel"
        [badges]="badges()"
        [backLink]="['../..']">
        <div headerRight class="d-flex align-items-center gap-8 flex-wrap">
          <ng-container [ngTemplateOutlet]="actions" />
        </div>
        <div class="d-flex flex-column gap-16 py-16">
          <sd-section title="Th\xF4ng tin chung">
            <div class="row p-8">
              <div class="col-12 col-md-6 p-8"><sd-view label="Kh\xE1ch h\xE0ng" [display]="order.customer" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="\u0110i\u1EC7n tho\u1EA1i" [display]="customer?.phone" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="K\xEAnh b\xE1n" [display]="order.channel" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="Kho xu\u1EA5t" [display]="order.warehouse" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="Thanh to\xE1n" [display]="order.payment" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="Ng\xE0y t\u1EA1o" [display]="order.createdAt | sdFormatDatetime" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="Ng\xE0y giao" [display]="order.deliveredAt | sdFormatDate" /></div>
              <div class="col-12 col-md-6 p-8"><sd-view label="M\xE3 v\u1EADn \u0111\u01A1n" [display]="order.tracking" /></div>
            </div>
          </sd-section>
          <lines-view [lines]="order.lines" />
          <sd-section title="Th\xF4ng tin ph\xEA duy\u1EC7t">
            <sd-section-item label="Tr\u1EA1ng th\xE1i duy\u1EC7t">
              <sd-badge [type]="approvalBadge().type" [title]="approvalBadge().title" [color]="approvalBadge().color" />
            </sd-section-item>
            <sd-section-item label="Ng\u01B0\u1EDDi g\u1EEDi duy\u1EC7t">{{ submitted()?.by | sdEmpty }}</sd-section-item>
            <sd-section-item label="Ng\u01B0\u1EDDi duy\u1EC7t">{{ decided()?.by | sdEmpty }}</sd-section-item>
            <sd-section-item label="L\xFD do t\u1EEB ch\u1ED1i">{{ decided()?.reason | sdEmpty }}</sd-section-item>
            <sd-section-item label="Ghi ch\xFA">{{ order.note | sdEmpty }}</sd-section-item>
          </sd-section>
        </div>
        <approval-steps sdAside [steps]="order.approvalHistory" />
      </sd-page-detail>
    }
  \`,
})
export class DetailComponent {
  readonly #orderService = inject(OrderService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  private readonly drawer = viewChild(SdSideDrawer);
  protected readonly mode = inject(SD_PAGE_LIST).detail;
  readonly #resolved = toSignal(this.#route.data.pipe(map(data => data['entity'] as OrderDto)), { requireSync: true });
  /** \u0110\u01A1n do resolver t\u1EA3i; sau m\u1ED7i t\xE1c v\u1EE5 thay b\u1EB1ng \u0111\u01A1n API tr\u1EA3 v\u1EC1. */
  protected readonly entity = linkedSignal(() => this.#resolved());
  protected readonly pending = signal(false);
  protected readonly statusBadge = computed(() => orderStatusBadge(this.entity().status));
  protected readonly approvalBadge = computed(() => orderApprovalBadge(this.entity().approval));
  /** Tr\u1EA1ng th\xE1i \u0111\u01A1n v\xE0 tr\u1EA1ng th\xE1i duy\u1EC7t: title c\u1EE7a trang, d\xF2ng "Tr\u1EA1ng th\xE1i" c\u1EE7a drawer. */
  protected readonly badges = computed(() => [this.statusBadge(), this.approvalBadge()]);
  protected readonly editable = computed(() => canUpdateOrder(this.entity()));
  protected readonly submitted = computed(() => [...this.entity().approvalHistory].reverse().find(step => step.action === 'submit'));
  protected readonly decided = computed(() =>
    this.entity().approval === 'approved' || this.entity().approval === 'rejected' ? this.entity().approvalHistory.at(-1) : undefined
  );

  constructor() {
    afterNextRender(() => this.drawer()?.open());
  }

  protected closed(): void {
    void this.#router.navigate(['../..'], { relativeTo: this.#route });
  }

  /** H\u1ECFi x\xE1c nh\u1EADn (T\u1EEB ch\u1ED1i k\xE8m l\xFD do), g\u1ECDi API, r\u1ED3i hi\u1EC3n th\u1ECB \u0111\u01A1n m\u1EDBi; l\u1ED7i gi\u1EEF nguy\xEAn m\xE0n \u0111\u1EC3 th\u1EED l\u1EA1i. */
  protected async act(action: Extract<OrderAction, 'submit' | 'approve' | 'reject'>): Promise<void> {
    const order = this.entity();
    let reason: string | undefined;
    try {
      if (action === 'reject') {
        reason = await this.#confirm.withInput(\`T\u1EEB ch\u1ED1i \u0111\u01A1n \${order.code}. L\xFD do \u0111\u01B0\u1EE3c g\u1EEDi cho ng\u01B0\u1EDDi l\u1EADp \u0111\u01A1n.\`, {
          title: 'T\u1EEB ch\u1ED1i \u0111\u01A1n h\xE0ng',
          label: 'L\xFD do t\u1EEB ch\u1ED1i',
          required: true,
          maxlength: 200,
          yesTitle: 'T\u1EEB ch\u1ED1i',
          noTitle: 'Kh\xF4ng',
          yesButtonColor: 'warning',
        });
      } else {
        await this.#confirm.confirm(action === 'approve' ? \`Duy\u1EC7t \u0111\u01A1n \${order.code}?\` : \`G\u1EEDi \u0111\u01A1n \${order.code} cho ng\u01B0\u1EDDi duy\u1EC7t?\`, {
          title: action === 'approve' ? 'Duy\u1EC7t \u0111\u01A1n h\xE0ng' : 'G\u1EEDi duy\u1EC7t',
          yesTitle: action === 'approve' ? 'Duy\u1EC7t' : 'G\u1EEDi duy\u1EC7t',
          noTitle: 'Kh\xF4ng',
        });
      }
    } catch {
      return;
    }
    this.pending.set(true);
    try {
      this.entity.set(await firstValueFrom(this.#orderService.act(action, { id: order.id, reason })));
      this.#notify.success(action === 'approve' ? '\u0110\xE3 duy\u1EC7t \u0111\u01A1n.' : action === 'reject' ? '\u0110\xE3 t\u1EEB ch\u1ED1i \u0111\u01A1n.' : '\u0110\xE3 g\u1EEDi duy\u1EC7t.');
    } catch (error) {
      this.#notify.error(apiErrorMessage(error));
    } finally {
      this.pending.set(false);
    }
  }
}
`,"features/order/pages/list/list.component.html":`@let _settings = settings();
<sd-page-list title="\u0110\u01A1n h\xE0ng" description="\u0110\u01A1n b\xE1n l\u1EBB t\u1EEB m\u1ECDi k\xEAnh." [detail]="detailMode()" [autoCompact]="_settings.autoCompact">
  <div headerRight class="d-flex align-items-center gap-8 flex-wrap">
    <!-- Ch\u1EC9 c\xF3 \u1EDF /pattern. -->
    <sd-pattern-settings-button />
    <sd-button
      *sdPermission="'PATTERN_ORDER_C_CREATE'"
      title="T\u1EA1o \u0111\u01A1n h\xE0ng"
      prefixIcon="add"
      type="fill"
      color="primary"
      autoId="order-create"
      [routerLink]="['create']" />
  </div>

  @if (_settings.tabs) {
    <sd-tab-group sdSubheader [selectedIndex]="tabIndex()" (selectedIndexChange)="selectTab($event)">
      @for (tab of tabs; track tab.label) {
        <sd-tab [label]="tab.label" [badge]="counts()?.[tab.status ?? 'all']" />
      }
    </sd-tab-group>
  }
  @if (_settings.score) {
    <summary-cards [counts]="counts()" [(status)]="status" />
  }
  @if (bulkResult(); as result) {
    <bulk-result [result]="result" (retry)="retryFailed()" (dismiss)="bulkResult.set(null)" />
  }

  <sd-table autoId="orders" [option]="option()">
    <ng-template sdTableCellDef="code" let-order="item">
      <a *sdPermission="'PATTERN_ORDER_R_DETAIL'" [routerLink]="[order.id, 'detail']">{{ order.code }}</a>
      @if (!canOpenDetail) {
        <span>{{ order.code }}</span>
      }
    </ng-template>
  </sd-table>
</sd-page-list>
`,"features/order/pages/list/list.component.ts":`import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, firstValueFrom, map, startWith } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';
import { SdTable, SdTableCellDefDirective, type SdTableColumn, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdPageList, type SdPageListDetail } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import type { PagingReq } from '@sdcorejs/utils/models';
// Ch\u1EC9 c\xF3 \u1EDF /pattern: drawer "Tu\u1EF3 ch\u1EC9nh hi\u1EC3n th\u1ECB" b\u1EADt/t\u1EAFt c\xE1c v\xF9ng c\u1EE7a m\xE0n. M\xE0n th\u1EADt ch\u1ECDn s\u1EB5n m\u1ED9t c\u1EA5u h\xECnh.
import { PatternSettingsButtonComponent } from '../../../../core/pattern-shell/settings/settings-button.component';
import { PatternSettingsStore, type PatternOrderSettings } from '../../../../core/pattern-shell/settings/pattern-settings.store';
import { apiErrorMessage } from '../../../../utils/api-error';
import { BulkResultComponent, type OrderBulkSummary } from '../../components/bulk-result/bulk-result.component';
import { SummaryCardsComponent } from '../../components/summary-cards/summary-cards.component';
import { OrderService } from '../../services/order.service';
import {
  ORDER_CHANNELS,
  ORDER_PAYMENTS,
  ORDER_STATUS_OPTIONS,
  ORDER_WAREHOUSES,
  orderStatusBadge,
  type OrderAction,
  type OrderActionReq,
  type OrderCounts,
  type OrderDto,
  type OrderStatus,
} from '../../services/order.model';

type SelectorAction = NonNullable<NonNullable<SdTableOption<OrderDto>['selector']>['actions']>[number];

const TABS: readonly { readonly label: string; readonly status: OrderStatus | null }[] = [
  { label: 'T\u1EA5t c\u1EA3', status: null },
  ...ORDER_STATUS_OPTIONS.map(option => ({ label: option.name, status: option.id })),
];

const values = (items: readonly string[]) => ({ items: items.map(value => ({ value })), valueField: 'value', displayField: 'value' });

/** C\u1ED9t c\u1EE7a danh s\xE1ch; \`withTabs\`: c\xF3 tab tr\u1EA1ng th\xE1i th\xEC kh\xF4ng l\u1ECDc tr\u1EA1ng th\xE1i d\u01B0\u1EDBi c\u1ED9t (E6). */
function columns(withTabs: boolean): SdTableColumn<OrderDto>[] {
  return [
    { field: 'code', title: 'M\xE3 \u0111\u01A1n', type: 'string', width: '130px', sortable: true },
    { field: 'customer', title: 'Kh\xE1ch h\xE0ng', type: 'string', minWidth: '180px' },
    { field: 'channel', title: 'K\xEAnh', type: 'values', width: '130px', option: values(ORDER_CHANNELS) },
    { field: 'createdAt', title: 'Ng\xE0y t\u1EA1o', type: 'date', width: '170px', filter: { type: 'daterange' }, sortable: true },
    { field: 'total', title: 'T\u1ED5ng ti\u1EC1n (\u20AB)', type: 'number', width: '130px', align: 'right', sortable: true },
    {
      field: 'status',
      title: 'Tr\u1EA1ng th\xE1i',
      type: 'values',
      width: '150px',
      option: { items: ORDER_STATUS_OPTIONS, valueField: 'id', displayField: 'name' },
      useBadge: status => orderStatusBadge(status),
      filter: withTabs ? { disabled: true } : undefined,
    },
  ];
}

@Component({
  selector: 'list',
  standalone: true,
  templateUrl: './list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    SdPageList,
    SdButton,
    SdTabGroup,
    SdTab,
    SdTable,
    SdTableCellDefDirective,
    SdPermissionDirective,
    SummaryCardsComponent,
    BulkResultComponent,
    PatternSettingsButtonComponent,
  ],
})
export class ListComponent {
  readonly #orderService = inject(OrderService);
  readonly #permission = inject(SdPermissionService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  private readonly pageList = viewChild.required(SdPageList);
  private readonly table = viewChild.required(SdTable);
  protected readonly canOpenDetail = this.#permission.hasPermission('PATTERN_ORDER_R_DETAIL');
  readonly #canExport = this.#permission.hasPermission('PATTERN_ORDER_R_EXPORT');
  protected readonly settings = inject(PatternSettingsStore).settings;
  protected readonly tabs = TABS;

  // #region state
  /** M\u1ED9t state cho tab, score card v\xE0 request: \u0111\u1ED5i tr\u1EA1ng th\xE1i th\xEC \u0111\u1ECDc l\u1EA1i t\u1EEB trang 1. */
  protected readonly status = signal<OrderStatus | null>(null);
  protected readonly tabIndex = computed(() => TABS.findIndex(tab => tab.status === this.status()));
  protected readonly counts = signal<OrderCounts | null>(null);
  // #endregion
  protected readonly bulkResult = signal<OrderBulkSummary | null>(null);
  #lastBulk: { readonly action: OrderAction; readonly reqs: readonly OrderActionReq[] } | null = null;

  /** T\u1EA1o v\xE0 c\u1EADp nh\u1EADt (\`data.detail: 'page'\`) thay ch\u1ED7 danh s\xE1ch; chi ti\u1EBFt m\u1EDF theo c\u1EA5u h\xECnh (drawer m\u1EB7c \u0111\u1ECBnh). */
  readonly #childMode = toSignal(
    this.#router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.#route.firstChild?.snapshot.data['detail'] as SdPageListDetail | undefined)
    ),
    { requireSync: true }
  );
  protected readonly detailMode = computed<SdPageListDetail>(() => this.#childMode() ?? this.settings().detail);

  protected readonly option = computed(() => this.#tableOption(this.settings()));

  constructor() {
    let status = this.status();
    effect(() => {
      const next = this.status();
      if (next === status) return;
      status = next;
      untracked(() => void this.table().reloadFirstPage());
    });
    // B\u1EADt/t\u1EAFt tab tr\u1EA1ng th\xE1i th\xEC v\u1EC1 "T\u1EA5t c\u1EA3".
    let tabs = this.settings().tabs;
    effect(() => {
      const next = this.settings().tabs;
      if (next === tabs) return;
      tabs = next;
      untracked(() => this.status.set(null));
    });
    // L\u01B0u ho\u1EB7c \u0111\u1ED5i tr\u1EA1ng th\xE1i \u1EDF m\xE0n con xong r\u1ED3i quay v\u1EC1: t\u1EA3i l\u1EA1i trang hi\u1EC7n t\u1EA1i, gi\u1EEF b\u1ED9 l\u1ECDc.
    let changes = this.#orderService.changes();
    effect(() => {
      const next = this.#orderService.changes();
      if (this.pageList().childActive() || next === changes) return;
      changes = next;
      untracked(() => void this.table().reload(true, false));
    });
  }

  protected selectTab(index: number): void {
    this.status.set(TABS[index]?.status ?? null);
  }

  protected retryFailed(): void {
    const last = this.#lastBulk;
    const failed = new Set(this.bulkResult()?.failed.map(item => item.id) ?? []);
    if (last && failed.size)
      void this.#runBulk(
        last.action,
        last.reqs.filter(req => failed.has(req.id))
      );
  }

  async #read(req: PagingReq<OrderDto>) {
    const status = untracked(this.status);
    // S\u1ED1 tr\xEAn tab v\xE0 th\u1EBB theo c\xF9ng b\u1ED9 l\u1ECDc c\u1EE7a b\u1EA3ng, ch\u01B0a t\xEDnh tr\u1EA1ng th\xE1i \u0111ang ch\u1ECDn.
    void firstValueFrom(this.#orderService.counts(req.filters ?? []))
      .then(counts => this.counts.set(counts))
      .catch(() => this.counts.set(null));
    const filters = status ? [...(req.filters ?? []), { field: 'status' as const, operator: 'EQUAL' as const, data: status }] : req.filters;
    return firstValueFrom(this.#orderService.list({ ...req, filters }));
  }

  #tableOption(settings: PatternOrderSettings): SdTableOption<OrderDto> {
    return {
      type: 'server',
      rowKey: 'id',
      items: (_, req) => this.#read(req),
      sort: { enable: true },
      columns: columns(settings.tabs),
      paginate: { pageSize: settings.pageSize, pages: [10, 20, 50] },
      selector: settings.selector ? { visible: true, preserveSelection: true, actions: this.#selectorActions() } : { visible: false },
      reload: { visible: settings.footerButtons },
      export: settings.footerButtons && this.#canExport ? { visible: 'EXCEL' } : undefined,
      config: { visible: settings.footerButtons },
      filter: {
        hideInlineFilter: !settings.inlineFilter ? true : settings.autoHide ? 'auto' : false,
        quickSearch: settings.quickSearch
          ? {
              placeholder: 'T\xECm theo m\xE3 \u0111\u01A1n, kh\xE1ch h\xE0ng',
              containFields: ['code', 'customer'],
              filters: settings.warehouse
                ? [{ field: 'warehouse', title: 'Kho xu\u1EA5t', type: 'values', option: values(ORDER_WAREHOUSES) }]
                : [],
            }
          : undefined,
        // External filter ch\u1EC9 ch\u1EE9a field kh\xF4ng c\xF3 c\u1ED9t (E6).
        externalFilters: settings.externalFilter
          ? [
              { field: 'payment', title: 'Thanh to\xE1n', type: 'values', option: values(ORDER_PAYMENTS) },
              { field: 'creator', title: 'Ng\u01B0\u1EDDi t\u1EA1o', type: 'string' },
              { field: 'deliveredAt', title: 'Ng\xE0y giao', type: 'daterange' },
              { field: 'source', title: 'Ngu\u1ED3n \u0111\u01A1n', type: 'string' },
              { field: 'tracking', title: 'M\xE3 v\u1EADn \u0111\u01A1n', type: 'string' },
              { field: 'note', title: 'Ghi ch\xFA n\u1ED9i b\u1ED9', type: 'string' },
            ]
          : undefined,
        externalFilterPerRow: settings.externalFilterPerRow,
        externalFilterCollapsed: settings.externalFilterCollapsed || undefined,
        manualFilter: settings.manualFilter,
      },
    } as SdTableOption<OrderDto>;
  }

  /** T\xE1c v\u1EE5 tr\xEAn c\xE1c d\xF2ng \u0111\xE3 ch\u1ECDn, theo quy\u1EC1n (\u0111\xE3 n\u1EA1p tr\u01B0\u1EDBc khi m\u1EDF m\xE0n). */
  #selectorActions(): SelectorAction[] {
    const can = (code: string) => this.#permission.hasPermission(code);
    return [
      { title: 'X\xE1c nh\u1EADn', icon: 'check', hidden: !can('PATTERN_ORDER_U_CONFIRM'), click: items => void this.#confirmOrders(items ?? []) },
      { title: 'In phi\u1EBFu giao', icon: 'print', hidden: !can('PATTERN_ORDER_R_PRINT'), click: items => this.#print(items ?? []) },
      {
        title: 'Hu\u1EF7 \u0111\u01A1n',
        icon: 'cancel',
        color: 'error',
        hidden: !can('PATTERN_ORDER_U_CANCEL'),
        click: items => void this.#cancelOrders(items ?? []),
      },
    ];
  }

  async #confirmOrders(orders: readonly OrderDto[]): Promise<void> {
    try {
      await this.#confirm.confirm(\`X\xE1c nh\u1EADn \${orders.length} \u0111\u01A1n h\xE0ng \u0111\xE3 ch\u1ECDn? \u0110\u01A1n chuy\u1EC3n sang \u0110ang giao.\`, {
        title: 'X\xE1c nh\u1EADn \u0111\u01A1n h\xE0ng',
        yesTitle: 'X\xE1c nh\u1EADn',
        noTitle: 'Kh\xF4ng',
      });
    } catch {
      return;
    }
    await this.#runBulk(
      'confirm',
      orders.map(order => ({ id: order.id }))
    );
  }

  async #cancelOrders(orders: readonly OrderDto[]): Promise<void> {
    let reason: string;
    try {
      reason = await this.#confirm.withInput(\`Hu\u1EF7 \${orders.length} \u0111\u01A1n h\xE0ng \u0111\xE3 ch\u1ECDn. L\xFD do \u0111\u01B0\u1EE3c ghi v\xE0o t\u1EEBng \u0111\u01A1n.\`, {
        title: 'Hu\u1EF7 \u0111\u01A1n h\xE0ng',
        label: 'L\xFD do hu\u1EF7',
        required: true,
        maxlength: 200,
        yesTitle: 'Hu\u1EF7 \u0111\u01A1n',
        noTitle: 'Kh\xF4ng hu\u1EF7',
        yesButtonColor: 'error',
      });
    } catch {
      return;
    }
    await this.#runBulk(
      'cancel',
      orders.map(order => ({ id: order.id, reason }))
    );
  }

  #print(orders: readonly OrderDto[]): void {
    this.#notify.info(\`\u0110\xE3 g\u1EEDi \${orders.length} phi\u1EBFu giao t\u1EDBi m\xE1y in.\`);
  }

  /** Ch\u1EA1y t\xE1c v\u1EE5 h\xE0ng lo\u1EA1t, b\xE1o k\u1EBFt qu\u1EA3 t\u1EEBng ph\u1EA7n, gi\u1EEF c\xE1c d\xF2ng l\u1ED7i \u0111ang ch\u1ECDn v\xE0 cho th\u1EED l\u1EA1i ph\u1EA7n l\u1ED7i. */
  async #runBulk(action: OrderAction, reqs: readonly OrderActionReq[]): Promise<void> {
    const table = this.table();
    const selected = table.selectedTableItems();
    const codeOf = (id: string) => selected.find(item => item.data.id === id)?.data.code ?? id;
    try {
      const { results } = await firstValueFrom(this.#orderService.bulk(action, reqs));
      const failed = results.filter(result => !result.ok);
      const succeeded = new Set(results.filter(result => result.ok).map(result => result.id));
      this.#lastBulk = { action, reqs };
      this.bulkResult.set({
        done: action === 'confirm' ? '\u0110\xE3 x\xE1c nh\u1EADn' : '\u0110\xE3 hu\u1EF7',
        total: results.length,
        failed: failed.map(result => ({ id: result.id, code: codeOf(result.id), message: result.message ?? 'Kh\xF4ng th\u1EF1c hi\u1EC7n \u0111\u01B0\u1EE3c.' })),
      });
      // B\u1ECF ch\u1ECDn \u0111\xFAng c\xE1c \u0111\u01A1n \u0111\xE3 xong; \u0111\u01A1n l\u1ED7i v\u1EABn \u0111\u01B0\u1EE3c ch\u1ECDn sau khi t\u1EA3i l\u1EA1i (preserveSelection).
      for (const item of selected) {
        if (!succeeded.has(item.data.id)) continue;
        item.meta.selector!.isSelected = false;
        table.onSelect(item);
      }
      await table.reload(true, false);
    } catch (error) {
      this.#notify.error(apiErrorMessage(error));
    }
  }
}
`,"features/order/pages/update/update.component.ts":`import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import {
  GeneralInformationFormComponent,
  orderSaveReq,
  type OrderForm,
} from '../../components/general-information-form/general-information-form.component';
import { LinesFormComponent } from '../../components/lines-form/lines-form.component';
import { LinesTableFormComponent } from '../../components/lines-table-form/lines-table-form.component';
import { OrderService } from '../../services/order.service';
import type { OrderDto } from '../../services/order.model';

/**
 * C\u1EADp nh\u1EADt \u0111\u01A1n h\xE0ng: kh\xE1ch \u0111\xE3 ng\u1EEBng ho\u1EA1t \u0111\u1ED9ng v\u1EABn hi\u1EC7n (\`customer-select\` t\u1EA3i theo ID), l\u1ED7i c\u1EE7a API tr\xEAn m\u1ED9t d\xF2ng
 * hi\u1EC7n ngay \u1EDF d\xF2ng \u0111\xF3. L\u01B0u xong sang chi ti\u1EBFt.
 */
@Component({
  selector: 'update',
  standalone: true,
  imports: [SdPageComponent, SdButton, SdSection, SdTextarea, GeneralInformationFormComponent, LinesFormComponent, LinesTableFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <sd-page-form [title]="'C\u1EADp nh\u1EADt \u0111\u01A1n h\xE0ng #' + entity().code" [backLink]="['../detail']" toc>
      <div headerRight class="d-flex align-items-center gap-8">
        <sd-button title="Hu\u1EF7" type="outline" autoId="order-cancel" (click)="cancel()" />
        <sd-button title="L\u01B0u" prefixIcon="save" type="fill" color="primary" autoId="order-save" [loading]="saving()" (click)="save()" />
      </div>
      <div class="d-flex flex-column gap-16 py-16">
        <general-information-form [form]="form" [seed]="entity()" />
        @if (linesTable) {
          <lines-table-form [form]="form" [seed]="entity().lines" [errors]="apiErrors.errors()" />
        } @else {
          <lines-form [form]="form" [seed]="entity().lines" [errors]="apiErrors.errors()" />
        }
        <sd-section title="Ghi ch\xFA">
          <div class="px-16 pt-16 pb-8">
            <sd-textarea label="Ghi ch\xFA n\u1ED9i b\u1ED9" name="note" [form]="form" [model]="entity().note" maxlength="500" />
          </div>
        </sd-section>
      </div>
    </sd-page-form>
  \`,
})
export class UpdateComponent {
  readonly #orderService = inject(OrderService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  /** \`?lines=sd-table\`: d\xF2ng h\xE0ng d\u1EF1ng b\u1EB1ng \`sd-table\` (\`lines-table-form\`) \u0111\u1EC3 so v\u1EDBi \`<table>\`. M\xE0n th\u1EADt ch\u1ECDn m\u1ED9t. */
  protected readonly linesTable = this.#route.snapshot.queryParamMap.get('lines') === 'sd-table';
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  readonly #injector = inject(Injector);
  /** \u0110\u01A1n do resolver t\u1EA3i; draft kh\u1EDFi t\u1EA1o t\u1EEB \u0111\xE2y. */
  protected readonly entity = toSignal(this.#route.data.pipe(map(data => data['entity'] as OrderDto)), { requireSync: true });
  protected readonly form: OrderForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'order-update', dirty: 'value' });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#unsaved.destroy());
    // why: ch\u1EC9 \u0111\u1ED5i \`:id\` th\xEC trang \u0111\u01B0\u1EE3c d\xF9ng l\u1EA1i; khi \u0111\u01A1n m\u1EDBi \u0111\xE3 v\xE0o form, n\xF3 l\xE0 m\u1ED1c so s\xE1nh m\u1EDBi v\xE0 l\u1ED7i c\u0169 b\u1ECF \u0111i.
    let loaded = this.entity();
    effect(() => {
      const entity = this.entity();
      if (entity === loaded) return;
      loaded = entity;
      untracked(() => {
        this.apiErrors.clear();
        afterNextRender(() => this.#unsaved.markPristine(), { injector: this.#injector });
      });
    });
  }

  protected cancel(): void {
    void this.#router.navigate(['../detail'], { relativeTo: this.#route });
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.#focusFirstInvalid();
      return;
    }
    this.saving.set(true);
    try {
      await firstValueFrom(this.#orderService.update(this.entity().id, orderSaveReq(this.form)));
      this.#unsaved.markPristine();
      this.#notify.success('\u0110\xE3 c\u1EADp nh\u1EADt \u0111\u01A1n h\xE0ng.');
      await this.#router.navigate(['../detail'], { relativeTo: this.#route, replaceUrl: true });
    } catch (error) {
      if (this.apiErrors.set(error)) this.#focusFirstInvalid();
      else this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng th\u1EC3 l\u01B0u. D\u1EEF li\u1EC7u \u0111\xE3 nh\u1EADp v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF.'));
    } finally {
      this.saving.set(false);
    }
  }

  #focusFirstInvalid(): void {
    afterNextRender(() => focusFirstInvalid(this.#host), { injector: this.#injector });
  }
}
`,"features/order/routes.ts":`import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { CustomerService } from '../customer/services/customer.service';
import { ProductService } from '../product/services/product.service';
import { entityResolver, updatableEntityResolver } from './entity.resolver';
import { OrderService } from './services/order.service';

/**
 * Chi ti\u1EBFt l\xE0 route con c\u1EE7a danh s\xE1ch (drawer ho\u1EB7c trang theo \`detail\`); t\u1EA1o v\xE0 c\u1EADp nh\u1EADt l\xE0 trang thay ch\u1ED7 danh s\xE1ch
 * (\`data.detail: 'page'\`). CustomerService v\xE0 ProductService \u0111\u01B0\u1EE3c c\u1EA5p \u1EDF \u0111\xE2y cho \`customer-select\`, \`product-select\`
 * v\xE0 c\xE1c pipe relation: \u0111\u01A1n h\xE0ng d\xF9ng wrapper c\u1EE7a feature s\u1EDF h\u1EEFu entity, kh\xF4ng t\u1EF1 g\u1ECDi API c\u1EE7a entity kh\xE1c.
 */
export const routes: Routes = [
  {
    path: '',
    providers: [OrderService, CustomerService, ProductService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: '\u0110\u01A1n h\xE0ng',
        data: { permission: 'PATTERN_ORDER_R_LIST' },
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
        children: [
          {
            path: 'create',
            title: 'T\u1EA1o m\u1EDBi \u0111\u01A1n h\xE0ng',
            data: { permission: 'PATTERN_ORDER_C_CREATE', detail: 'page' },
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () => import('./pages/create/create.component').then(module => module.CreateComponent),
          },
          {
            path: ':id/detail',
            title: 'Chi ti\u1EBFt \u0111\u01A1n h\xE0ng',
            data: { permission: 'PATTERN_ORDER_R_DETAIL' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () => import('./pages/detail/detail.component').then(module => module.DetailComponent),
          },
          {
            path: ':id/update',
            title: 'C\u1EADp nh\u1EADt \u0111\u01A1n h\xE0ng',
            data: { permission: 'PATTERN_ORDER_U_UPDATE', detail: 'page' },
            resolve: { entity: updatableEntityResolver },
            runGuardsAndResolvers: 'paramsChange',
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () => import('./pages/update/update.component').then(module => module.UpdateComponent),
          },
        ],
      },
    ],
  },
];
`,"features/order/services/order.model.ts":`import type { SdBadgeData } from '@sdcorejs/angular/components/badge';
import type { PagingReq, PagingRes } from '@sdcorejs/utils/models';

export type OrderStatus = 'pending' | 'shipping' | 'done' | 'cancelled';
export type OrderApproval = 'draft' | 'submitted' | 'approved' | 'rejected';

export const ORDER_STATUS_OPTIONS = [
  { id: 'pending', name: 'Ch\u1EDD x\xE1c nh\u1EADn', color: 'warning' },
  { id: 'shipping', name: '\u0110ang giao', color: 'info' },
  { id: 'done', name: 'Ho\xE0n t\u1EA5t', color: 'success' },
  { id: 'cancelled', name: '\u0110\xE3 hu\u1EF7', color: 'secondary' },
] satisfies { id: OrderStatus; name: string; color: SdBadgeData['color'] }[];

export const ORDER_APPROVAL_OPTIONS = [
  { id: 'draft', name: 'Nh\xE1p', color: 'secondary' },
  { id: 'submitted', name: 'Ch\u1EDD duy\u1EC7t', color: 'warning' },
  { id: 'approved', name: '\u0110\xE3 duy\u1EC7t', color: 'success' },
  { id: 'rejected', name: 'B\u1ECB t\u1EEB ch\u1ED1i', color: 'error' },
] satisfies { id: OrderApproval; name: string; color: SdBadgeData['color'] }[];

export const ORDER_CHANNELS = ['Online', 'C\u1EEDa h\xE0ng', '\u0110\u1EA1i l\xFD'] as const;
export const ORDER_WAREHOUSES = ['H\xE0 N\u1ED9i', 'TP.HCM', '\u0110\xE0 N\u1EB5ng'] as const;
export const ORDER_PAYMENTS = ['Ti\u1EC1n m\u1EB7t', 'Chuy\u1EC3n kho\u1EA3n', 'COD'] as const;

export interface OrderLineDto {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface OrderApprovalStepDto {
  readonly action: 'submit' | 'approve' | 'reject';
  readonly by: string;
  readonly at: string;
  readonly reason?: string;
}

export interface OrderDto {
  readonly id: string;
  readonly code: string;
  readonly customerId: string;
  /** T\xEAn kh\xE1ch l\xFAc l\u1EADp \u0111\u01A1n: ch\u1EE9ng t\u1EEB gi\u1EEF snapshot, kh\xF4ng \u0111\u1ED5i theo danh m\u1EE5c kh\xE1ch h\xE0ng. */
  readonly customer: string;
  readonly channel: string;
  readonly warehouse: string;
  readonly payment: string;
  readonly createdAt: string;
  readonly deliveredAt: string | null;
  /** T\u1ED5ng ti\u1EC1n (\u20AB). */
  readonly total: number;
  readonly status: OrderStatus;
  readonly approval: OrderApproval;
  readonly approvalHistory: readonly OrderApprovalStepDto[];
  readonly lines: readonly OrderLineDto[];
  readonly creator: string;
  readonly source: string;
  readonly tracking: string | null;
  readonly note: string | null;
  readonly cancelReason: string | null;
}

export type OrderListReq = PagingReq<OrderDto>;
export type OrderListRes = PagingRes<OrderDto>;

/** S\u1ED1 \u0111\u01A1n theo tr\u1EA1ng th\xE1i v\xE0 doanh thu ho\xE0n t\u1EA5t, c\xF9ng b\u1ED9 l\u1ECDc v\u1EDBi danh s\xE1ch (tr\u1EEB tr\u1EA1ng th\xE1i \u0111ang ch\u1ECDn). */
export type OrderCounts = Record<'all' | OrderStatus | 'revenue', number>;

export interface OrderSaveReq {
  readonly customerId: string;
  readonly channel: string;
  readonly warehouse: string;
  readonly payment: string;
  readonly note: string | null;
  readonly lines: readonly OrderLineDto[];
}

/** T\xE1c v\u1EE5 \u0111\u1ED5i tr\u1EA1ng th\xE1i c\u1EE7a \u0111\u01A1n; \`cancel\` v\xE0 \`reject\` b\u1EAFt bu\u1ED9c l\xFD do. */
export type OrderAction = 'confirm' | 'cancel' | 'submit' | 'approve' | 'reject';

export interface OrderActionReq {
  readonly id: string;
  readonly reason?: string;
}

/** K\u1EBFt qu\u1EA3 t\u1EEBng \u0111\u01A1n c\u1EE7a m\u1ED9t t\xE1c v\u1EE5 h\xE0ng lo\u1EA1t: API tr\u1EA3 \u0111\u1EE7 th\xE0nh c\xF4ng l\u1EABn th\u1EA5t b\u1EA1i. */
export interface OrderBulkItemRes {
  readonly id: string;
  readonly ok: boolean;
  readonly message?: string;
}

export interface OrderBulkRes {
  readonly results: readonly OrderBulkItemRes[];
}

export function orderStatusBadge(status: OrderStatus): SdBadgeData {
  const option = ORDER_STATUS_OPTIONS.find(item => item.id === status);
  return { type: 'round', title: option?.name ?? status, color: option?.color };
}

export function orderApprovalBadge(approval: OrderApproval): SdBadgeData {
  const option = ORDER_APPROVAL_OPTIONS.find(item => item.id === approval);
  return { type: 'tag', title: option?.name ?? approval, color: option?.color };
}

/** \u0110\u01A1n c\xF2n s\u1EEDa \u0111\u01B0\u1EE3c: ch\u1EDD x\xE1c nh\u1EADn, ch\u01B0a g\u1EEDi duy\u1EC7t ho\u1EB7c \u0111\xE3 b\u1ECB t\u1EEB ch\u1ED1i. */
export function canUpdateOrder(order: OrderDto): boolean {
  return order.status === 'pending' && (order.approval === 'draft' || order.approval === 'rejected');
}
`,"features/order/services/order.service.ts":`import { HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { tap, type Observable } from 'rxjs';
import type { Filter } from '@sdcorejs/utils/models';
import { BaseApiService } from '../../../services/base-api.service';
import type {
  OrderAction,
  OrderActionReq,
  OrderBulkRes,
  OrderCounts,
  OrderDto,
  OrderListReq,
  OrderListRes,
  OrderSaveReq,
} from './order.model';

@Injectable()
export class OrderService extends BaseApiService {
  readonly #changes = signal(0);
  /** T\u0103ng sau m\u1ED7i l\u1EA7n l\u01B0u ho\u1EB7c \u0111\u1ED5i tr\u1EA1ng th\xE1i th\xE0nh c\xF4ng: danh s\xE1ch ch\u1EC9 t\u1EA3i l\u1EA1i khi c\xF3 thay \u0111\u1ED5i. */
  readonly changes = this.#changes.asReadonly();

  list(req: OrderListReq): Observable<OrderListRes> {
    return this.http.get<OrderListRes>(this.apiUrl('orders'), { params: this.buildPagingReq(req) });
  }

  /** S\u1ED1 \u0111\u01A1n c\u1EE7a tab v\xE0 score card, theo c\xF9ng b\u1ED9 l\u1ECDc c\u1EE7a danh s\xE1ch. */
  counts(filters: Filter<OrderDto>[]): Observable<OrderCounts> {
    return this.http.get<OrderCounts>(this.apiUrl('orders', 'counts'), {
      params: new HttpParams().set('filters', JSON.stringify(filters)),
    });
  }

  detail(id: string): Observable<OrderDto> {
    return this.http.get<OrderDto>(this.apiUrl('orders', id));
  }

  create(req: OrderSaveReq): Observable<OrderDto> {
    return this.http.post<OrderDto>(this.apiUrl('orders'), req).pipe(tap(() => this.#changed()));
  }

  update(id: string, req: OrderSaveReq): Observable<OrderDto> {
    return this.http.put<OrderDto>(this.apiUrl('orders', id), req).pipe(tap(() => this.#changed()));
  }

  /** M\u1ED9t t\xE1c v\u1EE5 tr\xEAn m\u1ED9t \u0111\u01A1n; tr\u1EA3 \u0111\u01A1n sau khi \u0111\u1ED5i tr\u1EA1ng th\xE1i. */
  act(action: OrderAction, req: OrderActionReq): Observable<OrderDto> {
    const { id, ...body } = req;
    return this.http.post<OrderDto>(this.apiUrl('orders', id, action), body).pipe(tap(() => this.#changed()));
  }

  /**
   * M\u1ED9t t\xE1c v\u1EE5 tr\xEAn nhi\u1EC1u \u0111\u01A1n. API kh\xF4ng c\xF3 transaction cho c\u1EA3 l\xF4: k\u1EBFt qu\u1EA3 c\xF3 t\u1EEBng \u0111\u01A1n th\xE0nh c\xF4ng ho\u1EB7c th\u1EA5t b\u1EA1i,
   * n\xEAn lu\xF4n \u0111\u1ECDc \`results\` thay v\xEC coi request th\xE0nh c\xF4ng l\xE0 th\xE0nh c\xF4ng to\xE0n b\u1ED9.
   */
  bulk(action: OrderAction, reqs: readonly OrderActionReq[]): Observable<OrderBulkRes> {
    return this.http.post<OrderBulkRes>(this.apiUrl('orders', 'bulk', action), { items: reqs }).pipe(tap(() => this.#changed()));
  }

  #changed(): void {
    this.#changes.update(count => count + 1);
  }
}
`,"features/partner/pages/create/create.component.ts":`import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, merge } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdInform } from '@sdcorejs/angular/components/inform';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdStep, SdStepper } from '@sdcorejs/angular/components/stepper';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdSegmentedComponent } from '@sdcorejs/angular/forms/segmented';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdFormatDatetimePipe } from '@sdcorejs/angular/pipes';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { apiErrorMessage, apiFieldErrors } from '../../../../utils/api-error';
import { PartnerService } from '../../services/partner.service';
import { PARTNER_TYPE_OPTIONS, type PartnerSaveReq, type PartnerType } from '../../services/partner.model';

/** B\u1EA3n nh\xE1p gi\u1EEF trong tab tr\xECnh duy\u1EC7t: t\u1EA3i l\u1EA1i trang v\u1EABn ti\u1EBFp t\u1EE5c \u0111\u01B0\u1EE3c. */
interface PartnerDraft extends PartnerSaveReq {
  readonly step: number;
  readonly savedAt: string;
}

const DRAFT_KEY = 'pattern.partner.create.draft';
const EMPTY: PartnerSaveReq = {
  code: '',
  type: 'individual',
  name: '',
  identity: '',
  representative: null,
  email: '',
  phone: '',
  address: '',
};

function readDraft(): PartnerDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as PartnerDraft) : null;
  } catch {
    return null;
  }
}

function writeDraft(draft: PartnerDraft | null): void {
  try {
    if (draft) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Kh\xF4ng l\u01B0u \u0111\u01B0\u1EE3c nh\xE1p (ch\u1EBF \u0111\u1ED9 ri\xEAng t\u01B0, h\u1EBFt dung l\u01B0\u1EE3ng): flow v\u1EABn ch\u1EA1y, ch\u1EC9 kh\xF4ng kh\xF4i ph\u1EE5c sau khi t\u1EA3i l\u1EA1i.
  }
}

/**
 * Pattern flow d\u1ECDc: \`sd-page\` h\u1EB9p + \`sd-stepper\` d\u1ECDc, n\xFAt b\u01B0\u1EDBc \u1EDF footer. B\u01B0\u1EDBc 2 r\u1EBD nh\xE1nh theo lo\u1EA1i \u0111\u1ED1i t\xE1c; r\u1EDDi b\u01B0\u1EDBc 1
 * th\xEC ki\u1EC3m tra tr\xF9ng m\xE3 v\u1EDBi API; m\u1ECDi thay \u0111\u1ED5i \u0111\u01B0\u1EE3c l\u01B0u nh\xE1p v\xE0 kh\xF4i ph\u1EE5c khi t\u1EA3i l\u1EA1i trang.
 */
@Component({
  selector: 'create',
  standalone: true,
  imports: [
    SdPageComponent,
    SdStepper,
    SdStep,
    SdButton,
    SdInform,
    SdSection,
    SdSectionItem,
    SdInput,
    SdSegmentedComponent,
    SdFormatDatetimePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @let value = seed();
    <sd-page title="T\u1EA1o \u0111\u1ED1i t\xE1c" description="\u0110\u1ED1i t\xE1c c\xE1 nh\xE2n ho\u1EB7c doanh nghi\u1EC7p." [backLink]="['../..']" width="narrow">
      @if (restored(); as draft) {
        <sd-inform
          info
          class="mt-16"
          autoId="partner-draft"
          [description]="'\u0110\xE3 kh\xF4i ph\u1EE5c b\u1EA3n nh\xE1p l\u01B0u l\xFAc ' + (draft.savedAt | sdFormatDatetime) + '.'"
          actionLabel="B\u1ECF nh\xE1p"
          (sdAction)="discard()" />
      }
      <sd-stepper linear orientation="vertical" animationDuration="0ms" autoId="partner-steps" [(selectedIndex)]="step">
        <sd-step label="Lo\u1EA1i v\xE0 m\xE3 \u0111\u1ED1i t\xE1c" [stepControl]="kind">
          <div class="d-flex flex-column gap-8 py-8">
            <sd-segmented
              name="type"
              ariaLabel="Lo\u1EA1i \u0111\u1ED1i t\xE1c"
              autoId="partner-type"
              [form]="kind"
              [items]="types"
              [model]="value.type"
              (sdChange)="type.set($any($event) ?? 'individual')" />
            <sd-input
              label="M\xE3 \u0111\u1ED1i t\xE1c"
              name="code"
              autoId="partner-code"
              [form]="kind"
              [model]="value.code"
              [inlineError]="codeError() ?? undefined"
              maxlength="20"
              required />
          </div>
        </sd-step>
        <sd-step [label]="type() === 'business' ? 'Th\xF4ng tin doanh nghi\u1EC7p' : 'Th\xF4ng tin c\xE1 nh\xE2n'" [stepControl]="identity">
          <div class="d-flex flex-column gap-8 py-8">
            @if (type() === 'business') {
              <sd-input label="T\xEAn doanh nghi\u1EC7p" name="name" autoId="partner-name" [form]="identity" [model]="value.name" required />
              <sd-input
                label="M\xE3 s\u1ED1 thu\u1EBF"
                name="identity"
                autoId="partner-identity"
                [form]="identity"
                [model]="value.identity"
                maxlength="14"
                required />
              <sd-input
                label="Ng\u01B0\u1EDDi \u0111\u1EA1i di\u1EC7n"
                name="representative"
                autoId="partner-representative"
                [form]="identity"
                [model]="value.representative"
                required />
            } @else {
              <sd-input label="H\u1ECD v\xE0 t\xEAn" name="name" autoId="partner-name" [form]="identity" [model]="value.name" required />
              <sd-input
                label="S\u1ED1 CCCD"
                name="identity"
                autoId="partner-identity"
                [form]="identity"
                [model]="value.identity"
                maxlength="12"
                required />
            }
          </div>
        </sd-step>
        <sd-step label="Li\xEAn h\u1EC7" [stepControl]="contact">
          <div class="d-flex flex-column gap-8 py-8">
            <sd-input label="Email" name="email" autoId="partner-email" [form]="contact" [model]="value.email" pattern="EMAIL" required />
            <sd-input
              label="\u0110i\u1EC7n tho\u1EA1i"
              name="phone"
              autoId="partner-phone"
              [form]="contact"
              [model]="value.phone"
              maxlength="15"
              required />
            <sd-input label="\u0110\u1ECBa ch\u1EC9" name="address" autoId="partner-address" [form]="contact" [model]="value.address" maxlength="200" />
          </div>
        </sd-step>
        <sd-step label="X\xE1c nh\u1EADn">
          @let summary = request();
          <sd-section title="Ki\u1EC3m tra l\u1EA1i" class="d-block my-8">
            <sd-section-item label="M\xE3 \u0111\u1ED1i t\xE1c">{{ summary.code }}</sd-section-item>
            <sd-section-item label="Lo\u1EA1i">{{ summary.type === 'business' ? 'Doanh nghi\u1EC7p' : 'C\xE1 nh\xE2n' }}</sd-section-item>
            <sd-section-item label="T\xEAn">{{ summary.name }}</sd-section-item>
            <sd-section-item [label]="summary.type === 'business' ? 'M\xE3 s\u1ED1 thu\u1EBF' : 'S\u1ED1 CCCD'">{{ summary.identity }}</sd-section-item>
            @if (summary.type === 'business') {
              <sd-section-item label="Ng\u01B0\u1EDDi \u0111\u1EA1i di\u1EC7n">{{ summary.representative }}</sd-section-item>
            }
            <sd-section-item label="Email">{{ summary.email }}</sd-section-item>
            <sd-section-item label="\u0110i\u1EC7n tho\u1EA1i">{{ summary.phone }}</sd-section-item>
          </sd-section>
        </sd-step>
      </sd-stepper>
      <sd-button
        sdFooterLeft
        title="Quay l\u1EA1i"
        type="outline"
        autoId="partner-previous"
        [disabled]="step() === 0"
        (click)="step.set(step() - 1)" />
      @if (step() < 3) {
        <sd-button
          sdFooterRight
          title="Ti\u1EBFp t\u1EE5c"
          type="fill"
          color="primary"
          autoId="partner-next"
          [loading]="checking()"
          (click)="next()" />
      } @else {
        <sd-button
          sdFooterRight
          title="T\u1EA1o \u0111\u1ED1i t\xE1c"
          type="fill"
          color="primary"
          autoId="partner-save"
          [loading]="saving()"
          (click)="save()" />
      }
    </sd-page>
  \`,
})
export class CreateComponent {
  readonly #partnerService = inject(PartnerService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #draft = readDraft();
  protected readonly types = PARTNER_TYPE_OPTIONS;
  /** Gi\xE1 tr\u1ECB ban \u0111\u1EA7u c\u1EE7a c\xE1c field: b\u1EA3n nh\xE1p n\u1EBFu c\xF3. */
  protected readonly seed = signal<PartnerSaveReq>(this.#draft ?? EMPTY);
  protected readonly restored = signal<PartnerDraft | null>(this.#draft);
  protected readonly step = signal(this.#draft?.step ?? 0);
  protected readonly type = signal<PartnerType>(this.#draft?.type ?? 'individual');
  // M\u1ED7i b\u01B0\u1EDBc m\u1ED9t FormGroup: stepper \`linear\` kh\xF4ng cho sang b\u01B0\u1EDBc sau khi b\u01B0\u1EDBc hi\u1EC7n t\u1EA1i c\xF2n l\u1ED7i.
  protected readonly kind = new FormGroup({});
  protected readonly identity = new FormGroup({});
  protected readonly contact = new FormGroup({});
  protected readonly codeError = signal<string | null>(null);
  protected readonly checking = signal(false);
  protected readonly saving = signal(false);
  readonly #values = signal(0);
  /** \u0110\xE3 t\u1EA1o xong: khi trang \u0111\xF3ng, field g\u1EE1 control kh\u1ECFi form v\xE0 ph\xE1t valueChanges; kh\xF4ng \u0111\u01B0\u1EE3c ghi l\u1EA1i nh\xE1p v\u1EEBa xo\xE1. */
  #created = false;
  protected readonly request = computed<PartnerSaveReq>(() => {
    this.#values();
    // why: n\u1ED9i dung b\u01B0\u1EDBc ch\u1EC9 t\u1EA1o khi b\u01B0\u1EDBc \u0111\u01B0\u1EE3c m\u1EDF; b\u01B0\u1EDBc ch\u01B0a m\u1EDF l\u1EA1i sau khi kh\xF4i ph\u1EE5c nh\xE1p l\u1EA5y gi\xE1 tr\u1ECB c\u1EE7a nh\xE1p.
    const value = {
      ...this.seed(),
      ...this.kind.getRawValue(),
      ...this.identity.getRawValue(),
      ...this.contact.getRawValue(),
    } as Partial<PartnerSaveReq>;
    const type = this.type();
    return {
      code: (value.code ?? '').trim().toUpperCase(),
      type,
      name: value.name ?? '',
      identity: value.identity ?? '',
      representative: type === 'business' ? (value.representative ?? '') : null,
      email: value.email ?? '',
      phone: value.phone ?? '',
      address: value.address ?? '',
    };
  });

  constructor() {
    // M\u1ED7i thay \u0111\u1ED5i l\u01B0u nh\xE1p; m\xE3 \u0111\u1ED5i th\xEC b\u1ECF l\u1ED7i tr\xF9ng m\xE3 c\u0169.
    const subscription = merge(this.kind.valueChanges, this.identity.valueChanges, this.contact.valueChanges).subscribe(() => {
      if (this.#created) return;
      this.#values.update(count => count + 1);
      this.#saveDraft();
    });
    const code = this.kind.valueChanges.subscribe(() => this.codeError.set(null));
    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      code.unsubscribe();
    });
  }

  protected async next(): Promise<void> {
    const step = this.step();
    const group = [this.kind, this.identity, this.contact][step];
    group.markAllAsTouched();
    if (group.invalid) return;
    if (step === 0 && !(await this.#codeAvailable())) return;
    this.step.set(step + 1);
    this.#saveDraft();
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    try {
      const partner = await firstValueFrom(this.#partnerService.create(this.request()));
      this.#created = true;
      writeDraft(null);
      this.#notify.success(\`\u0110\xE3 t\u1EA1o \u0111\u1ED1i t\xE1c \${partner.code}.\`);
      await this.#router.navigate(['../..'], { relativeTo: this.#route });
    } catch (error) {
      const fields = apiFieldErrors(error);
      if (fields['code']) {
        // M\xE3 v\u1EEBa b\u1ECB ng\u01B0\u1EDDi kh\xE1c d\xF9ng: quay l\u1EA1i b\u01B0\u1EDBc nh\u1EADp m\xE3, d\u1EEF li\u1EC7u c\xE1c b\u01B0\u1EDBc kh\xE1c gi\u1EEF nguy\xEAn.
        this.codeError.set(fields['code']);
        this.step.set(0);
      } else this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng t\u1EA1o \u0111\u01B0\u1EE3c \u0111\u1ED1i t\xE1c. D\u1EEF li\u1EC7u v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF trong b\u1EA3n nh\xE1p.'));
    } finally {
      this.saving.set(false);
    }
  }

  protected async discard(): Promise<void> {
    try {
      await this.#confirm.confirm('Xo\xE1 b\u1EA3n nh\xE1p v\xE0 nh\u1EADp l\u1EA1i t\u1EEB \u0111\u1EA7u?', {
        title: 'B\u1ECF nh\xE1p',
        yesTitle: 'B\u1ECF nh\xE1p',
        noTitle: 'Gi\u1EEF l\u1EA1i',
        yesButtonColor: 'warning',
      });
    } catch {
      return;
    }
    writeDraft(null);
    this.restored.set(null);
    this.step.set(0);
    this.type.set('individual');
    this.seed.set({ ...EMPTY });
  }

  async #codeAvailable(): Promise<boolean> {
    this.checking.set(true);
    try {
      const { available } = await firstValueFrom(this.#partnerService.checkCode(this.request().code));
      if (!available) this.codeError.set(\`M\xE3 \${this.request().code} \u0111\xE3 \u0111\u01B0\u1EE3c d\xF9ng.\`);
      return available;
    } catch (error) {
      this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng ki\u1EC3m tra \u0111\u01B0\u1EE3c m\xE3. Th\u1EED l\u1EA1i.'));
      return false;
    } finally {
      this.checking.set(false);
    }
  }

  #saveDraft(): void {
    writeDraft({ ...this.request(), step: this.step(), savedAt: new Date().toISOString() });
  }
}
`,"features/partner/routes.ts":`import type { Routes } from '@angular/router';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { PartnerService } from './services/partner.service';

export const routes: Routes = [
  {
    path: '',
    providers: [PartnerService],
    canActivateChild: [SdPermissionGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'create' },
      {
        path: 'create',
        title: 'T\u1EA1o \u0111\u1ED1i t\xE1c',
        data: { permission: 'PATTERN_PARTNER_C_CREATE' },
        loadComponent: () => import('./pages/create/create.component').then(module => module.CreateComponent),
      },
    ],
  },
];
`,"features/partner/services/partner.model.ts":`export type PartnerType = 'individual' | 'business';

export const PARTNER_TYPE_OPTIONS = [
  { value: 'individual', label: 'C\xE1 nh\xE2n' },
  { value: 'business', label: 'Doanh nghi\u1EC7p' },
] satisfies { value: PartnerType; label: string }[];

export interface PartnerDto {
  readonly id: string;
  readonly code: string;
  readonly type: PartnerType;
  readonly name: string;
  /** CCCD c\u1EE7a c\xE1 nh\xE2n ho\u1EB7c m\xE3 s\u1ED1 thu\u1EBF c\u1EE7a doanh nghi\u1EC7p. */
  readonly identity: string;
  readonly representative: string | null;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
}

export interface PartnerSaveReq {
  readonly code: string;
  readonly type: PartnerType;
  readonly name: string;
  readonly identity: string;
  readonly representative: string | null;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
}
`,"features/partner/services/partner.service.ts":`import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { BaseApiService } from '../../../services/base-api.service';
import type { PartnerDto, PartnerSaveReq } from './partner.model';

@Injectable()
export class PartnerService extends BaseApiService {
  /** M\xE3 c\xF2n d\xF9ng \u0111\u01B0\u1EE3c kh\xF4ng; g\u1ECDi khi r\u1EDDi b\u01B0\u1EDBc nh\u1EADp m\xE3, API v\u1EABn ki\u1EC3m tra l\u1EA1i l\xFAc l\u01B0u. */
  checkCode(code: string): Observable<{ available: boolean }> {
    return this.http.get<{ available: boolean }>(this.apiUrl('partners', 'check-code'), { params: new HttpParams().set('code', code) });
  }

  create(req: PartnerSaveReq): Observable<PartnerDto> {
    return this.http.post<PartnerDto>(this.apiUrl('partners'), req);
  }
}
`,"features/product/components/general-information-form/general-information-form.component.ts":`import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FormControl, FormGroup } from '@angular/forms';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import type { ProductSaveReq, ProductStatus } from '../../services/product.model';
import { ProductStatusSelectComponent } from '../product-status-select/product-status-select.component';

/** C\xE1c field Core t\u1EF1 \u0111\u0103ng k\xFD control qua \`[form]\` + \`name\`; page kh\xF4ng khai b\xE1o tr\u01B0\u1EDBc control tr\xF9ng t\xEAn. */
export type ProductForm = FormGroup<{
  code?: FormControl<string>;
  name?: FormControl<string>;
  unit?: FormControl<string>;
  price?: FormControl<number>;
  status?: FormControl<ProductStatus>;
}>;

/** Gi\xE1 tr\u1ECB form \u2192 request l\u01B0u. \`code\` truy\u1EC1n v\xE0o khi c\u1EADp nh\u1EADt (m\xE3 b\u1ECB kho\xE1). */
export function productSaveReq(form: ProductForm, code?: string): ProductSaveReq {
  const value = form.getRawValue();
  return {
    code: code ?? value.code ?? '',
    name: value.name ?? '',
    unit: value.unit ?? '',
    price: value.price ?? 0,
    status: value.status ?? 'active',
  };
}

/** Nh\xF3m "Th\xF4ng tin chung" c\u1EE7a form s\u1EA3n ph\u1EA9m, d\xF9ng chung cho t\u1EA1o m\u1EDBi v\xE0 c\u1EADp nh\u1EADt. */
@Component({
  selector: 'general-information-form',
  standalone: true,
  imports: [SdInput, SdInputNumber, SdSection, ProductStatusSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<sd-section title="Th\xF4ng tin chung">
    <div class="row px-16 pt-16 pb-8">
      <div class="col-12 col-md-6">
        <sd-input
          label="M\xE3 s\u1EA3n ph\u1EA9m"
          name="code"
          autoId="product-code"
          [form]="form()"
          [model]="seed().code"
          [disabled]="editing()"
          [inlineError]="errors()['code']"
          maxlength="20"
          required />
      </div>
      <div class="col-12 col-md-6">
        <sd-input
          label="T\xEAn s\u1EA3n ph\u1EA9m"
          name="name"
          autoId="product-name"
          [form]="form()"
          [model]="seed().name"
          [inlineError]="errors()['name']"
          maxlength="100"
          required />
      </div>
      <div class="col-12 col-md-6">
        <sd-input label="\u0110\u01A1n v\u1ECB t\xEDnh" name="unit" autoId="product-unit" [form]="form()" [model]="seed().unit" maxlength="20" />
      </div>
      <div class="col-12 col-md-6">
        <sd-input-number
          label="Gi\xE1 b\xE1n (\u20AB)"
          name="price"
          autoId="product-price"
          type="positive"
          [precision]="0"
          [form]="form()"
          [model]="seed().price"
          [inlineError]="errors()['price']"
          required />
      </div>
      <div class="col-12 col-md-6">
        <product-status-select [form]="form()" [model]="seed().status" />
      </div>
    </div>
  </sd-section>\`,
})
export class GeneralInformationFormComponent {
  readonly form = input.required<FormGroup>();
  readonly seed = input.required<ProductSaveReq>();
  readonly editing = input(false);
  /** L\u1ED7i theo field do API tr\u1EA3 v\u1EC1. */
  readonly errors = input<Readonly<Record<string, string>>>({});
}
`,"features/product/components/product-select/product-select.component.ts":`import { booleanAttribute, ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SdItemDefDefDirective } from '@sdcorejs/angular/forms/directives';
import type { SdSearchReq } from '@sdcorejs/angular/forms/models';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import type { Filter, Size } from '@sdcorejs/utils/models';
import { ProductService } from '../../services/product.service';
import type { ProductDto } from '../../services/product.model';

/**
 * Ch\u1ECDn s\u1EA3n ph\u1EA9m cho m\xE0n kh\xE1c (d\xF2ng \u0111\u01A1n h\xE0ng). L\u1EF1a ch\u1ECDn m\u1EDBi ch\u1EC9 g\u1ED3m s\u1EA3n ph\u1EA9m \u0111ang ho\u1EA1t \u0111\u1ED9ng; gi\xE1 tr\u1ECB \u0111\xE3 ch\u1ECDn
 * \u0111\u01B0\u1EE3c t\u1EA3i theo ID (\`VALUE\`) n\xEAn s\u1EA3n ph\u1EA9m \u0111\xE3 ng\u1EEBng v\u1EABn hi\u1EC3n th\u1ECB khi c\u1EADp nh\u1EADt. Option hai d\xF2ng: t\xEAn \xB7 m\xE3 \xB7 \u0111\u01A1n v\u1ECB.
 * \`size\`, \`hideInlineError\` v\xE0 \`inlineError\` chuy\u1EC3n th\u1EB3ng xu\u1ED1ng \`sd-select\`, \u0111\u1EC3 d\xF9ng \u0111\u01B0\u1EE3c trong \xF4 c\u1EE7a b\u1EA3ng.
 */
@Component({
  selector: 'product-select',
  standalone: true,
  imports: [SdSelect, SdItemDefDefDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<sd-select
    [label]="label()"
    [name]="name()"
    [form]="form()"
    [(model)]="model"
    [items]="search"
    valueField="id"
    displayField="name"
    [required]="required()"
    [size]="size()"
    [hideInlineError]="hideInlineError()"
    [inlineError]="inlineError()"
    [autoId]="autoId()">
    <ng-template sdItemDef let-item="item">
      <div class="d-flex flex-column">
        <span>{{ item.name }}</span>
        <small class="text-secondary">{{ item.code }} \xB7 {{ item.unit }}{{ item.status === 'inactive' ? ' \xB7 Ng\u1EEBng ho\u1EA1t \u0111\u1ED9ng' : '' }}</small>
      </div>
    </ng-template>
  </sd-select>\`,
})
export class ProductSelectComponent {
  readonly #productService = inject(ProductService);
  readonly form = input<FormGroup>();
  readonly name = input('productId');
  readonly label = input<string | undefined>('S\u1EA3n ph\u1EA9m');
  readonly required = input(false, { transform: booleanAttribute });
  readonly size = input<Size>('md');
  readonly hideInlineError = input(false, { transform: booleanAttribute });
  /** L\u1ED7i c\u1EE7a API cho field n\xE0y (vd \`lines.0.productId\`). */
  readonly inlineError = input<string>();
  readonly autoId = input<string>();
  readonly model = model<string | null | undefined>();

  protected readonly search = async (req: SdSearchReq): Promise<ProductDto[]> => {
    if (req.type === 'VALUE') {
      const ids = (Array.isArray(req.value) ? req.value : [req.value]).filter((id): id is string => !!id);
      return Promise.all(ids.map(id => firstValueFrom(this.#productService.cachedDetail(id))));
    }
    const filters: Filter<ProductDto>[] = [{ field: 'status', operator: 'EQUAL', data: 'active' }];
    if (req.searchText) {
      filters.push({
        operator: 'OR',
        data: [
          { field: 'name', operator: 'CONTAIN', data: req.searchText },
          { field: 'code', operator: 'CONTAIN', data: req.searchText },
        ],
      });
    }
    const res = await firstValueFrom(this.#productService.list({ pageNumber: 0, pageSize: 20, filters }));
    return res.items;
  };
}
`,"features/product/components/product-status-select/product-status-select.component.ts":`import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { PRODUCT_STATUS_OPTIONS, type ProductStatus } from '../../services/product.model';

/** Dropdown tr\u1EA1ng th\xE1i s\u1EA3n ph\u1EA9m: options v\xE0 label thu\u1ED9c feature, n\u01A1i d\xF9ng ch\u1EC9 bind model/form. */
@Component({
  selector: 'product-status-select',
  standalone: true,
  imports: [SdSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<sd-select
    [label]="label()"
    [name]="name()"
    [form]="form()"
    [(model)]="model"
    [items]="options"
    valueField="id"
    displayField="name"
    [required]="required()"
    [clearable]="false" />\`,
})
export class ProductStatusSelectComponent {
  readonly form = input<FormGroup>();
  readonly name = input('status');
  readonly label = input('Tr\u1EA1ng th\xE1i');
  readonly required = input(true);
  readonly model = model<ProductStatus | null | undefined>();
  protected readonly options = PRODUCT_STATUS_OPTIONS;
}
`,"features/product/entity.resolver.ts":`import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { map, timeout } from 'rxjs';
import { ProductService } from './services/product.service';
import type { ProductDto } from './services/product.model';

/** T\u1EA3i s\u1EA3n ph\u1EA9m tr\u01B0\u1EDBc khi m\u1EDF detail/update; l\u1ED7i (404, 403, timeout) \u0111i t\u1EDBi navigation error handler c\u1EE7a host. */
export const entityResolver: ResolveFn<ProductDto> = route => {
  const id = route.paramMap.get('id');
  if (!id?.trim()) throw new HttpErrorResponse({ status: 404 });
  return inject(ProductService)
    .detail(id)
    .pipe(
      timeout(10_000),
      map(entity => {
        if (!entity || entity.id !== id) throw new HttpErrorResponse({ status: 404 });
        return entity;
      })
    );
};
`,"features/product/pages/create/create.component.ts":`import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, Injector, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import {
  GeneralInformationFormComponent,
  productSaveReq,
  type ProductForm,
} from '../../components/general-information-form/general-information-form.component';
import { ProductService } from '../../services/product.service';
import type { ProductSaveReq } from '../../services/product.model';

@Component({
  selector: 'create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdPageComponent, SdButton, GeneralInformationFormComponent],
  template: \`
    <sd-page-form title="T\u1EA1o m\u1EDBi s\u1EA3n ph\u1EA9m" [backLink]="['..']">
      <div headerRight class="d-flex align-items-center gap-8">
        <sd-button title="Hu\u1EF7" type="outline" autoId="product-cancel" (click)="cancel()" />
        <sd-button
          title="T\u1EA1o s\u1EA3n ph\u1EA9m"
          prefixIcon="save"
          type="fill"
          color="primary"
          autoId="product-save"
          [loading]="saving()"
          (click)="save()" />
      </div>
      <div class="py-16">
        <general-information-form [form]="form" [seed]="seed" [errors]="apiErrors.errors()" />
      </div>
    </sd-page-form>
  \`,
})
export class CreateComponent {
  readonly #productService = inject(ProductService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  readonly #injector = inject(Injector);
  protected readonly seed: ProductSaveReq = { code: '', name: '', unit: 'C\xE1i', price: 0, status: 'active' };
  protected readonly form: ProductForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  // Dirty theo gi\xE1 tr\u1ECB: g\xF5 r\u1ED3i xo\xE1 v\u1EC1 nh\u01B0 c\u0169 th\xEC r\u1EDDi trang kh\xF4ng b\u1ECB h\u1ECFi.
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'product-create', dirty: 'value' });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#unsaved.destroy());
  }

  protected cancel(): void {
    void this.#router.navigate(['..'], { relativeTo: this.#route });
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.#focusFirstInvalid();
      return;
    }
    this.saving.set(true);
    try {
      const product = await firstValueFrom(this.#productService.create(productSaveReq(this.form)));
      this.#unsaved.markPristine();
      this.#notify.success(\`\u0110\xE3 t\u1EA1o s\u1EA3n ph\u1EA9m \${product.code}.\`);
      // replaceUrl: Back \u1EDF trang chi ti\u1EBFt v\u1EC1 danh s\xE1ch, kh\xF4ng quay l\u1EA1i form t\u1EA1o m\u1EDBi.
      await this.#router.navigate(['..', product.id, 'detail'], { relativeTo: this.#route, replaceUrl: true });
    } catch (error) {
      // L\u01B0u l\u1ED7i: gi\u1EEF nguy\xEAn d\u1EEF li\u1EC7u \u0111\xE3 nh\u1EADp; l\u1ED7i theo field hi\u1EC7n ngay tr\xEAn field.
      if (this.apiErrors.set(error)) this.#focusFirstInvalid();
      else this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng th\u1EC3 l\u01B0u. D\u1EEF li\u1EC7u \u0111\xE3 nh\u1EADp v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF.'));
    } finally {
      this.saving.set(false);
    }
  }

  #focusFirstInvalid(): void {
    afterNextRender(() => focusFirstInvalid(this.#host), { injector: this.#injector });
  }
}
`,"features/product/pages/detail/detail.component.ts":`import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective } from '@sdcorejs/angular/modules/permission';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { PRODUCT_STATUS_OPTIONS, productStatusBadge, type ProductDto } from '../../services/product.model';

@Component({
  selector: 'detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SdPageComponent, SdButton, SdSection, SdView, SdPermissionDirective, SdFormatNumberPipe],
  template: \`
    @let product = entity();
    <sd-page-detail [title]="'Chi ti\u1EBFt s\u1EA3n ph\u1EA9m #' + product.code" [description]="product.name" [badges]="badges()" [backLink]="['../..']">
      <sd-button
        headerRight
        *sdPermission="'PATTERN_PRODUCT_U_UPDATE'"
        title="C\u1EADp nh\u1EADt s\u1EA3n ph\u1EA9m"
        prefixIcon="edit"
        type="fill"
        color="primary"
        autoId="product-update"
        [routerLink]="['../update']" />
      <div class="d-flex flex-column gap-16 py-16">
        <sd-section title="Th\xF4ng tin chung">
          <div class="row p-8">
            <div class="col-12 col-md-6 p-8"><sd-view label="M\xE3 s\u1EA3n ph\u1EA9m" [display]="product.code" /></div>
            <div class="col-12 col-md-6 p-8"><sd-view label="T\xEAn s\u1EA3n ph\u1EA9m" [display]="product.name" /></div>
            <div class="col-12 col-md-6 p-8"><sd-view label="Tr\u1EA1ng th\xE1i" [display]="statusName()" /></div>
          </div>
        </sd-section>
        <sd-section title="Gi\xE1 b\xE1n">
          <div class="row p-8">
            <div class="col-12 col-md-6 p-8"><sd-view label="Gi\xE1 b\xE1n (\u20AB)" [display]="product.price | sdFormatNumber: 0" /></div>
            <div class="col-12 col-md-6 p-8"><sd-view label="\u0110\u01A1n v\u1ECB t\xEDnh" [display]="product.unit" /></div>
          </div>
        </sd-section>
      </div>
    </sd-page-detail>
  \`,
})
export class DetailComponent {
  /** S\u1EA3n ph\u1EA9m do resolver t\u1EA3i tr\u01B0\u1EDBc khi m\u1EDF trang; \u0111\u1ED5i ID th\xEC nh\u1EADn b\u1EA3n ghi m\u1EDBi. */
  protected readonly entity = toSignal(inject(ActivatedRoute).data.pipe(map(data => data['entity'] as ProductDto)), { requireSync: true });
  protected readonly badges = computed(() => [productStatusBadge(this.entity().status)]);
  protected readonly statusName = computed(() => PRODUCT_STATUS_OPTIONS.find(option => option.id === this.entity().status)?.name);
}
`,"features/product/pages/list/list.component.html":`<sd-page-list title="S\u1EA3n ph\u1EA9m" description="Danh m\u1EE5c s\u1EA3n ph\u1EA9m \u0111ang kinh doanh.">
  <div headerRight class="d-flex align-items-center gap-8 flex-wrap">
    <sd-button
      *sdPermission="'PATTERN_PRODUCT_R_MENU'"
      title="Nh\u1EADp/Xu\u1EA5t"
      suffixIcon="expand_more"
      type="outline"
      autoId="product-data-menu">
      <sd-button-item *sdPermission="'PATTERN_PRODUCT_C_IMPORT'" prefixIcon="upload" (click)="openImport()">Nh\u1EADp d\u1EEF li\u1EC7u</sd-button-item>
      <sd-button-item *sdPermission="'PATTERN_PRODUCT_R_EXPORT'" prefixIcon="download" (click)="exportData()">Xu\u1EA5t d\u1EEF li\u1EC7u</sd-button-item>
    </sd-button>
    <sd-button
      *sdPermission="'PATTERN_PRODUCT_C_CREATE'"
      title="T\u1EA1o m\u1EDBi"
      prefixIcon="add"
      type="fill"
      color="primary"
      autoId="product-create"
      [routerLink]="['create']" />
  </div>

  <sd-table autoId="product-list" [option]="tableOption">
    <ng-template sdTableCellDef="code" let-product="item">
      <a *sdPermission="'PATTERN_PRODUCT_R_DETAIL'" [routerLink]="[product.id, 'detail']">{{ product.code }}</a>
      @if (!canOpenDetail) {
        <span>{{ product.code }}</span>
      }
    </ng-template>
  </sd-table>
</sd-page-list>
`,"features/product/pages/list/list.component.ts":`import { ChangeDetectionStrategy, Component, effect, inject, untracked, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SdButton, SdButtonItem } from '@sdcorejs/angular/components/button';
import { SdTable, SdTableCellDefDirective, type SdTableOption } from '@sdcorejs/angular/components/table';
import { SdPageList } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { ProductService } from '../../services/product.service';
import { PRODUCT_STATUS_OPTIONS, productStatusBadge, type ProductDto } from '../../services/product.model';

@Component({
  selector: 'list',
  standalone: true,
  templateUrl: './list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SdPageList, SdButton, SdButtonItem, SdTable, SdTableCellDefDirective, SdPermissionDirective],
})
export class ListComponent {
  readonly #productService = inject(ProductService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  private readonly pageList = viewChild.required(SdPageList);
  private readonly table = viewChild.required(SdTable);
  // Route guard \u0111\xE3 n\u1EA1p quy\u1EC1n tr\u01B0\u1EDBc khi t\u1EA1o page; d\xF9ng cho text thay link khi thi\u1EBFu quy\u1EC1n xem chi ti\u1EBFt.
  protected readonly canOpenDetail = inject(SdPermissionService).hasPermission('PATTERN_PRODUCT_R_DETAIL');

  protected readonly tableOption: SdTableOption<ProductDto> = {
    type: 'server',
    items: (_, req) => firstValueFrom(this.#productService.list(req)),
    sort: { enable: true },
    filter: {
      quickSearch: {
        containFields: ['code', 'name'],
        placeholder: 'T\xECm theo m\xE3 ho\u1EB7c t\xEAn s\u1EA3n ph\u1EA9m',
      },
    },
    columns: [
      { field: 'code', title: 'M\xE3 s\u1EA3n ph\u1EA9m', type: 'string', width: '160px', sortable: true },
      { field: 'name', title: 'T\xEAn s\u1EA3n ph\u1EA9m', type: 'string', minWidth: '240px', sortable: true },
      { field: 'unit', title: '\u0110\u01A1n v\u1ECB t\xEDnh', type: 'string', width: '140px' },
      { field: 'price', title: 'Gi\xE1 b\xE1n (\u20AB)', type: 'number', width: '150px', align: 'right', sortable: true },
      {
        field: 'status',
        title: 'Tr\u1EA1ng th\xE1i',
        type: 'values',
        width: '180px',
        option: { items: PRODUCT_STATUS_OPTIONS, valueField: 'id', displayField: 'name' },
        useBadge: status => productStatusBadge(status),
      },
    ],
  };

  constructor() {
    // L\u01B0u \u1EDF trang con xong r\u1ED3i quay v\u1EC1: t\u1EA3i l\u1EA1i \u0111\xFAng trang, b\u1ED9 l\u1ECDc v\xE0 v\u1ECB tr\xED cu\u1ED9n \u0111ang c\xF3.
    let seen = this.#productService.changes();
    effect(() => {
      const changes = this.#productService.changes();
      if (this.pageList().childActive() || changes === seen) return;
      seen = changes;
      untracked(() => void this.table().reload(true, false));
    });
  }

  protected openImport(): void {
    void this.#router.navigate(['../import'], { relativeTo: this.#route });
  }

  protected exportData(): void {
    this.table().exportExcel();
  }
}
`,"features/product/pages/update/update.component.ts":`import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, Injector, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import {
  GeneralInformationFormComponent,
  productSaveReq,
  type ProductForm,
} from '../../components/general-information-form/general-information-form.component';
import { ProductService } from '../../services/product.service';
import type { ProductDto } from '../../services/product.model';

@Component({
  selector: 'update',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdPageComponent, SdButton, GeneralInformationFormComponent],
  template: \`
    <sd-page-form [title]="'C\u1EADp nh\u1EADt s\u1EA3n ph\u1EA9m #' + entity().code" [backLink]="['../detail']">
      <div headerRight class="d-flex align-items-center gap-8">
        <sd-button title="Hu\u1EF7" type="outline" autoId="product-cancel" (click)="cancel()" />
        <sd-button title="L\u01B0u" prefixIcon="save" type="fill" color="primary" autoId="product-save" [loading]="saving()" (click)="save()" />
      </div>
      <div class="py-16">
        <general-information-form [form]="form" [seed]="entity()" [editing]="true" [errors]="apiErrors.errors()" />
      </div>
    </sd-page-form>
  \`,
})
export class UpdateComponent {
  readonly #productService = inject(ProductService);
  readonly #notify = inject(SdNotifyService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  readonly #injector = inject(Injector);
  /** S\u1EA3n ph\u1EA9m do resolver t\u1EA3i; draft kh\u1EDFi t\u1EA1o t\u1EEB \u0111\xE2y, s\u1EEDa draft kh\xF4ng \u0111\u1ED5i b\u1EA3n ghi tr\u01B0\u1EDBc khi l\u01B0u th\xE0nh c\xF4ng. */
  protected readonly entity = toSignal(this.#route.data.pipe(map(data => data['entity'] as ProductDto)), { requireSync: true });
  protected readonly form: ProductForm = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  readonly #unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'product-update', dirty: 'value' });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.#unsaved.destroy());
  }

  protected cancel(): void {
    void this.#router.navigate(['../detail'], { relativeTo: this.#route });
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.#focusFirstInvalid();
      return;
    }
    this.saving.set(true);
    try {
      // M\xE3 b\u1ECB kho\xE1 sau khi t\u1EA1o: g\u1EEDi m\xE3 c\u1EE7a b\u1EA3n ghi, kh\xF4ng l\u1EA5y t\u1EEB form.
      await firstValueFrom(this.#productService.update(this.entity().id, productSaveReq(this.form, this.entity().code)));
      this.#unsaved.markPristine();
      this.#notify.success('\u0110\xE3 c\u1EADp nh\u1EADt s\u1EA3n ph\u1EA9m.');
      await this.#router.navigate(['../detail'], { relativeTo: this.#route, replaceUrl: true });
    } catch (error) {
      // L\u01B0u l\u1ED7i: gi\u1EEF nguy\xEAn draft \u0111\u1EC3 s\u1EEDa v\xE0 th\u1EED l\u1EA1i.
      if (this.apiErrors.set(error)) this.#focusFirstInvalid();
      else this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng th\u1EC3 l\u01B0u. D\u1EEF li\u1EC7u \u0111\xE3 nh\u1EADp v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF.'));
    } finally {
      this.saving.set(false);
    }
  }

  #focusFirstInvalid(): void {
    afterNextRender(() => focusFirstInvalid(this.#host), { injector: this.#injector });
  }
}
`,"features/product/pipes/product-detail.pipe.ts":`import { inject, Pipe, type PipeTransform } from '@angular/core';
import { of, type Observable } from 'rxjs';
import { ProductService } from '../services/product.service';
import type { ProductDto } from '../services/product.model';

/**
 * Relation s\u1EA3n ph\u1EA9m theo ID: \`@let product = line.productId | productDetail | async;\`.
 * ProductService cache v\xE0 chia s\u1EBB request theo ID; n\u01A1i d\xF9ng pipe ph\u1EA3i c\xF3 ProductService trong injector.
 */
@Pipe({ name: 'productDetail', standalone: true })
export class ProductDetailPipe implements PipeTransform {
  readonly #productService = inject(ProductService);

  transform(id: ProductDto['id'] | null | undefined): Observable<ProductDto | null> {
    if (id === null || id === undefined || id === '') return of(null);
    return this.#productService.cachedDetail(id);
  }
}
`,"features/product/routes.ts":`import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { entityResolver } from './entity.resolver';
import { ProductService } from './services/product.service';

/** Detail, create v\xE0 update l\xE0 route con c\u1EE7a danh s\xE1ch: quay l\u1EA1i v\u1EABn gi\u1EEF b\u1ED9 l\u1ECDc, trang v\xE0 v\u1ECB tr\xED cu\u1ED9n. */
export const routes: Routes = [
  {
    path: '',
    providers: [ProductService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: 'S\u1EA3n ph\u1EA9m',
        data: { permission: 'PATTERN_PRODUCT_R_LIST' },
        loadComponent: () => import('./pages/list/list.component').then(module => module.ListComponent),
        children: [
          {
            path: 'create',
            title: 'T\u1EA1o s\u1EA3n ph\u1EA9m',
            data: { permission: 'PATTERN_PRODUCT_C_CREATE' },
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () => import('./pages/create/create.component').then(module => module.CreateComponent),
          },
          {
            path: ':id/detail',
            title: 'Chi ti\u1EBFt s\u1EA3n ph\u1EA9m',
            data: { permission: 'PATTERN_PRODUCT_R_DETAIL' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            loadComponent: () => import('./pages/detail/detail.component').then(module => module.DetailComponent),
          },
          {
            path: ':id/update',
            title: 'C\u1EADp nh\u1EADt s\u1EA3n ph\u1EA9m',
            data: { permission: 'PATTERN_PRODUCT_U_UPDATE' },
            resolve: { entity: entityResolver },
            runGuardsAndResolvers: 'paramsChange',
            canDeactivate: [sdPageFormLeaveGuard],
            loadComponent: () => import('./pages/update/update.component').then(module => module.UpdateComponent),
          },
        ],
      },
    ],
  },
];
`,"features/product/services/product.model.ts":`import type { SdBadgeData } from '@sdcorejs/angular/components/badge';
import type { PagingReq, PagingRes } from '@sdcorejs/utils/models';

export type ProductStatus = 'active' | 'inactive';

export const PRODUCT_STATUS_OPTIONS = [
  { id: 'active', name: '\u0110ang ho\u1EA1t \u0111\u1ED9ng', color: 'success' },
  { id: 'inactive', name: 'Ng\u1EEBng ho\u1EA1t \u0111\u1ED9ng', color: 'secondary' },
] satisfies { id: ProductStatus; name: string; color: SdBadgeData['color'] }[];

export interface ProductDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly status: ProductStatus;
  /** \u0110\u01A1n v\u1ECB t\xEDnh. */
  readonly unit: string;
  /** Gi\xE1 b\xE1n (\u20AB). */
  readonly price: number;
}

/** PagingReq d\xF9ng pageNumber b\u1EAFt \u0111\u1EA7u t\u1EEB 0. */
export type ProductListReq = PagingReq<ProductDto>;
export type ProductListRes = PagingRes<ProductDto>;

export interface ProductSaveReq {
  readonly code: string;
  readonly name: string;
  readonly status: ProductStatus;
  readonly unit: string;
  readonly price: number;
}

/** Badge tr\u1EA1ng th\xE1i c\u1EA1nh title c\u1EE7a chi ti\u1EBFt. */
export function productStatusBadge(status: ProductStatus): SdBadgeData {
  const option = PRODUCT_STATUS_OPTIONS.find(item => item.id === status);
  return { type: 'round', title: option?.name ?? status, color: option?.color };
}
`,"features/product/services/product.service.ts":`import { Injectable, signal } from '@angular/core';
import { shareReplay, tap, type Observable } from 'rxjs';
import { BaseApiService } from '../../../services/base-api.service';
import type { ProductDto, ProductListReq, ProductListRes, ProductSaveReq } from './product.model';

@Injectable()
export class ProductService extends BaseApiService {
  /** M\u1ED9t request cho m\u1ED7i ID trong ph\u1EA1m vi service: pipe v\xE0 select d\xF9ng chung k\u1EBFt qu\u1EA3. */
  readonly #details = new Map<string, Observable<ProductDto>>();
  readonly #changes = signal(0);
  /** T\u0103ng sau m\u1ED7i l\u1EA7n t\u1EA1o ho\u1EB7c c\u1EADp nh\u1EADt th\xE0nh c\xF4ng: danh s\xE1ch t\u1EA3i l\u1EA1i khi quay v\u1EC1. */
  readonly changes = this.#changes.asReadonly();

  list(req: ProductListReq): Observable<ProductListRes> {
    return this.http.get<ProductListRes>(this.apiUrl('products'), {
      params: this.buildPagingReq(req),
    });
  }

  detail(id: string): Observable<ProductDto> {
    return this.http.get<ProductDto>(this.apiUrl('products', id));
  }

  /** \`detail(id)\` c\xF3 cache, cho relation (\`productDetail\`) v\xE0 gi\xE1 tr\u1ECB \u0111\xE3 ch\u1ECDn c\u1EE7a \`product-select\`. */
  cachedDetail(id: string): Observable<ProductDto> {
    let detail = this.#details.get(id);
    if (!detail) {
      detail = this.detail(id).pipe(shareReplay({ bufferSize: 1, refCount: false }));
      this.#details.set(id, detail);
      // L\u1ED7i tra c\u1EE9u kh\xF4ng \u0111\u01B0\u1EE3c cache: l\u1EA7n g\u1ECDi sau h\u1ECFi l\u1EA1i.
      detail.subscribe({ error: () => this.#details.delete(id) });
    }
    return detail;
  }

  create(req: ProductSaveReq): Observable<ProductDto> {
    return this.http.post<ProductDto>(this.apiUrl('products'), req).pipe(tap(() => this.#changes.update(count => count + 1)));
  }

  update(id: string, req: ProductSaveReq): Observable<ProductDto> {
    return this.http.put<ProductDto>(this.apiUrl('products', id), req).pipe(
      tap(() => {
        this.#details.delete(id);
        this.#changes.update(count => count + 1);
      })
    );
  }
}
`,"features/settings/pages/update/update.component.ts":`import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  linkedSignal,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { SdSwitch } from '@sdcorejs/angular/forms/switch';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { SdFormatDatetimePipe } from '@sdcorejs/angular/pipes';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { registerSdUnsavedChangesForm, SdUnsavedChangesService } from '@sdcorejs/angular/services/unsaved-changes';
import { apiErrorMessage } from '../../../../utils/api-error';
import { focusFirstInvalid } from '../../../../utils/focus-first-invalid';
import { formApiErrors } from '../../../../utils/form-api-errors';
import { SettingsService } from '../../services/settings.service';
import type { SettingsDto, SettingsSaveReq } from '../../services/settings.model';

const CURRENCIES = [
  { value: 'VND', label: 'Vi\u1EC7t Nam \u0111\u1ED3ng (VND)' },
  { value: 'USD', label: '\u0110\xF4 la M\u1EF9 (USD)' },
];

/**
 * C\xE0i \u0111\u1EB7t m\u1ED9t b\u1EA3n ghi: \`sd-page-form\` c\xF3 m\u1EE5c l\u1EE5c, nhi\u1EC1u nh\xF3m. L\u01B0u xong v\u1EABn \u1EDF trang; footer b\xE1o tr\u1EA1ng th\xE1i l\u01B0u, r\u1EDDi
 * trang khi c\xF2n thay \u0111\u1ED5i th\xEC h\u1ECFi. Vai tr\xF2 ch\u1EC9 c\xF3 quy\u1EC1n xem th\u1EA5y form \u1EDF ch\u1EBF \u0111\u1ED9 xem.
 */
@Component({
  selector: 'update',
  standalone: true,
  imports: [SdPageComponent, SdButton, SdSection, SdInput, SdInputNumber, SdSelect, SdSwitch, SdPermissionDirective, SdFormatDatetimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    @let value = entity();
    @let errors = apiErrors.errors();
    <sd-page-form title="C\xE0i \u0111\u1EB7t c\u1EEDa h\xE0ng" description="\xC1p d\u1EE5ng cho m\u1ECDi chi nh\xE1nh." toc>
      <sd-button
        headerRight
        *sdPermission="'PATTERN_SETTINGS_U_UPDATE'"
        title="L\u01B0u"
        prefixIcon="save"
        type="fill"
        color="primary"
        autoId="settings-save"
        [loading]="saving()"
        (click)="save()" />
      <div class="d-flex flex-column gap-16 py-16">
        <sd-section title="Th\xF4ng tin c\u1EEDa h\xE0ng">
          <div class="row px-16 pt-16 pb-8">
            <div class="col-12 col-md-6">
              <sd-input
                label="T\xEAn c\u1EEDa h\xE0ng"
                name="storeName"
                autoId="settings-store-name"
                [form]="form"
                [model]="value.storeName"
                [viewed]="!canEdit"
                [inlineError]="errors['storeName']"
                required />
            </div>
            <div class="col-12 col-md-6">
              <sd-input label="Hotline" name="hotline" [form]="form" [model]="value.hotline" [viewed]="!canEdit" />
            </div>
            <div class="col-12">
              <sd-input label="\u0110\u1ECBa ch\u1EC9" name="address" [form]="form" [model]="value.address" [viewed]="!canEdit" />
            </div>
          </div>
        </sd-section>
        <sd-section title="B\xE1n h\xE0ng">
          <div class="row px-16 pt-16 pb-8">
            <div class="col-12 col-md-6">
              <sd-select
                label="Ti\u1EC1n t\u1EC7"
                name="currency"
                [form]="form"
                [model]="value.currency"
                [items]="currencies"
                valueField="value"
                displayField="label"
                [viewed]="!canEdit"
                [clearable]="false" />
            </div>
            <div class="col-12 col-md-6">
              <sd-input
                label="Ti\u1EC1n t\u1ED1 m\xE3 \u0111\u01A1n"
                name="orderPrefix"
                autoId="settings-order-prefix"
                [form]="form"
                [model]="value.orderPrefix"
                [viewed]="!canEdit"
                [inlineError]="errors['orderPrefix']"
                maxlength="5"
                required />
            </div>
            <div class="col-12 col-md-6">
              <sd-input-number
                label="Ng\u01B0\u1EE1ng c\u1EA3nh b\xE1o t\u1ED3n kho"
                name="lowStockThreshold"
                type="positive"
                [precision]="0"
                [form]="form"
                [model]="value.lowStockThreshold"
                [viewed]="!canEdit" />
            </div>
            <div class="col-12 col-md-6 d-flex align-items-center">
              <sd-switch
                label="T\u1EF1 x\xE1c nh\u1EADn \u0111\u01A1n online"
                name="autoConfirm"
                [form]="form"
                [model]="value.autoConfirm"
                [disabled]="!canEdit" />
            </div>
          </div>
        </sd-section>
        <sd-section title="Th\xF4ng b\xE1o">
          <div class="row px-16 pt-16 pb-8">
            <div class="col-12 col-md-6 d-flex align-items-center">
              <sd-switch
                label="G\u1EEDi email"
                name="emailNotify"
                [form]="form"
                [model]="value.emailNotify"
                [disabled]="!canEdit"
                (modelChange)="emailNotify.set(!!$event)" />
            </div>
            <div class="col-12 col-md-6 d-flex align-items-center">
              <sd-switch label="G\u1EEDi SMS" name="smsNotify" [form]="form" [model]="value.smsNotify" [disabled]="!canEdit" />
            </div>
            <div class="col-12">
              <sd-input
                label="Email nh\u1EADn th\xF4ng b\xE1o"
                name="notifyEmail"
                [form]="form"
                [model]="value.notifyEmail"
                pattern="EMAIL"
                [viewed]="!canEdit"
                [required]="emailNotify()" />
            </div>
          </div>
        </sd-section>
        <sd-section title="B\u1EA3o m\u1EADt">
          <div class="row px-16 pt-16 pb-8">
            <div class="col-12 col-md-6">
              <sd-input-number
                label="H\u1EBFt phi\xEAn sau (ph\xFAt)"
                name="sessionMinutes"
                autoId="settings-session"
                type="positive"
                [precision]="0"
                [form]="form"
                [model]="value.sessionMinutes"
                [viewed]="!canEdit"
                [inlineError]="errors['sessionMinutes']"
                required />
            </div>
            <div class="col-12 col-md-6 d-flex align-items-center">
              <sd-switch label="X\xE1c th\u1EF1c hai b\u01B0\u1EDBc" name="twoFactor" [form]="form" [model]="value.twoFactor" [disabled]="!canEdit" />
            </div>
          </div>
        </sd-section>
      </div>
      <span sdFooterLeft class="T14R text-secondary" role="status" data-autoid="settings-save-state">
        {{ unsaved.dirty() ? 'C\xF3 thay \u0111\u1ED5i ch\u01B0a l\u01B0u' : '\u0110\xE3 l\u01B0u l\xFAc ' + (value.updatedAt | sdFormatDatetime) }}
      </span>
    </sd-page-form>
  \`,
})
export class UpdateComponent {
  readonly #settingsService = inject(SettingsService);
  readonly #notify = inject(SdNotifyService);
  readonly #route = inject(ActivatedRoute);
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  readonly #injector = inject(Injector);
  protected readonly canEdit = inject(SdPermissionService).hasPermission('PATTERN_SETTINGS_U_UPDATE');
  protected readonly currencies = CURRENCIES;
  readonly #resolved = toSignal(this.#route.data.pipe(map(data => data['entity'] as SettingsDto)), { requireSync: true });
  /** B\u1EA3n ghi \u0111\xE3 l\u01B0u g\u1EA7n nh\u1EA5t: sau khi l\u01B0u thay b\u1EB1ng b\u1EA3n API tr\u1EA3 v\u1EC1. */
  protected readonly entity = linkedSignal(() => this.#resolved());
  protected readonly emailNotify = linkedSignal(() => this.entity().emailNotify);
  protected readonly form = new FormGroup({});
  protected readonly saving = signal(false);
  protected readonly apiErrors = formApiErrors(this.form);
  protected readonly unsaved = registerSdUnsavedChangesForm(inject(SdUnsavedChangesService), this.form, { id: 'settings', dirty: 'value' });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.unsaved.destroy());
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.#focusFirstInvalid();
      return;
    }
    this.saving.set(true);
    try {
      const saved = await firstValueFrom(this.#settingsService.update({ ...this.entity(), ...this.form.getRawValue() } as SettingsSaveReq));
      this.entity.set(saved);
      // \u1EDE l\u1EA1i trang: gi\xE1 tr\u1ECB v\u1EEBa l\u01B0u l\xE0 m\u1ED1c so s\xE1nh m\u1EDBi (\`markPristine()\` \u1EDF ch\u1EBF \u0111\u1ED9 value), s\u1EEDa ti\u1EBFp v\u1EABn \u0111\u01B0\u1EE3c b\u1EA3o v\u1EC7 khi r\u1EDDi trang.
      this.unsaved.markPristine();
      this.#notify.success('\u0110\xE3 l\u01B0u c\xE0i \u0111\u1EB7t.');
    } catch (error) {
      if (this.apiErrors.set(error)) this.#focusFirstInvalid();
      else this.#notify.error(apiErrorMessage(error, 'Kh\xF4ng th\u1EC3 l\u01B0u. Thay \u0111\u1ED5i v\u1EABn \u0111\u01B0\u1EE3c gi\u1EEF.'));
    } finally {
      this.saving.set(false);
    }
  }

  #focusFirstInvalid(): void {
    afterNextRender(() => focusFirstInvalid(this.#host), { injector: this.#injector });
  }
}
`,"features/settings/routes.ts":`import type { Routes } from '@angular/router';
import { sdPageFormLeaveGuard } from '@sdcorejs/angular/modules/layout';
import { SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { SettingsService } from './services/settings.service';
import { settingsResolver } from './settings.resolver';

/** M\u1ED9t b\u1EA3n ghi: v\xE0o th\u1EB3ng trang c\u1EADp nh\u1EADt; ng\u01B0\u1EDDi ch\u1EC9 c\xF3 quy\u1EC1n xem th\u1EA5y form \u1EDF ch\u1EBF \u0111\u1ED9 xem. */
export const routes: Routes = [
  {
    path: '',
    providers: [SettingsService],
    canActivateChild: [SdPermissionGuard],
    children: [
      {
        path: '',
        title: 'C\xE0i \u0111\u1EB7t',
        data: { permission: 'PATTERN_SETTINGS_R_DETAIL' },
        resolve: { entity: settingsResolver },
        canDeactivate: [sdPageFormLeaveGuard],
        loadComponent: () => import('./pages/update/update.component').then(module => module.UpdateComponent),
      },
    ],
  },
];
`,"features/settings/services/settings.model.ts":`/** C\xE0i \u0111\u1EB7t c\u1EEDa h\xE0ng: m\u1ED9t b\u1EA3n ghi, kh\xF4ng c\xF3 danh s\xE1ch. */
export interface SettingsDto {
  readonly storeName: string;
  readonly hotline: string;
  readonly address: string;
  readonly currency: string;
  readonly orderPrefix: string;
  readonly autoConfirm: boolean;
  readonly lowStockThreshold: number;
  readonly emailNotify: boolean;
  readonly smsNotify: boolean;
  readonly notifyEmail: string;
  readonly sessionMinutes: number;
  readonly twoFactor: boolean;
  readonly updatedAt: string;
}

export type SettingsSaveReq = Omit<SettingsDto, 'updatedAt'>;
`,"features/settings/services/settings.service.ts":`import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { BaseApiService } from '../../../services/base-api.service';
import type { SettingsDto, SettingsSaveReq } from './settings.model';

@Injectable()
export class SettingsService extends BaseApiService {
  detail(): Observable<SettingsDto> {
    return this.http.get<SettingsDto>(this.apiUrl('settings'));
  }

  update(req: SettingsSaveReq): Observable<SettingsDto> {
    return this.http.put<SettingsDto>(this.apiUrl('settings'), req);
  }
}
`,"features/settings/settings.resolver.ts":`import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { timeout } from 'rxjs';
import { SettingsService } from './services/settings.service';
import type { SettingsDto } from './services/settings.model';

/** T\u1EA3i c\xE0i \u0111\u1EB7t tr\u01B0\u1EDBc khi m\u1EDF trang; l\u1ED7i \u0111i t\u1EDBi navigation error handler c\u1EE7a host. */
export const settingsResolver: ResolveFn<SettingsDto> = () => inject(SettingsService).detail().pipe(timeout(10_000));
`,"README.md":'# `@sdcorejs/angular/modules/pattern`\n\nM\xE0n m\u1EABu theo entity, ch\u1EA1y tr\xEAn Core th\u1EADt v\u1EDBi mock API. M\u1ED7i m\xE0n l\xE0 code Angular ho\xE0n ch\u1EC9nh trong `features/`, theo c\u1EA5u tr\xFAc project-structure c\u1EE7a Angular Portal Blueprint. T\xE0i li\u1EC7u trong `docs/` gi\u1EEF quy t\u1EAFc v\xE0 l\xFD do; m\u1ECDi kh\u1ED1i code trong \u0111\xF3 \u0111\u01B0\u1EE3c tr\xEDch t\u1EEB `features/` khi build (`npm run pattern:docs`), n\xEAn kh\xF4ng c\xF3 code minh ho\u1EA1 t\xE1ch r\u1EDDi code ch\u1EA1y th\u1EADt.\n\n\u0110\u1ECDc theo th\u1EE9 t\u1EF1: README n\xE0y \u2192 `docs/<pattern>.md` c\u1EE7a lo\u1EA1i m\xE0n c\u1EA7n l\xE0m \u2192 th\u01B0 m\u1EE5c `features/<entity>/` g\u1EA7n nh\u1EA5t. G\xF3i npm mang theo c\u1EA3 ba (`node_modules/@sdcorejs/angular/modules/pattern/`).\n\n## Ch\u1ECDn pattern theo lo\u1EA1i m\xE0n\n\n| Lo\u1EA1i m\xE0n | Pattern | Selector / th\xE0nh ph\u1EA7n | Route m\u1EABu |\n| --- | --- | --- | --- |\n| Danh s\xE1ch c\xF3 b\u1EA3ng | [list](docs/list.md) | `sd-page-list` + `sd-table` | `product`, `order`, `customer`, `category` |\n| Xem m\u1ED9t b\u1EA3n ghi | [detail](docs/detail.md) | `sd-page-detail` | `product/:id/detail`, `order/:id/detail`, `customer/:id/360` |\n| T\u1EA1o / c\u1EADp nh\u1EADt m\u1ED9t b\u01B0\u1EDBc | [form](docs/form.md) | `sd-page-form` (`toc` khi nhi\u1EC1u nh\xF3m) | `product/create`, `order/create`, `settings` |\n| Quy tr\xECnh nhi\u1EC1u b\u01B0\u1EDBc | [flow](docs/flow.md) | `sd-page` h\u1EB9p + `sd-stepper`, n\xFAt b\u01B0\u1EDBc \u1EDF footer | `import`, `partner/create` |\n| Xem / s\u1EEDa ngay tr\xEAn danh s\xE1ch | [drawer](docs/drawer.md) | `sd-side-drawer` trong route con | `customer/create`, `customer/:id/detail`, `category/:id/update` |\n| X\u1EED l\xFD nhanh t\u1EEBng m\u1EE5c | [split](docs/split.md) | `sd-page-list detail="none"` + `sd-splitter` | `approval` |\n| Ch\u1ECDn entity / enum | [select](docs/select.md) | wrapper `<entity>-select` c\u1EE7a feature s\u1EDF h\u1EEFu entity | `product-select`, `customer-select` |\n| Hi\u1EC7n quan h\u1EC7 theo ID | [relation](docs/relation.md) | pipe `<entity>Detail` | `customerDetail`, `productDetail` |\n| N\xFAt \u1EDF header | [header-actions](docs/header-actions.md) | `headerRight`, Action Popover c\u1EE7a `sd-button` | `product` (menu Nh\u1EADp/Xu\u1EA5t) |\n| \u0110ang t\u1EA3i, r\u1ED7ng, l\u1ED7i, thi\u1EBFu quy\u1EC1n | [states](docs/states.md) | `sd-table`, `sd-data-state`, resolver, guard | m\u1ECDi route |\n\nKh\xF4ng c\xF3 lo\u1EA1i m\xE0n ph\xF9 h\u1EE3p: d\xF9ng `sd-page` v\xE0 gh\xE9p c\xE1c pattern tr\xEAn. C\xF3 m\xE0n th\u1EE9 ba c\xF9ng lo\u1EA1i m\u1EDBi t\xE1ch th\xE0nh selector ho\u1EB7c pattern ri\xEAng.\n\n## G\u1EAFn v\xE0o portal\n\nRoute `pattern` c\u1EE7a host lazy-load `SD_PATTERN_ROUTES` v\xE0 \u0111\u1EB7t `provideSdPatterns({ mockApi: true })` trong `providers` c\u1EE7a ch\xEDnh route \u0111\xF3. Interceptor mock ch\u1EC9 ch\u1EA1y tr\xEAn `HttpClient` con c\u1EE7a route n\xE0y; quy\u1EC1n m\u1EABu (`SdPermissionService`, `SdPermissionGuard`, `SD_PERMISSION_CONFIGURATION`) c\u0169ng \u0111\u01B0\u1EE3c c\u1EA5p l\u1EA1i \u1EDF \u0111\xE2y n\xEAn kh\xF4ng \u0111\u1EE5ng quy\u1EC1n c\u1EE7a host. `mockApi: false` + `apiBaseUrl` cho service g\u1ECDi API th\u1EADt. L\u1ED7i t\u1EA3i b\u1EA3n ghi tr\u01B0\u1EDBc khi m\u1EDF trang (404, 403, timeout) \u0111i t\u1EDBi navigation error handler c\u1EE7a host; `forbiddenUrl` l\xE0 trang host m\u1EDF khi vai tr\xF2 thi\u1EBFu quy\u1EC1n v\xE0o route.\n\nThanh c\xF4ng c\u1EE5 d\u01B0\u1EDBi c\xF9ng c\u1EE7a `/pattern` (vai tr\xF2, \u0111\u1ED9 tr\u1EC5, l\u1ED7i gi\u1EA3 l\u1EADp, kh\xF4i ph\u1EE5c d\u1EEF li\u1EC7u, xem source) v\xE0 drawer "Tu\u1EF3 ch\u1EC9nh hi\u1EC3n th\u1ECB" c\u1EE7a `/pattern/order` thu\u1ED9c `core/pattern-shell`, kh\xF4ng ph\u1EA3i code c\u1EE7a feature: kh\xF4ng ch\xE9p sang m\xE0n th\u1EADt.\n\n## C\u1EA5u tr\xFAc m\u1ED9t feature\n\n```text\nfeatures/<entity>/\n  routes.ts               route list + route con (create, :id/detail, :id/update), service c\u1EA5p \u1EDF \u0111\xE2y\n  entity.resolver.ts      t\u1EA3i b\u1EA3n ghi b\u1EB1ng detail(id) tr\u01B0\u1EDBc khi m\u1EDF trang\n  services/<entity>.model.ts  DTO, Req, const/enum, badge\n  services/<entity>.service.ts  g\u1ECDi API qua BaseApiService; kh\xF4ng bi\u1EBFt c\xF3 mock hay kh\xF4ng\n  pages/list|detail|create|update/  trang c\xF3 route\n  components/             -form, -view, -select, *-side-drawer c\u1EE7a entity\n  pipes/<entity>-detail.pipe.ts  relation theo ID cho m\xE0n kh\xE1c\n```\n\nT\xEAn feature \u0111\xE3 c\xF3 trong \u0111\u01B0\u1EDDng d\u1EABn, kh\xF4ng l\u1EB7p l\u1EA1i trong t\xEAn file b\xEAn trong. D\u1EF1ng feature m\u1EDBi: ch\xE9p th\u01B0 m\u1EE5c entity g\u1EA7n nh\u1EA5t r\u1ED3i \u0111\u1ED5i t\xEAn.\n\n## Quy\u1EBFt \u0111\u1ECBnh \u0111\xE3 ch\u1ED1t\n\n| M\xE3 | Quy\u1EBFt \u0111\u1ECBnh |\n| --- | --- |\n| E1 | Danh s\xE1ch v\u1EEBa kh\xEDt m\xE0n h\xECnh, kh\xF4ng c\xF3 scrollbar ngo\xE0i; ch\u1EC9 v\xF9ng d\u1EEF li\u1EC7u c\u1EE7a b\u1EA3ng cu\u1ED9n. Feature kh\xF4ng vi\u1EBFt chi\u1EC1u cao hay SCSS cho danh s\xE1ch. |\n| E2 | `backLink` hi\u1EC7n n\xFAt \u2190 tr\u01B0\u1EDBc title; title, m\xF4 t\u1EA3 v\xE0 t\u1ED1i \u0111a hai badge truy\u1EC1n qua input. |\n| E3 | N\xFAt L\u01B0u c\u1EE7a page n\u1EB1m \u1EDF `headerRight`; drawer v\xE0 flow \u0111\u1EB7t n\xFAt \u1EDF footer. |\n| E4 | Drawer ch\u1EC9 \u0111\xF3ng b\u1EB1ng X (c\xF9ng Esc, backdrop); kh\xF4ng c\xF3 n\xFAt \u0110\xF3ng/Hu\u1EF7 th\u01B0\u1EDDng tr\u1EF1c. |\n| E5 | D\xF9ng "C\u1EADp nh\u1EADt <entity>", kh\xF4ng d\xF9ng "Ch\u1EC9nh s\u1EEDa". |\n| E6 | Kh\xF4ng d\xF9ng quick search c\xF9ng external filter tr\xEAn m\u1ED9t m\xE0n; m\u1ED7i field ch\u1EC9 m\u1ED9t ch\u1ED7 l\u1ECDc. |\n| E7 | Gi\u1EEF m\u1EB7c \u0111\u1ECBnh `hideInlineFilter: false`; m\xE0n \xEDt d\u1EEF li\u1EC7u d\xF9ng `\'auto\'`; kh\xF4ng d\xF9ng `true`. |\n| E8 | Flow l\xE0 pattern: `sd-page` + `sd-stepper`, gi\u1EEF d\u1EEF li\u1EC7u khi \u0111\u1ED5i b\u01B0\u1EDBc. |\n| E9 | Drawer 480px m\u1EB7c \u0111\u1ECBnh, 600px cho chi ti\u1EBFt v\xE0 form th\u01B0\u1EDDng, t\u1ED1i \u0111a 800px. |\n| E10 | Code trong t\xE0i li\u1EC7u \u0111\u01B0\u1EE3c tr\xEDch t\u1EEB `features/`; kh\u1ED1i l\u1EC7ch code th\xEC ki\u1EC3m tra trong CI th\u1EA5t b\u1EA1i. |\n| E11 | T\xE0i li\u1EC7u kh\xF4ng ghi ch\xFA theo version; kh\xE1c bi\u1EC7t gi\u1EEFa version ghi \u1EDF CHANGELOG. |\n| E12 | `features/*` theo c\u1EA5u tr\xFAc project-structure c\u1EE7a Blueprint. |\n| E13 | Sau l\u01B0u: page sang chi ti\u1EBFt, drawer \u0111\xF3ng v\xE0 danh s\xE1ch t\u1EA3i l\u1EA1i. L\u01B0u l\u1ED7i: focus field l\u1ED7i \u0111\u1EA7u ti\xEAn, l\u1ED7i API g\u1EAFn v\xE0o field. Xo\xE1, duy\u1EC7t, t\u1EEB ch\u1ED1i, m\u1ECDi t\xE1c v\u1EE5 \u0111\u1ED5i tr\u1EA1ng th\xE1i \u0111\u1EC1u h\u1ECFi x\xE1c nh\u1EADn, c\u1EA3 t\u1EEBng b\u1EA3n ghi l\u1EABn h\xE0ng lo\u1EA1t; h\xE0ng lo\u1EA1t b\xE1o k\u1EBFt qu\u1EA3 t\u1EEBng ph\u1EA7n v\xE0 cho th\u1EED l\u1EA1i ph\u1EA7n l\u1ED7i. |\n\n## M\xE3 quy\u1EC1n\n\n`PATTERN_<ENTITY>_<R|C|U|D>_<ACTION>`: R \u0111\u1ECDc, C t\u1EA1o, U \u0111\u1ED5i m\u1ED9t b\u1EA3n ghi (c\u1EADp nh\u1EADt v\xE0 m\u1ECDi t\xE1c v\u1EE5 tr\u1EA1ng th\xE1i), D xo\xE1. Feature ghi th\u1EB3ng m\xE3 trong `data.permission` v\xE0 `*sdPermission`; vai tr\xF2 m\u1EABu (Qu\u1EA3n tr\u1ECB, Nh\xE2n vi\xEAn kh\xF4ng xo\xE1 kh\xF4ng duy\u1EC7t, Ch\u1EC9 xem) n\u1EB1m trong `core/permission`.\n\n## \u0110\xF3ng g\xF3p\n\nTh\xEAm ho\u1EB7c s\u1EEDa m\u1ED9t m\xE0n m\u1EABu:\n\n- [ ] Route trong `SD_PATTERN_ROUTES` v\xE0 d\xF2ng trong m\u1EE5c l\u1EE5c `/pattern` (`core/pattern-shell/catalog`).\n- [ ] Resource c\u1EE7a mock API trong `core/mock-api/resources`, seed c\u1ED1 \u0111\u1ECBnh.\n- [ ] M\xE3 quy\u1EC1n m\u1EDBi c\xF3 trong `core/permission/pattern-permission.ts`; m\xE3 kh\xF4ng c\xF2n d\xF9ng th\xEC xo\xE1.\n- [ ] T\xE0i li\u1EC7u trong `docs/` tr\u1ECF t\u1EDBi file c\u1EE7a feature b\u1EB1ng marker `@source`; ch\u1EA1y `npm run pattern:docs` (c\u1EADp nh\u1EADt c\u1EA3 manifest c\u1EE7a tab Source).\n- [ ] Playwright cho route trong `showcase/e2e/pattern/`.\n- [ ] Quy t\u1EAFc review: kh\xF4ng c\xF3 chi\u1EC1u cao hay `overflow` t\u1EF1 vi\u1EBFt trong danh s\xE1ch, kh\xF4ng c\xF3 `hideInlineFilter: true`, kh\xF4ng c\xF3 n\xFAt \u0110\xF3ng th\u01B0\u1EDDng tr\u1EF1c trong drawer, kh\xF4ng c\xF3 ch\u1EEF "Ch\u1EC9nh s\u1EEDa".\n'};export{n as PATTERN_SOURCE};
