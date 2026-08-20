import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostBinding,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdCodeEditor } from '@sdcorejs/angular/components/code-editor';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import {
  resolveSdApiContractConfiguration,
  SD_API_CONTRACT_CONFIGURATION,
  type SdApiContractConfiguration,
} from './api-contract.configuration';
import {
  SD_API_CONTRACT_DATA_TYPES,
  SD_API_CONTRACT_HTTP_METHODS,
  SD_API_CONTRACT_SCALAR_DATA_TYPES,
  SD_API_CONTRACT_VERSION,
  type SdApiContract,
  type SdApiContractDataType,
  type SdApiContractDiagnostic,
  type SdApiContractFeSchemaNode,
  type SdApiContractHttpMethod,
  type SdApiContractMappedFeSchemaNode,
  type SdApiContractMappedRestNode,
  type SdApiContractRestNode,
} from './api-contract.model';
import {
  addSdApiContractProperty,
  cloneSdApiContract,
  cloneSdApiContractNode,
  createSdApiContractNode,
  formatSdApiContractExpression,
  getSdApiContractNodeAt,
  listSdApiContractResponseFields,
  listSdApiContractSchemaFields,
  renameSdApiContractProperty,
  resolveSdApiContractResponsePath,
  sdApiContractRecordRename,
  sdApiContractRecordSet,
  setSdApiContractNodeAt,
  type SdApiContractSchemaField,
  type SdApiContractStructuralNode,
} from './api-contract.schema';
import { serializeSdApiContract } from './api-contract.serializer';
import { validateSdApiContract } from './api-contract.validation';
import { SdApiContractDiagnosticList } from './components/api-contract-diagnostic-list.component';
import {
  SdApiContractNodeDrawer,
  type SdApiContractNodeCommit,
  type SdApiContractNodeEditRequest,
} from './components/api-contract-node-drawer.component';
import { SdApiContractNodeEditor } from './components/api-contract-node-editor.component';
import { SdApiContractRecordEditor } from './components/api-contract-record-editor.component';
import type { SdApiContractSuggestion } from './components/api-contract-suggestion.model';

interface SdApiContractOption {
  value: string;
  label: string;
}

interface SdApiContractStep {
  index: number;
  key: string;
  label: string;
}

type SdApiContractNodeRecord = Record<string, SdApiContractStructuralNode>;

/** Every place a node can live. The builder needs it to route a commit back to its owner. */
type SdApiContractDrawerSection =
  | 'input.schema'
  | 'req.path'
  | 'req.query'
  | 'req.headers'
  | 'req.body'
  | 'res.headers'
  | 'res.body'
  | 'output.schema';

interface SdApiContractDrawerTarget {
  section: SdApiContractDrawerSection;
  request: SdApiContractNodeEditRequest;
}

const STEP_GENERAL = 0;
const STEP_INPUT = 1;
const STEP_REQUEST = 2;
const STEP_RESPONSE = 3;
const STEP_OUTPUT = 4;
const STEP_REVIEW = 5;

/**
 * Visual builder for an `SdApiContract`.
 *
 * The component is a **design-time** tool: it never performs a request, never resolves an
 * expression and never holds a secret. It edits, validates and serializes the contract; executing
 * it is a separate concern for a future `form-builder` / `form-render` integration.
 *
 * @example
 * ```html
 * <sd-api-contract-builder [(model)]="contract" autoId="product-search"></sd-api-contract-builder>
 * ```
 */
