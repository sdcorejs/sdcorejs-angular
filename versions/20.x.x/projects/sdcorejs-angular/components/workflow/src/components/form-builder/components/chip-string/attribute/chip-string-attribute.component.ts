/* eslint-disable @angular-eslint/no-input-rename */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdSection } from '@sdcorejs/angular/components/section';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { SdFormatComponent, SdFormGenericChipString, SdFormGenericComponent, SdFormGenericGroup, SdFormGenericVariable } from '../../../../../models';
import { BuilderService } from '../../../services';
import { AttributeExpression } from '../../attribute-expression/attribute-expression.component';
import { AttributeInput } from '../../attribute-input/attribute-input.component';
import { AttributeSwitch } from '../../attribute-switch/attribute-switch.component';
import { AttributeTemplate } from '../../attribute-template/attribute-template.component';

@Component({
  selector: 'chip-string-attribute',
  templateUrl: './chip-string-attribute.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdSection, AttributeTemplate, AttributeInput, AttributeSwitch, AttributeExpression],
})
export class ChipStringAttribute {
  @Input({ required: true }) components!: (SdFormGenericComponent | SdFormGenericGroup)[];
  @Input({ required: true }) variables!: SdFormGenericVariable[];
  form = new FormGroup({});
  component!: SdFormGenericChipString;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericChipString) {
    this.component = component;
    SdFormatComponent(this.component);
  }
  #changes = new Subject<void>();
  #subscription = new Subscription();

  constructor(
    private ref: ChangeDetectorRef,
    private builderService: BuilderService
  ) {}

  ngAfterViewInit(): void {
    this.#subscription.add(
      this.#changes.pipe(debounceTime(500)).subscribe(() => {
        this.builderService.componentEmitters.next(this.component);
      })
    );
    // Khi content vÃ  variable thay Ä‘á»•i, delay 0.5s rá»“i má»›i emit output
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
    if (template && template.type === 'chip-string') {
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

  onChanges = () => {
    this.#changes.next();
  };
}

