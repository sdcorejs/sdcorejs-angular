import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { SdFormGenericTextarea } from '../../../../../../models';
import { ComponentViewedPipe } from '../../../../../../pipes';
import { filter, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'lib-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SdTextarea,
    // Pipe cho phần viewed
    ComponentViewedPipe,
  ],
})
export class TextareaComponent implements OnInit, OnDestroy {
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

  component?: SdFormGenericTextarea;
  @Input({
    alias: 'component',
    required: true,
  })
  set _component(val: SdFormGenericTextarea) {
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
