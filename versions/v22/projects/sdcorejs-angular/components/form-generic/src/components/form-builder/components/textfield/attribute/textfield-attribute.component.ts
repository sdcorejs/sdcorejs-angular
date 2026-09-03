import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, AfterViewInit, OnDestroy, inject, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { debounceTime, filter, Subscription } from 'rxjs';
import {
  sdFormatComponent,
  SdFormGenericComponent,
  SdFormGenericGroup,
  SdFormGenericTextfield,
  SdFormGenericVariable,
} from '../../../../../models';
import { BuilderService } from '../../../services';
import { AttributeExpression } from '../../attribute-expression/attribute-expression.component';
import { AttributeInputNumber } from '../../attribute-input-number/attribute-input-number.component';
import { AttributeInput } from '../../attribute-input/attribute-input.component';
import { AttributeSwitch } from '../../attribute-switch/attribute-switch.component';
import { AttributeTemplate } from '../../attribute-template/attribute-template.component';
import { AttributeTextarea } from '../../attribute-textarea/attribute-textarea.component';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  selector: 'textfield-attribute',
  templateUrl: './textfield-attribute.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AttributeTemplate,
    AttributeExpression,
    AttributeInput,
    AttributeInputNumber,
    AttributeSwitch,
    AttributeTextarea,
    SdTranslatePipe,
  ],
})
export class TextfieldAttribute implements AfterViewInit, OnDestroy {
  private ref = inject(ChangeDetectorRef);
  private builderService = inject(BuilderService);

  form = new FormGroup({});
  readonly components = input.required<(SdFormGenericComponent | SdFormGenericGroup)[]>();
  readonly variables = input.required<SdFormGenericVariable[]>();
  component!: SdFormGenericTextfield;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericTextfield) {
    this.component = component;
    sdFormatComponent(this.component);
  }

  #subscription = new Subscription();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngAfterViewInit(): void {
    // Khi thay đổi, debound 0.5s rồi mới emit output
    this.#subscription.add(
      this.form.valueChanges.pipe(debounceTime(500)).subscribe(() => {
        this.builderService.componentEmitters.next(this.component);
      })
    );
    this.#subscription.add(
      // Chỉ lắng nghe sự kiện thay đổi tương ứng với component dựa vào id
      this.builderService.componentListeners.pipe(filter(component => component.id === this.component.id)).subscribe(component => {
        if (component) {
          this.ref.markForCheck();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }

  onChangeTemplate = (template: SdFormGenericComponent) => {
    if (template && template.type === 'textfield') {
      // Dùng Object Assign để không bị tạo ra reference mới
      Object.assign(this.component, {
        ...template,
        id: this.component.id, // Giữ lại id để componentEmitters định danh được component nào bị thay đổi
      });
      sdFormatComponent(this.component);
      this.builderService.componentEmitters.next(this.component);
      this.ref.markForCheck();
    }
  };
}
