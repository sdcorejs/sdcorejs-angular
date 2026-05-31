/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/no-input-rename */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdUploadFile } from '@sdcorejs/angular/components/upload-file';
import { SdCustomValidator } from '@sdcorejs/angular/forms/models';
import { filter, Subject, Subscription } from 'rxjs';
import { SdFormGenericUpload } from '../../../../../../models';

@Component({
  selector: 'lib-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SdUploadFile],
})
export class UploadComponent implements OnDestroy {
  @Input({ required: true }) setVariables!: Subject<{ key: string; value: any }>;
  @ViewChild(SdUploadFile) sdUploadFile?: SdUploadFile;
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
      this.#changes.next();
    }
  }

  component?: SdFormGenericUpload;
  @Input({
    alias: 'component',
    required: true,
  })
  set _component(val: SdFormGenericUpload) {
    this.component = val;
    this.#changes.next();
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

  validator?: SdCustomValidator;
  @Input('validator') set _validator(validator: SdCustomValidator | undefined | null) {
    if (validator && this.validator !== validator) {
      this.validator = validator;
    }
  }

  #changes = new Subject<void>();
  #subscription = new Subscription();
  constructor(private readonly ref: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }

  ngOnInit() {
    this.#subscription.add(
      this.setVariables.pipe(filter(variable => variable.key === this.component?.key)).subscribe(variable => {
        this.entity[variable.key] = variable.value;
        this.ref.markForCheck();
      })
    );
  }


  upload = async () => {
    return await this.sdUploadFile?.upload();
  };
}
