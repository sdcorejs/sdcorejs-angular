import { TestBed } from '@angular/core/testing';
import { DOC_PAGES } from '../core/documentation.registry';
import { DocsApiSummaryComponent } from './docs-api-summary.component';

describe('DocsApiSummaryComponent', () => {
  it('deduplicates canonical identity fields and removes inline Markdown delimiters', async () => {
    await TestBed.configureTestingModule({ imports: [DocsApiSummaryComponent] }).compileComponents();
    const fixture = TestBed.createComponent(DocsApiSummaryComponent);
    const page = DOC_PAGES.find((entry) => entry.slug === 'button');
    expect(page).toBeDefined();
    if (!page) return;

    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('metadata', [
      ['Selector', '`sd-button`'],
      ['Import path', '`@sdcorejs/angular/components/button`'],
      ['Type', '**Component**'],
    ]);
    fixture.detectChanges();

    const rows = [...fixture.nativeElement.querySelectorAll('.api-summary > div')] as HTMLElement[];
    expect(rows).toHaveSize(3);
    expect(rows.map((row) => row.textContent)).toEqual([
      jasmine.stringContaining('Selector'),
      jasmine.stringContaining('Import path'),
      jasmine.stringContaining('TypeComponent'),
    ]);
    expect(fixture.nativeElement.textContent).not.toContain('`');
    expect(fixture.nativeElement.textContent).not.toContain('**');
  });
});
