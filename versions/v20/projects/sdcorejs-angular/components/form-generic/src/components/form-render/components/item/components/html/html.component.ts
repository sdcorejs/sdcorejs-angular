/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/no-input-rename */
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdUtilities, StringUtilities } from '@sdcorejs/angular/utilities';
// import { sha1 } from 'object-hash';
import { debounceTime, filter, startWith, Subject, Subscription } from 'rxjs';
import { SdFormGenericHtml } from '../../../../../../models';
import { HtmlPipe } from '../../../../../../pipes';
import { FormGenericService } from '../../../../../../services';

@Component({
  selector: 'lib-html',
  templateUrl: './html.component.html',
  styleUrls: ['./html.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HtmlPipe],
})
export class HtmlComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) setVariables!: Subject<{ key: string; value: any }>;

  form = new FormGroup({});
  @Input({ alias: 'form', required: true }) set _form(form: FormGroup) {
    if (this.form !== form) {
      this.form = form;
      this.#inputChanges.next();
    }
  }

  entity: Record<string, any> = {};
  @Input({ alias: 'entity', required: true }) set _entity(val: Record<string, any>) {
    if (this.entity !== val) {
      this.entity = val;
      this.#inputChanges.next();
    }
  }

  // Khi 1 giÃ¡ trá»‹ trong entity thay Ä‘á»•i thÃ¬ hashedValues sáº½ thay Ä‘á»•i
  // Mong muá»‘n khi hashedValues thay Ä‘á»•i thÃ¬ trigger changes Ä‘á»ƒ trigger láº¡i hÃ m láº¥y thÃ´ng tin items
  @Input('hashedValues') set _hashedValues(val: string | undefined) {
    this.#inputChanges.next();
  }
  component!: SdFormGenericHtml;
  key!: string;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericHtml) {
    this.component = component;
    this.key = component.key || component.id;
  }

  viewed = false;
  @Input('viewed') set _viewed(val: boolean | '' | undefined | null) {
    this.viewed = val === '' || !!val;
  }

  #subscription = new Subscription();
  #inputChanges = new Subject<void>();
  constructor(
    private ref: ChangeDetectorRef,
    private readonly formRenderService: FormGenericService
  ) {}

  #hashedQuery?: string;
  hashedValues?: string;
  #generateQuery = (query: string | Record<string, any> | undefined, data: Record<string, any>): Record<string, any> => {
    let result: Record<string, any> = {};
    // Náº¿u query Ä‘Æ°á»£c cáº¥u hÃ¬nh tá»« Form Builder cá»§a Camunda thÃ¬ JSON nÃ³ sáº½ lÃ  string, cáº§n thá»±c hiá»‡n parse
    if (typeof query === 'string') {
      try {
        result = JSON.parse(query);
      } catch (err) {
        console.error(err);
        return result;
      }
    } else if (Array.isArray(query)) {
      return result;
    } else {
      result = { ...query };
    }
    // Xá»­ lÃ½ query,
    // VÃ­ dá»¥: {"a": "1", "b": "true", "c": "${key}"} => {"a": "1", "b": true, "c": "Dá»¯ liá»‡u tÆ°Æ¡ng á»©ng vá»›i key trong data"}
    for (const key of Object.keys({ ...result })) {
      // Xá»­ ly
      result[key] = StringUtilities.templateToDisplay(result[key], data);
      if (result[key] === 'true') {
        result[key] = true;
      }
      if (result[key] === 'false') {
        result[key] = false;
      }
      if (result[key] === '') {
        delete result[key];
      }
    }
    return result;
  };

  async ngOnInit() {
    this.#subscription.add(
      this.setVariables.pipe(filter(variable => variable.key === this.component?.key)).subscribe(variable => {
        this.entity[variable.key] = variable.value;
        this.ref.markForCheck();
      })
    );
    if (!this.component.template) {
      // Náº¿u HTML khÃ´ng pháº£i tá»« template thÃ¬ giÃ¡ trá»‹ = content
      this.entity[this.key] = this.component.content;
    } else if (!this.component.properties?.queries?.length) {
      // Náº¿u HTML tá»« static template (khÃ´ng cÃ³ queries)
      this.entity[this.key] = await this.formRenderService.html.getContent(this.component.template);
      this.ref.markForCheck();
    } else if (this.viewed || this.component?.properties?.viewed) {
      // ÄÃ¢y lÃ  tráº¡ng thÃ¡i view cá»§a HTML tá»« template cÃ³ query
      // Náº¿u á»Ÿ tráº¡ng thÃ¡i viewed thÃ¬ láº¥y entity hiá»ƒn thá»‹, náº¿u khÃ´ng cÃ³ thÃ¬ dÃ¹ng content cá»§a component
      this.entity[this.key] = this.entity[this.key] || this.component.content;
      /* const values = { ...this.entity, ...this.form.value };
      const query = this.#generateQuery(this.component?.properties?.query, values);
      this.entity[this.key] = await this.formRenderService.html.getContent(this.component.template, query);
      this.ref.markForCheck(); */
    } else {
      // Náº¿u cÃ³ queries thÃ¬ láº¯ng nghe thay Ä‘á»•i cá»§a form
      this.#subscription.add(
        this.form.valueChanges.pipe(debounceTime(500), startWith(this.form.value)).subscribe(values => {
          const hashedValues = SdUtilities.hash(values);
          if (this.hashedValues !== hashedValues) {
            this.hashedValues = hashedValues;
            this.#inputChanges.next();
          }
        })
      );
      this.#subscription.add(
        this.#inputChanges.pipe(startWith('')).subscribe(async () => {
          const values = { ...this.entity, ...this.form.value };
          const query = this.#generateQuery(this.component?.properties?.query, values);
          const hashedQuery = SdUtilities.hash(query);
          // Náº¿u query cÃ³ thay Ä‘á»•i thÃ¬ thá»±c hiá»‡n gÃ¡n láº¡i items
          if (hashedQuery !== this.#hashedQuery) {
            this.#hashedQuery = hashedQuery;
            this.entity[this.key] = await this.formRenderService.html.getContent(this.component.template!, query)
            this.ref.markForCheck();
          }
        })
      );
    }
  }

  ngAfterViewInit() {}

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }
}

