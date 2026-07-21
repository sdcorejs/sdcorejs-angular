import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SdLayoutUserMenuComponent } from './user-menu.component';

describe('SdLayoutUserMenuComponent', () => {
  let fixture: ComponentFixture<SdLayoutUserMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdLayoutUserMenuComponent] }).compileComponents();
    fixture = TestBed.createComponent(SdLayoutUserMenuComponent);
    fixture.componentRef.setInput('userInfo', { fullName: 'Demo User', email: 'demo@example.com' });
    fixture.detectChanges();
  });

  it('renders the shared user identity and avatar trigger', () => {
    expect(fixture.nativeElement.querySelector('[data-user-trigger]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Demo User');
    expect(fixture.nativeElement.textContent).toContain('demo@example.com');
  });

  it('invokes the supplied change-password and sign-out actions', () => {
    const changePassword = jasmine.createSpy('changePassword');
    const signout = jasmine.createSpy('signout');
    fixture.componentRef.setInput('changePassword', changePassword);
    fixture.componentRef.setInput('signout', signout);
    fixture.componentInstance.open();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-user-action="change-password"]').click();
    fixture.componentInstance.open();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-user-action="signout"]').click();

    expect(changePassword).toHaveBeenCalledTimes(1);
    expect(signout).toHaveBeenCalledTimes(1);
  });

  it('omits change password when no action is available', () => {
    fixture.componentRef.setInput('signout', () => undefined);
    fixture.componentInstance.open();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-user-action="change-password"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-user-action="signout"]')).not.toBeNull();
  });

  it('closes on Escape and restores focus to its trigger', () => {
    const trigger = fixture.nativeElement.querySelector('[data-user-trigger]') as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.isOpen()).toBeTrue();

    fixture.nativeElement.querySelector('[data-user-menu]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.isOpen()).toBeFalse();
    expect(document.activeElement).toBe(trigger);
  });

  it('moves focus into the menu and handles Escape from the document', () => {
    fixture.componentRef.setInput('signout', () => undefined);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('[data-user-trigger]') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const firstAction = fixture.nativeElement.querySelector('[role="menuitem"]') as HTMLButtonElement;
    expect(document.activeElement).toBe(firstAction);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.isOpen()).toBeFalse();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes without stealing focus when the user clicks outside', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    fixture.nativeElement.querySelector('[data-user-trigger]').click();
    fixture.detectChanges();

    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.isOpen()).toBeFalse();
    outside.remove();
  });
});
