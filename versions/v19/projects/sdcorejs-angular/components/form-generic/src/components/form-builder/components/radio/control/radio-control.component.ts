import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { SdFormatComponent, SdFormGenericRadio } from '../../../../../models';
import { filter, Subscription } from 'rxjs';
import { BuilderService } from '../../../services';

@Component({
  selector: 'radio-control',
  templateUrl: './radio-control.component.html',
  styleUrl: './radio-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class RadioControl implements AfterViewInit, OnDestroy {
  private ref = inject(ChangeDetectorRef);
  private builderService = inject(BuilderService);

  component!: SdFormGenericRadio;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericRadio) {
    if (this.component !== component) {
      this.component = component;
      SdFormatComponent(this.component);
    }
  }

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
