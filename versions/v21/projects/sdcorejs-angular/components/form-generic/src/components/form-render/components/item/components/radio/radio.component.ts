import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
  input,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdRadio } from '@sdcorejs/angular/forms';
import { filter, startWith, Subject, Subscription } from 'rxjs';
import { SdFormGenericRadio, SdFormGenericSelectionItem } from '../../../../../../models';
import { ComponentViewedPipe, HyperlinkPipe } from '../../../../../../pipes';
import { FormGenericService } from '../../../../../../services';
import { Router } from '@angular/router';
import { Utilities } from '@sdcorejs/utils/fns';

@Component({
  selector: 'lib-radio',
  templateUrl: './radio.component.html',
  styleUrl: './radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SdRadio,
    // Pipe cho phần viewed
    ComponentViewedPipe,
    HyperlinkPipe,
  ],
})
export class RadioComponent implements AfterViewInit, OnDestroy, OnInit {
  private router = inject(Router);
  private ref = inject(ChangeDetectorRef);
  private readonly formGenericService = inject(FormGenericService);

  readonly setVariables = input.required<
    Subject<{
      key: string;
      value: any;
    }>
  >();
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

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  ngOnInit() {
    this.#subscription.add(
      this.setVariables()
        .pipe(filter(variable => variable.key === this.component?.key))
        .subscribe(variable => {
          this.entity[variable.key] = variable.value;
          this.ref.markForCheck();
        })
    );
  }

  ngAfterViewInit(): void {
    this.#subscription.add(
      this.#changes.pipe(startWith('')).subscribe(async () => {
        // Trạng thái viewed thì không cần check
        if (!this.viewed && this.component && !this.component?.properties?.viewed) {
          const values = { ...this.entity, ...this.form.value };
          const items = await this.formGenericService.selection.items(this.component.valuesKey, {
            entity: values,
            component: this.component,
          });
          // Với radio thì selection buộc phải là values, không phải là lazyValues
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
    if (!url) {
      return;
    }
    if (url.startsWith('http')) {
      window.open(url);
    } else {
      const [path, queryString] = url.split('?');
      const queryParams = Utilities.parseQueryParams(queryString);
      this.router.navigate([path], { queryParams });
    }
  };
}
