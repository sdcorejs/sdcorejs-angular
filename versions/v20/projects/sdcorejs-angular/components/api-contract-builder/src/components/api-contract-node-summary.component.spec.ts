import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import type { SdApiContractStructuralNode } from '../api-contract.schema';
import { SdApiContractNodeSummary } from './api-contract-node-summary.component';

describe('SdApiContractNodeSummary', () => {
  let fixture: ComponentFixture<SdApiContractNodeSummary>;
  let edits: number;
  let removes: number;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdApiContractNodeSummary, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SdApiContractNodeSummary);
    edits = 0;
    removes = 0;
    fixture.componentInstance.edit.subscribe(() => (edits += 1));
    fixture.componentInstance.remove.subscribe(() => (removes += 1));
    fixture.componentRef.setInput('autoId', 'acb-row');
  });

  /** Seeds the row and settles the view, so every spec starts from rendered markup. */
  function seed(name: string, node: SdApiContractStructuralNode, readonly = false): void {
    fixture.componentRef.setInput('name', name);
    fixture.componentRef.setInput('node', node);
    fixture.componentRef.setInput('readonly', readonly);
    fixture.detectChanges();
  }

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(selector: string): string {
    return (host().querySelector(selector)?.textContent ?? '').trim();
  }

  describe('what the row shows', () => {
    it('shows the name and the declared type', () => {
      seed('keyword', { type: 'string', source: '${input.keyword}' });

      expect(text('.sd-acb-row__name')).toBe('keyword');
      expect(text('.sd-acb-row__type')).toBe('string');
    });

    it('summarises a whole-value reference with the path only, not the delimiters', () => {
      // why: `${…}` là cú pháp, không phải thông tin. Hàng thu gọn để QUÉT, nên chỉ cần đường dẫn.
      seed('keyword', { type: 'string', source: '${input.keyword}' });

      expect(text('.sd-acb-row__mapping')).toBe('← input.keyword');
    });

    it('summarises a composite template verbatim, delimiters and all', () => {
      // why: template ghép không rút gọn được mà vẫn đúng — hiện nguyên văn để tác giả nhận ra nó.
      seed('Authorization', { type: 'string', source: 'Bearer ${env.token}' });

      expect(text('.sd-acb-row__mapping')).toBe('← Bearer ${env.token}');
    });

    it('summarises a static literal with its value', () => {
      seed('version', { type: 'string', value: 'v2' });
      expect(text('.sd-acb-row__mapping')).toBe('= "v2"');

      seed('soLuong', { type: 'number', value: 10 });
      expect(text('.sd-acb-row__mapping')).toBe('= 10');

      seed('conHang', { type: 'boolean', value: true });
      expect(text('.sd-acb-row__mapping')).toBe('= true');
    });

    it('summarises an object by how many fields it carries', () => {
      seed('boLoc', {
        type: 'object',
        properties: {
          mau: { type: 'string' },
          size: { type: 'string' },
          tuNgay: { type: 'date' },
          denNgay: { type: 'date' },
        },
      });

      expect(text('.sd-acb-row__mapping')).toBe('4 trường');
    });

    it('says a node is unmapped when it carries neither source nor value', () => {
      seed('page', { type: 'number' });

      expect(text('.sd-acb-row__mapping')).toBe('chưa gán');
    });

    it('shows the required badge only when required is exactly true', () => {
      seed('page', { type: 'number', required: true });
      expect(host().querySelector('.sd-acb-row__required')).not.toBeNull();

      seed('page', { type: 'number', required: false });
      expect(host().querySelector('.sd-acb-row__required')).toBeNull();

      seed('page', { type: 'number' });
      expect(host().querySelector('.sd-acb-row__required')).toBeNull();
    });
  });

  describe('the row is read-only and delegates every action', () => {
    it('renders no editable control at all', () => {
      // why: đây là bất biến của cả contract này — cây ngoài drawer chỉ ĐỌC. Một control lọt vào đây
      // là hai nguồn sự thật cho cùng một node.
      seed('keyword', { type: 'string', source: '${input.keyword}' });

      expect(host().querySelector('input')).toBeNull();
      expect(host().querySelector('select')).toBeNull();
      expect(host().querySelector('textarea')).toBeNull();
      expect(host().querySelector('sd-input')).toBeNull();
      expect(host().querySelector('sd-select')).toBeNull();
      expect(host().querySelector('sd-code-editor')).toBeNull();
    });

    it('emits edit when the row is activated', () => {
      seed('keyword', { type: 'string' });

      (host().querySelector('.sd-acb-row') as HTMLElement).click();

      expect(edits).toBe(1);
      expect(removes).toBe(0);
    });

    it('emits remove from the delete button without also emitting edit', () => {
      // why: nút xoá nằm TRONG hàng, nên click nó sẽ nổi bọt lên hàng và mở luôn drawer nếu không
      // chặn — người dùng bấm xoá lại thấy form hiện ra.
      seed('keyword', { type: 'string' });

      (host().querySelector('.sd-acb-row__remove') as HTMLElement).click();

      expect(removes).toBe(1);
      expect(edits).toBe(0);
    });

    it('hides the delete button and stops emitting edit when readonly', () => {
      seed('keyword', { type: 'string' }, true);

      expect(host().querySelector('.sd-acb-row__remove')).toBeNull();

      (host().querySelector('.sd-acb-row') as HTMLElement).click();
      expect(edits).toBe(0);
    });
  });

  describe('autoId', () => {
    it('derives the row and the delete button from the autoId input', () => {
      seed('keyword', { type: 'string' });

      expect(host().querySelector('[data-autoid="acb-row"]')).not.toBeNull();
      expect(host().querySelector('[data-autoid="acb-row-remove"]')).not.toBeNull();
    });

    it('emits no autoId attribute when the input is unset', () => {
      fixture.componentRef.setInput('autoId', undefined);
      seed('keyword', { type: 'string' });

      expect(host().querySelector('[data-autoid]')).toBeNull();
    });
  });
});
