import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdLabelPlacement } from '@sdcorejs/angular/forms/models';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { SdTextarea } from '@sdcorejs/angular/forms/textarea';
import { SdLabel } from './label.component';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdLabel],
  template: `
    <sd-label id="with-for" label="Email" for="email-input" labelId="email-label" [required]="true"></sd-label>
    <sd-label id="with-id" label="City" labelId="city-label" [required]="true"></sd-label>
    <sd-label id="legacy" label="Legacy" [required]="true"></sd-label>
  `,
})
class LabelHost {}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdInput, SdTextarea, SdInputNumber, SdSelect],
  template: `
    <sd-input
      id="i"
      name="i"
      [form]="form"
      label="Họ và tên"
      helperText="Nhập đầy đủ"
      [required]="true"
      [labelPlacement]="placement()"></sd-input>
    <sd-textarea id="t" name="t" [form]="form" label="Ghi chú" [labelPlacement]="placement()"></sd-textarea>
    <sd-input-number id="n" name="n" [form]="form" label="Số lượng" [labelPlacement]="placement()"></sd-input-number>
    <sd-select
      id="s"
      name="s"
      [form]="form"
      label="Tỉnh"
      [items]="items"
      valueField="value"
      displayField="display"
      [labelPlacement]="placement()"></sd-select>
  `,
})
class ControlsHost {
  readonly placement = signal<SdLabelPlacement>('float');
  readonly form = new FormGroup({});
  readonly items = [
    { value: 'hn', display: 'Hà Nội' },
    { value: 'hcm', display: 'TP. Hồ Chí Minh' },
  ];
}

describe('SdLabel association (for / labelId)', () => {
  let fixture: ComponentFixture<LabelHost>;
  const q = <T extends Element>(selector: string) => (fixture.nativeElement as HTMLElement).querySelector<T>(selector);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LabelHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(LabelHost);
    fixture.detectChanges();
  });

  it('renders a native <label for> with the required mark inside it (hidden from assistive tech)', () => {
    const label = q<HTMLLabelElement>('#with-for label')!;
    expect(label).not.toBeNull();
    expect(label.htmlFor).toBe('email-input');
    expect(label.id).toBe('email-label');
    const star = label.querySelector('.sd-label__required')!;
    expect(star.getAttribute('aria-hidden')).toBe('true');
    expect(q('#with-for .text-error.mb-2')).withContext('no detached legacy star').toBeNull();
  });

  it('renders an id-able text element for aria-labelledby with the star attached to the text', () => {
    const text = q<HTMLElement>('#with-id #city-label')!;
    expect(text.tagName).toBe('SPAN');
    expect(text.textContent?.replace(/\s+/g, ' ').trim()).toBe('City *');
    expect(text.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(q('#with-id .text-error.mb-2')).toBeNull();
  });

  it('keeps the legacy markup when neither for nor labelId is given', () => {
    expect(q('#legacy label')).toBeNull();
    expect(q('#legacy span.T14M')!.textContent?.trim()).toBe('Legacy');
    expect(q('#legacy .text-error.mb-2')).not.toBeNull();
  });
});

describe('Core controls · labelPlacement', () => {
  let fixture: ComponentFixture<ControlsHost>;
  let host: ControlsHost;
  const q = <T extends Element>(selector: string) => (fixture.nativeElement as HTMLElement).querySelector<T>(selector);

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [ControlsHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(ControlsHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('defaults to the floating Material label (no change for existing consumers)', () => {
    for (const id of ['i', 't', 'n', 's']) {
      expect(q(`#${id}`)!.classList.contains('sd-label-top'))
        .withContext(id)
        .toBeFalse();
      expect(q(`#${id} mat-label`))
        .withContext(`${id} keeps mat-label`)
        .not.toBeNull();
    }
    expect(q<HTMLInputElement>('#i input')!.placeholder).withContext('float keeps the label-as-placeholder fallback').toBe('Họ và tên');
  });

  it('top: one external <label for> per native control, no floating duplicate, no label-as-placeholder', () => {
    host.placement.set('top');
    fixture.detectChanges();

    const cases: [string, string][] = [
      ['i', 'input'],
      ['t', 'textarea'],
      ['n', 'input'],
    ];
    for (const [id, tag] of cases) {
      const control = q<HTMLInputElement>(`#${id} ${tag}`)!;
      const labels = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLLabelElement>(`#${id} label[for]`);
      expect(q(`#${id}`)!.classList.contains('sd-label-top'))
        .withContext(id)
        .toBeTrue();
      expect(q(`#${id} mat-label`))
        .withContext(`${id} has no floating label`)
        .toBeNull();
      expect(labels.length).withContext(`${id} exactly one label`).toBe(1);
      expect(labels[0].htmlFor).withContext(`${id} label targets the control`).toBe(control.id);
      expect(control.labels?.length).withContext(`${id} control is labelled`).toBe(1);
    }
    expect(q<HTMLInputElement>('#i input')!.placeholder).toBe('');
  });

  it('top: helper text is a described-by hint that an error replaces', () => {
    host.placement.set('top');
    fixture.detectChanges();
    const input = q<HTMLInputElement>('#i input')!;
    const hint = q<HTMLElement>('#i mat-hint')!;
    expect(hint.textContent?.trim()).toBe('Nhập đầy đủ');
    expect(input.getAttribute('aria-describedby') ?? '').toContain(hint.id);

    const control = host.form.get('i') as unknown as FormControl;
    control.markAsTouched();
    control.setValue('');
    control.updateValueAndValidity();
    fixture.detectChanges();
    expect(q('#i mat-error')).not.toBeNull();
    expect(q('#i mat-hint')).withContext('error replaces the hint').toBeNull();
  });

  it('top: sd-select points aria-labelledby at the external label and clicking it focuses the select', () => {
    host.placement.set('top');
    fixture.detectChanges();
    const select = q<HTMLElement>('#s mat-select')!;
    // aria-labelledby là danh sách id (mat-select có thể thêm khoảng trắng / id của chính nó).
    const ids = (select.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean);
    const text = ids.map(id => (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(`[id="${id}"]`)).find(Boolean)!;
    expect(text).not.toBeNull();
    expect(text.textContent?.trim()).toBe('Tỉnh');
    expect(q('#s mat-label')).toBeNull();

    document.body.appendChild(fixture.nativeElement);
    text.click();
    fixture.detectChanges();
    expect(document.activeElement).toBe(select);
    (fixture.nativeElement as HTMLElement).remove();
  });
});
