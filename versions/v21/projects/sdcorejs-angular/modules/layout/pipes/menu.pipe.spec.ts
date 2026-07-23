import { TestBed } from '@angular/core/testing';
import { SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { SdLayoutMenu, selectPrimaryMenuGroups } from '../services';
import { MenuPipe } from './menu.pipe';

describe('MenuPipe stable menu identity', () => {
  it('preserves explicit consumer IDs so versioned sidebar configuration and state remain stable', () => {
    TestBed.configureTestingModule({
      providers: [MenuPipe, { provide: SdPermissionService, useValue: { hasPermission: () => true } }],
    });
    const pipe = TestBed.inject(MenuPipe);
    const menus: SdLayoutMenu[] = [
      {
        id: 'workspace',
        title: 'Workspace',
        children: [{ id: 'overview', title: 'Overview', path: '/overview', permission: true }],
      },
      {
        id: 'settings',
        title: 'Settings',
        children: [{ id: 'profile', title: 'Profile', path: '/profile', permission: true }],
      },
    ];

    const transformed = pipe.transform(menus);

    expect(transformed[0].id).toBe('workspace');
    expect('children' in transformed[0] ? transformed[0].children?.[0].id : undefined).toBe('overview');
    expect(selectPrimaryMenuGroups(transformed, ['settings'])[0].id).toBe('settings');
  });
});
