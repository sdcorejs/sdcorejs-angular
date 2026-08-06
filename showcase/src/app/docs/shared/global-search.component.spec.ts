import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { DocsVersionService } from '../core/docs-version.service';
import { DOC_PAGES } from '../core/documentation.registry';
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
    loadIndex = jasmine.createSpy().and.resolveTo({
      docs: DOC_PAGES.filter(page => page.publishedDocId).map(page => ({ id: page.publishedDocId, title: page.title })),
    });
    await TestBed.configureTestingModule({
      imports: [GlobalSearchComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: DocsVersionService, useValue: { selectedVersion } },
        { provide: PublishedDocsService, useValue: { loadIndex } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(GlobalSearchComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.nativeElement.remove();
    fixture.destroy();
  });

  it('moves focus into the search input after the conditional dialog has rendered', async () => {
    const trigger = fixture.nativeElement.querySelector('.search-trigger') as HTMLButtonElement;
    trigger.focus();

    fixture.componentInstance.openSearch();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('input[type="search"]'));
  });

  it('traps Tab inside the dialog even when focus starts outside it', async () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    fixture.componentInstance.openSearch();
    fixture.detectChanges();
    await fixture.whenStable();
    outside.focus();

    const tab = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    fixture.componentInstance.onGlobalKeydown(tab);

    expect(tab.defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('input[type="search"]'));
    outside.remove();
  });

  it('restores the opener after a normal close', async () => {
    const trigger = fixture.nativeElement.querySelector('.search-trigger') as HTMLButtonElement;
    trigger.focus();
    fixture.componentInstance.openSearch();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.closeSearch();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(trigger);
  });

  it('restores the opener only after its inert state has been rendered away', fakeAsync(() => {
    const trigger = fixture.nativeElement.querySelector('.search-trigger') as HTMLButtonElement;
    trigger.focus();
    fixture.componentInstance.openSearch();
    fixture.detectChanges();
    flushMicrotasks();

    const nativeFocus = trigger.focus.bind(trigger);
    let inertWhenFocused: boolean | undefined;
    const restoreFocus = spyOn(trigger, 'focus').and.callFake(() => {
      inertWhenFocused = Boolean(trigger.closest('[inert]'));
      nativeFocus();
    });

    fixture.componentInstance.closeSearch();
    flushMicrotasks();

    expect(trigger.hasAttribute('inert')).toBeTrue();
    expect(restoreFocus).not.toHaveBeenCalled();

    fixture.detectChanges();
    flushMicrotasks();
    tick();

    expect(restoreFocus).toHaveBeenCalledTimes(1);
    expect(inertWhenFocused).toBeFalse();
  }));

  it('uses Material search icons instead of a text glyph', () => {
    const trigger = fixture.nativeElement.querySelector('.search-trigger') as HTMLButtonElement;
    const triggerIcon = trigger.querySelector('mat-icon');

    expect(triggerIcon?.textContent?.trim()).toBe('search');
    expect(trigger.textContent).not.toContain('⌕');

    fixture.componentInstance.openSearch();
    fixture.detectChanges();

    const dialogIcon = fixture.nativeElement.querySelector('.search-dialog__field > mat-icon');
    expect(dialogIcon?.textContent?.trim()).toBe('search');
    expect(fixture.nativeElement.textContent).not.toContain('⌕');
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

  it('uses aria-activedescendant without putting result options in the Tab order', () => {
    fixture.componentInstance.openSearch();
    fixture.componentInstance.query.set('button');
    fixture.detectChanges();

    const combobox = fixture.nativeElement.querySelector('[role="combobox"]') as HTMLInputElement;
    const options = [...fixture.nativeElement.querySelectorAll('[role="option"]')] as HTMLElement[];

    expect(options.length).toBeGreaterThan(0);
    expect(combobox.getAttribute('aria-activedescendant')).toBe(options[0].id);
    expect(options.every(option => option.getAttribute('tabindex') === '-1')).toBeTrue();
  });

  it('announces the result count and no-results state through a polite live region', () => {
    fixture.componentInstance.openSearch();
    fixture.componentInstance.query.set('button');
    fixture.detectChanges();

    const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    const resultCount = fixture.nativeElement.querySelectorAll('[role="option"]').length;
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.getAttribute('aria-atomic')).toBe('true');
    expect(status.textContent?.trim()).toBe(`${resultCount} documentation ${resultCount === 1 ? 'result' : 'results'}.`);

    fixture.componentInstance.query.set('no-such-documentation-result');
    fixture.detectChanges();

    expect(status.textContent?.trim()).toBe('No documentation results.');
  });

  it('excludes pages that are not published for the selected documentation version', () => {
    fixture.componentInstance.publishedDocIds.set(new Set());
    fixture.componentInstance.query.set('button');
    fixture.detectChanges();

    const titles = [...fixture.nativeElement.querySelectorAll('.search-result__title')].map((element: Element) =>
      element.textContent?.trim()
    );
    expect(titles).not.toContain('Button');
  });

  it('uses at least a 44px search action target', () => {
    const trigger = fixture.nativeElement.querySelector('.search-trigger') as HTMLButtonElement;
    expect(trigger.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
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
    fixture.componentInstance.publishedTitles.set(new Map([['components/button/sd-button', 'Action primitive reference']]));

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
      const option = ([...fixture.nativeElement.querySelectorAll('[role="option"]')] as HTMLElement[]).find(
        element => element.querySelector('.search-result__title')?.textContent?.trim() === testCase.title
      );
      const metadata = option?.querySelector('.search-result__meta');

      expect(option).withContext(`result for ${testCase.query}`).toBeDefined();
      expect(metadata?.querySelector('.search-result__meta-label')?.textContent?.trim())
        .withContext(`metadata label for ${testCase.query}`)
        .toBe(testCase.label);
      expect(metadata?.querySelector('mark')?.textContent?.toLocaleLowerCase())
        .withContext(`highlight for ${testCase.query}`)
        .toBe(testCase.match);
    }
  });

  it('opens the same result that is visually active after grouped keyboard navigation', () => {
    fixture.componentInstance.openSearch();
    fixture.componentInstance.query.set('input');
    fixture.detectChanges();
    const visibleResults = fixture.componentInstance.groupedResults().flatMap(group => group.results);
    const active = visibleResults[4];
    expect(active).toBeDefined();
    fixture.componentInstance.activeIndex.set(active?.index ?? 0);

    fixture.componentInstance.openActive(new Event('keydown'));

    expect(router.navigate).toHaveBeenCalledWith(['/v', '21.1.2', active?.result.page.category, active?.result.page.slug, 'overview'], {
      fragment: undefined,
    });
  });

  it('navigates an example-title match to the exact example anchor', () => {
    const trigger = fixture.nativeElement.querySelector('.search-trigger') as HTMLButtonElement;
    const restoreFocus = spyOn(trigger, 'focus');
    fixture.componentInstance.openSearch();
    fixture.detectChanges();
    fixture.componentInstance.query.set('secondary vs black');
    const result = fixture.componentInstance.flatResults()[0];
    expect(result).toBeDefined();

    if (result) fixture.componentInstance.navigate(result);

    expect(router.navigate).toHaveBeenCalledWith(['/v', '21.1.2', 'components', 'button', 'examples'], {
      fragment: 'components-button-example-secondary-vs-black',
    });
    expect(restoreFocus).not.toHaveBeenCalled();
  });

  it('opens Overview when a title match also appears incidentally in example metadata', () => {
    fixture.componentInstance.query.set('tree');
    const result = fixture.componentInstance.flatResults().find(entry => entry.page.slug === 'tree');
    expect(result?.matchedFields).toContain('title');
    expect(result?.matchedFields).toContain('examples');

    if (result) fixture.componentInstance.navigate(result);

    expect(router.navigate).toHaveBeenCalledWith(['/v', '21.1.2', 'components', 'tree', 'overview'], { fragment: undefined });
  });

  it('routes a historical live-demo-only result directly to its current Examples tab', () => {
    fixture.componentInstance.openSearch();
    fixture.componentInstance.publishedDocIds.set(new Set());
    fixture.componentInstance.query.set('org chart');
    fixture.detectChanges();
    const option = ([...fixture.nativeElement.querySelectorAll('[role="option"]')] as HTMLElement[]).find(
      element => element.querySelector('.search-result__title')?.textContent?.trim() === 'Org Chart'
    );
    const result = fixture.componentInstance.flatResults().find(entry => entry.page.slug === 'org-chart');

    expect(option?.querySelector('.search-result__meta')?.textContent).toContain('Current live demo');
    if (result) fixture.componentInstance.navigate(result);

    expect(router.navigate).toHaveBeenCalledWith(['/v', '21.1.2', 'components', 'org-chart', 'examples'], { fragment: undefined });
  });

  it('uses accent-insensitive matching when selecting the exact example anchor', () => {
    fixture.componentInstance.query.set('mau sac icon');
    const result = fixture.componentInstance.flatResults().find(entry => entry.page.slug === 'badge');
    const matchedExample = result?.page.examples.find(example => example.title === 'Màu sắc icon');
    expect(matchedExample).toBeDefined();

    if (result) fixture.componentInstance.navigate(result);

    expect(router.navigate).toHaveBeenCalledWith(['/v', '21.1.2', 'components', 'badge', 'examples'], { fragment: matchedExample?.id });
  });

  it('ignores an older published index that resolves after a newer version', async () => {
    const resolvers = new Map<string, (value: { docs: { id: string; title: string }[] }) => void>();
    loadIndex.and.callFake((version: string) => new Promise(resolve => resolvers.set(version, resolve)));

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
