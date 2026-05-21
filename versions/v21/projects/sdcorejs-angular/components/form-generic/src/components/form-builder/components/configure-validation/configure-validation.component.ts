/* eslint-disable @angular-eslint/no-input-rename */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Inject, Optional, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from '@angular/material/menu';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdInput, SdLabel, SdSelect } from '@sdcorejs/angular/forms';
import { SdUtilities } from '@sdcorejs/angular/utilities/extensions';
import { ISdFormGenericConfiguration, SD_FORM_GENERIC_CONFIGURATION } from '../../../../configurations';
import { Attribute, GetAttributes } from '../../../../models';
import { SdFormGenericValidation, SdFormGenericValidationFunction, ValidationAlerts } from '../../../../models/form-generic-validation.model';
import { SdFormGeneric } from '../../../../models/form-generic.model';
import { ExpressionBuilderComponent } from '../expression-builder/expression-builder.component';
import { TranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  selector: 'configure-validation',
  templateUrl: './configure-validation.component.html',
  styleUrl: './configure-validation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatMenuModule, SdModal, SdButton, SdInput, SdSelect, ExpressionBuilderComponent, MatIconModule, TranslatePipe],
})
export class ConfigureValidationComponent {
  @ViewChild(SdModal) modal?: SdModal;
  form = new FormGroup({});
  attributes: Attribute[] = [];
  validations: SdFormGenericValidation[] = [];
  functions: SdFormGenericValidationFunction[] = [];
  alerts = ValidationAlerts;
  @Output() accept = new EventEmitter<SdFormGenericValidation[]>();
  constructor(
    private ref: ChangeDetectorRef,
    @Optional() @Inject(SD_FORM_GENERIC_CONFIGURATION) private formGenericConfiguration: ISdFormGenericConfiguration | null
  ) {
    this.functions = this.formGenericConfiguration?.form?.validation?.functions || [];
  }

  ngAfterViewInit(): void {
    // this.#subscription.add(
    //   this.#validationsChanges.pipe(debounceTime(200), startWith(this.validations)).subscribe(() => {
    //     // Khi component thay Ä‘á»•i thÃ¬ sync láº¡i
    //     this.ref.markForCheck();
    //   })
    // );
  }

  ngOnDestroy(): void {
  }

  open = (formGeneric: SdFormGeneric) => {
    // Xá»­ lÃ½ gÃ¡n validations
    if (Array.isArray(formGeneric?.validations)) {
      this.validations = JSON.parse(JSON.stringify(formGeneric?.validations));
    } else {
      this.validations = [];
    }
    this.attributes = GetAttributes(formGeneric.components)
    if (formGeneric) {
      this.modal?.open();
      this.ref.markForCheck();
    }
  };

  addValidation = (type: SdFormGenericValidation['type']) => {
    if (type === 'expression') {
      this.validations.push({
        alert: 'error',
        type,
        expression: {
          key: SdUtilities.randomId(),
          type: 'combinator',
          combinator: '&&',
          conditions: [],
        },
        message: '',
      });
    } else if (type === 'function') {
      this.validations.push({
        alert: 'error',
        type,
        code: '',
      });
    }
    this.ref.markForCheck();
  };

  removaValidation = (index: number) => {
    this.validations.splice(index, 1);
    this.ref.markForCheck();
  };

  updateValidations = () => {
    this.accept.emit(this.validations);
    this.modal?.close();
  };
}

