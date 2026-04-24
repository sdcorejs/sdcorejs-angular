/* eslint-disable @angular-eslint/no-input-rename */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdFormatComponent, SdFormGenericComponent, SdFormGenericDatetime, SdFormGenericGroup, SdFormGenericVariable } from '../../../../../models';
import { AttributeInput } from '../../attribute-input/attribute-input.component';
import { AttributeSwitch } from '../../attribute-switch/attribute-switch.component';
import { AttributeTemplate } from '../../attribute-template/attribute-template.component';
import { AttributeSelect } from '../../attribute-select/attribute-select.component';
import { AttributeExpression } from '../../attribute-expression/attribute-expression.component';
import { FormGroup } from '@angular/forms';
import { debounceTime, filter, Subscription } from 'rxjs';
import { BuilderService } from '../../../services';
import { AttributeTextarea } from "../../attribute-textarea/attribute-textarea.component";

@Component({
  selector: 'datetime-attribute',
  templateUrl: './datetime-attribute.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdSection, AttributeTemplate, AttributeInput, AttributeSwitch, AttributeSelect, AttributeExpression, AttributeTextarea],
})
export class DatetimeAttribute {
  form = new FormGroup({});
  @Input({ required: true }) components!: (SdFormGenericComponent | SdFormGenericGroup)[];
  @Input({ required: true }) variables!: SdFormGenericVariable[];
  component!: SdFormGenericDatetime;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericDatetime) {
    this.component = component;
    SdFormatComponent(this.component);
  }

  #subscription = new Subscription();

  constructor(
    private ref: ChangeDetectorRef,
    private builderService: BuilderService
  ) {}

  ngAfterViewInit(): void {
    // Khi thay Ä‘á»•i, debound 0.5s rá»“i má»›i emit output
    this.#subscription.add(
      this.form.valueChanges.pipe(debounceTime(500)).subscribe(() => {
        this.builderService.componentEmitters.next(this.component);
      })
    );
    this.#subscription.add(
      // Chá»‰ láº¯ng nghe sá»± kiá»‡n thay Ä‘á»•i tÆ°Æ¡ng á»©ng vá»›i component dá»±a vÃ o id
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
    if (template && template.type === 'datetime') {
      // DÃ¹ng Object Assign Ä‘á»ƒ khÃ´ng bá»‹ táº¡o ra reference má»›i
      Object.assign(this.component, {
        ...template,
        id: this.component.id, // Giá»¯ láº¡i id Ä‘á»ƒ componentEmitters Ä‘á»‹nh danh Ä‘Æ°á»£c component nÃ o bá»‹ thay Ä‘á»•i
      });
      SdFormatComponent(this.component);
      this.builderService.componentEmitters.next(this.component);
      this.ref.markForCheck();
    }
  };
}

