import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdTableOption } from '../../models/table-option.model';
import { ConfigComponent, ConfigFilterSetup } from './config.component';

// The settings modal gets a second tab, "Bộ lọc": the filter kind (panel or bar) and the external filters with a switch
// each. Apply stores both tabs, Skip drops both (handoff table-settings-filters, step 4).

const OPTION = {
  type: 'local',
  key: 'config-filter-tab-spec',
  data: [],
  columns: [
    { field: 'code', title: 'Mã đơn', width: '120px' },
    { field: 'status', title: 'Trạng thái' },
  ],
} as unknown as SdTableOption;

const SETUP: ConfigFilterSetup = {
  mode: 'default',
  modeSelectable: true,
  inlineExternal: { status: true, createdAt: true, channel: false, area: true },
  externalFilters: [
    { field: 'status', title: 'Trạng thái', required: false, offBar: false },
    { field: 'createdAt', title: 'Ngày tạo', required: true, offBar: false },
    { field: 'channel', title: 'Kênh bán', required: false, offBar: false },
    { field: 'area', title: 'Khu vực', required: false, offBar: true },
  ],
};

function panel(): HTMLElement {
  const el = document.body.querySelector<HTMLElement>('.sd-table-config');
  if (!el) throw new Error('config panel not rendered');
  return el;
}

const tablist = () => panel().querySelector<HTMLElement>('[role="tablist"]');
const tabOf = (tab: string) => panel().querySelector<HTMLButtonElement>(`[role="tab"][data-tab="${tab}"]`)!;
const activePanel = () => panel().querySelector<HTMLElement>('[role="tabpanel"]');
const radioOf = (mode: string) => panel().querySelector<HTMLInputElement>(`.c-modes input[type="radio"][value="${mode}"]`);
const rowOf = (field: string) => panel().querySelector<HTMLElement>(`.c-filter-row[data-field="${field}"]`)!;
const switchOf = (field: string) => rowOf(field).querySelector<HTMLButtonElement>('button[role="switch"]')!;
const noteOf = (field: string) => rowOf(field).querySelector('.c-option-hint')?.textContent?.trim() ?? '';
const listDesc = () => panel().querySelector('.c-filter-desc')!.textContent!.trim();

