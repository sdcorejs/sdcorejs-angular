import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Color } from '@sdcorejs/utils/models';
import { resolveSdIconConfig, SD_ICON_CONFIGURATION, type SdIconShape } from '@sdcorejs/angular/modules/icon';
import { DialogConfirmComponent, DialogData } from './dialog-confirm.component';

function setup(data: DialogData): {
  fix: ComponentFixture<DialogConfirmComponent>;
  ref: jasmine.SpyObj<MatDialogRef<DialogConfirmComponent>>;
} {
  const ref = jasmine.createSpyObj<MatDialogRef<DialogConfirmComponent>>('MatDialogRef', ['close']);

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [NoopAnimationsModule, DialogConfirmComponent],
    providers: [
      { provide: MatDialogRef, useValue: ref },
      { provide: MAT_DIALOG_DATA, useValue: data },
    ],
  });

  const fix = TestBed.createComponent(DialogConfirmComponent);
  fix.detectChanges();
  return { fix, ref };
}

describe('DialogConfirmComponent', () => {
  // ─── construction / data binding ──────────────────────────────────────────

  it('creates with default value (no input/date/radio configured)', () => {
    const { fix } = setup({ title: 'T', message: 'M', yesTitle: 'Y', noTitle: 'N' });
    expect(fix.componentInstance).toBeTruthy();
    expect(fix.componentInstance.value).toBeUndefined();
    expect(fix.componentInstance.required).toBeFalse();
  });

  it('seeds value/required from data.input when present', () => {
    const { fix } = setup({
      title: 'T',
      message: 'M',
      yesTitle: 'Y',
      noTitle: 'N',
      input: { defaultValue: 'preset', required: true, maxlength: 100 },
    });
    expect(fix.componentInstance.value).toBe('preset');
    expect(fix.componentInstance.required).toBeTrue();
  });

  it('seeds value/required from data.date when present', () => {
    const date = new Date('2024-01-15');
    const { fix } = setup({
      title: 'T',
      message: 'M',
      yesTitle: 'Y',
      noTitle: 'N',
      date: { defaultValue: date, required: true },
    });
    expect(fix.componentInstance.value).toBe(date);
    expect(fix.componentInstance.required).toBeTrue();
  });

  it('seeds value/required from data.radio when present', () => {
    const { fix } = setup({
      title: 'T',
      message: 'M',
      yesTitle: 'Y',
      noTitle: 'N',
      radio: {
        defaultValue: 'A',
        required: true,
        items: [{ value: 'A', label: 'A' }],
        valueField: 'value',
        displayField: 'label',
      },
    });
    expect(fix.componentInstance.value).toBe('A');
    expect(fix.componentInstance.required).toBeTrue();
  });

  it('seeds value/required from data.select when present', () => {
    const { fix } = setup({
      title: 'T',
      message: 'M',
      yesTitle: 'Y',
      noTitle: 'N',
      select: {
        defaultValue: 'A',
        required: true,
        items: [{ value: 'A', label: 'A' }],
        valueField: 'value',
        displayField: 'label',
      },
    });
    expect(fix.componentInstance.value).toBe('A');
    expect(fix.componentInstance.required).toBeTrue();
  });

  it('seeds value/required from data.datetime when present', () => {
    const date = new Date('2024-01-15T08:30:00');
    const { fix } = setup({
      title: 'T',
      message: 'M',
      yesTitle: 'Y',
      noTitle: 'N',
      datetime: { defaultValue: date, required: true },
    });
    expect(fix.componentInstance.value).toBe(date);
    expect(fix.componentInstance.required).toBeTrue();
  });

  it('falls back to empty string when input.defaultValue is missing', () => {
    const { fix } = setup({
      title: 'T',
      message: 'M',
      yesTitle: 'Y',
      noTitle: 'N',
      input: {},
    });
    expect(fix.componentInstance.value).toBe('');
  });

  it('generates a unique id with the "I" prefix', () => {
    const { fix } = setup({ title: 'T', message: 'M', yesTitle: 'Y', noTitle: 'N' });
    expect(fix.componentInstance.id).toMatch(/^I[0-9a-f-]{36}$/i);
  });

  // ─── template rendering ───────────────────────────────────────────────────

  it('renders the title (innerHTML)', () => {
    const { fix } = setup({ title: 'My <em>Title</em>', message: 'msg', yesTitle: 'Y', noTitle: 'N' });
    const title = fix.nativeElement.querySelector('.sd-dialog-confirm__title');
    expect(title.textContent).toContain('My');
    expect(title.innerHTML).toContain('<em>Title</em>');
  });

  it('falls back to "Confirm" when no title is provided', () => {
    const { fix } = setup({ message: 'msg', yesTitle: 'Y', noTitle: 'N' });
    expect(fix.nativeElement.querySelector('.sd-dialog-confirm__title').textContent).toContain('Confirm');
  });

  it('renders icon element when data.icon is set', () => {
    const { fix } = setup({ icon: 'warning', title: 'T', message: 'M', yesTitle: 'Y', noTitle: 'N' });
    expect(fix.nativeElement.querySelector('mat-icon')).not.toBeNull();
  });

  it('marks dialog content as radio content when data.radio is set', () => {
    const { fix } = setup({
      title: 'T',
      message: 'M',
      yesTitle: 'Y',
      noTitle: 'N',
      radio: {
        defaultValue: 'A',
        items: [{ value: 'A', label: 'A' }],
        valueField: 'value',
        displayField: 'label',
      },
    });
    const content = fix.nativeElement.querySelector('.sd-dialog-confirm__content');
    expect(content).not.toBeNull();
    expect(content.classList).toContain('sd-dialog-confirm__content--radio');
  });

  it('renders the default icon when data.icon is absent', () => {
    const { fix } = setup({ title: 'T', message: 'M', yesTitle: 'Y', noTitle: 'N' });
    expect(fix.nativeElement.querySelector('.sd-dialog-confirm__icon')?.getAttribute('data-icon')).toBe('check_circle');
  });

  it('omits yes button when yesTitle is absent', () => {
    const { fix } = setup({ title: 'T', message: 'M', noTitle: 'N' });
    // exactly one button (the No button)
    const buttons = fix.nativeElement.querySelectorAll('sd-button');
    expect(buttons.length).toBe(1);
  });

  it('omits no button when noTitle is absent', () => {
    const { fix } = setup({ title: 'T', message: 'M', yesTitle: 'Y' });
    const buttons = fix.nativeElement.querySelectorAll('sd-button');
    expect(buttons.length).toBe(1);
  });

  // ─── onAccept / onCancel ──────────────────────────────────────────────────

  it('onCancel closes the ref with { action: CANCEL, value: null }', () => {
    const { fix, ref } = setup({ title: 'T', message: 'M', yesTitle: 'Y', noTitle: 'N' });
    fix.componentInstance.onCancel();
    expect(ref.close).toHaveBeenCalledWith({ action: 'CANCEL', value: null });
  });

  it('onAccept closes with value:null when no input/date/radio configured', () => {
    const { fix, ref } = setup({ title: 'T', message: 'M', yesTitle: 'Y', noTitle: 'N' });
    fix.componentInstance.onAccept();
    expect(ref.close).toHaveBeenCalledWith({ action: 'ACCEPT', value: null });
  });

  it('onAccept closes with current value when input is configured', () => {
    const { fix, ref } = setup({
      title: 'T',
      message: 'M',
      yesTitle: 'Y',
      noTitle: 'N',
      input: { defaultValue: 'first' },
    });
    fix.componentInstance.value = 'user typed';
    fix.componentInstance.onAccept();
    expect(ref.close).toHaveBeenCalledWith({ action: 'ACCEPT', value: 'user typed' });
  });

  it('onAccept closes with current value when date is configured', () => {
    const { fix, ref } = setup({
      title: 'T',
      message: 'M',
      yesTitle: 'Y',
      noTitle: 'N',
      date: {},
    });
    fix.componentInstance.value = '2024-01-15';
    fix.componentInstance.onAccept();
    expect(ref.close).toHaveBeenCalledWith({ action: 'ACCEPT', value: '2024-01-15' });
  });

  it('onAccept closes with current value when radio is configured', () => {
    const { fix, ref } = setup({
      title: 'T',
      message: 'M',
      yesTitle: 'Y',
      noTitle: 'N',
      radio: { items: [], valueField: 'v', displayField: 'd' },
    });
    fix.componentInstance.value = 'B';
    fix.componentInstance.onAccept();
    expect(ref.close).toHaveBeenCalledWith({ action: 'ACCEPT', value: 'B' });
  });

  it('onAccept closes with current value when select is configured', () => {
    const { fix, ref } = setup({
      title: 'T',
      message: 'M',
      yesTitle: 'Y',
      noTitle: 'N',
      select: { items: [], valueField: 'v', displayField: 'd' },
    });
    fix.componentInstance.value = 'A';
    fix.componentInstance.onAccept();
    expect(ref.close).toHaveBeenCalledWith({ action: 'ACCEPT', value: 'A' });
  });

  it('onAccept closes with current value when datetime is configured', () => {
    const { fix, ref } = setup({
      title: 'T',
      message: 'M',
      yesTitle: 'Y',
      noTitle: 'N',
      datetime: {},
    });
    fix.componentInstance.value = '2024-01-15T08:30:00';
    fix.componentInstance.onAccept();
    expect(ref.close).toHaveBeenCalledWith({ action: 'ACCEPT', value: '2024-01-15T08:30:00' });
  });

  // ─── null/undefined data ──────────────────────────────────────────────────

  it('does not throw on construction when data is empty object', () => {
    // why: template uses `data.icon` (non-optional) so null data would NPE during
    // template binding; the component constructor itself guards with `data?.input`
    // etc. Pass {} to confirm the constructor branches are skipped without input/date/radio.
    expect(() => setup({} as any)).not.toThrow();
  });
});

