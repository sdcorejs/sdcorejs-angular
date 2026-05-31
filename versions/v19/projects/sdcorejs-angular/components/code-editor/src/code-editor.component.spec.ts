import { Clipboard } from '@angular/cdk/clipboard';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SdCodeEditor } from './code-editor.component';
import { queryByCss, setInput } from '../../../testing/test-utils';

describe('SdCodeEditor', () => {
  let fixture: ComponentFixture<SdCodeEditor>;
  let component: SdCodeEditor;
  let clipboardSpy: jasmine.SpyObj<Clipboard>;

  beforeEach(async () => {
    clipboardSpy = jasmine.createSpyObj<Clipboard>('Clipboard', ['copy']);
    clipboardSpy.copy.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [SdCodeEditor, NoopAnimationsModule],
      providers: [{ provide: Clipboard, useValue: clipboardSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(SdCodeEditor);
    component = fixture.componentInstance;
  });

  // ─── 1. Creation & rendering ───────────────────────────────────────────────

  describe('creation & rendering', () => {
    it('should instantiate without errors', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render the sd-code-wrapper container', () => {
      fixture.detectChanges();
      const wrapper = queryByCss(fixture, '.sd-code-wrapper');
      expect(wrapper).not.toBeNull();
    });

    it('should render the header section', () => {
      fixture.detectChanges();
      expect(queryByCss(fixture, '.sd-code-header')).not.toBeNull();
    });

    it('should render the mac-dots decoration', () => {
      fixture.detectChanges();
      const dots = fixture.nativeElement.querySelectorAll('.mac-dots .dot');
      expect(dots.length).toBe(3);
    });
  });

  // ─── 2. Input: language ────────────────────────────────────────────────────

  describe('input: language', () => {
    it('defaults to "typescript" and shows TYPESCRIPT in header', () => {
      fixture.detectChanges();
      const badge = queryByCss(fixture, '.lang-badge');
      expect(badge.textContent).toContain('TYPESCRIPT');
    });

    it('shows JSON when language="json"', () => {
      setInput(fixture, 'language', 'json');
      const badge = queryByCss(fixture, '.lang-badge');
      expect(badge.textContent).toContain('JSON');
    });

    it('maps language="html" to prismLang "markup"', () => {
      setInput(fixture, 'language', 'html');
      expect(component.prismLang()).toBe('markup');
    });

    it('keeps prismLang equal to language for non-html languages', () => {
      setInput(fixture, 'language', 'typescript');
      expect(component.prismLang()).toBe('typescript');
    });
  });

  // ─── 3. Input: viewed (readonly) ──────────────────────────────────────────

  describe('input: viewed (readonly)', () => {
    it('defaults viewed to false and shows "(EDITING)" label', () => {
      fixture.detectChanges();
      const badge = queryByCss(fixture, '.lang-badge');
      expect(badge.textContent).toContain('(EDITING)');
    });

    it('shows "(READ ONLY)" label when viewed=true', () => {
      setInput(fixture, 'viewed', true);
      const badge = queryByCss(fixture, '.lang-badge');
      expect(badge.textContent).toContain('(READ ONLY)');
    });

    it('hides the textarea when viewed=true', () => {
      setInput(fixture, 'viewed', true);
      const textarea = fixture.nativeElement.querySelector('textarea.code-textarea');
      expect(textarea).toBeNull();
    });

    it('shows the textarea when viewed=false (editable)', () => {
      setInput(fixture, 'viewed', false);
      const textarea = queryByCss(fixture, 'textarea.code-textarea');
      expect(textarea).not.toBeNull();
    });

    it('adds is-editable class to wrapper when viewed=false', () => {
      setInput(fixture, 'viewed', false);
      const wrapper = queryByCss(fixture, '.sd-code-wrapper');
      expect(wrapper.classList.contains('is-editable')).toBe(true);
    });

    it('does NOT add is-editable class when viewed=true', () => {
      setInput(fixture, 'viewed', true);
      const wrapper = queryByCss(fixture, '.sd-code-wrapper');
      expect(wrapper.classList.contains('is-editable')).toBe(false);
    });
  });

  // ─── 4. Input: model (value) ───────────────────────────────────────────────

  describe('input: model (value)', () => {
    it('sets textValue when a string is passed as model', () => {
      fixture.componentRef.setInput('model', 'const x = 1;');
      fixture.detectChanges();
      expect(component.textValue()).toBe('const x = 1;');
    });

    it('JSON.stringifies an object when language="json"', () => {
      setInput(fixture, 'language', 'json');
      fixture.componentRef.setInput('model', { key: 'value' });
      fixture.detectChanges();
      const parsed = JSON.parse(component.textValue());
      expect(parsed).toEqual({ key: 'value' });
    });

    it('calls String() for non-string, non-object when language is typescript', () => {
      setInput(fixture, 'language', 'typescript');
      fixture.componentRef.setInput('model', 42);
      fixture.detectChanges();
      expect(component.textValue()).toBe('42');
    });

    it('sets textValue to empty string when model is undefined', () => {
      fixture.componentRef.setInput('model', undefined);
      fixture.detectChanges();
      expect(component.textValue()).toBe('');
    });

    it('sets textValue to empty string when model is null', () => {
      fixture.componentRef.setInput('model', null);
      fixture.detectChanges();
      expect(component.textValue()).toBe('');
    });
  });

  // ─── 5. Syntax highlighting ────────────────────────────────────────────────

  describe('syntax highlighting', () => {
    it('renders a <pre><code> block for highlighted output', () => {
      fixture.detectChanges();
      expect(queryByCss(fixture, 'pre.code-display code')).not.toBeNull();
    });

    it('applies language-typescript class on <code> by default', () => {
      fixture.detectChanges();
      const code = queryByCss(fixture, 'pre.code-display code');
      expect(code.classList.contains('language-typescript')).toBe(true);
    });

    it('applies language-markup class on <code> when language="html"', () => {
      setInput(fixture, 'language', 'html');
      const code = queryByCss(fixture, 'pre.code-display code');
      expect(code.classList.contains('language-markup')).toBe(true);
    });

    it('applies language-json class on <code> when language="json"', () => {
      setInput(fixture, 'language', 'json');
      const code = queryByCss(fixture, 'pre.code-display code');
      expect(code.classList.contains('language-json')).toBe(true);
    });

    it('highlightedCode returns SafeHtml (truthy) when textValue is set', () => {
      fixture.componentRef.setInput('model', 'const x = 1;');
      fixture.detectChanges();
      expect(component.highlightedCode()).toBeTruthy();
    });
  });

  // ─── 6. onTextChange (editor → model) ─────────────────────────────────────

  describe('onTextChange', () => {
    it('updates textValue on direct method call', () => {
      fixture.detectChanges();
      component.onTextChange('const y = 2;');
      expect(component.textValue()).toBe('const y = 2;');
    });

    it('emits raw string via valueModel for typescript language', () => {
      setInput(fixture, 'language', 'typescript');
      component.onTextChange('let a = 0;');
      expect(component.valueModel()).toBe('let a = 0;');
    });

    it('emits parsed object via valueModel for valid JSON input', () => {
      setInput(fixture, 'language', 'json');
      component.onTextChange('{"foo":"bar"}');
      expect(component.valueModel()).toEqual({ foo: 'bar' });
    });

    it('emits raw string via valueModel when JSON is invalid', () => {
      setInput(fixture, 'language', 'json');
      component.onTextChange('{invalid json');
      expect(component.valueModel()).toBe('{invalid json');
    });

    it('updates textValue when the textarea fires an input event', () => {
      setInput(fixture, 'viewed', false);
      const textarea = queryByCss<HTMLTextAreaElement>(fixture, 'textarea.code-textarea');
      (textarea as any).value = 'typed text';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
      expect(component.textValue()).toBe('typed text');
    });
  });

  // ─── 7. Copy to clipboard ─────────────────────────────────────────────────

  describe('copyToClipboard', () => {
    it('calls Clipboard.copy with current textValue', () => {
      fixture.componentRef.setInput('model', 'copy me');
      fixture.detectChanges();
      component.copyToClipboard();
      expect(clipboardSpy.copy).toHaveBeenCalledWith('copy me');
    });

    it('sets copied=true immediately after a successful copy', () => {
      fixture.componentRef.setInput('model', 'copy me');
      fixture.detectChanges();
      component.copyToClipboard();
      expect(component.copied()).toBe(true);
    });

    it('resets copied to false after 2000 ms', fakeAsync(() => {
      fixture.componentRef.setInput('model', 'copy me');
      fixture.detectChanges();
      component.copyToClipboard();
      expect(component.copied()).toBe(true);
      tick(2000);
      expect(component.copied()).toBe(false);
    }));

    it('does not call Clipboard.copy when textValue is empty', () => {
      fixture.detectChanges();
      component.copyToClipboard();
      expect(clipboardSpy.copy).not.toHaveBeenCalled();
    });

    it('shows copy button in the header', () => {
      fixture.detectChanges();
      expect(queryByCss(fixture, 'button.copy-btn')).not.toBeNull();
    });
  });

  // ─── 8. maxHeight input ───────────────────────────────────────────────────

  describe('input: maxHeight', () => {
    it('defaults maxHeight to 500px', () => {
      fixture.detectChanges();
      expect(component.maxHeight()).toBe('500px');
    });

    it('applies custom maxHeight style to the content div', () => {
      setInput(fixture, 'maxHeight', '300px');
      const content = queryByCss(fixture, '.sd-code-content');
      expect(content.style.maxHeight).toBe('300px');
    });
  });
});
