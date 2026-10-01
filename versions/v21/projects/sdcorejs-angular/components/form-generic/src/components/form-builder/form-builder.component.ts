import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  model,
  NgZone,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { SdButton, SdButtonItem, SdButtonItemDivider } from '@sdcorejs/angular/components/button';
import { SdCodeEditor } from '@sdcorejs/angular/components/code-editor';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { Subscription } from 'rxjs';
import { Utilities } from '@sdcorejs/utils/fns';
import { SD_FORM_GENERIC_RESERVED_KEYS } from '../../models/form-generic-schema';
import type { SdFormGenericSchema, SdFormGenericValidation, SdFormGenericVariable } from '../../models/form-generic-schema.model';
import { sdFindKeyReferences } from '../../rules/form-generic-references';
import { CanvasComponent } from './canvas/canvas.component';
import { ConfigureValidationComponent } from './components/configure-validation/configure-validation.component';
import { InspectorComponent } from './inspector/inspector.component';
import { PaletteComponent } from './palette/palette.component';
import { PreviewComponent } from './preview/preview.component';
import {
  cloneJson,
  collectKeys,
  documentFromSchema,
  documentToSchema,
  isGroup,
  sameDocumentContent,
  SD_FORM_BUILDER_KEY_PATTERN,
} from './state/builder-document';
import { BuilderDragService } from './state/builder-drag';
import { escapeHtml } from './state/builder-html';
import { BuilderMode, BuilderViewport, FormBuilderStore } from './state/builder-store';

interface VariableDraft {
  /** Id cục bộ của dòng trong dialog (không lưu vào schema). */
  id: string;
  key: string;
  label: string;
  /** Biến gốc (nếu có) — giữ các thuộc tính khác của consumer khi lưu. */
  source?: SdFormGenericVariable;
}

/** Bề rộng (px) của builder dưới ngưỡng này thì palette/inspector thành panel nổi bật/tắt được. */
const COMPACT_WIDTH = 900;

let nextBuilderId = 0;

/** Thời gian (ms) thông báo "Đã xoá" còn cho bấm Hoàn tác. */
const UNDO_REMOVE_MS = 5000;

const isEditableTarget = (target: EventTarget | null): boolean => {
  const element = target as HTMLElement | null;
  if (!element) return false;
  if (element.isContentEditable) return true;
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
};

/**
 * `<sd-form-builder>` — trình thiết kế form NHÚNG trong Core UI (không phải ứng dụng riêng: không
 * header ứng dụng, không lưu/nháp/xuất bản — persistence thuộc consumer).
 *
 * Bố cục: toolbar nội bộ `[Thiết kế | Xem trước | Schema] [Desktop | Tablet | Mobile] [Hoàn tác |
 * Làm lại | Công cụ]`, dưới là Thành phần/Cấu trúc · Canvas · Thuộc tính. Chiều cao do host quyết định.
 * Viewport chọn mức bố cục đang thiết kế: resize và tab Bố cục ghi span của mức đó.
 *
 * State: schema chuẩn duy nhất trong `FormBuilderStore` (một instance/builder); mọi chỉnh sửa là
 * command có undo. Input của consumer không bao giờ bị mutate.
 */
@Component({
  selector: 'sd-form-builder',
  templateUrl: './form-builder.component.html',
  styleUrl: './form-builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FormBuilderStore, BuilderDragService],
  host: {
    class: 'sd-form-builder',
    '[class.sd-form-builder--compact]': 'compact()',
    '(keydown)': 'onKeydown($event)',
  },
  imports: [
    PaletteComponent,
    CanvasComponent,
    InspectorComponent,
    PreviewComponent,
    ConfigureValidationComponent,
    SdButton,
    SdButtonItem,
    SdButtonItemDivider,
    SdCodeEditor,
    SdIcon,
    SdInput,
    SdModal,
    SdTranslatePipe,
  ],
})
export class SdFormBuilder {
  readonly store = inject(FormBuilderStore);
  readonly #drag = inject(BuilderDragService);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #zone = inject(NgZone);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #injector = inject(Injector);

