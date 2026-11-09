import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';

import { SdQuery, SdSavedFilter } from '../../query-bar.model';
import { SdQuerySavedFiltersMenu } from './saved-filters-menu.component';

describe('SdQuerySavedFiltersMenu', () => {
  let fixture: ComponentFixture<SdQuerySavedFiltersMenu>;
  let component: SdQuerySavedFiltersMenu;
  // why: promptSave dùng SdConfirmService.withInput — stub service để spec không mở Material dialog thật
  // (withInput reject 'CANCEL' khi user huỷ). Toast cũng là stub: chỉ kiểm tham số gửi đi.
  let withInputSpy: jasmine.Spy;
  let notify: { info: jasmine.Spy; error: jasmine.Spy };
  let i18n: I18nService;

  const STORAGE = 'sd-query-bar:savedFilters:test';
  const filter = (id: string, name = id.toUpperCase()): SdSavedFilter => ({ id, name, query: { filters: [], logic: 'AND' } });
  const seed = (...items: unknown[]): void => localStorage.setItem(STORAGE, JSON.stringify(items));
  const stored = (): SdSavedFilter[] => JSON.parse(localStorage.getItem(STORAGE)!);

  const overlay = (): HTMLElement => TestBed.inject(OverlayContainer).getContainerElement();
  const trigger = (): HTMLButtonElement => fixture.nativeElement.querySelector('.c-saved-filters');
  const menu = (): HTMLElement | null => overlay().querySelector<HTMLElement>('.c-saved-filters-menu');
  const rows = (): HTMLElement[] => Array.from(menu()!.querySelectorAll<HTMLElement>('.c-sf-row'));
  const applyButtons = (): HTMLButtonElement[] => Array.from(menu()!.querySelectorAll<HTMLButtonElement>('.c-sf-apply'));
  const deleteButtons = (): HTMLButtonElement[] => Array.from(menu()!.querySelectorAll<HTMLButtonElement>('.c-sf-del'));
  const saveButton = (): HTMLButtonElement => menu()!.querySelector<HTMLButtonElement>('.c-sf-save')!;
  const key = (target: Element, value: string, init: KeyboardEventInit = {}): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };
  const mount = (inputs: { key?: string; query?: SdQuery; canSave?: boolean; autoId?: string } = { key: 'test' }): void => {
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
  };
  const open = (): void => {
    trigger().click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    localStorage.removeItem(STORAGE);
    withInputSpy = jasmine.createSpy('withInput');
    notify = { info: jasmine.createSpy('info'), error: jasmine.createSpy('error') };
    await TestBed.configureTestingModule({
      imports: [SdQuerySavedFiltersMenu, NoopAnimationsModule],
      providers: [
        { provide: SdConfirmService, useValue: { withInput: withInputSpy } },
        { provide: SdNotifyService, useValue: notify },
      ],
    }).compileComponents();
    i18n = TestBed.inject(I18nService);
    fixture = TestBed.createComponent(SdQuerySavedFiltersMenu);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    localStorage.removeItem(STORAGE);
  });

  describe('storage', () => {
    it('loads existing filters from localStorage when key is set', () => {
      seed(filter('a'));
      mount();
      expect(component.savedFilters()).toEqual([filter('a')]);
    });

    it('renders a disabled trigger and an empty list when no key is passed', () => {
      mount({});
      expect(trigger().disabled).toBeTrue();
      expect(component.savedFilters()).toEqual([]);
    });

    it('promptSave appends a filter, persists it and uses the current [query]', async () => {
      const q: SdQuery = { filters: [{ field: 'x', operator: 'EQUAL', data: 1 } as never], logic: 'OR' };
      mount({ key: 'test', query: q });
      withInputSpy.and.resolveTo('Filter 1');
      await component.promptSave();
      expect(component.savedFilters().length).toBe(1);
      expect(component.savedFilters()[0].name).toBe('Filter 1');
      expect(component.savedFilters()[0].query).toEqual(q);
      expect(stored().length).toBe(1);
    });

    it('promptSave does nothing when the dialog is cancelled or the name is blank', async () => {
      mount();
      withInputSpy.and.rejectWith('CANCEL');
      await component.promptSave();
      withInputSpy.and.resolveTo('   ');
      await component.promptSave();
      expect(component.savedFilters()).toEqual([]);
      expect(localStorage.getItem(STORAGE)).toBeNull();
    });

    it('QB-S-09 reads lists stored under the original key sd-query-bar:savedFilters:<key>', () => {
      localStorage.setItem(
        'sd-query-bar:savedFilters:test',
        JSON.stringify([{ id: 'old', name: 'Old', query: { filters: [], logic: 'AND' } }])
      );
      mount();
      expect(component.savedFilters().map(f => f.name)).toEqual(['Old']);
    });

    it('QB-S-08 Date values survive a reload as Date', async () => {
      const when = new Date('2026-11-09T03:04:05.006Z');
      mount({ key: 'test', query: { filters: [{ field: 'createdAt', operator: 'EQUAL', data: when } as never], logic: 'AND' } });
      withInputSpy.and.resolveTo('Dated');
      await component.promptSave();
      fixture.destroy();

      fixture = TestBed.createComponent(SdQuerySavedFiltersMenu);
      component = fixture.componentInstance;
      mount();
      const data = (component.savedFilters()[0].query.filters[0] as unknown as { data: unknown }).data;
      expect(data instanceof Date).toBeTrue();
      expect((data as Date).getTime()).toBe(when.getTime());
    });

    it('QB-S-08 keeps a date-only text (not Date#toJSON) a string', () => {
      seed({ id: 'a', name: 'A', query: { filters: [{ field: 'day', operator: 'EQUAL', data: '2026-11-09' }], logic: 'AND' } });
      mount();
      expect((component.savedFilters()[0].query.filters[0] as unknown as { data: unknown }).data).toBe('2026-11-09');
    });
  });

  describe('QB-S-01 panel structure', () => {
    it('QB-S-01 each row holds an apply button and a delete button side by side, nothing interactive nested', () => {
      seed(filter('a'), filter('b'));
      mount();
      open();
      expect(menu()!.getAttribute('role')).toBe('menu');
      expect(menu()!.classList).toContain('sd-query-panel');
      expect(menu()!.classList).toContain('sd-query-panel--list');
      expect(rows().length).toBe(2);
      for (const row of rows()) {
        const children = Array.from(row.children);
        expect(children.map(child => child.className.split(' ')[0])).toEqual(['c-sf-apply', 'c-sf-del']);
        const [apply, del] = children.map(child => child.getBoundingClientRect());
        expect(Math.abs(apply.top + apply.height / 2 - (del.top + del.height / 2))).toBeLessThanOrEqual(1);
        expect(del.left).toBeGreaterThanOrEqual(apply.right);
      }
      expect(menu()!.querySelectorAll('button button, button [role="button"], button a, [role="menuitem"] button').length).toBe(0);
      expect(applyButtons().every(button => button.getAttribute('role') === 'menuitem')).toBeTrue();
      expect(deleteButtons().every(button => !button.hasAttribute('role'))).toBeTrue();
      expect(deleteButtons()[0].getAttribute('aria-label')).toBe(i18n.t('core.component.query-bar.saved-filters.delete', { name: 'A' }));
    });

    it('QB-S-01 frames the list with the heading, a divider and the save item', () => {
      seed(filter('a'));
      mount();
      open();
      const heading = menu()!.querySelector<HTMLElement>('.c-sf-heading')!;
      expect(heading.textContent!.trim()).toBe(i18n.t('core.component.query-bar.saved-filters.heading'));
      expect(menu()!.getAttribute('aria-labelledby')).toBe(heading.id);
      expect(getComputedStyle(heading).fontSize).toBe('12px');
      expect(menu()!.querySelector('.c-sf-divider[role="separator"]')).not.toBeNull();
      expect(saveButton().getAttribute('role')).toBe('menuitem');
      expect(saveButton().textContent).toContain(i18n.t('core.component.query-bar.saved-filters.save'));
      expect(getComputedStyle(applyButtons()[0]).minHeight).toBe('40px');
      expect(getComputedStyle(applyButtons()[0]).fontSize).toBe('14px');
    });

    it('shows the empty line when nothing is saved', () => {
      mount();
      open();
      const line = menu()!.querySelector<HTMLElement>('.c-sf-state')!;
      expect(line.textContent!.trim()).toBe(i18n.t('core.component.query-bar.saved-filters.empty'));
      expect(getComputedStyle(line).fontSize).toBe('13px');
    });

    it('trigger is a menu button named by the tooltip key', () => {
      mount();
      expect(trigger().getAttribute('aria-haspopup')).toBe('menu');
      expect(trigger().getAttribute('aria-expanded')).toBe('false');
      expect(trigger().getAttribute('aria-label')).toBe(i18n.t('core.component.query-bar.saved-filters.tooltip'));
      open();
      expect(trigger().getAttribute('aria-expanded')).toBe('true');
    });

    it('pick emits (apply) with the chosen filter and closes the panel', () => {
      seed(filter('a'));
      mount();
      const spy = jasmine.createSpy('apply');
      component.apply.subscribe(spy);
      open();
      applyButtons()[0].click();
      fixture.detectChanges();
      expect(spy).toHaveBeenCalledWith(filter('a'));
      expect(menu()).toBeNull();
    });

    it('clicking the save item closes the panel and calls promptSave', () => {
      mount();
      withInputSpy.and.rejectWith('CANCEL');
      const spy = spyOn(component, 'promptSave').and.callThrough();
      open();
      saveButton().click();
      fixture.detectChanges();
      expect(spy).toHaveBeenCalled();
      expect(menu()).toBeNull();
    });
  });

  describe('QB-S-02 delete button visibility', () => {
    it('QB-S-02 hides the delete button until its row has focus within', () => {
      seed(filter('a'));
      mount();
      // Mở bằng chuột: focus ở khung panel, chưa hàng nào chứa focus.
      trigger().dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      trigger().click();
      fixture.detectChanges();
      expect(document.activeElement).toBe(menu());
      expect(getComputedStyle(deleteButtons()[0]).opacity).toBe('0');
      applyButtons()[0].focus();
      fixture.detectChanges();
      expect(getComputedStyle(deleteButtons()[0]).opacity).toBe('1');
    });

    it('QB-S-02 always shows a 40px delete button on a coarse pointer', () => {
      const matchMedia = window.matchMedia.bind(window);
      spyOn(window, 'matchMedia').and.callFake((query: string) =>
        query === '(pointer: coarse)' ? ({ matches: true, media: query } as MediaQueryList) : matchMedia(query)
      );
      seed(filter('a'));
      mount();
      trigger().dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      trigger().click();
      fixture.detectChanges();
      const del = deleteButtons()[0];
      expect(getComputedStyle(del).opacity).toBe('1');
      expect(del.getBoundingClientRect().width).toBe(40);
      expect(del.getBoundingClientRect().height).toBe(40);
    });
  });

  describe('QB-S-03 keyboard', () => {
    beforeEach(() => {
      seed(filter('a'), filter('b'));
      mount({ key: 'test', canSave: true });
      open();
    });

    it('QB-S-03 opens on the first apply button; arrows, Home and End move over apply buttons and Save, skipping delete', () => {
      expect(document.activeElement).toBe(applyButtons()[0]);
      key(document.activeElement!, 'ArrowDown');
      expect(document.activeElement).toBe(applyButtons()[1]);
      key(document.activeElement!, 'ArrowDown');
      expect(document.activeElement).toBe(saveButton());
      key(document.activeElement!, 'ArrowDown');
      expect(document.activeElement).toBe(applyButtons()[0]);
      key(document.activeElement!, 'ArrowUp');
      expect(document.activeElement).toBe(saveButton());
      key(document.activeElement!, 'Home');
      expect(document.activeElement).toBe(applyButtons()[0]);
      key(document.activeElement!, 'End');
      expect(document.activeElement).toBe(saveButton());
    });

    it('QB-S-03 ArrowRight or Tab moves to the delete button of the row, ArrowLeft or Shift+Tab back', () => {
      const right = key(applyButtons()[0], 'ArrowRight');
      expect(right.defaultPrevented).toBeTrue();
      expect(document.activeElement).toBe(deleteButtons()[0]);
      key(document.activeElement!, 'ArrowLeft');
      expect(document.activeElement).toBe(applyButtons()[0]);
      key(document.activeElement!, 'Tab');
      expect(document.activeElement).toBe(deleteButtons()[0]);
      expect(menu()).not.toBeNull();
      key(document.activeElement!, 'Tab', { shiftKey: true });
      expect(document.activeElement).toBe(applyButtons()[0]);
      key(deleteButtons()[0], 'ArrowDown');
      expect(document.activeElement).toBe(applyButtons()[1]);
    });

    it('QB-S-03 Delete on an apply button removes the filter; focus goes to the next row, then to Save', () => {
      key(applyButtons()[0], 'Delete');
      expect(component.savedFilters().map(f => f.id)).toEqual(['b']);
      expect(document.activeElement).toBe(applyButtons()[0]);
      expect(applyButtons()[0].textContent).toContain('B');
      key(applyButtons()[0], 'Delete');
      expect(component.savedFilters()).toEqual([]);
      expect(document.activeElement).toBe(saveButton());
    });

    it('QB-S-03 deleting from the delete button moves focus to the next row too', () => {
      deleteButtons()[0].click();
      fixture.detectChanges();
      expect(document.activeElement).toBe(applyButtons()[0]);
      expect(menu()).not.toBeNull();
    });
  });

  describe('QB-S-04 delete and undo', () => {
    it('QB-S-04 deletes at once, writes localStorage and shows an info toast with Undo', () => {
      seed(filter('a'), filter('b'), filter('c'));
      mount();
      open();
      deleteButtons()[1].click();
      fixture.detectChanges();
      expect(stored().map(f => f.id)).toEqual(['a', 'c']);
      expect(notify.info).toHaveBeenCalledTimes(1);
      const [message, option] = notify.info.calls.mostRecent().args;
      expect(message).toBe('B');
      expect(option.title).toBe(i18n.t('core.component.query-bar.saved-filters.deleted'));
      expect(option.actionLabel).toBe(i18n.t('core.component.query-bar.saved-filters.undo'));

      option.onAction();
      fixture.detectChanges();
      expect(component.savedFilters().map(f => f.id)).toEqual(['a', 'b', 'c']);
      expect(stored().map(f => f.id)).toEqual(['a', 'b', 'c']);
    });

    it('QB-S-04 Undo after the list changed puts the filter back at its old index, clamped to the length', async () => {
      seed(filter('a'), filter('b'), filter('c'));
      mount();
      component.remove(2);
      const undoC = notify.info.calls.mostRecent().args[1].onAction;
      component.remove(0);
      const undoA = notify.info.calls.mostRecent().args[1].onAction;
      withInputSpy.and.resolveTo('D');
      await component.promptSave();
      expect(component.savedFilters().map(f => f.name)).toEqual(['B', 'D']);
      undoA();
      expect(component.savedFilters().map(f => f.name)).toEqual(['A', 'B', 'D']);
      undoC();
      expect(component.savedFilters().map(f => f.name)).toEqual(['A', 'B', 'C', 'D']);
      undoC();
      expect(component.savedFilters().map(f => f.name)).toEqual(['A', 'B', 'C', 'D']);
      expect(stored().map(f => f.name)).toEqual(['A', 'B', 'C', 'D']);
    });
  });

  describe('QB-S-05 save', () => {
    it('QB-S-05 disables Save while there is nothing to save', () => {
      mount({ key: 'test', canSave: false });
      open();
      expect(saveButton().disabled).toBeTrue();
      expect(getComputedStyle(saveButton()).opacity).toBe('0.45');
      fixture.componentRef.setInput('canSave', true);
      fixture.detectChanges();
      expect(saveButton().disabled).toBeFalse();
    });
  });

  describe('QB-S-06 read errors', () => {
    it('QB-S-06 shows the read error line for unreadable JSON; saving replaces the broken list', async () => {
      localStorage.setItem(STORAGE, '{not json');
      mount();
      open();
      const line = menu()!.querySelector<HTMLElement>('.c-sf-state--error')!;
      // why: textContent của sd-icon chứa tên ligature ("error") — đọc riêng phần chữ.
      expect(line.querySelector('span')!.textContent!.trim()).toBe(i18n.t('core.component.query-bar.saved-filters.read-error'));
      expect(line.querySelector('sd-icon')!.getAttribute('aria-hidden')).toBe('true');
      expect(menu()!.textContent).not.toContain(i18n.t('core.component.query-bar.saved-filters.empty'));
      expect(saveButton().disabled).toBeFalse();

      withInputSpy.and.resolveTo('Fresh');
      await component.promptSave();
      fixture.detectChanges();
      expect(stored().map(f => f.name)).toEqual(['Fresh']);
      expect(component.readError()).toBeFalse();
    });

    it('QB-S-06 treats a stored value that is not an array as a read error', () => {
      localStorage.setItem(STORAGE, '{"id":"a"}');
      mount();
      expect(component.readError()).toBeTrue();
      expect(component.savedFilters()).toEqual([]);
    });

    it('QB-S-06 drops entries without id, name or query and keeps the valid ones', () => {
      seed(
        filter('a'),
        { name: 'No id', query: { filters: [] } },
        { id: 'x', query: { filters: [] } },
        { id: 'y', name: 'No query' },
        null,
        'text',
        filter('b')
      );
      mount();
      expect(component.savedFilters().map(f => f.id)).toEqual(['a', 'b']);
      expect(component.readError()).toBeFalse();
    });
  });

  describe('QB-S-07 write errors', () => {
    const secret = 'QuotaExceededError: secret-detail-123';

    it('QB-S-07 save, delete and undo keep the previous list when setItem throws and show an error toast', async () => {
      seed(filter('a'), filter('b'));
      mount();
      component.remove(0);
      const undo = notify.info.calls.mostRecent().args[1].onAction;
      const setItem = spyOn(Storage.prototype, 'setItem').and.throwError(secret);

      withInputSpy.and.resolveTo('New');
      await component.promptSave();
      expect(component.savedFilters().map(f => f.id)).toEqual(['b']);

      component.remove(0);
      expect(component.savedFilters().map(f => f.id)).toEqual(['b']);
      expect(notify.info).toHaveBeenCalledTimes(1);

      undo();
      expect(component.savedFilters().map(f => f.id)).toEqual(['b']);

      expect(setItem).toHaveBeenCalledTimes(3);
      expect(notify.error).toHaveBeenCalledTimes(3);
      for (const call of notify.error.calls.all()) {
        expect(call.args[0]).toBe(i18n.t('core.component.query-bar.saved-filters.write-error'));
        expect(JSON.stringify(call.args)).not.toContain('secret-detail-123');
      }
      open();
      expect(overlay().textContent).not.toContain('secret-detail-123');
    });
  });

  describe('QB-S-10 data-autoid', () => {
    it('QB-S-10 sets data-autoid on the trigger, panel, apply, delete and save only with an autoId', () => {
      seed(filter('a'), filter('b'));
      mount({ key: 'test', autoId: 'orders' });
      open();
      expect(trigger().getAttribute('data-autoid')).toBe('orders-saved-filters');
      expect(menu()!.getAttribute('data-autoid')).toBe('orders-panel-saved-filters');
      expect(applyButtons().map(b => b.getAttribute('data-autoid'))).toEqual(['orders-saved-filter-0', 'orders-saved-filter-1']);
      expect(deleteButtons().map(b => b.getAttribute('data-autoid'))).toEqual([
        'orders-saved-filter-0-delete',
        'orders-saved-filter-1-delete',
      ]);
      expect(saveButton().getAttribute('data-autoid')).toBe('orders-saved-filters-save');
    });

    it('QB-S-10 leaves data-autoid off without an autoId', () => {
      seed(filter('a'));
      mount();
      open();
      expect(trigger().hasAttribute('data-autoid')).toBeFalse();
      expect(menu()!.querySelectorAll('[data-autoid]').length).toBe(0);
    });
  });
});
