import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { sdFormatComponent, SdFormGenericSelect } from '../../../../../models';
import { filter, Subscription } from 'rxjs';
import { BuilderService } from '../../../services';

@Component({
  selector: 'select-control',
  templateUrl: './select-control.component.html',
  styleUrl: './select-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class SelectControl implements AfterViewInit, OnDestroy {
  private ref = inject(ChangeDetectorRef);
  private builderService = inject(BuilderService);

  component!: SdFormGenericSelect;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericSelect) {
    if (this.component !== component) {
      this.component = component;
      sdFormatComponent(this.component);
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
