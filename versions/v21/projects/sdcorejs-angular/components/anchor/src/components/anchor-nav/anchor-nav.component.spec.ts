import { signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AnchorNav } from './anchor-nav.component';
import { SdAnchorItem } from '../anchor-item/anchor-item.component';

// AnchorNav.sections() chỉ truy cập section.id + section.title()/.icon()/.key().
// Đủ để dùng plain signal-shaped object, ép kiểu qua `as unknown as SdAnchorItem`.
function makeSection(id: string, title: string, icon?: string, key?: string): SdAnchorItem {
  return {
    id,
    title: signal(title),
    icon: signal(icon),
    key: signal(key),
    elementRef: { nativeElement: document.createElement('div') },
  } as unknown as SdAnchorItem;
}

describe('AnchorNav', () => {
  let fixture: ComponentFixture<AnchorNav>;
  let component: AnchorNav;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AnchorNav, NoopAnimationsModule] });
    fixture = TestBed.createComponent(AnchorNav);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('sections', [
      makeSection('s1', 'Section A'),
      makeSection('s2', 'Section B', 'home'),
      makeSection('s3', 'Section C'),
    ]);
    fixture.detectChanges();
  });

  describe('creation', () => {
    it('creates the component', () => {
      expect(component).toBeTruthy();
    });

    it('renders one .c-anchor-list-item per section', () => {
      const rows = fixture.nativeElement.querySelectorAll('.c-anchor-list-item');
      expect(rows.length).toBe(3);
    });

    it('renders section titles in order', () => {
      const nodes = (fixture.nativeElement as HTMLElement).querySelectorAll('.c-anchor-list-item-text');
      const texts = Array.from(nodes).map(el => (el as HTMLElement).textContent?.trim());
      expect(texts).toEqual(['Section A', 'Section B', 'Section C']);
    });

    it('renders icon only when section.icon() is set', () => {
      const icons = fixture.nativeElement.querySelectorAll('sd-icon.c-anchor-list-item-icon');
      expect(icons.length).toBe(1);
      expect(icons[0].textContent?.trim()).toBe('home');
    });
  });

  describe('inputs / defaults', () => {
    it('activeSectionId defaults to empty string', () => {
      expect(component.activeSectionId()).toBe('');
    });

    it('ellipsis defaults to false', () => {
      expect(component.ellipsis()).toBe(false);
      const text = fixture.nativeElement.querySelector('.c-anchor-list-item-text');
      expect(text.classList.contains('ellipsis')).toBe(false);
    });

    it('sidebarWidth defaults to empty string', () => {
      expect(component.sidebarWidth()).toBe('');
    });

    it('color defaults to "primary"', () => {
      expect(component.color()).toBe('primary');
    });

    it('parentAutoId defaults to undefined', () => {
      expect(component.parentAutoId()).toBeUndefined();
    });

    it('applies sidebarWidth as inline style.width on the list', () => {
      fixture.componentRef.setInput('sidebarWidth', '250px');
      fixture.detectChanges();
      const list = fixture.nativeElement.querySelector('.c-anchor-list') as HTMLElement;
      expect(list.style.width).toBe('250px');
    });

    it('applies ellipsis class to item-text when ellipsis=true', () => {
      fixture.componentRef.setInput('ellipsis', true);
      fixture.detectChanges();
      const texts = fixture.nativeElement.querySelectorAll('.c-anchor-list-item-text');
      texts.forEach((t: HTMLElement) => expect(t.classList.contains('ellipsis')).toBe(true));
    });
  });

  describe('active section', () => {
    it('marks item with id === activeSectionId() as .active', () => {
      fixture.componentRef.setInput('activeSectionId', 's2');
      fixture.detectChanges();
      const rows = fixture.nativeElement.querySelectorAll('.c-anchor-list-item');
      expect(rows[0].classList.contains('active')).toBe(false);
      expect(rows[1].classList.contains('active')).toBe(true);
      expect(rows[2].classList.contains('active')).toBe(false);
    });

    it('updates active class when activeSectionId changes', () => {
      fixture.componentRef.setInput('activeSectionId', 's1');
      fixture.detectChanges();
      let rows = fixture.nativeElement.querySelectorAll('.c-anchor-list-item');
      expect(rows[0].classList.contains('active')).toBe(true);

      fixture.componentRef.setInput('activeSectionId', 's3');
      fixture.detectChanges();
      rows = fixture.nativeElement.querySelectorAll('.c-anchor-list-item');
      expect(rows[0].classList.contains('active')).toBe(false);
      expect(rows[2].classList.contains('active')).toBe(true);
    });
  });

  describe('cssActiveVar (color → --sd-{color})', () => {
    it('emits "var(--sd-primary)" by default', () => {
      expect(component.cssActiveVar()).toBe('var(--sd-primary)');
    });

    it('reflects custom color', () => {
      fixture.componentRef.setInput('color', 'success');
      fixture.detectChanges();
      expect(component.cssActiveVar()).toBe('var(--sd-success)');
    });

    it('binds the CSS custom property --anchor-active-color on the list element', () => {
      fixture.componentRef.setInput('color', 'warning');
      fixture.detectChanges();
      const list = fixture.nativeElement.querySelector('.c-anchor-list') as HTMLElement;
      expect(list.style.getPropertyValue('--anchor-active-color')).toBe('var(--sd-warning)');
    });
  });

  describe('itemAutoId()', () => {
    it('returns undefined when parentAutoId is not set', () => {
      const sec = makeSection('x', 'X', undefined, 'kx');
      expect(component.itemAutoId(sec)).toBeUndefined();
    });

    it('returns undefined when section.key() is empty', () => {
      const sec = makeSection('x', 'X');
      fixture.componentRef.setInput('parentAutoId', 'parent');
      expect(component.itemAutoId(sec)).toBeUndefined();
    });

    it('returns "{parentAutoId}-{section.key()}" when both are set', () => {
      const sec = makeSection('x', 'X', undefined, 'kx');
      fixture.componentRef.setInput('parentAutoId', 'parent');
      expect(component.itemAutoId(sec)).toBe('parent-kx');
    });

    it('writes data-autoId attribute on rows when both parentAutoId + section.key() are present', () => {
      fixture.componentRef.setInput('sections', [
        makeSection('s1', 'A', undefined, 'k1'),
        makeSection('s2', 'B', undefined, undefined), // no key → no autoId
        makeSection('s3', 'C', undefined, 'k3'),
      ]);
      fixture.componentRef.setInput('parentAutoId', 'nav');
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.c-anchor-list-item');
      expect(rows[0].getAttribute('data-autoId')).toBe('nav-k1');
      expect(rows[1].hasAttribute('data-autoId')).toBe(false);
      expect(rows[2].getAttribute('data-autoId')).toBe('nav-k3');
    });
  });

  describe('clickSection (debounced)', () => {
    it('emits clicked id after the 200ms debounce', fakeAsync(() => {
      const spy = jasmine.createSpy('clickSection');
      component.sdClickSection.subscribe(spy);

      component.onClickSection('s1');
      expect(spy).not.toHaveBeenCalled();

      tick(200);
      expect(spy).toHaveBeenCalledOnceWith('s1');
    }));

    it('debounces rapid clicks — only the last id within window is emitted', fakeAsync(() => {
      const spy = jasmine.createSpy('clickSection');
      component.sdClickSection.subscribe(spy);

      component.onClickSection('s1');
      tick(50);
      component.onClickSection('s2');
      tick(50);
      component.onClickSection('s3');
      tick(200);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('s3');
    }));

    it('fires from click on .c-anchor-list-item', fakeAsync(() => {
      const spy = jasmine.createSpy('clickSection');
      component.sdClickSection.subscribe(spy);

      const rows = fixture.nativeElement.querySelectorAll('.c-anchor-list-item');
      (rows[1] as HTMLElement).click();
      tick(200);

      expect(spy).toHaveBeenCalledWith('s2');
    }));

    it('fires from keydown.enter on .c-anchor-list-item', fakeAsync(() => {
      const spy = jasmine.createSpy('clickSection');
      component.sdClickSection.subscribe(spy);

      const rows = fixture.nativeElement.querySelectorAll('.c-anchor-list-item');
      const evt = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      (rows[2] as HTMLElement).dispatchEvent(evt);
      tick(200);

      expect(spy).toHaveBeenCalledWith('s3');
    }));
  });

  describe('ngOnDestroy', () => {
    it('unsubscribes — no emission fires after destroy', fakeAsync(() => {
      const spy = jasmine.createSpy('clickSection');
      component.sdClickSection.subscribe(spy);

      component.onClickSection('s1');
      fixture.destroy();
      tick(300);

      expect(spy).not.toHaveBeenCalled();
    }));

    it('destroys cleanly', () => {
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});
