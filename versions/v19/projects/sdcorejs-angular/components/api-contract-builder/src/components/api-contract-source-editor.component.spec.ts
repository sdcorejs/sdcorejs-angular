import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdCodeEditor } from '@sdcorejs/angular/components/code-editor';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdSelect } from '@sdcorejs/angular/forms/select';

import { provideSdApiContract } from '../api-contract.configuration';
import { SD_API_CONTRACT_SAMPLE_ENVIRONMENT } from '../api-contract.samples';
import type { SdApiContractStructuralNode } from '../api-contract.schema';
import { SdApiContractSourceEditor, type SdApiContractValueMode } from './api-contract-source-editor.component';
import type { SdApiContractSuggestion } from './api-contract-suggestion.model';

/** Typed window onto the protected surface — the specs drive behaviour, not private state. */
interface SourceEditorInternals {
  mode(): SdApiContractValueMode;
  modeOptions(): { value: string; label: string }[];
  modeValue(): SdApiContractValueMode | null;
  sourceOptions(): SdApiContractSuggestion[];
  setMode(mode: unknown): void;
  setSource(value: unknown): void;
  setStaticScalar(value: unknown): void;
  setStaticTemporal(value: unknown): void;
  setStaticJson(value: unknown): void;
}

const SUGGESTIONS: readonly SdApiContractSuggestion[] = [
  { expression: '${input.keyword}', path: 'input.keyword', root: 'input', type: 'string', display: 'input.keyword' },
  { expression: '${input.page}', path: 'input.page', root: 'input', type: 'number', display: 'input.page' },
  { expression: '${env.token}', path: 'env.token', root: 'env', type: 'string', display: 'env.token' },
];

