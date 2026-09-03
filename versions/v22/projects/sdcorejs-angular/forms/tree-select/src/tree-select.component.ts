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
  untracked,
  viewChild,
} from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdView } from '@sdcorejs/angular/components/view';
import {
  SdTree,
  SdTreeComponentOption,
  SdTreeDataSource,
  SdTreeItem,
  SdTreeItemContext,
  SdTreeLoadErrorEvent,
  SdTreeNode,
  SdTreeOption,
  SdTreeSelectionEvent,
} from '@sdcorejs/angular/components/tree';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import {
  SD_FORM_CONFIGURATION,
  SdFormControl,
  SdInlineErrorValidator,
  SdViewed,
  SdViewedInput,
  sdFormControlState,
  sdViewedTransform,
  ɵSdFormControlParent,
  ɵsdCoerceFormGroup,
  ɵsdFormControlConnector,
} from '@sdcorejs/angular/forms/models';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { Utilities } from '@sdcorejs/utils/fns';
import { NestedKeyOf, Size } from '@sdcorejs/utils/models';

export type SdTreeSelectModel<TKey> = TKey | TKey[] | null | undefined;

export type SdTreeSelectTemplateContext<T> = SdTreeItemContext<T>;

@Directive({ selector: 'ng-template[sdTreeSelectNode]', standalone: true })
export class SdTreeSelectNodeTemplateDirective<T> {
  readonly template = inject<TemplateRef<SdTreeSelectTemplateContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _directive: SdTreeSelectNodeTemplateDirective<T>,
    _context: unknown
  ): _context is SdTreeSelectTemplateContext<T> {
    return true;
  }
}

@Component({
  selector: 'sd-tree-select',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    ReactiveFormsModule,
    SdButton,
    SdIcon,
    SdInput,
    SdLabel,
    SdModal,
    SdTranslatePipe,
    SdTree,
    SdView,
  ],
  templateUrl: './tree-select.component.html',
  styleUrl: './tree-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.sd-viewed]': 'connectorState().isViewed',
    '[attr.data-disabled]': 'formControl.disabled',
  },
})
export class SdTreeSelect<T = unknown, TKey = string | number> {
  readonly #i18n = inject(I18nService);
  readonly #formConfiguration = inject(SD_FORM_CONFIGURATION, { optional: true });
  readonly trigger = viewChild<ElementRef<HTMLInputElement>>('trigger');
  readonly modal = viewChild(SdModal);
  readonly treeComponent = viewChild(SdTree<T>);
  readonly nodeTemplate = contentChild(SdTreeSelectNodeTemplateDirective<T>);

  readonly errorId = `sd-tree-select-error-${Utilities.generateUuid()}`;

