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
import { Utilities } from '@sdcorejs/utils/fns';
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
  selector: 'build-variables',
  templateUrl: './build-variables.component.html',
  styleUrl: './build-variables.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdAutocomplete, SdButton, SdModal, SdTranslatePipe],
})
export class BuildVariables implements OnInit, OnDestroy {
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

  items: {
    id: string;
    key: string;
    value: any;
  }[] = [];
  queryString?: string;
  #model!: Record<string, any>;
  @Input({ alias: 'model', required: true }) set _model(model: Record<string, any> | undefined) {
    this.#model = JSON.parse(JSON.stringify({ ...model }));
    // Parse JSON -> STRING để hiển thị trên UI
    this.queryString = JSON.stringify(this.#model);
    this.items = Object.keys(this.#model).map(key => ({
      id: Utilities.randomId(),
      key,
      value: this.#model?.[key],
    }));
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
    this.leftProperties = [...sdGetComponentAttributes(this.components()), ...sdGetVariableAttributes(this.variables())];
    this.rightProperties =
      this.selection?.variables?.items?.map(e => ({
        value: '${' + e.value + '}',
        display: e.display,
      })) || [];
    this.modal?.open?.();
    this.ref.markForCheck();
    this.modal?.open?.();
    this.ref.markForCheck();
  };

  addField = () => {
    this.items.push({
      id: Utilities.randomId(),
      key: '',
      value: '',
    });
    this.ref.markForCheck();
  };

  remove = (idx: number) => {
    this.items.splice(idx, 1);
    this.ref.markForCheck();
  };

  onAccept = () => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const result: Record<string, string> = {};
    for (const { key, value } of this.items) {
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
