import { SdAutoidExportService } from './autoid-export.service';
import { SdAutoidElement } from '../models/autoid-element.model';
import { SdAutoidExportMeta } from '../models/autoid-export-format.model';

const el = (over: Partial<SdAutoidElement> = {}): SdAutoidElement => ({
  stt: 1, name: 'Email', autoid: 'forms-input-email', tag: 'sd-input',
  text: '', xpath: '//*[@data-autoid="forms-input-email"]', duplicate: false,
  state: {}, tableScope: undefined, ...over,
});

const meta: SdAutoidExportMeta = {
  pageUrl: '/customers/create',
  pageTitle: 'Customer Create',
  timestamp: '2026-05-25T10:00:00.000Z',
};

describe('SdAutoidExportService', () => {
  const svc = new SdAutoidExportService();

  it('toJson trả JSON pretty 2 space', () => {
    const out = svc.toJson([el()]);
    expect(out).toContain('"autoid": "forms-input-email"');
    expect(out.startsWith('[')).toBe(true);
  });

  it('toCsv header đúng + escape dấu " bằng ""', () => {
    const csv = svc.toCsv([el({ name: 'Say "hi"' })]);
    expect(csv.split('\n')[0]).toBe('STT,name,autoid,tag,table-scope,disabled,loading,empty,invalid,opened,count,data-value,text,xpath');
    expect(csv).toContain('"Say ""hi"""');
  });

  it('toMarkdownPom sinh code block ts với class Page', () => {
    const md = svc.toMarkdownPom([el()], meta);
    expect(md).toContain('# CustomerCreatePage');
    expect(md).toContain('```ts');
    expect(md).toContain('export class CustomerCreatePage');
    expect(md).toContain("readonly formsInputEmail = '//*[@data-autoid=\"forms-input-email\"]';");
  });

  it('toMarkdownPom comment chứa tag + name', () => {
    const md = svc.toMarkdownPom([el()], meta);
    expect(md).toContain('/** sd-input Email — */');
  });

  it('toMarkdownTable group theo tag, sort tên tag', () => {
    const md = svc.toMarkdownTable(
      [el({ tag: 'sd-button', autoid: 'button-x' }), el({ tag: 'sd-input' })],
      meta
    );
    const idxButton = md.indexOf('### sd-button');
    const idxInput = md.indexOf('### sd-input');
    expect(idxButton).toBeGreaterThan(-1);
    expect(idxInput).toBeGreaterThan(idxButton);
  });

  it('toMarkdownTable flag duplicate với ⚠️', () => {
    const md = svc.toMarkdownTable([el({ duplicate: true })], meta);
    expect(md).toContain('⚠️');
  });

  it('toMarkdownTable escape | trong cell', () => {
    const md = svc.toMarkdownTable([el({ name: 'a|b' })], meta);
    expect(md).toContain('a\\|b');
  });

  it('copyToClipboard fallback document.execCommand khi không có navigator.clipboard.writeText', async () => {
    const original = (navigator as any).clipboard;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    spyOn(document, 'execCommand').and.returnValue(true);
    await svc.copyToClipboard('hello');
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: original });
  });

  it('toCsv includes state + tableScope columns', () => {
    const element = el({
      tableScope: 'components-table-employees',
      state: { disabled: 'true', empty: 'false', dataValue: 'foo' },
    });
    const csv = svc.toCsv([element]);
    const row = csv.split('\n')[1];
    expect(row).toContain('"components-table-employees"');
    expect(row).toContain('"true"');  // disabled
    expect(row).toContain('"false"'); // empty
    expect(row).toContain('"foo"');   // data_value
  });

  it('toMarkdownPom includes state summary in JSDoc when state is non-empty', () => {
    const element = el({ state: { disabled: 'false', empty: 'true', invalid: 'false' } });
    const md = svc.toMarkdownPom([element], meta);
    expect(md).toContain('disabled=false');
    expect(md).toContain('empty=true');
    expect(md).toContain('invalid=false');
  });

  it('toMarkdownTable groups by tableScope then by tag', () => {
    const topEl = el({ autoid: 'button-top', tag: 'sd-button' });
    const tableEl = el({
      autoid: 'forms-input-search',
      tag: 'sd-input',
      tableScope: 'components-table-employees',
    });
    const md = svc.toMarkdownTable([topEl, tableEl], meta);

    // Top-level section appears first.
    const idxTopLevel = md.indexOf('## Top-level');
    // Per-table section appears after.
    const idxTableSection = md.indexOf('## Inside table `components-table-employees`');
    expect(idxTopLevel).toBeGreaterThan(-1);
    expect(idxTableSection).toBeGreaterThan(idxTopLevel);

    // sd-button is under Top-level, sd-input is under the table section.
    const idxTopButton = md.indexOf('### sd-button');
    const idxTableInput = md.indexOf('### sd-input');
    expect(idxTopButton).toBeGreaterThan(idxTopLevel);
    expect(idxTableInput).toBeGreaterThan(idxTableSection);
    expect(md).toContain('forms-input-search');
  });
});
