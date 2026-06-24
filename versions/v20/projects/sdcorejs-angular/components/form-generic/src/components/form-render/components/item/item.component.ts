import { ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdCustomValidator } from '@sdcorejs/angular/forms/models';
import { SdFormGenericComponent } from '../../../../models';
import {
  ChipCalendarComponent,
  ChipStringComponent,
  DatetimeComponent,
  NumberComponent,
  RadioComponent,
  SelectComponent,
  TableComponent,
  TextareaComponent,
  TextfieldComponent,
  UploadComponent,
} from './components';
import { Subject } from 'rxjs';
import { HtmlComponent } from './components/html/html.component';

@Component({
  selector: 'lib-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TextfieldComponent,
    TextareaComponent,
    ChipStringComponent,
    ChipCalendarComponent,
    NumberComponent,
    DatetimeComponent,
    SelectComponent,
    RadioComponent,
    TableComponent,
    UploadComponent,
    HtmlComponent,
  ],
})
export class LibItemComponent {
  @ViewChild(UploadComponent) itemUpload?: UploadComponent;
  @ViewChild(TableComponent) itemTable?: TableComponent;
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

  col = 'col-6 px-8 py-8';
  component?: SdFormGenericComponent;
  @Input({
    alias: 'component',
    required: true,
  })
  set _component(val: SdFormGenericComponent) {
    this.component = val;
    this.col = `col-${this.component?.layout?.columns || '6'} px-8 py-8`;
  }

  disabled = false;
  @Input('disabled') set _disabled(val: boolean | '' | undefined) {
    this.disabled = val === '' || !!val;
  }

  required = false;
  @Input('required') set _required(val: boolean | '' | undefined) {
    this.required = val === '' || !!val;
  }

  viewed = false;
  @Input('viewed') set _viewed(val: boolean | '' | undefined) {
    this.viewed = val === '' || !!val;
  }

  validator?: SdCustomValidator;
  @Input('validator') set _validator(validator: SdCustomValidator) {
    if (validator && this.validator !== validator) {
      this.validator = validator;
    }
  }

  // Thực hiện upload nếu có component upload
  // TODO: Bổ sung logic upload cho table
  upload = async () => {
    await this.itemUpload?.upload?.();
    await this.itemTable?.upload?.();
  };

  // items: SdSearch = (args)=> {
  //   const {  } = args;
  // }

  // onSelect = (data: BaseEntity | BaseEntity[]) => {
  //   if (Array.isArray(data)) {
  //     this.entity[this.component.key] = data.map(selected => selected?.id).filter(val => !!val);
  //   } else {
  //     this.entity[this.component.key] = data?.id;
  //   }
  // };
}
