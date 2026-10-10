import { ChangeDetectionStrategy, Component, computed, inject, input, viewChild } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import type { SdFormGenericField } from '../../../../models/form-generic-field.model';
import type { SdFormGenericElementState } from '../../../../rules/form-generic-filter';
import {
  CheckboxComponent,
  ChipCalendarComponent,
  ChipStringComponent,
  DatetimeComponent,
  HtmlComponent,
  NumberComponent,
  RadioComponent,
  SelectComponent,
  TextareaComponent,
  TextfieldComponent,
  UploadComponent,
} from './components';
import { FormRenderContext } from '../../form-render.context';

/** Một field của `sd-form-render`: chọn control theo `type`, trạng thái (khoá/bắt buộc) do renderer tính. */
@Component({
  selector: 'lib-item',
  templateUrl: './item.component.html',
  styleUrl: './item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      // Wrapped helper/error text contributes its real height to the renderer grid. Keep the
      // consumer's other Material defaults and leave controls outside this private item unchanged.
      useFactory: () => ({
        ...inject(MAT_FORM_FIELD_DEFAULT_OPTIONS, { skipSelf: true, optional: true }),
        subscriptSizing: 'dynamic',
      }),
    },
  ],
  imports: [
    TextfieldComponent,
    TextareaComponent,
    ChipStringComponent,
    ChipCalendarComponent,
    NumberComponent,
    DatetimeComponent,
    SelectComponent,
    RadioComponent,
    CheckboxComponent,
    UploadComponent,
    HtmlComponent,
  ],
})
export class LibItemComponent {
  readonly field = input.required<SdFormGenericField>();
  readonly state = input.required<SdFormGenericElementState>();
  readonly form = input.required<FormGroup>();

  readonly #registrations = new WeakMap<
    FormGroup,
    {
      form: FormGroup;
      controls: Map<string, { control: AbstractControl; hadOriginal: boolean; original?: AbstractControl }>;
    }
  >();
  readonly registrationForm = computed(() => this.#registration(this.form()).form);

  registeredControl(): AbstractControl | null {
    const group = this.form();
    const name = this.field().key;
    const entry = name ? this.#registration(group).controls.get(name) : undefined;
    return name && entry && Object.hasOwn(group.controls, name) && group.controls[name] === entry.control ? entry.control : null;
  }

  #registration(group: FormGroup) {
    const known = this.#registrations.get(group);
    if (known) return known;
    const controls = new Map<string, { control: AbstractControl; hadOriginal: boolean; original?: AbstractControl }>();
    const methods = new Map<PropertyKey, { original: unknown; bound: (...args: unknown[]) => unknown }>();
    const form = new Proxy(group, {
      get: (target, property) => {
        const value = Reflect.get(target, property, target);
        if (typeof value !== 'function' || property === 'constructor') return value;
        const cached = methods.get(property);
        if (cached && cached.original === value) return cached.bound;
        const bound = (...args: unknown[]) => {
          const mutation =
            property === 'addControl' || property === 'registerControl' || property === 'setControl' || property === 'removeControl';
          const name = mutation && typeof args[0] === 'string' ? args[0] : undefined;
          const hadBefore = !!name && Object.hasOwn(target.controls, name);
          const before = name ? target.controls[name] : undefined;
          const entry = name ? controls.get(name) : undefined;
          const result = Reflect.apply(value, target, args);
          if (!name) return result;
          const hasAfter = Object.hasOwn(target.controls, name);
          const after = target.controls[name];
          if (!hasAfter) controls.delete(name);
          else if (entry && before === entry.control && entry.hadOriginal && after === entry.original) controls.delete(name);
          else if (property !== 'removeControl' && after === args[1] && after !== before) {
            controls.set(
              name,
              entry && before === entry.control
                ? { ...entry, control: after }
                : { control: after, hadOriginal: hadBefore, original: before }
            );
          }
          return result;
        };
        methods.set(property, { original: value, bound });
        return bound;
      },
      set: (target, property, value) => Reflect.set(target, property, value, target),
    });
    const registration = { form, controls };
    this.#registrations.set(group, registration);
    return registration;
  }

  readonly #context = inject(FormRenderContext);
  /**
   * Bắt buộc có hiệu lực. why: field chỉ xem không được validate — người dùng không sửa được nó, và
   * control của nó (có hoặc không, tuỳ type) không được làm `validate()` lỗi mà không hiện gì.
   */
  readonly required = computed(() => this.state().required && !(this.#context.viewed() || !!this.field().viewed));

  // why: signal queries cannot live on ES `#private` members (NG1053).
  private readonly uploader = viewChild(UploadComponent);

  /** Tải lên tệp đang chờ nếu field là upload. */
  async upload(): Promise<void> {
    await this.uploader()?.upload();
  }
}
