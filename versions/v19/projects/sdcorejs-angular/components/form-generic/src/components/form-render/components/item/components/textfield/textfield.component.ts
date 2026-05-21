/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/no-input-rename */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdInput } from '@sdcorejs/angular/forms';
import { SdCustomValidator } from '@sdcorejs/angular/forms/models';
import { combineLatest, filter, startWith, Subject, Subscription } from 'rxjs';
import { SdFormGenericTextfield } from '../../../../../../models';
import { ComponentViewedPipe } from '../../../../../../pipes';

@Component({
  selector: 'lib-textfield',
  templateUrl: './textfield.component.html',
  styleUrls: ['./textfield.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SdInput,
    // Pipe cho pháº§n viewed
    ComponentViewedPipe,
  ],
})
export class TextfieldComponent {
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
      this.#applyDefaultValue(); // Ãp dá»¥ng defaultValue khi entity thay Ä‘á»•i
    }
  }

  component?: SdFormGenericTextfield;
  @Input({
    alias: 'component',
    required: true,
  })
  set _component(val: SdFormGenericTextfield) {
    this.component = val;
    this.#applyDefaultValue(); // Ãp dá»¥ng defaultValue khi component thay Ä‘á»•i
  }

  disabled = false;
  @Input('disabled') set _disabled(val: boolean | '' | undefined | null) {
    this.disabled = val === '' || !!val;
    this.#disabledChanges.next(this.disabled);
  }

  required = false;
  @Input('required') set _required(val: boolean | '' | undefined | null) {
    this.required = val === '' || !!val;
  }

  viewed = false;
  @Input('viewed') set _viewed(val: boolean | '' | undefined | null) {
    this.viewed = val === '' || !!val;
  }

  validator?: SdCustomValidator;
  @Input('validator') set _validator(validator: SdCustomValidator | undefined | null) {
    if (validator && this.validator !== validator) {
      this.validator = validator;
    }
  }

  #subscription = new Subscription();
  #disabledChanges = new Subject<boolean>();
  constructor(private ref: ChangeDetectorRef) {}

  ngOnInit() {
    this.#applyDefaultValue(); // Ãp dá»¥ng defaultValue khi component khá»Ÿi táº¡o
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

  /**
   * Ãp dá»¥ng defaultValue náº¿u:
   * - KhÃ´ng á»Ÿ tráº¡ng thÃ¡i viewed
   * - KhÃ´ng bá»‹ disabled
   * - entity[key] chÆ°a cÃ³ giÃ¡ trá»‹ (null, undefined, hoáº·c empty string)
   * - component cÃ³ defaultValue
   */
  #applyDefaultValue = () => {
    if (!this.component?.key || !this.entity) {
      return;
    }
    const isViewed = this.viewed || this.component.properties?.viewed;
    // Chá»‰ gÃ¡n default value náº¿u undefined
    const isUndefined = this.entity[this.component.key] === undefined;
    const hasDefaultValue = this.component.defaultValue !== undefined && this.component.defaultValue !== null;
    // Chá»‰ gÃ¡n defaultValue khi:
    // 1. KhÃ´ng á»Ÿ tráº¡ng thÃ¡i viewed
    // 2. KhÃ´ng bá»‹ disabled
    // 3. GiÃ¡ trá»‹ hiá»‡n táº¡i chÆ°a Ä‘Æ°á»£c  set (null, undefined hoáº·c empty string)
    // 4. Component cÃ³ defaultValue
    if (!isViewed && hasDefaultValue && isUndefined) {
      this.entity[this.component.key] = this.component.defaultValue;
      this.ref.markForCheck();
    }
  };
}

