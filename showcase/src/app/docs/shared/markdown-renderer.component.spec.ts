import { APP_BASE_HREF, DOCUMENT } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MarkdownRendererComponent } from './markdown-renderer.component';

describe('MarkdownRendererComponent', () => {
  let fixture: ComponentFixture<MarkdownRendererComponent>;
  let clipboardDescriptor: PropertyDescriptor | undefined;
  let clipboardWrite: jasmine.Spy;

  const nestedDocument = {
    defaultView: window,
    location: {
      pathname: '/sdcorejs-angular/v/21.1.2/components/button/overview',
      search: '?mode=full',
    },
  } as unknown as Document;

  beforeEach(async () => {
    clipboardDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard');
    clipboardWrite = jasmine.createSpy().and.resolveTo(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    });
    TestBed.configureTestingModule({
      imports: [MarkdownRendererComponent],
      providers: [provideRouter([]), { provide: APP_BASE_HREF, useValue: '/sdcorejs-angular/' }],
    });
    TestBed.overrideComponent(MarkdownRendererComponent, {
      add: { providers: [{ provide: DOCUMENT, useValue: nestedDocument }] },
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(MarkdownRendererComponent);
  });

  afterEach(() => {
    if (clipboardDescriptor) Object.defineProperty(window.navigator, 'clipboard', clipboardDescriptor);
    else delete (window.navigator as { clipboard?: Clipboard }).clipboard;
  });

  function renderPublishedMarkdown(markdown: string, sourcePublishedDocId = 'modules/permission/sd-permission'): HTMLElement {
    fixture.componentRef.setInput('version', '21.1.2');
    fixture.componentRef.setInput('sourcePublishedDocId', sourcePublishedDocId);
    fixture.componentRef.setInput('linkBaseUrl', `https://example.test/app/docs/21.1.2/${sourcePublishedDocId}.md`);
    fixture.componentRef.setInput('markdown', markdown);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders responsive semantic tables and fenced code', () => {
    fixture.componentRef.setInput('markdown', '| Name | Type |\n| --- | --- |\n| value | string |\n\n```ts\nconst ok = true;\n```');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('th')?.textContent).toContain('Name');
    expect(fixture.nativeElement.querySelector('code')?.textContent).toContain('const ok = true');
  });

  it('renders a GitHub alert as a titled note instead of the raw [!IMPORTANT] marker', () => {
    fixture.componentRef.setInput('markdown', '> [!IMPORTANT]\n> **Before upgrading:** add the new keys.\n>\n> Second paragraph.');
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('.docs-alert') as HTMLElement;
    expect(alert.getAttribute('role')).toBe('note');
    expect(alert.getAttribute('data-alert')).toBe('important');
    expect(alert.getAttribute('aria-label')).toBe('Important');
    expect(alert.querySelector('strong')?.textContent).toBe('Before upgrading:');
    expect(alert.querySelectorAll('p')).toHaveSize(3);
    expect(fixture.nativeElement.textContent).not.toContain('[!IMPORTANT]');
    expect(fixture.nativeElement.querySelector('blockquote')).toBeNull();
  });

  it('nests sub-bullets and indented code blocks inside their list item', () => {
    fixture.componentRef.setInput('headingIdPrefix', 'release-3-2-fixed-');
    fixture.componentRef.setInput(
      'markdown',
      '#### Chip\n\n- First sentence.\n  - The rest.\n\n  ```diff\n  - old\n  + new\n  ```\n\n- Next bullet.'
    );
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const items = host.querySelectorAll(':scope .docs-markdown > ul > li');
    expect(host.querySelector('h4')?.id).toBe('release-3-2-fixed-chip');
    expect(items).toHaveSize(2);
    expect(items[0]?.querySelector(':scope > ul > li')?.textContent?.trim()).toBe('The rest.');
    expect(items[0]?.querySelector(':scope > .docs-code code')?.textContent).toBe('- old\n+ new');
    expect(items[1]?.textContent?.trim()).toBe('Next bullet.');
  });

  it('sanitizes raw script markup instead of executing arbitrary HTML', () => {
    fixture.componentRef.setInput('markdown', '<script>window.hacked = true</script>Safe content');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('script')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Safe content');
  });

  it('renders safe Markdown links and leaves unsafe schemes as plain text', () => {
    fixture.componentRef.setInput('markdown', '[Guide](https://example.test/docs) and [unsafe](javascript:alert(1))');
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(link.href).toBe('https://example.test/docs');
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noreferrer');
    expect(fixture.nativeElement.querySelectorAll('a')).toHaveSize(1);
    expect(fixture.nativeElement.textContent).toContain('[unsafe](javascript:alert(1))');
  });

  it('renders safe fragment links with the same IDs while preserving the nested route and query', () => {
    fixture.componentRef.setInput('markdown', '[Cài đặt](#1-cài-đặt-vào-angular)\n\n### 1. Cài đặt vào Angular');
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/sdcorejs-angular/v/21.1.2/components/button/overview?mode=full#1-cai-dat-vao-angular');
    expect(fixture.nativeElement.querySelector('h3')?.id).toBe('1-cai-dat-vao-angular');
    expect(link.target).toBe('');
  });

  it('routes all known unique-basename published-doc links through the selected version', () => {
    const host = renderPublishedMarkdown(
      [
        '[Auth](./sd-auth.md)',
        '[Keycloak](./sd-keycloak.md)',
        '[Layout](./sd-layout.md)',
        '[Cache](../services/sd-cache.md)',
        '[Table](../components/sd-table.md)',
        '[API](../services/sd-api.md)',
        '[Permission](./sd-permission.md)',
      ].join('\n')
    );

    const links = [...host.querySelectorAll<HTMLAnchorElement>('a')];
    expect(links.map(link => link.getAttribute('href'))).toEqual([
      '/sdcorejs-angular/v/21.1.2/modules-integrations/auth/overview',
      '/sdcorejs-angular/v/21.1.2/modules-integrations/keycloak/overview',
      '/sdcorejs-angular/v/21.1.2/modules-integrations/layout/overview',
      '/sdcorejs-angular/v/21.1.2/services/cache/overview',
      '/sdcorejs-angular/v/21.1.2/components/table/overview',
      '/sdcorejs-angular/v/21.1.2/services/api/overview',
      '/sdcorejs-angular/v/21.1.2/modules-integrations/permission/overview',
    ]);
    expect(links.every(link => link.target === '' && link.rel === '')).toBeTrue();
  });

  it('prefers the exact normalized published ID resolved from the source document context', () => {
    const host = renderPublishedMarkdown(
      '[E2E attributes](../../docs/E2E-ATTRIBUTES.md)',
      'components/autoid-inspector/sd-autoid-inspector'
    );

    const link = host.querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/sdcorejs-angular/v/21.1.2/guides/e2e-attributes/overview');
    expect(link.target).toBe('');
  });

  it('maps a local forms directory link to the versioned forms category', () => {
    const host = renderPublishedMarkdown('[Forms](../forms/)', 'modules/permission/sd-permission');

    const link = host.querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/sdcorejs-angular/v/21.1.2/forms');
    expect(link.target).toBe('');
  });

  it('preserves query and fragment values and navigates internal docs links with the router', () => {
    const router = TestBed.inject(Router);
    const navigateByUrl = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const host = renderPublishedMarkdown('[Auth](./sd-auth.md?mode=compact#providers)');

    const link = host.querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/sdcorejs-angular/v/21.1.2/modules-integrations/auth/overview?mode=compact#providers');

    link.click();

    expect(navigateByUrl).toHaveBeenCalledOnceWith('/v/21.1.2/modules-integrations/auth/overview?mode=compact#providers');
  });

  it('keeps unresolved local documents and assets on the archive URL fallback', () => {
    const host = renderPublishedMarkdown(
      ['[Missing](../missing/not-found.md?raw=1#details)', '[Diagram](./assets/diagram.svg)'].join('\n')
    );

    const links = [...host.querySelectorAll<HTMLAnchorElement>('a')];
    expect(links.map(link => link.href)).toEqual([
      'https://example.test/app/docs/21.1.2/modules/missing/not-found.md?raw=1#details',
      'https://example.test/app/docs/21.1.2/modules/permission/assets/diagram.svg',
    ]);
    expect(links.every(link => link.target === '_blank' && link.rel.includes('noreferrer'))).toBeTrue();
  });

  it('inherits the document language by default and accepts an explicit content language', () => {
    fixture.componentRef.setInput('markdown', 'Content');
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('.docs-markdown') as HTMLElement;
    expect(container.getAttribute('lang')).toBeNull();

    fixture.componentRef.setInput('language', 'vi');
    fixture.detectChanges();

    expect(container.getAttribute('lang')).toBe('vi');
  });

  it('renders note, tip and warn callouts and numbered code lines', () => {
    fixture.componentRef.setInput(
      'markdown',
      '> **Tip**: keep it short.\n\n> **Warning**: breaks.\n\n> Plain note.\n\n```ts\nconst a = 1;\nconst b = 2;\n```'
    );
    fixture.detectChanges();

    const callouts = [...fixture.nativeElement.querySelectorAll('.docs-callout')] as HTMLElement[];
    expect(callouts.map(callout => [...callout.classList].find(name => name.startsWith('docs-callout--')))).toEqual([
      'docs-callout--tip',
      'docs-callout--warn',
      'docs-callout--note',
    ]);
    expect(fixture.nativeElement.querySelector('.docs-code__lines')?.textContent).toBe('1\n2');
    expect(fixture.nativeElement.querySelector('.docs-code__file')?.textContent?.trim()).toBe('ts');
  });

  it('announces clipboard success and rejection accurately', async () => {
    fixture.componentRef.setInput('markdown', '```ts\nconst ready = true;\n```');
    fixture.detectChanges();
    const code = 'const ready = true;';

    await fixture.componentInstance.copy(code);
    fixture.detectChanges();
    expect(clipboardWrite).toHaveBeenCalledWith(code);
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('copied to clipboard');
    expect(fixture.nativeElement.querySelector('.docs-code button')?.textContent).toContain('Copied');

    clipboardWrite.and.rejectWith(new Error('denied'));
    await fixture.componentInstance.copy(code);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('could not be copied');
    expect(fixture.nativeElement.querySelector('.docs-code button')?.textContent).toContain('Copy failed');
  });

  it('ignores an older clipboard completion after a newer copy action finishes', async () => {
    let rejectFirst!: (reason?: unknown) => void;
    let resolveSecond!: () => void;
    const firstWrite = new Promise<void>((_resolve, reject) => (rejectFirst = reject));
    const secondWrite = new Promise<void>(resolve => (resolveSecond = resolve));
    clipboardWrite.and.returnValues(firstWrite, secondWrite);

    const firstCopy = fixture.componentInstance.copy('first');
    const secondCopy = fixture.componentInstance.copy('second');
    resolveSecond();
    await secondCopy;
    rejectFirst(new Error('stale failure'));
    await firstCopy;

    expect(fixture.componentInstance.copyResult()).toEqual({ code: 'second', status: 'success' });
  });
});
