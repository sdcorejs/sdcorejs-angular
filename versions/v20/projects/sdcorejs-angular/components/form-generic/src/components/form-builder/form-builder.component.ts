import { CdkDrag, CdkDragDrop, CdkDragMove, CdkDropList, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
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
import { buildFormBuilderRows, canPlaceInRow, flattenFormBuilderRows, FormBuilderLayoutRow, moveItemToRow } from './form-builder-layout';
import { BuilderService } from './services';
import { I18nService, TranslatePipe } from '@sdcorejs/angular/i18n';

interface DragDropRowItem extends FormBuilderLayoutRow {
  rowIndex?: number;
}

interface ResizeState {
  itemId: string;
  rowId: string;
  columns: string;
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
    ConfigureValidationComponent,
    TranslatePipe,
  ],
})
export class SdFormBuilder implements OnInit, OnDestroy {
  // ── viewChild signals (Angular 17+) ────────────────────────────────────
  readonly popupViewJSON = viewChild<SdModal>('popupViewJSON');
  readonly popupConfigureVariables = viewChild<SdModal>('popupConfigureVariables');
  readonly configureValidation = viewChild(ConfigureValidationComponent);
  readonly formRender = viewChild(SdFormRender);

  // ── injected services ──────────────────────────────────────────────────
  readonly #ref = inject(ChangeDetectorRef);
  readonly #notifyService = inject(SdNotifyService);
  readonly #confirmService = inject(SdConfirmService);
  readonly #builderService = inject(BuilderService);
  readonly #i18n = inject(I18nService);

  form = new FormGroup({});

  // ── signal inputs ──────────────────────────────────────────────────────
  /** Input chính: schema form. Mỗi lần ref thay đổi → effect sẽ clone về local arrays. */
  readonly formGeneric = input<SdFormGeneric | undefined>(undefined);

  // ── component registry (immutable) ─────────────────────────────────────
  readonly formBuilderComponents = FormBuilderComponents;
  readonly componentIcons = COMPONENT_ICONS;

