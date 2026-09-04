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

describe('MenuPipe fail-closed filtering', () => {
  let pipe: MenuPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MenuPipe, { provide: SdPermissionService, useValue: { hasPermission: () => true } }],
    });
    pipe = TestBed.inject(MenuPipe);
  });

  it('keeps relative routes and absolute http(s) destinations', () => {
    const menus: SdLayoutMenu[] = [
      { id: 'overview', title: 'Overview', path: '/overview', permission: true },
      { id: 'docs', title: 'Docs', path: 'https://example.com/docs', permission: true },
      { id: 'insecure-docs', title: 'Legacy docs', path: 'http://example.com/docs', permission: true },
    ];

    expect(pipe.transform(menus).map(menu => menu.id)).toEqual(['overview', 'docs', 'insecure-docs']);
  });

  it('drops a leaf whose path uses a non-http scheme even when it contains the substring "http"', () => {
    const menus: SdLayoutMenu[] = [
      { id: 'evil', title: 'Evil', path: 'javascript:fetch("//evil.example.com")//http', permission: true },
      { id: 'evil-data', title: 'Evil data', path: 'data:text/html,<script>alert(1)</script>', permission: true },
      { id: 'safe', title: 'Safe', path: '/safe', permission: true },
    ];

    expect(pipe.transform(menus).map(menu => menu.id)).toEqual(['safe']);
  });

  it('drops a group whose only child has an unsafe path instead of rendering an empty group', () => {
    const menus: SdLayoutMenu[] = [
      { id: 'tools', title: 'Tools', children: [{ id: 'evil', title: 'Evil', path: 'javascript:alert(1)//http', permission: true }] },
    ];

    expect(pipe.transform(menus)).toEqual([]);
  });

  it('drops a navigable leaf whose permission key is mistyped instead of showing it to everyone', () => {
    // why: `permision` / `permissions` là lỗi gõ phím có thật; entry không có key `permission` từng
    // rơi thẳng xuống nhánh `return { ...menu }` nên hiện với mọi người — fail open.
    const menus = [
      { id: 'typo', title: 'Secret', path: '/secret', permision: 'SECRET_R' },
      { id: 'plural-typo', title: 'Secret plural', path: '/secret-plural', permissions: ['SECRET_R'] },
    ] as unknown as SdLayoutMenu[];

    expect(pipe.transform(menus)).toEqual([]);
  });

  it('still fails closed for an explicit permission: undefined', () => {
    const menus = [{ id: 'undef', title: 'Secret', path: '/secret', permission: undefined }] as unknown as SdLayoutMenu[];

    expect(pipe.transform(menus)).toEqual([]);
  });

  it('keeps a non-navigable entry that has neither children nor a path', () => {
    // why: chỉ menu LÁ có `path` mới bị fail closed; nhãn/nhóm rỗng không điều hướng được nên giữ lại.
    const menus = [{ title: 'Divider' }] as unknown as SdLayoutMenu[];

    const transformed = pipe.transform(menus);

    expect(transformed.length).toBe(1);
    expect(transformed[0].title).toBe('Divider');
  });
});
