/* eslint-disable @angular-eslint/no-input-rename */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdAutocomplete } from '@sdcorejs/angular/forms/autocomplete';
import {
  GetComponentAttributes,
  GetVariableAttributes,
  SdFormGenericComponent,
  SdFormGenericDefinitionSelection,
  SdFormGenericGroup,
  SdFormGenericVariable,
} from '../../../../../../models';
import { startWith, Subject, Subscription } from 'rxjs';
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
  @Input({ required: true }) components!: (SdFormGenericComponent | SdFormGenericGroup)[];
  @Input({ required: true }) variables!: SdFormGenericVariable[];
  form = new FormGroup({});
  @Input() label?: string;
  @Input({ required: true }) selections: SdFormGenericDefinitionSelection[] = [];
  valuesKey?: string | null;
  @Input({ alias: 'valuesKey', required: true }) set _valuesKey(valuesKey: string | undefined | null) {
    this.valuesKey = valuesKey;
    this.#inputChanges.next();
  }
  selection?: SdFormGenericDefinitionSelection;

  leftProperties?: Property[];
  rightProperties?: Property[];

  queryString?: string;
  model?: Record<string, any>;
  @Input({ alias: 'model', required: true }) set _model(model: Record<string, any> | undefined) {
    this.model = JSON.parse(JSON.stringify({ ...model }));
    // Parse JSON -> STRING Ä‘á»ƒ hiá»ƒn thá»‹ trÃªn UI
    this.queryString = JSON.stringify(this.model);
  }
  @Output() modelChange = new EventEmitter<Record<string, string>>();

  // Má»—i láº§n inputChanges thÃ¬ tÃ­nh láº¡i selection
  #inputChanges = new Subject<void>();
  #subscription = new Subscription();
  constructor(private ref: ChangeDetectorRef) {}

  ngOnInit() {
    this.#subscription.add(
      this.#inputChanges.pipe(startWith('')).subscribe(() => {
        this.selection = this.selections?.find?.(e => e.value === this.valuesKey);
      })
    );
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }

  edit = async () => {
    this.leftProperties = this.selection?.queries?.items || [];
    this.rightProperties = [...GetComponentAttributes(this.components), ...GetVariableAttributes(this.variables)].map(e => ({
      value: '${' + e.value + '}',
      display: e.display,
    }));
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

export interface Property {
  value: string;
  display: string;
}

