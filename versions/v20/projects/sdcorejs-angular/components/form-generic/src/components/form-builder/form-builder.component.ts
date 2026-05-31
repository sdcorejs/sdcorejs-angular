/* eslint-disable @angular-eslint/no-input-rename */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { CdkDragDrop, CdkDragMove, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdBaseSecureComponent } from '@sdcorejs/angular/components/base';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { SdConfirmService, SdNotifyService } from '@sdcorejs/angular/services';
import { Utilities } from '@sdcorejs/utils/fns';
import { debounceTime, startWith, Subject, Subscription } from 'rxjs';
import {
  COMPONENT_ICONS,
  FormBuilderComponent,
  FormBuilderComponentGroup,
  FormBuilderComponents,
  GenerateId,
  GenerateKey,
  SdFormGenericComponent,
  SdFormGenericGroup,
  SdFormGenericVariable,
} from '../../models';
import { SdFormGenericValidation } from '../../models/form-generic-validation.model';
import { SdFormGeneric } from '../../models/form-generic.model';
import { SdFormRender } from '../form-render/form-render.component';
import {
  CheckboxAttribute,
  CheckboxControl,
  ChipCalendarAttribute,
  ChipCalendarControl,
  ChipStringAttribute,
  ChipStringControl,
  DatetimeAttribute,
  DatetimeControl,
  GroupAttribute,
  HtmlAttribute,
  HtmlControl,
  NumberAttribute,
  NumberControl,
  RadioAttribute,
  RadioControl,
  SelectAttribute,
  SelectControl,
  TableAttribute,
  TableControl,
  TextareaAttribute,
  TextareaControl,
  TextfieldAttribute,
  TextFieldControl,
  UploadAttribute,
  UploadControl,
} from './components';
import { ConfigureValidationComponent } from './components/configure-validation/configure-validation.component';
import { BuilderService } from './services';
import { I18nService, TranslatePipe } from '@sdcorejs/angular/i18n';

interface DragDropRowItem {
  items: (SdFormGenericComponent | SdFormGenericGroup)[];
  rowIndex?: number;
}

@Component({
  selector: 'sd-form-builder',
  templateUrl: './form-builder.component.html',
  styleUrl: './form-builder.component.scss',
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    DragDropModule,
    // Controls
    TextFieldControl,
    TextfieldAttribute,
    TextareaControl,
    TextareaAttribute,
    ChipStringControl,
    ChipStringAttribute,
    ChipCalendarControl,
    ChipCalendarAttribute,
    NumberControl,
    NumberAttribute,
    SelectControl,
    SelectAttribute,
    DatetimeControl,
    DatetimeAttribute,
    RadioControl,
    RadioAttribute,
    CheckboxControl,
    CheckboxAttribute,
    HtmlControl,
    HtmlAttribute,
    UploadControl,
    UploadAttribute,
    TableControl,
    TableAttribute,
    GroupAttribute,
    SdModal,
    SdInput,
    SdTextarea,
    SdButton,
    SdFormRender,
    ConfigureValidationComponent, TranslatePipe],
})
export class SdFormBuilder extends SdBaseSecureComponent {
  // â”€â”€ viewChild signals (Angular 17+) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  readonly popupViewJSON = viewChild<SdModal>('popupViewJSON');
  readonly popupConfigureVariables = viewChild<SdModal>('popupConfigureVariables');
  readonly configureValidation = viewChild(ConfigureValidationComponent);
  readonly formRender = viewChild(SdFormRender);

  // â”€â”€ injected services â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  readonly #ref = inject(ChangeDetectorRef);
  readonly #notifyService = inject(SdNotifyService);
  readonly #confirmService = inject(SdConfirmService);
  readonly #builderService = inject(BuilderService);
  readonly #i18n = inject(I18nService);

  form = new FormGroup({});

  // â”€â”€ signal inputs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  /** Input chÃ­nh: schema form. Má»—i láº§n ref thay Ä‘á»•i â†’ effect sáº½ clone vá» local arrays. */
  readonly formGeneric = input<SdFormGeneric | undefined>(undefined);

  // â”€â”€ component registry (immutable) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  readonly formBuilderComponents = FormBuilderComponents;
  readonly componentIcons = COMPONENT_ICONS;

