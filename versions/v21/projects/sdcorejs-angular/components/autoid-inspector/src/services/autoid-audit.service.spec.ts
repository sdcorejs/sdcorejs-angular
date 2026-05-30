import { SdAutoidAuditService } from './autoid-audit.service';
import { SdAutoidScannerService } from './autoid-scanner.service';

describe('SdAutoidAuditService', () => {
  let scan: SdAutoidScannerService;
  let svc: SdAutoidAuditService;
  let root: HTMLElement;

  beforeEach(() => {
    scan = new SdAutoidScannerService();
    svc = new SdAutoidAuditService();
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  afterEach(() => root.remove());

  it('audit empty page → total=0, no missing/duplicate', () => {
    const result = svc.audit(scan.scan(root), { root });
    expect(result.total).toBe(0);
    expect(result.duplicateCount).toBe(0);
    expect(result.missingCount).toBe(0);
  });

  it('audit phát hiện duplicate', () => {
    root.innerHTML = `
      <input data-autoid="dup"/>
      <input data-autoid="dup"/>
    `;
    const res = svc.audit(scan.scan(root), { root });
    expect(res.duplicateCount).toBe(1);
    expect(res.duplicates['dup']).toBe(2);
  });

  it('audit flag sd-input thiếu autoid là missing', () => {
    root.innerHTML = `
      <sd-input><input placeholder="Tên"/></sd-input>
      <sd-button><button data-autoid="button-ok">OK</button></sd-button>
    `;
    const res = svc.audit(scan.scan(root), { root });
    expect(res.missingCount).toBe(1);
    expect(res.missing[0].tag).toBe('sd-input');
  });

  it('sd-button có descendant data-autoid → KHÔNG flag missing', () => {
    root.innerHTML = `<sd-button><button data-autoid="button-ok">OK</button></sd-button>`;
    const res = svc.audit(scan.scan(root), { root });
    expect(res.missingCount).toBe(0);
  });

  it('audit honour requireSelectors custom', () => {
    root.innerHTML = `<custom-input></custom-input>`;
    const res = svc.audit([], { root, requireSelectors: ['custom-input'] });
    expect(res.missingCount).toBe(1);
    expect(res.missing[0].tag).toBe('custom-input');
  });

  it('missing entry chứa selector path 4 cấp tối đa', () => {
    root.innerHTML = `<div id="container"><section><sd-input></sd-input></section></div>`;
    const res = svc.audit([], { root });
    expect(res.missing[0].selector).toContain('sd-input');
  });

  it('missing.outerHtmlPreview cắt > 160 ký tự thêm "..."', () => {
    const longLabel = 'x'.repeat(200);
    root.innerHTML = `<sd-input label="${longLabel}"></sd-input>`;
    const res = svc.audit([], { root });
    expect(res.missing[0].outerHtmlPreview.length).toBeLessThanOrEqual(160);
    expect(res.missing[0].outerHtmlPreview.endsWith('...')).toBe(true);
  });
});
