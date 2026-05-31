/* eslint-disable @angular-eslint/no-input-rename */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, inject } from '@angular/core';
import { SdFormatComponent, SdFormGenericComponent, SdFormGenericGroup, SdFormGenericUpload, SdFormGenericVariable } from '../../../../../models';
import { AttributeInput } from '../../attribute-input/attribute-input.component';
import { AttributeSelect } from '../../attribute-select/attribute-select.component';
import { AttributeSwitch } from '../../attribute-switch/attribute-switch.component';
import { AttributeTemplate } from '../../attribute-template/attribute-template.component';
import { AttributeExpression } from '../../attribute-expression/attribute-expression.component';
import { BuilderService } from '../../../services';
import { FormGroup } from '@angular/forms';
import { debounceTime, filter, Subscription } from 'rxjs';
import { AttributeInputNumber } from '../../attribute-input-number/attribute-input-number.component';
import { AttributeParameter } from '../../attribute-parameter/attribute-parameter.component';
import { I18nService, TranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  selector: 'upload-attribute',
  templateUrl: './upload-attribute.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AttributeTemplate, AttributeInput, AttributeInputNumber, AttributeSwitch, AttributeSelect, AttributeExpression , AttributeParameter, TranslatePipe],
})
export class UploadAttribute {
  form = new FormGroup({});
  @Input({ required: true }) components!: (SdFormGenericComponent | SdFormGenericGroup)[];
  @Input({ required: true }) variables!: SdFormGenericVariable[];
  component!: SdFormGenericUpload;
  extension?: string;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericUpload) {
    this.component = component;
    SdFormatComponent(this.component);
    this.extension = this.component.properties!.extensions?.join(',') || '';
  }

  #subscription = new Subscription();
  readonly #i18n = inject(I18nService);
  // Dropdown nguồn upload (mobile); display dịch qua i18n để hỗ trợ EN
  sources: {
    value: 'ALL' | 'PHOTO_LIBRARY' | 'CAPTURE';
    display: string;
  }[] = [{
    value: 'ALL',
    display: this.#i18n.t('core.component.form-builder.upload-source.all')
  },{
    value: 'PHOTO_LIBRARY',
    display: this.#i18n.t('core.component.form-builder.upload-source.photo-library')
  },{
    value: 'CAPTURE',
    display: this.#i18n.t('core.component.form-builder.upload-source.capture')
  }];
  constructor(
    private ref: ChangeDetectorRef,
    private builderService: BuilderService
  ) {}

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
    if (template && template.type === 'upload') {
      // Dùng Object Assign để không bị tạo ra reference mới
      Object.assign(this.component, {
        ...template,
        id: this.component.id, // Giữ lại id để componentEmitters định danh được component nào bị thay đổi
      });
      SdFormatComponent(this.component);
      this.component.properties!.type = this.component.properties!.type || 'file';
      this.builderService.componentEmitters.next(this.component);
      this.ref.markForCheck();
    }
  };

  onChangeExtension = (extension: string) => {
    this.extension = extension;
    this.component.properties!.extensions =
      extension
        ?.split(',')
        ?.map(val => val?.trim())
        ?.filter(val => !!val) || [];
  };
}
