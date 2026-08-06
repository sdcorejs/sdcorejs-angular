import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
      { id: 'api', label: 'API', commands: ['/api'] },
      { id: 'examples', label: 'Examples', commands: ['/examples'] },
    ]);
    fixture.componentRef.setInput('activeTab', 'overview');
    fixture.detectChanges();
  });

  it('scrolls a newly active tab into the visible strip on narrow screens', async () => {
    const links = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
    const scrollIntoView = spyOn(links[3], 'scrollIntoView');

    fixture.componentRef.setInput('activeTab', 'examples');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
    expect(links[3].getAttribute('aria-current')).toBe('page');
  });
});
