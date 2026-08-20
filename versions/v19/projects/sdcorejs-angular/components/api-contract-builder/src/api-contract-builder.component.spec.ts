import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdCodeEditor } from '@sdcorejs/angular/components/code-editor';
import { I18nService } from '@sdcorejs/angular/i18n';

import { SdApiContractBuilder } from './api-contract-builder.component';
import { provideSdApiContract } from './api-contract.configuration';
import type { SdApiContract, SdApiContractDiagnostic } from './api-contract.model';
import { sdApiContractCreateSample, sdApiContractSearchSample, SD_API_CONTRACT_SAMPLE_ENVIRONMENT } from './api-contract.samples';
import type { SdApiContractStructuralNode } from './api-contract.schema';
import { SdApiContractNodeDrawer } from './components/api-contract-node-drawer.component';
import type { SdApiContractSuggestion } from './components/api-contract-suggestion.model';

/** Typed window onto the protected surface — the specs drive behaviour, not private state. */
interface BuilderInternals {
  applyPastedJson(value: unknown): void;
  requestSuggestions(): SdApiContractSuggestion[];
  outputSuggestions(): SdApiContractSuggestion[];
  useResponseFieldAsOutput(value: unknown): void;
  setRequestRecord(section: 'path' | 'query' | 'headers', record: Record<string, SdApiContractStructuralNode>): void;
  json(): string;
  diagnostics(): readonly SdApiContractDiagnostic[];
  activeStep(): number;
}

interface SourceEditorInternals {
  setMode(mode: unknown): void;
  setSource(value: unknown): void;
  setStaticScalar(value: unknown): void;
}

/** The drawer's protected surface, driven through the builder's real wiring. */
interface DrawerInternals {
  setName(value: unknown): void;
  setType(value: unknown): void;
  setRequired(value: unknown): void;
  enter(key: string): void;
  backTo(depth: number): void;
  addChild(): void;
  removeChild(key: string): void;
  applyCurrent(node: SdApiContractStructuralNode): void;
  currentName(): string;
  canSave(): boolean;
  save(): void;
}