  // â”€â”€ palette state (signal + computed group buckets) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  readonly paletteSearch = signal('');
  readonly paletteGroups = computed<{ key: FormBuilderComponentGroup; label: string; items: FormBuilderComponent[] }[]>(() => {
    const term = this.paletteSearch().trim().toLowerCase();
    const match = (c: FormBuilderComponent) =>
      !term || c.name.toLowerCase().includes(term) || c.type.toLowerCase().includes(term);
    const buckets: Record<FormBuilderComponentGroup, FormBuilderComponent[]> = { basic: [], choice: [], advanced: [], layout: [] };
    for (const c of this.formBuilderComponents) {
      if (match(c)) buckets[c.group].push(c);
    }
    return [
      { key: 'basic' as const, label: 'Basic', items: buckets.basic },
      { key: 'choice' as const, label: 'Choice', items: buckets.choice },
      { key: 'advanced' as const, label: 'Advanced', items: buckets.advanced },
      { key: 'layout' as const, label: 'Layout', items: buckets.layout },
    ].filter(g => g.items.length > 0);
  });

  // â”€â”€ local mutable state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Components/variables/validations giá»¯ lÃ  plain arrays vÃ¬ code hiá»‡n táº¡i
  // mutate in-place ráº¥t nhiá»u chá»— (push, splice, forEach â€¦). Äá»•i sang signal
  // tá»‘n rá»§i ro vá»›i ráº¥t Ã­t lá»£i Ã­ch â€” chá»‰ markForCheck() khi cáº§n.
  components: Required<SdFormGeneric>['components'] = [];
  variables: Required<SdFormGeneric>['variables'] = [];
  validations: Required<SdFormGeneric>['validations'] = [];

  /** Cloned variables â€” dÃ¹ng cho modal "Configure variables" (huá»· thÃ¬ discard, ok thÃ¬ gÃ¡n ngÆ°á»£c). */
  clonedVariables: SdFormGenericVariable[] = [];

  readonly selectedComponent = signal<SdFormGenericComponent | SdFormGenericGroup | undefined>(undefined);
  readonly isPreview = signal(false);

  /** Signal toÃ n cá»¥c: TRUE khi Báº¤T Ká»² cdkDrag nÃ o Ä‘ang active (palette, canvas, group, resize).
   *  Trigger class `.fb-shell--dragging` Ä‘á»ƒ áº©n hover/actions/resize toÃ n diá»‡n, khÃ´ng phá»¥ thuá»™c :has(). */
  readonly isAnyDragging = signal(false);

  expand = true;
  dragDropRows: DragDropRowItem[] = [];
  isDragging = false;
  targetItem?: DragDropRowItem = undefined;
  private lastDragPointer?: { x: number; y: number };

  /** Handler chung cho má»i cdkDragStarted â€” set signal global true. */
  onAnyDragStarted = () => {
    this.isAnyDragging.set(true);
  };

  onAnyDragMoved = (event: CdkDragMove<any>) => {
    this.lastDragPointer = event.pointerPosition;
    const rowEl = document
      .elementFromPoint(event.pointerPosition.x, event.pointerPosition.y)
      ?.closest('.fb-row') as HTMLElement | null;
    const rowIndex = rowEl?.id?.startsWith('row_') ? Number(rowEl.id.replace('row_', '')) : NaN;
    const row = Number.isNaN(rowIndex) ? undefined : this.dragDropRows.find(t => t.rowIndex === rowIndex);
    if (row && this.targetItem !== row) {
      this.targetItem = row;
      this.#ref.markForCheck();
    }
  };

  /** Handler chung cho má»i cdkDragEnded â€” set signal global false (dÃ¹ng setTimeout 0
   *  Ä‘á»ƒ chá» CDK xá»­ lÃ½ xong drop event trÆ°á»›c khi UI re-enable). */
  onAnyDragEnded = () => {
    setTimeout(() => {
      this.isAnyDragging.set(false);
      this.lastDragPointer = undefined;
      this.targetItem = undefined;
      this.#ref.markForCheck();
    }, 0);
  };

  #componentsChanges = new Subject<void>();
  #variablesChanges = new Subject<void>();
  #validationsChanges = new Subject<void>();
  #subscription = new Subscription();