  readonly autoIdInput = input<string | null | undefined>(undefined, { alias: 'autoId' });
  readonly autoId = computed(() => (this.autoIdInput() ? `forms-tree-select-${this.autoIdInput()}` : undefined));
  readonly name = input<string>(Utilities.generateUuid());
  readonly form = input<FormGroup | undefined, ɵSdFormControlParent>(undefined, { transform: ɵsdCoerceFormGroup });
  readonly label = input<string | undefined>();
  readonly helperText = input<string | undefined>();
  readonly placeholder = input<string | null | undefined>();
  readonly modalTitle = input<string | null | undefined>();
  readonly ariaLabel = input<string | undefined>();
  readonly size = input<Size>('md');
  readonly appearanceInput = input<MatFormFieldAppearance | undefined>(undefined, { alias: 'appearance' });
  readonly appearance = computed(() => this.appearanceInput() ?? this.#formConfiguration?.appearance ?? 'outline');
  readonly hideInlineError = input(false, { transform: booleanAttribute });
  readonly items = input<SdTreeDataSource<SdTreeItem<T>>>([]);
  readonly tree = input<SdTreeOption<T>>({ loadType: 'static' });
  readonly valueField = input<NestedKeyOf<T> | undefined>();
  readonly keySelector = input<((item: T) => TKey) | undefined>();
  readonly displayField = input<NestedKeyOf<T> | undefined>();
  readonly displayWith = input<((item: T) => string) | undefined>();
  readonly compareWith = input<(left: TKey, right: TKey) => boolean>(Object.is);
  readonly disabledNode = input<((item: T, selectedItems: T[]) => boolean) | undefined>();
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly cascade = input<'independent' | 'descendants'>('independent');
  readonly required = input(false, { transform: booleanAttribute });
  /** Component-local error text. Set it to force the control invalid and render the message. */
  readonly inlineError = input<string | undefined>();
  readonly clearable = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });
  readonly model = model<SdTreeSelectModel<TKey>>(undefined);
  readonly sdChange = output<SdTreeSelectModel<TKey>>();
  readonly loadError = output<SdTreeLoadErrorEvent<T>>();

  readonly formControl = new SdFormControl();
  readonly #state = sdFormControlState(computed(() => this.formControl));
  // why: `[required]` đã gắn Validators.required từ trước nhưng template không render message nào —
  // tree-select bắt buộc mà bỏ trống chặn submit hoàn toàn im lặng. Map errors → text rồi đưa vào
  // connector qua `validationError`; connector tự gate theo touched/dirty.
  readonly errorMessage = computed<string | undefined>(() => {
    void this.#state();
    const errors = this.formControl.errors;
    if (!errors) return undefined;

    // Chưa có key riêng cho tree-select trong catalog i18n → dùng chung message của select.
    if (errors['required']) return this.#i18n.t('core.form.select.required');
    if (errors['inlineError']) return this.inlineError();
    return undefined;
  });
  readonly #connector = ɵsdFormControlConnector<SdTreeSelectModel<TKey>, SdTreeSelectModel<TKey>>({
    form: this.form,
    name: this.name,
    control: computed<AbstractControl<SdTreeSelectModel<TKey>>>(() => this.formControl),
    model: this.model,
    writeModel: value => {
      this.model.set(value);
      this.sdChange.emit(value);
    },
    modelToControl: value => value,
    controlToModel: value => value,
    validators: computed(() => (this.inlineError() ? [SdInlineErrorValidator] : null)),
    required: this.required,
    disabled: this.disabled,
    readonly: this.readonly,
    viewed: this.viewed,
    validationError: this.errorMessage,
  });

  readonly connectorState = this.#connector.state;
  /** Interaction-gated validation message; `undefined` until the control is touched/dirty. */
  readonly visibleErrorMessage = computed(() => this.connectorState().validationError);
  /**
   * Text-only control backing the readonly trigger; `formControl` above holds the real keys.
   *
   * why: phải là một `FormControl` THẬT chứ không phải `[value]`. `MatInput.ngDoCheck` chỉ gọi
   * `updateErrorState()` khi có `NgControl` — không có nó thì `errorState` đứng yên ở `false`, mà
   * `<mat-error>`, viền đỏ và `aria-invalid` đều bám vào cờ đó, nên field bắt buộc bỏ trống lại im
   * lặng y như bug cũ. Trạng thái disabled cũng chảy qua control này (MatInput tự đồng bộ
   * `disabled` từ `ngControl` mỗi vòng CD, nên bind `[disabled]` trên template sẽ bị ghi đè).
   */
  readonly displayControl = new FormControl<string>('', { nonNullable: true });

  /**
   * why: MatInput đã có `NgControl`, nhưng control đó là ô TEXT — nó không biết gì về `required`
   * hay validator của tree-select. Matcher nối thẳng `errorState` của Material vào message đã gate
   * theo tương tác của connector.
   */
  readonly errorStateMatcher: ErrorStateMatcher = { isErrorState: () => !!this.visibleErrorMessage() };
  readonly draftKeys = signal<TKey[]>([]);
  readonly modelKeys = computed(() => normalizeTreeSelectKeys(this.model(), this.multiple()));
  readonly effectivePlaceholder = computed(() => this.placeholder() ?? this.#i18n.t('core.form.tree-select.placeholder'));
  readonly effectiveModalTitle = computed(() => this.modalTitle() ?? this.#i18n.t('core.form.tree-select.modal-title'));
  readonly loadedEntities = computed(() => {
    const tree = this.treeComponent();
    if (tree) return flattenNodes(tree.rootNodes()).map(node => node.data);
    const source = this.items();
    return Array.isArray(source) ? flattenItems(source).map(item => item.data) : [];
  });
  readonly selectedEntities = computed(() => this.#entitiesForKeys(this.modelKeys()));
  readonly draftEntities = computed(() => this.#entitiesForKeys(this.draftKeys()));
  readonly displayText = computed(() =>
    this.modelKeys()
      .map(key => {
        const item = this.loadedEntities().find(candidate => this.compareWith()(this.keyOf(candidate), key));
        return item ? this.displayEntity(item) : String(key);
      })
      .join(', ')
  );

  readonly treeOption = computed<SdTreeComponentOption<T>>(
    () =>
      ({
        autoId: this.autoId(),
        items: this.items(),
        tree: this.tree(),
        selectedItems: this.draftEntities(),
        itemTemplate: this.nodeTemplate()?.template,
        selector: {
          visible: true,
          single: !this.multiple(),
          cascade: this.cascade(),
          disabled: (item, selectedItems) => !!this.disabledNode()?.(item, selectedItems),
        },
      }) as SdTreeComponentOption<T>
  );

  constructor() {
    effect(() => {
      const text = this.displayText();
      void this.#state();
      const disabled = this.formControl.disabled;
      untracked(() => {
        if (this.displayControl.value !== text) this.displayControl.setValue(text, { emitEvent: false });
        if (disabled !== this.displayControl.disabled) {
          if (disabled) this.displayControl.disable({ emitEvent: false });
          else this.displayControl.enable({ emitEvent: false });
        }
      });
    });
  }

  open(event?: Event): void {
    if (this.formControl.disabled || this.readonly() || this.connectorState().isViewed) return;
    // why: Space trên <input readonly> không gõ được ký tự nào nhưng vẫn cuộn trang — chặn để
    // phím Space chỉ còn nghĩa "mở popup", đúng như trên trigger <button> trước đây.
    event?.preventDefault();
    this.draftKeys.set([...this.modelKeys()]);
    this.modal()?.open();
  }

  applySelection(): void {
    const keys = [...this.draftKeys()];
    const value: SdTreeSelectModel<TKey> = this.multiple() ? keys : (keys[0] ?? null);
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

  onTreeSelection(event: SdTreeSelectionEvent<T>): void {
    const loadedKeys = this.loadedEntities().map(item => this.keyOf(item));
    const hiddenKeys = this.draftKeys().filter(key => !loadedKeys.some(value => this.compareWith()(value, key)));
    if (!this.multiple()) {
      this.draftKeys.set(event.selected ? [this.keyOf(event.item)] : []);
      return;
    }

    const selectedLoadedKeys = event.selectedItems.map(item => this.keyOf(item));
    this.draftKeys.set(dedupeKeys([...hiddenKeys, ...selectedLoadedKeys], this.compareWith()));
  }

  filter(value: string): void {
    this.treeComponent()?.filter(value);
  }

  retry(): void {
    this.treeComponent()?.retry();
  }

  keyOf(item: T): TKey {
    const selector = this.keySelector();
    if (selector) return selector(item);
    return readPath(item, this.valueField() as string | undefined) as TKey;
  }

  displayEntity(item: T): string {
    const selector = this.displayWith();
    if (selector) return selector(item);
    const value = readPath(item, this.displayField() as string | undefined);
    return value == null ? '' : String(value);
  }

  #entitiesForKeys(keys: readonly TKey[]): T[] {
    return keys
      .map(key => this.loadedEntities().find(item => this.compareWith()(this.keyOf(item), key)))
      .filter((item): item is T => item !== undefined);
  }
}

function flattenNodes<T>(nodes: readonly SdTreeNode<T>[]): SdTreeNode<T>[] {
  return nodes.flatMap(node => [node, ...flattenNodes(node.children)]);
}

function flattenItems<T>(items: readonly SdTreeItem<T>[]): SdTreeItem<T>[] {
  return items.flatMap(item => [item, ...flattenItems(item.children ?? [])]);
}

function dedupeKeys<TKey>(keys: readonly TKey[], compare: (left: TKey, right: TKey) => boolean): TKey[] {
  return keys.reduce<TKey[]>((result, key) => {
    if (!result.some(value => compare(value, key))) result.push(key);
    return result;
  }, []);
}

function readPath(value: unknown, path: string | undefined): unknown {
  if (!path) return value;
  return path.split('.').reduce<unknown>((current, segment) => {
    if (typeof current !== 'object' || current === null) return undefined;
    return (current as Record<string, unknown>)[segment];
  }, value);
}

export function normalizeTreeSelectKeys<TKey>(value: SdTreeSelectModel<TKey>, multiple: boolean): TKey[] {
  if (value == null) return [];
  if (Array.isArray(value)) return multiple ? [...value] : value.slice(0, 1);
  return [value as TKey];
}