  /**
   * Schema của builder — `[(schema)]`. Mỗi tham chiếu MỚI có nội dung khác schema hiện tại = nạp form
   * khác: reset lịch sử undo và selection. Nhận lại đúng schema vừa phát, hoặc tham chiếu mới nhưng
   * CÙNG nội dung (vd consumer lưu rồi truyền lại), bị bỏ qua — không reset, không vòng lặp.
   *
   * Builder phát snapshot (bản clone độc lập) sau MỖI thay đổi do người dùng — kể cả hoàn tác/làm lại;
   * không phát khi nạp schema, khi đổi selection/mode/viewport. Input không bao giờ bị mutate; sửa
   * object tại chỗ sẽ KHÔNG nạp lại — hãy truyền object mới.
   */
  readonly schema = model<SdFormGenericSchema | undefined>(undefined);

  readonly canvas = viewChild(CanvasComponent);
  readonly palette = viewChild(PaletteComponent);
  readonly validationDialog = viewChild(ConfigureValidationComponent);
  readonly variablesModal = viewChild<SdModal>('variablesModal');
  readonly shortcutsModal = viewChild<SdModal>('shortcutsModal');

  /** Container hẹp → palette/inspector thành panel nổi. */
  readonly compact = signal(false);
  readonly leftOpen = signal(false);
  readonly rightOpen = signal(false);
  readonly #uid = `sd-form-builder-${++nextBuilderId}`;
  /** Id của hai panel — nút mở trỏ tới qua `aria-controls`. */
  protected readonly leftPanelId = `${this.#uid}-left`;
  protected readonly rightPanelId = `${this.#uid}-right`;
  // why: signal queries cannot live on ES `#private` members (NG1053); protected keeps them off the public API.
  protected readonly leftToggle = viewChild<ElementRef<HTMLButtonElement>>('leftToggle');
  protected readonly rightToggle = viewChild<ElementRef<HTMLButtonElement>>('rightToggle');

  readonly modes: readonly BuilderMode[] = ['design', 'preview', 'schema'];
  readonly viewports: readonly BuilderViewport[] = ['desktop', 'tablet', 'mobile'];
  readonly modeIcons: Record<BuilderMode, string> = { design: 'edit', preview: 'visibility', schema: 'data_object' };
  readonly viewportIcons: Record<BuilderViewport, string> = { desktop: 'desktop_windows', tablet: 'tablet_mac', mobile: 'smartphone' };

  readonly isDesign = computed(() => this.store.mode() === 'design');
  readonly schemaText = computed(() => (this.store.mode() === 'schema' ? JSON.stringify(documentToSchema(this.store.doc()), null, 2) : ''));

  readonly variableDrafts = signal<VariableDraft[]>([]);
  readonly variableErrors = computed(() => {
    const drafts = this.variableDrafts();
    const fieldKeys = collectKeys({ ...this.store.doc(), variables: [] });
    const counts = new Map<string, number>();
    for (const draft of drafts) counts.set(draft.key.trim(), (counts.get(draft.key.trim()) ?? 0) + 1);
    return drafts.map(draft => {
      const key = draft.key.trim();
      if (!key) return this.store.t('core.component.form-builder.key.empty');
      if (!SD_FORM_BUILDER_KEY_PATTERN.test(key)) return this.store.t('core.component.form-builder.key.invalid');
      if (SD_FORM_GENERIC_RESERVED_KEYS.has(key)) return this.store.t('core.component.form-builder.key.reserved');
      if ((counts.get(key) ?? 0) > 1) return this.store.t('core.component.form-builder.variable.duplicate');
      if (fieldKeys.has(key)) return this.store.t('core.component.form-builder.variable.conflict');
      return '';
    });
  });
  readonly variablesInvalid = computed(() => this.variableErrors().some(Boolean));

  #lastEmitted?: SdFormGenericSchema;
  #loaded = false;

