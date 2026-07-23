import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, OnDestroy, inject, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { SdFormGenericTextarea } from '../../../../../../models';
import { ComponentViewedPipe } from '../../../../../../pipes';
import { filter, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'lib-textarea',
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SdTextarea,
    // Pipe cho phần viewed
    ComponentViewedPipe,
  ],
})
export class TextareaComponent implements OnInit, OnDestroy {
  private ref = inject(ChangeDetectorRef);

  readonly setVariables = input.required<
    Subject<{
      key: string;
      value: any;
    }>
  >();
  readonly form = input(new FormGroup({}));
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

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}
  ngOnInit() {
    this.#subscription.add(
      this.setVariables()
        .pipe(filter(variable => variable.key === this.component?.key))
        .subscribe(variable => {
          this.entity[variable.key] = variable.value;
          this.ref.markForCheck();
        })
    );
  }
  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }
}
