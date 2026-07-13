import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { DocsVersionService } from '../core/docs-version.service';
import { PublishedDocsService } from '../core/published-docs.service';
import { GlobalSearchComponent } from './global-search.component';

describe('GlobalSearchComponent', () => {
  let fixture: ComponentFixture<GlobalSearchComponent>;
  let router: { navigate: jasmine.Spy };
  let selectedVersion: WritableSignal<string | null>;
  let loadIndex: jasmine.Spy;

  beforeEach(async () => {
    router = { navigate: jasmine.createSpy().and.resolveTo(true) };
    selectedVersion = signal<string | null>('21.1.2');
    loadIndex = jasmine.createSpy().and.resolveTo({ docs: [] });
    await TestBed.configureTestingModule({
      imports: [GlobalSearchComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: DocsVersionService, useValue: { selectedVersion } },
        { provide: PublishedDocsService, useValue: { loadIndex } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(GlobalSearchComponent);
    fixture.detectChanges();
  });

  it('opens with the slash shortcut and closes on Escape', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('searches the registry and exposes keyboard-navigable results', () => {
    fixture.componentInstance.openSearch();
    fixture.componentInstance.query.set('button');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('[role="option"]').length).toBeGreaterThan(0);
  });

  it('gives the combobox and categorized result groups accessible names', () => {
    fixture.componentInstance.openSearch();
    fixture.componentInstance.query.set('form');
    fixture.detectChanges();

    const combobox = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLElement;
    const groups = [...fixture.nativeElement.querySelectorAll('[role="group"]')] as HTMLElement[];
    expect(combobox.getAttribute('aria-label')).toBe('Search documentation');
    expect(groups.length).toBeGreaterThan(1);
    for (const group of groups) {
      const labelId = group.getAttribute('aria-labelledby');
      expect(labelId).toBeTruthy();
      expect(group.querySelector(`#${labelId}`)?.textContent?.trim()).toBeTruthy();
    }
  });

  it('highlights the matched selector, import path, keyword, example, and published title metadata', () => {
    fixture.componentInstance.openSearch();
    fixture.componentInstance.publishedTitles.set(new Map([
      ['components/button/sd-button', 'Action primitive reference'],
    ]));

    const cases = [
      { query: 'sd-button', title: 'Button', label: 'Selector:', match: 'sd-button' },
      { query: 'components/button', title: 'Button', label: 'Import path:', match: 'components/button' },
      { query: 'bulk action', title: 'Quick Action', label: 'Keyword:', match: 'bulk action' },
      { query: 'secondary vs black', title: 'Button', label: 'Example:', match: 'secondary vs black' },
      { query: 'primitive reference', title: 'Button', label: 'Published title:', match: 'primitive reference' },
      { query: 'kich thuoc', title: 'Button', label: 'Example:', match: 'kích thước' },
    ] as const;

    for (const testCase of cases) {
      fixture.componentInstance.query.set(testCase.query);
      fixture.detectChanges();
      const option = ([...fixture.nativeElement.querySelectorAll('[role="option"]')] as HTMLElement[])
        .find((element) => element.querySelector('.search-result__title')?.textContent?.trim() === testCase.title);
      const metadata = option?.querySelector('.search-result__meta');

      expect(option).withContext(`result for ${testCase.query}`).toBeDefined();
      expect(metadata?.querySelector('.search-result__meta-label')?.textContent?.trim())
        .withContext(`metadata label for ${testCase.query}`).toBe(testCase.label);
      expect(metadata?.querySelector('mark')?.textContent?.toLocaleLowerCase())
        .withContext(`highlight for ${testCase.query}`).toBe(testCase.match);
    }
  });

  it('opens the same result that is visually active after grouped keyboard navigation', () => {
    fixture.componentInstance.openSearch();
    fixture.componentInstance.query.set('input');
    fixture.detectChanges();
    const visibleResults = fixture.componentInstance.groupedResults().flatMap((group) => group.results);
    const active = visibleResults[4];
    expect(active).toBeDefined();
    fixture.componentInstance.activeIndex.set(active?.index ?? 0);

    fixture.componentInstance.openActive(new Event('keydown'));

    expect(router.navigate).toHaveBeenCalledWith(
      ['/v', '21.1.2', active?.result.page.category, active?.result.page.slug, 'overview'],
      { fragment: undefined },
    );
  });

  it('navigates an example-title match to the exact example anchor', () => {
    fixture.componentInstance.query.set('secondary vs black');
    const result = fixture.componentInstance.flatResults()[0];
    expect(result).toBeDefined();

    if (result) fixture.componentInstance.navigate(result);

    expect(router.navigate).toHaveBeenCalledWith(
      ['/v', '21.1.2', 'components', 'button', 'examples'],
      { fragment: 'components-button-example-secondary-vs-black' },
    );
  });

  it('uses accent-insensitive matching when selecting the exact example anchor', () => {
    fixture.componentInstance.query.set('mau sac icon');
    const result = fixture.componentInstance.flatResults().find((entry) => entry.page.slug === 'badge');
    const matchedExample = result?.page.examples.find((example) => example.title === 'Màu sắc icon');
    expect(matchedExample).toBeDefined();

    if (result) fixture.componentInstance.navigate(result);

    expect(router.navigate).toHaveBeenCalledWith(
      ['/v', '21.1.2', 'components', 'badge', 'examples'],
      { fragment: matchedExample?.id },
    );
  });

  it('ignores an older published index that resolves after a newer version', async () => {
    const resolvers = new Map<string, (value: { docs: Array<{ id: string; title: string }> }) => void>();
    loadIndex.and.callFake((version: string) => new Promise((resolve) => resolvers.set(version, resolve)));

    selectedVersion.set('20.1.2');
    fixture.detectChanges();
    selectedVersion.set('19.1.2');
    fixture.detectChanges();

    resolvers.get('19.1.2')?.({ docs: [{ id: 'current', title: 'Current title' }] });
    await Promise.resolve();
    expect(fixture.componentInstance.publishedTitles().get('current')).toBe('Current title');

    resolvers.get('20.1.2')?.({ docs: [{ id: 'stale', title: 'Stale title' }] });
    await Promise.resolve();
    expect(fixture.componentInstance.publishedTitles().has('stale')).toBeFalse();
  });
});