describe('SdApiContractSourceEditor', () => {
  let fixture: ComponentFixture<SdApiContractSourceEditor>;
  let internals: SourceEditorInternals;
  let emissions: SdApiContractStructuralNode[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdApiContractSourceEditor, NoopAnimationsModule],
      providers: [provideSdApiContract(SD_API_CONTRACT_SAMPLE_ENVIRONMENT)],
    }).compileComponents();

    fixture = TestBed.createComponent(SdApiContractSourceEditor);
    internals = fixture.componentInstance as unknown as SourceEditorInternals;
    emissions = [];
    fixture.componentInstance.nodeChange.subscribe(node => emissions.push(node));
    fixture.componentRef.setInput('suggestions', SUGGESTIONS);
    fixture.componentRef.setInput('autoId', 'acb');
  });

  /** Seeds the node input and settles the view, so every spec starts from a rendered row. */
  function seed(node: SdApiContractStructuralNode): void {
    fixture.componentRef.setInput('node', node);
    fixture.detectChanges();
  }

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  describe('mode derivation', () => {
    it('reads a whole-value reference as the source mode', () => {
      seed({ type: 'string', source: '${input.keyword}' });

      expect(internals.mode()).toBe('source');
    });

    it('keeps an unresolved reference in the source mode rather than demoting it', () => {
      // why: `${input.khongTonTai}` là một reference SẠCH, chỉ trỏ sai. Đẩy nó sang `advanced` sẽ bắt
      // người dùng sửa lỗi chính tả bằng ô text thô, còn validation đã báo `mapping.reference.missing`.
      seed({ type: 'string', source: '${input.khongTonTai}' });

      expect(internals.mode()).toBe('source');
    });

    it('reads a composite template as the advanced mode', () => {
      seed({ type: 'string', source: 'Bearer ${env.token}' });

      expect(internals.mode()).toBe('advanced');
    });

    it('reads a reference-free string as the advanced mode', () => {
      seed({ type: 'string', source: 'plain text' });

      expect(internals.mode()).toBe('advanced');
    });

    it('still reads static, nested and none from the absence of a source', () => {
      seed({ type: 'string', value: 'x' });
      expect(internals.mode()).toBe('static');

      seed({ type: 'object', properties: {} });
      expect(internals.mode()).toBe('nested');

      seed({ type: 'string' });
      expect(internals.mode()).toBe('none');
    });

    it('reads an empty source as the source mode waiting for a pick', () => {
      // why: `setMode('source')` ghi `source: ''`. Nếu chuỗi rỗng bị coi là template rác thì hàng sẽ
      // nhảy sang `advanced` ngay khi vừa chọn "Lấy từ nguồn" — rỗng nghĩa là CHƯA chọn.
      seed({ type: 'string', source: '' });

      expect(internals.mode()).toBe('source');
    });
  });

  describe('advanced mode', () => {
    it('offers the advanced mode for scalar, object and array nodes', () => {
      seed({ type: 'string', source: '${input.keyword}' });
      expect(internals.modeOptions().map(option => option.value)).toContain('advanced');

      seed({ type: 'object', source: '${input.keyword}' });
      expect(internals.modeOptions().map(option => option.value)).toContain('advanced');

      seed({ type: 'array', source: '${input.keyword}' });
      expect(internals.modeOptions().map(option => option.value)).toContain('advanced');
    });

    it('renders a raw expression input holding the composite template verbatim', () => {
      seed({ type: 'string', source: 'Bearer ${env.token}' });

      const raw = host().querySelector<HTMLInputElement>('input[data-autoid="forms-input-acb-advanced"]');
      expect(raw).not.toBeNull();
      expect(raw!.value).toBe('Bearer ${env.token}');
    });

    it('round-trips a composite template unchanged through the advanced input', () => {
      seed({ type: 'string', source: 'Bearer ${env.token}' });

      internals.setSource('Bearer ${env.token}');

      expect(emissions.length).toBe(1);
      expect(emissions[0].source).toBe('Bearer ${env.token}');
      expect('value' in emissions[0]).toBeFalse();
    });

    it('switching into advanced flips the view without dirtying the contract', () => {
      seed({ type: 'string', source: '${input.keyword}' });

      internals.setMode('advanced');
      fixture.detectChanges();

      // why: mode là state của GIAO DIỆN, không nằm trong contract. Node đã có key `source` nên đổi
      // mode không thay đổi model — emit ở đây là một modelChange giả.
      expect(internals.mode()).toBe('advanced');
      expect(emissions.length).toBe(0);
    });

    it('switching into advanced from an unmapped node creates the source key to type into', () => {
      seed({ type: 'string' });

      internals.setMode('advanced');

      expect(emissions.length).toBe(1);
      expect(emissions[0].source).toBe('');
    });

    it('keeps the advanced view when the typed template becomes a clean reference', () => {
      seed({ type: 'string', source: 'Bearer ${env.token}' });
      expect(internals.mode()).toBe('advanced');

      // why: người dùng xoá dần tiền tố cho tới khi còn đúng một reference. Nếu mode tự nhảy về
      // `source` thì ô text đang gõ biến thành dropdown giữa lúc gõ.
      seed({ type: 'string', source: '${env.token}' });

      expect(internals.mode()).toBe('advanced');
    });

    it('leaves advanced when the node stops carrying a source at all', () => {
      seed({ type: 'string', source: 'Bearer ${env.token}' });
      expect(internals.mode()).toBe('advanced');

      seed({ type: 'string', value: 'literal' });

      expect(internals.mode()).toBe('static');
    });
  });

  describe('source mode', () => {
    it('renders exactly one source control and drops the expression box and insert picker', () => {
      seed({ type: 'string', source: '${input.keyword}' });

      // why: khẳng định qua autoId của từng sd-select thay vì qua attribute DOM — attribute là chi
      // tiết nội bộ của sd-select, còn autoId là hợp đồng hàng này khai báo.
      const selectAutoIds = fixture.debugElement
        .queryAll(By.directive(SdSelect))
        .map(node => (node.componentInstance as SdSelect).autoId());
      expect(selectAutoIds).toEqual(['forms-select-acb-mode', 'forms-select-acb-source']);

      expect(fixture.debugElement.queryAll(By.directive(SdInput)).length).toBe(0);
    });

    it('picking a source overwrites the expression instead of appending to it', () => {
      seed({ type: 'string', source: '${input.keyword}' });

      internals.setSource('${env.token}');

      expect(emissions.length).toBe(1);
      expect(emissions[0].source).toBe('${env.token}');
    });

    it('offers the type-compatible suggestions, falling back to all of them', () => {
      seed({ type: 'string', source: '' });
      expect(internals.sourceOptions().map(option => option.expression)).toEqual(['${input.keyword}', '${env.token}']);

      // why: không gợi ý nào khớp `boolean`, nhưng giấu hết thì hàng thành ô chết — trả toàn bộ.
      seed({ type: 'boolean', source: '' });
      expect(internals.sourceOptions().length).toBe(SUGGESTIONS.length);
    });

    it('keeps a stored path that no longer exists visible instead of silently clearing it', () => {
      // why: trường bị xoá/đổi tên vẫn phải hiện trong dropdown, nếu không giá trị đang lưu biến mất
      // khỏi giao diện mà contract vẫn giữ nó — người dùng không có cách nào thấy để sửa.
      seed({ type: 'string', source: '${input.khongTonTai}' });

      const options = internals.sourceOptions().map(option => option.expression);
      expect(options).toContain('${input.khongTonTai}');
      expect(emissions.length).toBe(0);
    });
  });

  describe('static mode renders a control that matches the declared type', () => {
    it('uses a text input for string', () => {
      seed({ type: 'string', value: 'x' });

      expect(fixture.debugElement.queryAll(By.directive(SdInput)).length).toBe(1);
    });

    it('uses a number input for number', () => {
      seed({ type: 'number', value: 3 });

      expect(fixture.debugElement.queryAll(By.directive(SdInputNumber)).length).toBe(1);
      expect(fixture.debugElement.queryAll(By.directive(SdInput)).length).toBe(0);
    });

    it('uses a date picker for date and a datetime picker for datetime', () => {
      seed({ type: 'date', value: '2026-08-17' });
      expect(fixture.debugElement.queryAll(By.directive(SdDate)).length).toBe(1);

      seed({ type: 'datetime', value: '2026-08-17T08:00:00.000Z' });
      expect(fixture.debugElement.queryAll(By.directive(SdDatetime)).length).toBe(1);
    });

    it('keeps the yes/no picker for boolean', () => {
      seed({ type: 'boolean', value: true });

      const selectAutoIds = fixture.debugElement
        .queryAll(By.directive(SdSelect))
        .map(node => (node.componentInstance as SdSelect).autoId());
      expect(selectAutoIds).toEqual(['forms-select-acb-mode', 'forms-select-acb-static']);
    });

    it('uses a JSON code editor for object and array', () => {
      seed({ type: 'object', value: { a: 1 } });
      let editors = fixture.debugElement.queryAll(By.directive(SdCodeEditor));
      expect(editors.length).toBe(1);
      expect((editors[0].componentInstance as SdCodeEditor).language()).toBe('json');

      seed({ type: 'array', value: [1, 2] });
      editors = fixture.debugElement.queryAll(By.directive(SdCodeEditor));
      expect(editors.length).toBe(1);
    });

    it('offers the static mode for object and array', () => {
      seed({ type: 'object', properties: {} });
      expect(internals.modeOptions().map(option => option.value)).toContain('static');

      seed({ type: 'array', items: { type: 'string' } });
      expect(internals.modeOptions().map(option => option.value)).toContain('static');
    });
  });

  describe('static value writes', () => {
    it('stores a parsed object when the JSON editor emits one', () => {
      seed({ type: 'object', value: {} });

      internals.setStaticJson({ a: 1, b: ['x'] });

      expect(emissions.length).toBe(1);
      // why: so sánh qua JSON — `SdApiContractJsonValue` là union đệ quy, đưa object literal vào
      // `toEqual` làm TypeScript nổ TS2589 ("type instantiation is excessively deep").
      expect(JSON.stringify(emissions[0].value)).toBe('{"a":1,"b":["x"]}');
    });

    it('ignores a half-typed JSON string so the stored literal survives', () => {
      // why: `<sd-code-editor language="json">` bắn ra STRING khi cú pháp còn dở (`{"a":`). Ghi chuỗi
      // đó vào contract là biến một literal object thành rác — giữ giá trị hợp lệ cuối cùng.
      seed({ type: 'object', value: { a: 1 } });

      internals.setStaticJson('{"a":');

      expect(emissions.length).toBe(0);
    });

    it('stores a temporal literal as an ISO string, not a locale string', () => {
      // why: `String(new Date())` ra `Mon Aug 17 2026 …` — không parse lại được và phụ thuộc locale
      // của máy tác giả. Contract phải mang giá trị ổn định.
      seed({ type: 'datetime', value: '' });

      internals.setStaticTemporal(new Date('2026-08-17T08:00:00.000Z'));

      expect(emissions.length).toBe(1);
      expect(emissions[0].value as unknown).toBe('2026-08-17T08:00:00.000Z');
    });

    it('passes a temporal string straight through', () => {
      seed({ type: 'date', value: '' });

      internals.setStaticTemporal('2026-08-17');

      expect(emissions[0].value as unknown).toBe('2026-08-17');
    });

    it('clears a temporal literal to an empty string when the picker is emptied', () => {
      seed({ type: 'date', value: '2026-08-17' });

      internals.setStaticTemporal(null);

      expect(emissions[0].value as unknown).toBe('');
    });
  });
  describe('the mode picker treats an unmapped node as "not chosen yet"', () => {
    it('drops the "Chưa gán" option for every node type', () => {
      for (const node of [
        { type: 'string' } as SdApiContractStructuralNode,
        { type: 'array', items: { type: 'string' } } as SdApiContractStructuralNode,
        { type: 'object', properties: {} } as SdApiContractStructuralNode,
      ]) {
        seed(node);
        expect(internals.modeOptions().map(option => option.value))
          .withContext(node.type)
          .not.toContain('none');
      }
    });

    it('leaves the picker empty rather than showing a value for an unmapped node', () => {
      // why: `none` không còn là một lựa chọn, nên hiển thị nó như một giá trị đã chọn là nói dối —
      // chưa gán nghĩa là CHƯA CHỌN, và ô phải trống để required bắt được.
      seed({ type: 'string' });

      expect(internals.mode()).toBe('none');
      expect(internals.modeValue()).toBeNull();
    });

    it('shows a real selection once the node carries a mapping', () => {
      seed({ type: 'string', source: '${input.keyword}' });
      expect(internals.modeValue()).toBe('source');

      seed({ type: 'string', value: 'x' });
      expect(internals.modeValue()).toBe('static');

      seed({ type: 'object', properties: {} });
      expect(internals.modeValue()).toBe('nested');
    });

    it('marks the picker required so an unmapped node is flagged in the row', () => {
      seed({ type: 'string' });

      const picker = fixture.debugElement
        .queryAll(By.directive(SdSelect))
        .find(node => (node.componentInstance as SdSelect).autoId() === 'forms-select-acb-mode');
      expect(picker).withContext('mode picker').toBeDefined();
      expect((picker!.componentInstance as SdSelect).required()).toBeTrue();
    });
  });
});
