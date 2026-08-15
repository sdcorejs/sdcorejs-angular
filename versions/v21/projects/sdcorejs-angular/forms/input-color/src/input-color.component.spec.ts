import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdInputColor } from './input-color.component';

@Component({
  standalone: true,
  imports: [SdInputColor, FormsModule, ReactiveFormsModule],
  template: `
    <sd-input-color
      [label]="label"
      [helperText]="helperText"
      [placeholder]="placeholder"
      [required]="required"
      [disabled]="disabled"
      [readonly]="readOnly"
      [clearable]="clearable"
      [hideInlineError]="hideInlineError"
      [viewed]="viewed"
      [(model)]="value"
      (sdChange)="changes.push($event)">
    </sd-input-color>
  `,
})
class HostComponent {
  @ViewChild(SdInputColor) component!: SdInputColor;
  label: string | undefined = 'Màu thương hiệu';
  helperText: string | undefined = undefined;
  placeholder = '#RRGGBB';
  required = false;
  disabled = false;
  readOnly = false;
  clearable = false;
  hideInlineError = false;
  viewed = false;
  value: string | null | undefined = undefined;
  changes: (string | null | undefined)[] = [];
}

function getColor(fixture: ComponentFixture<HostComponent>): SdInputColor {
  return fixture.componentInstance.component;
}

function getHostEl(fixture: ComponentFixture<HostComponent>): HTMLElement {
  return fixture.debugElement.query(By.directive(SdInputColor)).nativeElement as HTMLElement;
}

function getSwatch(fixture: ComponentFixture<HostComponent>): HTMLButtonElement {
  const el = fixture.nativeElement.querySelector('.sd-input-color__swatch') as HTMLButtonElement;
  if (!el) throw new Error('swatch button not found');
  return el;
}

function getHiddenPicker(fixture: ComponentFixture<HostComponent>): HTMLInputElement {
  const el = fixture.nativeElement.querySelector('input.sd-input-color__hidden-picker') as HTMLInputElement;
  if (!el) throw new Error('hidden picker not found');
  return el;
}

function getTextInput(fixture: ComponentFixture<HostComponent>): HTMLInputElement {
  const el = fixture.nativeElement.querySelector('input[matInput]') as HTMLInputElement;
  if (!el) throw new Error('matInput not found');
  return el;
}

function getInnerSdInput<TFixture>(fixture: ComponentFixture<TFixture>): {
  hideInlineError: () => boolean;
  viewed: () => unknown;
  clearable: () => boolean;
} {
  const debugElement = fixture.debugElement.query(By.css('sd-input'));
  if (!debugElement?.componentInstance) throw new Error('inner sd-input not found');
  return debugElement.componentInstance as { hideInlineError: () => boolean; viewed: () => unknown; clearable: () => boolean };
}

