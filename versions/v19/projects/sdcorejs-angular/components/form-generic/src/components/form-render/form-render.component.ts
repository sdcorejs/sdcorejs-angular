import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  isDevMode,
  model,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdInform } from '@sdcorejs/angular/components/inform';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';
import { SdStep, SdStepper } from '@sdcorejs/angular/components/stepper';
import type { SdLabelPlacement } from '@sdcorejs/angular/forms/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import { firstValueFrom, race, timer } from 'rxjs';
import type { SdFormGenericBreakpoint } from '../../configurations/form-generic-breakpoints';
import { SD_FORM_GENERIC_CONFIG } from '../../configurations/form-generic-config.token';
import { sdEffectiveBreakpoint, sdPackRows, type SdFormGenericLayoutRow } from '../../layout/form-generic-layout';
import type { SdFormGenericField, SdFormGenericLayout } from '../../models/form-generic-field.model';
import { SD_FORM_GENERIC_RESERVED_KEYS, sdIsField, sdIsGroup, sdNormalizeSchema } from '../../models/form-generic-schema';
import type {
  SdFormGenericGroup,
  SdFormGenericPage,
  SdFormGenericPageElement,
  SdFormGenericSchema,
} from '../../models/form-generic-schema.model';
import { sdElementState, sdFilterFieldTypes, sdFormScope, type SdFormGenericElementState } from '../../rules/form-generic-filter';
import { sdRunFormValidations, type SdFormGenericValidationResult } from '../../rules/form-generic-validation';
import { sdApplyDefaults } from '../../rules/form-generic-values';
import { LibItemComponent } from './components';
import { FormRenderCatalog } from './form-render-catalog';
import { FormRenderContext } from './form-render.context';

interface FieldNode {
  kind: 'field';
  id: string;
  type: string;
  layout?: SdFormGenericLayout;
  field: SdFormGenericField;
  state: SdFormGenericElementState;
}

interface GroupNode {
  kind: 'group';
  id: string;
  type: 'group';
  layout?: undefined;
  group: SdFormGenericGroup;
  rows: SdFormGenericLayoutRow<FieldNode>[];
}

type RenderNode = FieldNode | GroupNode;

/** Chu kỳ (ms) kiểm tra lại `pending` khi chờ validator bất đồng bộ trong `validate()`. */
const PENDING_POLL_MS = 20;
let nextRenderId = 0;

/** Ô của lưới CSS 12 cột: hàng (1-based) và cột (`start / span n`) lấy từ `sdPackRows`. */
interface FieldCell {
  kind: 'field';
  id: string;
  row: number;
  column: string;
  field: SdFormGenericField;
  state: SdFormGenericElementState;
}

interface GroupCell {
  kind: 'group';
  id: string;
  row: number;
  column: string;
  group: SdFormGenericGroup;
  children: FieldCell[];
}

type RenderCell = FieldCell | GroupCell;

/**
 * Đặt từng phần tử của hàng vào lưới: hàng `i` → `grid-row: i + 1`, cột bắt đầu sau các ô đứng trước.
 *
 * why: DOM phẳng (một `@for` theo id) thay cho hàng lồng nhau. Với hàng lồng nhau, một field đổi hàng
 * (đổi mức bố cục, field khác ẩn/hiện) bị huỷ rồi tạo lại: mất focus/trạng thái đang nhập và control
 * mới đăng ký trùng tên trước khi control cũ gỡ ra khỏi FormGroup.
 */
const placeCells = <T extends { id: string }>(rows: SdFormGenericLayoutRow<T>[]): { node: T; row: number; column: string }[] =>
  rows.flatMap((row, index) => {
    let start = 1;
    return row.map(cell => {
      const column = `${start} / span ${cell.span}`;
      start += cell.span;
      return { node: cell.element, row: index + 1, column };
    });
  });

const fieldCell = ({ node, row, column }: { node: FieldNode; row: number; column: string }): FieldCell => ({
  kind: 'field',
  id: node.id,
  row,
  column,
  field: node.field,
  state: node.state,
});

