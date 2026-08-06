import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocsTableOfContentsComponent } from './docs-table-of-contents.component';

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
    fixture.detectChanges();
  });

  it('renders nested sections with a visible hierarchy', () => {
    const links = fixture.nativeElement.querySelectorAll('.toc-link');

    expect(links).toHaveSize(3);
    expect(links[0].getAttribute('data-depth')).toBe('0');
    expect(links[1].getAttribute('data-depth')).toBe('1');
    expect(fixture.nativeElement.querySelector('.toc > ol > li > ol .toc-link')?.textContent).toContain('disabled');
    expect(fixture.nativeElement.querySelectorAll('.toc > ol > li')).toHaveSize(2);
  });

  it('marks the selected section as the current location', () => {
    const links = fixture.nativeElement.querySelectorAll('.toc-link') as NodeListOf<HTMLAnchorElement>;
    links[1].click();
    fixture.detectChanges();

    expect(links[1].getAttribute('aria-current')).toBe('location');
    expect(links[0].getAttribute('aria-current')).toBeNull();
  });

  it('updates the current location while the document scrolls', () => {
    const target = document.createElement('section');
    target.id = 'outputs';
    spyOn(target, 'getBoundingClientRect').and.returnValue({ top: 80 } as DOMRect);
    document.body.appendChild(target);

    document.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    const active = fixture.nativeElement.querySelector('[aria-current="location"]') as HTMLAnchorElement;
    expect(active?.getAttribute('href')).toContain('#outputs');
    target.remove();
  });
});