@Component({
  selector: 'sd-api-contract-builder',
  standalone: true,
  imports: [
    SdButton,
    SdCodeEditor,
    SdIcon,
    SdInput,
    SdSelect,
    SdTranslatePipe,
    SdApiContractDiagnosticList,
    SdApiContractNodeEditor,
    SdApiContractNodeDrawer,
    SdApiContractRecordEditor,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './api-contract-builder.component.html',
  styleUrl: './api-contract-builder.component.scss',
})
export class SdApiContractBuilder {
  readonly #i18n = inject(I18nService);
  readonly #configuration: SdApiContractConfiguration = resolveSdApiContractConfiguration(
    inject(SD_API_CONTRACT_CONFIGURATION, { optional: true })
  );

  model = model<SdApiContract | null>(null);
  mode = input<'edit' | 'view'>('edit');
  disabled = input(false, { transform: booleanAttribute });
  autoId = input<string | null | undefined>();

  /** Fires whenever the diagnostics change, including once for the initially seeded contract. */
  diagnosticsChange = output<readonly SdApiContractDiagnostic[]>();
  /** Fires only when validity flips, so a consumer can gate a Save button without debouncing. */
  validChange = output<boolean>();

  // why: bản nháp nội bộ là BẢN SAO SÂU của model cha. Component không bao giờ ghi vào object cha —
  // mọi thao tác dựng contract mới rồi mới `model.set`.
  readonly #draft = signal<SdApiContract | null>(null);
  // why: mốc so sánh để phân biệt "cha đưa giá trị mới vào" với "chính ta vừa bắn ra" — thiếu nó,
  // effect seed sẽ clone lại contract ta vừa emit và tạo vòng lặp phản hồi.
  #lastEmitted: SdApiContract | null = null;
  #lastValid: boolean | null = null;

  protected readonly activeStep = signal(STEP_GENERAL);
  protected readonly contractVersion = SD_API_CONTRACT_VERSION;
  protected readonly responseFieldToken = signal<string | null>(null);
  protected readonly urlPlaceholder = '${env.baseUrl}/products/{id}';

  protected readonly draft = this.#draft.asReadonly();
  protected readonly readonly = computed(() => this.disabled() || this.mode() === 'view');
  protected readonly isView = computed(() => this.mode() === 'view');

  protected readonly steps: SdApiContractStep[] = [
    { index: STEP_GENERAL, key: 'general', label: this.#i18n.t('core.component.api-contract-builder.step.general') },
    { index: STEP_INPUT, key: 'input', label: this.#i18n.t('core.component.api-contract-builder.step.input') },
    { index: STEP_REQUEST, key: 'request', label: this.#i18n.t('core.component.api-contract-builder.step.request') },
    { index: STEP_RESPONSE, key: 'response', label: this.#i18n.t('core.component.api-contract-builder.step.response') },
    { index: STEP_OUTPUT, key: 'output', label: this.#i18n.t('core.component.api-contract-builder.step.output') },
    { index: STEP_REVIEW, key: 'review', label: this.#i18n.t('core.component.api-contract-builder.step.review') },
  ];

  protected readonly methodOptions: SdApiContractOption[] = SD_API_CONTRACT_HTTP_METHODS.map(method => ({ value: method, label: method }));
  protected readonly allTypes: readonly SdApiContractDataType[] = SD_API_CONTRACT_DATA_TYPES;
  protected readonly scalarTypes: readonly SdApiContractDataType[] = SD_API_CONTRACT_SCALAR_DATA_TYPES;
  protected readonly queryTypes: readonly SdApiContractDataType[] = [...SD_API_CONTRACT_SCALAR_DATA_TYPES, 'array'];

  readonly #envSuggestions: SdApiContractSuggestion[] = Object.keys(this.#configuration.env).map(key => {
    const variable = this.#configuration.env[key];
    const sensitiveMark = variable.sensitive ? ` · ${this.#i18n.t('core.component.api-contract-builder.mapping.sensitive')}` : '';
    return {
      expression: formatSdApiContractExpression('env', [key]),
      path: `env.${key}`,
      root: 'env' as const,
      type: variable.type,
      display: `env.${key} — ${variable.type}${sensitiveMark}`,
    };
  });

  // why: builder sở hữu ĐÚNG MỘT drawer, nên phải tự nhớ danh sách nào vừa yêu cầu mở nó. Không có
  // mốc này thì `applyNodeCommit` không biết ghi kết quả vào `req.query` hay `res.headers`.
  readonly #drawerTarget = signal<SdApiContractDrawerTarget | null>(null);

  protected readonly nodeDrawer = viewChild<SdApiContractNodeDrawer>('nodeDrawer');

  protected readonly drawerLayer = computed<'schema' | 'mapping'>(() =>
    this.#drawerTarget()?.section === 'input.schema' ? 'schema' : 'mapping'
  );

  // why chỉ input/output schema: `transform` là thuộc tính của schema frontend. `req`/`res` mô tả HTTP,
  // ở đó một giá trị thời gian đã là chuỗi trên đường truyền rồi.
  protected readonly drawerAllowsTransform = computed(() => {
    const section = this.#drawerTarget()?.section;
    return section === 'input.schema' || section === 'output.schema';
  });

  protected readonly drawerSuggestions = computed<readonly SdApiContractSuggestion[]>(() => {
    const section = this.#drawerTarget()?.section;
    if (section === undefined) return [];
    if (section === 'output.schema') return this.outputSuggestions();
    if (section === 'res.headers' || section === 'res.body') return this.outputSuggestions();
    return this.requestSuggestions();
  });

  // why: JSON dán vào có thể chưa parse được (đang gõ dở, thiếu ngoặc). Lỗi đó KHÔNG đến từ
  // `validateSdApiContract` — nó chưa bao giờ thấy contract — nên phải mang riêng rồi trộn vào
  // danh sách chẩn đoán, để người dán thấy lý do thay vì thấy contract im lặng không đổi.
  readonly #pasteError = signal<SdApiContractDiagnostic | null>(null);

  protected readonly diagnostics = computed<readonly SdApiContractDiagnostic[]>(() => {
    const draft = this.#draft();
    const base = draft ? validateSdApiContract(draft, this.#configuration) : [];
    const pasteError = this.#pasteError();
    return pasteError ? [pasteError, ...base] : base;
  });

  protected readonly json = computed(() => serializeSdApiContract(this.#draft()));

  // why: contract từ ngoài có thể thiếu hẳn một tầng. Mọi computed đọc draft phải chịu được điều đó —
  // builder có nhiệm vụ HIỂN THỊ contract sai kèm chẩn đoán, không được nổ và cũng không được tự vá.
  readonly #inputSuggestions = computed<SdApiContractSuggestion[]>(() => {
    const schema = this.#draft()?.input?.schema;
    if (!schema) return [];
    return listSdApiContractSchemaFields(schema as unknown as SdApiContractStructuralNode, { arrays: 'stop' }).map(field => ({
      expression: formatSdApiContractExpression('input', field.segments),
      path: `input.${field.path}`,
      root: 'input' as const,
      type: field.type,
      display: `input.${field.path} — ${field.type}${field.label ? ` (${field.label})` : ''}`,
    }));
  });

  readonly #responseSuggestions = computed<SdApiContractSuggestion[]>(() => {
    const response = this.#draft()?.res;
    if (!response) return [];
    return listSdApiContractResponseFields(response).map(field => ({
      expression: formatSdApiContractExpression('res', field.segments),
      path: `res.${field.path}`,
      root: 'res' as const,
      type: field.type,
      display: `res.${field.path} — ${field.type}`,
    }));
  });

  protected readonly requestSuggestions = computed<SdApiContractSuggestion[]>(() => [...this.#inputSuggestions(), ...this.#envSuggestions]);

  protected readonly outputSuggestions = computed<SdApiContractSuggestion[]>(() => [
    ...this.#responseSuggestions(),
    ...this.#inputSuggestions(),
    ...this.#envSuggestions,
  ]);

  /** Response paths offered by the "use a response field as the output" action. */
  protected readonly responseFieldOptions = computed<SdApiContractOption[]>(() => {
    const response = this.#draft()?.res;
    if (!response) return [];
    return listSdApiContractResponseFields(response).map(field => ({ value: field.path, label: `${field.path} — ${field.type}` }));
  });

  /** Leaf fields a dropdown / table consumer will see once this contract runs. */
  protected readonly outputFields = computed<SdApiContractSchemaField[]>(() => {
    const schema = this.#draft()?.output?.schema;
    if (!schema) return [];
    return listSdApiContractSchemaFields(schema as unknown as SdApiContractStructuralNode).filter(field => field.leaf);
  });

  protected readonly statusText = computed(() => {
    const status = this.#draft()?.res?.status;
    if (status === undefined) return '';
    return Array.isArray(status) ? status.join(', ') : String(status);
  });

  @HostBinding('attr.data-autoId') get autoIdAttr(): string | null {
    return this.autoId() ?? null;
  }

  constructor() {
    effect(() => {
      const external = this.model();
      untracked(() => {
        if (external === this.#lastEmitted) return;
        // why: clone sâu — cha giữ nguyên object của mình, mọi chỉnh sửa chỉ chạm bản nháp.
        // Contract sai cấu trúc vẫn được nạp nguyên trạng để hiển thị + chẩn đoán, KHÔNG tự sửa.
        this.#draft.set(external ? cloneSdApiContract(external) : null);
      });
    });

    effect(() => {
      const diagnostics = this.diagnostics();
      untracked(() => {
        this.diagnosticsChange.emit(diagnostics);
        const valid = !diagnostics.some(diagnostic => diagnostic.severity === 'error');
        if (valid !== this.#lastValid) {
          this.#lastValid = valid;
          this.validChange.emit(valid);
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  protected goToStep(index: number): void {
    this.activeStep.set(index);
  }

  protected goToDiagnostic(diagnostic: SdApiContractDiagnostic): void {
    this.activeStep.set(stepForPath(diagnostic.path));
  }

  // -------------------------------------------------------------------------
  // Contract-level edits
  // -------------------------------------------------------------------------

  protected createContract(): void {
    this.#commit({
      contractVersion: SD_API_CONTRACT_VERSION,
      code: '',
      name: '',
      input: { schema: { type: 'object', properties: {} } },
      req: { method: 'GET', url: '' },
      res: { status: 200 },
      output: { schema: { type: 'object', properties: {} } },
    });
  }

  protected setText(key: 'code' | 'name' | 'description', value: unknown): void {
    const draft = this.#draft();
    if (!draft) return;
    const text = typeof value === 'string' ? value : '';
    if (key === 'description' && !text) {
      const { description: _dropped, ...rest } = draft;
      this.#commit(rest as SdApiContract);
      return;
    }
    this.#commit({ ...draft, [key]: text });
  }

  protected setInputSchema(node: SdApiContractStructuralNode): void {
    const draft = this.#draft();
    if (!draft) return;
    this.#commit({ ...draft, input: { schema: node as unknown as SdApiContractFeSchemaNode } });
  }

  protected setMethod(value: unknown): void {
    const draft = this.#draft();
    if (!draft || typeof value !== 'string') return;
    this.#commit({ ...draft, req: { ...draft.req, method: value as SdApiContractHttpMethod } });
  }

  protected setUrl(value: unknown): void {
    const draft = this.#draft();
    if (!draft) return;
    this.#commit({ ...draft, req: { ...draft.req, url: typeof value === 'string' ? value : '' } });
  }

  // -------------------------------------------------------------------------
  // Drawer
  // -------------------------------------------------------------------------

  /**
   * Opens the one drawer for whichever list asked.
   *
   * why gác `readonly` ở đây nữa: hàng thu gọn đã tự chặn khi read-only, nhưng builder là nơi duy nhất
   * biết `mode`/`disabled` thật. Hai lớp gác rẻ hơn một đường mở drawer lọt trong chế độ xem.
   */
  protected openNodeDrawer(section: SdApiContractDrawerSection, request: SdApiContractNodeEditRequest): void {
    if (this.readonly()) return;

    this.#drawerTarget.set({ section, request });
    const drawer = this.nodeDrawer();
    if (!drawer) return;

    if (request.name === null || request.node === null) drawer.openForAdd(request.siblingNames);
    else drawer.openForEdit(request.name, request.node, request.siblingNames);
  }

  /**
   * Writes a committed node back where it came from — one `modelChange`, at Save time.
   *
   * A rename goes through `sdApiContractRecordRename` first so the entry keeps its position in the
   * JSON instead of jumping to the end. The drawer has already refused a duplicate name, so the
   * rename cannot collide by the time it reaches here.
   */
  protected applyNodeCommit(commit: SdApiContractNodeCommit): void {
    const target = this.#drawerTarget();
    const draft = this.#draft();
    this.#drawerTarget.set(null);
    if (!target || !draft) return;

    const previous = target.request.name;
    const pointer = target.request.pointer ?? [];

    switch (target.section) {
      case 'req.path':
      case 'req.query':
      case 'req.headers': {
        const key = target.section.slice('req.'.length) as 'path' | 'query' | 'headers';
        const record = (draft.req?.[key] ?? {}) as unknown as SdApiContractNodeRecord;
        this.setRequestRecord(key, commitIntoRecord(record, previous, commit));
        return;
      }
      case 'res.headers': {
        const record = (draft.res?.headers ?? {}) as unknown as SdApiContractNodeRecord;
        this.setResponseHeaders(commitIntoRecord(record, previous, commit));
        return;
      }
      case 'input.schema': {
        const root = draft.input?.schema as unknown as SdApiContractStructuralNode | undefined;
        if (!root) return;
        this.setInputSchema(commitIntoProperties(root, pointer, previous, commit));
        return;
      }
      case 'req.body': {
        const root = draft.req?.body as unknown as SdApiContractStructuralNode | undefined;
        if (!root) return;
        this.setRequestBody(commitIntoProperties(root, pointer, previous, commit));
        return;
      }
      case 'res.body': {
        const root = draft.res?.body as unknown as SdApiContractStructuralNode | undefined;
        if (!root) return;
        this.setResponseBody(commitIntoProperties(root, pointer, previous, commit));
        return;
      }
      case 'output.schema': {
        const root = draft.output?.schema as unknown as SdApiContractStructuralNode | undefined;
        if (!root) return;
        this.setOutputSchema(commitIntoProperties(root, pointer, previous, commit));
        return;
      }
      default:
        return;
    }
  }

  protected setRequestRecord(section: 'path' | 'query' | 'headers', record: SdApiContractNodeRecord): void {
    const draft = this.#draft();
    if (!draft) return;
    this.#commit({ ...draft, req: { ...draft.req, [section]: record as unknown as Record<string, SdApiContractMappedRestNode> } });
  }

  protected setRequestBody(node: SdApiContractStructuralNode): void {
    const draft = this.#draft();
    if (!draft) return;
    this.#commit({ ...draft, req: { ...draft.req, body: node as unknown as SdApiContractMappedRestNode } });
  }

  protected addRequestBody(): void {
    this.setRequestBody(createSdApiContractNode('object'));
  }

  protected removeRequestBody(): void {
    const draft = this.#draft();
    if (!draft) return;
    const { body: _dropped, ...req } = draft.req;
    this.#commit({ ...draft, req });
  }

  protected setStatus(value: unknown): void {
    const draft = this.#draft();
    if (!draft) return;
    const parts = String(value ?? '')
      .split(',')
      .map(part => part.trim())
      .filter(part => part.length > 0)
      .map(part => Number(part));
    // why: KHÔNG bỏ giá trị không phải số — validator phải báo `res.status.invalid` cho người dùng
    // thấy, im lặng nuốt đi là "âm thầm sửa contract sai".
    const status = parts.length === 1 ? parts[0] : parts;
    this.#commit({ ...draft, res: { ...draft.res, status } });
  }

  protected setResponseHeaders(record: SdApiContractNodeRecord): void {
    const draft = this.#draft();
    if (!draft) return;
    this.#commit({ ...draft, res: { ...draft.res, headers: record as unknown as Record<string, SdApiContractRestNode> } });
  }

  protected setResponseBody(node: SdApiContractStructuralNode): void {
    const draft = this.#draft();
    if (!draft) return;
    this.#commit({ ...draft, res: { ...draft.res, body: node as unknown as SdApiContractRestNode } });
  }

  protected addResponseBody(): void {
    this.setResponseBody(createSdApiContractNode('object'));
  }

  protected removeResponseBody(): void {
    const draft = this.#draft();
    if (!draft) return;
    const { body: _dropped, ...res } = draft.res;
    this.#commit({ ...draft, res });
  }

  protected setOutputSchema(node: SdApiContractStructuralNode): void {
    const draft = this.#draft();
    if (!draft) return;
    this.#commit({ ...draft, output: { schema: node as unknown as SdApiContractMappedFeSchemaNode } });
  }

  /**
   * Adopts a response subtree as the output schema.
   *
   * The subtree is **deep-copied**, never referenced: editing the output afterwards must not reach
   * back into the response declaration. An array or scalar target takes a whole-node `source`; an
   * object target keeps its shape and each branch gets its own `source`, because an object with both
   * a whole-node source and child mappings is invalid by design.
   */
  protected useResponseFieldAsOutput(value: unknown): void {
    const draft = this.#draft();
    if (!draft || typeof value !== 'string' || !value) return;
    const segments = value.split('.');
    const resolved = resolveSdApiContractResponsePath(draft.res, segments);
    this.responseFieldToken.set(null);
    if (!resolved) return;

    const schema = resolved.node
      ? adoptResponseNode(resolved.node, segments)
      : ({ type: resolved.type, source: formatSdApiContractExpression('res', segments) } as SdApiContractStructuralNode);
    this.setOutputSchema(schema);
  }

  /**
   * Adopts a contract pasted into the review editor.
   *
   * `<sd-code-editor language="json">` emits the PARSED value when the text is valid JSON and the
   * raw STRING while it is still half-typed. A string therefore means "not parseable yet": keep the
   * current draft and report it, because replacing a contract with a fragment of text would destroy
   * the author's work on a keystroke.
   *
   * A parseable object is adopted VERBATIM — no field is added, removed or repaired. Whatever is
   * wrong with it surfaces through `validateSdApiContract`, which is the whole point of pasting.
   */
  protected applyPastedJson(value: unknown): void {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      this.#pasteError.set({
        code: 'contract.invalid',
        severity: 'error',
        path: '',
        message: 'The pasted text is not valid JSON. The contract was left unchanged.',
      });
      return;
    }

    this.#pasteError.set(null);
    this.#commit(cloneSdApiContract(value as SdApiContract));
  }

  #commit(next: SdApiContract): void {
    this.#lastEmitted = next;
    this.#draft.set(next);
    this.model.set(next);
  }
}

/**
 * Places a committed node back under a schema root's `properties`.
 *
 * why phân biệt add với overwrite: `addSdApiContractProperty` CỐ Ý không ghi đè key đã tồn tại (nó bảo
 * caller phải tự dedupe). Sửa một field đang có thì phải đi qua `setSdApiContractNodeAt`, nếu không
 * mọi lần Lưu trên field cũ sẽ im lặng không có tác dụng.
 */
function commitIntoProperties(
  root: SdApiContractStructuralNode,
  pointer: readonly string[],
  previous: string | null,
  commit: SdApiContractNodeCommit
): SdApiContractStructuralNode {
  // why đi qua pointer: danh sách nói cho ta biết nó đang đọc `properties` hay `items.properties`.
  // Ghi thẳng vào root sẽ tạo ra một nhánh `properties` song song mà tầng `array` không bao giờ đọc.
  const container = getSdApiContractNodeAt(root, pointer);
  if (!container) return root;

  let next = container;
  if (previous !== null && previous !== commit.name) {
    next = renameSdApiContractProperty(next, previous, commit.name);
  }

  const exists = next.properties && Object.prototype.hasOwnProperty.call(next.properties, commit.name);
  next = exists
    ? setSdApiContractNodeAt(next, ['properties', commit.name], commit.node)
    : addSdApiContractProperty(next, commit.name, commit.node);

  return setSdApiContractNodeAt(root, pointer, next);
}

/** Places a committed node back into a keyed record, keeping the author's key order. */
function commitIntoRecord(
  record: SdApiContractNodeRecord,
  previous: string | null,
  commit: SdApiContractNodeCommit
): SdApiContractNodeRecord {
  if (previous !== null && previous !== commit.name) {
    const renamed = sdApiContractRecordRename(record, previous, commit.name);
    return sdApiContractRecordSet(renamed, commit.name, commit.node);
  }
  return sdApiContractRecordSet(record, commit.name, commit.node);
}

/** Recursively rebuilds a response subtree as a mapped output subtree. */
function adoptResponseNode(node: SdApiContractStructuralNode, segments: readonly string[]): SdApiContractStructuralNode {
  if (node.type === 'object' && node.properties) {
    const properties: Record<string, SdApiContractStructuralNode> = {};
    for (const key of Object.keys(node.properties)) {
      properties[key] = adoptResponseNode(node.properties[key], [...segments, key]);
    }
    const next: SdApiContractStructuralNode = { type: 'object', properties };
    if (node.required !== undefined) next.required = node.required;
    if (node.label !== undefined) next.label = node.label;
    if (node.description !== undefined) next.description = node.description;
    return next;
  }
  return { ...cloneSdApiContractNode(node), source: formatSdApiContractExpression('res', segments) };
}

function stepForPath(path: string): number {
  if (path.startsWith('input.')) return STEP_INPUT;
  if (path.startsWith('req')) return STEP_REQUEST;
  if (path.startsWith('res')) return STEP_RESPONSE;
  if (path.startsWith('output')) return STEP_OUTPUT;
  return STEP_GENERAL;
}
