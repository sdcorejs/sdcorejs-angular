import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, AfterViewInit, OnDestroy, inject, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import {
  SdFormatComponent,
  SdFormGenericChipString,
  SdFormGenericComponent,
  SdFormGenericGroup,
  SdFormGenericVariable,
} from '../../../../../models';
import { BuilderService } from '../../../services';
import { AttributeExpression } from '../../attribute-expression/attribute-expression.component';
import { AttributeInput } from '../../attribute-input/attribute-input.component';
import { AttributeSwitch } from '../../attribute-switch/attribute-switch.component';
import { AttributeTemplate } from '../../attribute-template/attribute-template.component';
import { TranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  selector: 'chip-string-attribute',
  templateUrl: './chip-string-attribute.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AttributeTemplate, AttributeInput, AttributeSwitch, AttributeExpression, TranslatePipe],
})
export class ChipStringAttribute implements AfterViewInit, OnDestroy {
  private ref = inject(ChangeDetectorRef);
  private builderService = inject(BuilderService);

  readonly components = input.required<(SdFormGenericComponent | SdFormGenericGroup)[]>();
  readonly variables = input.required<SdFormGenericVariable[]>();
  form = new FormGroup({});
  component!: SdFormGenericChipString;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericChipString) {
    this.component = component;
    SdFormatComponent(this.component);
  }
  #changes = new Subject<void>();
  #subscription = new Subscription();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngAfterViewInit(): void {
    this.#subscription.add(
      this.#changes.pipe(debounceTime(500)).subscribe(() => {
        this.builderService.componentEmitters.next(this.component);
      })
    );
    // Khi content và variable thay đổi, delay 0.5s rồi mới emit output
    this.#subscription.add(
      this.form.valueChanges.pipe(debounceTime(500)).subscribe(() => {
        this.builderService.componentEmitters.next(this.component);
      })
    );
    this.#subscription.add(
      // Chỉ lắng nghe sự kiện thay đổi tương ứng với component dựa vào id
      this.builderService.componentListeners.pipe(filter(component => component.id === this.component.id)).subscribe(component => {
        if (component) {
          this.ref.markForCheck();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }

  onChangeTemplate = (template: SdFormGenericComponent) => {
    if (template && template.type === 'chip-string') {
      // Dùng Object Assign để không bị tạo ra reference mới
      Object.assign(this.component, {
        ...template,
        id: this.component.id, // Giữ lại id để componentEmitters định danh được component nào bị thay đổi
      });
      SdFormatComponent(this.component);
      this.builderService.componentEmitters.next(this.component);
      this.ref.markForCheck();
    }
  };

  onChanges = () => {
    this.#changes.next();
  };
}