  constructor() {
    super();
    // Khi input `formGeneric` ref thay Ä‘á»•i: clone components/variables/validations
    // sang local arrays vÃ  báº¯n subject tÆ°Æ¡ng á»©ng cho stream debounced (syncRows).
    // untracked() bao bá»c cÃ¡c mutation Ä‘á»ƒ khÃ´ng táº¡o cycle (effect chá»‰ tracks formGeneric()).
    effect(() => {
      const fg = this.formGeneric();
      untracked(() => {
        this.components = Array.isArray(fg?.components) ? JSON.parse(JSON.stringify(fg!.components)) : [];
        this.variables = Array.isArray(fg?.variables) ? JSON.parse(JSON.stringify(fg!.variables)) : [];
        this.validations = Array.isArray(fg?.validations) ? JSON.parse(JSON.stringify(fg!.validations)) : [];
        this.#componentsChanges.next();
        this.#variablesChanges.next();
        this.#validationsChanges.next();
      });
    });
  }

  ngOnInit() {
    this.#subscription.add(
      this.#componentsChanges.pipe(debounceTime(200), startWith('')).subscribe(() => {
        this.#syncComponentsToRows();
        this.#ref.markForCheck();
      })
    );
    this.#subscription.add(
      this.#variablesChanges.pipe(debounceTime(200), startWith('')).subscribe(() => {
        this.#ref.markForCheck();
      })
    );
    this.#subscription.add(
      this.#validationsChanges.pipe(debounceTime(200), startWith('')).subscribe(() => {
        this.#ref.markForCheck();
      })
    );
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }

  addComponent = (item: FormBuilderComponent, index?: number) => {
    const id = GenerateId();
    let newComponent: SdFormGenericComponent | SdFormGenericGroup;
    if (item.type === 'group') {
      // Group lÃ  layout container, khÃ´ng cÃ³ key/validate; cÃ³ nested components[] + properties{icon,color}.
      newComponent = {
        id,
        type: 'group',
        label: 'Group',
        layout: { columns: '12' },
        components: [],
        properties: {
          icon: item.symbol || 'category',
          color: 'primary',
        },
      } as SdFormGenericGroup;
    } else if (item.type === 'break') {
      // Break: 12-col luÃ´n, Ä‘Ã³ng vai trÃ² row separator cá»‘ Ä‘á»‹nh. Extend base nÃªn cÃ³ key
      // (auto-gen cho stability) nhÆ°ng khÃ´ng hiá»ƒn thá»‹ trong attribute panel.
      newComponent = {
        id,
        key: GenerateKey(),
        type: 'break',
        label: 'Break',
        layout: { columns: '12' },
        validate: {},
        disabled: false,
        properties: {},
      } as any;
    } else {
      newComponent = {
        id,
        key: GenerateKey(),
        type: item.type as any,
        label: item.type,
        layout: { columns: '12' },
        validate: { required: false },
        disabled: false,
        properties: {},
      } as SdFormGenericComponent;
    }
    if (index !== undefined) {
      this.components.splice(index, 0, newComponent);
    } else {
      this.components.push(newComponent);
    }

    this.#recountTabIndex();
    const created = this.components?.find(component => component.id === id);
    this.selectedComponent.set(created);
    this.selectComponent(created);
    this.#ref.markForCheck();
  };

  // â”€â”€ Helpers cho UI má»›i â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  /** Symbol Material Ä‘á»ƒ render trÃªn canvas item / attribute header. */
  symbolFor = (item: SdFormGenericComponent | SdFormGenericGroup): string => {
    if (item.type === 'group') return (item as SdFormGenericGroup).properties?.icon || 'category';
    return this.componentIcons[item.type]?.symbol ?? 'help';
  };

  /** Human-readable type label (e.g. "Text field", "Date"). */
  typeLabelFor = (item: SdFormGenericComponent | SdFormGenericGroup): string => {
    return this.componentIcons[item.type]?.label ?? item.type;
  };

  /** True náº¿u component cÃ³ expression Ä‘iá»u kiá»‡n â€” drives the "conditional" status chip. */
  hasConditional = (item: SdFormGenericComponent | SdFormGenericGroup): boolean => {
    const p: any = item.properties || {};
    return !!(p.visibleWhenExpression || p.hiddenWhenExpression || p.disabledWhenExpression || p.requiredWhenExpression);
  };

  /** Map SdColor preset â†’ 2 CSS var names cho header-bg vÃ  header-fg cá»§a group card. */
  groupColorVars = (color: string | undefined | null): { bg: string; fg: string } => {
    switch (color) {
      case 'secondary':
        return { bg: 'var(--md-sys-color-secondary-container)', fg: 'var(--md-sys-color-on-secondary-container)' };
      case 'success':
        return { bg: 'var(--md-sys-color-success-container)', fg: 'var(--md-sys-color-success)' };
      case 'warning':
        return { bg: 'var(--md-sys-color-warning-container)', fg: 'var(--md-sys-color-warning)' };
      case 'error':
        return { bg: 'var(--md-sys-color-error-container)', fg: 'var(--md-sys-color-error)' };
      case 'primary':
      default:
        return { bg: 'var(--md-sys-color-primary-container)', fg: 'var(--md-sys-color-primary)' };
    }
  };

  /** Segmented Design/Preview toggle (replaces play_circle/stop_circle). */
  setMode = (preview: boolean) => {
    this.isPreview.set(preview);
  };

  /** Nested drop handler â€” when dragging a palette item or canvas item INTO a group body. */
  dropInGroup = (event: CdkDragDrop<any[]>, group: SdFormGenericGroup) => {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }
    const dropped = event.previousContainer.data[event.previousIndex];
    if (dropped && 'symbol' in dropped) {
      // Palette â†’ group: táº¡o component má»›i rá»“i push vÃ o group.components.
      const item = dropped as FormBuilderComponent;
      if (item.type === 'group') {
        this.#notifyService.warning('Group lá»“ng group chÆ°a Ä‘Æ°á»£c há»— trá»£.');
        return;
      }
      const newComponent = this.#createComponentFromPalette(item) as SdFormGenericComponent;
      group.components.splice(event.currentIndex, 0, newComponent);
      this.selectedComponent.set(newComponent);
      this.#ref.markForCheck();
    } else {
      // Canvas â†’ group: chuyá»ƒn instance hiá»‡n cÃ³.
      const component = dropped as SdFormGenericComponent | SdFormGenericGroup;
      if (component.type === 'group') {
        this.#notifyService.warning('Group lá»“ng group chÆ°a Ä‘Æ°á»£c há»— trá»£.');
        return;
      }
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      this.#syncRowsToComponents();
    }
  };

  /** Quick-add break sau row chá»‰ Ä‘á»‹nh.
   *  TÃ­nh component index cuá»‘i cÃ¹ng cá»§a row Ä‘Ã³ trong this.components, splice break vÃ o sau.
   *  KhÃ´ng qua palette â€” chá»‰ lÃ  utility action bÃ¡m theo row trÃªn canvas.
   */
  insertBreakAfter = (row: DragDropRowItem) => {
    const lastItemId = row.items[row.items.length - 1]?.id;
    const insertAfter = lastItemId ? this.components.findIndex(c => c.id === lastItemId) : this.components.length - 1;
    const newBreak: any = {
      id: GenerateId(),
      key: GenerateKey(),
      type: 'break',
      label: 'Break',
      layout: { columns: '12' },
      validate: {},
      disabled: false,
      properties: {},
    };
    this.components.splice(insertAfter + 1, 0, newBreak);
    this.#recountTabIndex();
    this.#ref.markForCheck();
  };

  /** Remove a child component from a group's nested list. */
  removeFromGroup = (group: SdFormGenericGroup, id: string) => {
    group.components = group.components.filter(c => c.id !== id);
    if (this.selectedComponent()?.id === id) this.selectedComponent.set(undefined);
    this.#ref.markForCheck();
  };

  removeComponent = (id: string) => {
    this.components = this.components.filter((t: { id: string }) => t.id !== id);
    this.#recountTabIndex();
  };

  selectComponent = (item?: SdFormGenericComponent | SdFormGenericGroup) => {
    this.selectedComponent.set(item);
    this.#ref.markForCheck();
  };

  onClickedOutside = (e: any) => {
    const classList = (e.target as Element).classList;
    if (!classList.length || classList.contains('components') || classList.contains('cdk-drop-list')) {
      this.selectedComponent.set(undefined);
    }
  };

  clickFormContentEmpty = () => {
    if (!this.dragDropRows?.length) {
      this.selectedComponent.set(undefined);
    }
  };

  drop = (event: CdkDragDrop<any[]>) => {
    if (this.#dropIntoGroupAtPointer(event)) {
      this.#recountTabIndex();
      return;
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.#syncRowsToComponents();
      // xá»­ lÃ½ kÃ©o chÃ©o
      if (!event.isPointerOverContainer) {
        const dragItemId = event.item.element.nativeElement.id;
        if (dragItemId) {
          const dragItem = this.components.find((t: { id: string }) => t.id === dragItemId);
          this.xuLyKeoCheo(dragItem);
        }
      }
    } else {
      const drop = event.previousContainer.data[0];
      if (drop && 'symbol' in drop) {
        // transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
        const droppedItem = event.previousContainer.data[event.previousIndex] as FormBuilderComponent;
        const rowIndex = event.currentIndex;
        const rowItem = this.dragDropRows?.find(t => t.rowIndex === rowIndex);
        if (rowItem) {
          this.addComponent(droppedItem, +(rowItem.items[0]?.layout?.row || 12) - 1);
          // this.addComponent(droppedItem, parseInt(rowItem.items[rowItem.items.length - 1].layout.row, 0));
        } else {
          this.addComponent(droppedItem);
        }
      } else {
        transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      }
    }
    this.#recountTabIndex();
  };

  dragStartComponentItem = (event: any) => {
    this.isDragging = true;
  };

  dragEndComponentItem = (event: any) => {
    this.isDragging = false;
  };

  onMouseover = (event: MouseEvent, rowItem: DragDropRowItem) => {
    if (this.isDragging && this.targetItem !== rowItem) {
      this.targetItem = rowItem;
      this.#ref.markForCheck();
    }
  };

  // Mouseover thÃ¬ pháº£i cÃ³ Focus khÃ´ng thÃ¬ tháº» sáº½ bÃ¡o lá»—i
  onFocus = (event: FocusEvent) => {
    //console.log(event);
  };

  xuLyKeoCheo = (dragItem?: SdFormGenericComponent | SdFormGenericGroup) => {
    if (dragItem) {
      if (this.targetItem) {
        // kiá»ƒm tra target Ä‘Ã£ full column chÆ°a?
        const totalColumnInRow = this.targetItem.items.map(t => +t.layout!.columns || 12).reduce((acc, curr) => acc + curr, 0);
        if (totalColumnInRow + +dragItem.layout!.columns <= 12) {
          // xÃ³a vá»‹ trÃ­ cÅ©
          this.dragDropRows.forEach(t => {
            if (t.items.some((k: { id: any }) => k.id === dragItem.id)) {
              t.items = t.items.filter((k: { id: any }) => k.id !== dragItem.id) || [];
            }
          });
          // thÃªm vÃ o vá»‹ trÃ­ má»›i
          this.targetItem.items.push(dragItem);
          this.#syncRowsToComponents();
        } else {
          this.#notifyService.warning(this.#i18n.t('core.component.form-builder.row-overflow'));
        }
      }
    }
    this.targetItem = undefined;
  };

  noReturnPredicate = () => {
    return false;
  };

  #recountTabIndex = () => {
    // TrÃ¡nh dÃ¹ng map vÃ¬ nÃ³ sáº½ sinh ra reference má»›i
    this.components.forEach((item, index) => {
      if (item.layout) {
        item.layout!.row = `${index + 1}`;
        item.layout!.columns = item.layout?.columns || '12';
      } else {
        item.layout = {
          row: `${index + 1}`,
          columns: '12',
        };
      }
    });
    const sel = this.selectedComponent();
    if (sel && sel?.layout?.row) {
      sel.layout.row = this.components.find(t => t.id === sel.id)?.layout?.row;
    }
    this.#syncComponentsToRows();
  };

  // HÃ m xá»­ lÃ½ chuyá»ƒn Ä‘á»•i components -> dragDropRows
  // Dá»±a vÃ o columns cá»§a component Ä‘á»ƒ quyáº¿t Ä‘á»‹nh dragDropRows cÃ³ bao nhiÃªu items trÃªn row, Ä‘áº£m báº£o columns tá»•ng sá»‘ items <= 12
  #syncComponentsToRows = () => {
    this.dragDropRows = [];
    for (const component of this.components) {
      // láº¥y dÃ²ng cuá»‘i cÃ¹ng cá»§a dragDropList
      let lastRow: DragDropRowItem = { rowIndex: this.dragDropRows.length, items: [] };
      if (this.dragDropRows.length) {
        lastRow = this.dragDropRows[this.dragDropRows.length - 1];
      } else {
        this.dragDropRows.push(lastRow);
      }
      // tÃ­nh tá»•ng cá»™t trÃªn 1 dÃ²ng
      const columns = +component.layout!.columns || 12;
      const totalColumnInRow = lastRow.items.map(t => +t.layout!.columns || 12).reduce((acc: number, curr) => acc + curr, 0);
      if (+totalColumnInRow + columns <= 12) {
        lastRow.items.push(component);
      } else {
        const newRow = { rowIndex: this.dragDropRows.length, items: [component] };
        this.dragDropRows.push(newRow);
      }
    }
  };

  // HÃ m xá»­ lÃ½ chuyá»ƒn Ä‘á»•i dragDropRows -> components
  // VÃ¬ khi kÃ©o tháº£ sáº½ thay Ä‘á»•i vá»‹ trÃ­, do Ä‘Ã³ cáº§n sáº¯p xáº¿p láº¡i components
  #syncRowsToComponents = () => {
    // ráº£i data ma tráº­n droplist => schema.components
    this.components = this.dragDropRows?.map(e => e.items)?.reduce((current, next) => [...current, ...next], []) || [];
  };

  #createComponentFromPalette = (item: FormBuilderComponent): SdFormGenericComponent | SdFormGenericGroup => {
    const id = GenerateId();
    if (item.type === 'group') {
      return {
        id,
        type: 'group',
        label: 'Group',
        layout: { columns: '12' },
        components: [],
        properties: {
          icon: item.symbol || 'category',
          color: 'primary',
        },
      } as SdFormGenericGroup;
    }
    if (item.type === 'break') {
      return {
        id,
        key: GenerateKey(),
        type: 'break',
        label: 'Break',
        layout: { columns: '12' },
        validate: {},
        disabled: false,
        properties: {},
      } as any;
    }
    return {
      id,
      key: GenerateKey(),
      type: item.type as any,
      label: item.type,
      layout: { columns: '12' },
      validate: { required: false },
      disabled: false,
      properties: {},
    } as SdFormGenericComponent;
  };

  #dropIntoGroupAtPointer = (event: CdkDragDrop<any[]>): boolean => {
    const dropPoint = (event as any).dropPoint || this.lastDragPointer;
    if (!dropPoint) return false;

    const bodyEl = document.elementFromPoint(dropPoint.x, dropPoint.y)?.closest('.fb-group__body') as HTMLElement | null;
    const groupEl = bodyEl?.closest('.fb-group') as HTMLElement | null;
    const group = groupEl?.id ? this.#findGroupById(groupEl.id) : undefined;
    if (!group || event.container.data === group.components) return false;

    const dropped = event.previousContainer.data[event.previousIndex];
    if (!dropped) return false;

    if ('symbol' in dropped) {
      const paletteItem = dropped as FormBuilderComponent;
      if (paletteItem.type === 'group') {
        this.#notifyService.warning('Group lá»“ng group chÆ°a Ä‘Æ°á»£c há»— trá»£.');
        return true;
      }
      const created = this.#createComponentFromPalette(paletteItem) as SdFormGenericComponent;
      group.components.push(created);
      this.selectedComponent.set(created);
    } else {
      if (!('type' in dropped)) return false;
      const component = dropped as SdFormGenericComponent | SdFormGenericGroup;
      if (component.type === 'group') {
        this.#notifyService.warning('Group lá»“ng group chÆ°a Ä‘Æ°á»£c há»— trá»£.');
        return true;
      }
      transferArrayItem(event.previousContainer.data, group.components, event.previousIndex, group.components.length);
      this.#syncRowsToComponents();
      this.selectedComponent.set(component);
    }

    this.#ref.markForCheck();
    return true;
  };

  #findGroupById = (
    id: string,
    items: (SdFormGenericComponent | SdFormGenericGroup)[] = this.components
  ): SdFormGenericGroup | undefined => {
    for (const item of items) {
      if (item.type === 'group') {
        const group = item as SdFormGenericGroup;
        if (group.id === id) return group;
        const nested = this.#findGroupById(id, group.components || []);
        if (nested) return nested;
      }
    }
    return undefined;
  };

  changeSizeControl = async (
    event: CdkDragMove<SdFormGenericComponent | SdFormGenericGroup>,
    item: SdFormGenericComponent | SdFormGenericGroup,
    items: (SdFormGenericComponent | SdFormGenericGroup)[],
    currentIndex: number
  ) => {
    // const totalColumnInRow = items.map(k => k.layout.columns).reduce((acc, curr) => acc + parseInt(curr, 0), 0);
    const totalColumnBeforeItem = items
      .map(k => +k.layout!.columns || 12)
      .reduce((acc, curr, index) => {
        if (index < currentIndex) {
          acc = acc + curr;
        }
        return acc;
      }, 0);
    const rect = document.getElementById('frmComponent')?.getBoundingClientRect() as DOMRect;
    const left = rect.left;
    const right = rect.right - left;
    const mouse = event.pointerPosition.x - left!;
    const t = Math.round(12 / (100 / ((100 * mouse) / right))) - totalColumnBeforeItem;
    // Clamp + skip-if-unchanged Ä‘á»ƒ trÃ¡nh re-render má»—i pixel mouse di chuyá»ƒn.
    const newCols = t > 12 ? '12' : t < 2 ? '2' : `${t}`;
    if (item.layout!.columns !== newCols) {
      item.layout!.columns = newCols as any;
    }

    //     document.getElementById('test').innerHTML = `<pre>
    // left: ${left}
    // right: ${document.getElementById('frmComponent').getBoundingClientRect().right}
    // right-left: ${right}
    // mouse: ${event.pointerPosition.x}
    // mouse-left: ${mouse}
    // t: ${t}
    // columns: ${item.layout.columns}
    // </pre>`;
  };

  dragEndChangeSizeControl = (event: any) => {
    this.#recountTabIndex();
  };

  /** Resize a child item INSIDE a group.
   *  Math: láº¥y bounding cá»§a chÃ­nh item, tÃ­nh (mouse.x - item.left) / colWidth = newCols.
   *  CÃ¡ch nÃ y Ä‘Ãºng cho cáº£ flex-wrap (item á»Ÿ wrap row 2+) vÃ¬ dÃ¹ng item-relative,
   *  khÃ´ng pháº£i sum-of-all-preceding-cols (sai khi item wrap xuá»‘ng row má»›i).
   */
  changeSizeChildInGroup = (
    event: CdkDragMove<SdFormGenericComponent>,
    child: SdFormGenericComponent,
    group: SdFormGenericGroup
  ) => {
    const groupEl = document.getElementById(group.id);
    const bodyEl = groupEl?.querySelector('.fb-group__body') as HTMLElement | null;
    const childEl = document.getElementById(child.id);
    if (!bodyEl || !childEl) return;

    const bodyRect = bodyEl.getBoundingClientRect();
    const childRect = childEl.getBoundingClientRect();
    // Width cá»§a 1 col trong group body (loáº¡i trá»« padding náº¿u cÃ³).
    const bodyStyle = getComputedStyle(bodyEl);
    const padL = parseFloat(bodyStyle.paddingLeft) || 0;
    const padR = parseFloat(bodyStyle.paddingRight) || 0;
    const colWidth = (bodyRect.width - padL - padR) / 12;
    if (colWidth <= 0) return;

    // Má»›i: new right edge = mouse.x; new width = mouse.x - child.left
    const newWidth = event.pointerPosition.x - childRect.left;
    let newCols = Math.round(newWidth / colWidth);
    if (newCols < 2) newCols = 2;
    if (newCols > 12) newCols = 12;
    child.layout!.columns = `${newCols}` as any;
  };

  onChangeViewed = (component: SdFormGenericComponent) => {
    component.properties!.viewed = !component.properties!.viewed;
    // Emit khi cÃ³ sá»± thay Ä‘á»•i Ä‘á»ƒ control vÃ  attribute láº¯ng nghe vÃ  render láº¡i
    this.#builderService.componentEmitters.next(component);
  };

  onChangeHidden = (component: SdFormGenericComponent | SdFormGenericGroup) => {
    component.properties!.hidden = !component.properties!.hidden;
    // Emit khi cÃ³ sá»± thay Ä‘á»•i Ä‘á»ƒ control vÃ  attribute láº¯ng nghe vÃ  render láº¡i
    this.#builderService.componentEmitters.next(component);
  };

  // Duplicate component nhÆ°ng sáº½ clear id vÃ  key Ä‘á»ƒ trÃ¡nh trÃ¹ng láº·p
  onDuplicate = (component: SdFormGenericComponent | SdFormGenericGroup) => {
    const clonedComponent = JSON.parse(JSON.stringify(component));
    clonedComponent.id = GenerateId();
    clonedComponent.key = GenerateKey();
    this.components.push(clonedComponent);
    this.#recountTabIndex();
    const created = this.components?.find(t => t.id === clonedComponent.id);
    this.selectedComponent.set(created);
    this.selectComponent(created);
    this.#ref.markForCheck();
  };

  // Copy form hiá»‡n táº¡i
  jsonString?: string;
  viewJSON = () => {
    this.jsonString = JSON.stringify({ components: this.components });
    this.popupViewJSON()?.open();
    this.#ref.markForCheck();
  };

  updateJSON = () => {
    try {
      if (this.jsonString) {
        const json: Record<string, any> = JSON.parse(this.jsonString);
        if ('components' in json) {
          this.components = json['components'];
          this.popupViewJSON()?.close();
          this.#syncComponentsToRows();
          this.#ref.markForCheck();
        } else {
          throw new Error('Invalid JSON');
        }
      }
    } catch (err: any) {
      console.error(err);
      this.#notifyService.warning(err?.message);
    }
  };

  configureVariables = () => {
    this.clonedVariables = JSON.parse(JSON.stringify(this.variables || []));
    this.popupConfigureVariables()?.open();
    this.#ref.markForCheck();
  };

  addVariables = () => {
    this.clonedVariables.push({
      id: Utilities.randomId(),
      key: '',
      label: '',
    });
  };

  removeVariables = (id: string) => {
    const idx = this.clonedVariables.findIndex(e => e.id === id);
    this.clonedVariables.splice(idx, 1);
  };

  updateVariables = () => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.#ref.markForCheck();
      return;
    }
    this.variables = this.clonedVariables;
    this.popupConfigureVariables()?.close();
    this.#ref.markForCheck();
  };

  // ChÃ¬a ra cho bÃªn ngoÃ i láº¥y components hiá»‡n táº¡i
  getComponents = (): (SdFormGenericComponent | SdFormGenericGroup)[] => {
    this.#syncRowsToComponents();
    return JSON.parse(JSON.stringify(this.components || []));
  };

  // ChÃ¬a ra cho bÃªn ngoÃ i láº¥y variables hiá»‡n táº¡i
  getVariables = (): SdFormGenericVariable[] => {
    return JSON.parse(JSON.stringify(this.variables || []));
  };

  #getValidations = (): SdFormGenericValidation[] => {
    return JSON.parse(JSON.stringify(this.validations || []));
  };

  getForm = (): SdFormGeneric => {
    return {
      components: this.getComponents(),
      variables: this.getVariables(),
      validations: this.#getValidations(),
    };
  };

  openConfigureValidation = () => {
    this.configureValidation()?.open(this.getForm());
  };

  onUpdateValidations = (validations: SdFormGenericValidation[]) => {
    this.validations = validations;
  };

  onValidate = async () => {
    const errorMessages = await this.formRender()?.getValidationMessages('error');
    if (errorMessages?.length) {
      this.#notifyService.error(errorMessages);
      return;
    }
    const warningMessages = await this.formRender()?.getValidationMessages('warning');
    if (warningMessages?.length) {
      this.#confirmService.confirm(warningMessages.join(', ')).then(() => {
        this.#notifyService.success('Submit success');
      });
    } else {
      this.#notifyService.success('Submit success');
    }
  };
}

