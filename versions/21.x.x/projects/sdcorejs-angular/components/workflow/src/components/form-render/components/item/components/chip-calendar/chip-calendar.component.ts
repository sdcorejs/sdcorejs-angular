/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/no-input-rename */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdChipCalendar } from '@sdcorejs/angular/forms';
import { filter, Subject, Subscription } from 'rxjs';
import { SdFormGenericChipCalendar } from '../../../../../../models';
import { ComponentViewedPipe } from '../../../../../../pipes';

@Component({
  selector: 'lib-chip-calendar',
  templateUrl: './chip-calendar.component.html',
  styleUrls: ['./chip-calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SdChipCalendar,
    // Pipe cho pháº§n viewed
    ComponentViewedPipe,
  ],
})
export class ChipCalendarComponent {
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

  component?: SdFormGenericChipCalendar;
  @Input({
    alias: 'component',
    required: true,
  })
  set _component(val: SdFormGenericChipCalendar) {
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

