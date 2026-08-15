import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, inject, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';
import { Subject, Subscription, filter } from 'rxjs';
import { SdFormGenericCheckbox } from '../../../../../../models';

/**
 * Ô checkbox của form-render.
 *
 * why: form-builder từ trước đã tạo được field `type: 'checkbox'` nhưng form-render KHÔNG có nhánh
 * nào cho nó — field dựng trong builder chạy ra form trống, không hiện gì. Component này lấp chỗ đó
 * theo đúng khuôn của các control còn lại (textfield/radio…): nhận cùng bộ input, tự áp defaultValue,
 * và nghe `setVariables` để giá trị đặt từ biểu thức cũng phản ánh lên UI.
 */
@Component({
  selector: 'lib-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SdCheckbox],
})
export class CheckboxComponent implements OnInit, OnDestroy {
  private ref = inject(ChangeDetectorRef);

  readonly setVariables = input.required<
    Subject<{
      key: string;
      value: any;
    }>
  >();
  readonly form = input(new FormGroup({}));

  entity: Record<string, any> = {};
  @Input({ alias: 'entity', required: true })
  set _entity(val: Record<string, any>) {
    if (this.entity !== val) {
      this.entity = val;
      this.#applyDefaultValue();
    }
  }

  component?: SdFormGenericCheckbox;
  @Input({ alias: 'component', required: true })
  set _component(val: SdFormGenericCheckbox) {
    this.component = val;
    this.#applyDefaultValue();
  }

  disabled = false;
  @Input('disabled') set _disabled(val: boolean | '' | undefined | null) {
    this.disabled = val === '' || !!val;
  }

  viewed = false;
  @Input('viewed') set _viewed(val: boolean | '' | undefined | null) {
    this.viewed = val === '' || !!val;
  }

  #subscription = new Subscription();

  ngOnInit() {
    this.#applyDefaultValue();
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

  /**
   * Chỉ gán khi ô còn `undefined` — người dùng bỏ tick (false) là một lựa chọn có chủ đích, ghi đè
   * bằng defaultValue sẽ tự bật lại checkbox sau mỗi lần re-render.
   */
  #applyDefaultValue = () => {
    if (!this.component?.key || !this.entity) return;
    const isViewed = this.viewed || this.component.properties?.viewed;
    const isUndefined = this.entity[this.component.key] === undefined;
    const hasDefaultValue = this.component.defaultValue !== undefined && this.component.defaultValue !== null;

    if (!isViewed && !this.disabled && isUndefined && hasDefaultValue) {
      this.entity[this.component.key] = this.component.defaultValue;
      this.ref.markForCheck();
    }
  };
}
