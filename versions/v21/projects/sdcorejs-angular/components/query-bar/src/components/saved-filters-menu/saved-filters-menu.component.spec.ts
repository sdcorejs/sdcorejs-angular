import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SdQuerySavedFiltersMenu } from './saved-filters-menu.component';
import { SdQuery, SdSavedFilter } from '../../query-bar.model';

describe('SdQuerySavedFiltersMenu', () => {
  let fixture: ComponentFixture<SdQuerySavedFiltersMenu>;
  let component: SdQuerySavedFiltersMenu;

  const STORAGE = 'sd-query-bar:savedFilters:test';

  beforeEach(async () => {
    localStorage.removeItem(STORAGE);
    await TestBed.configureTestingModule({
      imports: [SdQuerySavedFiltersMenu, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(SdQuerySavedFiltersMenu);
    component = fixture.componentInstance;
  });

  afterEach(() => localStorage.removeItem(STORAGE));

  it('loads existing filters from localStorage when key is set', () => {
    const seed: SdSavedFilter[] = [{ id: 'a', name: 'A', query: { filters: [], logic: 'AND' } }];
    localStorage.setItem(STORAGE, JSON.stringify(seed));
    fixture.componentRef.setInput('key', 'test');
    fixture.detectChanges();

    expect(component.savedFilters()).toEqual(seed);
  });

  it('renders disabled trigger + empty list when no key is passed', () => {
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.c-saved-filters') as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
    expect(component.savedFilters()).toEqual([]);
  });

  it('promptSave appends a filter, persists it, and uses the current [query]', () => {
    const q: SdQuery = { filters: [{ field: 'x', operator: 'EQUAL', data: 1 } as any], logic: 'OR' };
    fixture.componentRef.setInput('key', 'test');
    fixture.componentRef.setInput('query', q);
    fixture.detectChanges();
    spyOn(window, 'prompt').and.returnValue('Filter 1');

    component.promptSave();

    expect(component.savedFilters().length).toBe(1);
    expect(component.savedFilters()[0].name).toBe('Filter 1');
    expect(component.savedFilters()[0].query).toEqual(q);
    expect(JSON.parse(localStorage.getItem(STORAGE)!).length).toBe(1);
  });

  it('promptSave with a blank/cancelled name does nothing', () => {
    fixture.componentRef.setInput('key', 'test');
    fixture.detectChanges();
    spyOn(window, 'prompt').and.returnValue(null);
    component.promptSave();
    expect(component.savedFilters()).toEqual([]);
  });

  it('remove deletes by id and persists the new list', () => {
    const seed: SdSavedFilter[] = [
      { id: 'a', name: 'A', query: { filters: [], logic: 'AND' } },
      { id: 'b', name: 'B', query: { filters: [], logic: 'AND' } },
    ];
    localStorage.setItem(STORAGE, JSON.stringify(seed));
    fixture.componentRef.setInput('key', 'test');
    fixture.detectChanges();

    component.remove('a');

    expect(component.savedFilters().map(f => f.id)).toEqual(['b']);
    expect(JSON.parse(localStorage.getItem(STORAGE)!).map((f: SdSavedFilter) => f.id)).toEqual(['b']);
  });

  it('pick emits (apply) with the chosen filter', () => {
    const filter: SdSavedFilter = { id: 'a', name: 'A', query: { filters: [], logic: 'AND' } };
    fixture.componentRef.setInput('key', 'test');
    fixture.detectChanges();
    const spy = jasmine.createSpy('apply');
    component.apply.subscribe(spy);

    component.pick(filter);

    expect(spy).toHaveBeenCalledWith(filter);
  });

  // why: footer "Lưu bộ lọc hiện tại" sống trong mat-menu (overlay). Mở menu
  // qua MatMenuTrigger để DOM render vào cdk-overlay-container rồi assert.
  it('renders footer "Lưu bộ lọc hiện tại" inside the mat-menu when key is set', () => {
    fixture.componentRef.setInput('key', 'test');
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.c-saved-filters') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    const save = document.querySelector('.c-saved-filters-menu .c-sf-save') as HTMLButtonElement;
    expect(save).not.toBeNull();
    expect(save.textContent).toContain('Lưu bộ lọc hiện tại');
  });

  it('footer save button is disabled when no key is set', () => {
    fixture.detectChanges();
    // why: nút trigger disabled khi !key → user không mở được dropdown để bấm
    // footer. Đó cũng là invariant: footer chỉ usable khi storage key có.
    const trigger = fixture.nativeElement.querySelector('.c-saved-filters') as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
  });

  it('clicking footer save calls promptSave', () => {
    fixture.componentRef.setInput('key', 'test');
    fixture.detectChanges();
    spyOn(window, 'prompt').and.returnValue(null);
    const spy = spyOn(component, 'promptSave').and.callThrough();
    (fixture.nativeElement.querySelector('.c-saved-filters') as HTMLButtonElement).click();
    fixture.detectChanges();
    const save = document.querySelector('.c-saved-filters-menu .c-sf-save') as HTMLButtonElement;
    save.click();
    expect(spy).toHaveBeenCalled();
  });

  // why: bug "× không sát mép phải, lệch baseline". Fix: force flex vào
  // `.mat-mdc-menu-item-text` (default chỉ flex:1 không display:flex →
  // margin-left:auto không đẩy được × sang phải). Spec assert sau khi mở
  // menu, × button có margin-left tự động đẩy về cuối row.
  it('positions .c-sf-del at the right end of the row (margin-left: auto pushes × flush right)', () => {
    const seed: SdSavedFilter[] = [{ id: 'a', name: '212', query: { filters: [], logic: 'AND' } }];
    localStorage.setItem(STORAGE, JSON.stringify(seed));
    fixture.componentRef.setInput('key', 'test');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.c-saved-filters') as HTMLButtonElement).click();
    fixture.detectChanges();

    const row = document.querySelector('.c-saved-filters-menu .c-sf-row') as HTMLElement;
    const del = row.querySelector('.c-sf-del') as HTMLElement;
    const name = row.querySelector('.c-sf-name') as HTMLElement;
    expect(row).not.toBeNull();
    expect(del).not.toBeNull();

    // why: row.right - del.right phải ≤ row's padding-right (4px) → del flush.
    // name.right < del.left → có spacing, không dính nhau.
    const rRect = row.getBoundingClientRect();
    const dRect = del.getBoundingClientRect();
    const nRect = name.getBoundingClientRect();
    expect(rRect.right - dRect.right).toBeLessThanOrEqual(8);
    expect(dRect.left).toBeGreaterThan(nRect.right);
  });

  // why: bug "× lệch trong vòng tròn hover" do base CSS mat-menu-item đặt
  // `margin-right: 12px` lên mọi .mat-icon → leak vào × icon trong .c-sf-del,
  // đẩy glyph sang trái. Spec assert mat-icon BÊN TRONG .c-sf-del có centerX
  // trùng với centerX của .c-sf-del wrapper (sai số ≤ 1px).
  it('centers × icon inside the .c-sf-del circle (no leaked margin-right from mat-menu-item base)', () => {
    const seed: SdSavedFilter[] = [{ id: 'a', name: 'fdfg', query: { filters: [], logic: 'AND' } }];
    localStorage.setItem(STORAGE, JSON.stringify(seed));
    fixture.componentRef.setInput('key', 'test');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.c-saved-filters') as HTMLButtonElement).click();
    fixture.detectChanges();

    const del = document.querySelector('.c-saved-filters-menu .c-sf-del') as HTMLElement;
    const icon = del.querySelector('mat-icon') as HTMLElement;
    const dRect = del.getBoundingClientRect();
    const iRect = icon.getBoundingClientRect();
    const dCx = dRect.left + dRect.width / 2;
    const iCx = iRect.left + iRect.width / 2;
    expect(Math.abs(dCx - iCx)).toBeLessThanOrEqual(1);
    // margin-right phải bị reset → no leaked spacing
    expect(getComputedStyle(icon).marginRight).toBe('0px');
  });

  // why: leading icon + name + × phải cùng vertical-center. Assert centerY của
  // 3 element gần bằng nhau (sai số ≤ 2px do font baseline).
  it('aligns leading icon + name + × on the same vertical center line', () => {
    const seed: SdSavedFilter[] = [{ id: 'a', name: 'fdfg', query: { filters: [], logic: 'AND' } }];
    localStorage.setItem(STORAGE, JSON.stringify(seed));
    fixture.componentRef.setInput('key', 'test');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.c-saved-filters') as HTMLButtonElement).click();
    fixture.detectChanges();

    const row = document.querySelector('.c-saved-filters-menu .c-sf-row') as HTMLElement;
    const lead = row.querySelector('.c-sf-lead') as HTMLElement;
    const name = row.querySelector('.c-sf-name') as HTMLElement;
    const del = row.querySelector('.c-sf-del') as HTMLElement;

    const cy = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; };
    expect(Math.abs(cy(lead) - cy(name))).toBeLessThanOrEqual(2);
    expect(Math.abs(cy(name) - cy(del))).toBeLessThanOrEqual(2);
  });
});
