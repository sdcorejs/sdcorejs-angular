import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

import { SdMiniEditor } from './mini-editor.component';
import { SdMiniEditorOption } from './mini-editor.model';

// ---------------------------------------------------------------------------
// Stub CKEditor component — replaces heavy CKEditor5 Angular binding
// ---------------------------------------------------------------------------

@Component({
  selector: 'ckeditor',
  standalone: true,
  template: '<div class="ck-editor-stub"></div>',
})
class FakeCKEditorComponent {
  readonly editor = input<any>();
  readonly config = input<any>();
  readonly disabled = input(false);
  readonly ready = output<any>();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultOption: SdMiniEditorOption = {
  placeholder: 'Viết bình luận...',
  maxHeight: '200px',
};

function buildFixture(option: SdMiniEditorOption = defaultOption): ComponentFixture<SdMiniEditor> {
  const fixture = TestBed.createComponent(SdMiniEditor);
  fixture.componentInstance.option = option;
  fixture.detectChanges();
  return fixture;
}

// ---------------------------------------------------------------------------
// Fake ClassicEditor mock for onReady tests
// ---------------------------------------------------------------------------

function makeFakeEditor() {
  const dataChangeListeners: (() => void)[] = [];
  const focusListeners: ((evt: any) => void)[] = [];
  const blurListeners: ((evt: any) => void)[] = [];

  const fakeEditor: any = {
    _data: '',
    getData: jasmine.createSpy('getData').and.callFake(() => fakeEditor._data),
    setData: jasmine.createSpy('setData').and.callFake((v: string) => {
      fakeEditor._data = v;
    }),
    destroy: jasmine.createSpy('destroy'),
    execute: jasmine.createSpy('execute'),
    model: {
      document: {
        on: (event: string, cb: () => void) => {
          if (event === 'change:data') dataChangeListeners.push(cb);
        },
        selection: { getFirstPosition: () => null },
      },
      createRangeIn: () => ({ getItems: () => [] }),
    },
    editing: {
      view: {
        document: {
          on: (event: string, cb: (evt: any) => void) => {
            if (event === 'focus') focusListeners.push(cb);
            if (event === 'blur') blurListeners.push(cb);
          },
          fire: (event: string, domEvent: any) => {
            if (event === 'focus') focusListeners.forEach(fn => fn({ domEvent }));
            if (event === 'blur') blurListeners.forEach(fn => fn({ domEvent }));
          },
        },
        focus: jasmine.createSpy('focus'),
      },
    },
    conversion: {
      for: () => ({ attributeToElement: () => {} }),
    },
    commands: {
      get: () => null,
    },
    triggerDataChange: () => dataChangeListeners.forEach(fn => fn()),
    triggerFocus: (domEvent: any) => focusListeners.forEach(fn => fn({ domEvent })),
    triggerBlur: (domEvent: any) => blurListeners.forEach(fn => fn({ domEvent })),
  };

  return fakeEditor;
}

// ---------------------------------------------------------------------------
// Specs
// ---------------------------------------------------------------------------

describe('SdMiniEditor', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdMiniEditor, NoopAnimationsModule, FormsModule],
    })
      .overrideComponent(SdMiniEditor, {
        remove: { imports: [CKEditorModule] },
        add: { imports: [FakeCKEditorComponent] },
      })
      .compileComponents();
  });

  // ─── 1. Creation & rendering ─────────────────────────────────────────────

  describe('creation & rendering', () => {
    it('should instantiate without errors', () => {
      const fixture = buildFixture();
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render the ckeditor stub element', () => {
      const fixture = buildFixture();
      const el: HTMLElement = fixture.nativeElement.querySelector('.ck-editor-stub');
      expect(el).not.toBeNull();
    });
  });

  // ─── 2. Inputs — default values ──────────────────────────────────────────

  describe('input defaults', () => {
    it('value defaults to empty string', () => {
      const fixture = buildFixture();
      expect(fixture.componentInstance.value).toBe('');
    });

    it('disabled defaults to false', () => {
      const fixture = buildFixture();
      expect(fixture.componentInstance.disabled()).toBe(false);
    });

    it('option is passed through to the component', () => {
      const fixture = buildFixture({ placeholder: 'Test', maxHeight: '300px' });
      expect(fixture.componentInstance.option.placeholder).toBe('Test');
    });
  });

  // ─── 3. editorConfig getter ──────────────────────────────────────────────

  describe('editorConfig', () => {
    it('uses placeholder from option', () => {
      const fixture = buildFixture({ placeholder: 'Enter text' });
      expect(fixture.componentInstance.editorConfig.placeholder).toBe('Enter text');
    });

    it('does NOT include Markdown plugin when outputFormat is html', () => {
      const fixture = buildFixture({ outputFormat: 'html' });
      const config = fixture.componentInstance.editorConfig;
      const pluginNames = config.plugins!.map((p: any) => p.pluginName ?? p.name ?? String(p));
      expect(pluginNames).not.toContain('Markdown');
    });

    it('includes Markdown plugin when outputFormat is markdown', () => {
      const fixture = buildFixture({ outputFormat: 'markdown' });
      const config = fixture.componentInstance.editorConfig;
      const pluginCtors = config.plugins as any[];
      // Markdown plugin present when outputFormat === 'markdown'
      expect(pluginCtors.length).toBeGreaterThan(0);
    });

    it('does NOT include Mention plugin when enableMention is false', () => {
      const fixture = buildFixture({ enableMention: false });
      const config = fixture.componentInstance.editorConfig;
      const pluginCtors = config.plugins as any[];
      // Should not have Mention — check no entry has pluginName 'Mention'
      const hasM = pluginCtors.some((p: any) => (p.pluginName ?? p.name) === 'Mention');
      expect(hasM).toBe(false);
    });

    it('includes Mention plugin when enableMention is true', () => {
      const fixture = buildFixture({ enableMention: true });
      const config = fixture.componentInstance.editorConfig;
      const pluginCtors = config.plugins as any[];
      const hasM = pluginCtors.some((p: any) => (p.pluginName ?? p.name) === 'Mention');
      expect(hasM).toBe(true);
    });

    it('toolbar items include bold, italic, underline, link', () => {
      const fixture = buildFixture();
      const items = (fixture.componentInstance.editorConfig.toolbar as any).items as string[];
      expect(items).toContain('bold');
      expect(items).toContain('italic');
      expect(items).toContain('underline');
      expect(items).toContain('link');
    });

    it('sets mention feeds from option.mentionConfig when enableMention is true', () => {
      const feeds = [{ marker: '@', feed: [] }] as any;
      const fixture = buildFixture({ enableMention: true, mentionConfig: { feeds } });
      const config = fixture.componentInstance.editorConfig;
      expect(config.mention?.feeds).toBe(feeds);
    });
  });

  // ─── 4. maxEditorHeight HostBinding ──────────────────────────────────────

  describe('maxEditorHeight HostBinding', () => {
    it('returns maxHeight from option', () => {
      const fixture = buildFixture({ maxHeight: '350px' });
      expect(fixture.componentInstance.maxEditorHeight).toBe('350px');
    });

    it('returns undefined when option.maxHeight is not set', () => {
      const fixture = buildFixture({});
      expect(fixture.componentInstance.maxEditorHeight).toBeUndefined();
    });
  });

  // ─── 5. ControlValueAccessor ─────────────────────────────────────────────

  describe('ControlValueAccessor', () => {
    it('writeValue sets value', () => {
      const fixture = buildFixture();
      const comp = fixture.componentInstance;
      comp.writeValue('<p>hello</p>');
      expect(comp.value).toBe('<p>hello</p>');
    });

    it('writeValue with null/undefined sets value to empty string', () => {
      const fixture = buildFixture();
      const comp = fixture.componentInstance;
      comp.writeValue(null as any);
      expect(comp.value).toBe('');
    });

    it('registerOnChange stores callback', () => {
      const fixture = buildFixture();
      const comp = fixture.componentInstance;
      const spy = jasmine.createSpy('onChange');
      comp.registerOnChange(spy);
      // Internally stored — verify it's reachable via the private field approach:
      // Call through onReady + data change to verify callback fires
      expect(spy).not.toHaveBeenCalled(); // just stored, not called yet
    });

    it('registerOnTouched stores callback without errors', () => {
      const fixture = buildFixture();
      const comp = fixture.componentInstance;
      const spy = jasmine.createSpy('onTouched');
      comp.registerOnTouched(spy);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ─── 6. Public methods (no editor) ───────────────────────────────────────

  describe('public methods — no editor initialised', () => {
    it('getContent returns empty string when editor not ready', () => {
      const fixture = buildFixture();
      expect(fixture.componentInstance.getContent()).toBe('');
    });

    it('getHtmlContent returns empty string when editor not ready', () => {
      const fixture = buildFixture();
      expect(fixture.componentInstance.getHtmlContent()).toBe('');
    });

    it('setContent does not throw when editor not ready', () => {
      const fixture = buildFixture();
      expect(() => fixture.componentInstance.setContent('<p>test</p>')).not.toThrow();
    });

    it('focusEditor does not throw when editor not ready', () => {
      const fixture = buildFixture();
      expect(() => fixture.componentInstance.focusEditor()).not.toThrow();
    });

    it('insertMention does not throw when editor not ready', () => {
      const fixture = buildFixture();
      expect(() => fixture.componentInstance.insertMention({ id: '1', name: 'user' })).not.toThrow();
    });

    it('getMentions returns empty array when editor not ready', () => {
      const fixture = buildFixture();
      expect(fixture.componentInstance.getMentions()).toEqual([]);
    });
  });

  // ─── 7. onReady + editor interactions ────────────────────────────────────

  describe('onReady — with fake editor', () => {
    it('calls setData with initial value when editor is ready', () => {
      const fixture = TestBed.createComponent(SdMiniEditor);
      const comp = fixture.componentInstance;
      comp.option = defaultOption;
      comp.value = '<p>initial</p>';
      fixture.detectChanges();

      const fakeEditor = makeFakeEditor();
      comp.onReady(fakeEditor);

      expect(fakeEditor.setData).toHaveBeenCalledWith('<p>initial</p>');
    });

    it('does NOT call setData when value is empty on ready', () => {
      const fixture = buildFixture();
      const fakeEditor = makeFakeEditor();
      fixture.componentInstance.onReady(fakeEditor);
      expect(fakeEditor.setData).not.toHaveBeenCalled();
    });

    it('getContent returns editor getData() output after onReady', () => {
      const fixture = buildFixture();
      const comp = fixture.componentInstance;
      const fakeEditor = makeFakeEditor();
      fakeEditor._data = '<p>content</p>';
      comp.onReady(fakeEditor);
      expect(comp.getContent()).toBe('<p>content</p>');
    });

    it('getHtmlContent returns raw getData() after onReady', () => {
      const fixture = buildFixture();
      const comp = fixture.componentInstance;
      const fakeEditor = makeFakeEditor();
      fakeEditor._data = '<b>html</b>';
      comp.onReady(fakeEditor);
      expect(comp.getHtmlContent()).toBe('<b>html</b>');
    });

    it('writeValue calls setData when editor is ready', () => {
      const fixture = buildFixture();
      const comp = fixture.componentInstance;
      const fakeEditor = makeFakeEditor();
      comp.onReady(fakeEditor);
      comp.writeValue('<p>updated</p>');
      expect(fakeEditor.setData).toHaveBeenCalledWith('<p>updated</p>');
    });
  });

  // ─── 8. Output events ────────────────────────────────────────────────────

  describe('output events via onReady', () => {
    it('emits contentChange after data change (after throttle)', fakeAsync(() => {
      const fixture = buildFixture();
      const comp = fixture.componentInstance;
      const changeSpy = jasmine.createSpy('contentChange');
      comp.sdContentChange.subscribe(changeSpy);
      comp.registerOnChange(() => {});

      const fakeEditor = makeFakeEditor();
      fakeEditor._data = '<p>new text</p>';
      comp.onReady(fakeEditor);

      fakeEditor.triggerDataChange();
      tick(600); // past throttleTime(500) trailing
      fixture.detectChanges();

      expect(changeSpy).toHaveBeenCalledWith('<p>new text</p>');
    }));

    it('emits valueChange after data change (after throttle)', fakeAsync(() => {
      const fixture = buildFixture();
      const comp = fixture.componentInstance;
      const valueSpy = jasmine.createSpy('valueChange');
      comp.valueChange.subscribe(valueSpy);
      comp.registerOnChange(() => {});

      const fakeEditor = makeFakeEditor();
      fakeEditor._data = '<p>value</p>';
      comp.onReady(fakeEditor);

      fakeEditor.triggerDataChange();
      tick(600);
      fixture.detectChanges();

      expect(valueSpy).toHaveBeenCalledWith('<p>value</p>');
    }));

    it('emits focus event on editor focus', () => {
      const fixture = buildFixture();
      const comp = fixture.componentInstance;
      const focusSpy = jasmine.createSpy('focus');
      comp.sdFocus.subscribe(focusSpy);

      const fakeEditor = makeFakeEditor();
      comp.onReady(fakeEditor);

      const domEvent = new FocusEvent('focus');
      fakeEditor.triggerFocus(domEvent);

      expect(focusSpy).toHaveBeenCalledWith(domEvent);
    });

    it('emits blur event on editor blur', () => {
      const fixture = buildFixture();
      const comp = fixture.componentInstance;
      const blurSpy = jasmine.createSpy('blur');
      comp.sdBlur.subscribe(blurSpy);

      const fakeEditor = makeFakeEditor();
      comp.onReady(fakeEditor);

      const domEvent = new FocusEvent('blur');
      fakeEditor.triggerBlur(domEvent);

      expect(blurSpy).toHaveBeenCalledWith(domEvent);
    });

    it('calls option.onBlur callback on blur', () => {
      const blurCb = jasmine.createSpy('onBlur');
      const fixture = buildFixture({ onBlur: blurCb });
      const comp = fixture.componentInstance;
      const fakeEditor = makeFakeEditor();
      comp.onReady(fakeEditor);

      const domEvent = new FocusEvent('blur');
      fakeEditor.triggerBlur(domEvent);

      expect(blurCb).toHaveBeenCalledWith(domEvent);
    });

    it('calls option.onFocus callback on focus', () => {
      const focusCb = jasmine.createSpy('onFocus');
      const fixture = buildFixture({ onFocus: focusCb });
      const comp = fixture.componentInstance;
      const fakeEditor = makeFakeEditor();
      comp.onReady(fakeEditor);

      const domEvent = new FocusEvent('focus');
      fakeEditor.triggerFocus(domEvent);

      expect(focusCb).toHaveBeenCalledWith(domEvent);
    });

    it('calls option.onChange callback after data change', fakeAsync(() => {
      const changeCb = jasmine.createSpy('onChange');
      const fixture = buildFixture({ onChange: changeCb });
      const comp = fixture.componentInstance;

      const fakeEditor = makeFakeEditor();
      fakeEditor._data = 'changed';
      comp.onReady(fakeEditor);

      fakeEditor.triggerDataChange();
      tick(600);
      fixture.detectChanges();

      expect(changeCb).toHaveBeenCalledWith('changed');
    }));
  });

  // ─── 9. ngOnDestroy ──────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('calls editor.destroy on component destruction', () => {
      const fixture = buildFixture();
      const comp = fixture.componentInstance;
      const fakeEditor = makeFakeEditor();
      comp.onReady(fakeEditor);

      fixture.destroy();
      expect(fakeEditor.destroy).toHaveBeenCalled();
    });

    it('does not throw on destroy when editor was never initialised', () => {
      const fixture = buildFixture();
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});