  // ── palette state (signal + computed group buckets) ────────────────────
  readonly paletteSearch = signal('');
  readonly paletteGroups = computed<{ key: FormBuilderComponentGroup; label: string; items: FormBuilderComponent[] }[]>(() => {
    const term = this.paletteSearch().trim().toLowerCase();
    // why: trong chế độ Detail group, ẩn item 'group' khỏi palette — không cho group lồng group.
    const inGroup = !!this.editingGroupId();
    const match = (c: FormBuilderComponent) =>
      (!inGroup || c.type !== 'group') && (!term || c.name.toLowerCase().includes(term) || c.type.toLowerCase().includes(term));
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

  // ── local mutable state ────────────────────────────────────────────────
  // Components/variables/validations giữ là plain arrays vì code hiện tại
  // mutate in-place rất nhiều chỗ (push, splice, forEach …). Đổi sang signal
  // tốn rủi ro với rất ít lợi ích — chỉ markForCheck() khi cần.
  components: Required<SdFormGeneric>['components'] = [];
  variables: Required<SdFormGeneric>['variables'] = [];
  validations: Required<SdFormGeneric>['validations'] = [];

  /** Cloned variables — dùng cho modal "Configure variables" (huỷ thì discard, ok thì gán ngược). */
  clonedVariables: SdFormGenericVariable[] = [];

  readonly selectedComponent = signal<SdFormGenericComponent | SdFormGenericGroup | undefined>(undefined);
  readonly isPreview = signal(false);

  // ── group drill-in (Detail) ─────────────────────────────────────────────
  // why: bỏ hẳn drag/drop trong group. Thay vào đó "Detail" 1 group → mở canvas
  // riêng chỉ thiết kế children của group đó (cùng tooling: palette/reorder/resize/
  // attribute), KHÔNG cho group lồng group. OK = giữ, Cancel = revert. Depth tối đa
  // 1 (group không chứa group) nên chỉ cần 1 con trỏ editingGroupId, không cần stack.
  readonly editingGroupId = signal<string | undefined>(undefined);
  /** Group đang được Detail (tìm ở TOP-LEVEL theo id), undefined = đang ở canvas chính. */
  readonly editingGroup = computed<SdFormGenericGroup | undefined>(() => {
    const id = this.editingGroupId();
    if (!id) return undefined;
    return this.components.find(c => c.id === id && c.type === 'group') as SdFormGenericGroup | undefined;
  });
  /** Snapshot (deep clone JSON) của group.components khi vào Detail — phục vụ Cancel. */
  #groupSnapshot?: string;

  /** Mảng components đang được canvas thao tác: children của group khi Detail, ngược lại là top-level. */
  #scope = (): (SdFormGenericComponent | SdFormGenericGroup)[] => this.editingGroup()?.components ?? this.components;

  /** Signal toàn cục: TRUE khi BẤT KỲ cdkDrag nào đang active (palette, canvas, group, resize).
   *  Trigger class `.fb-shell--dragging` để ẩn hover/actions/resize toàn diện, không phụ thuộc :has(). */
  readonly isAnyDragging = signal(false);
  readonly dragSource = signal<'palette' | 'row' | 'canvas' | 'resize' | undefined>(undefined);
  readonly resizeState = signal<ResizeState | undefined>(undefined);
  readonly isResizing = computed(() => !!this.resizeState());

  expand = true;
  dragDropRows: DragDropRowItem[] = [];
  isDragging = false;
  targetItem?: DragDropRowItem = undefined;
  private lastDragPointer?: { x: number; y: number };

  /** Handler chung cho mọi cdkDragStarted — set signal global true. */
  onAnyDragStarted = () => {
    this.isAnyDragging.set(true);
  };

  onPaletteDragStarted = () => {
    this.dragSource.set('palette');
    this.onAnyDragStarted();
  };

  onRowDragStarted = () => {
    this.dragSource.set('row');
    this.onAnyDragStarted();
  };

  onAnyDragMoved = (event: CdkDragMove<any>) => {
    this.lastDragPointer = event.pointerPosition;
    const rowEl = document.elementFromPoint(event.pointerPosition.x, event.pointerPosition.y)?.closest('.fb-row') as HTMLElement | null;
    const row = rowEl?.id ? this.dragDropRows.find(t => t.id === rowEl.id) : undefined;
    if (row && this.targetItem !== row) {
      this.targetItem = row;
      this.#ref.markForCheck();
    }
  };

  /** Handler chung cho mọi cdkDragEnded — set signal global false (dùng setTimeout 0
   *  để chờ CDK xử lý xong drop event trước khi UI re-enable). */
  onAnyDragEnded = () => {
    setTimeout(() => {
      this.isAnyDragging.set(false);
      this.dragSource.set(undefined);
      this.lastDragPointer = undefined;
      this.targetItem = undefined;
      this.#ref.markForCheck();
    }, 0);
  };

  startResizeControl = (item: SdFormGenericComponent | SdFormGenericGroup, row: DragDropRowItem) => {
    this.dragSource.set('resize');
    this.isAnyDragging.set(true);
    this.resizeState.set({ itemId: item.id, rowId: row.id, columns: `${item.layout?.columns || '12'}` });
    this.#ref.markForCheck();
  };

  endResizeControl = (event: any) => {
    this.dragEndChangeSizeControl(event);
    this.resizeState.set(undefined);
    this.onAnyDragEnded();
  };

  #componentsChanges = new Subject<void>();
  #variablesChanges = new Subject<void>();
  #validationsChanges = new Subject<void>();
  #subscription = new Subscription();

  constructor() {
    // Khi input `formGeneric` ref thay đổi: clone components/variables/validations
    // sang local arrays và bắn subject tương ứng cho stream debounced (syncRows).
    // untracked() bao bọc các mutation để không tạo cycle (effect chỉ tracks formGeneric()).
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

  addComponent = (item: FormBuilderComponent, index?: number, layoutColumns = '12') => {
    // why: không cho thêm group khi đang Detail trong 1 group (tránh group lồng group).
    if (item.type === 'group' && this.editingGroupId()) return;
    const id = GenerateId();
    const columns = item.type === 'break' ? '12' : layoutColumns;
    let newComponent: SdFormGenericComponent | SdFormGenericGroup;
    if (item.type === 'group') {
      // Group là layout container, không có key/validate; có nested components[] + properties{icon,color}.
      newComponent = {
        id,
        type: 'group',
        label: 'Group',
        layout: { columns },
        components: [],
        properties: {
          icon: item.symbol || 'category',
          color: 'primary',
        },
      } as SdFormGenericGroup;
    } else if (item.type === 'break') {
      // Break: 12-col luôn, đóng vai trò row separator cố định. Extend base nên có key
      // (auto-gen cho stability) nhưng không hiển thị trong attribute panel.
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
        layout: { columns },
        validate: { required: false },
        disabled: false,
        properties: {},
      } as SdFormGenericComponent;
    }
    const scope = this.#scope();
    if (index !== undefined) {
      scope.splice(index, 0, newComponent);
    } else {
      scope.push(newComponent);
    }

    this.#recountTabIndex();
    const created = scope.find(component => component.id === id);
    this.selectedComponent.set(created);
    this.selectComponent(created);
    this.#ref.markForCheck();
  };

  // ── Helpers cho UI mới ────────────────────────────────────────
  /** Symbol Material để render trên canvas item / attribute header. */
  symbolFor = (item: SdFormGenericComponent | SdFormGenericGroup): string => {
    if (item.type === 'group') return (item as SdFormGenericGroup).properties?.icon || 'category';
    return this.componentIcons[item.type]?.symbol ?? 'help';
  };

  /** Human-readable type label (e.g. "Text field", "Date"). */
  typeLabelFor = (item: SdFormGenericComponent | SdFormGenericGroup): string => {
    return this.componentIcons[item.type]?.label ?? item.type;
  };

  /** True nếu component có expression điều kiện — drives the "conditional" status chip. */
  hasConditional = (item: SdFormGenericComponent | SdFormGenericGroup): boolean => {
    const p: any = item.properties || {};
    return !!(p.visibleWhenExpression || p.hiddenWhenExpression || p.disabledWhenExpression || p.requiredWhenExpression);
  };

  /** Map SdColor preset → 2 CSS var names cho header-bg và header-fg của group card. */
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

  // ── Group drill-in (Detail) navigation ──────────────────────────────────
  /** Mở canvas thiết kế riêng cho 1 group (chỉ children của nó). Snapshot để Cancel revert. */
  enterGroupEdit = (group: SdFormGenericGroup) => {
    this.#groupSnapshot = JSON.stringify(group.components ?? []);
    this.editingGroupId.set(group.id);
    this.selectedComponent.set(undefined);
    this.#recountTabIndex();
    this.#ref.markForCheck();
  };

  /** OK: giữ thay đổi children, quay về canvas chính. */
  confirmGroupEdit = () => {
    this.#groupSnapshot = undefined;
    this.editingGroupId.set(undefined);
    this.selectedComponent.set(undefined);
    this.#syncComponentsToRows();
    this.#ref.markForCheck();
  };

  /** Cancel: revert children về snapshot lúc vào Detail, rồi quay về canvas chính. */
  cancelGroupEdit = () => {
    const g = this.editingGroup();
    if (g && this.#groupSnapshot !== undefined) {
      g.components = JSON.parse(this.#groupSnapshot);
    }
    this.#groupSnapshot = undefined;
    this.editingGroupId.set(undefined);
    this.selectedComponent.set(undefined);
    this.#syncComponentsToRows();
    this.#ref.markForCheck();
  };

  /** Quick-add break sau row chỉ định (theo scope hiện tại — top-level hoặc group).
   *  Tính component index cuối cùng của row đó trong scope, splice break vào sau.
   */
  insertBreakAfter = (row: DragDropRowItem) => {
    const scope = this.#scope();
    const lastItemId = row.items[row.items.length - 1]?.id;
    const insertAfter = lastItemId ? scope.findIndex(c => c.id === lastItemId) : scope.length - 1;
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
    scope.splice(insertAfter + 1, 0, newBreak);
    this.#recountTabIndex();
    this.#ref.markForCheck();
  };

  /** Xoá component theo scope hiện tại (top-level hoặc children của group đang Detail). */
  removeComponent = (id: string) => {
    const g = this.editingGroup();
    if (g) {
      g.components = g.components.filter((t: { id: string }) => t.id !== id);
    } else {
      this.components = this.components.filter((t: { id: string }) => t.id !== id);
    }
    if (this.selectedComponent()?.id === id) this.selectedComponent.set(undefined);
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
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.#syncRowsToComponents();
      // Xử lý kéo chéo giữa các row khi pointer rời khỏi container hiện tại.
      if (!event.isPointerOverContainer) {
        const dragItemId = event.item.element.nativeElement.id;
        if (dragItemId) {
          const dragItem = this.#scope().find((t: { id: string }) => t.id === dragItemId);
          this.xuLyKeoCheo(dragItem);
        }
      }
    } else {
      const drop = event.previousContainer.data[0];
      if (drop && 'symbol' in drop) {
        // transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
        const droppedItem = event.previousContainer.data[event.previousIndex] as FormBuilderComponent;
        const placement = this.#paletteDropPlacement(event.container.data, event.currentIndex, droppedItem);
        this.addComponent(droppedItem, placement.index, placement.columns);
      } else {
        const movedItem = event.previousContainer.data[event.previousIndex] as SdFormGenericComponent | SdFormGenericGroup;
        const targetRow = this.#rowForItems(event.container.data);
        if (targetRow && !canPlaceInRow(targetRow, movedItem, movedItem.id)) {
          this.#notifyService.warning(this.#i18n.t('core.component.form-builder.row-overflow'));
          return;
        }

        transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
        this.#syncRowsToComponents();
      }
    }
    this.#recountTabIndex();
  };

  dragStartComponentItem = (event: any) => {
    void event;
    this.dragSource.set('canvas');
    this.onAnyDragStarted();
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

  isRowFull = (row: DragDropRowItem): boolean => this.#usedColumns(row) >= 12;

  isRowInlineDropLocked = (row: DragDropRowItem): boolean => this.#availableColumns(row) < 2;

  canEnterRowDropList = (
    drag: CdkDrag<FormBuilderComponent | SdFormGenericComponent | SdFormGenericGroup>,
    drop: CdkDropList<(SdFormGenericComponent | SdFormGenericGroup)[]>
  ): boolean => {
    const row = this.#rowForItems(drop.data);
    if (!row) return true;

    const data = drag.data;
    if (!data || this.#isPaletteComponent(data)) return true;
    if ('layout' in data && 'id' in data) {
      return canPlaceInRow(row, data, data.id);
    }

    return true;
  };

  onFocus = (event: FocusEvent) => {
    void event;
  };

  xuLyKeoCheo = (dragItem?: SdFormGenericComponent | SdFormGenericGroup) => {
    if (dragItem && this.targetItem) {
      const result = moveItemToRow(this.dragDropRows, {
        itemId: dragItem.id,
        targetRowId: this.targetItem.id,
      });
      if (result.moved) {
        this.dragDropRows = this.#withRowIndexes(result.rows);
        this.#syncRowsToComponents();
      } else if (result.reason === 'row-overflow') {
        this.#notifyService.warning(this.#i18n.t('core.component.form-builder.row-overflow'));
      }
    }
    this.targetItem = undefined;
  };
  noReturnPredicate = () => {
    return false;
  };

  #recountTabIndex = () => {
    const scope = this.#scope();
    scope.forEach((item, index) => {
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
      sel.layout.row = scope.find(t => t.id === sel.id)?.layout?.row;
    }
    this.#syncComponentsToRows();
  };

  // Hàm xử lý chuyển đổi components (scope hiện tại) -> dragDropRows
  #syncComponentsToRows = () => {
    this.dragDropRows = this.#withRowIndexes(buildFormBuilderRows(this.#scope()));
  };

  #syncRowsToComponents = () => {
    const flat = flattenFormBuilderRows(this.dragDropRows);
    const g = this.editingGroup();
    if (g) {
      g.components = flat as SdFormGenericComponent[];
    } else {
      this.components = flat;
    }
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
    // Clamp + skip-if-unchanged để tránh re-render mỗi pixel mouse di chuyển.
    const newCols = t > 12 ? '12' : t < 2 ? '2' : `${t}`;
    if (item.layout!.columns !== newCols) {
      item.layout!.columns = newCols as any;
    }
    const currentResizeState = this.resizeState();
    if (currentResizeState?.itemId !== item.id || currentResizeState?.columns !== newCols) {
      this.resizeState.set({
        itemId: item.id,
        rowId: currentResizeState?.rowId ?? this.#rowForItems(items)?.id ?? `row-${item.id}`,
        columns: newCols,
      });
      this.#ref.markForCheck();
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

  onChangeViewed = (component: SdFormGenericComponent) => {
    component.properties!.viewed = !component.properties!.viewed;
    // Emit khi có sự thay đổi để control và attribute lắng nghe và render lại
    this.#builderService.componentEmitters.next(component);
  };

  onChangeHidden = (component: SdFormGenericComponent | SdFormGenericGroup) => {
    component.properties!.hidden = !component.properties!.hidden;
    // Emit khi có sự thay đổi để control và attribute lắng nghe và render lại
    this.#builderService.componentEmitters.next(component);
  };

  // Duplicate component nhưng sẽ clear id và key để tránh trùng lặp (theo scope hiện tại)
  onDuplicate = (component: SdFormGenericComponent | SdFormGenericGroup) => {
    const clonedComponent = this.#cloneComponentWithNewIdentity(component);
    const scope = this.#scope();
    scope.push(clonedComponent);
    this.#recountTabIndex();
    const created = scope.find(t => t.id === clonedComponent.id);
    this.selectedComponent.set(created);
    this.selectComponent(created);
    this.#ref.markForCheck();
  };

  // Copy form hiện tại
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

  // Chìa ra cho bên ngoài lấy components hiện tại
  getComponents = (): (SdFormGenericComponent | SdFormGenericGroup)[] => {
    this.#syncRowsToComponents();
    return JSON.parse(JSON.stringify(this.components || []));
  };

  // Chìa ra cho bên ngoài lấy variables hiện tại
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

  #withRowIndexes = (rows: FormBuilderLayoutRow[]): DragDropRowItem[] => {
    return rows.map((row, index) => ({
      ...row,
      rowIndex: index,
    }));
  };

  #rowForItems = (items: any[]): DragDropRowItem | undefined => {
    return this.dragDropRows.find(row => row.items === items);
  };

  #isPaletteComponent = (item: unknown): item is FormBuilderComponent => {
    return !!item && typeof item === 'object' && 'symbol' in item && 'type' in item;
  };

  #usedColumns = (row: DragDropRowItem): number => {
    return row.items.reduce((sum, item) => sum + +(item.layout?.columns || 12), 0);
  };

