import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewChild, OnInit, inject, input, output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { Utilities } from '@sdcorejs/utils/fns';
import { SdFormGenericComponent, SdFormGenericGroup } from '../../../../models';
import { SdInput } from '@sdcorejs/angular/forms';
import { TranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  selector: 'attribute-parameter',
  templateUrl: './attribute-parameter.component.html',
  styleUrl: './attribute-parameter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdButton, SdModal, SdInput, TranslatePipe],
})
export class AttributeParameter implements OnInit {
  private ref = inject(ChangeDetectorRef);

  @ViewChild(SdModal) modal?: SdModal;
  readonly components = input.required<(SdFormGenericComponent | SdFormGenericGroup)[]>();
  form = new FormGroup({});
  @Input() label?: string;

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

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit() {}

  edit = async () => {
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
