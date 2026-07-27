import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdInput } from '@sdcorejs/angular/forms';
import { SdLayoutSearchFieldComponent } from './search-field.component';

describe('SdLayoutSearchFieldComponent', () => {
  let fixture: ComponentFixture<SdLayoutSearchFieldComponent>;
  let coreStyles: HTMLStyleElement;
  let originalRootStyle: string | null;

  beforeEach(async () => {
    // The library test target omits consumer global styles; load only the Core declarations under test.
    coreStyles = document.createElement('style');
    coreStyles.textContent = `
      .mat-mdc-form-field .mat-mdc-notch-piece.mdc-notched-outline__leading {
        border-color: var(--sd-border) !important;
      }
      .mat-mdc-form-field .mat-mdc-notch-piece.mdc-notched-outline__notch {
        border-top-color: var(--sd-border) !important;
        border-bottom-color: var(--sd-border) !important;
      }
      .mat-mdc-form-field .mat-mdc-notch-piece.mdc-notched-outline__trailing {
        border-color: var(--sd-border) !important;
      }
      .mat-mdc-form-field.hide-inline-error .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }
    `;
    document.head.appendChild(coreStyles);

    originalRootStyle = document.documentElement.getAttribute('style');
    document.documentElement.style.setProperty('--sd-border', 'rgb(12, 34, 56)');
    document.documentElement.style.setProperty('--sd-surface-muted', 'rgb(231, 232, 237)');
    document.documentElement.style.setProperty('--sd-text-muted', 'rgb(99, 100, 101)');
    document.documentElement.style.setProperty('--sd-primary', 'rgb(0, 92, 187)');
    document.documentElement.style.removeProperty('--sd-black100');
    document.documentElement.style.removeProperty('--sd-black400');

    await TestBed.configureTestingModule({
      imports: [SdLayoutSearchFieldComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(SdLayoutSearchFieldComponent);
    fixture.componentRef.setInput('placeholder', 'Tìm trong tất cả menu');
    fixture.componentRef.setInput('autoId', 'layout-test-search');
    fixture.componentRef.setInput('model', 'report');
    fixture.detectChanges();
  });

  afterEach(() => {
    coreStyles.remove();
    if (originalRootStyle === null) document.documentElement.removeAttribute('style');
    else document.documentElement.setAttribute('style', originalRootStyle);
  });

  it('renders the Soft-pill shell and forwards input configuration', () => {
    const shell = fixture.nativeElement.querySelector('[data-layout-search]') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(shell.classList).toContain('sd-layout-search-field--soft-pill');
    expect(shell.querySelector('mat-icon')?.textContent?.trim()).toBe('search');
    expect(input.placeholder).toBe('Tìm trong tất cả menu');
    expect(input.getAttribute('data-autoid')).toBe('forms-input-layout-test-search');
    expect(input.value).toBe('report');
  });

  it('resolves the Soft-pill theme through current token fallbacks', () => {
    const shell = fixture.nativeElement.querySelector('[data-layout-search]') as HTMLElement;
    const icon = fixture.nativeElement.querySelector('.sd-layout-search-field__icon') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(getComputedStyle(shell).backgroundColor).toBe('rgb(231, 232, 237)');
    expect(getComputedStyle(shell).color).toBe('rgb(99, 100, 101)');
    expect(getComputedStyle(icon).color).toBe('rgb(99, 100, 101)');
    expect(getComputedStyle(input, '::placeholder').color).toBe('rgb(99, 100, 101)');
  });

  it('keeps Core-forced notch borders transparent within the pill', () => {
    const control = fixture.nativeElement.querySelector('sd-input') as HTMLElement;
    const leadingNotch = fixture.nativeElement.querySelector('.mdc-notched-outline__leading') as HTMLElement;

    expect(getComputedStyle(control).getPropertyValue('--sd-border').trim()).toBe('transparent');
    expect(getComputedStyle(leadingNotch).borderColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('delegates compact error layout to SdInput', () => {
    const formField = fixture.nativeElement.querySelector('.mat-mdc-form-field') as HTMLElement;
    const subscript = fixture.nativeElement.querySelector('.mat-mdc-form-field-subscript-wrapper') as HTMLElement;

    expect(formField.classList).toContain('hide-inline-error');
    expect(getComputedStyle(subscript).display).toBe('none');
  });

  it('shows the primary focus ring when the native input is focused', () => {
    const shell = fixture.nativeElement.querySelector('[data-layout-search]') as HTMLElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.focus();

    expect(getComputedStyle(shell).outlineColor).toBe('rgb(0, 92, 187)');
    expect(getComputedStyle(shell).outlineWidth).toBe('1px');
    expect(getComputedStyle(input).outlineWidth).toBe('0px');
  });

  it('forwards SdInput changes as strings', () => {
    const change = jasmine.createSpy('change');
    fixture.componentInstance.sdChange.subscribe(change);

    fixture.debugElement.query(By.directive(SdInput)).triggerEventHandler('sdChange', 'tasks');

    expect(change).toHaveBeenCalledOnceWith('tasks');
  });
});
