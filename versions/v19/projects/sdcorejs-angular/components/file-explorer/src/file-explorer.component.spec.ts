import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdFileExplorer } from './file-explorer.component';
import type {
  SdFileExplorerDownloadArgs,
  SdFileExplorerItem,
  SdFileExplorerOpenEvent,
  SdFileExplorerOption,
  SdFileExplorerUploadArgs,
} from './file-explorer.model';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const DAY = 86_400_000;
const folder = (id: string, parentId: string | null, name: string, extra: Partial<SdFileExplorerItem> = {}): SdFileExplorerItem => ({
  id,
  parentId,
  name,
  kind: 'folder',
  ...extra,
});
const file = (id: string, parentId: string | null, name: string, extra: Partial<SdFileExplorerItem> = {}): SdFileExplorerItem => ({
  id,
  parentId,
  name,
  kind: 'file',
  ...extra,
});

function tree(): Record<string, SdFileExplorerItem[]> {
  return {
    root: [
      file('guide', null, 'Guide.pdf', { mimeType: 'application/pdf', size: 2_516_582, modifiedAt: Date.now() }),
      folder('projects', null, 'Projects'),
      file('plan', null, 'Plan.xlsx', { size: 866_304, modifiedAt: Date.now() - DAY }),
      folder('docs', null, 'Docs', { hasChildren: false }),
      file('cover', null, 'Cover.jpg', { mimeType: 'image/jpeg', size: 1_887_437 }),
      file('memo', null, 'Memo.docx', { size: 2048 }),
    ],
    projects: [
      folder('web', 'projects', 'Website'),
      folder('design', 'projects', 'Design', { hasChildren: false }),
      file('brief', 'projects', 'Brief.docx'),
    ],
    web: [file('sitemap', 'web', 'Sitemap.pdf', { mimeType: 'application/pdf' })],
    design: [],
    docs: [],
  };
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function listSpy(data = tree()) {
  return jasmine
    .createSpy('list')
    .and.callFake(({ parentId }: { parentId: string | null }) => Promise.resolve([...(data[parentId ?? 'root'] ?? [])]));
}

@Component({
  standalone: true,
  imports: [SdFileExplorer],
  template: `
    <div [style.width.px]="width()" style="height: 720px">
      <sd-file-explorer [option]="option()" (open)="opened.push($event)" />
    </div>
  `,
})
class HostComponent {
  readonly option = signal<SdFileExplorerOption>({ list: listSpy() });
  readonly width = signal(1100);
  readonly explorer = viewChild.required(SdFileExplorer);
  readonly opened: SdFileExplorerOpenEvent[] = [];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let fixture: ComponentFixture<HostComponent>;
let host: HostComponent;
let i18n: I18nService;

const t = (key: string, params?: Record<string, string | number>) => i18n.t(`core.component.file-explorer.${key}`, params);

async function setup(option: Partial<SdFileExplorerOption> = {}, width = 1100): Promise<HTMLElement> {
  fixture = TestBed.createComponent(HostComponent);
  host = fixture.componentInstance;
  host.option.set({ list: listSpy(), ...option });
  host.width.set(width);
  fixture.detectChanges();
  await settle();
  return element();
}

async function settle(): Promise<void> {
  for (let i = 0; i < 3; i++) {
    fixture.detectChanges();
    await fixture.whenStable();
  }
  fixture.detectChanges();
}

function element(): HTMLElement {
  return fixture.nativeElement.querySelector('sd-file-explorer') as HTMLElement;
}

function q<T extends HTMLElement = HTMLElement>(selector: string): T | null {
  return element().querySelector<T>(selector);
}

function qa<T extends HTMLElement = HTMLElement>(selector: string): T[] {
  return Array.from(element().querySelectorAll<T>(selector));
}

function rowNames(): string[] {
  return qa('.row:not(.row--head) .name').map(node => node.textContent?.trim() ?? '');
}

function row(name: string): HTMLElement {
  const match = qa('.row:not(.row--head)').find(node => node.querySelector('.name')?.textContent?.trim() === name);
  if (!match) throw new Error(`row "${name}" not found in [${rowNames().join(', ')}]`);
  return match;
}

function treeNode(name: string): HTMLElement {
  const match = qa('[role="treeitem"]').find(node => node.querySelector('.label')?.textContent?.trim() === name);
  if (!match) throw new Error(`tree node "${name}" not found`);
  return match;
}

function treeNames(): string[] {
  return qa('[role="treeitem"] .label').map(node => node.textContent?.trim() ?? '');
}

function list(option = host.option()): jasmine.Spy {
  return option.list as jasmine.Spy;
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
}

function keydown(target: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  fixture.detectChanges();
  return event;
}

function pickFiles(files: File[]): void {
  const input = q<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('file input not rendered');
  const transfer = new DataTransfer();
  for (const entry of files) transfer.items.add(entry);
  input.files = transfer.files;
  input.dispatchEvent(new Event('change'));
  fixture.detectChanges();
}

/** Clicks a native button, or the inner <button> of an <sd-button> host. */
function press(target: Element | null | undefined): void {
  const button = target instanceof HTMLButtonElement ? target : target?.querySelector('button');
  if (!button) throw new Error('button not found');
  button.click();
  fixture.detectChanges();
}

/** The open file detail — an sd-side-drawer the explorer opens inside itself — or null. */
function detail(): HTMLElement | null {
  return q('.sd-side-drawer.sd-side-drawer-active');
}

function inDetail<T extends HTMLElement = HTMLElement>(selector: string): T | null {
  return detail()?.querySelector<T>(selector) ?? null;
}

function transferCards(): { name: string; status: string }[] {
  return qa('sd-file-explorer-transfer-panel .card').map(card => ({
    name: card.querySelector('.name')?.textContent?.trim() ?? '',
    status: card.querySelector('.status')?.textContent?.trim() ?? '',
  }));
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Specs
// ---------------------------------------------------------------------------

describe('SdFileExplorer', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent], providers: [provideNoopAnimations()] });
    i18n = TestBed.inject(I18nService);
  });

  afterEach(() => fixture?.destroy());

  describe('listing', () => {
    it('lists the root folder once with parentId null and shows folders first, keeping the callback order', async () => {
      await setup();
      const spy = list();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.calls.mostRecent().args[0].parentId).toBeNull();
      expect(spy.calls.mostRecent().args[0].signal).toEqual(jasmine.any(AbortSignal));
      expect(rowNames()).toEqual(['Projects', 'Docs', 'Guide.pdf', 'Plan.xlsx', 'Cover.jpg', 'Memo.docx']);
      expect(q('.count')?.textContent?.trim()).toBe(t('item-count', { count: 6 }));
      expect(q('.heading')?.textContent?.trim()).toBe(t('root'));
    });

    it('formats size and modification date and shows a dash when metadata is missing', async () => {
      await setup();
      const guide = row('Guide.pdf');
      expect(guide.querySelector('.cell--size')?.textContent?.trim()).toBe('2,4 MB');
      expect(guide.querySelector('.cell--modified')?.textContent?.trim()).toBe(t('today'));
      expect(row('Plan.xlsx').querySelector('.cell--modified')?.textContent?.trim()).toBe(t('yesterday'));
      expect(row('Plan.xlsx').querySelector('.cell--size')?.textContent?.trim()).toBe('846 KB');
      expect(row('Projects').querySelector('.cell--size')?.textContent?.trim()).toBe('—');
      expect(row('Cover.jpg').querySelector('.cell--modified')?.textContent?.trim()).toBe('—');
    });

    it('draws built-in file-type icons for rows and tree folders as unsanitized data: images', async () => {
      await setup();
      const icon = (host: HTMLElement) => host.querySelector('sd-file-explorer-file-icon');
      expect(icon(row('Guide.pdf'))?.getAttribute('data-icon')).toBe('file-pdf');
      expect(icon(row('Plan.xlsx'))?.getAttribute('data-icon')).toBe('file-spreadsheet');
      expect(icon(row('Cover.jpg'))?.getAttribute('data-icon')).toBe('file-jpg');
      expect(icon(row('Projects'))?.getAttribute('data-icon')).toBe('folder-closed');
      expect(icon(treeNode(t('root')))?.getAttribute('data-icon')).toBe('folder-open');
      expect(icon(treeNode('Docs'))?.getAttribute('data-icon')).toBe('folder-closed');
      const img = row('Guide.pdf').querySelector('img') as HTMLImageElement;
      expect(img.getAttribute('src')).toMatch(/^data:image\/svg\+xml/);
      expect(img.getAttribute('alt')).toBe('');
      expect(icon(row('Guide.pdf'))?.getAttribute('aria-hidden')).toBe('true');
    });

    it('renders the header title, description and root label from the option', async () => {
      await setup({ title: 'Team drive', description: 'Shared files', rootLabel: 'Library' });
      expect(q('.brand-title')?.textContent?.trim()).toBe('Team drive');
      expect(q('.brand-description')?.textContent?.trim()).toBe('Shared files');
      expect(q('.heading')?.textContent?.trim()).toBe('Library');
      expect(treeNames()[0]).toBe('Library');
    });

    it('omits the brand block when no title is given', async () => {
      await setup();
      expect(q('.brand')).toBeNull();
    });

    it('shows a loading state until the listing resolves', async () => {
      const pending = deferred<SdFileExplorerItem[]>();
      fixture = TestBed.createComponent(HostComponent);
      host = fixture.componentInstance;
      host.option.set({ list: () => pending.promise });
      fixture.detectChanges();
      expect(q('sd-data-state')?.textContent).toContain(t('loading'));
      pending.resolve([file('a', null, 'A.txt')]);
      await settle();
      expect(rowNames()).toEqual(['A.txt']);
    });

    it('shows the empty state with an upload hint only when uploads are enabled', async () => {
      await setup({ list: () => [] });
      expect(q('sd-data-state')?.textContent).toContain(t('empty'));
      expect(q('sd-data-state')?.textContent).not.toContain(t('empty-upload-hint'));
      fixture.destroy();

      await setup({ list: () => [], upload: () => undefined });
      expect(q('sd-data-state')?.textContent).toContain(t('empty-upload-hint'));
    });

    it('shows the error with its message and lists again on retry', async () => {
      let attempts = 0;
      const listFn = jasmine.createSpy('list').and.callFake(() => {
        attempts++;
        return attempts === 1 ? Promise.reject(new Error('Gateway timeout')) : Promise.resolve([file('a', null, 'A.txt')]);
      });
      await setup({ list: listFn });
      expect(q('sd-data-state')?.textContent).toContain(t('load-error'));
      expect(q('sd-data-state')?.textContent).toContain('Gateway timeout');

      (q('sd-data-state button') as HTMLButtonElement).click();
      await settle();
      expect(listFn).toHaveBeenCalledTimes(2);
      expect(rowNames()).toEqual(['A.txt']);
    });

    it('accepts a synchronous list result and ignores non-array results', async () => {
      await setup({ list: () => null as unknown as SdFileExplorerItem[] });
      expect(q('sd-data-state')?.textContent).toContain(t('empty'));
    });

    it('reload() lists the current folder again and keeps showing the old items meanwhile', async () => {
      await setup();
      const spy = list();
      const pending = deferred<SdFileExplorerItem[]>();
      spy.and.returnValue(pending.promise);
      host.explorer().reload();
      fixture.detectChanges();
      expect(spy).toHaveBeenCalledTimes(2);
      expect(rowNames().length).toBe(6);
      expect(q('.refresh-bar')).not.toBeNull();
      pending.resolve([file('fresh', null, 'Fresh.txt')]);
      await settle();
      expect(rowNames()).toEqual(['Fresh.txt']);
      expect(q('.refresh-bar')).toBeNull();
    });

    it('resets the navigation when the list callback is replaced, but not for other option changes', async () => {
      await setup();
      row('Projects').click();
      await settle();
      expect(q('.heading')?.textContent?.trim()).toBe('Projects');

      host.option.update(option => ({ ...option, title: 'Renamed' }));
      await settle();
      expect(q('.heading')?.textContent?.trim()).toBe('Projects');

      const next = listSpy({ root: [file('x', null, 'Other.txt')] });
      host.option.set({ list: next });
      await settle();
      expect(next).toHaveBeenCalledTimes(1);
      expect(q('.heading')?.textContent?.trim()).toBe(t('root'));
      expect(rowNames()).toEqual(['Other.txt']);
    });
  });

  describe('navigation', () => {
    it('opens a folder from the list, updates breadcrumb and tree, and does not emit (open)', async () => {
      await setup();
      row('Projects').click();
      await settle();
      expect(list().calls.mostRecent().args[0].parentId).toBe('projects');
      expect(q('.heading')?.textContent?.trim()).toBe('Projects');
      expect(rowNames()).toEqual(['Website', 'Design', 'Brief.docx']);
      expect(qa('sd-breadcrumb li').map(li => li.textContent?.trim())).toEqual([jasmine.stringContaining(t('root')), 'Projects']);
      expect(treeNode('Projects').getAttribute('aria-selected')).toBe('true');
      expect(treeNode('Projects').getAttribute('aria-expanded')).toBe('true');
      expect(treeNames()).toEqual([t('root'), 'Projects', 'Website', 'Design', 'Docs']);
      expect(host.opened).toEqual([]);
    });

    it('opens folders with the keyboard', async () => {
      await setup();
      keydown(row('Projects'), 'Enter');
      await settle();
      expect(q('.heading')?.textContent?.trim()).toBe('Projects');
    });

    it('navigates back through the breadcrumb using the cached listing', async () => {
      await setup();
      row('Projects').click();
      await settle();
      row('Website').click();
      await settle();
      expect(qa('sd-breadcrumb li').length).toBe(3);
      const calls = list().calls.count();

      const rootButton = q<HTMLButtonElement>('sd-breadcrumb button');
      rootButton?.click();
      await settle();
      expect(q('.heading')?.textContent?.trim()).toBe(t('root'));
      expect(list().calls.count()).toBe(calls);
    });

    it('expands tree folders lazily, once, and hides the expander of folders without sub-folders', async () => {
      await setup();
      const spy = list();
      expect(treeNode('Docs').querySelector('button.toggle')).toBeNull();
      const toggle = treeNode('Projects').querySelector<HTMLButtonElement>('button.toggle');
      expect(toggle?.getAttribute('aria-label')).toBe(t('expand', { name: 'Projects' }));
      toggle?.click();
      await settle();
      expect(spy.calls.mostRecent().args[0].parentId).toBe('projects');
      expect(treeNames()).toEqual([t('root'), 'Projects', 'Website', 'Design', 'Docs']);
      expect(q('.heading')?.textContent?.trim()).toBe(t('root'));

      treeNode('Projects').querySelector<HTMLButtonElement>('button.toggle')?.click();
      await settle();
      expect(treeNames()).toEqual([t('root'), 'Projects', 'Docs']);
      treeNode('Projects').querySelector<HTMLButtonElement>('button.toggle')?.click();
      await settle();
      expect(spy.calls.allArgs().filter(([args]) => args.parentId === 'projects').length).toBe(1);
    });

    it('hides the expander once a listed folder turns out to have no sub-folders', async () => {
      await setup();
      treeNode('Projects').click();
      await settle();
      treeNode('Website').click();
      await settle();
      expect(treeNode('Website').querySelector('button.toggle')).toBeNull();
      expect(treeNode('Website').getAttribute('aria-expanded')).toBeNull();
    });

    it('supports the tree keyboard model (arrows, Home/End, Enter)', async () => {
      await setup();
      const root = treeNode(t('root'));
      expect(root.getAttribute('tabindex')).toBe('0');
      root.focus();
      keydown(root, 'ArrowDown');
      expect(document.activeElement).toBe(treeNode('Projects'));
      keydown(treeNode('Projects'), 'End');
      expect(document.activeElement).toBe(treeNode('Docs'));
      keydown(treeNode('Docs'), 'ArrowUp');
      expect(document.activeElement).toBe(treeNode('Projects'));
      keydown(treeNode('Projects'), 'ArrowRight');
      await settle();
      expect(treeNode('Projects').getAttribute('aria-expanded')).toBe('true');
      keydown(treeNode('Projects'), 'ArrowRight');
      expect(document.activeElement).toBe(treeNode('Website'));
      keydown(treeNode('Website'), 'ArrowLeft');
      expect(document.activeElement).toBe(treeNode('Projects'));
      keydown(treeNode('Projects'), 'ArrowLeft');
      await settle();
      expect(treeNode('Projects').getAttribute('aria-expanded')).toBe('false');
      keydown(treeNode('Projects'), 'Home');
      expect(document.activeElement).toBe(root);
      const enter = keydown(treeNode('Docs'), 'Enter');
      await settle();
      expect(enter.defaultPrevented).toBeTrue();
      expect(q('.heading')?.textContent?.trim()).toBe('Docs');
    });

    it('marks a failed tree branch and retries it from the tree', async () => {
      let fail = true;
      const data = tree();
      const listFn = jasmine.createSpy('list').and.callFake(({ parentId }: { parentId: string | null }) => {
        if (parentId === 'projects' && fail) {
          fail = false;
          return Promise.reject(new Error('boom'));
        }
        return Promise.resolve(data[parentId ?? 'root'] ?? []);
      });
      await setup({ list: listFn });
      treeNode('Projects').querySelector<HTMLButtonElement>('button.toggle')?.click();
      await settle();
      const retry = treeNode('Projects').querySelector<HTMLButtonElement>('.retry');
      expect(retry).not.toBeNull();
      retry?.click();
      await settle();
      expect(treeNames()).toContain('Website');
    });

    it('does not loop on a folder that lists itself as its own child', async () => {
      const loop = folder('loop', null, 'Loop');
      await setup({ list: ({ parentId }) => (parentId === null ? [loop] : [{ ...loop, parentId: 'loop' }]) });
      treeNode('Loop').click();
      await settle();
      expect(treeNames()).toEqual([t('root'), 'Loop']);
    });
  });

  describe('search', () => {
    it('filters the loaded folder locally, accent- and case-insensitively, when no search callback is given', async () => {
      await setup({ list: () => [file('a', null, 'Tài liệu.pdf'), file('b', null, 'Budget.xlsx')] });
      const input = q<HTMLInputElement>('.search-input') as HTMLInputElement;
      type(input, 'TAI LIEU');
      expect(rowNames()).toEqual(['Tài liệu.pdf']);
      expect(q('.heading')?.textContent?.trim()).toBe(t('search-results'));

      type(input, 'zzz');
      expect(q('sd-data-state')?.textContent).toContain(t('search-empty', { keyword: 'zzz' }));

      q<HTMLButtonElement>('.search-clear')?.click();
      fixture.detectChanges();
      expect(input.value).toBe('');
      expect(rowNames().length).toBe(2);
      expect(document.activeElement).toBe(input);
    });

    it('debounces the search callback, aborts stale requests and ignores their results', async () => {
      const calls: { keyword: string; signal: AbortSignal; resolve: (items: SdFileExplorerItem[]) => void }[] = [];
      const search = jasmine.createSpy('search').and.callFake(({ keyword, signal }: { keyword: string; signal: AbortSignal }) => {
        const pending = deferred<SdFileExplorerItem[]>();
        calls.push({ keyword, signal, resolve: pending.resolve });
        return pending.promise;
      });
      await setup({ search });
      const input = q<HTMLInputElement>('.search-input') as HTMLInputElement;
      type(input, 'p');
      type(input, 'pl');
      expect(search).not.toHaveBeenCalled();
      expect(q('sd-data-state')?.textContent).toContain(t('search-loading'));
      await wait(350);
      expect(search).toHaveBeenCalledTimes(1);
      expect(search.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ keyword: 'pl', parentId: null }));

      type(input, 'pla');
      expect(calls[0].signal.aborted).toBeTrue();
      calls[0].resolve([file('stale', null, 'Stale.txt')]);
      await wait(350);
      calls[1].resolve([file('plan', null, 'Plan.xlsx')]);
      await settle();
      expect(rowNames()).toEqual(['Plan.xlsx']);
    });

    it('shows search errors and retries immediately', async () => {
      let attempt = 0;
      const search = jasmine
        .createSpy('search')
        .and.callFake(() => (++attempt === 1 ? Promise.reject(new Error('Index offline')) : [file('x', null, 'X.txt')]));
      await setup({ search });
      type(q<HTMLInputElement>('.search-input') as HTMLInputElement, 'x');
      await wait(350);
      await settle();
      expect(q('sd-data-state')?.textContent).toContain(t('search-error'));
      expect(q('sd-data-state')?.textContent).toContain('Index offline');
      (q('sd-data-state button') as HTMLButtonElement).click();
      await settle();
      expect(search).toHaveBeenCalledTimes(2);
      expect(rowNames()).toEqual(['X.txt']);
    });

    it('navigating into a folder from the results clears the search', async () => {
      await setup({ search: () => [folder('web', 'projects', 'Website')] });
      type(q<HTMLInputElement>('.search-input') as HTMLInputElement, 'web');
      await wait(350);
      await settle();
      row('Website').click();
      await settle();
      expect((q<HTMLInputElement>('.search-input') as HTMLInputElement).value).toBe('');
      expect(q('.heading')?.textContent?.trim()).toBe('Website');
    });

    it('Escape clears the keyword', async () => {
      await setup();
      const input = q<HTMLInputElement>('.search-input') as HTMLInputElement;
      type(input, 'guide');
      keydown(input, 'Escape');
      expect(input.value).toBe('');
    });
  });

  describe('view modes', () => {
    it('switches between list and grid and honours defaultView', async () => {
      await setup({ defaultView: 'grid' });
      expect(q('.grid')).not.toBeNull();
      expect(q('[aria-pressed="true"]')?.getAttribute('aria-label')).toBe(t('view-grid'));
      qa<HTMLButtonElement>('.icon-button--toggle')[0].click();
      fixture.detectChanges();
      expect(q('.grid')).toBeNull();
      expect(q('.list')).not.toBeNull();
    });

    it('opens items from grid cards with click and keyboard, and shows thumbnails when provided', async () => {
      await setup({
        defaultView: 'grid',
        list: ({ parentId }) =>
          parentId === null
            ? [folder('f', null, 'Folder'), file('img', null, 'Pic.png', { thumbnailUrl: 'data:image/png;base64,iVBORw0KGgo=' })]
            : [],
      });
      expect(q('.card .thumb > img')?.getAttribute('src')).toContain('data:image/png');
      expect(qa('.card')[0].querySelector('sd-file-explorer-file-icon')?.getAttribute('data-icon')).toBe('folder-closed');
      keydown(qa('.card')[0], ' ');
      await settle();
      expect(q('.heading')?.textContent?.trim()).toBe('Folder');
    });
  });

  describe('preview and (open)', () => {
    it('emits (open) exactly once with the item and the current path, then opens the detail drawer', async () => {
      const preview = jasmine.createSpy('preview').and.returnValue(null);
      await setup({ preview });
      row('Projects').click();
      await settle();
      row('Brief.docx').click();
      await settle();
      expect(host.opened.length).toBe(1);
      expect(host.opened[0].item.id).toBe('brief');
      expect(host.opened[0].path.map(entry => entry.id)).toEqual(['projects']);
      expect(inDetail('.sd-side-drawer-title')?.textContent?.trim()).toBe('Brief.docx');
      // why: .docx không có renderer — không được gọi preview (tránh tải cả file chỉ để hiện fallback).
      expect(preview).not.toHaveBeenCalled();
      expect(inDetail('.placeholder-title')?.textContent?.trim()).toBe(t('preview.unavailable'));
      fixture.detectChanges();
      expect(host.opened.length).toBe(1);
    });

    it('opens the detail in an sd-side-drawer scoped to the item area, without locking page scroll', async () => {
      await setup({ download: () => undefined });
      const overflow = document.body.style.overflow;
      expect(detail()).toBeNull();
      row('Cover.jpg').click();
      await settle();
      const drawer = detail() as HTMLElement;
      expect(drawer.closest('.sd-side-drawer-layer')?.parentElement).toBe(q('.main'));
      expect(drawer.classList).toContain('sd-side-drawer-contained');
      expect(drawer.getAttribute('role')).toBe('dialog');
      expect(drawer.getAttribute('aria-modal')).toBe('true');
      expect(drawer.getAttribute('aria-label')).toBe('Cover.jpg');
      expect(drawer.nextElementSibling?.classList).toContain('sd-side-drawer-backdrop-contained');
      expect(drawer.querySelector('.sd-side-drawer-footer-right .download-button')).not.toBeNull();
      expect(document.body.style.overflow).toBe(overflow);
      // Only the item area sits behind the backdrop; the header, the folder tree and the drawer stay usable.
      expect(q('.header')?.hasAttribute('inert')).toBeFalse();
      expect(q('.sidebar')?.closest('[inert]')).toBeNull();
      expect(q('.toolbar')?.hasAttribute('inert')).toBeTrue();
      expect(q('.heading-row')?.hasAttribute('inert')).toBeTrue();
      expect(q('.scroller')?.hasAttribute('inert')).toBeTrue();
      expect(drawer.closest('[inert]')).toBeNull();

      press(inDetail('.sd-side-drawer-close-btn'));
      expect(detail()).toBeNull();
      expect(q('.toolbar')?.hasAttribute('inert')).toBeFalse();
      expect(q('.scroller')?.hasAttribute('inert')).toBeFalse();
    });

    it('keeps the folder tree usable while the drawer is open; opening another folder closes the drawer', async () => {
      await setup();
      row('Cover.jpg').click();
      await settle();

      treeNode('Projects').querySelector<HTMLButtonElement>('button.toggle')?.click();
      await settle();
      expect(treeNames()).toContain('Website');
      expect(detail()).not.toBeNull();

      treeNode('Docs').click();
      await settle();
      expect(q('.heading')?.textContent?.trim()).toBe('Docs');
      expect(detail()).toBeNull();
    });

    it('keeps the search box usable while the drawer is open: Esc there clears the keyword before closing the drawer', async () => {
      await setup();
      row('Cover.jpg').click();
      await settle();
      const input = q<HTMLInputElement>('.search-input') as HTMLInputElement;
      input.focus();
      type(input, 'plan');
      expect(rowNames()).toEqual(['Plan.xlsx']);
      expect(detail()).not.toBeNull();

      keydown(input, 'Escape');
      expect(input.value).toBe('');
      expect(detail()).not.toBeNull();

      keydown(input, 'Escape');
      expect(detail()).toBeNull();
    });

    it('renders a Blob image through an object URL and revokes it when closing and when destroyed', async () => {
      const created: string[] = [];
      spyOn(URL, 'createObjectURL').and.callFake(() => {
        const url = `blob:test-${created.length}`;
        created.push(url);
        return url;
      });
      const revoke = spyOn(URL, 'revokeObjectURL');
      const blob = new Blob(['x'], { type: 'image/png' });
      await setup({
        preview: () => blob,
        list: () => [file('a', null, 'A.png', { mimeType: 'image/png' }), file('b', null, 'B.png')],
      });

      row('A.png').click();
      await settle();
      expect(inDetail('img')?.getAttribute('src')).toBe('blob:test-0');

      press(inDetail('.sd-side-drawer-close-btn'));
      expect(revoke).toHaveBeenCalledWith('blob:test-0');
      expect(detail()).toBeNull();

      row('B.png').click();
      await settle();
      expect(inDetail('img')?.getAttribute('src')).toBe('blob:test-1');
      fixture.destroy();
      expect(revoke).toHaveBeenCalledWith('blob:test-1');
    });

    it('uses string URLs as-is without creating or revoking object URLs', async () => {
      const create = spyOn(URL, 'createObjectURL').and.callThrough();
      const revoke = spyOn(URL, 'revokeObjectURL').and.callThrough();
      await setup({ preview: ({ item }) => `https://cdn.example/${item.id}.jpg` });
      row('Cover.jpg').click();
      await settle();
      expect(inDetail('img')?.getAttribute('src')).toBe('https://cdn.example/cover.jpg');
      press(inDetail('.sd-side-drawer-close-btn'));
      expect(create).not.toHaveBeenCalled();
      expect(revoke).not.toHaveBeenCalled();
    });

    it('falls back to the thumbnail, then to the "no preview" state, when no preview callback is given', async () => {
      await setup({
        list: () => [file('a', null, 'A.png', { thumbnailUrl: 'https://cdn.example/a-thumb.png' }), file('b', null, 'B.png')],
      });
      row('A.png').click();
      await settle();
      expect(inDetail('img')?.getAttribute('src')).toBe('https://cdn.example/a-thumb.png');
      press(inDetail('.sd-side-drawer-close-btn'));
      row('B.png').click();
      await settle();
      expect(inDetail('.placeholder-title')?.textContent?.trim()).toBe(t('preview.unavailable'));
    });

    it('shows a loading state and aborts the preview request when the drawer closes before it resolves', async () => {
      const pending: Deferred<string>[] = [];
      const signals: AbortSignal[] = [];
      await setup({
        preview: ({ signal }) => {
          signals.push(signal);
          const next = deferred<string>();
          pending.push(next);
          return next.promise;
        },
      });
      row('Cover.jpg').click();
      fixture.detectChanges();
      expect(inDetail('.spinner')).not.toBeNull();
      press(inDetail('.sd-side-drawer-close-btn'));
      expect(signals[0].aborted).toBeTrue();
      pending[0].resolve('https://late.example/cover.jpg');
      await settle();
      expect(detail()).toBeNull();

      row('Guide.pdf').click();
      fixture.detectChanges();
      expect(signals.length).toBe(2);
      expect(inDetail('.sd-side-drawer-title')?.textContent?.trim()).toBe('Guide.pdf');
    });

    it('shows preview errors and retries without emitting (open) again', async () => {
      let attempt = 0;
      const preview = jasmine
        .createSpy('preview')
        .and.callFake(() => (++attempt === 1 ? Promise.reject(new Error('Expired link')) : 'https://ok.example/c.jpg'));
      await setup({ preview });
      row('Cover.jpg').click();
      await settle();
      expect(inDetail('[role="alert"]')?.textContent).toContain('Expired link');
      press(inDetail('.retry-button'));
      await settle();
      expect(preview).toHaveBeenCalledTimes(2);
      expect(inDetail('img')?.getAttribute('src')).toBe('https://ok.example/c.jpg');
      expect(host.opened.length).toBe(1);
    });

    it('switches to the error state when the image fails to load', async () => {
      await setup({ preview: () => 'https://broken.example/x.jpg' });
      row('Cover.jpg').click();
      await settle();
      inDetail('img')?.dispatchEvent(new Event('error'));
      fixture.detectChanges();
      expect(inDetail('[role="alert"]')).not.toBeNull();
    });

    it('renders PDFs with the lazily imported sd-preview-pdf', async () => {
      await setup({ preview: () => new Blob(['%PDF-1.4'], { type: 'application/pdf' }) });
      row('Guide.pdf').click();
      await settle();
      expect(inDetail('.stage--pdf')).not.toBeNull();
      for (let i = 0; i < 20 && !inDetail('sd-preview-pdf'); i++) {
        await wait(50);
        fixture.detectChanges();
      }
      expect(inDetail('sd-preview-pdf')).not.toBeNull();
    });

    it('closes with Escape and the backdrop and moves focus back to the opener', async () => {
      await setup({ preview: () => null });
      const cover = row('Cover.jpg');
      cover.focus();
      cover.click();
      await settle();
      await wait(0);
      expect(detail()?.contains(document.activeElement)).toBeTrue();
      keydown(detail() as HTMLElement, 'Escape');
      expect(detail()).toBeNull();
      expect(document.activeElement).toBe(cover);

      row('Cover.jpg').click();
      await settle();
      q<HTMLElement>('.sd-side-drawer-backdrop')?.click();
      fixture.detectChanges();
      expect(detail()).toBeNull();
    });

    it('closes the preview when the list callback is replaced', async () => {
      await setup();
      row('Cover.jpg').click();
      await settle();
      expect(detail()).not.toBeNull();
      host.option.set({ list: listSpy() });
      await settle();
      expect(detail()).toBeNull();
    });

    it('lists metadata rows in the detail drawer', async () => {
      await setup();
      row('Guide.pdf').click();
      await settle();
      const rows = qa('.sd-side-drawer-active .meta-row').map(r => [
        r.querySelector('dt')?.textContent?.trim(),
        r.querySelector('dd')?.textContent?.trim(),
      ]);
      expect(rows).toEqual([
        [t('meta.name'), 'Guide.pdf'],
        [t('meta.type'), t('type.pdf')],
        [t('meta.size'), '2,4 MB'],
        [t('meta.modified'), t('today')],
      ]);
    });
  });

  describe('downloads', () => {
    it('saves a returned Blob under the item name and reports determinate progress', async () => {
      const clicks: HTMLAnchorElement[] = [];
      spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
        clicks.push(this);
      });
      const pending = deferred<Blob>();
      let args!: SdFileExplorerDownloadArgs;
      await setup({
        download: a => {
          args = a;
          return pending.promise;
        },
      });
      press(row('Guide.pdf').querySelector('.row-download'));
      expect(args.item.id).toBe('guide');
      expect(transferCards()).toEqual([{ name: 'Guide.pdf', status: t('transfers.status.preparing') }]);
      args.progress(34, 50);
      fixture.detectChanges();
      expect(transferCards()[0].status).toBe('68%');
      expect(q('.bar')?.getAttribute('aria-valuenow')).toBe('68');

      pending.resolve(new Blob(['pdf']));
      await settle();
      expect(clicks.length).toBe(1);
      expect(clicks[0].download).toBe('Guide.pdf');
      expect(clicks[0].href).toMatch(/^blob:/);
      expect(transferCards()[0].status).toBe(t('transfers.status.done'));
      expect(host.explorer().transfers()[0]).toEqual(jasmine.objectContaining({ status: 'done', percent: 100, handedOff: false }));
      // why: bấm download không được kéo theo mở preview.
      expect(host.opened).toEqual([]);
    });

    it('marks a download handed to the browser when the callback returns nothing, without a percentage', async () => {
      await setup({ download: () => undefined });
      press(row('Plan.xlsx').querySelector('.row-download'));
      await settle();
      expect(transferCards()[0].status).toBe(t('transfers.status.handed-off'));
      expect(host.explorer().transfers()[0].percent).toBeUndefined();
    });

    it('keeps Enter on a row download button from opening the file but lets Escape reach the explorer', async () => {
      await setup({ download: () => undefined });
      keydown(row('Guide.pdf').querySelector('.row-download button') as HTMLElement, 'Enter');
      expect(host.opened).toEqual([]);

      const input = q<HTMLInputElement>('.search-input') as HTMLInputElement;
      type(input, 'guide');
      keydown(row('Guide.pdf').querySelector('.row-download button') as HTMLElement, 'Escape');
      expect(input.value).toBe('');
    });

    it('keeps the bar indeterminate while progress arrives without a total', async () => {
      const pending = deferred<void>();
      let args!: SdFileExplorerDownloadArgs;
      await setup({
        download: a => {
          args = a;
          return pending.promise;
        },
      });
      press(row('Plan.xlsx').querySelector('.row-download'));
      args.progress(1000);
      fixture.detectChanges();
      expect(transferCards()[0].status).toBe(t('transfers.status.downloading'));
      expect(q('.bar')?.classList).toContain('bar--indeterminate');
      expect(q('.bar')?.getAttribute('aria-valuenow')).toBeNull();
      pending.resolve();
      await settle();
    });

    it('downloads from the detail drawer and hides download UI without a download callback', async () => {
      const download = jasmine.createSpy('download').and.returnValue(undefined);
      await setup({ download });
      row('Cover.jpg').click();
      await settle();
      press(inDetail('.download-button'));
      await settle();
      expect(download).toHaveBeenCalledTimes(1);
      fixture.destroy();

      await setup();
      expect(q('.cell--action')).toBeNull();
      row('Cover.jpg').click();
      await settle();
      expect(inDetail('.download-button')).toBeNull();
      // Both footer slots empty: sd-side-drawer hides its footer.
      expect(getComputedStyle(inDetail('.sd-side-drawer-footer') as HTMLElement).display).toBe('none');
    });
  });

  describe('uploads', () => {
    it('uploads picked files into the current folder and lists that folder again', async () => {
      const upload = jasmine.createSpy('upload').and.returnValue(Promise.resolve());
      await setup({ upload });
      row('Projects').click();
      await settle();
      const before = list()
        .calls.allArgs()
        .filter(([args]) => args.parentId === 'projects').length;
      pickFiles([new File(['a'], 'a.txt'), new File(['b'], 'b.txt')]);
      await settle();
      expect(upload).toHaveBeenCalledTimes(2);
      const first = upload.calls.argsFor(0)[0] as SdFileExplorerUploadArgs;
      expect(first.file.name).toBe('a.txt');
      expect(first.parentId).toBe('projects');
      expect(transferCards().map(card => card.status)).toEqual([t('transfers.status.done'), t('transfers.status.done')]);
      expect(
        list()
          .calls.allArgs()
          .filter(([args]) => args.parentId === 'projects').length
      ).toBeGreaterThan(before);
      expect(q('.transfers .title')?.textContent?.trim()).toBe(t('transfers.title', { count: 2 }));
    });

    it('runs at most three uploads at a time and starts queued ones as slots free up', async () => {
      const pending: Deferred<void>[] = [];
      const upload = jasmine.createSpy('upload').and.callFake(() => {
        const next = deferred<void>();
        pending.push(next);
        return next.promise;
      });
      await setup({ upload });
      pickFiles([1, 2, 3, 4].map(n => new File([String(n)], `${n}.txt`)));
      expect(upload).toHaveBeenCalledTimes(3);
      expect(transferCards()[3].status).toBe(t('transfers.status.queued'));
      pending[0].resolve();
      await settle();
      expect(upload).toHaveBeenCalledTimes(4);
      pending.slice(1).forEach(entry => entry.resolve());
      await settle();
    });

    it('marks failures with their message and retries them', async () => {
      let attempt = 0;
      const upload = jasmine
        .createSpy('upload')
        .and.callFake(() => (++attempt === 1 ? Promise.reject(new Error('Too large')) : Promise.resolve()));
      await setup({ upload });
      pickFiles([new File(['x'], 'big.bin')]);
      await settle();
      expect(transferCards()[0].status).toBe(t('transfers.status.error'));
      expect(q('.card .error')?.textContent?.trim()).toBe('Too large');
      q<HTMLButtonElement>(`[aria-label="${t('transfers.retry', { name: 'big.bin' })}"]`)?.click();
      await settle();
      expect(upload).toHaveBeenCalledTimes(2);
      expect(transferCards()[0].status).toBe(t('transfers.status.done'));
    });

    it('cancels an active upload by aborting its signal and frees its slot', async () => {
      const signals: AbortSignal[] = [];
      const upload = jasmine.createSpy('upload').and.callFake(({ signal }: SdFileExplorerUploadArgs) => {
        signals.push(signal);
        return new Promise<void>(() => undefined);
      });
      await setup({ upload });
      pickFiles([1, 2, 3, 4].map(n => new File([String(n)], `${n}.txt`)));
      q<HTMLButtonElement>(`[aria-label="${t('transfers.cancel', { name: '1.txt' })}"]`)?.click();
      fixture.detectChanges();
      expect(signals[0].aborted).toBeTrue();
      expect(transferCards()[0].status).toBe(t('transfers.status.cancelled'));
      expect(upload).toHaveBeenCalledTimes(4);
    });

    it('cancels queued uploads without calling the callback', async () => {
      const upload = jasmine.createSpy('upload').and.returnValue(new Promise<void>(() => undefined));
      await setup({ upload });
      pickFiles([1, 2, 3, 4].map(n => new File([String(n)], `${n}.txt`)));
      q<HTMLButtonElement>(`[aria-label="${t('transfers.cancel', { name: '4.txt' })}"]`)?.click();
      fixture.detectChanges();
      expect(transferCards()[3].status).toBe(t('transfers.status.cancelled'));
      expect(upload).toHaveBeenCalledTimes(3);
    });

    it('ignores progress reported after cancellation', async () => {
      let args!: SdFileExplorerUploadArgs;
      await setup({
        upload: a => {
          args = a;
          return new Promise<void>(() => undefined);
        },
      });
      pickFiles([new File(['x'], 'x.txt')]);
      q<HTMLButtonElement>(`[aria-label="${t('transfers.cancel', { name: 'x.txt' })}"]`)?.click();
      args.progress(5, 10);
      fixture.detectChanges();
      expect(host.explorer().transfers()[0].status).toBe('cancelled');
    });

    it('dismisses finished transfers one by one or all at once, and collapses the panel', async () => {
      await setup({ upload: () => undefined });
      pickFiles([new File(['a'], 'a.txt'), new File(['b'], 'b.txt'), new File(['c'], 'c.txt')]);
      await settle();
      q<HTMLButtonElement>(`[aria-label="${t('transfers.dismiss', { name: 'a.txt' })}"]`)?.click();
      fixture.detectChanges();
      expect(transferCards().map(card => card.name)).toEqual(['b.txt', 'c.txt']);

      const toggle = q<HTMLButtonElement>('.transfers .head .icon-button') as HTMLButtonElement;
      toggle.click();
      fixture.detectChanges();
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(q<HTMLElement>('.cards')?.hidden).toBeTrue();

      press(q('.transfers .clear-button'));
      expect(q('sd-file-explorer-transfer-panel')).toBeNull();
    });

    it('accepts dropped files, ignores dropped folders and shows the drop overlay while dragging', async () => {
      const upload = jasmine.createSpy('upload').and.returnValue(undefined);
      await setup({ upload });
      const transfer = new DataTransfer();
      transfer.items.add(new File(['d'], 'dropped.txt'));
      element().dispatchEvent(new DragEvent('dragenter', { dataTransfer: transfer, bubbles: true, cancelable: true }));
      fixture.detectChanges();
      expect(q('.drop-overlay')?.textContent).toContain(t('drop-title', { folder: t('root') }));
      element().dispatchEvent(new DragEvent('dragover', { dataTransfer: transfer, bubbles: true, cancelable: true }));
      element().dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
      await settle();
      expect(q('.drop-overlay')).toBeNull();
      expect(upload).toHaveBeenCalledTimes(1);
      expect((upload.calls.argsFor(0)[0] as SdFileExplorerUploadArgs).file.name).toBe('dropped.txt');
    });

    it('hides the overlay when the drag leaves and ignores drags without upload support', async () => {
      await setup({ upload: () => undefined });
      const transfer = new DataTransfer();
      transfer.items.add(new File(['d'], 'd.txt'));
      element().dispatchEvent(new DragEvent('dragenter', { dataTransfer: transfer, bubbles: true }));
      fixture.detectChanges();
      element().dispatchEvent(new DragEvent('dragleave', { dataTransfer: transfer, bubbles: true }));
      fixture.detectChanges();
      expect(q('.drop-overlay')).toBeNull();
      fixture.destroy();

      await setup();
      element().dispatchEvent(new DragEvent('dragenter', { dataTransfer: transfer, bubbles: true }));
      fixture.detectChanges();
      expect(q('.drop-overlay')).toBeNull();
      expect(q('.upload-button')).toBeNull();
    });
  });

  describe('create folder', () => {
    it('creates a folder in the current folder, closes the dialog and lists the folder again', async () => {
      const createFolder = jasmine.createSpy('createFolder').and.returnValue(Promise.resolve());
      await setup({ createFolder });
      row('Projects').click();
      await settle();
      press(q('.new-folder-button'));
      await settle();
      const input = q<HTMLInputElement>('.field-input') as HTMLInputElement;
      expect(document.activeElement).toBe(input);
      const submit = q<HTMLButtonElement>('.dialog .submit-button button') as HTMLButtonElement;
      expect(submit.disabled).toBeTrue();
      type(input, '  Drafts  ');
      expect(submit.disabled).toBeFalse();
      const calls = list().calls.count();
      submit.click();
      await settle();
      expect(createFolder).toHaveBeenCalledOnceWith({ parentId: 'projects', name: 'Drafts' });
      expect(q('.dialog')).toBeNull();
      expect(list().calls.count()).toBeGreaterThan(calls);
    });

    it('keeps the dialog open with the error message when creation fails', async () => {
      await setup({ createFolder: () => Promise.reject(new Error('Name taken')) });
      press(q('.new-folder-button'));
      await settle();
      type(q<HTMLInputElement>('.field-input') as HTMLInputElement, 'Docs');
      press(q('.dialog .submit-button'));
      await settle();
      expect(q('.field-error')?.textContent?.trim()).toBe('Name taken');
      expect(q('.field-input')?.getAttribute('aria-invalid')).toBe('true');
    });

    it('falls back to a generic message and closes with Cancel or Escape', async () => {
      await setup({ createFolder: () => Promise.reject({}) });
      press(q('.new-folder-button'));
      await settle();
      type(q<HTMLInputElement>('.field-input') as HTMLInputElement, 'X');
      press(q('.dialog .submit-button'));
      await settle();
      expect(q('.field-error')?.textContent?.trim()).toBe(t('create-folder-error'));
      keydown(q('.field-input') as HTMLElement, 'Escape');
      expect(q('.dialog')).toBeNull();

      // why: sd-button bỏ qua click lặp trong 300ms (throttle) — chờ rồi mới bấm lại chính nút đó.
      await wait(320);
      press(q('.new-folder-button'));
      await settle();
      press(q('.dialog .cancel-button'));
      expect(q('.dialog')).toBeNull();
    });

    it('has no "New folder" button without a createFolder callback', async () => {
      await setup();
      expect(q('.new-folder-button')).toBeNull();
    });
  });

  describe('share', () => {
    let restoreClipboard: (() => void) | null = null;

    // why: other specs may leave `navigator.clipboard` as an own data property, so spyOnProperty('get') is not
    // reliable in the full suite — define the property for one test and put the previous descriptor back.
    function stubClipboard(value: Pick<Clipboard, 'writeText'> | undefined): void {
      const own = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
      Object.defineProperty(navigator, 'clipboard', { configurable: true, get: () => value });
      restoreClipboard = () => {
        if (own) Object.defineProperty(navigator, 'clipboard', own);
        else delete (navigator as { clipboard?: unknown }).clipboard;
      };
    }

    afterEach(() => {
      restoreClipboard?.();
      restoreClipboard = null;
    });

    it('offers share actions for files only, and only with a share callback', async () => {
      await setup({ download: () => undefined });
      expect(q('.row-share')).toBeNull();
      row('Cover.jpg').click();
      await settle();
      expect(inDetail('.share-button')).toBeNull();
      fixture.destroy();

      await setup({ share: () => 'https://s.example/x' });
      expect(row('Guide.pdf').querySelector('.row-share')).not.toBeNull();
      expect(row('Projects').querySelector('.row-share')).toBeNull();
      row('Cover.jpg').click();
      await settle();
      // Share is the only footer action: it becomes the primary (filled) button.
      expect(inDetail('.sd-side-drawer-footer-right .share-button')).not.toBeNull();
    });

    it('creates the link, shows it trimmed and copies it to the clipboard without emitting (open)', async () => {
      const pending = deferred<string>();
      const share = jasmine.createSpy('share').and.returnValue(pending.promise);
      const writeText = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
      stubClipboard({ writeText });
      await setup({ share });

      press(row('Guide.pdf').querySelector('.row-share'));
      await settle();
      expect(share).toHaveBeenCalledTimes(1);
      expect(share.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ item: jasmine.objectContaining({ id: 'guide' }) }));
      expect(share.calls.mostRecent().args[0].signal).toEqual(jasmine.any(AbortSignal));
      expect(q('.dialog .share-status')?.textContent).toContain(t('share.loading'));
      expect(document.activeElement).toBe(q('.dialog'));

      pending.resolve('  https://s.example/guide  ');
      await settle();
      expect((q<HTMLInputElement>('.dialog .field-input') as HTMLInputElement).value).toBe('https://s.example/guide');
      expect(document.activeElement).toBe(q('.dialog .copy-button button'));

      press(q('.dialog .copy-button'));
      await settle();
      expect(writeText).toHaveBeenCalledOnceWith('https://s.example/guide');
      expect(q('.share-feedback')?.textContent?.trim()).toBe(t('share.copied'));
      expect(host.opened).toEqual([]);
    });

    it('selects the link and asks for a manual copy when the clipboard cannot be used', async () => {
      stubClipboard(undefined);
      spyOn(document, 'execCommand').and.returnValue(false);
      await setup({ share: () => 'https://s.example/a' });
      press(row('Guide.pdf').querySelector('.row-share'));
      await settle();
      press(q('.dialog .copy-button'));
      await settle();
      expect(document.activeElement).toBe(q('.dialog .field-input'));
      expect(q('.share-feedback')?.textContent?.trim()).toBe(t('share.copy-manual'));
    });

    it('shows failures, retries, and treats a result that is not a link as a failure', async () => {
      let attempt = 0;
      const share = jasmine.createSpy('share').and.callFake(() => {
        attempt++;
        if (attempt === 1) return Promise.reject(new Error('Quota exceeded'));
        if (attempt === 2) return 42 as unknown as string;
        return 'https://s.example/ok';
      });
      await setup({ share });
      press(row('Guide.pdf').querySelector('.row-share'));
      await settle();
      expect(q('.dialog .field-error')?.textContent?.trim()).toBe('Quota exceeded');

      press(q('.dialog .retry-button'));
      await settle();
      expect(q('.dialog .field-error')?.textContent?.trim()).toBe(t('share.error'));

      press(q('.dialog .retry-button'));
      await settle();
      expect((q<HTMLInputElement>('.dialog .field-input') as HTMLInputElement).value).toBe('https://s.example/ok');
      expect(share).toHaveBeenCalledTimes(3);
    });

    it('aborts the request when the dialog closes and gives focus back to the share button', async () => {
      const signals: AbortSignal[] = [];
      await setup({
        share: ({ signal }) => {
          signals.push(signal);
          return new Promise<string>(() => undefined);
        },
      });
      const shareButton = row('Guide.pdf').querySelector('.row-share button') as HTMLButtonElement;
      shareButton.focus();
      press(shareButton);
      await settle();
      press(q('.dialog .close-button'));
      await settle();
      expect(signals[0].aborted).toBeTrue();
      expect(q('.dialog')).toBeNull();
      expect(document.activeElement).toBe(shareButton);
    });

    it('closes the dialog with Escape', async () => {
      await setup({ share: () => 'https://s.example/a' });
      press(row('Guide.pdf').querySelector('.row-share'));
      await settle();
      keydown(q('.dialog') as HTMLElement, 'Escape');
      expect(q('.dialog')).toBeNull();
    });

    it('shares from the detail drawer, keeps the drawer inert under the dialog and focuses it again afterwards', async () => {
      await setup({ share: () => 'https://s.example/cover', download: () => undefined });
      row('Cover.jpg').click();
      await settle();
      await wait(0);
      const shareButton = inDetail('.share-button button') as HTMLButtonElement;
      shareButton.focus();
      press(shareButton);
      await settle();
      expect(detail()?.closest('[inert]')).not.toBeNull();
      expect((q<HTMLInputElement>('.dialog .field-input') as HTMLInputElement).value).toBe('https://s.example/cover');

      keydown(q('.dialog') as HTMLElement, 'Escape');
      await settle();
      expect(q('.dialog')).toBeNull();
      expect(detail()).not.toBeNull();
      expect(detail()?.closest('[inert]')).toBeNull();
      expect(document.activeElement).toBe(shareButton);
    });
  });

  describe('compact layout', () => {
    it('switches to the compact layout in a narrow container and toggles the folder panel', async () => {
      await setup({ upload: () => undefined, title: 'Files' }, 390);
      await wait(50);
      fixture.detectChanges();
      expect(element().classList).toContain('sd-file-explorer--compact');
      expect(q('.cell--modified')).toBeNull();
      expect(q('.upload-button button')?.getAttribute('aria-label')).toBe(t('upload'));
      expect(q('aside.sidebar')?.hasAttribute('inert')).toBeTrue();

      const menu = q<HTMLButtonElement>('.toolbar .icon-button') as HTMLButtonElement;
      menu.click();
      fixture.detectChanges();
      expect(menu.getAttribute('aria-expanded')).toBe('true');
      expect(q('aside.sidebar')?.classList).toContain('sidebar--open');
      expect(q('aside.sidebar')?.hasAttribute('inert')).toBeFalse();

      treeNode('Projects').click();
      await settle();
      expect(q('aside.sidebar')?.classList).not.toContain('sidebar--open');
      expect(q('.heading')?.textContent?.trim()).toBe('Projects');
    });

    it('closes the folder panel with the scrim and Escape', async () => {
      await setup({}, 390);
      await wait(50);
      fixture.detectChanges();
      q<HTMLButtonElement>('.toolbar .icon-button')?.click();
      fixture.detectChanges();
      q<HTMLElement>('.scrim--sidebar')?.click();
      fixture.detectChanges();
      expect(q('aside.sidebar')?.classList).not.toContain('sidebar--open');
      q<HTMLButtonElement>('.toolbar .icon-button')?.click();
      fixture.detectChanges();
      keydown(element(), 'Escape');
      expect(q('aside.sidebar')?.classList).not.toContain('sidebar--open');
    });

    it('leaves the compact layout when the container grows', async () => {
      await setup({}, 390);
      await wait(50);
      fixture.detectChanges();
      host.width.set(1100);
      fixture.detectChanges();
      await wait(50);
      fixture.detectChanges();
      expect(element().classList).not.toContain('sd-file-explorer--compact');
    });
  });

  describe('autoId and teardown', () => {
    it('emits derived data-autoid attributes', async () => {
      await setup({
        autoId: 'drive',
        upload: () => undefined,
        createFolder: () => undefined,
        download: () => undefined,
        share: () => 'https://s.example/x',
      });
      expect(element().getAttribute('data-autoid')).toBe('components-file-explorer-drive');
      expect(q('[data-autoid="components-file-explorer-drive-search"]')).not.toBeNull();
      expect(q('[data-autoid="components-file-explorer-drive-upload"]')).not.toBeNull();
      expect(q('[data-autoid="components-file-explorer-drive-new-folder"]')).not.toBeNull();
      expect(q('[data-autoid="components-file-explorer-drive-tree-root"]')).not.toBeNull();
      expect(q('[data-autoid="components-file-explorer-drive-tree-projects"]')).not.toBeNull();
      expect(q('[data-autoid="components-file-explorer-drive-item-guide"]')).not.toBeNull();
      expect(q('[data-autoid="components-file-explorer-drive-item-guide-download"]')).not.toBeNull();
      expect(q('[data-autoid="components-file-explorer-drive-item-guide-share"]')).not.toBeNull();

      row('Cover.jpg').click();
      await settle();
      expect(detail()?.getAttribute('data-autoid')).toBe('components-side-drawer-file-explorer-drive-preview');
      expect(inDetail('[data-autoid="components-file-explorer-drive-preview"]')).not.toBeNull();
      expect(inDetail('[data-autoid="components-file-explorer-drive-preview-share"]')).not.toBeNull();
      expect(inDetail('[data-autoid="components-file-explorer-drive-preview-download"]')).not.toBeNull();
    });

    it('aborts in-flight listings and transfers when destroyed', async () => {
      const listSignals: AbortSignal[] = [];
      const uploadSignals: AbortSignal[] = [];
      await setup({
        list: ({ parentId, signal }) => {
          if (parentId === null) return [folder('slow', null, 'Slow')];
          listSignals.push(signal);
          return new Promise(() => undefined);
        },
        upload: ({ signal }) => {
          uploadSignals.push(signal);
          return new Promise<void>(() => undefined);
        },
      });
      row('Slow').click();
      fixture.detectChanges();
      pickFiles([new File(['x'], 'x.txt')]);
      fixture.destroy();
      expect(listSignals[0].aborted).toBeTrue();
      expect(uploadSignals[0].aborted).toBeTrue();
    });
  });
});
