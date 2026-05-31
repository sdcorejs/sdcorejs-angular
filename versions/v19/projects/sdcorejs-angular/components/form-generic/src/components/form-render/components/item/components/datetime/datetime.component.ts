/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/no-input-rename */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { SdFormGenericDatetime } from '../../../../../../models';
import { ComponentViewedPipe, HyperlinkPipe } from '../../../../../../pipes';
import { filter, Subject, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { Utilities } from '@sdcorejs/utils/fns';

@Component({
  selector: 'lib-datetime',
  templateUrl: './datetime.component.html',
  styleUrls: ['./datetime.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SdDate,
    SdDatetime,
    // Pipe cho phần viewed
    ComponentViewedPipe,
    HyperlinkPipe,
  ],
})
export class DatetimeComponent {
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

  // Mặc định là date
  subtype?: SdFormGenericDatetime['subtype'] = 'date';
  component?: SdFormGenericDatetime;
  @Input({
    alias: 'component',
    required: true,
  })
  set _component(val: SdFormGenericDatetime) {
    this.component = val;
    this.subtype = this.component?.subtype || 'date';
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
  constructor(private router: Router, private ref: ChangeDetectorRef) {}
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
  onNavigate = (url: string) => {
    if (url?.startsWith('http')) {
      window.open(url);
    } else {
      const [path, queryString] = url?.split('?');
      const queryParams = Utilities.parseQueryParams(queryString);
      this.router.navigate([path], { queryParams });
    }
  };
}
