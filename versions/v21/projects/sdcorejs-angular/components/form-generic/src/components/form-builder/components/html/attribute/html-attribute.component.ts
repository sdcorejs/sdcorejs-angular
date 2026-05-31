/* eslint-disable @angular-eslint/no-input-rename */
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { debounceTime, filter, Subscription } from 'rxjs';
import {
  GetComponentAttributes,
  SdFormatComponent,
  SdFormGenericComponent,
  SdFormGenericDefinitionHtml,
  SdFormGenericGroup,
  SdFormGenericHtml,
  SdFormGenericVariable,
} from '../../../../../models';
import { FormGenericService } from '../../../../../services';
import { BuilderService } from '../../../services';
import { AttributeExpression } from '../../attribute-expression/attribute-expression.component';
import { AttributeInput } from '../../attribute-input/attribute-input.component';
import { AttributeSelect } from '../../attribute-select/attribute-select.component';
import { AttributeTextarea } from '../../attribute-textarea/attribute-textarea.component';
import { BuildQueries } from './components/build-queries/build-queries.component';
import { TranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  selector: 'html-attribute',
  templateUrl: './html-attribute.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AttributeInput, AttributeSelect, AttributeExpression, AttributeTextarea, BuildQueries, TranslatePipe],
})
export class HtmlAttribute implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) components!: (SdFormGenericComponent | SdFormGenericGroup)[];
  @Input({ required: true }) variables!: SdFormGenericVariable[];

  component!: SdFormGenericHtml;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericHtml) {
    if (this.component !== component) {
      this.component = component;
      SdFormatComponent(this.component);
    }
  }
  form = new FormGroup({});
  definitionHtmls: SdFormGenericDefinitionHtml[] = [];
  // Mong muá»‘n lÃ  khi attribute changes thÃ´ng bÃ¡o cho control biáº¿t Ä‘á»ƒ control render content tÆ°Æ¡ng á»©ng
  @Output() attributeChanges = new EventEmitter();

  #subscription = new Subscription();
  rightProperties: { value: string; display: string }[] = [];
  constructor(
    private ref: ChangeDetectorRef,
    private formGenericService: FormGenericService,
    private builderService: BuilderService
  ) {}

  ngOnInit(): void {
    this.formGenericService.html.definitions().then(htmls => {
      this.definitionHtmls = htmls;
      this.ref.markForCheck();
    });
    this.rightProperties =
      GetComponentAttributes(this.components).map(e => ({
        value: '${' + e.value + '}',
        display: e.display,
      })) || [];
  }

  ngAfterViewInit(): void {
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

  onChangeDefinition = async (value: string) => {
    const definition = this.definitionHtmls.find(e => e.value === value);
    if (definition) {
      this.component.content = await this.formGenericService.html.getContent(value);
      this.component.properties!.variables = JSON.parse(JSON.stringify(definition.variables || []));
      if (definition.type === 'query') {
        this.component.properties!.queries = JSON.parse(JSON.stringify(definition.queries || []));
      } else {
        this.component.properties!.queries = [];
      }
      delete this.component.properties?.query;
      this.builderService.componentEmitters.next(this.component);
      this.ref.markForCheck();
    } else {
      this.component.properties!.variables = [];
      this.component.properties!.queries = [];
      this.builderService.componentEmitters.next(this.component);
      this.ref.markForCheck();
    }
  };
}

