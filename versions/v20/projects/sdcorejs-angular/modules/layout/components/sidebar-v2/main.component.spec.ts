import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SdLayoutMenu } from '../../services';
import { SidebarV2Component } from './main.component';

const work: SdLayoutMenu = {
  id: 'work',
  title: 'Công việc',
  children: [{ id: 'dashboard', title: 'Tổng quan', path: '/dashboard', permission: true }],
};
const admin: SdLayoutMenu = {
  id: 'admin',
  title: 'Quản trị',
  children: [{ id: 'users', title: 'Người dùng', path: '/users', permission: true }],
};

describe('SidebarV2Component', () => {
  let fixture: ComponentFixture<SidebarV2Component>;

  async function create(interaction: 'click' | 'hover-lock' = 'click'): Promise<void> {
    await TestBed.configureTestingModule({ imports: [SidebarV2Component], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(SidebarV2Component);
    fixture.componentRef.setInput('menus', [work, admin]);
    fixture.componentRef.setInput('userInfo', { fullName: 'Demo User' });
    fixture.componentRef.setInput('sidebar', { version: 2, interaction });
    fixture.detectChanges();
  }

  it('toggles and switches flyout groups in click mode', async () => {
    await create('click');
    fixture.componentInstance.selectGroup(work);
    expect(fixture.componentInstance.activeGroupKey()).toBe('id:work');
    expect(fixture.componentInstance.isFlyoutOpen()).toBeTrue();

    fixture.componentInstance.selectGroup(admin);
    expect(fixture.componentInstance.activeGroupKey()).toBe('id:admin');
    fixture.componentInstance.selectGroup(admin);
    expect(fixture.componentInstance.isFlyoutOpen()).toBeFalse();
  });

  it('previews on hover and preserves a clicked hover-lock flyout', async () => {
    await create('hover-lock');
    fixture.componentInstance.previewGroup(work);
    expect(fixture.componentInstance.isFlyoutOpen()).toBeTrue();
    fixture.componentInstance.leaveFlyout();
    expect(fixture.componentInstance.isFlyoutOpen()).toBeFalse();

    fixture.componentInstance.previewGroup(work);
    fixture.componentInstance.selectGroup(work);
    fixture.componentInstance.leaveFlyout();
    expect(fixture.componentInstance.isFlyoutLocked()).toBeTrue();
    expect(fixture.componentInstance.isFlyoutOpen()).toBeTrue();
  });

  it('closes unlocked state through backdrop, Escape and navigation', async () => {
    await create('click');
    for (const close of [
      () => fixture.componentInstance.closeFromBackdrop(),
      () => fixture.componentInstance.closeFromEscape(),
      () => fixture.componentInstance.closeFromNavigation(),
    ]) {
      fixture.componentInstance.selectGroup(work);
      close();
      expect(fixture.componentInstance.isFlyoutOpen()).toBeFalse();
      expect(fixture.componentInstance.isFlyoutLocked()).toBeFalse();
    }
  });

  it('keeps the projected-content offset fixed while the flyout changes', async () => {
    await create('click');
    const content = fixture.nativeElement.querySelector('[data-v2-content]');
    expect(content.getAttribute('data-content-offset')).toBe('rail');
    fixture.componentInstance.selectGroup(work);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-v2-content]').getAttribute('data-content-offset')).toBe('rail');
  });

  it('closes on Escape while focus remains on the rail trigger', async () => {
    await create('click');
    const trigger = fixture.nativeElement.querySelector('[data-v2-group-key="id:work"]') as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.isFlyoutOpen()).toBeFalse();
  });

  it('centers the compact account avatar without a disclosure icon', async () => {
    await create('click');

    const trigger = fixture.nativeElement.querySelector('[data-user-trigger]') as HTMLButtonElement;
    expect(trigger.classList).toContain('sd-layout-user-menu__trigger--compact');
    expect(trigger.querySelector('sd-avatar')).not.toBeNull();
    expect(trigger.querySelector('sd-icon')).toBeNull();
  });
});