describe('SdApiContractBuilder', () => {
  let fixture: ComponentFixture<SdApiContractBuilder>;
  let component: SdApiContractBuilder;
  let internals: BuilderInternals;
  let emissions: (SdApiContract | null)[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdApiContractBuilder, NoopAnimationsModule],
      providers: [provideSdApiContract(SD_API_CONTRACT_SAMPLE_ENVIRONMENT)],
    }).compileComponents();

    fixture = TestBed.createComponent(SdApiContractBuilder);
    component = fixture.componentInstance;
    internals = component as unknown as BuilderInternals;
    emissions = [];
    component.model.subscribe(value => emissions.push(value));
    fixture.componentRef.setInput('autoId', 'acb');
    fixture.detectChanges();
  });

  function seed(contract: SdApiContract = sdApiContractSearchSample()): SdApiContract {
    fixture.componentRef.setInput('model', contract);
    fixture.detectChanges();
    return contract;
  }

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function stepButtons(): HTMLButtonElement[] {
    return Array.from(host().querySelectorAll<HTMLButtonElement>('.sd-acb__step'));
  }

  function goToStep(index: number): void {
    stepButtons()[index].click();
    fixture.detectChanges();
  }

  function clickButton(selector: string): void {
    const element = host().querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`No element for "${selector}"`);
    const button = element.tagName === 'BUTTON' ? (element as HTMLButtonElement) : element.querySelector('button');
    if (!button) throw new Error(`No <button> inside "${selector}"`);
    button.click();
    fixture.detectChanges();
  }

  /**
   * The one drawer the builder owns.
   *
   * why đi qua đây thay vì tự dựng drawer trong spec: chỗ dễ sai nhất của contract này là DÂY NỐI —
   * danh sách nào yêu cầu, builder ghi commit về đâu. Tự dựng drawer sẽ test drawer lần thứ hai và
   * bỏ qua đúng phần dễ sai.
   */
  function drawer(): DrawerInternals {
    const found = fixture.debugElement.query(By.directive(SdApiContractNodeDrawer));
    if (!found) throw new Error('No drawer mounted');
    return found.componentInstance as unknown as DrawerInternals;
  }

  /** Clicks a collapsed row the way a user does, by its derived autoId. */
  function clickRow(section: string, key: string): void {
    const row = host().querySelector<HTMLElement>(`[data-autoid="acb-${section}-${key}"]`);
    if (!row) throw new Error(`No summary row for "${section}.${key}"`);
    row.click();
    fixture.detectChanges();
  }

  /** The input layer's root, unwrapped from the model's declaration typing. */
  function inputSchema(): SdApiContractStructuralNode {
    return component.model()!.input.schema as unknown as SdApiContractStructuralNode;
  }

  function saveDrawer(): void {
    drawer().save();
    fixture.detectChanges();
  }

  function typeInto(selector: string, value: string, event: 'input' | 'blur' = 'input'): void {
    const input = host().querySelector<HTMLInputElement>(selector);
    if (!input) throw new Error(`No input for "${selector}"`);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    if (event === 'blur') {
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
    }
  }

  // -------------------------------------------------------------------------

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  describe('empty state', () => {
    it('offers to create a contract when the model is null', () => {
      expect(host().querySelector('.sd-acb__empty')).not.toBeNull();
      expect(host().querySelector('.sd-acb__steps')).toBeNull();
    });

    it('creates a contract and emits exactly once', () => {
      clickButton('button[data-autoId$="acb-create"]');

      expect(emissions.length).toBe(1);
      expect(component.model()?.contractVersion).toBe(1);
      expect(host().querySelector('.sd-acb__steps')).not.toBeNull();
    });

    it('hides the create action when read-only', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      expect(host().querySelector('button[data-autoId$="acb-create"]')).toBeNull();
    });
  });

  describe('steps', () => {
    beforeEach(() => seed());

    it('renders all six steps', () => {
      expect(stepButtons().length).toBe(6);
      expect(host().querySelector('section[data-step="general"]')).not.toBeNull();
    });

    it('switches the visible section', () => {
      const expected = ['general', 'input', 'request', 'response', 'output', 'review'];
      expected.forEach((step, index) => {
        goToStep(index);
        expect(host().querySelector(`section[data-step="${step}"]`)).not.toBeNull();
      });
    });

    it('marks the active step for assistive technology, not by colour alone', () => {
      goToStep(2);
      expect(stepButtons()[2].getAttribute('aria-current')).toBe('step');
      expect(stepButtons()[0].getAttribute('aria-current')).toBeNull();
    });
  });

  describe('parent model synchronisation', () => {
    it('seeds an external contract without emitting back', () => {
      seed();

      expect(emissions.length).toBe(0);
      expect((host().querySelector('sd-input input') as HTMLInputElement).value).toBe('product.search');
    });

    it('shows an invalid external contract as-is instead of repairing it', () => {
      const broken = { contractVersion: 2, code: '', name: '' } as unknown as SdApiContract;
      seed(broken);
      goToStep(5);

      expect(emissions.length).toBe(0);
      expect(internals.diagnostics().map(diagnostic => diagnostic.code)).toContain('contract.version.invalid');
    });

    it('renders every step of a contract that is missing whole sections', () => {
      // why: regression — hoisting the suggestion computed lên `@let` gốc khiến nó chạy cho MỌI
      // contract, và một contract thiếu `input` đã làm nổ component. Contract sai vẫn phải xem được.
      seed({ contractVersion: 1, code: 'broken', name: 'Broken' } as unknown as SdApiContract);

      for (let step = 0; step < 6; step += 1) {
        expect(() => goToStep(step)).not.toThrow();
      }
      for (const step of [1, 2, 3, 4]) {
        goToStep(step);
        expect(host().querySelectorAll('.sd-acb__empty-text').length).withContext(`step ${step}`).toBeGreaterThan(0);
      }
      expect(internals.diagnostics().map(diagnostic => diagnostic.code)).toContain('schema.missing');
      expect(emissions.length).toBe(0);
    });

    it('never mutates the object the parent handed in', () => {
      const contract = seed();
      const snapshot = JSON.stringify(contract);

      typeInto('sd-input input', 'product.list');

      expect(JSON.stringify(contract)).toBe(snapshot);
      expect(component.model()).not.toBe(contract);
    });

    it('emits once per user action', () => {
      seed();

      typeInto('sd-input input', 'x');

      expect(emissions.length).toBe(1);
    });

    it('does not re-seed from its own emission', () => {
      seed();
      typeInto('sd-input input', 'x');
      const emitted = component.model();

      fixture.componentRef.setInput('model', emitted);
      fixture.detectChanges();

      expect(emissions.length).toBe(1);
    });
  });

  describe('schema editing', () => {
    beforeEach(() => {
      seed();
      goToStep(1);
    });

    it('opens the drawer for a new field without touching the contract yet', () => {
      clickButton('button[data-autoId$="acb-input-add"]');

      expect(Object.keys(inputSchema().properties ?? {})).toEqual(['keyword', 'page', 'createdFrom']);
      expect(emissions.length).toBe(0);
    });

    it('commits a new field once the drawer is saved', () => {
      clickButton('button[data-autoId$="acb-input-add"]');
      drawer().setName('perPage');
      saveDrawer();

      expect(Object.keys(inputSchema().properties ?? {})).toEqual(['keyword', 'page', 'createdFrom', 'perPage']);
      expect(emissions.length).toBe(1);
    });

    it('seeds the drawer from the schema row that was clicked', () => {
      clickRow('input', 'page');

      expect(drawer().currentName()).toBe('page');
    });

    it('renames a field from the drawer and keeps its position', () => {
      clickRow('input', 'page');
      drawer().setName('pageIndex');
      saveDrawer();

      expect(Object.keys(inputSchema().properties ?? {})).toEqual(['keyword', 'pageIndex', 'createdFrom']);
    });

    it('refuses a rename that collides with a sibling', () => {
      clickRow('input', 'page');
      drawer().setName('keyword');

      expect(drawer().canSave()).toBeFalse();

      saveDrawer();
      expect(Object.keys(inputSchema().properties ?? {})).toEqual(['keyword', 'page', 'createdFrom']);
      expect(emissions.length).toBe(0);
    });

    it('removes a field from its summary row', () => {
      const remove = host().querySelector<HTMLElement>('[data-autoid="acb-input-page-remove"]');
      expect(remove).withContext('remove button on the summary row').not.toBeNull();

      remove!.click();
      fixture.detectChanges();

      expect(Object.keys(inputSchema().properties ?? {})).toEqual(['keyword', 'createdFrom']);
    });

    it('changes a field type through the drawer', () => {
      clickRow('input', 'page');
      drawer().setType('string');
      saveDrawer();

      expect(inputSchema().properties!['page'].type).toBe('string');
      expect(emissions.length).toBe(1);
    });

    it('writes required:true, and drops the key entirely for not-required', () => {
      const page = (): SdApiContractStructuralNode => inputSchema().properties!['page'];

      clickRow('input', 'page');
      drawer().setRequired('true');
      saveDrawer();
      expect(page().required).toBeTrue();

      // why: UI chỉ có Có/Không. "Không" bỏ hẳn key thay vì ghi `false` — JSON sạch, và `false` do
      // người viết tay khai báo vẫn được serializer giữ nguyên (model vẫn là tri-state).
      clickRow('input', 'page');
      drawer().setRequired('false');
      saveDrawer();
      expect(page().required).toBeUndefined();
      expect('required' in page()).toBeFalse();
    });

    it('shows a declared required:false as not-required without rewriting it', () => {
      // why: seed KHÔNG được chuẩn hoá — `required: false` viết tay phải sống nguyên vẹn trong JSON.
      expect(emissions.length).toBe(0);
      expect(inputSchema().properties!['keyword'].required).toBeFalse();
      expect(internals.json()).toContain('"required": false');
    });

    it('lists an object field as one row and edits its children inside the drawer', () => {
      // why AC-008 nằm ở đây: danh sách ngoài PHẲNG — `customer` là MỘT hàng, không phải một cây.
      // Field con của nó chỉ tồn tại bên trong drawer, nên drill-down chết là object lồng nhau thành
      // read-only vĩnh viễn.
      seed(withNestedInput());
      goToStep(1);

      expect(host().querySelector('[data-autoid="acb-input-customer"]')).not.toBeNull();
      expect(host().querySelector('[data-autoid="acb-input-customer-id"]')).toBeNull();

      clickRow('input', 'customer');
      drawer().enter('id');
      drawer().setName('fullName');
      drawer().backTo(0);
      saveDrawer();

      const customer = inputSchema().properties!['customer'];
      expect(Object.keys(customer.properties ?? {})).toEqual(['fullName']);
      expect(emissions.length).toBe(1);
    });

    it('adds a child to an object field from inside the drawer', () => {
      seed(withNestedInput());
      goToStep(1);

      clickRow('input', 'customer');
      drawer().addChild();
      saveDrawer();

      expect(Object.keys(inputSchema().properties!['customer'].properties ?? {})).toEqual(['id', 'truong']);
    });

    it('removes a child of an object field from inside the drawer', () => {
      seed(withNestedInput());
      goToStep(1);

      clickRow('input', 'customer');
      drawer().removeChild('id');
      saveDrawer();

      expect(Object.keys(inputSchema().properties!['customer'].properties ?? {})).toEqual([]);
    });
  });

  // why cả describe("row layout") bị XOÁ: các test trong đó khẳng định hàng bảy ô, container query,
  // caption `.sd-acb-node__title` và `data-depth` của node editor cũ — đúng cái layout contract này
  // bỏ đi khi danh sách thu về hàng read-only. Bất biến thay thế mạnh hơn và nằm ở
  // describe("request mapping") / describe("schema editing"): danh sách không được chứa control sửa
  // được nào, và một object là MỘT hàng chứ không phải một cây.

  describe('request mapping', () => {
    beforeEach(() => {
      seed();
      goToStep(2);
    });

    it('opens the drawer for a new query entry without touching the contract yet', () => {
      // why: đây là điểm khác bản cũ. Trước đây bấm "Thêm" ghi ngay một entry rác vào contract; giờ
      // nó chỉ mở drawer, và người bấm nhầm rồi đóng lại không để lại dấu vết nào.
      clickButton('button[data-autoId$="acb-query-add"]');

      expect(Object.keys(component.model()!.req.query ?? {})).toEqual(['keyword', 'page', 'createdFrom']);
      expect(emissions.length).toBe(0);
    });

    it('commits a new query entry once the drawer is saved', () => {
      clickButton('button[data-autoId$="acb-query-add"]');
      drawer().setName('perPage');
      saveDrawer();

      expect(Object.keys(component.model()!.req.query ?? {})).toEqual(['keyword', 'page', 'createdFrom', 'perPage']);
      expect(emissions.length).toBe(1);
    });

    it('commits a new header entry once the drawer is saved', () => {
      clickButton('button[data-autoId$="acb-headers-add"]');
      drawer().setName('x-trace-id');
      saveDrawer();

      expect(Object.keys(component.model()!.req.headers ?? {})).toEqual(['Authorization', 'x-user-id', 'x-trace-id']);
    });

    it('seeds the drawer from the row that was clicked', () => {
      clickRow('query', 'page');

      expect(drawer().currentName()).toBe('page');
    });

    it('renames a query entry from the drawer and keeps its position', () => {
      // why kiểm thứ tự: rename đi qua `sdApiContractRecordRename` chứ không phải remove-rồi-add, nên
      // entry giữ đúng chỗ trong JSON. Nhảy xuống cuối là một diff bẩn cho người review contract.
      clickRow('query', 'page');
      drawer().setName('pageIndex');
      saveDrawer();

      expect(Object.keys(component.model()!.req.query ?? {})).toEqual(['keyword', 'pageIndex', 'createdFrom']);
    });

    it('refuses a query rename that collides with a sibling', () => {
      clickRow('query', 'page');
      drawer().setName('keyword');

      expect(drawer().canSave()).toBeFalse();

      saveDrawer();
      expect(Object.keys(component.model()!.req.query ?? {})).toEqual(['keyword', 'page', 'createdFrom']);
      expect(emissions.length).toBe(0);
    });

    it('removes a query entry from its summary row', () => {
      const remove = host().querySelector<HTMLElement>('[data-autoid="acb-query-page-remove"]');
      expect(remove).withContext('remove button on the summary row').not.toBeNull();

      remove!.click();
      fixture.detectChanges();

      expect(Object.keys(component.model()!.req.query ?? {})).toEqual(['keyword', 'createdFrom']);
    });

    it('adds and removes the request body', () => {
      clickButton('button[data-autoId$="acb-add-body"]');
      expect(component.model()!.req.body?.type).toBe('object');

      clickButton('button[data-autoId$="acb-remove-body"]');
      expect(component.model()!.req.body).toBeUndefined();
      expect('body' in component.model()!.req).toBeFalse();
    });

    it('switches a mapped node between source and static through the drawer', () => {
      // why đi qua drawer: source editor có 29 spec riêng rồi. Cái đáng test ở đây là commit hạ cánh
      // đúng vào `req.query.keyword` chứ không phải mode picker hoạt động.
      clickRow('query', 'keyword');
      drawer().applyCurrent({ type: 'string', value: 'phone' });
      saveDrawer();

      expect(component.model()!.req.query!['keyword'].value as unknown).toBe('phone');
      expect(component.model()!.req.query!['keyword'].source).toBeUndefined();

      clickRow('query', 'keyword');
      drawer().applyCurrent({ type: 'string', source: '${input.keyword}' });
      saveDrawer();

      expect(component.model()!.req.query!['keyword'].source).toBe('${input.keyword}');
      expect('value' in component.model()!.req.query!['keyword']).toBeFalse();
    });

    it('authors a composite template through the drawer', () => {
      clickRow('query', 'keyword');
      drawer().applyCurrent({ type: 'string', source: 'prefix-${input.keyword}' });
      saveDrawer();

      expect(component.model()!.req.query!['keyword'].source).toBe('prefix-${input.keyword}');
    });

    it('emits exactly one modelChange per Save, no matter how much was edited', () => {
      // why: đây là lời hứa công khai của component. Drawer sửa tên, type và mapping cùng lúc mà chỉ
      // được phát MỘT contract mới — nếu không, một hành động của người dùng thành ba lần cha re-render.
      const before = emissions.length;

      clickRow('query', 'page');
      drawer().setName('pageIndex');
      drawer().applyCurrent({ type: 'number', required: true, source: '${input.page}' });
      saveDrawer();

      expect(emissions.length - before).toBe(1);
    });

    it('keeps a contract-level problem savable, because diagnostics own it', () => {
      clickRow('query', 'keyword');
      drawer().applyCurrent({ type: 'string', source: '${input.khongTonTai}' });
      saveDrawer();

      expect(component.model()!.req.query!['keyword'].source).toBe('${input.khongTonTai}');
      expect(internals.diagnostics().some(diagnostic => diagnostic.code === 'mapping.reference.missing')).toBeTrue();
    });

    it('renders no editable control in the record list itself', () => {
      // why: bất biến của contract này. Một control lọt ra ngoài drawer là hai nguồn sự thật cho cùng
      // một node, và là đường để cây đổi giữa lúc drawer đang mở.
      const list = host().querySelector('[data-autoid="acb-query-add"]')?.closest('.sd-acb-record');
      const rows = host().querySelectorAll('[data-autoid^="acb-query-"]');
      expect(rows.length).toBeGreaterThan(0);

      for (const row of Array.from(rows)) {
        expect(row.querySelector('sd-input'))
          .withContext(row.getAttribute('data-autoid') ?? '')
          .toBeNull();
        expect(row.querySelector('sd-select'))
          .withContext(row.getAttribute('data-autoid') ?? '')
          .toBeNull();
        expect(row.querySelector('sd-code-editor')).toBeNull();
      }
      expect(list).withContext('record list container').not.toBeNull();
    });

    it('suggests input fields and injected env variables, marking the sensitive one without a value', () => {
      const suggestions = internals.requestSuggestions();
      const expressions = suggestions.map(suggestion => suggestion.expression);

      expect(expressions).toContain('${input.keyword}');
      expect(expressions).toContain('${env.baseUrl}');
      expect(expressions).toContain('${env.token}');
      expect(expressions.some(expression => expression.startsWith('${res.'))).toBeFalse();

      const token = suggestions.find(suggestion => suggestion.expression === '${env.token}');
      const sensitiveWord = TestBed.inject(I18nService).t('core.component.api-contract-builder.mapping.sensitive');
      expect(token?.display).toContain(sensitiveWord);
      expect(suggestions.find(suggestion => suggestion.expression === '${env.baseUrl}')?.display).not.toContain(sensitiveWord);
      // why: catalog CHỈ có định nghĩa — không có giá trị nào để lộ ra, kể cả cho biến không nhạy cảm.
      expect(JSON.stringify(suggestions)).not.toContain('http');
    });

    it('offers res references only in the output layer', () => {
      expect(internals.outputSuggestions().some(suggestion => suggestion.root === 'res')).toBeTrue();
    });

    it('reports an unknown env variable through diagnostics, and shows the row unmapped-free', () => {
      // why đổi chỗ khẳng định: hàng thu gọn không còn mang chẩn đoán từng node — nó chỉ đọc. Lỗi vẫn
      // phải nổi lên, chỉ là ở danh sách chẩn đoán và bước Kiểm tra, nơi người dùng thấy TẤT CẢ lỗi
      // cùng lúc thay vì phải cuộn qua từng hàng.
      const contract = sdApiContractSearchSample();
      contract.req.headers!['Authorization'] = { type: 'string', source: 'Bearer ${env.nope}' };
      seed(contract);
      goToStep(2);

      expect(internals.diagnostics().some(diagnostic => diagnostic.code === 'mapping.env.unknown')).toBeTrue();
      expect(host().querySelector('[data-autoid="acb-headers-Authorization"]')).not.toBeNull();
    });
  });

  describe('response and output', () => {
    beforeEach(() => seed());

    it('parses a comma separated status list', () => {
      goToStep(3);
      typeInto('sd-input.sd-acb__status input', '200, 201');

      expect(component.model()!.res.status).toEqual([200, 201]);
    });

    it('adopts a response array as the output and deep-copies the subtree', () => {
      const contract = component.model()!;
      goToStep(4);

      internals.useResponseFieldAsOutput('body.items');
      fixture.detectChanges();

      const output = component.model()!.output.schema as unknown as SdApiContractStructuralNode;
      expect(output.type).toBe('array');
      expect(output.source).toBe('${res.body.items}');
      expect(output.items?.properties?.['id'].type).toBe('string');

      const responseItems = (contract.res.body as unknown as SdApiContractStructuralNode).properties!['items'];
      expect(output.items).not.toBe(responseItems.items);
      expect(output).not.toBe(responseItems);
    });

    it('keeps the response declaration untouched when the adopted output is edited', () => {
      goToStep(4);
      internals.useResponseFieldAsOutput('body.items');
      fixture.detectChanges();

      // why xoá qua hàng: tầng output là `array`, field nằm ở `items.properties`. Danh sách phải tự
      // biết đọc `items` — đọc thẳng `properties` sẽ ra rỗng và cả tầng output thành không sửa được.
      const remove = host().querySelector<HTMLElement>('[data-autoid="acb-output-name-remove"]');
      expect(remove).withContext('remove button on the adopted output row').not.toBeNull();
      remove!.click();
      fixture.detectChanges();

      const output = component.model()!.output.schema as unknown as SdApiContractStructuralNode;
      const response = (component.model()!.res.body as unknown as SdApiContractStructuralNode).properties!['items'];
      expect(Object.keys(output.items!.properties ?? {})).toEqual(['id', 'createdAt']);
      expect(Object.keys(response.items!.properties ?? {})).toEqual(['id', 'name', 'createdAt']);
    });

    it('maps each branch of an adopted response object instead of mapping the object as a whole', () => {
      goToStep(4);
      internals.useResponseFieldAsOutput('body');
      fixture.detectChanges();

      const output = component.model()!.output.schema as unknown as SdApiContractStructuralNode;
      expect(output.type).toBe('object');
      expect(output.source).toBeUndefined();
      expect(output.properties!['items'].source).toBe('${res.body.items}');
      expect(internals.diagnostics().map(diagnostic => diagnostic.code)).not.toContain('mapping.object.conflict');
    });

    it('lists the leaf fields a dropdown or table consumer will see', () => {
      goToStep(4);

      const chips = Array.from(host().querySelectorAll('.sd-acb__field code')).map(node => node.textContent?.trim());
      expect(chips).toEqual(['id', 'name', 'createdAt']);
    });
  });

  describe('review', () => {
    it('keeps the JSON preview in sync with the draft', () => {
      seed();
      goToStep(5);

      expect(internals.json()).toContain('"code": "product.search"');
      goToStep(0);
      typeInto('sd-input input', 'product.list');
      goToStep(5);
      expect(internals.json()).toContain('"code": "product.list"');
      expect(internals.json()).not.toContain('expanded');
    });

    it('summarises the diagnostics and navigates to the offending step', () => {
      const contract = sdApiContractSearchSample();
      contract.req.url = '${env.baseUrl}/products/{id}';
      seed(contract);
      goToStep(5);

      const items = host().querySelectorAll('.sd-acb-diagnostics__item');
      expect(items.length).toBeGreaterThan(0);
      (items[0].querySelector('button') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(internals.activeStep()).toBe(2);
    });

    it('reports a valid contract with no diagnostics', () => {
      seed();
      goToStep(5);

      expect(host().querySelector('.sd-acb-diagnostics__badge[data-severity="ok"]')).not.toBeNull();
    });

    it('renders the review JSON as an editable editor so a contract can be pasted in', () => {
      seed();
      goToStep(5);

      const editor = fixture.debugElement.queryAll(By.directive(SdCodeEditor))[0];
      expect(editor).withContext('review step should host a code editor').toBeDefined();
      expect((editor.componentInstance as SdCodeEditor).viewed()).toBeFalse();
    });

    it('replaces the contract when a valid one is pasted, and re-formats it', () => {
      seed();
      goToStep(5);

      const pasted = sdApiContractCreateSample();
      internals.applyPastedJson(pasted as unknown);
      fixture.detectChanges();

      expect(component.model()!.code).toBe(pasted.code);
      // why: text hiển thị đi qua serializer nên format 2 space là tất định, không phụ thuộc chuỗi
      // người dùng dán vào.
      expect(internals.json()).toContain('\n  "code": ');
      expect(internals.diagnostics().some(diagnostic => diagnostic.code === 'contract.invalid')).toBeFalse();
    });

    it('keeps the contract and reports contract.invalid when the pasted JSON is malformed', () => {
      seed();
      goToStep(5);

      internals.applyPastedJson('{"code": ');
      fixture.detectChanges();

      expect(component.model()!.code).toBe('product.search');
      expect(internals.diagnostics().some(diagnostic => diagnostic.code === 'contract.invalid')).toBeTrue();
    });

    it('clears the paste error once a valid contract is pasted', () => {
      seed();
      goToStep(5);

      internals.applyPastedJson('{"code": ');
      fixture.detectChanges();
      expect(internals.diagnostics().some(diagnostic => diagnostic.code === 'contract.invalid')).toBeTrue();

      internals.applyPastedJson(sdApiContractCreateSample() as unknown);
      fixture.detectChanges();

      expect(internals.diagnostics().some(diagnostic => diagnostic.code === 'contract.invalid')).toBeFalse();
    });

    it('loads a pasted contract verbatim instead of repairing the missing parts', () => {
      seed();
      goToStep(5);

      // why: contract ngoài có thể thiếu/sai — component phải nạp nguyên trạng rồi CHẨN ĐOÁN. Tự
      // thêm `output.schema` hay `res` sẽ che đúng lỗi mà tác giả contract cần thấy.
      internals.applyPastedJson({ contractVersion: 1, code: 'partial', name: 'Partial', req: { method: 'GET', url: '/x' } });
      fixture.detectChanges();

      const model = component.model() as unknown as Record<string, unknown>;
      expect(model['code']).toBe('partial');
      expect('output' in model).toBeFalse();
      expect('res' in model).toBeFalse();
      expect(internals.diagnostics().length).toBeGreaterThan(0);
    });
  });

  describe('outputs', () => {
    it('emits diagnostics and validity', () => {
      const diagnostics: (readonly SdApiContractDiagnostic[])[] = [];
      const validity: boolean[] = [];
      component.diagnosticsChange.subscribe(value => diagnostics.push(value));
      component.validChange.subscribe(value => validity.push(value));

      const broken = sdApiContractSearchSample();
      broken.code = '';
      seed(broken);
      expect(diagnostics[diagnostics.length - 1].map(diagnostic => diagnostic.code)).toContain('contract.code.empty');
      expect(validity).toEqual([false]);

      seed(sdApiContractSearchSample());
      expect(diagnostics[diagnostics.length - 1]).toEqual([]);
      expect(validity).toEqual([false, true]);
    });

    it('emits validChange only when validity flips', () => {
      const validity: boolean[] = [];
      component.validChange.subscribe(value => validity.push(value));

      const broken = sdApiContractSearchSample();
      broken.req.url = '';
      seed(broken);
      goToStep(0);
      typeInto('sd-input input', 'a');
      typeInto('sd-input input', 'ab');

      // why: url vẫn rỗng nên contract vẫn sai — mỗi phím gõ KHÔNG được bắn lại cùng một trạng thái.
      expect(validity).toEqual([false]);
    });
  });

  describe('read-only modes', () => {
    it('disables every editor but keeps the contract visible', () => {
      seed();
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      expect(host().querySelector('.sd-acb__steps')).not.toBeNull();
      expect(host().querySelector<HTMLInputElement>('sd-input input')?.disabled).toBeTrue();
      goToStep(1);
      expect(host().querySelector('button[data-autoId$="acb-input-add"]')).toBeNull();
    });

    it('renders a summary and the JSON in view mode', () => {
      seed();
      fixture.componentRef.setInput('mode', 'view');
      fixture.detectChanges();

      expect(host().querySelector('.sd-acb__steps')).toBeNull();
      expect(host().querySelector('[data-field="code"]')?.textContent?.trim()).toBe('product.search');
      expect(host().querySelector('sd-code-editor')).not.toBeNull();
    });
  });

  describe('autoId', () => {
    it('stamps the host and propagates a derived id to the controls', () => {
      seed();

      expect(host().getAttribute('data-autoId')).toBe('acb');
      goToStep(1);
      expect(host().querySelector('button[data-autoId$="acb-input-add"]')).not.toBeNull();
    });

    it('omits the attributes when no autoId is given', () => {
      fixture.componentRef.setInput('autoId', undefined);
      seed();

      expect(host().getAttribute('data-autoId')).toBeNull();
      goToStep(2);
      expect(host().querySelector('button[data-autoId]')).toBeNull();
    });
  });
});

function withNestedInput(): SdApiContract {
  const contract = sdApiContractSearchSample();
  contract.input.schema = {
    type: 'object',
    properties: {
      keyword: { type: 'string' },
      customer: { type: 'object', properties: { id: { type: 'string' } } },
    },
  };
  contract.req.query = { keyword: { type: 'string', source: '${input.keyword}' } };
  return contract;
}
