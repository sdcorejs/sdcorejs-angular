import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdFormControl } from '@sdcorejs/angular/forms/models';

import { SdInlineText } from './inline-text.component';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdInlineText, FormsModule, ReactiveFormsModule],
  template: `
    <sd-inline-text
      [(value)]="value"
      [control]="control"
      [placeholder]="placeholder"
      [disabled]="disabled"
      [clearable]="clearable"
      [state]="state"
      [chrome]="chrome"
      [autoId]="autoId"
      [autofocus]="autofocus"
      [minSize]="minSize"
      (cleared)="clearedCount = clearedCount + 1"
      (keyupEnter)="enterCount = enterCount + 1"
      (keydownEscape)="escapeCount = escapeCount + 1"
      (sdFocus)="focusCount = focusCount + 1"
      (sdBlur)="blurCount = blurCount + 1"
      (sdKeydown)="lastKeydown = $event"
      (sdPaste)="pasteCount = pasteCount + 1">
    </sd-inline-text>
  `,
})
class HostComponent {
  @ViewChild(SdInlineText) cmp!: SdInlineText;
  value = '';
  control: SdFormControl | undefined = undefined;
  placeholder = '';
  disabled = false;
  clearable = true;
  state: 'auto' | 'pending' | 'active' | 'focus' | 'error' = 'auto';
  chrome: 'standalone' | 'seamless' = 'standalone';
  autoId: string | undefined = undefined;
  autofocus = false;
  minSize = 2;

  clearedCount = 0;
  enterCount = 0;
  escapeCount = 0;
  focusCount = 0;
  blurCount = 0;
  pasteCount = 0;
  lastKeydown: KeyboardEvent | undefined;
}

function setup(patch: Partial<HostComponent> = {}): {
  fixture: ComponentFixture<HostComponent>;
  host: HostComponent;
  input: () => HTMLInputElement;
  clearBtn: () => HTMLElement | null;
  root: () => HTMLElement;
} {
  const fixture = TestBed.createComponent(HostComponent);
  Object.assign(fixture.componentInstance, patch);
  fixture.detectChanges();
  return {
    fixture,
    host: fixture.componentInstance,
    input: () => fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement,
    clearBtn: () => {
      const de = fixture.debugElement.query(By.css('.sd-inline-text__clear'));
      return de ? (de.nativeElement as HTMLElement) : null;
    },
    root: () => fixture.debugElement.query(By.css('.sd-inline-text')).nativeElement as HTMLElement,
  };
}

describe('SdInlineText — primitive shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  it('renders a raw <input>, not a mat-form-field', () => {
    const { fixture } = setup();
    expect(fixture.debugElement.query(By.css('input'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('mat-form-field'))).toBeNull();
  });

  it('exposes the chrome variant via a host class', () => {
    const { root, fixture, host } = setup({ chrome: 'standalone' });
    expect(root().classList).toContain('sd-inline-text--standalone');

    host.chrome = 'seamless';
    fixture.detectChanges();
    expect(root().classList).toContain('sd-inline-text--seamless');
    expect(root().classList).not.toContain('sd-inline-text--standalone');
  });
});

describe('SdInlineText — content-hug sizing', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent, NoopAnimationsModule] }).compileComponents();
  });

  it('sizes the input to the value length', () => {
    const { input } = setup({ value: 'hello world' });
    expect(input().size).toBe('hello world'.length);
  });

  it('falls back to the placeholder length when empty', () => {
    const { input } = setup({ value: '', placeholder: 'nhập giá trị' });
    expect(input().size).toBe('nhập giá trị'.length);
  });

  it('floors the size at minSize for short/empty content', () => {
    const { input } = setup({ value: '', placeholder: '', minSize: 2 });
    expect(input().size).toBe(2);

    const { input: input2 } = setup({ value: 'x', placeholder: '', minSize: 4 });
    expect(input2().size).toBe(4);
  });

  it('grows the size as the value grows', () => {
    const { fixture, host, input } = setup({ value: 'ab' });
    expect(input().size).toBe(2);
    host.value = 'abcdefghij';
    fixture.detectChanges();
    expect(input().size).toBe(10);
  });
});

