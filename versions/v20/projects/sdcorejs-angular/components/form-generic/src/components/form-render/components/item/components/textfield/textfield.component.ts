import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdInput } from '@sdcorejs/angular/forms';
import { SdCustomValidator } from '@sdcorejs/angular/forms/models';
import { filter, Subject, Subscription } from 'rxjs';
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
    // Pipe cho phần viewed
    ComponentViewedPipe,
  ],
})
export class TextfieldComponent implements OnInit, OnDestroy {
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
      this.#applyDefaultValue(); // Áp dụng defaultValue khi entity thay đổi
    }
  }

  component?: SdFormGenericTextfield;
  @Input({
    alias: 'component',
    required: true,
  })
  set _component(val: SdFormGenericTextfield) {
    this.component = val;
    this.#applyDefaultValue(); // Áp dụng defaultValue khi component thay đổi
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
    this.#applyDefaultValue(); // Áp dụng defaultValue khi component khởi tạo
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
   * Áp dụng defaultValue nếu:
   * - Không ở trạng thái viewed
   * - Không bị disabled
   * - entity[key] chưa có giá trị (null, undefined, hoặc empty string)
   * - component có defaultValue
   */
  #applyDefaultValue = () => {
    if (!this.component?.key || !this.entity) {
      return;
    }
    const isViewed = this.viewed || this.component.properties?.viewed;
    // Chỉ gán default value nếu undefined
    const isUndefined = this.entity[this.component.key] === undefined;
    const hasDefaultValue = this.component.defaultValue !== undefined && this.component.defaultValue !== null;
    // Chỉ gán defaultValue khi:
    // 1. Không ở trạng thái viewed
    // 2. Không bị disabled
    // 3. Giá trị hiện tại chưa được  set (null, undefined hoặc empty string)
    // 4. Component có defaultValue
    if (!isViewed && hasDefaultValue && isUndefined) {
      this.entity[this.component.key] = this.component.defaultValue;
      this.ref.markForCheck();
    }
  };
}