describe('SdInputColor', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let component: SdInputColor;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = getColor(fixture);
  });

  describe('creation', () => {
    it('creates the component', () => {
      expect(component).toBeTruthy();
    });

    it('renders inner sd-input element', () => {
      expect(fixture.nativeElement.querySelector('sd-input')).not.toBeNull();
    });

    it('renders the swatch button', () => {
      expect(getSwatch(fixture)).toBeTruthy();
    });

    it('renders the hidden native color picker', () => {
      expect(getHiddenPicker(fixture).type).toBe('color');
    });
  });

  describe('placeholder default', () => {
    it('defaults placeholder to #RRGGBB', () => {
      const text = getTextInput(fixture);
      expect(text.placeholder).toBe('#RRGGBB');
    });

    it('forwards hideInlineError to the inner sd-input', () => {
      host.hideInlineError = true;
      fixture.detectChanges();
      expect(getInnerSdInput(fixture).hideInlineError()).toBeTrue();
    });

    it('defaults clearable to false and forwards the value to the inner sd-input', () => {
      expect(component.clearable()).toBeFalse();
      expect(getInnerSdInput(fixture).clearable()).toBeFalse();
    });
  });

  describe('swatch color rendering', () => {
    it('shows transparent (empty class) when model is undefined', () => {
      const sw = getSwatch(fixture);
      expect(sw.classList.contains('sd-input-color__swatch--empty')).toBeTrue();
    });

    it('shows transparent when model is not a valid hex', () => {
      host.value = 'not-a-color';
      fixture.detectChanges();
      const sw = getSwatch(fixture);
      expect(sw.classList.contains('sd-input-color__swatch--empty')).toBeTrue();
    });

    it('applies raw hex as background when model is a valid 6-char hex', () => {
      host.value = '#FF5733';
      fixture.detectChanges();
      const sw = getSwatch(fixture);
      // browsers normalize hex to rgb() in computed style
      expect(sw.style.background).toContain('rgb(255, 87, 51)');
      expect(sw.classList.contains('sd-input-color__swatch--empty')).toBeFalse();
    });

    it('applies raw hex as background when model is a 3-char hex', () => {
      host.value = '#0AF';
      fixture.detectChanges();
      const sw = getSwatch(fixture);
      // #0AF expands to rgb(0, 170, 255)
      expect(sw.style.background).toContain('rgb(0, 170, 255)');
    });

    it('applies raw hex as background when model has alpha (#RRGGBBAA)', () => {
      host.value = '#1565C088';
      fixture.detectChanges();
      const sw = getSwatch(fixture);
      // #1565C088 → rgba(21, 101, 192, 0.533) approx; assert prefix only since alpha decimal varies
      expect(sw.style.background.startsWith('rgba(21, 101, 192')).toBeTrue();
    });
  });

  describe('pickerSafeValue', () => {
    it('returns #000000 when model is empty', () => {
      expect(component.pickerSafeValue()).toBe('#000000');
    });

    it('returns same value for #RRGGBB', () => {
      host.value = '#1565C0';
      fixture.detectChanges();
      expect(component.pickerSafeValue()).toBe('#1565C0');
    });

    it('expands #RGB to #RRGGBB', () => {
      host.value = '#0AF';
      fixture.detectChanges();
      expect(component.pickerSafeValue()).toBe('#00AAFF');
    });

    it('strips alpha from #RRGGBBAA', () => {
      host.value = '#1565C088';
      fixture.detectChanges();
      expect(component.pickerSafeValue()).toBe('#1565C0');
    });

    it('returns #000000 for invalid input', () => {
      host.value = 'oops';
      fixture.detectChanges();
      expect(component.pickerSafeValue()).toBe('#000000');
    });
  });

  describe('openPicker via swatch click', () => {
    it('clicks the hidden color input when swatch is clicked', () => {
      const picker = getHiddenPicker(fixture);
      const spy = spyOn(picker, 'click');
      getSwatch(fixture).click();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('does NOT open picker when disabled', () => {
      host.disabled = true;
      fixture.detectChanges();
      const picker = getHiddenPicker(fixture);
      const spy = spyOn(picker, 'click');
      getSwatch(fixture).click();
      expect(spy).not.toHaveBeenCalled();
    });

    it('does NOT open picker when viewed', () => {
      host.viewed = true;
      fixture.detectChanges();
      // In viewed mode the swatch may not be visible at all — guard
      const sw = fixture.nativeElement.querySelector('.sd-input-color__swatch') as HTMLButtonElement | null;
      if (sw) {
        const picker = getHiddenPicker(fixture);
        const spy = spyOn(picker, 'click');
        sw.click();
        expect(spy).not.toHaveBeenCalled();
      } else {
        expect(true).toBeTrue(); // suffix template not rendered in viewed mode — also valid
      }
    });
  });

  describe('picker change updates model', () => {
    it('updates model when native color picker emits input event', fakeAsync(() => {
      const picker = getHiddenPicker(fixture);
      picker.value = '#aabb11';
      picker.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      tick();
      expect(host.value).toBe('#aabb11');
    }));

    it('emits sdChange when picker changes', fakeAsync(() => {
      const picker = getHiddenPicker(fixture);
      picker.value = '#112233';
      picker.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      tick();
      expect(host.changes).toContain('#112233');
    }));
  });

  describe('clear button', () => {
    // why: nút clear giờ do <sd-input> render (built-in), không còn của riêng
    // input-color → query theo class dùng chung .sd-clear-btn.
    function getClearBtn(f: ComponentFixture<HostComponent>): HTMLButtonElement | null {
      return f.nativeElement.querySelector('button.sd-clear-btn') as HTMLButtonElement | null;
    }

    beforeEach(() => {
      host.clearable = true;
      fixture.detectChanges();
    });

    it('does NOT render clear button when value is empty', () => {
      expect(getClearBtn(fixture)).toBeNull();
    });

    it('renders clear button when value is set and editable', () => {
      host.value = '#FF0000';
      fixture.detectChanges();
      expect(getClearBtn(fixture)).not.toBeNull();
    });

    it('does NOT render clear button when required', () => {
      host.value = '#FF0000';
      host.required = true;
      fixture.detectChanges();
      expect(getClearBtn(fixture)).toBeNull();
    });

    it('does NOT render clear button when disabled', () => {
      host.value = '#FF0000';
      host.disabled = true;
      fixture.detectChanges();
      expect(getClearBtn(fixture)).toBeNull();
    });

    it('does NOT render clear button when readonly', () => {
      host.value = '#FF0000';
      host.readOnly = true;
      fixture.detectChanges();
      expect(getClearBtn(fixture)).toBeNull();
    });

    it('does NOT render clear button when viewed', () => {
      host.value = '#FF0000';
      host.viewed = true;
      fixture.detectChanges();
      // viewed mode may hide the entire suffix; either way clear button must not be reachable
      expect(getClearBtn(fixture)).toBeNull();
    });

    it('clears the model when clicked', fakeAsync(() => {
      host.value = '#FF0000';
      fixture.detectChanges();
      const btn = getClearBtn(fixture);
      btn!.click();
      fixture.detectChanges();
      tick();
      expect(host.value).toBeNull();
    }));

    it('emits sdChange with null when cleared', fakeAsync(() => {
      host.value = '#FF0000';
      fixture.detectChanges();
      getClearBtn(fixture)!.click();
      fixture.detectChanges();
      tick();
      expect(host.changes).toContain(null);
    }));

    it('click on clear does NOT open the color picker', fakeAsync(() => {
      host.value = '#FF0000';
      fixture.detectChanges();
      const picker = getHiddenPicker(fixture);
      const spy = spyOn(picker, 'click');
      getClearBtn(fixture)!.click();
      fixture.detectChanges();
      tick();
      expect(spy).not.toHaveBeenCalled();
    }));
  });

  describe('text input → model', () => {
    it('updates model when user types a hex value', fakeAsync(() => {
      const text = getTextInput(fixture);
      text.value = '#abcdef';
      text.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      tick();
      expect(host.value).toBe('#abcdef');
    }));
  });
});

