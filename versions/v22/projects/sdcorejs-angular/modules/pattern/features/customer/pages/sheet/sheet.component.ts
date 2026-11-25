import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  linkedSignal,
  signal,
  viewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdPermissionDirective, SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { SdEmptyPipe, SdFormatDatePipe } from '@sdcorejs/angular/pipes';
import { CustomerRelationComponent } from '../../components/overview/customer-relation.component';
import { UpdateSideDrawerComponent } from '../../components/update-side-drawer/update-side-drawer.component';
import { customerStatusBadge, customerTypeName, type CustomerDto } from '../../services/customer.model';

const RELATIONS = [
  { kind: 'orders', id: 'don-hang', title: 'Đơn hàng' },
  { kind: 'debts', id: 'cong-no', title: 'Công nợ' },
  { kind: 'documents', id: 'tai-lieu', title: 'Tài liệu' },
  { kind: 'activity', id: 'hoat-dong', title: 'Hoạt động' },
] as const;

@Component({
  selector: 'customer-sheet',
  standalone: true,
  imports: [
    SdPageComponent,
    SdButton,
    SdSection,
    SdSectionItem,
    SdDataState,
    SdPermissionDirective,
    SdEmptyPipe,
    SdFormatDatePipe,
    CustomerRelationComponent,
    UpdateSideDrawerComponent,
  ],
  templateUrl: './sheet.component.html',
  styleUrl: './sheet.component.scss',
  // The print stylesheet also releases the host application's scroll containers.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SheetComponent {
  readonly #document = inject(DOCUMENT);
  readonly #injector = inject(Injector);
  readonly #route = inject(ActivatedRoute);
  readonly #resolved = toSignal(this.#route.data.pipe(map(data => data['entity'] as CustomerDto)), { requireSync: true });
  protected readonly entity = linkedSignal(() => this.#resolved());
  protected readonly typeName = computed(() => customerTypeName(this.entity().type));
  protected readonly badges = computed(() => [customerStatusBadge(this.entity().status)]);
  protected readonly relations = inject(SdPermissionService).hasPermission('PATTERN_CUSTOMER_R_DEBTS')
    ? RELATIONS
    : RELATIONS.filter(item => item.kind !== 'debts');
  protected readonly updating = signal(false);
  protected readonly printing = linkedSignal({ source: () => this.entity().id, computation: () => false });
  protected readonly printError = linkedSignal({ source: () => this.entity().id, computation: () => false });
  private readonly views = viewChildren<CustomerRelationComponent>('relation');

  constructor() {
    effect(() => {
      if (!this.printing()) return;
      const id = this.entity().id;
      const views = this.views();
      if (views.length !== this.relations.length || !views.every(view => view.settled())) return;
      const failed = views.some(view => view.failed());
      // Wait for Angular to paint the last response before opening the browser's print dialog.
      afterNextRender(
        () => {
          if (!this.printing() || this.entity().id !== id) return;
          this.printError.set(failed);
          this.printing.set(false);
          if (!failed) this.#document.defaultView?.print();
        },
        { injector: this.#injector }
      );
    });
  }

  protected printSheet(): void {
    this.printError.set(false);
    for (const view of this.views()) {
      if (view.failed()) view.reload();
    }
    this.printing.set(true);
  }

  protected saved(customer: CustomerDto): void {
    this.entity.set(customer);
    this.views()
      .find(view => view.kind() === 'activity')
      ?.reload();
  }
}
