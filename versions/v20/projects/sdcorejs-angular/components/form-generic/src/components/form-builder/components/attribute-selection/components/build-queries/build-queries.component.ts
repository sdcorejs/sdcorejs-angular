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
  sdGetComponentAttributes,
  sdGetVariableAttributes,
  SdFormGenericComponent,
  SdFormGenericDefinitionSelection,
  SdFormGenericGroup,
  SdFormGenericVariable,
} from '../../../../../../models';
import { startWith, Subject, Subscription } from 'rxjs';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  selector: 'build-queries',
  templateUrl: './build-queries.component.html',
  styleUrl: './build-queries.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdAutocomplete, SdButton, SdModal, SdTranslatePipe],
})
export class BuildQueries implements OnInit, OnDestroy {
  private ref = inject(ChangeDetectorRef);

  @ViewChild(SdModal) modal?: SdModal;
  readonly components = input.required<(SdFormGenericComponent | SdFormGenericGroup)[]>();
  readonly variables = input.required<SdFormGenericVariable[]>();
  form = new FormGroup({});
  @Input() label?: string;
  readonly selections = input.required<SdFormGenericDefinitionSelection[]>();
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
    // Parse JSON -> STRING để hiển thị trên UI
    this.queryString = JSON.stringify(this.model);
  }
  readonly modelChange = output<Record<string, string>>();

  // Mỗi lần inputChanges thì tính lại selection
  #inputChanges = new Subject<void>();
  #subscription = new Subscription();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  ngOnInit() {
    this.#subscription.add(
      this.#inputChanges.pipe(startWith('')).subscribe(() => {
        this.selection = this.selections()?.find?.(e => e.value === this.valuesKey);
      })
    );
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }

  edit = async () => {
    this.leftProperties = this.selection?.queries?.items || [];
    this.rightProperties = [...sdGetComponentAttributes(this.components()), ...sdGetVariableAttributes(this.variables())].map(e => ({
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
