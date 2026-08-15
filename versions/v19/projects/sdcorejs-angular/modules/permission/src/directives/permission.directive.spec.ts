import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SdPermissionDirective } from './permission.directive';
import { SD_PERMISSION_PUBLIC, SdPermissionService } from '../services';
import { SD_PERMISSION_CONFIGURATION } from '../configurations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePermissionService(hasPermissionResult: boolean): jasmine.SpyObj<SdPermissionService> {
  return jasmine.createSpyObj<SdPermissionService>('SdPermissionService', {
    hasPermission: hasPermissionResult,
    loadPermissions: Promise.resolve([]),
    loadAllPermissions: Promise.resolve(),
    getToken: Promise.resolve(undefined),
    decodeToken: Promise.resolve(null),
    readUnverifiedTokenClaims: Promise.resolve(null),
    reset: undefined,
    invalidate: undefined,
  });
}

// ---------------------------------------------------------------------------
// Host component — uses structural directive (microsyntax without key)
// ---------------------------------------------------------------------------
@Component({
  standalone: true,
  imports: [SdPermissionDirective],
  template: `<span *sdPermission="permission()" class="content">visible</span>`,
})
class HostComponent {
  permission = signal<string | string[] | undefined | null>(undefined);
}

// ---------------------------------------------------------------------------
// Host component — explicit ng-template form to bind both inputs
// ---------------------------------------------------------------------------
@Component({
  standalone: true,
  imports: [SdPermissionDirective],
  template: `
    <ng-template [sdPermission]="permission()" [sdPermissionKey]="permissionKey()">
      <span class="keyed-content">visible-keyed</span>
    </ng-template>
  `,
})
class KeyedHostComponent {
  permission = signal<string | string[] | undefined | null>('PERM_Y');
  permissionKey = signal<string | undefined>(undefined);
}

// ---------------------------------------------------------------------------
// Fixture factories
// ---------------------------------------------------------------------------

function setupFixture(permissionSpyResult: boolean): {
  fixture: ComponentFixture<HostComponent>;
  permSvc: jasmine.SpyObj<SdPermissionService>;
} {
  const permSvc = makePermissionService(permissionSpyResult);
  TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [
      { provide: SdPermissionService, useValue: permSvc },
      { provide: SD_PERMISSION_CONFIGURATION, useValue: { loadPermissions: () => [] } },
    ],
  });
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  return { fixture, permSvc };
}

function setupKeyedFixture(permissionSpyResult: boolean): {
  fixture: ComponentFixture<KeyedHostComponent>;
  permSvc: jasmine.SpyObj<SdPermissionService>;
} {
  const permSvc = makePermissionService(permissionSpyResult);
  TestBed.configureTestingModule({
    imports: [KeyedHostComponent],
    providers: [
      { provide: SdPermissionService, useValue: permSvc },
      { provide: SD_PERMISSION_CONFIGURATION, useValue: { loadPermissions: () => [] } },
    ],
  });
  const fixture = TestBed.createComponent(KeyedHostComponent);
  fixture.detectChanges();
  return { fixture, permSvc };
}

function isContentVisible(fixture: ComponentFixture<HostComponent>): boolean {
  return !!fixture.nativeElement.querySelector('.content');
}

function isKeyedContentVisible(fixture: ComponentFixture<KeyedHostComponent>): boolean {
  return !!fixture.nativeElement.querySelector('.keyed-content');
}

