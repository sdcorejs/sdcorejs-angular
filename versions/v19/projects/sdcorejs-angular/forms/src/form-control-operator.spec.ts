import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Operator } from '@sdcorejs/utils/models';
import { SdFormsModule } from './forms.module';

// Operator trong control (thiết kế đợt 2 · G): chip tiền tố trên sd-input, sd-input-number, sd-select,
// sd-date, sd-date-range.
@Component({
  imports: [SdFormsModule],
  template: `
    <div style="width: 320px">
      <sd-input data-case="input" label="Tên" clearable [operators]="textOps" [(operator)]="textOp" [(model)]="text" />
      <sd-input-number data-case="number" label="Giá" [operators]="numberOps" [(operator)]="numberOp" [(model)]="price" />
      <sd-select
        data-case="select"
        label="Trạng thái"
        [items]="statuses"
        valueField="value"
        displayField="label"
        [operators]="listOps"
        [(operator)]="listOp" />
      <sd-date data-case="date" label="Ngày" [operators]="numberOps" [(operator)]="dateOp" />
      <sd-date-range data-case="range" label="Khoảng" [operators]="numberOps" [(operator)]="rangeOp" />
      <sd-input data-case="single" label="Một" [operators]="singleOps" [(operator)]="singleOp" />
      <sd-input data-case="none" label="Không" />
    </div>
  `,
})
class OperatorHost {
  readonly textOps: Operator[] = ['CONTAIN', 'EQUAL', 'START_WITH'];
  readonly numberOps: Operator[] = ['EQUAL', 'GREATER_THAN', 'LESS_THAN'];
  readonly listOps: Operator[] = ['IN', 'NOT_IN'];
  readonly singleOps: Operator[] = ['CONTAIN'];
  readonly statuses = [
    { value: 'open', label: 'Mở' },
    { value: 'done', label: 'Xong' },
  ];
  readonly textOp = signal<Operator | undefined>('CONTAIN');
  readonly numberOp = signal<Operator | undefined>('EQUAL');
  readonly listOp = signal<Operator | undefined>('IN');
  readonly dateOp = signal<Operator | undefined>(undefined);
  readonly rangeOp = signal<Operator | undefined>(undefined);
  readonly singleOp = signal<Operator | undefined>(undefined);
  readonly text = signal<string | null>(null);
  readonly price = signal<number | null>(null);
}

describe('Operator chip inside the form controls', () => {
  let fixture: ComponentFixture<OperatorHost>;
  let host: OperatorHost;
  let overlay: HTMLElement;

  const control = (name: string): HTMLElement => fixture.nativeElement.querySelector(`[data-case="${name}"]`);
  const chip = (name: string): HTMLButtonElement | null =>
    control(name).querySelector<HTMLButtonElement>('sd-operator-chip button.sd-operator-chip__trigger');
  const rows = (): HTMLButtonElement[] => Array.from(overlay.querySelectorAll<HTMLButtonElement>('.c-op-menu .c-op-row'));
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  // The element the user types into or opens: the native input, or the mat-select trigger.
  const entry = (name: string): HTMLElement =>
    control(name).querySelector<HTMLElement>('input:not([type="hidden"]), mat-select') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [OperatorHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(OperatorHost);
    host = fixture.componentInstance;
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
    await settle();
  });

  afterEach(() => overlay.querySelectorAll('.cdk-overlay-pane').forEach(pane => pane.remove()));

  for (const name of ['input', 'number', 'select', 'date', 'range']) {
    it(`${name}: renders the chip as a field prefix, before the entry in the tab order, and floats the label`, () => {
      const button = chip(name);
      expect(button).withContext('chip').not.toBeNull();
      expect(button!.closest('.mat-mdc-form-field-icon-prefix')).withContext('matPrefix slot').not.toBeNull();
      expect(button!.compareDocumentPosition(entry(name)) & Node.DOCUMENT_POSITION_FOLLOWING)
        .withContext('chip first')
        .toBeTruthy();
      const label = control(name).querySelector('.mdc-floating-label');
      expect(label?.classList).withContext('label always floats').toContain('mdc-floating-label--float-above');
    });
  }

  it('does not repeat the always-floating label as the placeholder while the chip is shown', () => {
    for (const name of ['input', 'number', 'date']) {
      expect(control(name).querySelector('input')!.getAttribute('placeholder') ?? '')
        .withContext(name)
        .toBe('');
    }
    expect(control('select').querySelector('.mat-mdc-select-placeholder')?.textContent?.trim() ?? '').toBe('');
    // Without a chip the label still doubles as the placeholder.
    expect(control('none').querySelector('input')!.getAttribute('placeholder')).toBe('Không');
  });

  it('hides the chip with no operators, and with exactly one uses it without a chip', () => {
    expect(chip('none')).toBeNull();
    expect(chip('single')).toBeNull();
    expect(host.singleOp()).toBe('CONTAIN');
  });

  it('picks an operator from the menu and moves focus to the entry', async () => {
    chip('number')!.click();
    await settle();
    rows()[1].click();
    await settle();
    expect(host.numberOp()).toBe('GREATER_THAN');
    expect(document.activeElement).toBe(entry('number'));
  });

  it('opens with Alt+ArrowDown from the chip and does not open the select panel when the chip is clicked', async () => {
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, bubbles: true, cancelable: true });
    chip('select')!.dispatchEvent(event);
    await settle();
    expect(rows().length).toBe(2);
    expect(overlay.querySelector('.sd-select-panel')).withContext('the select stays closed').toBeNull();
  });

  it('keeps the operator when the clear button empties the value', async () => {
    host.text.set('abc');
    host.textOp.set('EQUAL');
    await settle();
    const clear = control('input').querySelector<HTMLButtonElement>('.sd-clear-btn, [data-clear], button.c-clear');
    expect(clear).withContext('clear button').not.toBeNull();
    clear!.click();
    await settle();
    expect(host.text() ?? '').toBe('');
    expect(host.textOp()).toBe('EQUAL');
  });

  it('switches the chip to the primary tone once the field has a value', async () => {
    expect(chip('number')!.classList).not.toContain('sd-operator-chip__trigger--value');
    host.price.set(12);
    await settle();
    expect(chip('number')!.classList).toContain('sd-operator-chip__trigger--value');
  });
});
