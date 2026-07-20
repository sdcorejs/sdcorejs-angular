import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { DateUtilities } from '@sdcorejs/angular/utilities';
import { filter, Subscription } from 'rxjs';
import { SdFormGenericDatetime } from '../../../../../models';
import { BuilderService } from '../../../services';

@Component({
  selector: 'datetime-control',
  templateUrl: './datetime-control.component.html',
  styleUrl: './datetime-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class DatetimeControl implements AfterViewInit, OnDestroy {
  private ref = inject(ChangeDetectorRef);
  private builderService = inject(BuilderService);

  component!: SdFormGenericDatetime;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericDatetime) {
    this.component = component;
  }

  date = DateUtilities.toFormat(new Date(), 'dd/MM/yyyy');
  datetime = DateUtilities.toFormat(new Date(), 'dd/MM/yyyy HH:mm');

  #subscription = new Subscription();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  ngAfterViewInit(): void {
    this.#subscription.add(
      // Chỉ lắng nghe sự kiện thay đổi tương ứng với component dựa vào id
      this.builderService.componentListeners.pipe(filter(component => component.id === this.component.id)).subscribe(component => {
        if (component) {
          this.ref.markForCheck();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }
}
