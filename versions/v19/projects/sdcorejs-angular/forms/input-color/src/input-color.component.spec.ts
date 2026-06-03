import { Component, DebugElement, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
  viewed = false;
  value: string | null | undefined = undefined;
  changes: Array<string | null | undefined> = [];
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
    const inner = fixture.nativeElement.querySelector('sd-input') as HTMLElement;
    expect(inner).not.toBeNull();
    expect(inner.getAttribute('ng-reflect-viewed')).toBe('inline');
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
});
