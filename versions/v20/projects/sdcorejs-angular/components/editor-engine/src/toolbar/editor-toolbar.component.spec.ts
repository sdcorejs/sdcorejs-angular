import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdButton } from '@sdcorejs/angular/components/button';
import { I18N_STORAGE_KEY, I18nService } from '@sdcorejs/angular/i18n';
import { SdEditorSurface } from '../surface/editor-surface.component';
import { SdEditorToolbar } from './editor-toolbar.component';

describe('Core editor toolbars with real Tiptap selection', () => {
  let fixture: ComponentFixture<SdEditorSurface>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdEditorSurface, NoopAnimationsModule] }).compileComponents();
  });
  afterEach(() => fixture?.destroy());
  async function mount(content = '<p>Hello world</p>'): Promise<SdEditorToolbar> {
    fixture = TestBed.createComponent(SdEditorSurface);
    fixture.componentRef.setInput('content', content);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.debugElement.query(By.directive(SdEditorToolbar)).componentInstance;
  }
  function control(id: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector(`button[data-editor-control="${id}"]`);
  }
  function coreControl(id: string): SdButton {
    return fixture.debugElement
      .queryAll(By.directive(SdButton))
      .find(button => button.componentInstance.trigger()?.nativeElement === control(id))!.componentInstance;
  }

  it('keeps Core icon actions named in VI/EN and leaves text choices readable in both toolbar variants', async () => {
    const toolbar = await mount();
    const i18n = TestBed.inject(I18nService);
    const originalLanguage = i18n.language();
    const originalStorage = localStorage.getItem(I18N_STORAGE_KEY);
    fixture.componentRef.setInput('uploadEnabled', true);
    try {
      for (const language of ['vi', 'en'] as const) {
        i18n.setLanguage(language, { reload: false });
        for (const variant of ['full', 'compact'] as const) {
          fixture.componentRef.setInput('variant', variant);
          fixture.detectChanges();
          await fixture.whenStable();
          const ids =
            variant === 'full'
              ? ['bold', 'italic', 'underline', 'bullet', 'ordered', 'color', 'alignment', 'link', 'table', 'image', 'more']
              : ['bold', 'italic', 'underline', 'bullet', 'ordered', 'link', 'more'];
          for (const id of ids) {
            const button = coreControl(id);
            const native = control(id);
            expect(button.prefixIcon()).withContext(id).toBeTruthy();
            expect(button.isIconOnly()).withContext(id).toBeTrue();
            expect(button.tooltip()?.startsWith(toolbar.t(id)))
              .withContext(id)
              .toBeTrue();
            expect(native.getAttribute('aria-label')).withContext(id).toBe(toolbar.t(id));
            expect(native.querySelector('sd-icon')?.getAttribute('aria-hidden')).withContext(id).toBe('true');
          }
          if (variant === 'full') {
            for (const id of ['heading', 'font', 'size']) {
              expect(coreControl(id).title()).withContext(id).toBeTruthy();
              expect(control(id).textContent).withContext(id).toContain(coreControl(id).title()!);
            }
          }
        }
      }
      fixture.componentRef.setInput('readonly', true);
      fixture.detectChanges();
      await fixture.whenStable();
      for (const native of fixture.nativeElement.querySelectorAll('button[data-editor-control]') as NodeListOf<HTMLButtonElement>)
        expect(native.disabled).toBeTrue();
    } finally {
      i18n.setLanguage(originalLanguage, { reload: false });
      if (originalStorage === null) localStorage.removeItem(I18N_STORAGE_KEY);
      else localStorage.setItem(I18N_STORAGE_KEY, originalStorage);
    }
  });

  it('reflects selected paragraph alignment with a Core icon while retaining the accessible action name', async () => {
    const toolbar = await mount('<p style="text-align:center">Hello</p>');
    fixture.componentInstance.engine()!.editor.commands.setTextSelection(2);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(coreControl('alignment').prefixIcon()).toBe('format_align_center');
    expect(control('alignment').getAttribute('aria-label')).toBe(toolbar.t('alignment'));
    toolbar.execute('right');
    expect(fixture.componentInstance.engine()!.editor.getAttributes('paragraph')['textAlign']).toBe('right');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(coreControl('alignment').prefixIcon()).toBe('format_align_right');
    expect(control('alignment').getAttribute('aria-label')).toBe(toolbar.t('alignment'));
  });

  it('changes toolbar variant without narrowing the schema or losing a table', async () => {
    await mount('<p>Hello</p><table><tbody><tr><td><p>Cell</p></td></tr></tbody></table>');
    const engine = fixture.componentInstance.engine()!;
    const schema = engine.editor.schema;
    fixture.componentRef.setInput('variant', 'compact');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.engine()!.editor.schema).toBe(schema);
    expect(engine.getHtml()).toContain('<table');
    expect(control('table')).toBeNull();
    expect(control('link')).not.toBeNull();
    expect(control('more')).not.toBeNull();
  });

  it('formats the selected range and accepts consecutive native activations', async () => {
    await mount();
    const editor = fixture.componentInstance.engine()!.editor;
    editor.commands.setTextSelection({ from: 1, to: 6 });
    fixture.detectChanges();
    await fixture.whenStable();
    const bold = control('bold');
    bold.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    bold.focus();
    bold.click();
    expect(editor.getHTML()).toContain('<strong>Hello</strong>');
    bold.click();
    expect(editor.getHTML()).not.toContain('<strong>');
  });

  it('exposes a mixed mark state on the actual native toggle', async () => {
    await mount('<p><strong>Hello</strong> world</p>');
    fixture.componentInstance.engine()!.editor.commands.setTextSelection({ from: 1, to: 12 });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(control('bold').getAttribute('aria-pressed')).toBe('mixed');
  });

  it('moves keyboard focus between native controls with one toolbar Tab stop', async () => {
    await mount();
    const bold = control('bold');
    bold.focus();
    bold.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(control('italic'));
    expect(fixture.nativeElement.querySelectorAll('button[data-editor-control][tabindex="0"]').length).toBe(1);
  });

  it('keeps focus in a link form, applies to the preserved selection and closes without losing text', async () => {
    const toolbar = await mount();
    const editor = fixture.componentInstance.engine()!.editor;
    editor.commands.setTextSelection({ from: 1, to: 6 });
    control('link').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    control('link').focus();
    control('link').click();
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('.sd-editor-popup input') as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    toolbar.popupValue.set('example.com');
    toolbar.apply();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(editor.getHTML()).toContain('href="https://example.com"');
    expect(editor.getHTML()).toContain('Hello');
    expect(fixture.nativeElement.querySelector('.sd-editor-popup')).toBeNull();
  });

  it('returns Cancel/Escape to the trigger and leaves an outside-click destination alone', async () => {
    const toolbar = await mount();
    control('link').focus();
    control('link').click();
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('.sd-editor-popup input') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(control('link'));
    control('link').click();
    fixture.detectChanges();
    await fixture.whenStable();
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(toolbar.popup()).toBeNull();
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it('does not interpret composing Escape or apply an unfinished popup value', async () => {
    const toolbar = await mount();
    control('link').click();
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('.sd-editor-popup input') as HTMLInputElement;
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', isComposing: true, bubbles: true }));
    toolbar.popupValue.set('example.com');
    toolbar.apply();
    expect(toolbar.popup()).toBe('link');
    expect(fixture.componentInstance.engine()!.editor.getHTML()).not.toContain('<a');
  });

  it('invalidates a pending popup on external replacement or disabling without restoring stale focus', async () => {
    const toolbar = await mount();
    control('link').click();
    fixture.detectChanges();
    await fixture.whenStable();
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    fixture.componentInstance.engine()!.setContent('<p>New document</p>');
    expect(toolbar.popup()).toBeNull();
    toolbar.apply();
    expect(fixture.componentInstance.engine()!.getContent()).toBe('<p>New document</p>');
    expect(document.activeElement).toBe(outside);
    fixture.componentRef.setInput('editable', false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(control('bold').disabled).toBeTrue();
    outside.remove();
  });

  it('resizes a selected imported image without an uploader and preserves metadata/caption', async () => {
    const toolbar = await mount(
      '<figure><img src="https://example.test/photo.png" alt="Photo" width="320" data-id="asset" style="margin-top: 8px"><figcaption>Caption</figcaption></figure>'
    );
    const editor = fixture.componentInstance.engine()!.editor;
    let position = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'image') position = pos;
    });
    expect(position).toBeGreaterThanOrEqual(0);
    editor.commands.setNodeSelection(position);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(toolbar.selectedImage()).toBeTrue();
    expect(toolbar.resizeImage('25%')).toBeTrue();
    const document = new DOMParser().parseFromString(fixture.componentInstance.engine()!.getHtml(), 'text/html');
    const image = document.querySelector('img')!;
    expect(document.querySelector('figure')!.style.width).toBe('25%');
    expect(image.style.width).toBe('100%');
    expect(image.style.marginTop).toBe('8px');
    expect(image.alt).toBe('Photo');
    expect(image.getAttribute('data-id')).toBe('asset');
    expect(document.querySelector('figcaption')!.textContent).toBe('Caption');
    expect(toolbar.resizeImage('75%')).toBeTrue();
    expect(
      new DOMParser().parseFromString(fixture.componentInstance.engine()!.getHtml(), 'text/html').querySelector('figure')!.style.width
    ).toBe('75%');
    expect(toolbar.resizeImage(null)).toBeTrue();
    const original = new DOMParser().parseFromString(fixture.componentInstance.engine()!.getHtml(), 'text/html').querySelector('img')!;
    expect(original.style.width).toBe('');
    expect(original.getAttribute('width')).toBeNull();
    expect(
      new DOMParser().parseFromString(fixture.componentInstance.engine()!.getHtml(), 'text/html').querySelector('figure')!.style.width
    ).toBe('fit-content');
  });

  it('aligns a selected image through safe preserved styles and disables it in readonly', async () => {
    const toolbar = await mount('<p>Before</p><img src="https://example.test/photo.png" alt="Photo" style="margin-top: 8px">');
    const editor = fixture.componentInstance.engine()!.editor;
    let position = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'image') position = pos;
    });
    editor.commands.setNodeSelection(position);
    expect(toolbar.alignImage('center')).toBeTrue();
    const image = new DOMParser().parseFromString(fixture.componentInstance.engine()!.getHtml(), 'text/html').querySelector('img')!;
    expect(image.style.display).toBe('block');
    expect(image.style.marginLeft).toBe('auto');
    expect(image.style.marginRight).toBe('auto');
    expect(image.style.marginTop).toBe('8px');
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(toolbar.alignImage('left')).toBeFalse();
  });

  it('changes imported size, color, font and alignment while retaining unrelated metadata', async () => {
    const toolbar = await mount(
      '<p style="text-align: left"><span data-note="keep" style="color: red; font-size: 12px; font-family: Arial">Hello</span></p>'
    );
    const engine = fixture.componentInstance.engine()!;
    engine.editor.commands.setTextSelection({ from: 1, to: 6 });
    toolbar.setSize('18');
    toolbar.open('color', 'color');
    toolbar.popupValue.set('blue');
    toolbar.apply();
    toolbar.open('font', 'font');
    toolbar.popupValue.set('serif');
    toolbar.apply();
    toolbar.execute('right');
    const parsed = new DOMParser().parseFromString(engine.getHtml(), 'text/html');
    const span = parsed.querySelector('span')!;
    expect(span.style.fontSize).toBe('18px');
    expect(span.style.color).toBe('blue');
    expect(span.style.fontFamily).toBe('serif');
    expect(span.getAttribute('data-note')).toBe('keep');
    expect(parsed.querySelector('p')!.style.textAlign).toBe('right');
  });

  it('returns a popup to visible More if its original control disappears on reflow', async () => {
    const toolbar = await mount();
    toolbar.open('color', 'color');
    fixture.detectChanges();
    await fixture.whenStable();
    control('color').style.display = 'none';
    toolbar.close(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(control('more'));
  });
});
