import { SdAutoidScannerService } from './autoid-scanner.service';

describe('SdAutoidScannerService', () => {
  let svc: SdAutoidScannerService;
  let root: HTMLElement;

  beforeEach(() => {
    svc = new SdAutoidScannerService();
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  afterEach(() => root.remove());

  it('scan trả mảng rỗng khi không có [data-autoid]', () => {
    root.innerHTML = '<div><span>no autoid</span></div>';
    expect(svc.scan(root)).toEqual([]);
  });

  it('scan trả element với stt tăng dần, xpath đúng format', () => {
    root.innerHTML = `
      <sd-input><input data-autoid="forms-input-email" placeholder="Email"/></sd-input>
      <sd-button><button data-autoid="button-submit">Submit</button></sd-button>
    `;
    const result = svc.scan(root);
    expect(result.length).toBe(2);
    expect(result[0].stt).toBe(1);
    expect(result[1].stt).toBe(2);
    expect(result[0].autoid).toBe('forms-input-email');
    expect(result[0].xpath).toBe('//*[@data-autoid="forms-input-email"]');
  });

  it('scan resolve tag = sd-* parent gần nhất', () => {
    root.innerHTML = `<sd-input><div><input data-autoid="forms-input-email"/></div></sd-input>`;
    const [el] = svc.scan(root);
    expect(el.tag).toBe('sd-input');
  });

  it('scan resolve tag = chính element khi không có sd-* parent', () => {
    root.innerHTML = `<button data-autoid="button-x">x</button>`;
    const [el] = svc.scan(root);
    expect(el.tag).toBe('button');
  });

  it('scan flag duplicate khi nhiều element cùng autoid', () => {
    root.innerHTML = `
      <input data-autoid="dup"/>
      <input data-autoid="dup"/>
      <input data-autoid="unique"/>
    `;
    const result = svc.scan(root);
    expect(result.filter(r => r.duplicate).length).toBe(2);
    expect(result.find(r => r.autoid === 'unique')!.duplicate).toBe(false);
  });

  it('resolveName ưu tiên label[for=id]', () => {
    root.innerHTML = `
      <label for="x-email">Email address</label>
      <input id="x-email" data-autoid="forms-input-email"/>
    `;
    const [el] = svc.scan(root);
    expect(el.name).toBe('Email address');
  });

  it('resolveName fallback aria-label → placeholder → title', () => {
    root.innerHTML = `<input data-autoid="a" aria-label="ARIA"/>`;
    expect(svc.scan(root)[0].name).toBe('ARIA');

    root.innerHTML = `<input data-autoid="b" placeholder="PH"/>`;
    expect(svc.scan(root)[0].name).toBe('PH');

    root.innerHTML = `<div data-autoid="c" title="T">x</div>`;
    expect(svc.scan(root)[0].name).toBe('T');
  });

  it('resolveName CSS.escape cho id ký tự đặc biệt (không throw)', () => {
    root.innerHTML = `
      <label for="x.y">Special</label>
      <input id="x.y" data-autoid="weird"/>
    `;
    expect(() => svc.scan(root)).not.toThrow();
  });

  it('resolveText lấy input.value hoặc textContent ≤ 80 ký tự', () => {
    root.innerHTML = `<input data-autoid="a" value="hello"/>`;
    expect(svc.scan(root)[0].text).toBe('hello');

    const long = 'x'.repeat(120);
    root.innerHTML = `<div data-autoid="b">${long}</div>`;
    expect(svc.scan(root)[0].text.length).toBe(80);
  });

  it('groupByAutoid map autoid → element[]', () => {
    root.innerHTML = `
      <input data-autoid="dup"/>
      <input data-autoid="dup"/>
    `;
    const grouped = svc.groupByAutoid(svc.scan(root));
    expect(grouped['dup'].length).toBe(2);
  });

  it('scan reads data-disabled / data-loading / data-empty / data-value into state object', () => {
    root.innerHTML = `
      <input data-autoid="forms-input-email"
             data-disabled="true"
             data-loading="false"
             data-empty="true"
             data-value="test@example.com"/>
    `;
    const [el] = svc.scan(root);
    expect(el.state.disabled).toBe('true');
    expect(el.state.loading).toBe('false');
    expect(el.state.empty).toBe('true');
    expect(el.state.dataValue).toBe('test@example.com');
    // Attributes not on DOM → undefined.
    expect(el.state.invalid).toBeUndefined();
    expect(el.state.opened).toBeUndefined();
    expect(el.state.count).toBeUndefined();
  });

  it('scan resolves tableScope to closest sd-table\'s data-autoid', () => {
    root.innerHTML = `
      <sd-table data-autoid="components-table-employees">
        <input data-autoid="forms-input-search"/>
      </sd-table>
    `;
    const results = svc.scan(root);
    // forms-input-search is inside sd-table → tableScope = table autoid
    const inner = results.find(e => e.autoid === 'forms-input-search');
    expect(inner?.tableScope).toBe('components-table-employees');
  });

  it('scan returns undefined tableScope for elements not inside sd-table', () => {
    root.innerHTML = `<input data-autoid="forms-input-email"/>`;
    const [el] = svc.scan(root);
    expect(el.tableScope).toBeUndefined();
  });

  it('scan returns undefined tableScope when element IS the sd-table itself', () => {
    root.innerHTML = `<sd-table data-autoid="components-table-employees"></sd-table>`;
    const [el] = svc.scan(root);
    expect(el.tableScope).toBeUndefined();
  });

  it('scan reads all 5 new validation meta attributes into state', () => {
    root.innerHTML = `
      <input data-autoid="forms-input-email"
             data-required="true"
             data-maxlength="100"
             data-minlength="5"
             data-pattern="VN_PHONE"
             data-error-message="Vui lòng nhập thông tin"/>
    `;
    const [el] = svc.scan(root);
    expect(el.state.required).toBe('true');
    expect(el.state.maxlength).toBe('100');
    expect(el.state.minlength).toBe('5');
    expect(el.state.pattern).toBe('VN_PHONE');
    expect(el.state.errorMessage).toBe('Vui lòng nhập thông tin');
  });

  it('scan returns undefined for validation meta attrs not on DOM', () => {
    root.innerHTML = `<input data-autoid="forms-input-email" data-required="false"/>`;
    const [el] = svc.scan(root);
    expect(el.state.required).toBe('false');
    expect(el.state.maxlength).toBeUndefined();
    expect(el.state.minlength).toBeUndefined();
    expect(el.state.pattern).toBeUndefined();
    expect(el.state.errorMessage).toBeUndefined();
  });
});
