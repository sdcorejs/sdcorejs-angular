import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  OnDestroy,
  Optional,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SdSection } from '@sdcorejs/angular/components/section';
// import { sha1 } from 'object-hash';
import { Utilities } from '@sdcorejs/utils/fns';
import { combineLatest, Subject, Subscription } from 'rxjs';
import { debounceTime, startWith } from 'rxjs/operators';
import { ISdFormGenericConfiguration, SD_FORM_GENERIC_CONFIGURATION } from '../../configurations';
import { EvaluateExpression, SdFormatComponent, SdFormGenericComponent, SdFormGenericGroup, SdFormRenderConfiguration } from '../../models';
import { SdFormGenericValidation } from '../../models/form-generic-validation.model';
import { WhenExpressionPipe } from '../../pipes';
import { LibItemComponent, VariableComponent } from './components';

@Component({
  selector: 'sd-form-render',
  templateUrl: './form-render.component.html',
  styleUrls: ['./form-render.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdSection, LibItemComponent, WhenExpressionPipe, VariableComponent],
})
export class SdFormRender implements OnDestroy, AfterViewInit {
  @ViewChildren(LibItemComponent) formRenderItems: QueryList<LibItemComponent> = new QueryList<LibItemComponent>();
  @Input() form: FormGroup = new FormGroup({});
  configuration!: SdFormRenderConfiguration;
  @Input({ alias: 'configuration', required: true }) set _configuration(val: SdFormRenderConfiguration) {
    this.configuration = this.#cloneAndFormatConfiguration(val);
    // Luôn format lại component trước khi render
    this.#configurationChanges.next(this.configuration);
  }

  // Dựa vào giá trị default sẽ gán cho entity
  #defaultEntity: Record<string, any> = {};
  @Input('defaultEntity') set _default(defaultEntity: Record<string, any>) {
    this.#defaultEntity = defaultEntity;
    this.#defaultEntityChanges.next(defaultEntity);
  }

  entity: Record<string, any> = {};
  @Input('entity') set _entity(val: Record<string, any>) {
    this.entity = val;
    this.#entityChanges.next(this.entity);
  }

  properties: string[] = [];
  @Input('properties') set _properties(val: string[]) {
    this.properties = val;
  }

  viewed = false;
  @Input('viewed') set _viewed(val: boolean | '') {
    this.viewed = val === '' || val;
  }
  #subscription = new Subscription();
  #configurationChanges = new Subject<SdFormRenderConfiguration>();
  #defaultEntityChanges = new Subject<Record<string, any>>();
  #entityChanges = new Subject<Record<string, any>>();
  loadCompleted = false;
  hashedValues?: string;
  formValue: Record<string, any> = {};

  // Các component item của form-render sẽ lắng nghe thay đổi
  setVariables = new Subject<{ key: string; value: any }>();
  constructor(
    private ref: ChangeDetectorRef,
    @Optional() @Inject(SD_FORM_GENERIC_CONFIGURATION) private formGenericConfiguration: ISdFormGenericConfiguration | null
  ) {}

  ngAfterViewInit(): void {
    this.#subscription.add(
      combineLatest([this.#configurationChanges, this.#entityChanges])
        .pipe(startWith([]))
        .subscribe(async () => {
          if (this.entity && this.configuration?.components?.length) {
            this.loadCompleted = true;
            this.ref.markForCheck(); // Vì loadCompleted ko phải là @Input nên component sẽ ko load lại
            if (this.configuration?.onLoaded) {
              try {
                this.configuration.onLoaded();
              } catch (err) {
                console.error(err);
              }
            }
          }
        })
    );
    this.#subscription.add(
      this.#defaultEntityChanges.pipe(startWith(this.#defaultEntity)).subscribe(defaultEntity => {
        for (const key of Object.keys({ ...defaultEntity })) {
          this.entity[key] = this.entity[key] ?? defaultEntity[key];
        }
        this.#patchRegisteredControls(this.entity);
        this.#syncRawControl(this.entity);
      })
    );
    this.#subscription.add(
      this.#entityChanges.pipe(startWith(this.entity)).subscribe(entity => {
        this.#syncRawControl(entity);
      })
    );
    this.#subscription.add(
      this.form.valueChanges.pipe(debounceTime(500), startWith(this.form.value)).subscribe(values => {
        const hashedValues = Utilities.hash(values);
        if (this.hashedValues !== hashedValues) {
          this.hashedValues = hashedValues;
          // Ở trạng thái view thì không có FormControl nên phải binding entity mới có dữ liệu cho formValue
          this.formValue = { ...this.entity, ...values };
          this.ref.markForCheck();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }

  // Hàm này sẽ đi qua các components và các columns trong table để xử lý upload file
  // Trước khi thực hiện lưu thì cần gọi hàm này trước để mapping giá trị đúng
  upload = async () => {
    for (const formRenderItem of this.formRenderItems || []) {
      await formRenderItem.upload();
    }
  };

  // Nên gọi hàm này trước khi save/submit
  // Hàm này trả về mảng string error
  // Nếu không có error nào thì trả về mảng rỗng
  getValidationMessages = async (alert: SdFormGenericValidation['alert']) => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const messages: string[] = [];
    for (const validation of this.configuration?.validations?.filter(e => e.alert === alert) || []) {
      if (validation.type === 'expression') {
        const result = EvaluateExpression(validation.expression, this.entity);
        if (result) {
          messages.push(validation.message);
        }
      } else if (validation.type === 'function') {
        const func = this.formGenericConfiguration?.form?.validation?.functions?.find(e => e.value === validation.code);
        if (func?.validate) {
          const message = await func.validate({
            entity: this.entity,
          });
          if (message) {
            messages.push(message);
          }
        }
      }
    }
    return messages;
  };

  #cloneAndFormatConfiguration(configuration: SdFormRenderConfiguration): SdFormRenderConfiguration {
    return {
      ...configuration,
      components: (configuration?.components || []).map(component => this.#cloneAndFormatComponent(component)),
    };
  }

  #patchRegisteredControls(entity: Record<string, any>): void {
    const registeredValue: Record<string, any> = {};
    for (const key of Object.keys(entity)) {
      if (key !== 'sdRaw' && this.form.controls[key]) {
        registeredValue[key] = entity[key];
      }
    }

    if (Object.keys(registeredValue).length) {
      this.form.patchValue(registeredValue);
    }
  }

  #syncRawControl(entity: Record<string, any>): void {
    if (!this.form.controls['sdRaw']) {
      this.form.addControl('sdRaw', new FormControl({ ...entity }));
    } else {
      this.form.controls['sdRaw'].setValue({ ...entity });
    }
  }

  #cloneAndFormatComponent(component: SdFormGenericComponent | SdFormGenericGroup): SdFormGenericComponent | SdFormGenericGroup {
    const clonedComponent = JSON.parse(JSON.stringify(component)) as SdFormGenericComponent | SdFormGenericGroup;
    SdFormatComponent(clonedComponent);

    if (clonedComponent.type === 'group') {
      clonedComponent.components = clonedComponent.components.map(child => this.#cloneAndFormatComponent(child) as SdFormGenericComponent);
    }

    return clonedComponent;
  }
}
