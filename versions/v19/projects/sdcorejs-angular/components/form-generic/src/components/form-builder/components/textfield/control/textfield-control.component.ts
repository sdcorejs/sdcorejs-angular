/* eslint-disable @angular-eslint/no-input-rename */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { SdFormatComponent, SdFormGenericTextfield } from '../../../../../models';
import { filter, Subscription } from 'rxjs';
import { BuilderService } from '../../../services';

@Component({
  selector: 'textfield-control',
  templateUrl: './textfield-control.component.html',
  styleUrls: ['./textfield-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextFieldControl {
  component!: SdFormGenericTextfield;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericTextfield) {
    if (this.component !== component) {
      this.component = component;
      SdFormatComponent(this.component);
    }
  }

  #subscription = new Subscription();
  constructor(
    private ref: ChangeDetectorRef,
    private builderService: BuilderService
  ) {}

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