describe('ConfigComponent filter tab', () => {
  let fixture: ComponentFixture<ConfigComponent>;
  let component: ConfigComponent;
  let applied: unknown[];

  /** `null`: the table gives no filter tab. */
  const setup = (filterSetup: ConfigFilterSetup | null = SETUP) => {
    fixture = TestBed.createComponent(ConfigComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tableOption', OPTION);
    fixture.componentRef.setInput('autoId', 'components-table-demo');
    fixture.componentRef.setInput('filterSetup', filterSetup ?? undefined);
    applied = [];
    component.filterApplied.subscribe(value => applied.push(value));
    fixture.detectChanges();
  };

  const render = () => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  };

  const open = () => {
    component.open();
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();
  };

  const openFilters = () => {
    open();
    tabOf('filters').click();
    render();
  };

  const key = (target: HTMLElement, name: string) => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
    render();
    tick();
    render();
  };

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [ConfigComponent, NoopAnimationsModule] }).compileComponents();
  });

  afterEach(() => {
    document.body.querySelectorAll('.cdk-overlay-container').forEach(el => (el.innerHTML = ''));
    localStorage.clear();
  });

  describe('tabs', () => {
    it('shows no tabs without a filter setup', fakeAsync(() => {
      setup(null);
      open();
      expect(tablist()).toBeNull();
      expect(panel().querySelector('.c-list')).not.toBeNull();
      expect(activePanel()).toBeNull();
    }));

    it('shows the Cột and Bộ lọc tabs, with Cột selected and its panel labelled by it', fakeAsync(() => {
      setup();
      open();
      const tabs = Array.from(tablist()!.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
      expect(tabs.map(tab => tab.textContent!.trim())).toEqual(['Cột', 'Bộ lọc']);
      expect(tabs.map(tab => tab.getAttribute('aria-selected'))).toEqual(['true', 'false']);
      expect(tabs.map(tab => tab.tabIndex)).toEqual([0, -1]);
      expect(tabs[0].getAttribute('data-autoid')).toBe('components-table-demo-config-tab-columns');
      const shown = activePanel()!;
      expect(shown.getAttribute('aria-labelledby')).toBe(tabs[0].id);
      expect(tabs[0].getAttribute('aria-controls')).toBe(shown.id);
      expect(shown.querySelector('.c-list')).not.toBeNull();
    }));

    it('switches with a click, the arrow keys, Home and End', fakeAsync(() => {
      setup();
      open();
      tabOf('filters').click();
      render();
      expect(tabOf('filters').getAttribute('aria-selected')).toBe('true');
      expect(activePanel()!.querySelector('.c-list')).toBeNull();
      expect(activePanel()!.querySelector('.c-modes')).not.toBeNull();

      key(tabOf('filters'), 'ArrowRight');
      expect(tabOf('columns').getAttribute('aria-selected')).toBe('true');
      expect(document.activeElement).toBe(tabOf('columns'));
      key(tabOf('columns'), 'End');
      expect(tabOf('filters').getAttribute('aria-selected')).toBe('true');
      key(tabOf('filters'), 'Home');
      expect(tabOf('columns').getAttribute('aria-selected')).toBe('true');
      key(tabOf('columns'), 'ArrowLeft');
      expect(tabOf('filters').getAttribute('aria-selected')).toBe('true');
    }));

    it('opens on the Cột tab every time', fakeAsync(() => {
      setup();
      openFilters();
      component.close();
      render();
      open();
      expect(tabOf('columns').getAttribute('aria-selected')).toBe('true');
    }));
  });

  describe('filter kind', () => {
    it('offers the two kinds as a radio group, with the option mode checked', fakeAsync(() => {
      setup();
      openFilters();
      const group = panel().querySelector<HTMLElement>('.c-modes')!;
      expect(group.tagName).toBe('FIELDSET');
      expect(group.querySelector('legend')!.textContent!.trim()).toBe('Kiểu lọc');
      expect(radioOf('default')!.checked).toBeTrue();
      expect(radioOf('query-bar')!.checked).toBeFalse();
      expect(radioOf('default')!.name).toBe(radioOf('query-bar')!.name);
      const titles = Array.from(group.querySelectorAll('.c-mode-title')).map(el => el.textContent!.trim());
      expect(titles).toEqual(['Khung bộ lọc', 'Thanh bộ lọc']);
      expect(group.querySelectorAll('.c-mode-desc').length).toBe(2);
      expect(radioOf('query-bar')!.getAttribute('data-autoid')).toBe('components-table-demo-config-mode-query-bar');
    }));

    it('checks the stored choice over the option mode', fakeAsync(() => {
      setup({ ...SETUP, storedMode: 'query-bar' });
      openFilters();
      expect(radioOf('query-bar')!.checked).toBeTrue();
    }));

    it('marks the card of the picked kind', fakeAsync(() => {
      setup();
      openFilters();
      radioOf('query-bar')!.click();
      render();
      const cards = Array.from(panel().querySelectorAll<HTMLElement>('.c-mode'));
      expect(cards.map(card => card.classList.contains('c-mode--on'))).toEqual([false, true]);
      expect(component.filterMode()).toBe('query-bar');
    }));

    it('is not offered with modeSelectable false', fakeAsync(() => {
      setup({ ...SETUP, modeSelectable: false });
      openFilters();
      expect(panel().querySelector('.c-modes')).toBeNull();
      expect(panel().querySelector('.c-filter-row')).not.toBeNull();
    }));
  });

  describe('filter list', () => {
    it('gives each external filter a labelled switch, on while it shows in the panel', fakeAsync(() => {
      setup();
      openFilters();
      const rows = Array.from(panel().querySelectorAll<HTMLElement>('.c-filter-row'));
      expect(rows.map(row => row.dataset['field'])).toEqual(['status', 'createdAt', 'channel', 'area']);
      expect(rowOf('status').querySelector('label')!.textContent!.trim()).toBe('Trạng thái');
      expect(['status', 'channel', 'area'].map(field => switchOf(field).getAttribute('aria-checked'))).toEqual(['true', 'false', 'true']);
      expect(listDesc()).toContain('khung Bộ lọc');
    }));

    it('locks a required filter and says why', fakeAsync(() => {
      setup();
      openFilters();
      expect(switchOf('createdAt').disabled).toBeTrue();
      expect(noteOf('createdAt')).toBe('Bắt buộc');
      expect(switchOf('status').disabled).toBeFalse();
      expect(noteOf('status')).toBe('');
    }));

    it('toggles a filter with its switch', fakeAsync(() => {
      setup();
      openFilters();
      switchOf('channel').click();
      render();
      expect(switchOf('channel').getAttribute('aria-checked')).toBe('true');
      expect(component.inlineExternal()['channel']).toBeTrue();
    }));

    it('on the bar, pins required filters and locks the filters the bar cannot show', fakeAsync(() => {
      setup();
      openFilters();
      radioOf('query-bar')!.click();
      render();
      expect(listDesc()).toContain('nút +');
      expect(switchOf('createdAt').getAttribute('aria-checked')).toBe('true');
      expect(switchOf('area').getAttribute('aria-checked')).toBe('false');
      expect(switchOf('area').disabled).toBeTrue();
      expect(noteOf('area')).toBe('Không có trên thanh');
      expect(switchOf('status').disabled).toBeFalse();
    }));

    it('keeps the panel choice of a filter the bar cannot show', fakeAsync(() => {
      setup();
      openFilters();
      radioOf('query-bar')!.click();
      render();
      radioOf('default')!.click();
      render();
      expect(switchOf('area').getAttribute('aria-checked')).toBe('true');
      expect(switchOf('area').disabled).toBeFalse();
    }));

    it('follows queryBar.pinned on the bar and locks the list', fakeAsync(() => {
      setup({ ...SETUP, pinned: ['channel'] });
      openFilters();
      radioOf('query-bar')!.click();
      render();
      expect(listDesc()).toContain('Ứng dụng');
      expect(switchOf('channel').getAttribute('aria-checked')).toBe('true');
      expect(switchOf('status').getAttribute('aria-checked')).toBe('false');
      expect(switchOf('status').disabled).toBeTrue();
    }));

    it('shows no list without external filters', fakeAsync(() => {
      setup({ ...SETUP, inlineExternal: {}, externalFilters: [] });
      openFilters();
      expect(panel().querySelector('.c-filter-list')).toBeNull();
      expect(panel().querySelector('.c-modes')).not.toBeNull();
    }));
  });

  describe('footer', () => {
    it('Apply sends the changed filter setup, and stores a kind only when it differs from the option', fakeAsync(() => {
      setup();
      openFilters();
      radioOf('query-bar')!.click();
      switchOf('channel').click();
      render();
      component.onSave();
      render();
      expect(applied).toEqual([{ inlineExternal: { status: true, createdAt: true, channel: true, area: true }, mode: 'query-bar' }]);

      fixture.componentRef.setInput('filterSetup', { ...SETUP, storedMode: 'query-bar' });
      openFilters();
      radioOf('default')!.click();
      render();
      component.onSave();
      render();
      expect(applied[1]).toEqual({ inlineExternal: SETUP.inlineExternal, mode: undefined });
    }));

    it('Apply clears a stored kind equal to the option, and sends nothing when nothing changed', fakeAsync(() => {
      setup({ ...SETUP, storedMode: 'default' });
      openFilters();
      component.onSave();
      render();
      expect(applied).toEqual([{ inlineExternal: SETUP.inlineExternal, mode: undefined }]);

      applied = [];
      fixture.componentRef.setInput('filterSetup', SETUP);
      openFilters();
      switchOf('channel').click();
      switchOf('channel').click();
      render();
      component.onSave();
      render();
      expect(applied).toEqual([]);
    }));

    it('Skip drops the filter edits', fakeAsync(() => {
      setup();
      openFilters();
      radioOf('query-bar')!.click();
      switchOf('status').click();
      render();
      component.close();
      render();
      expect(applied).toEqual([]);
      openFilters();
      expect(radioOf('default')!.checked).toBeTrue();
      expect(switchOf('status').getAttribute('aria-checked')).toBe('true');
    }));

    it('leaves the stored kind alone with modeSelectable false', fakeAsync(() => {
      setup({ ...SETUP, modeSelectable: false, storedMode: 'query-bar' });
      openFilters();
      switchOf('channel').click();
      render();
      component.onSave();
      render();
      expect(applied).toEqual([{ inlineExternal: { ...SETUP.inlineExternal, channel: true } }]);
    }));
  });
});