@Component({
  selector: 'sd-form-render',
  templateUrl: './form-render.component.html',
  styleUrl: './form-render.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdSection, SdButton, SdInform, SdTab, SdTabGroup, SdStep, SdStepper, NgTemplateOutlet, LibItemComponent],
  providers: [FormRenderContext, FormRenderCatalog],
})
export class SdFormRender {
  /** Schema form (không bị sửa). */
  readonly schema = input.required<SdFormGenericSchema>();
  /** Giá trị form; mỗi thay đổi phát object MỚI, object cũ của consumer không bị sửa. */
  readonly value = model<Record<string, unknown>>({});
  /** FormGroup của consumer; không truyền thì renderer dùng FormGroup riêng. */
  readonly form = input<FormGroup | null>(null);
  /** Biến do consumer cấp; dùng trong điều kiện, value ref và hyperlink. */
  readonly variables = input<Record<string, unknown> | null>(null);
  readonly viewed = input(false, { transform: booleanAttribute });
  /** Ép mức bố cục (vd Xem trước của builder); `null` = đo theo bề rộng form. */
  readonly breakpoint = input<SdFormGenericBreakpoint | null>(null);
  /** Vị trí nhãn của mọi control (mặc định nhãn rời phía trên). */
  readonly labelPlacement = input<SdLabelPlacement>('top');
  /** Chỉ render field có key trong danh sách; `null` = mọi field. */
  readonly keys = input<readonly string[] | null>(null);
  /** Active visible page. Consumer forward writes use the same linear gate as Next/header clicks. */
  readonly activePageId = model<string | null>(null);
  /** A forward transition is waiting for predecessor validators; backward navigation remains available. */
  readonly navigationPending = signal(false);
  protected readonly navigationTip = signal(false);
  #pendingNavigationSnapshot: unknown[] | null = null;
  readonly effectivePageId = signal<string | null>(null);
  readonly focusedPageId = signal<string | null>(null);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #renderId = `sd-form-pages-${++nextRenderId}`;
  #revision = 0;
  #pageRevision = 0;
  #validationAttempt = 0;
  #alive = true;
  #initialized = false;
  #pageOrder: string[] = [];

  readonly #config = inject(SD_FORM_GENERIC_CONFIG);
  readonly #i18n = inject(I18nService);
  readonly #ownForm = new FormGroup({});
  readonly #width = signal(0);
  readonly #warnedTypes = new Set<string>();
  readonly #warnedKeys = new Set<string>();
  // why: signal queries cannot live on ES `#private` members (NG1053).
  private readonly grid = viewChild<ElementRef<HTMLElement>>('grid');
  private readonly items = viewChildren(LibItemComponent);
  private readonly pageTabs = viewChild(SdTabGroup);
  private readonly pageStepper = viewChild(SdStepper);

