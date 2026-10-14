import { SdEditorEngine } from './editor-engine';
import { SdEditorImportDiagnostic, SdEditorImportError } from './editor-engine.models';
import { sdEditorSemanticHtml } from './editor-html-boundary';
import { undoDepth } from '@tiptap/pm/history';

describe('SdEditorEngine source preservation', () => {
  let host: HTMLElement;
  let engine: SdEditorEngine;
  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });
  afterEach(() => {
    engine?.destroy();
    host.remove();
  });
  it('returns original safe HTML bytes before actual editing and emits no initialization change', () => {
    const original = '<P title="note">Hello <b>world</b></P>';
    const change = jasmine.createSpy('change');
    engine = new SdEditorEngine(host, { content: original, onChange: change });
    expect(engine.getContent()).toBe(original);
    expect(change).not.toHaveBeenCalled();
    expect(engine.diagnostics).toEqual([]);
    expect(engine.editor.isEditable).toBeTrue();
  });
  // Synthetic fixtures derived from the existing Core sanitizer corpus; no production data.
  const corpus = [
    '<p>Hello <strong>world</strong> <i>and</i> <u>more</u> <s>s</s><code>x</code><sub>2</sub><sup>3</sup></p>',
    '<h1>a</h1><h2>b</h2><h3>c</h3><h4>d</h4><h5>e</h5><h6>f</h6><blockquote cite="https://example.com"><p>q</p></blockquote><pre><code>x</code></pre><hr>',
    '<p style="text-align:center;"><span style="color:#ff0000;font-size:14px;font-family:Arial;">Colored</span></p>',
    '<ol type="a" start="3"><li>One<ul><li>nested</li></ul></li><li>Two</li></ol><ul><li>Bullet</li></ul>',
    '<figure class="table"><table style="border-collapse:collapse;"><tbody><tr><th colspan="2">Head</th></tr><tr><td>a</td><td rowspan="2">b</td></tr><tr><td>c</td></tr></tbody></table></figure>',
    '<figure class="image" style="width:50%;"><img style="width:100%;" src="/a.png" alt="a" loading="lazy" id="img-1" width="200" srcset="/a.png 1x, /b.png 2x" sizes="100vw"><figcaption>Image <strong>caption</strong></figcaption></figure>',
    '<p><img src="data:image/png;base64,iVBORw0KGgo=" alt=""><img src="blob:https://app.example.com/9f7c" alt="pending"></p>',
    '<p aria-label="note" data-note="x" id="part" title="test" dir="ltr" lang="en" class="stored">Note&nbsp;text<br>line</p>',
    '<p><a href="https://example.com/x?y=1" title="link" target="_blank" rel="noopener noreferrer">link</a></p>',
    '<p><span class="ck-custom-mention" data-id="42" data-marker="@" contenteditable="false">@An</span></p>',
  ];
  for (const html of corpus)
    it(`preserves schema semantics through a real edit: ${html.slice(0, 55)}`, () => {
      engine = new SdEditorEngine(host, { content: html });
      expect(engine.diagnostics).withContext(html).toEqual([]);
      expect(engine.editor.isEditable).toBeTrue();
      expect(engine.getContent()).toBe(html);
      expect(sdEditorSemanticHtml(engine.editor.getHTML())).toBe(sdEditorSemanticHtml(html));
      engine.editor.commands.insertContentAt(engine.editor.state.doc.content.size, {
        type: 'paragraph',
        content: [{ type: 'text', text: 'edited' }],
      });
      expect(sdEditorSemanticHtml(engine.getContent()))
        .withContext('complete original document plus only the intentional insertion')
        .toBe(sdEditorSemanticHtml(`${html}<p>edited</p>`));
    });
  it('applies native formatting commands over imported styles while retaining unrelated metadata', () => {
    const original =
      '<p data-block="keep" style="text-align:left;margin-top:4px"><span data-note="keep" class="legacy" style="color:red;font-size:12px;font-family:Arial;white-space:pre-wrap">Hello</span></p>';
    engine = new SdEditorEngine(host, { content: original });
    expect(engine.diagnostics).toEqual([]);
    expect(engine.getContent()).toBe(original);
    engine.editor.commands.setTextSelection({ from: 1, to: 6 });
    expect(engine.editor.commands.setColor('blue')).toBeTrue();
    expect(engine.editor.commands.setFontSize('18px')).toBeTrue();
    expect(engine.editor.commands.setFontFamily('serif')).toBeTrue();
    expect(engine.editor.commands.setTextAlign('right')).toBeTrue();
    const parsed = new DOMParser().parseFromString(engine.getContent(), 'text/html');
    const span = parsed.querySelector('span')!;
    expect(span.style.color).toBe('blue');
    expect(span.style.fontSize).toBe('18px');
    expect(span.style.fontFamily).toBe('serif');
    expect(span.style.whiteSpace).toBe('pre-wrap');
    expect(span.getAttribute('data-note')).toBe('keep');
    expect(span.className).toBe('legacy');
    expect(parsed.querySelector('p')!.style.textAlign).toBe('right');
    expect(parsed.querySelector('p')!.style.marginTop).toBe('4px');
    expect(parsed.querySelector('p')!.getAttribute('data-block')).toBe('keep');
    expect(engine.editor.commands.undo()).toBeTrue();
    const undone = new DOMParser().parseFromString(engine.getContent(), 'text/html');
    expect(undone.querySelector('p')!.style.textAlign).toBe('left');
    expect(undone.querySelector('span')!.style.color).toBe('blue');
    expect(engine.editor.commands.redo()).toBeTrue();
    expect(new DOMParser().parseFromString(engine.getContent(), 'text/html').querySelector('p')!.style.textAlign).toBe('right');
    engine.editor.commands.setTextSelection({ from: 1, to: 6 });
    expect(engine.editor.commands.unsetColor()).toBeTrue();
    expect(engine.editor.commands.unsetFontSize()).toBeTrue();
    expect(engine.editor.commands.unsetFontFamily()).toBeTrue();
    expect(engine.editor.commands.unsetTextAlign()).toBeTrue();
    const cleared = new DOMParser().parseFromString(engine.getContent(), 'text/html');
    const clearedSpan = cleared.querySelector('span')!;
    expect(clearedSpan.style.color).toBe('');
    expect(clearedSpan.style.fontSize).toBe('');
    expect(clearedSpan.style.fontFamily).toBe('');
    expect(clearedSpan.style.whiteSpace).toBe('pre-wrap');
    expect(clearedSpan.getAttribute('data-note')).toBe('keep');
    expect(clearedSpan.className).toBe('legacy');
    expect(cleared.querySelector('p')!.style.textAlign).toBe('');
    expect(cleared.querySelector('p')!.style.marginTop).toBe('4px');
  });
  it('locks safe unsupported structures and returns original safe HTML without emitting', () => {
    const original = '<dl><dt>Name</dt><dd>Value</dd></dl>';
    const change = jasmine.createSpy('change');
    engine = new SdEditorEngine(host, { content: original, onChange: change });
    expect(engine.diagnostics.some(item => item.code === 'unsupported-html')).toBeTrue();
    expect(engine.editor.isEditable).toBeFalse();
    expect(engine.getHtml()).toBe(original);
    expect(host.querySelector('.sd-editor-import-preview')?.textContent).toBe('NameValue');
    expect(change).not.toHaveBeenCalled();
    engine.setEditable(true);
    expect(engine.editor.isEditable).toBeFalse();
  });
  it('locks malformed table geometry that table plugins would repair during import', () => {
    const malformed = '<table><tr><td>A</td><td>B</td></tr><tr><td>C</td></tr></table>';
    engine = new SdEditorEngine(host, { content: malformed });
    expect(engine.diagnostics.some(item => item.code === 'unsupported-html')).toBeTrue();
    expect(engine.editor.isEditable).toBeFalse();
    expect(engine.getContent()).toBe(malformed);
  });
  for (const original of [
    '<body style="color:red" data-note="keep"><p>x</p></body>',
    '<html lang="vi" title="keep"><p>x</p></html>',
    '<head data-note="keep"></head><p>x</p>',
  ])
    it(`diagnoses discarded safe document envelope attributes: ${original}`, () => {
      const change = jasmine.createSpy('change');
      engine = new SdEditorEngine(host, { content: original, onChange: change });
      expect(engine.diagnostics.some(item => item.code === 'unsupported-html' && item.path.startsWith('/html'))).toBeTrue();
      expect(engine.editor.isEditable).toBeFalse();
      expect(engine.getContent()).toBe(original);
      expect(engine.getHtml()).toBe(original);
      expect(change).not.toHaveBeenCalled();
      engine.editor.commands.insertContent('must not edit');
      expect(engine.getContent()).toBe(original);
    });
  const unsafeEnvelopes = [
    '<body style="background-image:url(https://evil.example)"><p>x</p></body>',
    '<html style="color:var(--unsafe)"><p>x</p></html>',
    '<title>retained-source</title><p>x</p>',
    '<head><style>body { background-image:url(https://evil.example); }</style></head><p>x</p>',
  ];
  for (const original of unsafeEnvelopes)
    it(`blocks unsafe document envelope through both getters: ${original}`, () => {
      engine = new SdEditorEngine(host, { content: original });
      expect(engine.diagnostics.some(item => item.code === 'unsafe-html' && item.path.startsWith('/html'))).toBeTrue();
      expect(engine.editor.isEditable).toBeFalse();
      expect(() => engine.getContent()).toThrowError(SdEditorImportError);
      expect(() => engine.getHtml()).toThrowError(SdEditorImportError);
      expect(host.querySelector('title,style')).toBeNull();
      expect(host.querySelector('.sd-editor-import-preview')?.getAttribute('style')).toBeNull();
    });
  for (const original of [
    ...unsafeEnvelopes,
    '<body style="color:red"><p>x</p></body>',
    '<table><tbody data-section="main"><tr><td>x</td></tr></tbody></table>',
  ])
    it(`rejects document envelope or table-section paste without changing document, selection or history: ${original}`, () => {
      const change = jasmine.createSpy('change');
      engine = new SdEditorEngine(host, { content: '<p>old</p>', onChange: change });
      engine.editor.commands.insertContent('user');
      change.calls.reset();
      const state = engine.editor.state;
      const depth = undoDepth(state);
      const originalValue = engine.getContent();
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/html', original);
      const event = new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true });
      engine.editor.view.dom.dispatchEvent(event);
      expect(event.defaultPrevented).toBeTrue();
      expect(engine.editor.state.doc.eq(state.doc)).toBeTrue();
      expect(engine.editor.state.selection.eq(state.selection)).toBeTrue();
      expect(undoDepth(engine.editor.state)).toBe(depth);
      expect(engine.getContent()).toBe(originalValue);
      expect(engine.getHtml()).toBe(originalValue);
      expect(change).not.toHaveBeenCalled();
    });
  for (const attributes of ['data-section="main" title="keep"', 'aria-label="body section"', 'style="color:red"'])
    it(`freezes attributed tbody rather than discarding its attributes: ${attributes}`, () => {
      const original = `<table><tbody ${attributes}><tr><td>x</td></tr></tbody></table>`;
      const change = jasmine.createSpy('change');
      engine = new SdEditorEngine(host, { content: original, onChange: change });
      expect(engine.diagnostics.some(item => item.code === 'unsupported-html')).toBeTrue();
      expect(engine.editor.isEditable).toBeFalse();
      expect(engine.getContent()).toBe(original);
      expect(engine.getHtml()).toBe(original);
      expect(change).not.toHaveBeenCalled();
      engine.editor.commands.insertContent('must not edit');
      expect(engine.getContent()).toBe(original);
    });
  it('retains inline spaces and preformatted whitespace while ignoring only inter-block layout whitespace', () => {
    expect(sdEditorSemanticHtml('<p>a <span>b</span> c</p>')).not.toBe(sdEditorSemanticHtml('<p>a<span>b</span>c</p>'));
    expect(sdEditorSemanticHtml('<pre><code> \n </code></pre>')).not.toBe(sdEditorSemanticHtml('<pre><code></code></pre>'));
    expect(sdEditorSemanticHtml('<p>one</p>\n<p>two</p>')).toBe(sdEditorSemanticHtml('<p>one</p><p>two</p>'));
  });
  for (const html of [
    '<p onclick="x">bad</p>',
    '<script>alert(1)</script><p>safe</p>',
    '<p><a href="javascript:alert(1)">x</a></p>',
    '<p style="background-image:url(https://evil.example)">x</p>',
    '<p style="color:var(--unsafe)">x</p>',
  ])
    it(`prevents unsafe getters and active mounting: ${html}`, () => {
      engine = new SdEditorEngine(host, { content: html });
      expect(engine.editor.isEditable).toBeFalse();
      expect(engine.diagnostics.some(item => item.code === 'unsafe-html')).toBeTrue();
      expect(() => engine.getContent()).toThrowError(SdEditorImportError);
      expect(() => engine.getHtml()).toThrowError(SdEditorImportError);
      expect(host.querySelector('script,[onclick]')).toBeNull();
    });
  it('classifies a sanitizer-discarded use element as unsafe before either getter can return source HTML', () => {
    const html = '<use>retained raw text</use><p>safe</p>';
    engine = new SdEditorEngine(host, { content: html });
    expect(engine.diagnostics.some(item => item.code === 'unsafe-html' && item.tag === 'use')).toBeTrue();
    expect(engine.editor.isEditable).toBeFalse();
    expect(() => engine.getContent()).toThrowError(SdEditorImportError);
    expect(() => engine.getHtml()).toThrowError(SdEditorImportError);
    expect(host.querySelector('use')).toBeNull();
    expect(host.querySelector('.sd-editor-import-preview')?.textContent).toBe('safe');
  });
  it('rejects a use-element HTML paste atomically and reports the unsafe category', () => {
    const diagnostics = jasmine.createSpy('diagnostics');
    const change = jasmine.createSpy('change');
    engine = new SdEditorEngine(host, { content: '<p>old</p>', onDiagnostics: diagnostics, onChange: change });
    const state = engine.editor.state;
    const depth = undoDepth(state);
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/html', '<use>retained raw text</use><p>safe</p>');
    const event = new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true });
    engine.editor.view.dom.dispatchEvent(event);
    expect(event.defaultPrevented).toBeTrue();
    expect(diagnostics).toHaveBeenCalled();
    expect(
      diagnostics.calls.mostRecent().args[0].some((item: SdEditorImportDiagnostic) => item.code === 'unsafe-html' && item.tag === 'use')
    ).toBeTrue();
    expect(engine.editor.state.doc.eq(state.doc)).toBeTrue();
    expect(engine.editor.state.selection.eq(state.selection)).toBeTrue();
    expect(undoDepth(engine.editor.state)).toBe(depth);
    expect(engine.getContent()).toBe('<p>old</p>');
    expect(change).not.toHaveBeenCalled();
  });
  it('keeps a literal comment opener inside a supported title attribute editable', () => {
    const html = '<p title="literal <!-- text">safe</p>';
    engine = new SdEditorEngine(host, { content: html });
    expect(engine.diagnostics).toEqual([]);
    expect(engine.editor.isEditable).toBeTrue();
    expect(engine.getContent()).toBe(html);
    engine.editor.commands.insertContentAt(engine.editor.state.doc.content.size, 'edited');
    expect(new DOMParser().parseFromString(engine.getContent(), 'text/html').querySelector('p')?.getAttribute('title')).toBe(
      'literal <!-- text'
    );
    expect(engine.getContent()).toContain('edited');
  });
  for (const html of [
    '<?note><p>safe</p>',
    '<!note><p>safe</p>',
    '<!note <frame>><p>safe</p>',
    '</!note<frame>><p>safe</p>',
    '</p title="<frame>"><p>safe</p>',
    '<!DOCTYPE html><p>safe</p>',
  ])
    it(`retains parsed bogus comments as safe unsupported source without misclassifying literal active tag text: ${html}`, () => {
      engine = new SdEditorEngine(host, { content: html });
      expect(engine.diagnostics.some(item => item.code === 'unsupported-html'))
        .withContext(JSON.stringify(engine.diagnostics))
        .toBeTrue();
      expect(engine.diagnostics.some(item => item.code === 'unsafe-html'))
        .withContext(JSON.stringify(engine.diagnostics))
        .toBeFalse();
      expect(engine.editor.isEditable).toBeFalse();
      expect(engine.getContent()).toBe(html);
      expect(engine.getHtml()).toBe(html);
      expect(host.querySelector('frame')).toBeNull();
    });
  for (const html of [
    '<p style="letter-spacing:2px">x</p>',
    '<p custom-attr="keep">x</p>',
    '<table><caption>Title</caption><tr><td>x</td></tr></table>',
    '<table><colgroup><col style="width:50%"></colgroup><tr><td>x</td></tr></table>',
  ])
    it(`locks unsupported safe node/attribute/style before editing: ${html}`, () => {
      engine = new SdEditorEngine(host, { content: html });
      expect(engine.editor.isEditable).toBeFalse();
      expect(engine.diagnostics.some(item => item.code === 'unsupported-html')).toBeTrue();
      expect(engine.getContent()).toBe(html);
    });
  it('rejects unsupported rich paste atomically but lets plain text paste proceed', () => {
    engine = new SdEditorEngine(host, { content: '<p>old</p>' });
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/html', '<dl><dt>bad</dt></dl>');
    const event = new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true });
    engine.editor.view.dom.dispatchEvent(event);
    expect(engine.getContent()).toBe('<p>old</p>');
    expect(event.defaultPrevented).toBeTrue();
    const plain = new DataTransfer();
    plain.setData('text/plain', 'plain');
    engine.editor.commands.focus('end');
    engine.editor.view.dom.dispatchEvent(new ClipboardEvent('paste', { clipboardData: plain, bubbles: true, cancelable: true }));
    expect(engine.getContent()).toContain('plain');
  });
  it('keeps an equal external echo silent without resetting selection or history', () => {
    const change = jasmine.createSpy('change');
    const sourceChange = jasmine.createSpy('sourceChange');
    engine = new SdEditorEngine(host, { content: '<p>a</p>', onChange: change, onSourceChange: sourceChange });
    engine.editor.commands.insertContent('b');
    const value = engine.getContent();
    const selection = engine.editor.state.selection;
    engine.setContent(value);
    expect(engine.editor.state.selection).toBe(selection);
    expect(sourceChange).not.toHaveBeenCalled();
    engine.setContent('<p>a</p>');
    expect(engine.getContent()).toBe('<p>a</p>');
    expect(sourceChange).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledTimes(1);
  });
  it('queues authoritative external replacement during composition and suppresses stale composition emission', () => {
    const change = jasmine.createSpy('change');
    const sourceChange = jasmine.createSpy('sourceChange');
    engine = new SdEditorEngine(host, { content: '<p>a</p>', onChange: change, onSourceChange: sourceChange });
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    engine.editor.commands.insertContent('composed');
    expect(change).not.toHaveBeenCalled();
    engine.setContent('<p>server</p>');
    expect(sourceChange).toHaveBeenCalledTimes(1);
    expect(engine.editor.isEditable).toBeFalse();
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    expect(engine.getContent()).toBe('<p>server</p>');
    expect(change).not.toHaveBeenCalled();
    expect(engine.editor.isEditable).toBeTrue();
  });
  it('emits one completed composition and safely replaces external content silently', () => {
    const change = jasmine.createSpy('change');
    engine = new SdEditorEngine(host, { content: '<p>a</p>', onChange: change });
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    engine.editor.commands.insertContent('ime');
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    expect(change).toHaveBeenCalledTimes(1);
    engine.setContent('<p>new</p>');
    expect(change).toHaveBeenCalledTimes(1);
    expect(engine.getContent()).toBe('<p>new</p>');
  });
  it('notifies composition start before updates and notifies end after the completed change', () => {
    const trace: string[] = [];
    engine = new SdEditorEngine(host, {
      content: '<p>a</p>',
      onCompositionStateChange: composing => {
        trace.push(composing ? 'start' : 'end');
        if (composing) engine.editor.commands.insertContent('callback-edit');
      },
      onChange: () => trace.push('change'),
    });
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    expect(trace).toEqual(['start']);
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    expect(trace).toEqual(['start', 'change', 'end']);
    expect(engine.getContent()).toContain('callback-edit');
  });
  it('notifies composition end after silent authoritative replacement without a stale composed change', () => {
    const trace: string[] = [];
    engine = new SdEditorEngine(host, {
      content: '<p>a</p>',
      onCompositionStateChange: composing => trace.push(composing ? 'start' : 'end'),
      onChange: () => trace.push('change'),
      onSourceChange: () => trace.push('source'),
    });
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    engine.editor.commands.insertContent('composed');
    engine.setContent('<p>server</p>');
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    expect(trace).toEqual(['start', 'source', 'end']);
    expect(engine.getContent()).toBe('<p>server</p>');
  });
  it('preserves mention caller identity and legacy marker through insert/delete', () => {
    engine = new SdEditorEngine(host, { content: corpus[9] });
    expect(engine.getMentions()).toEqual([{ id: '42', name: 'An', marker: '@' }]);
    engine.insertMention({ id: 'user-key', name: 'Binh', marker: '#' });
    expect(engine.getMentions().some(item => item.id === 'user-key' && item.name === 'Binh' && item.marker === '#')).toBeTrue();
    engine.setContent('<p>none</p>');
    expect(engine.getMentions()).toEqual([]);
  });
  it('uses dynamic mention feeds with keyboard selection, caller identity, accessible active descendant and cleanup', async () => {
    const selected = jasmine.createSpy('selected');
    const feed = jasmine.createSpy('feed').and.returnValue(Promise.resolve([{ id: 'caller-42', name: 'An' }]));
    engine = new SdEditorEngine(host, {
      content: '<p></p>',
      mentionFeeds: [{ marker: '@', feed }],
      mentionLabel: () => 'Mention choices',
      onMentionSelect: selected,
    });
    engine.editor.commands.focus('end');
    engine.editor.commands.insertContent('@An');
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(feed).toHaveBeenCalledWith('An');
    const popup = document.querySelector('.sd-editor-mention-list');
    expect(popup?.getAttribute('aria-label')).toBe('Mention choices');
    expect(engine.editor.view.dom.getAttribute('aria-activedescendant')).toBe(popup?.firstElementChild?.id ?? null);
    engine.editor.view.dom.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(engine.getMentions()).toEqual([{ id: 'caller-42', name: 'An', marker: '@' }]);
    expect(selected).toHaveBeenCalledWith({ id: 'caller-42', name: 'An' });
    expect(document.querySelector('.sd-editor-mention-list')).toBeNull();
    expect(engine.editor.view.dom.hasAttribute('aria-activedescendant')).toBeFalse();
  });
  it('ignores async mention responses after source replacement and reports feed errors without unhandled rejection', async () => {
    let resolveFeed!: (items: { id: string; name: string }[]) => void;
    const diagnostics = jasmine.createSpy('diagnostics');
    engine = new SdEditorEngine(host, {
      content: '<p></p>',
      mentionFeeds: [
        {
          marker: '@',
          feed: () =>
            new Promise(resolve => {
              resolveFeed = resolve;
            }),
        },
      ],
      onDiagnostics: diagnostics,
    });
    engine.editor.commands.focus('end');
    engine.editor.commands.insertContent('@An');
    await new Promise(resolve => setTimeout(resolve, 10));
    engine.setContent('<p>new</p>');
    resolveFeed([{ id: 'stale', name: 'An' }]);
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(document.querySelector('.sd-editor-mention-list')).toBeNull();
    expect(engine.getMentions()).toEqual([]);
    engine.setMentionFeeds([{ marker: '@', feed: () => Promise.reject(new Error('network unavailable')) }]);
    engine.setContent('<p></p>');
    engine.editor.commands.insertContent('@An');
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(diagnostics.calls.allArgs().some(args => args[0].some((item: { code: string }) => item.code === 'invalid-option'))).toBeTrue();
  });
  it('cancels pending composition emission when editing is disabled and changes format without remounting', () => {
    const change = jasmine.createSpy('change');
    const options = { content: '<p>a</p>', onChange: change };
    engine = new SdEditorEngine(host, options);
    const editor = engine.editor;
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    engine.editor.commands.insertContent('ime');
    engine.setEditable(false);
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    expect(change).not.toHaveBeenCalled();
    engine.setFormat('markdown');
    expect(engine.editor).toBe(editor);
    expect('format' in options).toBeFalse();
  });
  it('replaces only still-present image sources and rejects unsafe image results', () => {
    engine = new SdEditorEngine(host, { content: '<p>x</p>' });
    engine.insertImage({ src: 'blob:https://app.example/a', id: 'pending', loading: 'lazy' });
    expect(engine.activeImageSources().has('blob:https://app.example/a')).toBeTrue();
    expect(engine.replaceImage('blob:https://app.example/a', { src: '/uploaded.png', id: 'done' })).toBeTrue();
    expect(engine.getContent()).toContain('id="done"');
    engine.setContent('<p>replaced</p>');
    expect(engine.replaceImage('/uploaded.png', { src: '/stale.png' })).toBeFalse();
    expect(() => engine.insertImage({ src: 'javascript:bad' })).toThrowError(SdEditorImportError);
  });
  it('uses OSS Markdown parsing and blocks edits that lose rich attributes', () => {
    const original = '**Hello**\n\nworld';
    engine = new SdEditorEngine(host, { content: original, format: 'markdown' });
    expect(engine.diagnostics).toEqual([]);
    expect(engine.getContent()).toBe(original);
    expect(engine.getHtml()).toContain('<strong>Hello</strong>');
    engine.editor.commands.insertContent('safe');
    expect(engine.getContent()).toContain('safe');
    const before = engine.getHtml();
    engine.editor.commands.updateAttributes('paragraph', { sdAttributes: { style: 'text-align:center' } });
    expect(engine.getHtml()).toBe(before);
  });
  it('diagnoses rich raw HTML that Markdown cannot represent before the first edit', () => {
    const original = '<p style="text-align:right"><span style="color:red;font-size:12px;font-family:Arial">Hello</span></p>';
    engine = new SdEditorEngine(host, { content: original, format: 'markdown' });
    expect(engine.diagnostics.some(item => item.code === 'markdown-loss')).toBeTrue();
    expect(engine.editor.isEditable).toBeFalse();
    expect(engine.getHtml()).toContain('Hello');
    expect(() => engine.getContent()).toThrowError(SdEditorImportError);
    for (let repeat = 0; repeat < 2; repeat++) {
      engine.setFormat('html');
      expect(engine.editor.isEditable).toBeTrue();
      expect(sdEditorSemanticHtml(engine.getContent())).toBe(sdEditorSemanticHtml(original));
      engine.setFormat('markdown');
      expect(engine.diagnostics.some(item => item.code === 'markdown-loss')).toBeTrue();
      expect(engine.editor.isEditable).toBeFalse();
      expect(() => engine.getContent()).toThrowError(SdEditorImportError);
      expect(sdEditorSemanticHtml(engine.getHtml())).toBe(sdEditorSemanticHtml(original));
    }
  });
  it('switches formats before the parent echo without losing edits, selection, history or emitting another change', () => {
    const change = jasmine.createSpy('change');
    engine = new SdEditorEngine(host, { content: '<p>a</p>', onChange: change });
    engine.editor.commands.insertContent('new');
    const before = engine.getHtml();
    const selection = engine.editor.state.selection;
    const history = undoDepth(engine.editor.state);
    change.calls.reset();
    engine.setFormat('markdown');
    expect(sdEditorSemanticHtml(engine.getHtml())).toBe(sdEditorSemanticHtml(before));
    expect(engine.getContent()).toContain('new');
    expect(engine.editor.state.selection.eq(selection)).toBeTrue();
    expect(undoDepth(engine.editor.state)).toBe(history);
    engine.setFormat('html');
    expect(sdEditorSemanticHtml(engine.getContent())).toBe(sdEditorSemanticHtml(before));
    expect(change).not.toHaveBeenCalled();
  });
  it('defers a format change during composition while preserving the latest composed document and suppressing stale emissions', () => {
    const change = jasmine.createSpy('change');
    engine = new SdEditorEngine(host, { content: '<p>a</p>', onChange: change });
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    engine.editor.commands.insertContent('first');
    engine.setFormat('markdown');
    engine.editor.commands.insertContent('latest');
    const before = engine.editor.getHTML();
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    expect(sdEditorSemanticHtml(engine.getHtml())).toBe(sdEditorSemanticHtml(before));
    expect(engine.getContent()).toContain('latest');
    expect(engine.getContent()).toContain('first');
    expect(change).not.toHaveBeenCalled();
  });
  it('blocks incompatible Markdown conversion and retains all rich edited HTML instead of replaying old source', () => {
    const change = jasmine.createSpy('change');
    engine = new SdEditorEngine(host, { content: '<p style="text-align:center">a</p>', onChange: change });
    engine.editor.commands.insertContent('new');
    const before = engine.getHtml();
    change.calls.reset();
    engine.setFormat('markdown');
    expect(engine.diagnostics.some(item => item.code === 'markdown-loss')).toBeTrue();
    expect(() => engine.getContent()).toThrowError(SdEditorImportError);
    expect(sdEditorSemanticHtml(engine.getHtml())).toBe(sdEditorSemanticHtml(before));
    expect(engine.editor.isEditable).toBeFalse();
    engine.setFormat('html');
    expect(engine.editor.isEditable).toBeTrue();
    expect(sdEditorSemanticHtml(engine.getContent())).toBe(sdEditorSemanticHtml(before));
    expect(change).not.toHaveBeenCalled();
  });
  for (const original of ['<p custom-attr="keep">x</p>', '<section><p>unknown wrapper</p></section>'])
    it(`retains safe unsupported Markdown HTML and restores its original source through format changes: ${original}`, () => {
      const change = jasmine.createSpy('change');
      engine = new SdEditorEngine(host, { content: original, format: 'markdown', onChange: change });
      expect(engine.diagnostics.some(item => item.code === 'unsupported-html')).toBeTrue();
      expect(engine.getContent()).toBe(original);
      expect(sdEditorSemanticHtml(engine.getHtml())).toBe(sdEditorSemanticHtml(original));
      expect(() => engine.setFormat('html')).not.toThrow();
      expect(sdEditorSemanticHtml(engine.getContent())).toBe(sdEditorSemanticHtml(original));
      expect(sdEditorSemanticHtml(engine.getHtml())).toBe(sdEditorSemanticHtml(original));
      expect(engine.editor.isEditable).toBeFalse();
      expect(host.querySelector('.sd-editor-import-preview [custom-attr],.sd-editor-import-preview section')).toBeNull();
      expect(() => engine.setFormat('markdown')).not.toThrow();
      expect(engine.getContent()).toBe(original);
      expect(sdEditorSemanticHtml(engine.getHtml())).toBe(sdEditorSemanticHtml(original));
      expect(change).not.toHaveBeenCalled();
    });
  it('refuses an unsupported HTML to Markdown conversion without throwing into the caller or overwriting the original value', () => {
    const original = '<p custom-attr="keep">x</p>';
    const change = jasmine.createSpy('change');
    engine = new SdEditorEngine(host, { content: original, onChange: change });
    expect(() => engine.setFormat('markdown')).not.toThrow();
    expect(() => engine.getContent()).toThrowError(SdEditorImportError);
    expect(engine.getHtml()).toBe(original);
    expect(() => engine.setFormat('html')).not.toThrow();
    expect(engine.getContent()).toBe(original);
    expect(engine.getHtml()).toBe(original);
    expect(change).not.toHaveBeenCalled();
  });
  for (const [attribute, url] of [
    ['cite', 'https://example.com/source'],
    ['href', 'mailto:hi@example.com'],
    ['src', '/image.png'],
    ['srcset', '/a.png 1x, /b.png 2x'],
  ])
    it(`classifies safe URL on discarded wrapper as unsupported rather than unsafe: ${attribute}=${url}`, () => {
      const original = `<section ${attribute}="${url}">x</section>`;
      engine = new SdEditorEngine(host, { content: original });
      expect(engine.diagnostics.some(item => item.code === 'unsupported-html')).toBeTrue();
      expect(engine.diagnostics.some(item => item.code === 'unsafe-html')).toBeFalse();
      expect(engine.editor.isEditable).toBeFalse();
      expect(engine.getContent()).toBe(original);
      expect(engine.getHtml()).toBe(original);
    });
  for (const [attribute, url] of [
    ['cite', 'javascript:alert(1)'],
    ['href', 'data:text/html,bad'],
    ['src', 'data:text/html,bad'],
    ['srcset', '/a.png 1x, javascript:bad 2x'],
  ])
    it(`rejects unsafe URL independently of discarded wrapper survival: ${attribute}=${url}`, () => {
      engine = new SdEditorEngine(host, { content: `<section ${attribute}="${url}">x</section>` });
      expect(engine.diagnostics.some(item => item.code === 'unsafe-html')).toBeTrue();
      expect(engine.editor.isEditable).toBeFalse();
      expect(() => engine.getContent()).toThrowError(SdEditorImportError);
      expect(() => engine.getHtml()).toThrowError(SdEditorImportError);
    });
  it('rejects unsafe links in Markdown and destroys idempotently without callbacks', () => {
    engine = new SdEditorEngine(host, { content: '[bad](javascript:alert%281%29)', format: 'markdown' });
    expect(() => engine.getContent()).toThrowError(SdEditorImportError);
    engine.destroy();
    engine.destroy();
    expect(host.children.length).toBe(0);
  });
  it('starts history at the imported document without an undoable empty constructor document', () => {
    const change = jasmine.createSpy('change');
    const original = '<p>initial document</p>';
    engine = new SdEditorEngine(host, { content: original, onChange: change });
    expect(undoDepth(engine.editor.state)).toBe(0);
    expect(engine.editor.commands.undo()).toBeFalse();
    expect(engine.getContent()).toBe(original);
    expect(change).not.toHaveBeenCalled();
  });
  it('resets old undo and redo branches on authoritative replacement but retains undo for subsequent edits', () => {
    const change = jasmine.createSpy('change');
    engine = new SdEditorEngine(host, { content: '<p>old</p>', onChange: change });
    engine.editor.commands.insertContent('edit');
    engine.editor.commands.undo();
    change.calls.reset();
    const replacement = '<p>server replacement</p>';
    engine.setContent(replacement);
    expect(undoDepth(engine.editor.state)).toBe(0);
    expect(engine.editor.commands.undo()).toBeFalse();
    expect(engine.editor.commands.redo()).toBeFalse();
    expect(engine.getContent()).toBe(replacement);
    expect(change).not.toHaveBeenCalled();
    engine.editor.commands.insertContent('new edit');
    expect(engine.editor.commands.undo()).toBeTrue();
    expect(sdEditorSemanticHtml(engine.getHtml())).toBe(sdEditorSemanticHtml(replacement));
    expect(engine.editor.commands.undo()).toBeFalse();
  });
  it('keeps user history for an equal echo without restoring the pre-import empty document', () => {
    engine = new SdEditorEngine(host, { content: '<p>initial</p>' });
    engine.editor.commands.insertContent('typed');
    const depth = undoDepth(engine.editor.state);
    engine.setContent(engine.getContent());
    expect(undoDepth(engine.editor.state)).toBe(depth);
    expect(engine.editor.commands.undo()).toBeTrue();
    expect(sdEditorSemanticHtml(engine.getHtml())).toBe(sdEditorSemanticHtml('<p>initial</p>'));
    expect(engine.editor.commands.undo()).toBeFalse();
  });
  it('resets superseded composing history when the queued authoritative source is applied', () => {
    const change = jasmine.createSpy('change');
    engine = new SdEditorEngine(host, { content: '<p>old</p>', onChange: change });
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    engine.editor.commands.insertContent('composing');
    engine.setContent('<p>server</p>');
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    expect(undoDepth(engine.editor.state)).toBe(0);
    expect(engine.editor.commands.undo()).toBeFalse();
    expect(engine.getContent()).toBe('<p>server</p>');
    expect(change).not.toHaveBeenCalled();
  });
  for (const tag of [
    'noembed',
    'noframes',
    'frame',
    'frameset',
    'applet',
    'datalist',
    'keygen',
    'optgroup',
    'option',
    'output',
    'animate',
    'animatecolor',
    'animatemotion',
    'animatetransform',
    'set',
    'foreignobject',
  ]) {
    it(`blocks unchanged getters for dangerous-category source elements: ${tag}`, () => {
      const change = jasmine.createSpy('change');
      engine = new SdEditorEngine(host, { content: `<${tag}>retained raw text</${tag}><p>safe</p>`, onChange: change });
      expect(engine.diagnostics.some(item => item.code === 'unsafe-html')).toBeTrue();
      expect(engine.editor.isEditable).toBeFalse();
      expect(() => engine.getContent()).toThrowError(SdEditorImportError);
      expect(() => engine.getHtml()).toThrowError(SdEditorImportError);
      expect(host.querySelector(tag)).toBeNull();
      expect(change).not.toHaveBeenCalled();
    });
  }
  it('keeps safe commented tag text unsupported without treating it as an active source element', () => {
    const original = '<!-- <noembed>comment text</noembed> --><p>safe</p>';
    engine = new SdEditorEngine(host, { content: original });
    expect(engine.diagnostics.some(item => item.code === 'unsupported-html')).toBeTrue();
    expect(engine.diagnostics.some(item => item.code === 'unsafe-html')).toBeFalse();
    expect(engine.getContent()).toBe(original);
  });
  for (const comment of ['<!-->', '<!--->', '<!--comment--!>']) {
    it(`classifies a discarded active element after a browser-recognized comment terminator: ${comment}`, () => {
      engine = new SdEditorEngine(host, { content: `${comment}<frame src="/frame.html"><p>safe</p>` });
      expect(engine.diagnostics.some(item => item.code === 'unsafe-html')).toBeTrue();
      expect(() => engine.getContent()).toThrowError(SdEditorImportError);
      expect(() => engine.getHtml()).toThrowError(SdEditorImportError);
      expect(host.querySelector('frame')).toBeNull();
    });
  }
  it('preserves literal tag text inside a quoted safe attribute through an edit', () => {
    const original = '<p title="literal <frame> text">safe</p>';
    engine = new SdEditorEngine(host, { content: original });
    expect(engine.diagnostics).toEqual([]);
    expect(engine.editor.isEditable).toBeTrue();
    expect(engine.getContent()).toBe(original);
    engine.editor.commands.insertContentAt(engine.editor.state.doc.content.size - 1, '!');
    expect(sdEditorSemanticHtml(engine.getHtml())).toBe(sdEditorSemanticHtml('<p title="literal <frame> text">safe!</p>'));
  });
  it('preserves literal handler spelling inside a supported safe title attribute through an edit', () => {
    const original = `<p title='literal <img onerror="x">'>safe</p>`;
    engine = new SdEditorEngine(host, { content: original });
    expect(engine.diagnostics).toEqual([]);
    expect(engine.editor.isEditable).toBeTrue();
    expect(engine.getContent()).toBe(original);
    engine.editor.commands.insertContentAt(engine.editor.state.doc.content.size - 1, '!');
    expect(sdEditorSemanticHtml(engine.getHtml())).toBe(sdEditorSemanticHtml(original.replace('>safe</p>', '>safe!</p>')));
  });
  it('preserves safe commented handler text as unsupported rather than unsafe', () => {
    const original = '<!-- <p onload="x"> --><p>safe</p>';
    engine = new SdEditorEngine(host, { content: original });
    expect(engine.diagnostics.some(item => item.code === 'unsupported-html')).toBeTrue();
    expect(engine.diagnostics.some(item => item.code === 'unsafe-html')).toBeFalse();
    expect(engine.editor.isEditable).toBeFalse();
    expect(engine.getContent()).toBe(original);
    expect(host.querySelector('[onload]')).toBeNull();
  });
  it('reports the current converted representation without duplicating document change or history', () => {
    const change = jasmine.createSpy('change');
    const formatChange = jasmine.createSpy('formatChange');
    const sourceChange = jasmine.createSpy('sourceChange');
    engine = new SdEditorEngine(host, {
      content: '<p>A</p>',
      onChange: change,
      onFormatChange: formatChange,
      onSourceChange: sourceChange,
    });
    engine.editor.commands.insertContent('B');
    const html = engine.getHtml();
    const history = undoDepth(engine.editor.state);
    change.calls.reset();
    engine.setFormat('markdown');
    expect(formatChange.calls.allArgs()).toEqual([[engine.getContent()]]);
    expect(sourceChange).toHaveBeenCalledOnceWith('format');
    expect(engine.getHtml()).toBe(html);
    expect(undoDepth(engine.editor.state)).toBe(history);
    expect(change).not.toHaveBeenCalled();
    engine.setFormat('markdown');
    expect(formatChange.calls.count()).toBe(1);
  });
  it('reports blocked format export without losing HTML and publishes the value after restoring its representation', () => {
    const formatChange = jasmine.createSpy('formatChange');
    engine = new SdEditorEngine(host, { content: '<p style="text-align:center">rich</p>', onFormatChange: formatChange });
    engine.editor.commands.insertContent('edit');
    const html = engine.getHtml();
    engine.setFormat('markdown');
    expect(formatChange.calls.allArgs()).toEqual([[undefined]]);
    expect(engine.getHtml()).toBe(html);
    engine.setFormat('html');
    expect(formatChange.calls.allArgs()).toEqual([[undefined], [html]]);
  });
  it('imports an authoritative value atomically in its specified format even when its source bytes are unchanged', () => {
    const sourceChange = jasmine.createSpy('sourceChange');
    const formatChange = jasmine.createSpy('formatChange');
    const change = jasmine.createSpy('change');
    engine = new SdEditorEngine(host, {
      content: '**server**',
      onSourceChange: sourceChange,
      onFormatChange: formatChange,
      onChange: change,
    });
    expect(engine.diagnostics.some(item => item.code === 'unsupported-html')).toBeTrue();
    engine.setContent('**server**', 'markdown');
    expect(engine.format).toBe('markdown');
    expect(engine.diagnostics).toEqual([]);
    expect(engine.getContent()).toBe('**server**');
    expect(sdEditorSemanticHtml(engine.getHtml())).toBe(sdEditorSemanticHtml('<p><strong>server</strong></p>'));
    expect(sourceChange).toHaveBeenCalledOnceWith('source');
    expect(formatChange).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
    expect(undoDepth(engine.editor.state)).toBe(0);
  });
  it('queues an authoritative source with its format during composition and applies both silently', () => {
    const change = jasmine.createSpy('change');
    const formatChange = jasmine.createSpy('formatChange');
    engine = new SdEditorEngine(host, { content: '<p>old</p>', onChange: change, onFormatChange: formatChange });
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionstart'));
    engine.editor.commands.insertContent('edit');
    engine.setContent('**server**', 'markdown');
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionend'));
    expect(engine.format).toBe('markdown');
    expect(engine.getContent()).toBe('**server**');
    expect(sdEditorSemanticHtml(engine.getHtml())).toBe(sdEditorSemanticHtml('<p><strong>server</strong></p>'));
    expect(change).not.toHaveBeenCalled();
    expect(formatChange).not.toHaveBeenCalled();
    expect(undoDepth(engine.editor.state)).toBe(0);
  });
  for (const tag of ['noembed', 'noframes', 'frame']) {
    it(`rejects dangerous rich paste atomically with unsafe diagnostics: ${tag}`, () => {
      const change = jasmine.createSpy('change');
      const diagnostics = jasmine.createSpy('diagnostics');
      engine = new SdEditorEngine(host, { content: '<p>keep</p>', onChange: change, onDiagnostics: diagnostics });
      engine.editor.commands.setTextSelection(2);
      const selection = engine.editor.state.selection;
      const history = undoDepth(engine.editor.state);
      diagnostics.calls.reset();
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/html', `<${tag}>retained raw text</${tag}><p>paste</p>`);
      const event = new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true });
      engine.editor.view.dom.dispatchEvent(event);
      expect(event.defaultPrevented).toBeTrue();
      expect(engine.getContent()).toBe('<p>keep</p>');
      expect(engine.editor.state.selection).toBe(selection);
      expect(undoDepth(engine.editor.state)).toBe(history);
      expect(change).not.toHaveBeenCalled();
      expect(diagnostics.calls.allArgs().some(args => args[0].some((item: { code: string }) => item.code === 'unsafe-html'))).toBeTrue();
    });
  }
});
