import { SdAutoidHighlightService } from './autoid-highlight.service';

describe('SdAutoidHighlightService', () => {
  let svc: SdAutoidHighlightService;
  let root: HTMLElement;

  beforeEach(() => {
    svc = new SdAutoidHighlightService();
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  afterEach(() => root.remove());

  it('apply outline trên element unique với marker ok (target = chính node khi không có sd-* ancestor)', () => {
    root.innerHTML = `<input data-autoid="a"/>`;
    svc.apply(root);
    const el = root.querySelector('input') as HTMLElement;
    expect(el.style.outline).toContain('solid');
    expect(el.style.outline).toContain('var(--sd-success');
    expect(el.style.outlineOffset).toBe('2px');
    expect(el.getAttribute('data-sd-autoid-highlight')).toBe('ok');
  });

  it('apply outline đỏ trên target = sd-* host cha (không phải input con)', () => {
    root.innerHTML = `<sd-input><input data-autoid="d"/></sd-input><sd-input><input data-autoid="d"/></sd-input>`;
    svc.apply(root);
    // Highlight ở sd-input host, KHÔNG ở <input> con.
    root.querySelectorAll('sd-input').forEach(el => {
      const e = el as HTMLElement;
      expect(e.getAttribute('data-sd-autoid-highlight')).toBe('duplicate');
      expect(e.style.outline).toContain('var(--sd-error');
    });
    root.querySelectorAll('input').forEach(el => {
      expect((el as HTMLElement).hasAttribute('data-sd-autoid-highlight')).toBe(false);
    });
  });

  it('apply dedupe khi nhiều [data-autoid] chia sẻ 1 sd-* host', () => {
    root.innerHTML = `<sd-date-range>
      <input data-autoid="forms-date-range-from"/>
      <input data-autoid="forms-date-range-to"/>
    </sd-date-range>`;
    svc.apply(root);
    const host = root.querySelector('sd-date-range') as HTMLElement;
    expect(host.getAttribute('data-sd-autoid-highlight')).toBe('ok');
    // Chỉ 1 marker trên host (không apply 2 lần).
    expect(root.querySelectorAll('[data-sd-autoid-highlight]').length).toBe(1);
  });

  it('apply idempotent — gọi lần 2 vẫn restore đúng style gốc', () => {
    root.innerHTML = `<input data-autoid="a" style="outline: 1px solid blue;"/>`;
    const el = root.querySelector('input') as HTMLElement;
    const originalOutline = el.style.outline;
    svc.apply(root);
    svc.apply(root);
    svc.clear(root);
    expect(el.style.outline).toBe(originalOutline);
  });

  it('clear remove mọi attribute marker và restore style', () => {
    root.innerHTML = `<input data-autoid="a"/>`;
    const el = root.querySelector('input') as HTMLElement;
    el.style.backgroundColor = 'yellow';
    svc.apply(root);
    svc.clear(root);
    expect(el.hasAttribute('data-sd-autoid-highlight')).toBe(false);
    expect(el.hasAttribute('data-sd-autoid-prev-outline')).toBe(false);
    expect(el.hasAttribute('data-sd-autoid-prev-outline-offset')).toBe(false);
    expect(el.hasAttribute('data-sd-autoid-prev-radius')).toBe(false);
    expect(el.style.backgroundColor).toBe('yellow');
  });

  it('applyMissing đánh dấu dashed warning', () => {
    root.innerHTML = `<sd-input></sd-input>`;
    const node = root.querySelector('sd-input') as HTMLElement;
    svc.applyMissing([node]);
    expect(node.style.outline).toContain('dashed');
    expect(node.style.outline).toContain('var(--sd-warning');
    expect(node.getAttribute('data-sd-autoid-highlight')).toBe('missing');
  });

  it('applyMissing skip element đã có marker từ apply', () => {
    root.innerHTML = `<sd-input data-autoid="a"></sd-input>`;
    svc.apply(root);
    const node = root.querySelector('sd-input') as HTMLElement;
    svc.applyMissing([node]);
    expect(node.getAttribute('data-sd-autoid-highlight')).toBe('ok');
  });
});