describe('DialogConfirmComponent icon shape', () => {
  const TONES: Color[] = ['primary', 'success', 'info', 'warning', 'error'];

  function render(
    data: Partial<DialogData>,
    defaultShape?: SdIconShape
  ): { fix: ComponentFixture<DialogConfirmComponent>; icon: HTMLElement } {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, DialogConfirmComponent],
      providers: [
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
        { provide: MAT_DIALOG_DATA, useValue: { title: 'T', message: 'M', yesTitle: 'Y', noTitle: 'N', ...data } },
        ...(defaultShape ? [{ provide: SD_ICON_CONFIGURATION, useValue: resolveSdIconConfig({ defaultShape }) }] : []),
      ],
    });
    const fix = TestBed.createComponent(DialogConfirmComponent);
    // why: the isolated test runner does not load the app-level theme, so give every tone a visible background.
    TONES.forEach((tone, index) =>
      (fix.nativeElement as HTMLElement).style.setProperty(`--sd-${tone}-light`, `rgb(${10 + index}, 20, 30)`)
    );
    fix.detectChanges();
    return { fix, icon: (fix.nativeElement as HTMLElement).querySelector('.sd-dialog-confirm__icon') as HTMLElement };
  }

  it('resolves the option shape, then the app default, then square', () => {
    expect(render({}).icon.getAttribute('data-icon-shape')).toBe('square');
    expect(render({}, 'circle').icon.getAttribute('data-icon-shape')).toBe('circle');
    expect(render({ iconShape: 'none' }, 'circle').icon.getAttribute('data-icon-shape')).toBe('none');
  });

  it('renders square with an 8px radius that the token can change', () => {
    const { fix, icon } = render({});
    expect(getComputedStyle(icon).borderTopLeftRadius).toBe('8px');
    expect(getComputedStyle(icon).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    (fix.nativeElement as HTMLElement).style.setProperty('--sd-icon-shape-radius', '4px');
    expect(getComputedStyle(icon).borderTopLeftRadius).toBe('4px');
  });

  it('renders circle like before and none without a background at the same size, for every tone', () => {
    for (const tone of TONES) {
      const square = render({ yesButtonColor: tone, iconShape: 'square' }).icon;
      const squareBackground = getComputedStyle(square).backgroundColor;
      const squareSize = [getComputedStyle(square).width, getComputedStyle(square).height];

      const circle = render({ yesButtonColor: tone, iconShape: 'circle' }).icon;
      expect(getComputedStyle(circle).borderTopLeftRadius).withContext(tone).toBe('50%');
      expect(getComputedStyle(circle).backgroundColor).withContext(tone).toBe(squareBackground);

      const none = render({ yesButtonColor: tone, iconShape: 'none' }).icon;
      expect(getComputedStyle(none).backgroundColor).withContext(tone).toBe('rgba(0, 0, 0, 0)');
      expect([getComputedStyle(none).width, getComputedStyle(none).height])
        .withContext(tone)
        .toEqual(squareSize);
    }
  });
});
