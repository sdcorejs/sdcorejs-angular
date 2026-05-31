/* eslint-disable @angular-eslint/no-input-rename */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdAutocomplete } from '@sdcorejs/angular/forms/autocomplete';
import { GetComponentAttributes, GetVariableAttributes, SdFormGenericComponent, SdFormGenericGroup, SdFormGenericVariable } from '../../../../../../../models';
import { TranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  selector: 'build-queries',
  templateUrl: './build-queries.component.html',
  styleUrl: './build-queries.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdAutocomplete, SdButton, SdModal, TranslatePipe],
})
export class BuildQueries {
  @ViewChild(SdModal) modal?: SdModal;
  form = new FormGroup({});
  @Input() label?: string;
  leftProperties?: Property[];
  @Input({ alias: 'queries', required: true }) set _queries(queries: { key: string; label: string }[] | undefined | null) {
    this.leftProperties =
      queries?.map(e => ({
        value: e.key,
        display: e.label,
      })) || [];
  }
  @Input({ required: true }) components!: (SdFormGenericComponent | SdFormGenericGroup)[];
  @Input({ required: true }) variables!: SdFormGenericVariable[];
  rightProperties?: Property[];
  queryString?: string;
  model?: Record<string, any>;
  @Input({ alias: 'model', required: true }) set _model(model: Record<string, any> | undefined) {
    this.model = JSON.parse(JSON.stringify({ ...model }));
    // Parse JSON -> STRING để hiển thị trên UI
    this.queryString = JSON.stringify(this.model);
  }
  @Output() modelChange = new EventEmitter<Record<string, string>>();

  constructor(private ref: ChangeDetectorRef) {}

  ngOnInit() {}

  ngOnDestroy() {}

  edit = () => {
    this.rightProperties =
      [...GetComponentAttributes(this.components), ...GetVariableAttributes(this.variables)].map(e => ({
        value: '${' + e.value + '}',
        display: e.display,
      })) || [];
    this.modal?.open?.();
    this.ref.markForCheck();
  };

  onAccept = () => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const result: Record<string, string> = {};
    for (const key of Object.keys(this.model!)) {
      const value = this.model?.[key];
      if (value !== undefined && value !== null && value !== '') {
        result[key] = value;
      }
    }
    this.modelChange.emit(result);
    this.modal?.close();
    this.ref.markForCheck();
  };
}

interface Property {
  value: string;
  display: string;
}
