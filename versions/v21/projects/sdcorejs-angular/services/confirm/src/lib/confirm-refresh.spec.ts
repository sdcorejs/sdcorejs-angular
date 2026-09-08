import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { SdButton } from '@sdcorejs/angular/components/button';
import { provideSdIcon } from '@sdcorejs/angular/modules/icon';
import { LucideCircleCheck } from '@lucide/angular';
import { SdConfirmService } from './confirm.service';
import { DialogConfirmComponent, DialogData } from './components/dialog-confirm/dialog-confirm.component';

describe('Confirm refreshed presentation', () => {
  function render(data: DialogData = {}) {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, DialogConfirmComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { title: 'Confirm', message: 'Message', yesTitle: 'Accept', noTitle: 'Cancel', ...data } },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
      ],
    });
    const fixture = TestBed.createComponent(DialogConfirmComponent);
    fixture.detectChanges();
    return fixture;
  }
  for (const icon of [undefined, '', '   ']) {
    it('always renders the default icon when icon is ' + JSON.stringify(icon), () => {
      const fixture = render({ icon });
      const tile = fixture.nativeElement.querySelector('.sd-dialog-confirm__icon');
      expect(tile).not.toBeNull();
      expect(tile?.getAttribute('data-icon')).toBe('check_circle');
      expect(tile?.getAttribute('aria-hidden')).toBe('true');
    });
  }
  it('renders a custom icon in the same decorative tile', () => {
    const fixture = render({ icon: '  info_outline  ', yesButtonColor: 'error' });
    expect(fixture.nativeElement.querySelector('.sd-dialog-confirm__icon')?.getAttribute('data-icon')).toBe('info_outline');
  });
  it('keeps the default icon visible with a configured Lucide renderer', () => {
    TestBed.configureTestingModule({ providers: [provideSdIcon({ defaultFontSet: 'lucide', lucideIcons: [LucideCircleCheck] })] });
    const fixture = render();
    expect(fixture.nativeElement.querySelector('.sd-dialog-confirm__icon svg')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.sd-dialog-confirm__icon mat-icon')).toBeNull();
  });
  const variants: [DialogData, string][] = [
    [{ yesButtonColor: 'error' }, 'delete'],
    [{ yesButtonColor: 'warning' }, 'warning_amber'],
    [{ input: {} }, 'edit_note'],
    [{ date: {} }, 'today'],
    [{ radio: { items: [], valueField: 'id', displayField: 'name' } }, 'list'],
    [{ datetime: {} }, 'today'],
    [{ select: { items: [], valueField: 'id', displayField: 'name' } }, 'list'],
  ];
  for (const [data, icon] of variants) {
    it('provides the ' + icon + ' default for ' + Object.keys(data)[0], () => {
      const fixture = render(data);
      expect(fixture.nativeElement.querySelector('.sd-dialog-confirm__icon')?.getAttribute('data-icon')).toBe(icon);
    });
  }
  it('uses small Core UI actions with native button semantics', () => {
    const fixture = render();
    const buttons = fixture.debugElement.queryAll(By.directive(SdButton)).map(x => x.componentInstance as SdButton);
    expect(buttons.map(x => x.size())).toEqual(['sm', 'sm']);
    expect(buttons.map(x => x.type())).toEqual(['light', 'fill']);
    expect(buttons.map(x => x.htmlType())).toEqual(['button', 'button']);
  });
  it('disables required input containing whitespace', () => {
    const fixture = render({ input: { required: true, defaultValue: '   ' } });
    expect(fixture.nativeElement.querySelector('[data-confirm-accept] button')?.disabled).toBeTrue();
  });
  it('accepts a numeric zero in a required radio choice', () => {
    const fixture = render({
      radio: { required: true, defaultValue: 0, items: [{ id: 0, name: 'Zero' }], valueField: 'id', displayField: 'name' },
    });
    expect(fixture.nativeElement.querySelector('[data-confirm-accept] button')?.disabled).toBeFalse();
  });
});

describe('Confirm icon service forwarding', () => {
  it('forwards icon across every supported method and scopes panel styling', () => {
    const closed = new Subject<unknown>();
    const open = jasmine.createSpy('open').and.returnValue({ afterClosed: () => closed });
    TestBed.configureTestingModule({ providers: [{ provide: MatDialog, useValue: { open } }] });
    const service = TestBed.inject(SdConfirmService);
    const options = {
      title: 'Title',
      icon: 'info_outline',
      label: 'Reason',
      placeholder: 'Type a reason',
      items: [],
      valueField: 'id',
      displayField: 'name',
    };
    service.confirm('M', options);
    service.withInput('M', options);
    service.withRadio('M', options);
    service.withDate('M', options);
    service.withSelect('M', options);
    service.withDatetime('M', options);
    expect(open.calls.count()).toBe(6);
    for (const call of open.calls.all()) {
      expect(call.args[1].data.icon).toBe('info_outline');
      expect(call.args[1].panelClass).toBe('sd-confirm-panel');
      expect(call.args[1].maxWidth).toBe('calc(100vw - 32px)');
    }
    expect(open.calls.argsFor(1)[1].data.input.label).toBe('Reason');
    expect(open.calls.argsFor(1)[1].data.input.placeholder).toBe('Type a reason');
    expect(open.calls.argsFor(0)[1].autoFocus).toBe('[data-confirm-cancel] button');
    expect(open.calls.argsFor(1)[1].autoFocus).toBe('textarea');
  });
});
