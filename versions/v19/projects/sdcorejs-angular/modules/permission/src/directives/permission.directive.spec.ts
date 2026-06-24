import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SdPermissionDirective } from './permission.directive';
import { SdPermissionService } from '../services';
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
  // GROUP 1: No permission input → always render
  // -------------------------------------------------------------------------
  describe('when sdPermission is undefined / null / empty — no restriction', () => {
    it('renders content when sdPermission is undefined', () => {
      const { fixture } = setupFixture(false); // spy returns false but should be irrelevant
      fixture.componentInstance.permission.set(undefined);
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeTrue();
    });

    it('renders content when sdPermission is null', () => {
      const { fixture } = setupFixture(false);
      fixture.componentInstance.permission.set(null);
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeTrue();
    });

    it('renders content when sdPermission is an empty string', () => {
      const { fixture } = setupFixture(false);
      fixture.componentInstance.permission.set('');
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
    it('hides content when permission changes from undefined to a denied code', () => {
      const { fixture } = setupFixture(false);
      fixture.componentInstance.permission.set(undefined);
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeTrue();

      fixture.componentInstance.permission.set('PERM_DENIED');
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeFalse();
    });

    it('shows content when permission changes back to undefined', () => {
      const { fixture } = setupFixture(false);
      fixture.componentInstance.permission.set('PERM_DENIED');
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeFalse();

      fixture.componentInstance.permission.set(undefined);
      fixture.detectChanges();
      expect(isContentVisible(fixture)).toBeTrue();
    });
  });
});
