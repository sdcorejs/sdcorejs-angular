import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { SdFormatComponent, SdFormGenericTextarea } from '../../../../../models';
import { BuilderService } from '../../../services';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'textarea-control',
  templateUrl: './textarea-control.component.html',
  styleUrl: './textarea-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaControl implements AfterViewInit, OnDestroy {
  private ref = inject(ChangeDetectorRef);
  private builderService = inject(BuilderService);

  component!: SdFormGenericTextarea;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericTextarea) {
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
          this.ref.markForCheck();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }
}
