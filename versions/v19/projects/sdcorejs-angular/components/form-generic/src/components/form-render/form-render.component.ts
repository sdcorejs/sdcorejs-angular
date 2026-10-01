import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { SdSection } from '@sdcorejs/angular/components/section';
import type { SdLabelPlacement } from '@sdcorejs/angular/forms/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import { firstValueFrom, race, timer } from 'rxjs';
import type { SdFormGenericBreakpoint } from '../../configurations/form-generic-breakpoints';
import { SD_FORM_GENERIC_CONFIG } from '../../configurations/form-generic-config.token';
import { sdEffectiveBreakpoint, sdPackRows, type SdFormGenericLayoutRow } from '../../layout/form-generic-layout';
import type { SdFormGenericField, SdFormGenericLayout } from '../../models/form-generic-field.model';
import { SD_FORM_GENERIC_RESERVED_KEYS, sdIsField, sdIsGroup, sdNormalizeSchema } from '../../models/form-generic-schema';
import type { SdFormGenericGroup, SdFormGenericPageElement, SdFormGenericSchema } from '../../models/form-generic-schema.model';
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
  imports: [SdSection, LibItemComponent],
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

  readonly #config = inject(SD_FORM_GENERIC_CONFIG);
  readonly #i18n = inject(I18nService);
  readonly #ownForm = new FormGroup({});
  readonly #width = signal(0);
  readonly #warnedTypes = new Set<string>();
  readonly #warnedKeys = new Set<string>();
  // why: signal queries cannot live on ES `#private` members (NG1053).
  private readonly grid = viewChild<ElementRef<HTMLElement>>('grid');
  private readonly items = viewChildren(LibItemComponent);

  readonly formGroup = computed(() => this.form() ?? this.#ownForm);
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
  /** Hàng của trang đang hiện (đợt 1: một trang). */
  readonly rows = computed(() => this.#pack(this.normalized().pages[0]?.elements ?? []));
  /** Ô của lưới theo thứ tự tài liệu (DOM phẳng, vị trí từ `rows`). */
  readonly cells = computed<RenderCell[]>(() =>
    placeCells(this.rows()).map(
      ({ node, row, column }): RenderCell =>
        node.kind === 'group'
          ? { kind: 'group', id: node.id, row, column, group: node.group, children: placeCells(node.rows).map(fieldCell) }
          : fieldCell({ node, row, column })
    )
  );

  constructor() {
    const context = inject(FormRenderContext);
    context.labelPlacement = this.labelPlacement;
    context.viewed = this.viewed;
    context.value = this.#value;
    context.variables = this.#variables;
    context.scope = this.scope;
    context.level = this.level;
    context.patch = patch => this.value.set({ ...this.#value(), ...patch });

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
    const form = this.formGroup();
    form.markAllAsTouched();
    // why: an async validator started with `emitEvent: false` (control connector, model sync of sd-input)
    // finishes WITHOUT emitting statusChanges — also re-check `pending` on a short timer so this cannot hang.
    while (form.pending) await firstValueFrom(race(form.statusChanges, timer(PENDING_POLL_MS)));
    const fieldsValid = form.status !== 'INVALID';
    const result = await sdRunFormValidations(this.normalized().validations, {
      value: this.#value(),
      variables: this.#variables(),
      fieldTypes: this.#fieldTypes(),
      validators: this.#config.validators,
      unregisteredMessage: id => this.#i18n.t('core.component.form-generic.validation.unregistered', { id }),
      failedMessage: id => this.#i18n.t('core.component.form-generic.validation.failed', { id }),
    });
    return { valid: fieldsValid && result.valid, messages: result.messages };
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