describe('SdInlineText — data-state', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent, NoopAnimationsModule] }).compileComponents();
  });

  it('is "pending" when empty and not focused', () => {
    const { root } = setup({ value: '' });
    expect(root().getAttribute('data-state')).toBe('pending');
  });

  it('is "active" when a value is present and not focused', () => {
    const { root } = setup({ value: '42' });
    expect(root().getAttribute('data-state')).toBe('active');
  });

  it('is "focus" while the input is focused', () => {
    const { root, input, fixture } = setup({ value: '42' });
    input().dispatchEvent(new Event('focus', { bubbles: true }));
    fixture.detectChanges();
    expect(root().getAttribute('data-state')).toBe('focus');
  });

  it('honours an explicit state override (error)', () => {
    const { root } = setup({ value: '42', state: 'error' });
    expect(root().getAttribute('data-state')).toBe('error');
  });
});

describe('SdInlineText — clear button', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent, NoopAnimationsModule] }).compileComponents();
  });

  it('renders the clear-× when clearable + has value + enabled', () => {
    const { clearBtn } = setup({ value: 'abc', clearable: true, disabled: false });
    expect(clearBtn()).toBeTruthy();
  });

  it('hides the clear-× when there is no value', () => {
    const { clearBtn } = setup({ value: '', clearable: true });
    expect(clearBtn()).toBeNull();
  });

  it('hides the clear-× when clearable is false', () => {
    const { clearBtn } = setup({ value: 'abc', clearable: false });
    expect(clearBtn()).toBeNull();
  });

  it('hides the clear-× when disabled', () => {
    const { clearBtn } = setup({ value: 'abc', disabled: true });
    expect(clearBtn()).toBeNull();
  });

  it('clears the value and emits (cleared) on click', () => {
    const { clearBtn, host, fixture } = setup({ value: 'abc' });
    clearBtn()!.click();
    fixture.detectChanges();
    expect(host.value).toBe('');
    expect(host.clearedCount).toBe(1);
  });
});

describe('SdInlineText — value binding (uncontrolled)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent, NoopAnimationsModule] }).compileComponents();
  });

  it('writes typed text back to the value model', () => {
    const { input, host, fixture } = setup({ value: '' });
    const el = input();
    el.value = 'typed';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(host.value).toBe('typed');
  });
});

describe('SdInlineText — controlled binding ([control])', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent, NoopAnimationsModule] }).compileComponents();
  });

  it('reflects the external FormControl value and hugs it', () => {
    const control = new SdFormControl({ value: 'preset', disabled: false });
    const { input } = setup({ control });
    expect(input().value).toBe('preset');
    expect(input().size).toBe('preset'.length);
  });

  it('disables the input when the bound control is disabled', () => {
    const control = new SdFormControl({ value: 'x', disabled: true });
    const { input } = setup({ control });
    expect(input().disabled).toBeTrue();
  });
});

describe('SdInlineText — disabled + autoId', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent, NoopAnimationsModule] }).compileComponents();
  });

  it('disables the input via the disabled input', () => {
    const { input } = setup({ disabled: true });
    expect(input().disabled).toBeTrue();
  });

  it('renders data-autoId on the input', () => {
    const { input } = setup({ autoId: 'amount' });
    expect(input().getAttribute('data-autoId')).toBe('amount');
  });
});

describe('SdInlineText — event passthrough + focus API', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent, NoopAnimationsModule] }).compileComponents();
  });

  it('emits (sdFocus) / (sdBlur)', () => {
    const { input, host, fixture } = setup();
    input().dispatchEvent(new Event('focus', { bubbles: true }));
    input().dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(host.focusCount).toBe(1);
    expect(host.blurCount).toBe(1);
  });

  it('emits (keyupEnter) on Enter and (keydownEscape) on Escape', () => {
    const { input, host, fixture } = setup();
    input().dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(host.enterCount).toBe(1);
    expect(host.escapeCount).toBe(1);
  });

  it('forwards (sdKeydown) and (sdPaste)', () => {
    const { input, host, fixture } = setup();
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    input().dispatchEvent(new ClipboardEvent('paste', { bubbles: true }));
    fixture.detectChanges();
    expect(host.lastKeydown?.key).toBe('a');
    expect(host.pasteCount).toBe(1);
  });

  it('focus() / blur() drive the native input', () => {
    const { fixture, host, input } = setup();
    host.cmp.focus();
    expect(document.activeElement).toBe(input());
    host.cmp.blur();
    expect(document.activeElement).not.toBe(input());
  });

  it('autofocus focuses the input on render', () => {
    const { input } = setup({ autofocus: true });
    expect(document.activeElement).toBe(input());
  });
});
