import { Component, input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { DocsVersionService } from '../../core/docs-version.service';
import { DocExample } from '../../core/documentation.models';
import { DOC_PAGES } from '../../core/documentation.registry';
import { MarkdownSection, PublishedDocTabsViewModel } from '../../core/published-docs.models';
import { PublishedDocsService } from '../../core/published-docs.service';
import { ExampleViewerComponent } from '../../shared/example-viewer.component';
import { DocsPageComponent } from './docs-page.component';

@Component({
  selector: 'docs-example-viewer',
  standalone: true,
  template: '<div data-testid="live-example">Live example</div>',
  styles: [':host { display: block; min-width: 0; }'],
})
class ExampleViewerStubComponent {
  readonly example = input.required<DocExample>();
  readonly codeOpen = input(false);
}

interface SetupOptions {
  readonly tab?: 'overview' | 'styling' | 'api' | 'examples';
  readonly version?: string;
  readonly latestVersion?: string;
  readonly viewModel?: PublishedDocTabsViewModel | null;
  readonly loadError?: Error;
  readonly category?: string;
  readonly slug?: string;
  readonly publishedIds?: readonly string[];
}

function section(heading: string, id: string, level = 2): MarkdownSection {
  return { heading, id, level, markdown: `${heading} content` };
}

function publishedView(overrides: Partial<PublishedDocTabsViewModel> = {}): PublishedDocTabsViewModel {
  const overview = [section('When to use', 'when-to-use')];
  const api = [section('Inputs', 'inputs')];
  return {
    document: { id: 'components/button/sd-button', title: 'Button', category: 'components', path: 'button.md', url: 'button.md' },
    parsed: { title: 'Button', metadata: {}, sections: [...overview, ...api], raw: '' },
    overview,
    styling: [],
    api,
    examples: [],
    ...overrides,
  };
}

describe('DocsPageComponent', () => {
  let fixture: ComponentFixture<DocsPageComponent> | undefined;

  async function setup(options: SetupOptions = {}): Promise<{ router: Router; publishedDocs: jasmine.SpyObj<PublishedDocsService> }> {
    const version = options.version ?? '21.1.2';
    const paramMap = convertToParamMap({
      version,
      category: options.category ?? 'components',
      slug: options.slug ?? 'button',
      tab: options.tab ?? 'examples',
    });
    const publishedDocs = jasmine.createSpyObj<PublishedDocsService>('PublishedDocsService', [
      'loadDocument',
      'loadIndex',
      'loadStyleGuide',
      'resolveDocumentUrl',
    ]);
    if (options.loadError) publishedDocs.loadDocument.and.rejectWith(options.loadError);
    else publishedDocs.loadDocument.and.resolveTo(options.viewModel === undefined ? publishedView() : options.viewModel);
    publishedDocs.loadIndex.and.resolveTo({
      docs: (options.publishedIds ?? DOC_PAGES.flatMap(page => (page.publishedDocId ? [page.publishedDocId] : []))).map(id => ({ id })),
    } as never);
    publishedDocs.loadStyleGuide.and.resolveTo(null);
    publishedDocs.resolveDocumentUrl.and.callFake((selectedVersion: string, path: string) => `/docs/${selectedVersion}/${path}`);

    await TestBed.configureTestingModule({
      imports: [DocsPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(paramMap), snapshot: { paramMap } } },
        {
          provide: DocsVersionService,
          useValue: {
            resolve: jasmine.createSpy().and.resolveTo(version),
            invalidVersion: signal<string | null>(null),
            selectedVersion: signal(version),
            latestVersion: signal(options.latestVersion ?? '21.1.2'),
            selectedRelease: signal(version.split('.').slice(1).join('.')),
            isLatestRelease: signal(version === (options.latestVersion ?? '21.1.2')),
          },
        },
        { provide: PublishedDocsService, useValue: publishedDocs },
      ],
    })
      .overrideComponent(DocsPageComponent, {
        remove: { imports: [ExampleViewerComponent] },
        add: { imports: [ExampleViewerStubComponent] },
      })
      .compileComponents();

    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(DocsPageComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { router, publishedDocs };
  }

  afterEach(() => {
    fixture?.nativeElement.remove();
    fixture?.destroy();
  });

  it('keeps compiled live examples available when published Markdown fails', async () => {
    await setup({ loadError: new Error('Published docs offline') });

    expect(fixture?.nativeElement.querySelector('[data-testid="live-example"]')).not.toBeNull();
    expect(fixture?.nativeElement.textContent).toContain('Published docs offline');
  });

  it('shows only tabs backed by published content or live examples', async () => {
    await setup({
      tab: 'overview',
      viewModel: publishedView({ styling: [], api: [], examples: [] }),
    });

    const labels = [...fixture!.nativeElement.querySelectorAll('.docs-tabs a > span:first-child')].map((label: HTMLElement) =>
      label.textContent?.trim()
    );

    expect(labels).toEqual(['Overview', 'Examples']);
  });

  it('redirects an empty documentation tab to the first available section', async () => {
    const { router } = await setup({
      tab: 'styling',
      viewModel: publishedView({ styling: [], api: [], examples: [] }),
    });

    expect(router.navigate).toHaveBeenCalledWith(['/v', '21.1.2', 'components', 'button', 'overview'], { replaceUrl: true });
  });

  it('uses current-demo copy and removes migration language on the latest examples page', async () => {
    await setup();

    expect(fixture?.nativeElement.querySelector('.historical-notice')).toBeNull();
    const button = DOC_PAGES.find(page => page.category === 'components' && page.slug === 'button');
    expect(fixture?.nativeElement.querySelector('.examples-summary strong')?.textContent?.trim()).toBe(String(button?.demoSectionCount));
    expect(fixture?.nativeElement.querySelector('.examples-summary span')?.textContent?.trim()).toBe('interactive examples');
    expect(fixture?.nativeElement.textContent).not.toContain('preserved');
    const source = fixture?.nativeElement.querySelector('.toc__links a[href*="button-demo"]') as HTMLAnchorElement;
    expect(source.textContent).toContain('View demo source');
    expect(source.getAttribute('href')).toBe(
      'https://github.com/sdcorejs/sdcorejs-angular/blob/main/showcase/src/app/pages/components/button/button-demo.component.ts'
    );
  });

  it('shows tab counts, the English purpose as lead and an edit link to the published source', async () => {
    const purpose: MarkdownSection = {
      heading: 'One-line purpose',
      id: 'one-line-purpose',
      level: 2,
      markdown: 'Standard action button with `sd-button`.',
    };
    const api: MarkdownSection = {
      heading: 'Inputs',
      id: 'inputs',
      level: 2,
      markdown: '| Name | Type |\n| --- | --- |\n| `type` | `string` |\n| `size` | `string` |',
    };
    await setup({
      tab: 'overview',
      viewModel: publishedView({ overview: [purpose, section('When to use', 'when-to-use')], api: [api] }),
    });

    const tabs = [...fixture!.nativeElement.querySelectorAll('.docs-tabs a')] as HTMLAnchorElement[];
    const button = DOC_PAGES.find(page => page.category === 'components' && page.slug === 'button');
    expect(tabs.map(tab => tab.querySelector('.docs-tabs__count')?.textContent ?? null)).toEqual([
      null,
      '2',
      String(button?.examples.length),
    ]);
    expect(fixture!.nativeElement.querySelector('.page-header__lead')?.textContent).toContain('Standard action button');
    expect(fixture!.nativeElement.querySelector('#one-line-purpose')).toBeNull();
    expect((fixture!.nativeElement.querySelector('.toc__links a') as HTMLAnchorElement).href).toBe(
      'https://github.com/sdcorejs/sdcorejs-angular/blob/main/versions/v19/projects/sdcorejs-angular/button.md'
    );
  });

  it('keeps stable status quiet and exposes copyable API identity on Overview', async () => {
    await setup({ tab: 'overview' });

    expect(fixture?.nativeElement.querySelector('.page-header__badges')?.textContent).not.toContain('stable');
    expect(fixture?.nativeElement.querySelector('.page-header__identity')?.textContent).toContain('sd-button');
    expect(fixture?.nativeElement.querySelector('.page-header__identity')?.textContent).toContain('@sdcorejs/angular/components/button');
    expect(fixture?.nativeElement.querySelectorAll('.page-header__identity button')).toHaveSize(2);
  });

  it('renders API tables as filterable rows with deep links and hides groups without matches', async () => {
    const inputs: MarkdownSection = {
      heading: 'Inputs',
      id: 'inputs',
      level: 2,
      markdown: "| Name | Type | Default | Notes |\n| --- | --- | --- | --- |\n| `type` | `'fill' \\| 'light'` | `'light'` | Visual variant. |\n| `size` | `'sm' \\| 'md'` | `'sm'` | Height. |",
    };
    const outputs: MarkdownSection = {
      heading: 'Outputs',
      id: 'outputs',
      level: 2,
      markdown: '| Name | Type | Notes |\n| --- | --- | --- |\n| `click` | `Event` | Throttled. |',
    };
    await setup({ tab: 'api', viewModel: publishedView({ api: [inputs, outputs] }) });
    const element = fixture!.nativeElement as HTMLElement;

    expect([...element.querySelectorAll('.api-row')].map(row => row.id)).toEqual(['api-inputs-type', 'api-inputs-size', 'api-outputs-click']);
    expect([...element.querySelectorAll('#api-inputs-type .api-row__type')].map(chip => chip.textContent)).toEqual(["'fill'", "'light'"]);
    expect(element.querySelector('#api-inputs-type .api-row__default')?.textContent).toContain("'light'");
    expect(element.querySelector('.api-filter__count')?.textContent?.trim()).toBe('3 entries');

    const filter = element.querySelector('.api-filter input') as HTMLInputElement;
    filter.value = 'throttled';
    filter.dispatchEvent(new Event('input'));
    fixture!.detectChanges();
    expect(element.querySelector('#inputs')).toBeNull();
    expect([...element.querySelectorAll('.api-row')].map(row => row.id)).toEqual(['api-outputs-click']);
    expect(element.querySelector('.api-filter__count')?.textContent?.trim()).toBe('1 entries');

    filter.value = 'nothing-matches';
    filter.dispatchEvent(new Event('input'));
    fixture!.detectChanges();
    expect(element.querySelector('.api-empty')?.textContent?.trim()).toBe('No matching entries');
  });

  it('renders service methods as cards with shared options collapsed', async () => {
    const method = (name: string, extra: string): MarkdownSection => ({
      heading: `\`${name}(message, option?): Promise<string>\``,
      id: name,
      level: 3,
      markdown: [
        `${name} dialog.`,
        '',
        '```typescript',
        `${name}(`,
        '  option?: {',
        "    title?: string;   // default: 'Xác nhận'",
        `    ${extra}?: string;`,
        '  }',
        '): Promise<string>;',
        '```',
      ].join('\n'),
    });
    await setup({
      category: 'services',
      slug: 'confirm',
      tab: 'api',
      viewModel: publishedView({ api: [section('Public API', 'public-api'), method('confirm', 'width'), method('withInput', 'label')] }),
    });
    const element = fixture!.nativeElement as HTMLElement;

    expect([...element.querySelectorAll('.method')].map(card => card.id)).toEqual(['api-methods-confirm', 'api-methods-withInput']);
    expect([...element.querySelectorAll('#api-methods-confirm .method-option__name')].map(name => name.textContent)).toEqual(['width']);
    const toggle = element.querySelector('#api-methods-confirm .method__toggle') as HTMLButtonElement;
    expect(toggle.textContent).toContain('Show 1 shared options');

    toggle.click();
    fixture!.detectChanges();
    expect([...element.querySelectorAll('#api-methods-confirm .method-option__name')].map(name => name.textContent)).toEqual([
      'width',
      'title',
    ]);
    expect(element.querySelector('#api-methods-confirm .method-option__default')?.textContent).toContain("'Xác nhận'");
  });

  it('clearly distinguishes archived documentation from current live examples', async () => {
    await setup({ version: '20.1.2', latestVersion: '21.1.2' });

    const notice = fixture?.nativeElement.querySelector('.historical-notice');
    expect(notice?.textContent).toContain('Archived documentation v20.1.2');
    expect(notice?.textContent).toContain('current showcase');
  });

  it('keeps a wide live example inside the documentation content column', async () => {
    await setup();
    const list = fixture!.nativeElement.querySelector('.examples-list') as HTMLElement;
    const viewer = list.querySelector('docs-example-viewer') as HTMLElement;
    const wideContent = document.createElement('div');
    list.style.width = '320px';
    wideContent.style.width = '1200px';
    viewer.appendChild(wideContent);

    const listWidth = list.getBoundingClientRect().width;
    const viewerWidth = viewer.getBoundingClientRect().width;

    expect(getComputedStyle(list).display).toBe('grid');
    expect(getComputedStyle(list).minWidth).toBe('0px');
    expect(viewerWidth).toBeLessThanOrEqual(listWidth + 0.5);
  });

  it('skips unavailable historical documents in Previous and Next navigation', async () => {
    await setup({
      category: 'pipes-utilities',
      slug: 'time-different',
      tab: 'overview',
      version: '19.0.4',
      latestVersion: '21.1.2',
      publishedIds: ['pipes/src/time-different', 'pipes/src/view'],
    });

    expect(fixture?.componentInstance.nextPage()?.slug).toBe('view');
    expect(fixture?.nativeElement.querySelector('.page-pagination a:last-child')?.getAttribute('href')).toContain(
      '/v/19.0.4/pipes-utilities/view/overview'
    );
  });

  it('finds adjacent historical documents even when the current reference is unavailable', async () => {
    await setup({
      category: 'pipes-utilities',
      slug: 'time-different',
      tab: 'overview',
      version: '19.0.4',
      latestVersion: '21.1.2',
      viewModel: null,
      publishedIds: ['pipes/src/view'],
    });

    expect(fixture?.componentInstance.notAvailable()).toBeTrue();
    expect(fixture?.componentInstance.nextPage()?.slug).toBe('view');
    expect(fixture?.nativeElement.querySelector('.page-pagination a:last-child')?.getAttribute('href')).toContain(
      '/v/19.0.4/pipes-utilities/view/overview'
    );
  });
});