// ---------------------------------------------------------------------------
describe('SdPermissionDirective', () => {
  afterEach(() => TestBed.resetTestingModule());

  // -------------------------------------------------------------------------
  // GROUP 1: No permission input → FAIL CLOSED (delegated to hasPermission)
  // -------------------------------------------------------------------------
  // why: nhánh "rỗng ⇒ render vô điều kiện" cũ nằm NGAY TRONG directive, nên nó bỏ qua service hoàn
  // toàn: `*sdPermission="perm"` với `perm` undefined (gõ sai tên biến, dữ liệu chưa về) hiện nút cho
  // tất cả mọi người. Giờ mọi quyết định phải đi qua `hasPermission` — directive không còn cửa sau.
  describe('when sdPermission is undefined / null / empty — fail closed', () => {
    it('hides content when sdPermission is undefined', () => {
      const { fixture } = setupFixture(false);
      fixture.componentInstance.permission.set(undefined);
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeFalse();
    });

    it('hides content when sdPermission is null', () => {
      const { fixture } = setupFixture(false);
      fixture.componentInstance.permission.set(null);
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeFalse();
    });

    it('hides content when sdPermission is an empty string', () => {
      const { fixture } = setupFixture(false);
      fixture.componentInstance.permission.set('');
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeFalse();
    });

    it('delegates the empty case to hasPermission() instead of short-circuiting', () => {
      const { fixture, permSvc } = setupFixture(false);
      fixture.componentInstance.permission.set(undefined);
      fixture.detectChanges();
      expect(permSvc.hasPermission).toHaveBeenCalledWith(undefined, undefined);
    });

    it('renders only when the explicit SD_PERMISSION_PUBLIC opt-out is used', () => {
      const { fixture, permSvc } = setupFixture(false);
      // Bám đúng ngữ nghĩa thật của service: rỗng ⇒ false, sentinel ⇒ true.
      permSvc.hasPermission.and.callFake((perm: any) => perm === SD_PERMISSION_PUBLIC);

      fixture.componentInstance.permission.set('');
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeFalse();

      fixture.componentInstance.permission.set(SD_PERMISSION_PUBLIC);
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 2: Permission granted
  // -------------------------------------------------------------------------
  describe('when hasPermission() returns true', () => {
    it('renders content for a single permission string', () => {
      const { fixture } = setupFixture(true);
      fixture.componentInstance.permission.set('PERM_A');
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeTrue();
    });

    it('renders content for an array of permissions', () => {
      const { fixture } = setupFixture(true);
      fixture.componentInstance.permission.set(['PERM_A', 'PERM_B']);
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeTrue();
    });

    it('passes the permission value to hasPermission()', () => {
      const { fixture, permSvc } = setupFixture(true);
      fixture.componentInstance.permission.set('PERM_X');
      fixture.detectChanges();
      expect(permSvc.hasPermission).toHaveBeenCalledWith('PERM_X', undefined);
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 3: Permission denied
  // -------------------------------------------------------------------------
  describe('when hasPermission() returns false', () => {
    it('hides content for a single permission string', () => {
      const { fixture } = setupFixture(false);
      fixture.componentInstance.permission.set('PERM_DENIED');
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeFalse();
    });

    it('hides content for an array of permissions', () => {
      const { fixture } = setupFixture(false);
      fixture.componentInstance.permission.set(['PERM_A', 'PERM_B']);
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 4: sdPermissionKey binding (explicit ng-template form)
  // -------------------------------------------------------------------------
  describe('sdPermissionKey — keyed permission lookup', () => {
    it('passes permissionKey to hasPermission() when sdPermissionKey is set', () => {
      const { fixture, permSvc } = setupKeyedFixture(true);
      fixture.componentInstance.permission.set('PERM_Y');
      fixture.componentInstance.permissionKey.set('pcm');
      fixture.detectChanges();
      expect(permSvc.hasPermission).toHaveBeenCalledWith('PERM_Y', 'pcm');
    });

    it('renders keyed content when hasPermission() returns true', () => {
      const { fixture } = setupKeyedFixture(true);
      fixture.componentInstance.permission.set('PERM_Y');
      fixture.detectChanges();
      expect(isKeyedContentVisible(fixture)).toBeTrue();
    });

    it('hides keyed content when hasPermission() returns false', () => {
      const { fixture } = setupKeyedFixture(false);
      fixture.componentInstance.permission.set('PERM_Y');
      fixture.detectChanges();
      expect(isKeyedContentVisible(fixture)).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 5: Reactivity — permission changes dynamically
  // -------------------------------------------------------------------------
  describe('reactivity — permission changes after initial render', () => {
    it('hides content when permission changes from a granted code to a denied one', () => {
      const { fixture, permSvc } = setupFixture(true);
      fixture.componentInstance.permission.set('PERM_OK');
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeTrue();

      permSvc.hasPermission.and.returnValue(false);
      fixture.componentInstance.permission.set('PERM_DENIED');
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeFalse();
    });

    // why: quyền đang hiện mà binding rơi về undefined (dữ liệu bị reset, user đổi tenant) phải ẩn
    // ngay — code cũ lại render vô điều kiện, biến một lỗi dữ liệu thành lỗ hổng hiển thị.
    it('hides content when permission changes back to undefined', () => {
      const { fixture, permSvc } = setupFixture(true);
      permSvc.hasPermission.and.callFake((perm: any) => !!perm);

      fixture.componentInstance.permission.set('PERM_OK');
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeTrue();

      fixture.componentInstance.permission.set(undefined);
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeFalse();
    });
  });
});
