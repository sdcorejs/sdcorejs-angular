import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { sdFormatComponent, SdFormGenericNumber } from '../../../../../models';
import { filter, Subscription } from 'rxjs';
import { BuilderService } from '../../../services';
import { NumberUtilities } from '@sdcorejs/angular/utilities/extensions';

@Component({
  selector: 'number-control',
  templateUrl: './number-control.component.html',
  styleUrl: './number-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberControl implements AfterViewInit, OnDestroy {
  private ref = inject(ChangeDetectorRef);
  private builderService = inject(BuilderService);

  component!: SdFormGenericNumber;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericNumber) {
    if (this.component !== component) {
      this.component = component;
      sdFormatComponent(this.component);
    }
  }

  number = NumberUtilities.toISO(new Date().getTime());

  #subscription = new Subscription();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  ngAfterViewInit(): void {
    this.#subscription.add(
      // Chỉ lắng nghe sự kiện thay đổi tương ứng với component dựa vào id
      this.builderService.componentListeners.pipe(filter(component => component.id === this.component.id)).subscribe(component => {
        if (component) {
          // Vì đã đúng theo id nên có thể ép kiểu any
          this.ref.markForCheck();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }
}
