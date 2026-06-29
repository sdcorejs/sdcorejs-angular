import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdFormGenericNumber } from '../../../../../../models';
import { ComponentViewedPipe } from '../../../../../../pipes';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { filter, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'lib-number',
  templateUrl: './number.component.html',
  styleUrl: './number.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SdInputNumber,
    // Pipe cho phần viewed
    ComponentViewedPipe,
  ],
})
export class NumberComponent implements OnInit, OnDestroy {
  @Input({ required: true }) setVariables!: Subject<{ key: string; value: any }>;
  @Input() form = new FormGroup({});
  value: any;
  entity: Record<string, any> = {};
  @Input({
    alias: 'entity',
    required: true,
  })
  set _entity(val: Record<string, any>) {
    if (this.entity !== val) {
      this.entity = val;
    }
  }

  component?: SdFormGenericNumber;
  @Input({
    alias: 'component',
    required: true,
  })
  set _component(val: SdFormGenericNumber) {
    this.component = val;
  }

  disabled = false;
  @Input('disabled') set _disabled(val: boolean | '' | undefined | null) {
    this.disabled = val === '' || !!val;
  }

  required = false;
  @Input('required') set _required(val: boolean | '' | undefined | null) {
    this.required = val === '' || !!val;
  }

  viewed = false;
  @Input('viewed') set _viewed(val: boolean | '' | undefined | null) {
    this.viewed = val === '' || !!val;
  }

  #subscription = new Subscription();
  constructor(private ref: ChangeDetectorRef) {}
  ngOnInit() {
    this.#subscription.add(
      this.setVariables.pipe(filter(variable => variable.key === this.component?.key)).subscribe(variable => {
        this.entity[variable.key] = variable.value;
        this.ref.markForCheck();
      })
    );
  }
  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }
}
