import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdQuery, SdQueryBar, SdQueryField } from '@sdcorejs/angular/components/query-bar';
import { SdTable, SdTableColumn, SdTableFilterRequest, SdTableOption } from '@sdcorejs/angular/components/table';
import { I18nService, TranslatePipe } from '@sdcorejs/angular/i18n';
import {
  SdFormControl,
  SdViewed,
  SdViewedInput,
  sdViewedTransform,
  ɵSdFormControlParent,
  ɵsdCoerceFormGroup,
  ɵsdFormControlConnector,
} from '@sdcorejs/angular/forms/models';
import { Utilities } from '@sdcorejs/utils/fns';
import { NestedKeyOf, PagingReq } from '@sdcorejs/utils/models';

export type SdEntityPickerModel<TKey> = TKey | TKey[] | null | undefined;

export interface SdEntityPickerPage<T> {
  readonly items: T[];
  readonly total: number;
}

export interface SdEntityPickerRequest<T> {
  readonly query: SdQuery<T>;
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly orderBy?: string;
  readonly orderDirection?: 'ASC' | 'DESC';
  readonly signal: AbortSignal;
}

export interface SdEntityPickerDataProvider<T, TKey> {
  load(request: SdEntityPickerRequest<T>): SdEntityPickerPage<T> | Promise<SdEntityPickerPage<T>>;
  hydrate?(keys: readonly TKey[], signal: AbortSignal): T[] | Promise<T[]>;
}

export interface SdEntityPickerSelectedTemplateContext<T, TKey> {
  readonly $implicit: readonly T[];
  readonly entities: readonly T[];
  readonly keys: readonly TKey[];
}

export interface SdEntityPickerRowTemplateContext<T> {
  readonly $implicit: T;
  readonly item: T;
}

@Directive({ selector: 'ng-template[sdEntityPickerSelected]', standalone: true })
export class SdEntityPickerSelectedTemplateDirective<T, TKey> {
  readonly template = inject<TemplateRef<SdEntityPickerSelectedTemplateContext<T, TKey>>>(TemplateRef);

  static ngTemplateContextGuard<T, TKey>(
    _directive: SdEntityPickerSelectedTemplateDirective<T, TKey>,
    _context: unknown
  ): _context is SdEntityPickerSelectedTemplateContext<T, TKey> {
    return true;
  }
}

@Directive({ selector: 'ng-template[sdEntityPickerRow]', standalone: true })
export class SdEntityPickerRowTemplateDirective<T> {
  readonly template = inject<TemplateRef<SdEntityPickerRowTemplateContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _directive: SdEntityPickerRowTemplateDirective<T>,
    _context: unknown
  ): _context is SdEntityPickerRowTemplateContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[sdEntityPickerDetail]', standalone: true })
export class SdEntityPickerDetailTemplateDirective<T, TKey> {
  readonly template = inject<TemplateRef<SdEntityPickerSelectedTemplateContext<T, TKey>>>(TemplateRef);

  static ngTemplateContextGuard<T, TKey>(
    _directive: SdEntityPickerDetailTemplateDirective<T, TKey>,
    _context: unknown
  ): _context is SdEntityPickerSelectedTemplateContext<T, TKey> {
    return true;
  }
}

@Component({
  selector: 'sd-entity-picker',
  standalone: true,
  imports: [NgTemplateOutlet, TranslatePipe, SdModal, SdQueryBar, SdTable, SdDataState],
  templateUrl: './entity-picker.component.html',
  styleUrl: './entity-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.sd-viewed]': 'connectorState().isViewed',
    '[class.sd-inline]': 'connectorState().isInline',
    '[attr.data-disabled]': 'formControl.disabled',
  },
})
export class SdEntityPicker<T = unknown, TKey = string | number> {
  readonly #i18n = inject(I18nService);
  readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  readonly modal = viewChild(SdModal);
  readonly table = viewChild(SdTable<T>);
  readonly selectedTemplate = contentChild(SdEntityPickerSelectedTemplateDirective<T, TKey>);
  readonly rowTemplate = contentChild(SdEntityPickerRowTemplateDirective<T>);
  readonly detailTemplate = contentChild(SdEntityPickerDetailTemplateDirective<T, TKey>);

