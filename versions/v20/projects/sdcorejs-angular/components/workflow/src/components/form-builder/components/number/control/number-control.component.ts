/* eslint-disable @angular-eslint/no-input-rename */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { SdFormatComponent, SdFormGenericNumber } from '../../../../../models';
import { filter, Subscription } from 'rxjs';
import { BuilderService } from '../../../services';
import { NumberUtilities } from '@sdcorejs/angular/utilities/extensions';

@Component({
  selector: 'number-control',
  templateUrl: './number-control.component.html',
  styleUrls: ['./number-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberControl {
  component!: SdFormGenericNumber;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericNumber) {
    if (this.component !== component) {
      this.component = component;
      SdFormatComponent(this.component);
    }
  }

  number = NumberUtilities.toISO(new Date().getTime());

  #subscription = new Subscription();
  constructor(
    private ref: ChangeDetectorRef,
    private builderService: BuilderService
  ) {}

  ngAfterViewInit(): void {
    this.#subscription.add(
      // Chá»‰ láº¯ng nghe sá»± kiá»‡n thay Ä‘á»•i tÆ°Æ¡ng á»©ng vá»›i component dá»±a vÃ o id
      this.builderService.componentListeners.pipe(filter(component => component.id === this.component.id)).subscribe(component => {
        if (component) {
           // VÃ¬ Ä‘Ã£ Ä‘Ãºng theo id nÃªn cÃ³ thá»ƒ Ã©p kiá»ƒu any
          this.ref.markForCheck();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }
}

