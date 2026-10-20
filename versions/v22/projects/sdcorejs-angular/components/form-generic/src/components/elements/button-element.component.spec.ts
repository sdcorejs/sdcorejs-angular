import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdButton } from '@sdcorejs/angular/components/button';
import type { SdFormGenericButton } from '../../models/form-generic-element.model';
import { LibButtonElementComponent } from './button-element.component';

describe('LibButtonElementComponent', () => {
  let fixture: ComponentFixture<LibButtonElementComponent>;
  const root = () => fixture.nativeElement as HTMLElement;
  const sdButton = () => fixture.debugElement.query(By.directive(SdButton)).componentInstance as SdButton;

  const render = (button: Record<string, unknown>, inputs: Record<string, unknown> = {}) => {
    localStorage.setItem('sd-core.language', 'vi');
    TestBed.configureTestingModule({ imports: [LibButtonElementComponent, NoopAnimationsModule] });
    fixture = TestBed.createComponent(LibButtonElementComponent);
    fixture.componentRef.setInput('button', {
      id: 'b',
      type: 'button',
      label: 'Send',
      action: 'submit',
      ...button,
    } as unknown as SdFormGenericButton);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  };

  it('maps the schema button to sd-button inputs with the action defaults', () => {
    render({});
    expect(sdButton().type()).toBe('fill');
    expect(sdButton().color()).toBe('primary');
    expect(sdButton().title()).toBe('Send');
    expect(sdButton().block()).toBeFalse();
    expect(sdButton().htmlType()).toBe('button');
    TestBed.resetTestingModule();
    render({ action: 'reset', label: 'Reset', icon: 'refresh' });
    expect(sdButton().type()).toBe('light');
    expect(sdButton().color()).toBe('secondary');
    expect(sdButton().prefixIcon()).toBe('refresh');
  });

  it('uses the variant, color and alignment of the schema; stretch fills the cell', () => {
    render({ variant: 'outline', color: 'error', align: 'end' });
    expect(sdButton().type()).toBe('outline');
    expect(sdButton().color()).toBe('error');
    expect(root().querySelector('.sd-fg-button')?.classList).toContain('sd-fg-button--end');
    TestBed.resetTestingModule();
    render({ align: 'stretch' });
    expect(sdButton().block()).toBeTrue();
  });

  it('is disabled and busy from its inputs', () => {
    render({}, { disabled: true, busy: true });
    expect(sdButton().disabled()).toBeTrue();
    expect(sdButton().loading()).toBeTrue();
  });

  it('emits pressed when sd-button is clicked', () => {
    render({});
    let pressed = 0;
    fixture.componentInstance.pressed.subscribe(() => pressed++);
    sdButton().click.emit(new MouseEvent('click'));
    expect(pressed).toBe(1);
  });
});