  readonly autoIdInput = input<string | null | undefined>(undefined, { alias: 'autoId' });
  readonly autoId = computed(() => (this.autoIdInput() ? `forms-entity-picker-${this.autoIdInput()}` : undefined));
  readonly name = input<string>(Utilities.generateUuid());
  readonly form = input<FormGroup | undefined, ɵSdFormControlParent>(undefined, { transform: ɵsdCoerceFormGroup });
  readonly label = input<string | undefined>();
  readonly placeholder = input<string | null | undefined>();
  readonly modalTitle = input<string | null | undefined>();
  readonly ariaLabel = input<string | undefined>();
  readonly provider = input<SdEntityPickerDataProvider<T, TKey> | null | undefined>();
  readonly columns = input<readonly SdTableColumn<T>[]>([]);
  readonly queryFields = input<readonly SdQueryField<T>[]>([]);
  readonly pageSize = input(20);
  readonly valueField = input<NestedKeyOf<T> | undefined>();
  readonly keySelector = input<((item: T) => TKey) | undefined>();
  readonly displayField = input<NestedKeyOf<T> | undefined>();
  readonly displayWith = input<((item: T) => string) | undefined>();
  readonly compareWith = input<(left: TKey, right: TKey) => boolean>(Object.is);
  readonly disabledEntity = input<((item: T) => boolean) | undefined>();
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly clearable = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });
  readonly addable = input(false, { transform: booleanAttribute });
  readonly model = model<SdEntityPickerModel<TKey>>(undefined);

  readonly sdChange = output<SdEntityPickerModel<TKey>>();
  readonly sdAdd = output<void>();
  readonly sdLoadError = output<unknown>();

  readonly formControl = new SdFormControl();
  readonly #connector = ɵsdFormControlConnector<SdEntityPickerModel<TKey>, SdEntityPickerModel<TKey>>({
    form: this.form,
    name: this.name,
    control: computed<AbstractControl<SdEntityPickerModel<TKey>>>(() => this.formControl),
    model: this.model,
    writeModel: value => {
      this.model.set(value);
      this.sdChange.emit(value);
    },
    modelToControl: value => value,
    controlToModel: value => value,
    required: this.required,
    disabled: this.disabled,
    readonly: this.readonly,
    viewed: this.viewed,
  });

  readonly connectorState = this.#connector.state;
  readonly draftKeys = signal<TKey[]>([]);
  readonly loadError = signal<unknown | null>(null);
  readonly loading = signal(false);
  readonly hydrating = signal(false);
  readonly query = signal<SdQuery<T>>({ filters: [], logic: 'AND', search: '' });
  readonly #entityCache = signal<T[]>([]);
  #loadController?: AbortController;
  #loadVersion = 0;
  #hydrationError: unknown | null = null;

  readonly modelKeys = computed(() => normalizePickerKeys(this.model(), this.multiple()));
  readonly effectivePlaceholder = computed(() => this.placeholder() ?? this.#i18n.t('core.form.entity-picker.placeholder'));
  readonly effectiveModalTitle = computed(() => this.modalTitle() ?? this.#i18n.t('core.form.entity-picker.modal-title'));
  readonly selectedEntities = computed(() => this.#entitiesForKeys(this.modelKeys()));
  readonly draftEntities = computed(() => this.#entitiesForKeys(this.draftKeys()));
  readonly displayText = computed(() => this.#displayForKeys(this.modelKeys()));
  readonly selectedTemplateContext = computed<SdEntityPickerSelectedTemplateContext<T, TKey>>(() => ({
    $implicit: this.selectedEntities(),
    entities: this.selectedEntities(),
    keys: this.modelKeys(),
  }));
  readonly detailTemplateContext = computed<SdEntityPickerSelectedTemplateContext<T, TKey>>(() => ({
    $implicit: this.draftEntities(),
    entities: this.draftEntities(),
    keys: this.draftKeys(),
  }));

  readonly tableOption = computed<SdTableOption<T>>(() => {
    const customTemplate = this.rowTemplate()?.template;
    const configuredColumns = [...this.columns()];
    const fallbackField = (this.displayField() ?? '__sdEntityPickerDisplay') as NestedKeyOf<T>;
    const fallbackColumn: SdTableColumn<T> = {
      field: fallbackField,
      title: this.label() ?? this.#i18n.t('core.form.entity-picker.value'),
      type: 'string',
      transform: (_value, item) => this.displayEntity(item),
      cell: customTemplate ? { templateRef: customTemplate } : undefined,
    };
    const columns = configuredColumns.length > 0 ? configuredColumns : [fallbackColumn];
    if (customTemplate && configuredColumns.length > 0) {
      columns[0] = { ...columns[0], cell: { ...columns[0].cell, templateRef: customTemplate } } as SdTableColumn<T>;
    }

    return {
      // SdTable hashes anonymous options for session configuration. A projected
      // TemplateRef is cyclic, so give the composed table an explicit stable key.
      key: `${this.autoId() ?? this.name()}-table`,
      type: 'server',
      columns,
      items: (filterRequest, pagingRequest) => this.loadPage(filterRequest, pagingRequest),
      paginate: { pageSize: this.pageSize() },
      selector: {
        visible: true,
        single: !this.multiple(),
        defaultSelected: item => this.#hasKey(this.draftKeys(), this.keyOf(item)),
        disabled: item => (item ? !!this.disabledEntity()?.(item) : false),
        onSelect: (item, selectedItems) => {
          if (item) this.onTableSelect(item, selectedItems ?? []);
        },
        onSelectAll: selectedItems => this.onTableSelectAll(selectedItems),
      },
      filter: { hideInlineFilter: true, hideExternalFilterToolbar: true },
    };
  });

  constructor() {
    effect(onCleanup => {
      const provider = this.provider();
      const keys = this.modelKeys();
      if (!provider?.hydrate || keys.length === 0) return;

      const controller = new AbortController();
      this.hydrating.set(true);
      Promise.resolve(provider.hydrate(keys, controller.signal))
        .then(items => {
          if (controller.signal.aborted) return;
          this.#mergeEntities(items);
          if (this.loadError() === this.#hydrationError) this.loadError.set(null);
          this.#hydrationError = null;
        })
        .catch(error => {
          if (!controller.signal.aborted && !isAbortError(error)) {
            this.#hydrationError = error;
            this.loadError.set(error);
            this.sdLoadError.emit(error);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) this.hydrating.set(false);
        });
      onCleanup(() => controller.abort());
    });
  }

  open(): void {
    if (this.formControl.disabled || this.readonly() || this.connectorState().isViewed) return;
    this.draftKeys.set([...this.modelKeys()]);
    this.modal()?.open();
  }

  applySelection(): void {
    const keys = [...this.draftKeys()];
    const value: SdEntityPickerModel<TKey> = this.multiple() ? keys : (keys[0] ?? null);
    this.formControl.setValue(value);
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
    this.modal()?.close();
  }

  cancel(): void {
    this.modal()?.close();
  }

  clear(event?: Event): void {
    event?.stopPropagation();
    if (this.formControl.disabled || this.readonly()) return;
    this.formControl.setValue(this.multiple() ? [] : null);
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
  }

  onModalClosed(): void {
    queueMicrotask(() => this.trigger()?.nativeElement.focus());
  }

  onTableSelect(item: T, selectedItems: T[]): void {
    this.#mergeEntities(selectedItems);
    const key = this.keyOf(item);
    const selected = selectedItems.some(candidate => this.compareWith()(this.keyOf(candidate), key));
    if (!this.multiple()) {
      this.draftKeys.set(selected ? [key] : []);
      return;
    }
    this.draftKeys.update(keys =>
      selected ? appendUnique(keys, key, this.compareWith()) : keys.filter(value => !this.compareWith()(value, key))
    );
  }

  onTableSelectAll(selectedItems: T[], pageItems: T[] = this.table()?.dataItems ?? selectedItems): void {
    this.#mergeEntities([...pageItems, ...selectedItems]);
    const pageKeys = pageItems.map(item => this.keyOf(item));
    const preservedKeys = this.draftKeys().filter(key => !this.#hasKey(pageKeys, key));
    const selectedKeys = selectedItems.map(item => this.keyOf(item));

    if (!this.multiple()) {
      this.draftKeys.set(selectedKeys.slice(0, 1));
      return;
    }

    this.draftKeys.set(selectedKeys.reduce((keys, key) => appendUnique(keys, key, this.compareWith()), preservedKeys));
  }

  onQueryChange(query: SdQuery<T>): void {
    this.query.set(query);
    this.table()?.setFilter({
      externalFilter: { search: query.search ?? '', filters: query.filters, logic: query.logic ?? 'AND' },
    });
  }

  async loadPage(filterRequest: SdTableFilterRequest<T>, pagingRequest: PagingReq<T>): Promise<SdEntityPickerPage<T>> {
    const provider = this.provider();
    if (!provider) return { items: [], total: 0 };

    this.#loadController?.abort();
    const controller = new AbortController();
    this.#loadController = controller;
    const version = ++this.#loadVersion;
    const rawExternal = filterRequest.rawExternalFilter as Record<string, unknown>;
    const currentQuery = this.query();
    const request: SdEntityPickerRequest<T> = {
      query: {
        ...currentQuery,
        search: typeof rawExternal['search'] === 'string' ? rawExternal['search'] : currentQuery.search,
      },
      pageIndex: pagingRequest.pageNumber ?? filterRequest.pageNumber ?? 0,
      pageSize: pagingRequest.pageSize ?? filterRequest.pageSize ?? this.pageSize(),
      orderBy: filterRequest.orderBy || undefined,
      orderDirection: filterRequest.orderDirection,
      signal: controller.signal,
    };
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const page = await Promise.resolve(provider.load(request));
      if (controller.signal.aborted || version !== this.#loadVersion) return { items: [], total: 0 };
      this.#mergeEntities(page.items);
      return { items: [...page.items], total: Math.max(0, page.total) };
    } catch (error) {
      if (controller.signal.aborted || version !== this.#loadVersion || isAbortError(error)) return { items: [], total: 0 };
      this.loadError.set(error);
      this.sdLoadError.emit(error);
      return { items: [], total: 0 };
    } finally {
      if (version === this.#loadVersion) this.loading.set(false);
    }
  }

  retry(): void {
    this.loadError.set(null);
    void this.table()?.reload();
  }

  add(): void {
    this.sdAdd.emit();
  }

  keyOf(item: T): TKey {
    const selector = this.keySelector();
    if (selector) return selector(item);
    const field = this.valueField();
    return readPath(item, field as string | undefined) as TKey;
  }

  displayEntity(item: T): string {
    const selector = this.displayWith();
    if (selector) return selector(item);
    const field = this.displayField();
    const value = readPath(item, field as string | undefined);
    return value == null ? '' : String(value);
  }

  #entitiesForKeys(keys: readonly TKey[]): T[] {
    return keys
      .map(key => this.#entityCache().find(item => this.compareWith()(this.keyOf(item), key)))
      .filter((item): item is T => item !== undefined);
  }

  #displayForKeys(keys: readonly TKey[]): string {
    return keys
      .map(key => {
        const item = this.#entityCache().find(candidate => this.compareWith()(this.keyOf(candidate), key));
        return item ? this.displayEntity(item) : String(key);
      })
      .join(', ');
  }

  #mergeEntities(items: readonly T[]): void {
    this.#entityCache.update(current => {
      const next = [...current];
      for (const item of items) {
        const key = this.keyOf(item);
        const index = next.findIndex(candidate => this.compareWith()(this.keyOf(candidate), key));
        if (index >= 0) next[index] = item;
        else next.push(item);
      }
      return next;
    });
  }

  #hasKey(keys: readonly TKey[], key: TKey): boolean {
    return keys.some(value => this.compareWith()(value, key));
  }
}

export function normalizePickerKeys<TKey>(value: SdEntityPickerModel<TKey>, multiple: boolean): TKey[] {
  if (value == null) return [];
  if (Array.isArray(value)) return multiple ? [...value] : value.slice(0, 1);
  return [value as TKey];
}

function appendUnique<TKey>(keys: readonly TKey[], key: TKey, compare: (left: TKey, right: TKey) => boolean): TKey[] {
  return keys.some(value => compare(value, key)) ? [...keys] : [...keys, key];
}

function readPath(value: unknown, path: string | undefined): unknown {
  if (!path) return value;
  return path.split('.').reduce<unknown>((current, segment) => {
    if (typeof current !== 'object' || current === null) return undefined;
    return (current as Record<string, unknown>)[segment];
  }, value);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