// ---------------------------------------------------------------------------
// viewed inline mode — forwarded to the inner <sd-input>
// ---------------------------------------------------------------------------

describe('SdInputColor (viewed inline mode)', () => {
  let fixture: ComponentFixture<SdInputColor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdInputColor, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SdInputColor);
  });

  it("viewed='inline' is forwarded to the inner <sd-input>; swatch stays interactive", () => {
    // asserts: input-color delegates inline to sd-input; in inline (editable) the swatch is enabled
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.detectChanges();
    expect(getInnerSdInput(fixture).viewed()).toBe('inline');
    const swatch = fixture.nativeElement.querySelector('.sd-input-color__swatch') as HTMLButtonElement | null;
    expect(swatch?.disabled).toBeFalsy();
  });

  it("disabled + viewed='inline' → inner sd-input is static (no editable suffix swatch)", () => {
    // asserts: disabled→static flows through — the inner sd-input renders <sd-view> (no suffix),
    // so the editable swatch is not in the DOM at all.
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('sd-input sd-view')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.sd-input-color__swatch')).toBeNull();
  });

  // why: `viewed` là tri-state (boolean | 'inline') và 'inline' TRUTHY. Guard cũ
  // `if (... || this.viewed()) return` trong openPicker()/clear() vì thế khoá luôn chế độ
  // inline — bảng chọn màu của OS và clear() lập trình đều chết dù inline VẪN sửa được.
  // Phải gate bằng isViewed() (đúng `true`) từ sdViewedInline.
  describe("viewed='inline' vẫn mở được picker và clear() được", () => {
    // why: KHÔNG stub `picker` nữa. Bản stub cũ ghi đè viewChild bằng một <input> rời nên nó chỉ
    // kiểm tra đúng cái guard boolean và vẫn XANH dù trong DOM thật chẳng có element nào —
    // nhánh inline của <sd-input> khi đó không project `sdSuffixDef`. Giờ nhánh inline đã project,
    // spec bám thẳng vào <input type="color"> thật để không còn "xanh vì lý do sai".
    const pickerEl = (): HTMLInputElement | null => fixture.nativeElement.querySelector('input.sd-input-color__hidden-picker');

    it('isViewed() is false and isInline() is true for inline', async () => {
      fixture.componentRef.setInput('viewed', 'inline');
      fixture.autoDetectChanges();
      await fixture.whenStable();

      expect(fixture.componentInstance.isViewed()).toBeFalse();
      expect(fixture.componentInstance.isInline()).toBeTrue();
    });

    it('renders the swatch AND the hidden colour input inside the inline branch', async () => {
      fixture.componentRef.setInput('viewed', 'inline');
      fixture.autoDetectChanges();
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('sd-input sd-inline-text')).not.toBeNull();
      const swatch = fixture.nativeElement.querySelector('.sd-input-color__swatch') as HTMLButtonElement | null;
      expect(swatch).not.toBeNull();
      expect(swatch!.disabled).toBeFalse();
      expect(pickerEl()).not.toBeNull();
    });

    it('openPicker() clicks the REAL hidden colour input in inline mode', async () => {
      fixture.componentRef.setInput('viewed', 'inline');
      fixture.autoDetectChanges();
      await fixture.whenStable();

      const el = pickerEl();
      expect(el).not.toBeNull();
      const spy = spyOn(el!, 'click');

      fixture.componentInstance.openPicker();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('clicking the swatch opens the picker in inline mode', async () => {
      fixture.componentRef.setInput('viewed', 'inline');
      fixture.autoDetectChanges();
      await fixture.whenStable();

      const el = pickerEl();
      expect(el).not.toBeNull();
      const spy = spyOn(el!, 'click');

      (fixture.nativeElement.querySelector('.sd-input-color__swatch') as HTMLButtonElement).click();
      await fixture.whenStable();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('readonly still blocks openPicker() even though the real element is mounted', async () => {
      fixture.componentRef.setInput('viewed', 'inline');
      fixture.componentRef.setInput('readonly', true);
      fixture.autoDetectChanges();
      await fixture.whenStable();

      const el = pickerEl();
      expect(el).not.toBeNull();
      const spy = spyOn(el!, 'click');

      fixture.componentInstance.openPicker();

      expect(spy).not.toHaveBeenCalled();
    });

    it('clear() resets the model in inline mode', async () => {
      fixture.componentRef.setInput('viewed', 'inline');
      fixture.componentRef.setInput('model', '#FF0000');
      fixture.autoDetectChanges();
      await fixture.whenStable();
      const emitted: (string | null | undefined)[] = [];
      fixture.componentInstance.sdChange.subscribe(v => emitted.push(v));

      fixture.componentInstance.clear();
      await fixture.whenStable();

      expect(fixture.componentInstance.valueModel()).toBeNull();
      expect(emitted).toEqual([null]);
    });

    it('viewed=true still blocks clear() (static view — no picker in the DOM at all)', async () => {
      fixture.componentRef.setInput('viewed', true);
      fixture.componentRef.setInput('model', '#FF0000');
      fixture.autoDetectChanges();
      await fixture.whenStable();

      fixture.componentInstance.openPicker();
      fixture.componentInstance.clear();
      await fixture.whenStable();

      expect(fixture.componentInstance.isViewed()).toBeTrue();
      expect(pickerEl()).toBeNull();
      expect(fixture.componentInstance.valueModel()).toBe('#FF0000');
    });

    it("disabled + viewed='inline' degrades to static → picker and clear() stay blocked", async () => {
      fixture.componentRef.setInput('viewed', 'inline');
      fixture.componentRef.setInput('disabled', true);
      fixture.componentRef.setInput('model', '#FF0000');
      fixture.autoDetectChanges();
      await fixture.whenStable();

      fixture.componentInstance.openPicker();
      fixture.componentInstance.clear();
      await fixture.whenStable();

      expect(fixture.componentInstance.isViewed()).toBeTrue();
      expect(fixture.componentInstance.isInline()).toBeFalse();
      expect(pickerEl()).toBeNull();
      expect(fixture.componentInstance.valueModel()).toBe('#FF0000');
    });
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// why: `aria-hidden="true"` trên phần tử focus được (hoặc trên phần tử BỌC nội dung focus được)
// tệ hơn là không làm gì: control vẫn nhận focus bằng Tab nhưng screen reader không đọc gì.
// Trước đây nó bị rắc khắp forms/** chỉ để dập 4 rule a11y đang bị tắt trong eslint.
// ---------------------------------------------------------------------------
const FOCUSABLE_SELECTOR =
  'input:not([tabindex="-1"]), textarea:not([tabindex="-1"]), select:not([tabindex="-1"]), ' +
  'button:not([tabindex="-1"]), a[href]:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

/** Trả về tag của mọi phần tử aria-hidden mà bản thân nó hoặc con nó focus được. */
function ariaHiddenFocusables(root: HTMLElement): string[] {
  return Array.from(root.querySelectorAll('[aria-hidden="true"]'))
    .filter(el => el.matches(FOCUSABLE_SELECTOR) || el.querySelector(FOCUSABLE_SELECTOR) !== null)
    .map(el => el.tagName.toLowerCase());
}

describe('SdInputColor (accessibility)', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [HostComponent, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('leaves no aria-hidden on any focusable element', () => {
    // why: <input type="color"> ẩn VẪN giữ aria-hidden — nhưng nó tabindex="-1", kích thước 0,
    // pointer-events:none nên không phải phần tử focus được; guard vì thế phải sạch.
    expect(ariaHiddenFocusables(fixture.nativeElement)).toEqual([]);
  });

  it('keeps the visible swatch button as the named, keyboard-reachable control', () => {
    const swatch = fixture.nativeElement.querySelector('button.sd-input-color__swatch') as HTMLButtonElement;
    expect(swatch).not.toBeNull();
    expect(swatch.type).toBe('button');
    expect(swatch.getAttribute('aria-label')).toBeTruthy();
    expect(swatch.hasAttribute('aria-hidden')).toBe(false);
  });
});
