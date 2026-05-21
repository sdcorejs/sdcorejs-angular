/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/no-input-rename */
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdRadio } from '@sdcorejs/angular/forms';
import { filter, startWith, Subject, Subscription } from 'rxjs';
import { SdFormGenericRadio, SdFormGenericSelectionItem } from '../../../../../../models';
import { ComponentViewedPipe, HyperlinkPipe } from '../../../../../../pipes';
import { FormGenericService } from '../../../../../../services';
import { Router } from '@angular/router';
import { SdUtilities } from '@sdcorejs/angular/utilities';

@Component({
  selector: 'lib-radio',
  templateUrl: './radio.component.html',
  styleUrls: ['./radio.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SdRadio,
    // Pipe cho pháº§n viewed
    ComponentViewedPipe,
    HyperlinkPipe
  ],
})
export class RadioComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) setVariables!: Subject<{ key: string; value: any }>;
  form = new FormGroup({});
  @Input({ alias: 'form', required: true }) set _form(form: FormGroup) {
    if (this.form !== form) {
      this.form = form;
      this.#changes.next();
    }
  }
  value: any;
  entity: Record<string, any> = {};
  @Input({ alias: 'entity', required: true }) set _entity(val: Record<string, any>) {
    if (this.entity !== val) {
      this.entity = val;
      this.#changes.next();
    }
  }

  component!: SdFormGenericRadio;
  @Input({
    alias: 'component',
    required: true,
  })
  set _component(val: SdFormGenericRadio) {
    if (this.component !== val) {
      this.component = val;
      this.#changes.next();
    }
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
    const viewed = val === '' || !!val;
    if (this.viewed !== viewed) {
      this.viewed = viewed;
      this.#changes.next();
    }
  }

  items: SdFormGenericSelectionItem[] = [];

  #subscription = new Subscription();
  #changes = new Subject<void>();
  constructor(
    private router: Router,
    private ref: ChangeDetectorRef,
    private readonly formGenericService: FormGenericService
  ) {}

  ngOnInit() {
    this.#subscription.add(
      this.setVariables.pipe(filter(variable => variable.key === this.component?.key)).subscribe(variable => {
        this.entity[variable.key] = variable.value;
        this.ref.markForCheck();
      })
    );
  }

  ngAfterViewInit(): void {
    this.#subscription.add(
      this.#changes.pipe(startWith('')).subscribe(async () => {
        // Tráº¡ng thÃ¡i viewed thÃ¬ khÃ´ng cáº§n check
        if (!this.viewed && this.component && !this.component?.properties?.viewed) {
          const values = { ...this.entity, ...this.form.value };
          const items = await this.formGenericService.selection.items(this.component.valuesKey, {
            entity: values,
            component: this.component,
          });
          // Vá»›i radio thÃ¬ selection buá»™c pháº£i lÃ  values, khÃ´ng pháº£i lÃ  lazyValues
          if (Array.isArray(items)) {
            this.items = items;
          } else {
            this.items = [];
          }
          this.ref.markForCheck();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }

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

