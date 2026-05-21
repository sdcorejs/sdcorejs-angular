/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/no-input-rename */
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  OnDestroy,
  Optional,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SdSection } from '@sdcorejs/angular/components/section';
// import { sha1 } from 'object-hash';
import { SdBaseSecureComponent } from '@sdcorejs/angular/components/base';
import { SdUtilities } from '@sdcorejs/angular/utilities';
import { combineLatest, Subject, Subscription } from 'rxjs';
import { debounceTime, startWith } from 'rxjs/operators';
import { ISdFormGenericConfiguration, SD_FORM_GENERIC_CONFIGURATION } from '../../configurations';
import {
  EvaluateExpression,
  SdFormatComponent,
  SdFormRenderConfiguration
} from '../../models';
import { SdFormGenericValidation } from '../../models/form-generic-validation.model';
import { WhenExpressionPipe } from '../../pipes';
import { LibItemComponent, VariableComponent } from './components';

@Component({
  selector: 'sd-form-render',
  templateUrl: './form-render.component.html',
  styleUrls: ['./form-render.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdSection, LibItemComponent, WhenExpressionPipe, VariableComponent],
})
export class SdFormRender extends SdBaseSecureComponent implements OnDestroy, AfterViewInit {
  @ViewChildren(LibItemComponent) formRenderItems: QueryList<LibItemComponent> = new QueryList<LibItemComponent>();
  @Input() form: FormGroup = new FormGroup({});
  configuration!: SdFormRenderConfiguration;
  @Input({ alias: 'configuration', required: true }) set _configuration(val: SdFormRenderConfiguration) {
    this.configuration = val;
    // LuÃ´n format láº¡i component trÆ°á»›c khi render
    this.configuration?.components?.forEach(SdFormatComponent);
    this.#configurationChanges.next(this.configuration);
  }

  // Dá»±a vÃ o giÃ¡ trá»‹ default sáº½ gÃ¡n cho entity
  #defaultEntity: Record<string, any> = {};
  @Input('defaultEntity') set _default(defaultEntity: Record<string, any>) {
    this.#defaultEntity = defaultEntity;
    this.#defaultEntityChanges.next(defaultEntity);
  }

  entity: Record<string, any> = {};
  @Input('entity') set _entity(val: Record<string, any>) {
    this.entity = val;
    this.#entityChanges.next(this.entity);
  }

  properties: string[] = [];
  @Input('properties') set _properties(val: string[]) {
    this.properties = val;
  }

  viewed = false;
  @Input('viewed') set _viewed(val: boolean | '') {
    this.viewed = val === '' || val;
  }
  #subscription = new Subscription();
  #configurationChanges = new Subject<SdFormRenderConfiguration>();
  #defaultEntityChanges = new Subject<Record<string, any>>();
  #entityChanges = new Subject<Record<string, any>>();
  loadCompleted = false;
  hashedValues?: string;
  formValue: Record<string, any> = {};

  // CÃ¡c component item cá»§a form-render sáº½ láº¯ng nghe thay Ä‘á»•i
  setVariables = new Subject<{ key: string; value: any }>();
  constructor(
    private ref: ChangeDetectorRef,
    @Optional() @Inject(SD_FORM_GENERIC_CONFIGURATION) private formGenericConfiguration: ISdFormGenericConfiguration | null
  ) {
    super();
  }

  ngAfterViewInit(): void {
    this.#subscription.add(
      combineLatest([this.#configurationChanges, this.#entityChanges])
        .pipe(startWith([]))
        .subscribe(async () => {
          if (this.entity && this.configuration?.components?.length) {
            this.loadCompleted = true;
            this.ref.markForCheck(); // VÃ¬ loadCompleted ko pháº£i lÃ  @Input nÃªn component sáº½ ko load láº¡i
            if (this.configuration?.onLoaded) {
              try {
                this.configuration.onLoaded();
              } catch (err) {
                console.error(err);
              }
            }
          }
        })
    );
    this.#subscription.add(
      this.#defaultEntityChanges.pipe(startWith(this.#defaultEntity)).subscribe(defaultEntity => {
        for (const key of Object.keys({ ...defaultEntity })) {
          this.entity[key] = this.entity[key] ?? defaultEntity[key];
        }
        this.form.setValue(this.entity);
      })
    );
    this.#subscription.add(
      this.#entityChanges.pipe(startWith(this.entity)).subscribe(entity => {
        if (!this.form.controls['sdRaw']) {
          this.form.addControl('sdRaw', new FormControl({ ...entity }));
        } else {
          this.form.controls['sdRaw'].setValue({ ...entity });
        }
      })
    );
    this.#subscription.add(
      this.form.valueChanges.pipe(debounceTime(500), startWith(this.form.value)).subscribe(values => {
        const hashedValues = SdUtilities.hash(values);
        if (this.hashedValues !== hashedValues) {
          this.hashedValues = hashedValues;
          // á»ž tráº¡ng thÃ¡i view thÃ¬ khÃ´ng cÃ³ FormControl nÃªn pháº£i binding entity má»›i cÃ³ dá»¯ liá»‡u cho formValue
          this.formValue = { ...this.entity, ...values };
          this.ref.markForCheck();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }

  // HÃ m nÃ y sáº½ Ä‘i qua cÃ¡c components vÃ  cÃ¡c columns trong table Ä‘á»ƒ xá»­ lÃ½ upload file
  // TrÆ°á»›c khi thá»±c hiá»‡n lÆ°u thÃ¬ cáº§n gá»i hÃ m nÃ y trÆ°á»›c Ä‘á»ƒ mapping giÃ¡ trá»‹ Ä‘Ãºng
  upload = async () => {
    for (const formRenderItem of this.formRenderItems || []) {
      await formRenderItem.upload();
    }
  };

  // NÃªn gá»i hÃ m nÃ y trÆ°á»›c khi save/submit
  // HÃ m nÃ y tráº£ vá» máº£ng string error
  // Náº¿u khÃ´ng cÃ³ error nÃ o thÃ¬ tráº£ vá» máº£ng rá»—ng
  getValidationMessages = async (alert: SdFormGenericValidation['alert']) => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const messages: string[] = [];
    for (const validation of this.configuration?.validations?.filter(e => e.alert === alert) || []) {
      if (validation.type === 'expression') {
        const result = EvaluateExpression(validation.expression, this.entity);
        if (result) {
          messages.push(validation.message);
        }
      } else if (validation.type === 'function') {
        const func = this.formGenericConfiguration?.form?.validation?.functions?.find(e => e.value === validation.code);
        if (func?.validate) {
          const message = await func.validate({
            entity: this.entity,
          });
          if (message) {
            messages.push(message);
          }
        }
      }
    }
    return messages;
  };
}

