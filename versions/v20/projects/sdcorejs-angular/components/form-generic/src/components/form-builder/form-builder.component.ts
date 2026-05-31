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

  /** Signal toàn cục: TRUE khi BẤT KỲ cdkDrag nào đang active (palette, canvas, group, resize).
   *  Trigger class `.fb-shell--dragging` để ẩn hover/actions/resize toàn diện, không phụ thuộc :has(). */
  readonly isAnyDragging = signal(false);

  expand = true;
  dragDropRows: DragDropRowItem[] = [];
  isDragging = false;
  targetItem?: DragDropRowItem = undefined;
  private lastDragPointer?: { x: number; y: number };

  /** Handler chung cho mọi cdkDragStarted — set signal global true. */
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

  /** Handler chung cho mọi cdkDragEnded — set signal global false (dùng setTimeout 0
   *  để chờ CDK xử lý xong drop event trước khi UI re-enable). */
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

  addComponent = (item: FormBuilderComponent, index?: number) => {
    const id = GenerateId();
    let newComponent: SdFormGenericComponent | SdFormGenericGroup;
    if (item.type === 'group') {
      // Group là layout container, không có key/validate; có nested components[] + properties{icon,color}.
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

  /** Nested drop handler — when dragging a palette item or canvas item INTO a group body. */
  dropInGroup = (event: CdkDragDrop<any[]>, group: SdFormGenericGroup) => {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }
    const dropped = event.previousContainer.data[event.previousIndex];
    if (dropped && 'symbol' in dropped) {
      // Palette → group: tạo component mới rồi push vào group.components.
      const item = dropped as FormBuilderComponent;
      if (item.type === 'group') {
        this.#notifyService.warning('Group lồng group chưa được hỗ trợ.');
        return;
      }
      const newComponent = this.#createComponentFromPalette(item) as SdFormGenericComponent;
      group.components.splice(event.currentIndex, 0, newComponent);
      this.selectedComponent.set(newComponent);
      this.#ref.markForCheck();
    } else {
      // Canvas → group: chuyển instance hiện có.
      const component = dropped as SdFormGenericComponent | SdFormGenericGroup;
      if (component.type === 'group') {
        this.#notifyService.warning('Group lồng group chưa được hỗ trợ.');
        return;
      }
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      this.#syncRowsToComponents();
    }
  };

  /** Quick-add break sau row chỉ định.
   *  Tính component index cuối cùng của row đó trong this.components, splice break vào sau.
   *  Không qua palette — chỉ là utility action bám theo row trên canvas.
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
      // xử lý kéo chéo
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

  // Mouseover thì phải có Focus không thì thẻ sẽ báo lỗi
  onFocus = (event: FocusEvent) => {
    //console.log(event);
  };

  xuLyKeoCheo = (dragItem?: SdFormGenericComponent | SdFormGenericGroup) => {
    if (dragItem) {
      if (this.targetItem) {
        // kiểm tra target đã full column chưa?
        const totalColumnInRow = this.targetItem.items.map(t => +t.layout!.columns || 12).reduce((acc, curr) => acc + curr, 0);
        if (totalColumnInRow + +dragItem.layout!.columns <= 12) {
          // xóa vị trí cũ
          this.dragDropRows.forEach(t => {
            if (t.items.some((k: { id: any }) => k.id === dragItem.id)) {
              t.items = t.items.filter((k: { id: any }) => k.id !== dragItem.id) || [];
            }
          });
          // thêm vào vị trí mới
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
    // Tránh dùng map vì nó sẽ sinh ra reference mới
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

  // Hàm xử lý chuyển đổi components -> dragDropRows
  // Dựa vào columns của component để quyết định dragDropRows có bao nhiêu items trên row, đảm bảo columns tổng số items <= 12
  #syncComponentsToRows = () => {
    this.dragDropRows = [];
    for (const component of this.components) {
      // lấy dòng cuối cùng của dragDropList
      let lastRow: DragDropRowItem = { rowIndex: this.dragDropRows.length, items: [] };
      if (this.dragDropRows.length) {
        lastRow = this.dragDropRows[this.dragDropRows.length - 1];
      } else {
        this.dragDropRows.push(lastRow);
      }
      // tính tổng cột trên 1 dòng
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

  // Hàm xử lý chuyển đổi dragDropRows -> components
  // Vì khi kéo thả sẽ thay đổi vị trí, do đó cần sắp xếp lại components
  #syncRowsToComponents = () => {
    // rải data ma trận droplist => schema.components
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
        this.#notifyService.warning('Group lồng group chưa được hỗ trợ.');
        return true;
      }
      const created = this.#createComponentFromPalette(paletteItem) as SdFormGenericComponent;
      group.components.push(created);
      this.selectedComponent.set(created);
    } else {
      if (!('type' in dropped)) return false;
      const component = dropped as SdFormGenericComponent | SdFormGenericGroup;
      if (component.type === 'group') {
        this.#notifyService.warning('Group lồng group chưa được hỗ trợ.');
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
    // Clamp + skip-if-unchanged để tránh re-render mỗi pixel mouse di chuyển.
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
   *  Math: lấy bounding của chính item, tính (mouse.x - item.left) / colWidth = newCols.
   *  Cách này đúng cho cả flex-wrap (item ở wrap row 2+) vì dùng item-relative,
   *  không phải sum-of-all-preceding-cols (sai khi item wrap xuống row mới).
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
    // Width của 1 col trong group body (loại trừ padding nếu có).
    const bodyStyle = getComputedStyle(bodyEl);
    const padL = parseFloat(bodyStyle.paddingLeft) || 0;
    const padR = parseFloat(bodyStyle.paddingRight) || 0;
    const colWidth = (bodyRect.width - padL - padR) / 12;
    if (colWidth <= 0) return;

    // Mới: new right edge = mouse.x; new width = mouse.x - child.left
    const newWidth = event.pointerPosition.x - childRect.left;
    let newCols = Math.round(newWidth / colWidth);
    if (newCols < 2) newCols = 2;
    if (newCols > 12) newCols = 12;
    child.layout!.columns = `${newCols}` as any;
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

  // Duplicate component nhưng sẽ clear id và key để tránh trùng lặp
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
}
