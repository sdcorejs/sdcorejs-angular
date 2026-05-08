/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/no-input-rename */
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdAutocomplete, SdSearch, SdSelect } from '@sdcorejs/angular/forms';
import { SdCustomValidator } from '@sdcorejs/angular/forms/models';
import { SdUtilities, StringUtilities } from '@sdcorejs/angular/utilities';
// import { sha1 } from 'object-hash';
import { debounceTime, filter, startWith, Subject, Subscription } from 'rxjs';
import { SdFormGenericSelect, SdFormGenericSelectionItem } from '../../../../../../models';
import { ComponentViewedPipe, HyperlinkPipe } from '../../../../../../pipes';
import { FormGenericService } from '../../../../../../services';
import { Router } from '@angular/router';

@Component({
  selector: 'lib-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SdSelect,
    SdAutocomplete,
    // Pipe cho pháº§n viewed
    ComponentViewedPipe,
    HyperlinkPipe,
  ],
})
export class SelectComponent implements AfterViewInit, OnDestroy {
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

  component!: SdFormGenericSelect;
  @Input({
    alias: 'component',
    required: true,
  })
  set _component(val: SdFormGenericSelect) {
    this.component = val;
  }

  disabled = false;
  @Input('disabled') set _disabled(val: boolean | '' | undefined | null) {
    this.disabled = val === '' || !!val;
  }

  required = false;
  @Input('required') set _required(val: boolean | '' | undefined | null) {
    this.required = val === '' || !!val;
  }

  viewed = false;
  @Input('viewed') set _viewed(val: boolean | '' | undefined | null) {
    this.viewed = val === '' || !!val;
  }

  validator?: SdCustomValidator;
  @Input('validator') set _validator(validator: SdCustomValidator | undefined) {
    if (validator && this.validator !== validator) {
      this.validator = validator;
    }
  }

  items: SdFormGenericSelectionItem[] | SdSearch = [];

  #subscription = new Subscription();
  #inputChanges = new Subject<void>();
  constructor(
    private router: Router,
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

  ngOnInit() {
    this.#subscription.add(
      this.setVariables.pipe(filter(variable => variable.key === this.component?.key)).subscribe(variable => {
        this.entity[variable.key] = variable.value;
        this.ref.markForCheck();
      })
    );
  }

  ngAfterViewInit() {
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
        // Tráº¡ng thÃ¡i viewed thÃ¬ khÃ´ng cáº§n check
        if (!this.viewed && this.component && !this.component?.properties?.viewed) {
          const values = { ...this.entity, ...this.form.value };
          const query = this.#generateQuery(this.component?.properties?.query, values);
          const hashedQuery = SdUtilities.hash(query);
          // Náº¿u query cÃ³ thay Ä‘á»•i thÃ¬ thá»±c hiá»‡n gÃ¡n láº¡i items
          if (hashedQuery !== this.#hashedQuery) {
            this.#hashedQuery = hashedQuery;
            this.items = await this.formRenderService.selection.items(this.component?.valuesKey, {
              entity: values,
              component: this.component,
              query,
            });
            this.ref.markForCheck();
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }

  onChanges = async () => {
    const setVariables = this.component.properties?.setVariables;
    // Náº¿u cÃ³ cáº¥u hÃ¬nh gÃ¡n giÃ¡ trá»‹ khi trÆ°á»ng dá»¯ liá»‡u thay Ä‘á»•i thÃ¬ thá»±c hiá»‡n gÃ¡n giÃ¡ trá»‹
    if (this.component.valuesKey && setVariables) {
      // Láº¥y thÃ´ng tin detail
      const values = { ...this.entity, ...this.form.value };
      const query = this.#generateQuery(this.component?.properties?.query, values);
      const detail = await this.formRenderService.selection.variables.detail(this.component.valuesKey, this.entity[this.component.key], {
        entity: this.entity,
        component: this.component,
        query,
      });
      // Náº¿u cÃ³ detail thÃ¬ thá»±c hiá»‡n setVariables
      if (detail) {
        // Äi qua tá»«ng key cá»§a component sáº½ gÃ¡n giÃ¡ trá»‹
        for (const key of Object.keys(setVariables)) {
          try {
            const value = StringUtilities.parseExpression(setVariables[key], detail);
            // Thá»±c hiá»‡n gÃ¡n giÃ¡ trá»‹
            this.entity[key] = value;
            // ThÃ´ng bÃ¡o setVariables Ä‘á»ƒ component (náº¿u Ä‘ang hiá»ƒn thá»‹) biáº¿t vÃ  thá»±c hiá»‡n re-render hay markForCheck()
            this.setVariables.next({ key, value });
          } catch (err) {
            console.error(err);
          }
        }
      }
    }
  };

  onNavigate = (url: string) => {
    if (url?.startsWith('http')) {
      window.open(url);
    } else {
      const [path, queryString] = url?.split('?');
      const queryParams = SdUtilities.parseQueryParams(queryString);
      this.router.navigate([path], { queryParams });
    }
  };
}