  constructor() {
    effect(() => {
      const incoming = this.schema();
      untracked(() => this.#receive(incoming));
    });
    const subscription = this.store.changes.subscribe(doc => {
      const snapshot = documentToSchema(doc);
      this.#lastEmitted = snapshot;
      this.schema.set(snapshot);
    });
    // why: after a delete or ungroup focus goes back to the canvas. In compact mode the overlay panel the
    // action came from is closed first, so the focused card is not hidden under the panel or the scrim.
    effect(() => {
      const request = this.store.focusRequest();
      if (!request) return;
      untracked(() => {
        this.store.focusRequest.set(null);
        if (this.compact()) {
          this.leftOpen.set(false);
          this.rightOpen.set(false);
        }
        this.canvas()?.focusItem(request.id);
      });
    });
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      subscription.unsubscribe();
      this.#undoRemove?.release();
    });
    afterNextRender(() => {
      const observer = new ResizeObserver(entries => {
        const width = entries[0]?.contentRect.width ?? this.#host.nativeElement.clientWidth;
        const compact = width > 0 && width < COMPACT_WIDTH;
        if (compact !== this.compact()) this.compact.set(compact);
      });
      observer.observe(this.#host.nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  // ── API công khai ───────────────────────────────────────────────────────────

  /** Snapshot schema hiện tại (bản clone độc lập, sửa thoải mái không ảnh hưởng builder). */
  getSchema = (): SdFormGenericSchema => documentToSchema(this.store.doc());

  // ── Toolbar ─────────────────────────────────────────────────────────────────

  setMode(mode: BuilderMode): void {
    this.#drag.cancel();
    this.store.setMode(mode);
    this.leftOpen.set(false);
    this.rightOpen.set(false);
  }

  setViewport(viewport: BuilderViewport): void {
    this.store.viewport.set(viewport);
  }

  /** Phím của radiogroup (APG): ←/↑ lùi, →/↓ tiến (vòng), Home/End về đầu/cuối. */
  onSegmentKeydown(event: KeyboardEvent, values: readonly string[], current: string, apply: (value: string) => void): void {
    const index = values.indexOf(current);
    const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: values.length - 1, ArrowUp: values.length - 1 };
    const next =
      event.key === 'Home'
        ? values[0]
        : event.key === 'End'
          ? values[values.length - 1]
          : event.key in step
            ? values[(index + step[event.key]) % values.length]
            : undefined;
    if (next === undefined) return;
    event.preventDefault();
    apply(next);
    const group = event.currentTarget as HTMLElement | null;
    queueMicrotask(() => group?.querySelector<HTMLElement>(`[data-value="${next}"]`)?.focus());
  }

  applyMode = (value: string) => this.setMode(value as BuilderMode);
  applyViewport = (value: string) => this.setViewport(value as BuilderViewport);

  undo(): void {
    this.store.undo();
  }

  redo(): void {
    this.store.redo();
  }

  /** Phím tắt trong phạm vi builder (không bắt toàn trang). Ô nhập giữ undo gõ chữ của trình duyệt. */
  onKeydown(event: KeyboardEvent): void {
    if (!this.isDesign() || this.#drag.active) return;
    if (event.key === 'Escape' && this.compact() && (this.leftOpen() || this.rightOpen())) {
      // why: Escape belongs to an open popup first. MatSelect keeps focus on its trigger (aria-expanded) and
      // closes only later, from the overlay's document listener — this handler would otherwise close the panel too.
      const target = event.target as HTMLElement | null;
      if (event.defaultPrevented || target?.closest('[aria-expanded="true"]:not(.fb-panel-toggle)')) return;
      event.preventDefault();
      this.#closePanels();
      return;
    }
    const modifier = event.ctrlKey || event.metaKey;
    if (!modifier || event.altKey) return;
    const key = event.key.toLowerCase();
    const isUndo = key === 'z' && !event.shiftKey;
    const isRedo = (key === 'z' && event.shiftKey) || key === 'y';
    if (!isUndo && !isRedo) return;
    if (isEditableTarget(event.target)) return;
    event.preventDefault();
    if (isUndo) this.store.undo();
    else this.store.redo();
  }

  // ── Panel & điều hướng ──────────────────────────────────────────────────────

  focusPalette(): void {
    if (this.compact()) this.leftOpen.set(true);
    this.palette()?.focusSearch();
  }

  /** Mở/đóng panel nổi (builder hẹp). Mở thì focus vào panel; Esc đóng và trả focus về nút. */
  protected togglePanel(side: 'left' | 'right'): void {
    const open = !(side === 'left' ? this.leftOpen() : this.rightOpen());
    this.leftOpen.set(open && side === 'left');
    this.rightOpen.set(open && side === 'right');
    if (!open) return;
    // why: the left panel keeps its tab — only the Components tab starts in its search box.
    if (side === 'left' && this.store.leftTab() === 'components') this.palette()?.focusSearch();
    else this.#focusIn(side === 'left' ? this.leftPanelId : this.rightPanelId);
  }

  /** Focus trong panel sau lần render kế tiếp: tab đang chọn (roving tablist), không có thì control đầu tiên trong tab order. */
  #focusIn(panelId: string): void {
    afterNextRender(
      () => {
        const panel = this.#host.nativeElement.querySelector<HTMLElement>(`#${panelId}`);
        const target =
          panel?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]') ??
          panel?.querySelector<HTMLElement>(':is(button, input, textarea, [tabindex="0"]):not([disabled]):not([tabindex="-1"])');
        target?.focus();
      },
      { injector: this.#injector }
    );
  }

  #closePanels(): void {
    const toggle = this.leftOpen() ? this.leftToggle() : this.rightToggle();
    this.leftOpen.set(false);
    this.rightOpen.set(false);
    toggle?.nativeElement.focus();
  }

  onItemAdded(id: string): void {
    // why: in compact mode the palette closes over the new field — move focus to it instead of losing it.
    this.canvas()?.scrollToItem(id, this.compact());
    if (this.compact()) this.leftOpen.set(false);
  }

  onItemFocused(id: string): void {
    this.canvas()?.scrollToItem(id, true);
    if (this.compact()) this.leftOpen.set(false);
  }

  /** Xoá — hỏi xác nhận khi có nơi khác phụ thuộc vào field, hoặc group còn field con. */
  async remove(id: string): Promise<void> {
    const location = this.store.index().get(id);
    if (!location) return;
    const item = location.item;
    const label = this.store.labelOf(item);
    const childCount = isGroup(item) ? (item.elements ?? []).length : 0;
    const dependents = this.store.dependentsOf(id);
    if (childCount || dependents.length) {
      // why: the confirm renders its message as HTML — a label is user text, never markup.
      const safeLabel = escapeHtml(label);
      const message = childCount
        ? this.store.t('core.component.form-builder.confirm.delete-group', { label: safeLabel, count: childCount })
        : this.store.t('core.component.form-builder.confirm.delete-referenced', { label: safeLabel, count: dependents.length });
      try {
        await this.#confirm.confirm(message, {
          title: this.store.t('core.component.form-builder.confirm.delete-title'),
          yesTitle: this.store.t('core.component.form-builder.delete'),
          noTitle: this.store.t('core.component.form-builder.cancel'),
          yesButtonColor: 'error',
        });
      } catch {
        return;
      }
    }
    if (this.store.remove(id)) this.#offerUndoRemove(id, label);
  }

  /** Toast đang mở của lần xoá gần nhất + cách gỡ nó. */
  #undoRemove: { readonly toastId?: string; readonly release: () => void } | undefined = undefined;

  /**
   * Toast "Đã xoá …" trong {@link UNDO_REMOVE_MS} kèm Hoàn tác.
   *
   * why: Hoàn tác trong toast chỉ được huỷ ĐÚNG lần xoá đó. Ngay khi schema đổi vì thao tác khác
   * (sửa tiếp, hoàn tác bằng phím, xoá thêm) toast bị gỡ — bấm vào lúc ấy sẽ huỷ nhầm thao tác sau.
   */
  #offerUndoRemove(id: string, label: string): void {
    this.#undoRemove?.release();
    const removedDoc = this.store.doc();
    // why: no escaping here — the toast renders plain text unless `html: true` is passed.
    const message = this.store.t('core.component.form-builder.announce.removed', { label });
    const undo = () => {
      const pending = this.#undoRemove;
      if (this.store.doc() !== removedDoc || !this.store.undo()) return;
      this.store.select(id);
      pending?.release();
    };
    this.#notify.success(message, {
      duration: UNDO_REMOVE_MS,
      actionLabel: this.store.t('core.component.form-builder.undo'),
      onAction: undo,
    });
    // why: toast mới nhất nằm đầu danh sách (success/info không bị gom như warning/error).
    const toast = this.#notify.toasts()[0];
    const toastId = toast?.onAction === undo ? toast.id : undefined;
    const cleanup: { subscription?: Subscription; timer?: ReturnType<typeof setTimeout> } = {};
    const state = {
      toastId,
      release: () => {
        cleanup.subscription?.unsubscribe();
        clearTimeout(cleanup.timer);
        if (toastId) this.#notify.remove(toastId);
        if (this.#undoRemove === state) this.#undoRemove = undefined;
      },
    };
    this.#undoRemove = state;
    cleanup.subscription = this.store.changes.subscribe(doc => {
      if (doc !== removedDoc) state.release();
    });
    // why: toast tự đóng sau thời hạn; dọn subscription dù người dùng không làm gì thêm. Chạy ngoài
    // zone để một lần xoá không giữ ứng dụng "chưa ổn định" (whenStable/Testability) thêm vài giây.
    cleanup.timer = this.#zone.runOutsideAngular(() => setTimeout(state.release, UNDO_REMOVE_MS + 1000));
  }

  // ── Công cụ: biến, xác thực cấp form, phím tắt ─────────────────────────────

  openVariables(): void {
    this.variableDrafts.set(
      this.store.doc().variables.map(variable => ({
        id: Utilities.randomId(),
        key: variable.key ?? '',
        label: variable.label ?? '',
        source: variable,
      }))
    );
    this.variablesModal()?.open();
  }

  addVariable(): void {
    this.variableDrafts.update(drafts => [...drafts, { id: Utilities.randomId(), key: '', label: '' }]);
  }

  updateVariable(index: number, field: 'key' | 'label', value: string): void {
    this.variableDrafts.update(drafts =>
      drafts.map((draft, position) => (position === index ? { ...draft, [field]: value ?? '' } : draft))
    );
  }

  removeVariable(index: number): void {
    this.variableDrafts.update(drafts => drafts.filter((_, position) => position !== index));
  }

  /**
   * Lưu dialog Biến. Đổi key biến kéo theo mọi tham chiếu có cấu trúc (như đổi mã field); bỏ một biến
   * còn được dùng thì hỏi trước, vì các điều kiện/tham số đó sẽ không còn đúng.
   */
  async saveVariables(): Promise<void> {
    if (this.variablesInvalid() || this.#savingVariables) return;
    // why: giữ nguyên thuộc tính khác của biến cũ (nếu consumer có thêm), chỉ cập nhật key/label —
    // lấy theo tham chiếu biến gốc của từng dòng (biến không có id cũng không mất dữ liệu).
    const edits = this.variableDrafts().map(draft => ({ source: draft.source, key: draft.key.trim(), label: draft.label }));
    const doc = this.store.doc();
    const schema = documentToSchema(doc);
    const referenced = doc.variables
      .filter(variable => variable.key && !edits.some(edit => edit.source === variable))
      .map(variable => ({ label: variable.label || variable.key, count: sdFindKeyReferences(schema, variable.key).length }))
      .filter(entry => entry.count > 0);
    if (referenced.length) {
      this.#savingVariables = true;
      try {
        await this.#confirm.confirm(
          this.store.t('core.component.form-builder.confirm.delete-referenced', {
            label: referenced.map(entry => escapeHtml(entry.label)).join(', '),
            count: referenced.reduce((sum, entry) => sum + entry.count, 0),
          }),
          {
            title: this.store.t('core.component.form-builder.confirm.delete-title'),
            yesTitle: this.store.t('core.component.form-builder.delete'),
            noTitle: this.store.t('core.component.form-builder.cancel'),
            yesButtonColor: 'error',
          }
        );
      } catch {
        return;
      } finally {
        this.#savingVariables = false;
      }
    }
    this.store.saveVariables(edits);
    this.variablesModal()?.close();
  }

  #savingVariables = false;

  openValidations(): void {
    const doc = this.store.doc();
    this.validationDialog()?.open(doc.elements, doc.variables, doc.validations);
  }

  onValidationsAccepted(validations: SdFormGenericValidation[]): void {
    this.store.setValidations(cloneJson(validations ?? []));
  }

  openShortcuts(): void {
    this.shortcutsModal()?.open();
  }

  #receive(incoming: SdFormGenericSchema | undefined): void {
    if (incoming && incoming === this.#lastEmitted) return;
    const doc = documentFromSchema(incoming);
    if (this.#loaded && sameDocumentContent(doc, this.store.doc())) return;
    this.#loaded = true;
    // why: once another form is loaded, the snapshot emitted for the previous one is no longer an echo —
    // binding it again must load it back, not be skipped.
    this.#lastEmitted = undefined;
    this.#drag.cancel();
    this.store.load(doc);
  }
}
