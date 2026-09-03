import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';

import { SdQueryActionsBar } from './actions-bar.component';

describe('SdQueryActionsBar', () => {
  let fixture: ComponentFixture<SdQueryActionsBar>;
  let component: SdQueryActionsBar;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdQueryActionsBar, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(SdQueryActionsBar);
    component = fixture.componentInstance;
  });

  it('hides AND/OR toggle by default', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.c-logic-toggle')).toBeNull();
  });

  it('shows the AND/OR toggle when showLogicToggle + ≥2 filters', () => {
    fixture.componentRef.setInput('showLogicToggle', true);
    fixture.componentRef.setInput('filtersCount', 3);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.c-logic-toggle')).not.toBeNull();
  });

  it('clicking AND/OR segments sets the logic model', () => {
    fixture.componentRef.setInput('showLogicToggle', true);
    fixture.componentRef.setInput('filtersCount', 2);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.c-logic-segment') as NodeListOf<HTMLButtonElement>;
    buttons[1].click(); // OR
    expect(component.logic()).toBe('OR');
    buttons[0].click(); // AND
    expect(component.logic()).toBe('AND');
  });

  it('clear button emits (clear) and only renders when filtersCount > 0', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.c-clear-all')).toBeNull();
    fixture.componentRef.setInput('filtersCount', 1);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.c-clear-all') as HTMLButtonElement;
    const spy = jasmine.createSpy('clear');
    component.clear.subscribe(spy);
    btn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('search button is disabled until canSearch=true and emits on click', () => {
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.c-search-trigger') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    fixture.componentRef.setInput('canSearch', true);
    fixture.detectChanges();
    expect(btn.disabled).toBe(false);
    const spy = jasmine.createSpy('search');
    component.search.subscribe(spy);
    btn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('savedFilters dropdown only renders when showSavedFilters=true', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('sd-query-saved-filters-menu')).toBeNull();
    fixture.componentRef.setInput('showSavedFilters', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('sd-query-saved-filters-menu')).not.toBeNull();
  });

  // why: saved-filters dropdown phải nằm SÁT NGAY TRƯỚC nút search — gom cụm
  // "filter + submit" về 1 vùng phải. Spec assert DOM order trong .c-query-bar__actions.
  it('places <sd-query-saved-filters-menu> immediately before .c-search-trigger', () => {
    fixture.componentRef.setInput('showSavedFilters', true);
    fixture.detectChanges();
    const search = fixture.nativeElement.querySelector('.c-search-trigger') as HTMLElement;
    const prev = search.previousElementSibling as HTMLElement;
    expect(prev?.tagName.toLowerCase()).toBe('sd-query-saved-filters-menu');
  });

  // why: standalone save-filter button đã bị xóa — footer "Lưu bộ lọc hiện tại"
  // sống trong mat-menu của saved-filters-menu (1 zone: list + save).
  it('does NOT render a standalone .c-save-filter button (footer moved into saved-filters mat-menu)', () => {
    fixture.componentRef.setInput('showSavedFilters', true);
    fixture.componentRef.setInput('savedFiltersKey', 'demo');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.c-save-filter')).toBeNull();
  });

  describe('i18n labels', () => {
    let i18n: I18nService;

    beforeEach(() => {
      i18n = TestBed.inject(I18nService);
      i18n.setLanguage('vi', { reload: false });
    });

    afterEach(() => {
      i18n.setLanguage('vi', { reload: false });
    });

    it('interpolates the filter count into the clear-all tooltip instead of concatenating it', () => {
      fixture.componentRef.setInput('filtersCount', 3);
      fixture.detectChanges();
      expect(component.clearAllLabel()).toBe('Xóa tất cả (3)');

      i18n.setLanguage('en', { reload: false });
      expect(component.clearAllLabel()).toBe('Clear all (3)');
    });

    it('translates the logic-group aria-label and the search tooltip', () => {
      expect(component.logicGroupLabel()).toBe('Toán tử logic');
      expect(component.searchLabel()).toBe('Tìm kiếm');

      i18n.setLanguage('en', { reload: false });
      expect(component.logicGroupLabel()).toBe('Logic operator');
      expect(component.searchLabel()).toBe('Search');
    });

    it('puts the translated aria-label on the rendered AND/OR group', () => {
      fixture.componentRef.setInput('showLogicToggle', true);
      fixture.componentRef.setInput('filtersCount', 2);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.c-logic-toggle').getAttribute('aria-label')).toBe('Toán tử logic');
    });
  });
});