  readonly formGroup = computed<FormGroup>(() => this.form() ?? this.#ownForm);
  readonly normalized = computed(() => sdNormalizeSchema(this.schema()));
  readonly #fieldTypes = computed(() => sdFilterFieldTypes(this.normalized()));
  readonly #variables = computed(() => this.variables() ?? {});
  readonly #value = computed<Readonly<Record<string, unknown>>>(() => this.value() ?? {});
  readonly scope = computed(() => sdFormScope(this.#value(), this.#variables()));
  /** Mức bố cục hiện hành. */
  readonly level = computed(() => sdEffectiveBreakpoint(this.breakpoint(), this.#width(), this.#config.breakpoints));
  readonly #keySet = computed(() => {
    const keys = this.keys();
    return keys ? new Set(keys) : null;
  });
  readonly navigation = computed(() => this.normalized().navigation);
  readonly visiblePages = computed(() => {
    const schema = this.normalized();
    return schema.navigation
      ? schema.pages.filter(page => sdElementState(page, this.scope(), this.#fieldTypes()).visible)
      : schema.pages.slice(0, 1);
  });
  readonly activeIndex = computed(() => this.visiblePages().findIndex(page => page.id === this.effectivePageId()));
  /** Eager page regions retain visible controls even before a page is visited. */
  readonly pageRegions = computed(() => this.visiblePages().map(page => ({ page, cells: this.#cellsFor(page.elements) })));
  /** Legacy first-page layout; navigation regions each pack their own page. */
  readonly rows = computed(() => this.#pack(this.normalized().pages[0]?.elements ?? []));
  /** Ô của lưới theo thứ tự tài liệu (DOM phẳng, vị trí từ `rows`). */
  readonly cells = computed<RenderCell[]>(() => this.#cellsFor(this.normalized().pages[0]?.elements ?? []));

  #cellsFor(elements: readonly SdFormGenericPageElement[]): RenderCell[] {
    return placeCells(this.#pack(elements)).map(
      ({ node, row, column }): RenderCell =>
        node.kind === 'group'
          ? { kind: 'group', id: node.id, row, column, group: node.group, children: placeCells(node.rows).map(fieldCell) }
          : fieldCell({ node, row, column })
    );
  }

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.#alive = false;
      this.#revision++;
      this.#validationAttempt++;
    });
    const context = inject(FormRenderContext);
    context.labelPlacement = this.labelPlacement;
    context.viewed = this.viewed;
    context.value = this.#value;
    context.variables = this.#variables;
    context.scope = this.scope;
    context.level = this.level;
    context.patch = patch => this.value.set({ ...this.#value(), ...patch });

    effect(() => {
      // Invalidate async attempts whenever their schema, value or registration scope changes.
      this.normalized();
      this.#value();
      this.#variables();
      this.keys();
      this.viewed();
      this.formGroup();
      untracked(() => {
        this.navigationTip.set(false);
        // A native input can start navigation before its value effect runs. The request already
        // owns that value snapshot; only a later, different dependency snapshot invalidates it.
        if (this.navigationPending() && this.#pendingNavigationSnapshot && this.#matches(this.#pendingNavigationSnapshot)) return;
        this.#revision++;
        this.#validationAttempt++;
        this.navigationPending.set(false);
        this.#pendingNavigationSnapshot = null;
      });
    });
    effect(() => {
      const pages = this.visiblePages();
      const request = this.activePageId();
      untracked(() => this.#reconcile(pages, request));
    });

    // why: defaults fill keys that are still undefined whenever schema, value or view mode change;
    // when nothing is missing the effect writes nothing, so it cannot loop.
    effect(() => {
      const current = this.#value();
      const next = sdApplyDefaults(this.normalized(), current, { viewed: this.viewed() });
      // why: Object.is — a NaN already in the value is "unchanged"; `!==` would re-write it forever.
      if (Object.keys(next).some(key => !Object.hasOwn(current, key) || !Object.is(next[key], current[key]))) {
        untracked(() => this.value.set(next));
      }
    });

    // why: the level follows the width of the FORM (drawer, dialog, builder preview), not the viewport.
    // A container query is not used: containment would make the intrinsic width of the form zero.
    effect(onCleanup => {
      const grid = this.grid()?.nativeElement;
      if (!grid || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(entries => this.#width.set(entries[0]?.contentRect.width ?? grid.clientWidth));
      observer.observe(grid);
      onCleanup(() => observer.disconnect());
    });
  }

  /**
   * Đánh dấu mọi control đã chạm, chờ validator bất đồng bộ, rồi chạy validation cấp form.
   * Luôn trả `{ valid, messages: { error, warning } }`; chỉ lỗi làm `valid = false`.
   */
  async validate(): Promise<SdFormGenericValidationResult> {
    const pageRevision = this.#pageRevision;
    // Consumer model writes may reveal a page in this turn, before descendants register.
    // Let the scheduled render/registration finish before touching and reading the FormGroup.
    await firstValueFrom(timer(0));
    const attempt = ++this.#validationAttempt;
    const revision = this.#revision;
    const snapshot = this.#snapshot();
    const form = this.formGroup();
    form.markAllAsTouched();
    // why: an async validator started with `emitEvent: false` (control connector, model sync of sd-input)
    // finishes WITHOUT emitting statusChanges — also re-check `pending` on a short timer so this cannot hang.
    while (form.pending && this.#alive && revision === this.#revision && this.#matches(snapshot) && attempt === this.#validationAttempt)
      await firstValueFrom(race(form.statusChanges, timer(PENDING_POLL_MS)));
    const fieldsValid = this.#itemsReadyFor(this.visiblePages()) && (form.status === 'VALID' || form.status === 'DISABLED');
    const result = await sdRunFormValidations(this.normalized().validations, {
      value: this.#value(),
      variables: this.#variables(),
      fieldTypes: this.#fieldTypes(),
      validators: this.#config.validators,
      unregisteredMessage: id => this.#i18n.t('core.component.form-generic.validation.unregistered', { id }),
      failedMessage: id => this.#i18n.t('core.component.form-generic.validation.failed', { id }),
    });
    if (
      !fieldsValid &&
      this.#alive &&
      pageRevision === this.#pageRevision &&
      revision === this.#revision &&
      this.#matches(snapshot) &&
      attempt === this.#validationAttempt
    )
      this.#revealInvalid(this.visiblePages());
    return { valid: fieldsValid && result.valid, messages: result.messages };
  }

  t = (key: string, params?: Record<string, string | number>): string => this.#i18n.t(key, params);
  pageLabel(page: SdFormGenericPage): string {
    return (
      page.label || this.t('core.component.form-generic.page', { number: this.normalized().pages.findIndex(p => p.id === page.id) + 1 })
    );
  }
  pageDomId(pageId: string, part: 'tab' | 'panel'): string {
    return `${this.#renderId}-${part}-${encodeURIComponent(pageId)}`;
  }

  protected onCorePageChange(index: number): void {
    const page = this.visiblePages()[index];
    if (!page || index === this.activeIndex()) return;
    // Core headers propose a page; keep the accepted index until the shared async gate finishes.
    this.pageTabs()?.selectTab(this.activeIndex());
    this.pageStepper()?.goTo(this.activeIndex());
    void this.requestPage(page.id);
  }

  protected onCorePageFocus(event: FocusEvent): void {
    const header = event.target instanceof Element ? event.target.closest<HTMLElement>('.mat-mdc-tab,mat-step-header') : null;
    if (!header) return;
    const index = this.#pageHeaders().indexOf(header);
    const page = this.visiblePages()[index];
    if (page) {
      header.dataset['pageButton'] = page.id;
      this.focusedPageId.set(page.id);
    }
  }

  #pageHeaders(): HTMLElement[] {
    return Array.from(
      this.#host.nativeElement.querySelectorAll<HTMLElement>('.sd-fg-navigation .mat-mdc-tab,.sd-fg-navigation mat-step-header')
    );
  }

  /** Shared navigation gate for consumer model writes, page headers and Next. */
  async requestPage(pageId: string): Promise<void> {
    const pages = this.visiblePages();
    const target = pages.findIndex(page => page.id === pageId);
    const current = this.activeIndex();
    if (target < 0) return;
    if (target === current) {
      this.activePageId.set(this.effectivePageId());
      return;
    }
    this.#pageRevision++;
    const navigation = this.navigation();
    if (target < current || navigation?.type !== 'steps' || !navigation.linear) {
      this.#revision++;
      this.navigationPending.set(false);
      this.#accept(pageId);
      return;
    }
    if (this.navigationPending()) {
      this.activePageId.set(this.effectivePageId());
      return;
    }
    const revision = ++this.#revision;
    const snapshot = this.#snapshot();
    const predecessors = pages.slice(0, target);
    this.#pendingNavigationSnapshot = snapshot;
    this.navigationPending.set(true);
    // Keep the model at the accepted page while a consumer request is pending or rejected.
    this.activePageId.set(this.effectivePageId());
    const currentAttempt = () => this.#alive && revision === this.#revision && this.#matches(snapshot);
    // Schema/model reconciliation can run before the current page descendants register.
    if (!this.#itemsReadyFor(predecessors)) {
      await firstValueFrom(timer(0));
      if (!currentAttempt()) return;
      if (!this.#itemsReadyFor(predecessors)) {
        this.navigationPending.set(false);
        return;
      }
    }
    const controls = predecessors.flatMap(page => this.#controlsFor(page));
    controls.forEach(control => control.markAsTouched());
    while (controls.some(control => control.pending) && currentAttempt()) await firstValueFrom(timer(PENDING_POLL_MS));
    if (!currentAttempt()) return;
    this.navigationPending.set(false);
    if (controls.some(control => control.invalid)) {
      this.#revealInvalid(predecessors);
      this.navigationTip.set(true);
    } else this.#accept(pageId);
  }

  previous(): void {
    const page = this.visiblePages()[this.activeIndex() - 1];
    if (page) void this.requestPage(page.id);
  }
  next(): void {
    const page = this.visiblePages()[this.activeIndex() + 1];
    if (page) void this.requestPage(page.id);
  }

  onPageKeydown(event: KeyboardEvent, pageId: string): void {
    const pages = this.visiblePages();
    const index = pages.findIndex(page => page.id === pageId);
    let target = index;
    switch (event.key) {
      case 'ArrowRight':
        target = (index + 1) % pages.length;
        break;
      case 'ArrowLeft':
        target = (index + pages.length - 1) % pages.length;
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = pages.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        void this.requestPage(pageId);
        return;
      default:
        return;
    }
    event.preventDefault();
    const page = pages[target];
    if (!page) return;
    this.focusedPageId.set(page.id);
    const button = Array.from(this.#host.nativeElement.querySelectorAll<HTMLButtonElement>('[data-page-button]')).find(
      element => element.dataset['pageButton'] === page.id
    );
    button?.focus();
    button?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }

  #snapshot() {
    return [this.schema(), this.value(), this.variables(), this.keys(), this.viewed(), this.formGroup()];
  }
  #matches(snapshot: unknown[]): boolean {
    return snapshot.every((value, index) => value === this.#snapshot()[index]);
  }
  #accept(pageId: string | null): void {
    this.#pendingNavigationSnapshot = null;
    this.navigationTip.set(false);
    this.effectivePageId.set(pageId);
    this.activePageId.set(pageId);
    this.focusedPageId.set(pageId);
  }
  #reconcile(pages: SdFormGenericPage[], request: string | null): void {
    const current = this.effectivePageId();
    const document = this.#host.nativeElement.ownerDocument;
    const previousFocus = document.activeElement;
    const restoreHeaderFocus =
      !!this.focusedPageId() &&
      !!previousFocus &&
      this.#host.nativeElement.contains(previousFocus) &&
      previousFocus.getAttribute('data-page-button') === this.focusedPageId() &&
      !pages.some(page => page.id === this.focusedPageId());
    const nextOrder = this.normalized().pages.map(page => page.id);
    if (!this.#initialized) {
      this.#initialized = true;
      this.#accept(pages.some(page => page.id === request) ? request : (pages[0]?.id ?? null));
    } else if (!pages.some(page => page.id === current)) {
      const oldIndex = this.#pageOrder.indexOf(current ?? '');
      const successor = this.#pageOrder.slice(oldIndex + 1).find(id => pages.some(page => page.id === id));
      const predecessor = this.#pageOrder
        .slice(0, Math.max(0, oldIndex))
        .reverse()
        .find(id => pages.some(page => page.id === id));
      this.#revision++;
      this.navigationPending.set(false);
      this.#accept(successor ?? predecessor ?? pages[0]?.id ?? null);
    } else if (request !== current) {
      if (request && pages.some(page => page.id === request)) void this.requestPage(request);
      else if (pages[0]) void this.requestPage(pages[0].id);
    }
    if (!pages.some(page => page.id === this.focusedPageId())) this.focusedPageId.set(this.effectivePageId() ?? pages[0]?.id ?? null);
    const fallback = this.focusedPageId();
    if (restoreHeaderFocus && fallback && typeof requestAnimationFrame !== 'undefined') {
      const revision = this.#revision;
      requestAnimationFrame(() => {
        if (!this.#alive || revision !== this.#revision || this.focusedPageId() !== fallback) return;
        if (document.activeElement !== previousFocus && document.activeElement !== document.body) return;
        Array.from(this.#host.nativeElement.querySelectorAll<HTMLButtonElement>('[data-page-button]'))
          .find(button => button.dataset['pageButton'] === fallback)
          ?.focus();
      });
    }
    this.#pageOrder = nextOrder;
  }
  #controlsFor(page: SdFormGenericPage) {
    const region = this.pageRegions().find(region => region.page.id === page.id);
    const fields = region?.cells.flatMap(cell => (cell.kind === 'field' ? [cell] : cell.children)) ?? [];
    return fields.flatMap(cell => {
      const control = this.#controlFor(cell.field);
      return control ? [control] : [];
    });
  }
  #controlFor(field: SdFormGenericField) {
    const item = this.items().find(item => item.field() === field && item.form() === this.formGroup());
    return item?.registeredControl() ?? null;
  }
  #itemsReadyFor(pages: SdFormGenericPage[]): boolean {
    const ids = new Set(pages.map(page => page.id));
    return this.pageRegions()
      .filter(region => ids.has(region.page.id))
      .every(region =>
        region.cells
          .flatMap(cell => (cell.kind === 'field' ? [cell] : cell.children))
          .every(cell => this.items().some(item => item.field() === cell.field && item.form() === this.formGroup()))
      );
  }
  #revealInvalid(pages: SdFormGenericPage[]): void {
    const page = pages.find(page => this.#controlsFor(page).some(control => control.invalid));
    if (!page) return; // External/global-only errors have no invented page destination.
    this.#accept(page.id);
    const revision = this.#revision;
    if (typeof requestAnimationFrame === 'undefined') return;
    requestAnimationFrame(() => {
      if (!this.#alive || revision !== this.#revision || this.effectivePageId() !== page.id) return;
      const panel = Array.from(this.#host.nativeElement.querySelectorAll<HTMLElement>('[data-page-id]')).find(
        element => element.dataset['pageId'] === page.id
      );
      const cell = this.pageRegions()
        .find(region => region.page.id === page.id)
        ?.cells.flatMap(cell => (cell.kind === 'field' ? [cell] : cell.children))
        .find(cell => this.#controlFor(cell.field)?.invalid);
      const element = Array.from(panel?.querySelectorAll<HTMLElement>('[data-element-id]') ?? []).find(
        element => element.dataset['elementId'] === cell?.id
      );
      element?.querySelector<HTMLElement>('input,textarea,select,button,[tabindex="0"]')?.focus();
    });
  }

  /** Tải lên các tệp đang chờ của mọi field upload; kết quả được ghi vào value. Gọi trước khi lưu. */
  async upload(): Promise<void> {
    for (const item of this.items()) await item.upload();
  }

  #state(element: SdFormGenericPageElement): SdFormGenericElementState {
    return sdElementState(element, this.scope(), this.#fieldTypes());
  }

  #fieldNode(element: unknown): FieldNode | null {
    if (!sdIsField(element)) {
      const type = String((element as { type?: unknown })?.type ?? '');
      if (isDevMode() && !this.#warnedTypes.has(type)) {
        this.#warnedTypes.add(type);
        console.warn(`[sd-form-render] element type "${type}" is not supported by this version and is skipped.`);
      }
      return null;
    }
    // why: a key such as `constructor` is an inherited property of FormGroup.controls — the control would
    // never join the form, so its required/constraints would silently not apply. sdValidateSchema reports it.
    if (element.key && SD_FORM_GENERIC_RESERVED_KEYS.has(element.key)) {
      if (isDevMode() && !this.#warnedKeys.has(element.key)) {
        this.#warnedKeys.add(element.key);
        console.warn(`[sd-form-render] field key "${element.key}" is reserved (Object.prototype) and the field is skipped.`);
      }
      return null;
    }
    const keys = this.#keySet();
    if (keys && (!element.key || !keys.has(element.key))) return null;
    const state = this.#state(element);
    if (!state.visible) return null;
    return { kind: 'field', id: element.id, type: element.type, layout: element.layout, field: element, state };
  }

  #pack(elements: readonly SdFormGenericPageElement[]): SdFormGenericLayoutRow<RenderNode>[] {
    const level = this.level();
    const nodes: RenderNode[] = [];
    for (const element of elements) {
      if (sdIsGroup(element)) {
        if (!this.#state(element).visible) continue;
        const children = (element.elements ?? []).map(child => this.#fieldNode(child)).filter((node): node is FieldNode => !!node);
        if (!children.length) continue;
        nodes.push({ kind: 'group', id: element.id, type: 'group', group: element, rows: sdPackRows(children, level) });
        continue;
      }
      const node = this.#fieldNode(element);
      if (node) nodes.push(node);
    }
    return sdPackRows(nodes, level);
  }
}
