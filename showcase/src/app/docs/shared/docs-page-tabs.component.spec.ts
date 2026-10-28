import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { DocsPageTabsComponent } from './docs-page-tabs.component';

describe('DocsPageTabsComponent', () => {
  let fixture: ComponentFixture<DocsPageTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocsPageTabsComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(DocsPageTabsComponent);
    fixture.componentRef.setInput('links', [
      { id: 'overview', label: 'Overview', commands: ['/overview'] },
      { id: 'styling', label: 'Styling', commands: ['/styling'] },
      { id: 'api', label: 'API', commands: ['/api'], count: 33 },
      { id: 'examples', label: 'Examples', commands: ['/examples'], count: 5 },
    ]);
    fixture.componentRef.setInput('activeTab', 'overview');
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => fixture.nativeElement.remove());

  it('shows counts in mono pills and marks the active tab', () => {
    const links = [...fixture.nativeElement.querySelectorAll('a')] as HTMLAnchorElement[];

    expect(links.map(link => link.querySelector('.docs-tabs__count')?.textContent ?? null)).toEqual([null, null, '33', '5']);
    expect(links[0].getAttribute('aria-current')).toBe('page');
  });

  it('sticks under the header', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(getComputedStyle(host).position).toBe('sticky');
  });

  it('reveals a newly active tab inside the strip without scrolling the page', async () => {
    const strip = fixture.nativeElement.querySelector('.docs-tabs') as HTMLElement;
    strip.style.width = '120px';
    const pageScroll = window.scrollY;

    fixture.componentRef.setInput('activeTab', 'examples');
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();

    const examples = fixture.nativeElement.querySelectorAll('a')[3] as HTMLAnchorElement;
    expect(examples.getAttribute('aria-current')).toBe('page');
    expect(strip.scrollLeft).toBeGreaterThan(0);
    expect(window.scrollY).toBe(pageScroll);
  });

  it('reports the selected tab before navigation', () => {
    const selected: string[] = [];
    spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    fixture.componentInstance.tabSelected.subscribe(tab => selected.push(tab));

    (fixture.nativeElement.querySelectorAll('a')[2] as HTMLAnchorElement).click();

    expect(selected).toEqual(['api']);
  });
});