  #availableColumns = (row: DragDropRowItem): number => {
    return Math.max(0, 12 - this.#usedColumns(row));
  };

  #scopeIndexAfterRow = (row: DragDropRowItem): number => {
    const scope = this.#scope();
    const lastItem = row.items[row.items.length - 1];
    const lastIndex = lastItem ? scope.findIndex(component => component.id === lastItem.id) : -1;
    return lastIndex >= 0 ? lastIndex + 1 : scope.length;
  };

  #paletteDropPlacement = (
    containerData: any[],
    currentIndex: number,
    item: FormBuilderComponent
  ): { index?: number; columns?: string } => {
    const row = this.#rowForItems(containerData);
    if (!row || item.type === 'break') {
      return { index: this.#scopeIndexFromDrop(containerData, currentIndex) };
    }

    const availableColumns = this.#availableColumns(row);
    if (availableColumns >= 2) {
      return {
        index: this.#scopeIndexFromDrop(containerData, currentIndex),
        columns: `${availableColumns}`,
      };
    }

    return { index: this.#scopeIndexAfterRow(row), columns: '12' };
  };

  #scopeIndexFromDrop = (containerData: any[], currentIndex: number): number | undefined => {
    const scope = this.#scope();
    const row = this.#rowForItems(containerData);
    if (row) {
      const anchor = row.items[currentIndex] ?? row.items[row.items.length - 1];
      if (!anchor) return scope.length;

      const anchorIndex = scope.findIndex(component => component.id === anchor.id);
      if (anchorIndex < 0) return scope.length;
      return currentIndex >= row.items.length ? anchorIndex + 1 : anchorIndex;
    }

    if (containerData === this.dragDropRows) {
      const rowAtIndex = this.dragDropRows[currentIndex];
      const anchor = rowAtIndex?.items[0];
      if (!anchor) return scope.length;

      const anchorIndex = scope.findIndex(component => component.id === anchor.id);
      return anchorIndex >= 0 ? anchorIndex : scope.length;
    }

    return undefined;
  };

  #cloneComponentWithNewIdentity = <T extends SdFormGenericComponent | SdFormGenericGroup>(component: T): T => {
    const clonedComponent = JSON.parse(JSON.stringify(component)) as T;
    this.#regenerateComponentIdentity(clonedComponent);
    return clonedComponent;
  };

  #regenerateComponentIdentity = (component: SdFormGenericComponent | SdFormGenericGroup) => {
    component.id = GenerateId();
    if (component.type === 'group') {
      component.components = component.components.map(child => this.#cloneComponentWithNewIdentity(child));
      return;
    }

    component.key = GenerateKey();
  };
}
