import { SdLayoutMenu } from '../services/menu/menu.model';
import { resolveActiveMenuPath } from '../utils';

import { MenuFocusPipe } from './menu-focus.pipe';

describe('MenuFocusPipe', () => {
  const pipe = new MenuFocusPipe();

  const appointment: SdLayoutMenu = { id: 'appointment', path: '/appointment', title: 'Lịch hẹn', permission: true };
  const appointmentCs: SdLayoutMenu = { id: 'appointment-cs', path: '/appointment/cs', title: 'CS', permission: true };
  const csGroup: SdLayoutMenu = { id: 'cs-group', title: 'Nhóm CS', children: [appointmentCs] };
  const menus: SdLayoutMenu[] = [appointment, csGroup];

  describe('with an active path', () => {
    it('focuses only the most exact menu when several paths match', () => {
      const routePath = '/appointment/cs';
      const activePath = resolveActiveMenuPath(menus, routePath);

      expect(pipe.transform(routePath, appointmentCs, activePath)).toBeTrue();
      expect(pipe.transform(routePath, appointment, activePath)).toBeFalse();
    });

    it('focuses the parent branch that owns the active menu', () => {
      const routePath = '/appointment/cs';
      const activePath = resolveActiveMenuPath(menus, routePath);

      expect(pipe.transform(routePath, csGroup, activePath)).toBeTrue();
    });

    it('focuses the parent path on its own route', () => {
      const routePath = '/appointment';
      const activePath = resolveActiveMenuPath(menus, routePath);

      expect(pipe.transform(routePath, appointment, activePath)).toBeTrue();
      expect(pipe.transform(routePath, csGroup, activePath)).toBeFalse();
    });

    it('focuses nothing when no menu matches the route', () => {
      expect(pipe.transform('/order', appointment, null)).toBeFalse();
      expect(pipe.transform('', appointment, null)).toBeFalse();
    });
  });

  describe('without an active path', () => {
    it('keeps the previous prefix matching for existing callers', () => {
      expect(pipe.transform('/appointment/cs', appointment)).toBeTrue();
      expect(pipe.transform('/appointment/cs', csGroup)).toBeTrue();
      expect(pipe.transform('/order', appointment)).toBeFalse();
    });
  });
});
