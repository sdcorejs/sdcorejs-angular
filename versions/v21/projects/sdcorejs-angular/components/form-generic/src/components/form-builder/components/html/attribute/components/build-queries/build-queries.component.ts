import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  ViewChild,
  OnInit,
  OnDestroy,
  inject,
  input,
  output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdAutocomplete } from '@sdcorejs/angular/forms/autocomplete';
import {
  GetComponentAttributes,
  GetVariableAttributes,
  SdFormGenericComponent,
  SdFormGenericGroup,
  SdFormGenericVariable,
} from '../../../../../../../models';
import { TranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  selector: 'build-queries',
  templateUrl: './build-queries.component.html',
  styleUrl: './build-queries.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdAutocomplete, SdButton, SdModal, TranslatePipe],
})
export class BuildQueries implements OnInit, OnDestroy {
  private ref = inject(ChangeDetectorRef);

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
  readonly components = input.required<(SdFormGenericComponent | SdFormGenericGroup)[]>();
  readonly variables = input.required<SdFormGenericVariable[]>();
  rightProperties?: Property[];
  queryString?: string;
  model?: Record<string, any>;
  @Input({ alias: 'model', required: true }) set _model(model: Record<string, any> | undefined) {
    this.model = JSON.parse(JSON.stringify({ ...model }));
    // Parse JSON -> STRING để hiển thị trên UI
    this.queryString = JSON.stringify(this.model);
  }
  readonly modelChange = output<Record<string, string>>();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit() {}

  ngOnDestroy() {}

  edit = () => {
    this.rightProperties =
      [...GetComponentAttributes(this.components()), ...GetVariableAttributes(this.variables())].map(e => ({
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
