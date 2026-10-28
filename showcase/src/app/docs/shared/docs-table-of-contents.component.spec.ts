import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DOCS_TOC_OFFSET_PX, DocsTableOfContentsComponent } from './docs-table-of-contents.component';

describe('DocsTableOfContentsComponent', () => {
  let fixture: ComponentFixture<DocsTableOfContentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DocsTableOfContentsComponent] }).compileComponents();
    fixture = TestBed.createComponent(DocsTableOfContentsComponent);
    fixture.componentRef.setInput('items', [
      { id: 'inputs', label: 'Inputs', level: 2 },
      { id: 'disabled-input', label: 'disabled', level: 3 },
      { id: 'outputs', label: 'Outputs', level: 2 },
    ]);
    fixture.componentRef.setInput('editUrl', 'https://github.com/sdcorejs/sdcorejs-angular/blob/main/button.md');
    fixture.detectChanges();
  });

  it('indents nested sections inside one flat list', () => {
    const links = [...fixture.nativeElement.querySelectorAll('.toc-link')] as HTMLAnchorElement[];

    expect(links).toHaveSize(3);
    expect(links.map(link => link.getAttribute('data-depth'))).toEqual(['0', '1', '0']);
    expect(links[1].style.paddingLeft).toBe('26px');
  });

  it('marks the selected section as the current location', () => {
    const links = fixture.nativeElement.querySelectorAll('.toc-link') as NodeListOf<HTMLAnchorElement>;
    links[1].click();
    fixture.detectChanges();

    expect(links[1].getAttribute('aria-current')).toBe('location');
    expect(links[0].getAttribute('aria-current')).toBeNull();
  });

  it('spies the section that passed the 124px offset', () => {
    const target = document.createElement('section');
    target.id = 'outputs';
    spyOn(target, 'getBoundingClientRect').and.returnValue({ top: DOCS_TOC_OFFSET_PX } as DOMRect);
    document.body.appendChild(target);

    fixture.componentInstance.updateActiveSection();
    fixture.detectChanges();

    const active = fixture.nativeElement.querySelector('[aria-current="location"]') as HTMLAnchorElement;
    expect(active?.getAttribute('href')).toContain('#outputs');
    target.remove();
  });

  it('offers edit, report and back-to-top links', () => {
    const labels = [...fixture.nativeElement.querySelectorAll('.toc__links a')].map((link: Element) => link.textContent?.trim());

    expect(labels).toEqual(['editEdit this page on GitHub', 'bug_reportReport an issue', 'arrow_upwardBack to top']);
    const external = fixture.nativeElement.querySelector('.toc__links a[target="_blank"]') as HTMLAnchorElement;
    expect(external.rel).toContain('noopener');
  });
});
