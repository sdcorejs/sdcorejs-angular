import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { I18N_STORAGE_KEY, I18nService } from '@sdcorejs/angular/i18n';
import { SdFileExplorer } from './file-explorer.component';
import { SdButton } from '@sdcorejs/angular/components/button';
import type {
  SdFileExplorerCommand,
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
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
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

/** Polls with change detection until `check` passes, for content rendered after a lazy import. */
async function waitFor(check: () => boolean, tries = 60): Promise<void> {
  for (let i = 0; i < tries && !check(); i++) {
    await wait(50);
    fixture.detectChanges();
  }
}

const ids = (items: readonly SdFileExplorerItem[]): string[] => items.map(entry => entry.id);

function card(name: string): HTMLElement {
  const match = qa('.card').find(node => node.querySelector('.card-name')?.textContent?.trim() === name);
  if (!match) throw new Error(`card "${name}" not found`);
  return match;
}

/** Selection checkbox of a list row or a grid card. */
function selectBox(name: string, view: 'list' | 'grid' = 'list'): HTMLInputElement {
  const input = (view === 'list' ? row(name) : card(name)).querySelector<HTMLInputElement>('.select input[type="checkbox"]');
  if (!input) throw new Error(`no selection checkbox for "${name}"`);
  return input;
}

function selectAllBox(): HTMLInputElement {
  const input = q<HTMLInputElement>('.select-all input[type="checkbox"]');
  if (!input) throw new Error('select-all checkbox not rendered');
  return input;
}

function toggle(input: HTMLInputElement): void {
  input.click();
  fixture.detectChanges();
}

/** Number stated in the band; `'0'` while the band states no number (nothing selected). */
function selectionCount(): string {
  return q('.selection-count')?.textContent?.trim() ?? '0';
}

function selectionStatus(): string {
  return q('.selection-status')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

/** `<sd-button>` hosts of an action area: row / card commands, tree commands or selector actions. */
function actionButtons(host: Element | null, area = '.commands'): HTMLElement[] {
  return Array.from(host?.querySelectorAll<HTMLElement>(`${area} > sd-button`) ?? []);
}

function selectionActions(): HTMLElement[] {
  return actionButtons(q('.selection'), '.selection-actions');
}

function nativeButton(host: Element): HTMLButtonElement {
  const button = host.querySelector('button');
  if (!button) throw new Error('native button not found');
  return button;
}

function accessibleNames(hosts: HTMLElement[]): (string | null)[] {
  return hosts.map(entry => nativeButton(entry).getAttribute('aria-label'));
}

/** Open action popover — rendered by sd-button in a CDK overlay outside the explorer. */
function menu(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.sd-action-popover');
}

function menuItems(): HTMLButtonElement[] {
  return Array.from(menu()?.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]') ?? []);
}

function menuLabels(): string[] {
  return menuItems().map(entry => entry.querySelector('.sd-action-label')?.textContent?.replace(/\s+/g, ' ').trim() ?? '');
}

/** Explorer in the compact layout: the ResizeObserver has reported the narrow width. */
async function setupCompact(option: Partial<SdFileExplorerOption> = {}, width = 390): Promise<HTMLElement> {
  await setup(option, width);
  await wait(50);
  await settle();
  return element();
}

/** The compact command drawer — a Core sd-side-drawer portalled to <body> — while it is open, or null. */
function commandDrawer(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.sd-file-explorer-command-drawer.sd-side-drawer-active');
}

function commandEntries(): HTMLButtonElement[] {
  return Array.from(commandDrawer()?.querySelectorAll<HTMLButtonElement>('button.command') ?? []);
}

function commandLabels(): string[] {
  return commandEntries().map(entry => entry.querySelector('.command-label')?.textContent?.replace(/\s+/g, ' ').trim() ?? '');
}

function closeCommandDrawer(): void {
  press(commandDrawer()?.querySelector('.sd-side-drawer-close-btn'));
}

/** Native button of the compact actions trigger of a row, card or tree node. */
function menuTrigger(target: Element): HTMLButtonElement {
  const button = target.querySelector<HTMLButtonElement>('.sd-file-explorer-menu-trigger button');
  if (!button) throw new Error('actions trigger not found');
  return button;
}

async function openCommandsOf(target: Element): Promise<HTMLButtonElement> {
  const trigger = menuTrigger(target);
  trigger.click();
  await settle();
  return trigger;
}

/** Pretends the primary pointer is a finger: `(pointer: coarse)` matches, every other query keeps its real answer. */
function emulateTouch(): void {
  const real = window.matchMedia.bind(window);
  const coarse = {
    matches: true,
    media: '(pointer: coarse)',
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  } as MediaQueryList;
  spyOn(window, 'matchMedia').and.callFake((query: string) => (query === '(pointer: coarse)' ? coarse : real(query)));
}

/** `[r, g, b]` (0–255, rounded) of a computed color: `rgb(…)`, or the `color(srgb …)` Chrome reports for `color-mix()`. */
function rgbOf(value: string): number[] {
  const srgb = /^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/.exec(value);
  if (srgb) return srgb.slice(1, 4).map(part => Math.round(Number(part) * 255));
  const rgb = /^rgba?\(([\d.]+), ([\d.]+), ([\d.]+)/.exec(value);
  if (rgb) return rgb.slice(1, 4).map(part => Math.round(Number(part)));
  throw new Error(`unparsed color ${value}`);
}

/** Each channel within 1 of the expected value (`color-mix()` rounding). */
function closeTo(actual: number[], expected: number[]): boolean {
  return actual.length === expected.length && actual.every((channel, i) => Math.abs(channel - expected[i]) <= 1);
}

function overlaps(a: Element, b: Element): boolean {
  const first = a.getBoundingClientRect();
  const second = b.getBoundingClientRect();
  return first.left < second.right && second.left < first.right && first.top < second.bottom && second.top < first.bottom;
}

const BUTTON_TYPES = ['fill', 'light', 'outline', 'text'];
const BUTTON_COLORS = ['primary', 'secondary', 'info', 'success', 'warning', 'error', 'black'];

/** `type color` as rendered: sd-button puts `c-<type>` on its native button, Material puts `mat-<color>`. */
function variantOf(host: HTMLElement): string {
  const classes = nativeButton(host).classList;
  const type = BUTTON_TYPES.find(name => classes.contains(`c-${name}`));
  const color = BUTTON_COLORS.find(name => classes.contains(`mat-${name}`));
  return `${type} ${color}`;
}

/** Rendered height, icon width and font size of an sd-button. */
function buttonMetrics(host: HTMLElement): [number, number, string] {
  const button = nativeButton(host);
  const icon = button.querySelector('sd-icon') as HTMLElement;
  return [
    Math.round(button.getBoundingClientRect().height),
    Math.round(icon.getBoundingClientRect().width),
    getComputedStyle(button).fontSize,
  ];
}

// ---------------------------------------------------------------------------
// Specs
// ---------------------------------------------------------------------------

describe('SdFileExplorer', () => {
  beforeEach(() => {
    // why: I18nService reads the language saved in localStorage first, and other specs (i18n.service.spec) can leave
    // 'en' there; these specs expect the default Vietnamese catalog whatever ran before them.
    localStorage.removeItem(I18N_STORAGE_KEY);
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

    it('formats sizes with I18nService.locale()', async () => {
      // why: language() stays 'vi' here, so only an explorer that reads locale() switches to the English format.
      Object.defineProperty(i18n, 'locale', { value: signal('en-US') });
      await setup();
      expect(row('Guide.pdf').querySelector('.cell--size')?.textContent?.trim()).toBe('2.4 MB');
      expect(row('Plan.xlsx').querySelector('.cell--size')?.textContent?.trim()).toBe('846 KB');
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

    it('renders videos with the lazily imported sd-preview-video and keeps Download in the drawer footer', async () => {
      const preview = jasmine
        .createSpy('preview')
        .and.callFake(({ item }: { item: SdFileExplorerItem }) => `https://cdn.example/${item.id}.mp4`);
      await setup({
        autoId: 'drive',
        preview,
        download: () => new Blob(['v']),
        list: () => [file('clip', null, 'Clip.mp4', { mimeType: 'video/mp4' })],
      });
      row('Clip.mp4').click();
      await settle();
      expect(preview).toHaveBeenCalledTimes(1);
      expect(inDetail('.stage--video')).not.toBeNull();
      await waitFor(() => !!inDetail('sd-preview-video video'));
      const video = inDetail<HTMLVideoElement>('sd-preview-video video');
      expect(video?.getAttribute('src')).toBe('https://cdn.example/clip.mp4');
      expect(video?.getAttribute('aria-label')).toBe('Clip.mp4');
      expect(video?.autoplay).toBeFalse();
      expect(inDetail('sd-preview-video')?.getAttribute('data-autoId')).toBe('components-preview-video-file-explorer-drive-preview');
      // why: the explorer footer owns Download (option.download), so the player hides its own button.
      expect(inDetail('.sd-preview-video-actions')).toBeNull();
      expect(inDetail('.download-button')).not.toBeNull();
      expect(inDetail('.placeholder-title')).toBeNull();
    });

    it('hands Blob videos to sd-preview-video, which creates and revokes the object URL', async () => {
      const created: string[] = [];
      spyOn(URL, 'createObjectURL').and.callFake(() => {
        const url = `blob:video-${created.length}`;
        created.push(url);
        return url;
      });
      const revoke = spyOn(URL, 'revokeObjectURL');
      await setup({ preview: () => new Blob(['v'], { type: 'video/mp4' }), list: () => [file('clip', null, 'Clip.webm')] });
      row('Clip.webm').click();
      await settle();
      await waitFor(() => !!inDetail('sd-preview-video video'));
      expect(created).toEqual(['blob:video-0']);
      expect(inDetail('sd-preview-video video')?.getAttribute('src')).toBe('blob:video-0');
      press(inDetail('.sd-side-drawer-close-btn'));
      expect(revoke).toHaveBeenCalledWith('blob:video-0');
    });

    it('refuses unsafe video URLs through the sd-preview-video guard', async () => {
      await setup({ preview: () => 'javascript:alert(1)', list: () => [file('clip', null, 'Clip.mov')] });
      row('Clip.mov').click();
      await settle();
      await waitFor(() => !!inDetail('sd-preview-video'));
      expect(inDetail('sd-preview-video video')).toBeNull();
      expect(inDetail('sd-preview-video [role="alert"]')).not.toBeNull();
    });

    it('shows the "no preview" state for videos when no preview callback is given', async () => {
      await setup({ list: () => [file('clip', null, 'Clip.mp4')] });
      row('Clip.mp4').click();
      await settle();
      expect(inDetail('sd-preview-video')).toBeNull();
      expect(inDetail('.placeholder-title')?.textContent?.trim()).toBe(t('preview.unavailable'));
    });

    it('lets the video stage grow with the player instead of shrinking it in the flex detail layout', async () => {
      await setup({ preview: () => 'https://cdn.example/clip.mp4', list: () => [file('clip', null, 'Clip.mp4')] });
      row('Clip.mp4').click();
      await settle();
      await waitFor(() => !!inDetail('sd-preview-video'));
      const stage = inDetail<HTMLElement>('.stage--video') as HTMLElement;
      // why: a portrait video, or one in a wide compact drawer, is taller than the 216 px stage basis that
      // images and PDFs shrink from; clipping it would hide the native controls.
      (inDetail<HTMLElement>('sd-preview-video') as HTMLElement).style.height = '400px';
      fixture.detectChanges();
      expect(getComputedStyle(stage).flexShrink).toBe('0');
      expect(stage.getBoundingClientRect().height).toBeGreaterThanOrEqual(400);
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

  describe('selection', () => {
    it('offers a named checkbox for every file but none for folders, plus a header-only select-all checkbox', async () => {
      await setup({ selector: { disabled: entry => entry.id === 'memo' } });
      expect(row('Projects').querySelector('.select')).toBeNull();
      expect(row('Docs').querySelector('.select')).toBeNull();
      expect(selectBox('Guide.pdf').getAttribute('aria-label')).toBe(t('selection.select-item', { name: 'Guide.pdf' }));
      expect(selectBox('Memo.docx').disabled).toBeTrue();

      const all = selectAllBox();
      const header = all.closest('[role="columnheader"]') as HTMLElement;
      expect(header).not.toBeNull();
      expect(header.textContent?.trim()).toBe('');
      // Three files can be selected: the disabled Memo.docx is not counted.
      expect(all.getAttribute('aria-label')).toBe(t('selection.select-all', { count: 3 }));
      expect(q('.selection')?.contains(all)).toBeFalse();
    });

    it('counts selected files in the band, marks the header mixed and reports every toggle to onSelect', async () => {
      const onSelect = jasmine.createSpy('onSelect');
      const data = tree();
      await setup({ list: listSpy(data), selector: { onSelect } });
      expect(q('.selection-count')).toBeNull();
      expect(selectionStatus()).toBe(t('selection.none'));
      expect(q<HTMLButtonElement>('.selection-clear')?.disabled).toBeTrue();

      toggle(selectBox('Plan.xlsx'));
      expect(selectionStatus()).toBe(t('selection.selected-one', { count: 1 }));
      expect(selectionCount()).toBe('1');
      expect(row('Plan.xlsx').classList).toContain('row--selected');
      expect(selectAllBox().getAttribute('aria-checked')).toBe('mixed');
      expect(onSelect).toHaveBeenCalledTimes(1);
      const [toggled, first] = onSelect.calls.mostRecent().args;
      expect(toggled).toBe(data['root'][2]);
      expect(ids(first)).toEqual(['plan']);
      expect(Object.isFrozen(first)).toBeTrue();

      toggle(selectBox('Guide.pdf'));
      expect(selectionStatus()).toBe(t('selection.selected', { count: 2 }));
      // Display order, not click order.
      expect(ids(onSelect.calls.mostRecent().args[1])).toEqual(['guide', 'plan']);

      toggle(selectBox('Plan.xlsx'));
      expect(onSelect.calls.mostRecent().args[0].id).toBe('plan');
      expect(ids(onSelect.calls.mostRecent().args[1])).toEqual(['guide']);
      expect(row('Plan.xlsx').classList).not.toContain('row--selected');
      expect(onSelect).toHaveBeenCalledTimes(3);
    });

    it('selects every visible enabled file from the header with one onSelectAll, and deselects them the same way', async () => {
      const onSelect = jasmine.createSpy('onSelect');
      const onSelectAll = jasmine.createSpy('onSelectAll');
      await setup({ selector: { disabled: entry => entry.id === 'cover', onSelect, onSelectAll } });
      toggle(selectBox('Plan.xlsx'));
      toggle(selectAllBox());
      expect(onSelectAll).toHaveBeenCalledTimes(1);
      expect(ids(onSelectAll.calls.mostRecent().args[0])).toEqual(['guide', 'plan', 'memo']);
      expect(selectAllBox().checked).toBeTrue();
      expect(selectAllBox().getAttribute('aria-checked')).toBeNull();
      expect(selectBox('Cover.jpg').checked).toBeFalse();
      expect(selectionStatus()).toBe(t('selection.selected', { count: 3 }));

      toggle(selectAllBox());
      expect(onSelectAll).toHaveBeenCalledTimes(2);
      expect(onSelectAll.calls.mostRecent().args[0]).toEqual([]);
      expect(selectAllBox().checked).toBeFalse();
      expect(selectionCount()).toBe('0');
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('clears the selection from the band with one onClear and gives focus back to the header checkbox', async () => {
      const onClear = jasmine.createSpy('onClear');
      await setup({ selector: { onClear } });
      toggle(selectBox('Guide.pdf'));
      toggle(selectBox('Memo.docx'));
      const clear = q<HTMLButtonElement>('.selection-clear') as HTMLButtonElement;
      expect(clear.getAttribute('aria-label')).toBe(t('selection.clear'));
      clear.focus();
      clear.click();
      await settle();
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(selectionCount()).toBe('0');
      expect(selectBox('Guide.pdf').checked).toBeFalse();
      expect(clear.disabled).toBeTrue();
      expect(document.activeElement).toBe(selectAllBox());
    });

    it('keeps the selection when switching between list and grid and while a file preview is open', async () => {
      await setup({ selector: {}, preview: () => null });
      toggle(selectBox('Guide.pdf'));
      toggle(selectBox('Memo.docx'));
      qa<HTMLButtonElement>('.icon-button--toggle')[1].click();
      fixture.detectChanges();
      expect(selectBox('Guide.pdf', 'grid').checked).toBeTrue();
      expect(selectBox('Memo.docx', 'grid').checked).toBeTrue();
      expect(card('Guide.pdf').classList).toContain('card--selected');
      expect(selectAllBox().getAttribute('aria-checked')).toBe('mixed');

      card('Cover.jpg').click();
      await settle();
      expect(detail()).not.toBeNull();
      expect(selectionCount()).toBe('2');
      press(inDetail('.sd-side-drawer-close-btn'));
      qa<HTMLButtonElement>('.icon-button--toggle')[0].click();
      fixture.detectChanges();
      expect(selectBox('Guide.pdf').checked).toBeTrue();
      expect(selectionStatus()).toBe(t('selection.selected', { count: 2 }));
    });

    it('clears the selection with exactly one onClear when the folder, the keyword, the list callback or reload() changes', async () => {
      const onClear = jasmine.createSpy('onClear');
      await setup({ selector: { onClear } });
      toggle(selectBox('Guide.pdf'));
      row('Projects').click();
      await settle();
      expect(onClear).toHaveBeenCalledTimes(1);
      q<HTMLButtonElement>('sd-breadcrumb button')?.click();
      await settle();
      expect(selectBox('Guide.pdf').checked).toBeFalse();
      // Nothing was selected any more, so leaving and coming back clears nothing.
      expect(onClear).toHaveBeenCalledTimes(1);

      toggle(selectBox('Guide.pdf'));
      const input = q<HTMLInputElement>('.search-input') as HTMLInputElement;
      type(input, 'g');
      expect(onClear).toHaveBeenCalledTimes(2);
      expect(selectionCount()).toBe('0');
      toggle(selectBox('Guide.pdf'));
      type(input, 'g ');
      expect(onClear).toHaveBeenCalledTimes(2);
      expect(selectionCount()).toBe('1');
      q<HTMLButtonElement>('.search-clear')?.click();
      fixture.detectChanges();
      expect(onClear).toHaveBeenCalledTimes(3);

      toggle(selectBox('Plan.xlsx'));
      host.explorer().reload();
      fixture.detectChanges();
      expect(onClear).toHaveBeenCalledTimes(4);
      await settle();
      expect(selectionCount()).toBe('0');

      toggle(selectBox('Plan.xlsx'));
      host.option.update(option => ({ ...option, list: listSpy() }));
      await settle();
      expect(onClear).toHaveBeenCalledTimes(5);
      expect(selectBox('Plan.xlsx').checked).toBeFalse();
    });

    it('clears once when a folder is opened from search results, although the keyword is cleared as well', async () => {
      const onClear = jasmine.createSpy('onClear');
      await setup({ selector: { onClear }, search: () => [folder('web', 'projects', 'Website'), file('sitemap', 'web', 'Sitemap.pdf')] });
      type(q<HTMLInputElement>('.search-input') as HTMLInputElement, 'site');
      await wait(350);
      await settle();
      toggle(selectBox('Sitemap.pdf'));
      row('Website').click();
      await settle();
      expect(q('.heading')?.textContent?.trim()).toBe('Website');
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('does not bring a selection back when the late listing of a folder the user left arrives', async () => {
      const onClear = jasmine.createSpy('onClear');
      const late = deferred<SdFileExplorerItem[]>();
      const data = tree();
      await setup({
        selector: { onClear },
        list: ({ parentId }) => (parentId === 'projects' ? late.promise : [...(data[parentId ?? 'root'] ?? [])]),
      });
      toggle(selectBox('Guide.pdf'));
      row('Projects').click();
      fixture.detectChanges();
      expect(q('.selection')).toBeNull();
      q<HTMLButtonElement>('sd-breadcrumb button')?.click();
      await settle();
      late.resolve([file('brief', 'projects', 'Brief.docx')]);
      await settle();
      expect(q('.heading')?.textContent?.trim()).toBe(t('root'));
      expect(selectBox('Guide.pdf').checked).toBeFalse();
      expect(selectionCount()).toBe('0');
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('drops files that a refresh no longer lists from the selection handed to actions', async () => {
      const move = jasmine.createSpy('move');
      const data = tree();
      await setup({ list: listSpy(data), upload: () => undefined, selector: { actions: [{ title: 'Move', click: move }] } });
      toggle(selectBox('Guide.pdf'));
      toggle(selectBox('Plan.xlsx'));
      data['root'] = data['root'].filter(entry => entry.id !== 'plan');
      // A finished upload lists the current folder again without changing the scope.
      pickFiles([new File(['x'], 'x.txt')]);
      await settle();
      expect(rowNames()).not.toContain('Plan.xlsx');
      expect(selectionStatus()).toBe(t('selection.selected-one', { count: 1 }));
      press(selectionActions()[0]);
      expect(ids(move.calls.mostRecent().args[0])).toEqual(['guide']);
    });

    it('drops a file that becomes disabled and does not select it again when it is enabled again', async () => {
      const locked = signal<ReadonlySet<string>>(new Set());
      const onSelect = jasmine.createSpy('onSelect');
      const onClear = jasmine.createSpy('onClear');
      const move = jasmine.createSpy('move');
      await setup({
        selector: { disabled: entry => locked().has(entry.id), onSelect, onClear, actions: [{ title: 'Move', click: move }] },
      });
      toggle(selectBox('Guide.pdf'));
      toggle(selectBox('Plan.xlsx'));
      locked.set(new Set(['guide']));
      await settle();
      expect(selectBox('Guide.pdf').disabled).toBeTrue();
      expect(selectionStatus()).toBe(t('selection.selected-one', { count: 1 }));

      locked.set(new Set());
      await settle();
      expect(selectBox('Guide.pdf').checked).toBeFalse();
      expect(selectionStatus()).toBe(t('selection.selected-one', { count: 1 }));
      press(selectionActions()[0]);
      expect(ids(move.calls.mostRecent().args[0])).toEqual(['plan']);
      // Leaving the selection is neither a checkbox toggle nor a clear: no callback.
      expect(onSelect).toHaveBeenCalledTimes(2);
      expect(onClear).not.toHaveBeenCalled();
      // The file still selected is cleared, once, when the folder changes.
      row('Projects').click();
      await settle();
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('does not select a file again when a refresh drops it and a later refresh lists it again', async () => {
      const onClear = jasmine.createSpy('onClear');
      const data = tree();
      await setup({ list: listSpy(data), upload: () => undefined, selector: { onClear } });
      toggle(selectBox('Plan.xlsx'));
      const plan = data['root'][2];
      data['root'] = data['root'].filter(entry => entry.id !== 'plan');
      pickFiles([new File(['a'], 'a.txt')]);
      await settle();
      expect(rowNames()).not.toContain('Plan.xlsx');
      expect(selectionCount()).toBe('0');

      data['root'] = [...data['root'], plan];
      pickFiles([new File(['b'], 'b.txt')]);
      await settle();
      expect(selectBox('Plan.xlsx').checked).toBeFalse();
      expect(selectionCount()).toBe('0');
      // Nothing is selected any more, so changing the folder has nothing to clear.
      row('Projects').click();
      await settle();
      expect(onClear).not.toHaveBeenCalled();
    });

    it('keeps checkboxes and names apart: a checkbox never opens the file and opening a file never changes the selection', async () => {
      const onSelect = jasmine.createSpy('onSelect');
      await setup({ selector: { onSelect }, preview: () => null });
      toggle(selectBox('Guide.pdf'));
      (row('Plan.xlsx').querySelector('.cell--select') as HTMLElement).click();
      for (const key of ['Enter', ' ']) expect(keydown(selectBox('Plan.xlsx'), key).defaultPrevented).toBeFalse();
      fixture.detectChanges();
      expect(host.opened).toEqual([]);
      expect(detail()).toBeNull();

      row('Cover.jpg').click();
      await settle();
      expect(host.opened.map(event => event.item.id)).toEqual(['cover']);
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(selectionStatus()).toBe(t('selection.selected-one', { count: 1 }));
    });

    it('selects from grid cards, whose header checkbox lines up with the card checkboxes', async () => {
      await setup({ defaultView: 'grid', selector: {}, preview: () => null });
      expect(card('Projects').querySelector('.select')).toBeNull();
      const all = selectAllBox();
      const head = all.closest('.grid-head') as HTMLElement;
      expect(head).not.toBeNull();
      expect(head.textContent?.trim()).toBe('');
      expect(all.getAttribute('aria-label')).toBe(t('selection.select-all', { count: 4 }));
      const gridLeft = (q('.grid') as HTMLElement).getBoundingClientRect().left;
      const firstColumn = qa<HTMLInputElement>('.card .select input').find(
        input => Math.abs((input.closest('.card') as HTMLElement).getBoundingClientRect().left - gridLeft) < 1
      );
      expect(firstColumn).withContext('a file card in the first grid column').toBeDefined();
      expect(Math.abs(all.getBoundingClientRect().left - (firstColumn as HTMLInputElement).getBoundingClientRect().left)).toBeLessThan(2);

      const box = selectBox('Cover.jpg', 'grid');
      toggle(box);
      expect(card('Cover.jpg').classList).toContain('card--selected');
      expect(host.opened).toEqual([]);
      card('Cover.jpg').click();
      await settle();
      expect(host.opened.map(event => event.item.id)).toEqual(['cover']);
    });

    it('names the selection with tệp in Vietnamese and file in English, and puts the number where each language does', async () => {
      await setup({ selector: {} });
      expect(selectionStatus()).toContain('tệp');
      toggle(selectBox('Guide.pdf'));
      toggle(selectBox('Plan.xlsx'));
      expect(selectionStatus()).toBe('2 tệp đã chọn');
      fixture.destroy();

      // why: setLanguage persists the choice; keep it out of localStorage so later specs still start in Vietnamese.
      spyOn(localStorage, 'setItem');
      i18n.setLanguage('en', { reload: false });
      await setup({ selector: {} });
      expect(selectionStatus()).toBe('Select files');
      toggle(selectBox('Guide.pdf'));
      expect(selectionStatus()).toBe('1 file selected');
      toggle(selectBox('Plan.xlsx'));
      expect(selectionStatus()).toBe('2 files selected');
      expect(selectAllBox().getAttribute('aria-label')).toContain('files');
      fixture.destroy();

      // The number sits inside the sentence: Chinese puts it in the middle, Japanese and Korean attach the counter word.
      for (const [language, expected] of [
        ['zh', '已选择 2 个文件'],
        ['ja', '2件のファイルを選択中'],
        ['ko', '2개 파일 선택됨'],
      ]) {
        i18n.setLanguage(language as 'zh' | 'ja' | 'ko', { reload: false });
        await setup({ selector: {} });
        toggle(selectBox('Guide.pdf'));
        toggle(selectBox('Plan.xlsx'));
        expect(selectionStatus()).withContext(language).toBe(expected);
        expect(selectionCount()).withContext(language).toBe('2');
        fixture.destroy();
      }
    });

    it('keeps the selection band on one neutral surface, selected or not, on desktop and mobile, and leaves the selected rows tinted', async () => {
      // Distinct test values. Core's dark pair: --sd-surface-muted #2e3035 and the explorer tint #1d1f23.
      const tokens: Record<string, string> = {
        '--sd-surface-muted': 'rgb(200, 204, 214)',
        '--sd-file-explorer-mix-tint': 'rgb(250, 250, 250)',
        '--sd-file-explorer-accent-soft': 'rgb(1, 2, 3)',
      };
      const root = document.documentElement.style;
      for (const [name, value] of Object.entries(tokens)) root.setProperty(name, value);
      try {
        await setup({ selector: { actions: [{ title: 'Move', click: () => undefined }] } });
        const band = q('.selection') as HTMLElement;
        const search = q('.search') as HTMLElement;
        const looks = () => [getComputedStyle(band).backgroundColor, getComputedStyle(band).borderTopColor];
        // Core's neutral --sd-surface-muted, half and half with the explorer tint: a light gray, nearly white.
        expect(closeTo(rgbOf(looks()[0]), [225, 227, 232]))
          .withContext(looks()[0])
          .toBeTrue();
        const idle = looks();

        // Selecting files changes the sentence and shows the actions, not the band: no accent tint, same border.
        toggle(selectBox('Guide.pdf'));
        expect(band.classList).toContain('selection--active');
        expect(looks()).toEqual(idle);
        expect(getComputedStyle(band).backgroundColor).not.toBe('rgb(1, 2, 3)');
        // The selected row keeps its accent tint; the explorer surface and the search box keep their own.
        expect(getComputedStyle(row('Guide.pdf')).backgroundColor).toBe('rgb(1, 2, 3)');
        expect(getComputedStyle(element()).backgroundColor).toBe('rgb(255, 255, 255)');
        expect(closeTo(rgbOf(getComputedStyle(search).backgroundColor), [228, 230, 235])).toBeTrue();

        // Mobile: the same band.
        host.width.set(390);
        fixture.detectChanges();
        await wait(50);
        await settle();
        expect(element().classList).toContain('sd-file-explorer--compact');
        expect(looks()).toEqual(idle);

        // Dark tokens: the band stays a dark neutral even while the explorer surface keeps its white default.
        root.setProperty('--sd-surface-muted', 'rgb(46, 48, 53)');
        root.setProperty('--sd-file-explorer-mix-tint', 'rgb(29, 31, 35)');
        expect(closeTo(rgbOf(getComputedStyle(band).backgroundColor), [38, 40, 44]))
          .withContext(getComputedStyle(band).backgroundColor)
          .toBeTrue();

        // A consumer's --sd-file-explorer-muted-surface still wins, as for the search box.
        root.setProperty('--sd-file-explorer-muted-surface', 'rgb(240, 241, 243)');
        expect(getComputedStyle(band).backgroundColor).toBe('rgb(240, 241, 243)');
        expect(getComputedStyle(search).backgroundColor).toBe('rgb(240, 241, 243)');
      } finally {
        for (const name of [...Object.keys(tokens), '--sd-file-explorer-muted-surface']) root.removeProperty(name);
      }
    });

    it('states the selection as plain text: a semibold number inside the same 14 px sentence, with the clear button apart', async () => {
      await setup({ selector: {} });
      const status = q('.selection-status') as HTMLElement;
      expect(status.getAttribute('role')).toBe('status');
      expect(q('.selection-count')).toBeNull();
      toggle(selectBox('Guide.pdf'));
      toggle(selectBox('Memo.docx'));
      const count = q('.selection-count') as HTMLElement;
      expect(selectionStatus()).toBe(t('selection.selected', { count: 2 }));
      expect(status.contains(count)).toBeTrue();
      // No badge: the number is inline text of the sentence, only heavier.
      expect(getComputedStyle(count).display).toBe('inline');
      expect(getComputedStyle(count).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(getComputedStyle(count).fontSize).toBe('14px');
      expect(getComputedStyle(status).fontSize).toBe('14px');
      expect(getComputedStyle(count).fontWeight).toBe('600');
      expect(getComputedStyle(status).fontWeight).toBe('400');
      const clear = q('.selection-clear') as HTMLButtonElement;
      expect(status.contains(clear)).toBeFalse();
      expect(clear.getAttribute('aria-label')).toBe(t('selection.clear'));
    });

    it('stays off without a selector or when it is not visible', async () => {
      await setup({ selector: { visible: false } });
      expect(q('.selection')).toBeNull();
      expect(q('.cell--select')).toBeNull();
      expect(q('.select-all')).toBeNull();
    });

    it('clears the selection once when the consumer hides the selector', async () => {
      const onClear = jasmine.createSpy('onClear');
      await setup({ selector: { onClear } });
      toggle(selectBox('Guide.pdf'));
      host.option.update(option => ({ ...option, selector: { onClear, visible: false } }));
      await settle();
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(q('.selection')).toBeNull();
      host.option.update(option => ({ ...option, selector: { onClear } }));
      await settle();
      expect(selectBox('Guide.pdf').checked).toBeFalse();
      expect(selectionCount()).toBe('0');
    });
  });

  describe('selection actions', () => {
    it('shows selector actions only while files are selected, in declared order, and hands them the selected files', async () => {
      const move = jasmine.createSpy('move');
      const download = jasmine.createSpy('download');
      const remove = jasmine.createSpy('remove');
      await setup({
        selector: {
          actions: [
            { title: 'Move', prefixIcon: 'drive_file_move', click: move },
            {
              title: 'Tools',
              prefixIcon: 'folder',
              children: [
                { title: 'Download', prefixIcon: 'download', click: download },
                { title: 'Share', prefixIcon: 'share', click: () => undefined },
              ],
            },
            { tooltip: 'More selected-file actions', children: [{ title: 'Delete', prefixIcon: 'delete', color: 'error', click: remove }] },
          ],
        },
      });
      expect(q('.selection-actions')).toBeNull();
      toggle(selectBox('Cover.jpg'));
      toggle(selectBox('Guide.pdf'));
      const [moveButton, tools, more] = selectionActions();
      expect(selectionActions().length).toBe(3);
      expect(moveButton.textContent).toContain('Move');
      expect(tools.textContent).toContain('Tools');
      expect(nativeButton(more).getAttribute('aria-label')).toBe('More selected-file actions');
      expect(more.querySelector('mat-icon')?.textContent?.trim()).toBe('more_vert');

      press(moveButton);
      const snapshot = move.calls.mostRecent().args[0];
      expect(ids(snapshot)).toEqual(['guide', 'cover']);
      expect(Object.isFrozen(snapshot)).toBeTrue();

      press(tools);
      expect(menuLabels()).toEqual(['Download', 'Share']);
      menuItems()[0].click();
      fixture.detectChanges();
      expect(ids(download.calls.mostRecent().args[0])).toEqual(['guide', 'cover']);
      expect(menu()).toBeNull();
      expect(document.activeElement).toBe(nativeButton(tools));

      press(more);
      expect(menuItems()[0].style.getPropertyValue('--sd-action-accent')).toBe('var(--sd-error)');
      menuItems()[0].click();
      fixture.detectChanges();
      expect(ids(remove.calls.mostRecent().args[0])).toEqual(['guide', 'cover']);
      // Actions never change the selection on their own.
      expect(selectionStatus()).toBe(t('selection.selected', { count: 2 }));
    });

    it('renders consumer loading, disabled and hidden states and ignores a repeated click once the consumer marks the action busy', async () => {
      const busy = signal(false);
      const remove = jasmine.createSpy('remove').and.callFake(() => busy.set(true));
      const share = jasmine.createSpy('share');
      await setup({
        selector: {
          actions: [
            { title: 'Delete', color: 'error', loading: () => busy(), click: remove },
            { title: 'Share', disabled: items => items.length > 1, click: share },
            { title: 'Archive', hidden: items => items.some(entry => entry.id === 'cover'), click: () => undefined },
          ],
        },
      });
      const labels = () => selectionActions().map(entry => entry.textContent?.trim());
      toggle(selectBox('Guide.pdf'));
      expect(labels()).toEqual(['Delete', 'Share', 'Archive']);
      toggle(selectBox('Cover.jpg'));
      expect(labels()).toEqual(['Delete', 'Share']);
      const [deleteHost, shareHost] = selectionActions();
      expect(nativeButton(shareHost).disabled).toBeTrue();
      press(shareHost);
      expect(share).not.toHaveBeenCalled();

      const deleteButton = nativeButton(deleteHost);
      deleteButton.click();
      expect(remove).toHaveBeenCalledTimes(1);
      // Past the 300 ms click throttle of sd-button and before any re-render: only the explorer guard is left.
      await wait(320);
      expect(deleteButton.getAttribute('data-loading')).toBe('false');
      deleteButton.click();
      expect(remove).toHaveBeenCalledTimes(1);
      fixture.detectChanges();
      expect(deleteButton.getAttribute('data-loading')).toBe('true');
    });

    it('does not invoke a flat action withdrawn before the next render', async () => {
      const click = jasmine.createSpy('withdrawn');
      const actions = [{ title: 'Withdrawn', click }];
      await setup({ selector: { actions } });
      toggle(selectBox('Guide.pdf'));
      const stale = nativeButton(selectionActions()[0]);
      actions.splice(0);
      stale.click();
      expect(click).not.toHaveBeenCalled();
    });

    it('does not invoke a menu child withdrawn before the next render', async () => {
      const click = jasmine.createSpy('withdrawn child');
      const children = [{ title: 'Withdrawn', click }];
      await setup({ selector: { actions: [{ title: 'Tools', children }] } });
      toggle(selectBox('Guide.pdf'));
      press(selectionActions()[0]);
      const stale = menuItems()[0];
      children.splice(0);
      stale.click();
      expect(click).not.toHaveBeenCalled();
    });

    it('does not invoke a child of a group withdrawn before the next render', async () => {
      const click = jasmine.createSpy('withdrawn group');
      const actions = [{ title: 'Tools', children: [{ title: 'Withdrawn', click }] }];
      await setup({ selector: { actions } });
      toggle(selectBox('Guide.pdf'));
      press(selectionActions()[0]);
      const stale = menuItems()[0];
      actions.splice(0);
      stale.click();
      expect(click).not.toHaveBeenCalled();
    });

    it('marks a busy menu item with a spinner, skips it, and closes the menu when the whole group becomes busy', async () => {
      const busy = signal(false);
      const download = jasmine.createSpy('download');
      await setup({
        selector: {
          actions: [
            {
              title: 'Tools',
              loading: () => busy(),
              children: [
                { title: 'Download', loading: true, click: download },
                { title: 'Share', click: () => undefined },
              ],
            },
          ],
        },
      });
      toggle(selectBox('Guide.pdf'));
      const [tools] = selectionActions();
      expect(tools.closest('sd-file-explorer-actions')?.classList).toContain('sd-file-explorer-actions--busy');
      press(tools);
      const [downloadItem, shareItem] = menuItems();
      expect(downloadItem.disabled).toBeTrue();
      expect(downloadItem.querySelector('.spinner')).not.toBeNull();
      expect(downloadItem.textContent).toContain(t('action-loading'));
      expect(document.activeElement).toBe(shareItem);
      downloadItem.click();
      expect(download).not.toHaveBeenCalled();

      busy.set(true);
      fixture.detectChanges();
      expect(menu()).toBeNull();
      expect(nativeButton(tools).getAttribute('data-loading')).toBe('true');
    });

    it('wraps the actions of a narrow band onto their own line without overflowing it', async () => {
      const click = () => undefined;
      await setup(
        {
          selector: {
            actions: [
              { title: 'Move to another folder', prefixIcon: 'drive_file_move', click },
              { title: 'Tools', prefixIcon: 'folder', children: [{ title: 'Download', click }] },
              { tooltip: 'More', children: [{ title: 'Delete', click }] },
            ],
          },
        },
        320
      );
      await wait(50);
      fixture.detectChanges();
      toggle(selectBox('Guide.pdf'));
      const band = q('.selection') as HTMLElement;
      const summary = q('.selection-summary') as HTMLElement;
      const actions = q('.selection-actions') as HTMLElement;
      expect(actions.getBoundingClientRect().top).toBeGreaterThanOrEqual(summary.getBoundingClientRect().bottom - 1);
      expect(band.scrollWidth).toBeLessThanOrEqual(band.clientWidth);
      for (const button of selectionActions())
        expect(band.getBoundingClientRect().right).toBeGreaterThanOrEqual(button.getBoundingClientRect().right);
    });

    it('styles selector actions by kind — flat actions light, group triggers text, both primary — unless the consumer sets type or color', async () => {
      const click = () => undefined;
      await setup({
        selector: {
          actions: [
            { title: 'Tools', children: [{ title: 'Download', click }] },
            { tooltip: 'Copy names', prefixIcon: 'content_copy', click },
            { title: 'Move', prefixIcon: 'drive_file_move', click },
            { tooltip: 'More', children: [{ title: 'Delete', color: 'error', click }] },
            { title: 'Approve', prefixIcon: 'task_alt', color: 'success', click },
            { title: 'Archive', type: 'outline', color: 'warning', children: [{ title: 'Archive now', click }] },
            { title: 'Details', prefixIcon: 'info', type: 'text', color: 'info', click },
          ],
        },
      });
      toggle(selectBox('Guide.pdf'));
      // The kind decides, not the position, the title or an icon-only face: the titled group comes first here.
      expect(selectionActions().map(variantOf)).toEqual([
        'text primary',
        'light primary',
        'light primary',
        'text primary',
        'light success',
        'outline warning',
        'text info',
      ]);
    });

    it('gives success and warning light/text selector actions the status foreground role and leaves everything else to sd-button', async () => {
      // Distinct test values: the role must come from --sd-status-*-fg, then from the 2.15 -dark slot.
      const tokens: Record<string, string> = {
        '--sd-primary': 'rgb(0, 92, 187)',
        '--sd-success': 'rgb(46, 125, 50)',
        '--sd-success-dark': 'rgb(39, 105, 42)',
        '--sd-status-success-fg': 'rgb(20, 80, 30)',
        '--sd-warning': 'rgb(166, 99, 0)',
        '--sd-warning-dark': 'rgb(139, 83, 0)',
        '--sd-status-warning-fg': 'rgb(110, 60, 0)',
        '--sd-text-on-solid': 'rgb(255, 255, 255)',
        '--sd-disabled-text': 'rgb(116, 119, 127)',
      };
      const root = document.documentElement.style;
      for (const [name, value] of Object.entries(tokens)) root.setProperty(name, value);
      try {
        const click = () => undefined;
        await setup({
          selector: {
            actions: [
              { title: 'Approve', prefixIcon: 'task_alt', color: 'success', click },
              { title: 'Archive', color: 'warning', children: [{ title: 'Approve now', prefixIcon: 'task_alt', color: 'success', click }] },
              { title: 'Busy', color: 'warning', loading: true, click },
              { title: 'Move', prefixIcon: 'drive_file_move', click },
              { title: 'Outlined', type: 'outline', color: 'success', click },
              { title: 'Filled', type: 'fill', color: 'warning', click },
              { title: 'Locked', color: 'success', disabled: true, click },
            ],
          },
          fileCommands: [{ tooltip: 'Approve file', prefixIcon: 'task_alt', color: 'success', click }],
        });
        toggle(selectBox('Guide.pdf'));
        const [approve, archive, busy, move, outlined, filled, locked] = selectionActions();
        const color = (element: Element) => getComputedStyle(element).color;

        // Same color, type and title as declared; only the foreground role of light / text success and warning changes.
        expect([approve, archive, busy].map(variantOf)).toEqual(['light success', 'text warning', 'light warning']);
        expect(approve.textContent).toContain('Approve');
        expect(color(nativeButton(approve))).toBe('rgb(20, 80, 30)');
        expect(color(approve.querySelector('sd-icon') as HTMLElement)).toBe('rgb(20, 80, 30)');
        expect(color(nativeButton(archive))).toBe('rgb(110, 60, 0)');
        expect(color(nativeButton(busy))).toBe('rgb(110, 60, 0)');
        const spinner = nativeButton(busy).querySelector('.mdc-circular-progress__indeterminate-circle-graphic circle') as SVGElement;
        expect(getComputedStyle(spinner).stroke).toBe('rgb(110, 60, 0)');

        // Everything else stays as sd-button renders it.
        expect(color(nativeButton(move))).toBe('rgb(0, 92, 187)');
        const standalone = TestBed.createComponent(SdButton);
        standalone.componentRef.setInput('type', 'outline');
        standalone.componentRef.setInput('color', 'success');
        standalone.componentRef.setInput('title', 'Outlined');
        standalone.detectChanges();
        expect(color(nativeButton(outlined))).toBe(color(standalone.nativeElement.querySelector('button')));
        standalone.destroy();
        expect(color(nativeButton(filled))).toBe('rgb(255, 255, 255)');
        expect(color(nativeButton(locked))).toBe('rgb(116, 119, 127)');
        expect(color(nativeButton(actionButtons(row('Guide.pdf'))[0]))).toBe('rgb(46, 125, 50)');
        press(archive);
        expect(color(menuItems()[0].querySelector('sd-icon') as HTMLElement)).toBe('rgb(46, 125, 50)');
        keydown(menuItems()[0], 'Escape');

        // A palette without the semantic tier (2.15) falls back to the -dark slot.
        root.removeProperty('--sd-status-warning-fg');
        expect(color(nativeButton(archive))).toBe('rgb(139, 83, 0)');
      } finally {
        for (const name of Object.keys(tokens)) root.removeProperty(name);
      }
    });

    it('tints the state layer of enabled primary, success, info, warning and error text actions with the explorer tint and leaves the rest to sd-button', async () => {
      const tokens: Record<string, string> = { '--sd-file-explorer-mix-tint': 'rgb(1, 2, 3)', '--mat-sys-primary': 'rgb(0, 92, 187)' };
      const root = document.documentElement.style;
      for (const [name, value] of Object.entries(tokens)) root.setProperty(name, value);
      try {
        const click = () => undefined;
        await setup({
          selector: {
            actions: [
              { tooltip: 'Approve', prefixIcon: 'task_alt', type: 'text', color: 'success', click },
              { title: 'Details', type: 'text', color: 'info', click },
              { title: 'Archive', color: 'warning', children: [{ title: 'Archive now', click }] },
              { title: 'Delete', type: 'text', color: 'error', click },
              // The default group trigger — no type, no color — is text primary; a declared text action too.
              { title: 'Tools', children: [{ title: 'Download', click }] },
              { title: 'Move', type: 'text', click },
              { title: 'Approve all', color: 'success', click },
              { title: 'Copy', click },
              { title: 'Remove', type: 'outline', color: 'error', click },
              { title: 'Locked', type: 'text', color: 'success', disabled: true, click },
              { title: 'Locked tools', disabled: true, children: [{ title: 'Download', click }] },
            ],
          },
          fileCommands: [
            { tooltip: 'Approve file', prefixIcon: 'task_alt', color: 'success', click },
            { tooltip: 'Open file', prefixIcon: 'open_in_new', color: 'primary', click },
          ],
        });
        toggle(selectBox('Guide.pdf'));
        // Hover, focus and pressed draw this layer over the band (Material stacks a pressed ripple on it); a
        // tint-colored layer keeps the foreground readable.
        const layer = (entry: Element) =>
          getComputedStyle(nativeButton(entry).querySelector('.mat-mdc-button-persistent-ripple') as Element, '::before').backgroundColor;
        const actions = selectionActions();
        const tinted = actions.slice(0, 6);
        // Declared and default type / color stay as they are; only the layer color changes.
        expect(tinted.map(variantOf)).toEqual(['text success', 'text info', 'text warning', 'text error', 'text primary', 'text primary']);
        expect(tinted.map(layer)).toEqual(Array(6).fill('rgb(1, 2, 3)'));
        // Light (default flat), outline and disabled actions, and row commands, keep sd-button's state layer.
        expect(actions.slice(6).map(variantOf)).toEqual([
          'light success',
          'light primary',
          'outline error',
          'text success',
          'text primary',
        ]);
        for (const entry of [...actions.slice(6), ...actionButtons(row('Guide.pdf'))]) {
          expect(layer(entry)).withContext(variantOf(entry)).not.toBe('rgb(1, 2, 3)');
        }
        expect(layer(actionButtons(row('Guide.pdf'))[1])).toBe('rgb(0, 92, 187)');
        // The transient ripple keeps sd-button's color.
        expect(getComputedStyle(nativeButton(actions[0])).getPropertyValue('--mat-text-button-ripple-color')).toBe('');
      } finally {
        for (const name of Object.keys(tokens)) root.removeProperty(name);
      }
    });
  });

  describe('commands', () => {
    it('keeps file and folder commands text and secondary, flat or grouped, unless the consumer sets type or color', async () => {
      const click = () => undefined;
      const commands = (): SdFileExplorerCommand[] => [
        { tooltip: 'Download', prefixIcon: 'download', click },
        { tooltip: 'More', children: [{ title: 'Rename', click }] },
        { tooltip: 'Approve', prefixIcon: 'task_alt', color: 'success', click },
        { title: 'Archive', type: 'light', color: 'warning', children: [{ title: 'Archive now', click }] },
      ];
      await setup({ fileCommands: commands(), folderCommands: commands() });
      const expected = ['text secondary', 'text secondary', 'text success', 'light warning'];
      expect(actionButtons(row('Guide.pdf')).map(variantOf)).toEqual(expected);
      expect(actionButtons(row('Projects')).map(variantOf)).toEqual(expected);
      expect(actionButtons(treeNode('Projects'), '.node-actions').map(variantOf)).toEqual(expected);
    });

    it('replaces the row download and share shortcuts only when fileCommands is declared, even as an empty list', async () => {
      await setup({ download: () => undefined, share: () => 'https://s.example/x', fileCommands: [] });
      expect(q('.row-download')).toBeNull();
      expect(q('.row-share')).toBeNull();
      expect(q('.cell--action')).toBeNull();
      expect(q('.commands')).toBeNull();
      row('Cover.jpg').click();
      await settle();
      expect(inDetail('.download-button')).not.toBeNull();
      expect(inDetail('.share-button')).not.toBeNull();
      fixture.destroy();

      await setup({
        download: () => undefined,
        share: () => 'https://s.example/x',
        fileCommands: [{ tooltip: 'Copy link', prefixIcon: 'link', click: () => undefined }],
      });
      expect(q('.row-download')).toBeNull();
      expect(accessibleNames(actionButtons(row('Guide.pdf')))).toEqual(['Copy link']);
    });

    it('runs a file command with the item of its row without opening, navigating or selecting', async () => {
      const download = jasmine.createSpy('download');
      const rename = jasmine.createSpy('rename');
      const data = tree();
      await setup({
        list: listSpy(data),
        selector: {},
        fileCommands: [
          { tooltip: 'Download file', prefixIcon: 'download', click: download },
          {
            tooltip: 'More file actions',
            children: [
              { title: 'Rename', prefixIcon: 'edit', click: rename },
              { title: 'Delete', prefixIcon: 'delete', color: 'error', click: () => undefined },
            ],
          },
        ],
      });
      const guide = data['root'][0];
      const [flat, group] = actionButtons(row('Guide.pdf'));
      press(flat);
      expect(download).toHaveBeenCalledTimes(1);
      expect(download.calls.mostRecent().args[0]).toBe(guide);
      expect(host.opened).toEqual([]);
      expect(detail()).toBeNull();
      expect(selectionCount()).toBe('0');
      expect(q('.heading')?.textContent?.trim()).toBe(t('root'));

      press(group);
      expect(nativeButton(group).getAttribute('aria-expanded')).toBe('true');
      expect(menuLabels()).toEqual(['Rename', 'Delete']);
      menuItems()[0].click();
      fixture.detectChanges();
      expect(rename.calls.mostRecent().args[0]).toBe(guide);
      expect(menu()).toBeNull();
      expect(document.activeElement).toBe(nativeButton(group));
      expect(host.opened).toEqual([]);
      expect(actionButtons(row('Projects')).length).toBe(0);
    });

    it('runs folder commands from rows, cards and tree nodes without navigating, and never on the root', async () => {
      const rename = jasmine.createSpy('rename');
      const move = jasmine.createSpy('move');
      const data = tree();
      await setup({
        list: listSpy(data),
        folderCommands: [
          { tooltip: 'Rename folder', prefixIcon: 'edit', click: rename },
          { tooltip: 'More folder actions', children: [{ title: 'Move', click: move }] },
        ],
      });
      const projects = data['root'][1];
      press(actionButtons(row('Projects'))[0]);
      expect(rename.calls.mostRecent().args[0]).toBe(projects);
      expect(actionButtons(row('Guide.pdf')).length).toBe(0);

      expect(treeNode(t('root')).querySelector('.node-actions')).toBeNull();
      const [treeRename, treeMore] = actionButtons(treeNode('Projects'), '.node-actions');
      press(treeRename);
      expect(rename).toHaveBeenCalledTimes(2);
      expect(rename.calls.mostRecent().args[0]).toBe(projects);
      keydown(nativeButton(treeRename), 'Enter');
      press(treeMore);
      expect(menuLabels()).toEqual(['Move']);
      menuItems()[0].click();
      fixture.detectChanges();
      expect(move.calls.mostRecent().args[0]).toBe(projects);
      await settle();
      expect(q('.heading')?.textContent?.trim()).toBe(t('root'));
      expect(treeNode('Projects').getAttribute('aria-selected')).toBe('false');

      qa<HTMLButtonElement>('.icon-button--toggle')[1].click();
      fixture.detectChanges();
      press(actionButtons(card('Projects'))[0]);
      expect(rename).toHaveBeenCalledTimes(3);
      await settle();
      expect(q('.heading')?.textContent?.trim()).toBe(t('root'));
    });

    it('opens one command menu at a time, toggles it on repeated clicks and closes it with Escape or an outside click', async () => {
      const rename = jasmine.createSpy('rename');
      await setup({
        preview: () => null,
        fileCommands: [{ tooltip: 'More file actions', children: [{ title: 'Rename', click: rename }] }],
      });
      const guide = nativeButton(actionButtons(row('Guide.pdf'))[0]);
      const plan = nativeButton(actionButtons(row('Plan.xlsx'))[0]);
      guide.click();
      fixture.detectChanges();
      expect(guide.getAttribute('aria-expanded')).toBe('true');
      guide.click();
      fixture.detectChanges();
      expect(menu()).toBeNull();

      guide.click();
      fixture.detectChanges();
      plan.click();
      fixture.detectChanges();
      expect(document.querySelectorAll('.sd-action-popover').length).toBe(1);
      expect(guide.getAttribute('aria-expanded')).toBe('false');
      expect(plan.getAttribute('aria-expanded')).toBe('true');

      keydown(menuItems()[0], 'Escape');
      expect(menu()).toBeNull();
      expect(document.activeElement).toBe(plan);
      plan.click();
      fixture.detectChanges();
      (q('.heading') as HTMLElement).click();
      fixture.detectChanges();
      expect(menu()).toBeNull();
      expect(rename).not.toHaveBeenCalled();
      expect(host.opened).toEqual([]);
    });

    it('dismisses an open command menu when its row leaves the view', async () => {
      await setup({ fileCommands: [{ tooltip: 'More file actions', children: [{ title: 'Rename', click: () => undefined }] }] });
      press(actionButtons(row('Guide.pdf'))[0]);
      expect(menu()).not.toBeNull();
      type(q<HTMLInputElement>('.search-input') as HTMLInputElement, 'plan');
      expect(rowNames()).toEqual(['Plan.xlsx']);
      expect(menu()).toBeNull();
    });

    it('evaluates hidden, disabled and loading per item and keeps a menu of disabled items reachable', async () => {
      const lock = jasmine.createSpy('lock');
      const sync = jasmine.createSpy('sync');
      const remove = jasmine.createSpy('remove');
      await setup({
        fileCommands: [
          { tooltip: 'Download file', prefixIcon: 'download', hidden: entry => entry.id === 'memo', click: () => undefined },
          { tooltip: 'Lock', prefixIcon: 'lock', disabled: entry => entry.id === 'plan', click: lock },
          { tooltip: 'Sync', prefixIcon: 'sync', loading: entry => entry.id === 'cover', click: sync },
          { tooltip: 'Hidden group', children: [{ title: 'Ghost', hidden: true, click: () => undefined }] },
          { tooltip: 'Locked menu', children: [{ title: 'Delete', disabled: true, click: remove }] },
        ],
      });
      expect(accessibleNames(actionButtons(row('Guide.pdf')))).toEqual(['Download file', 'Lock', 'Sync', 'Locked menu']);
      expect(accessibleNames(actionButtons(row('Memo.docx')))).toEqual(['Lock', 'Sync', 'Locked menu']);

      const lockOnPlan = actionButtons(row('Plan.xlsx'))[1];
      expect(nativeButton(lockOnPlan).disabled).toBeTrue();
      press(lockOnPlan);
      expect(lock).not.toHaveBeenCalled();
      const syncOnCover = actionButtons(row('Cover.jpg'))[2];
      expect(nativeButton(syncOnCover).getAttribute('data-loading')).toBe('true');
      press(syncOnCover);
      expect(sync).not.toHaveBeenCalled();

      const locked = nativeButton(actionButtons(row('Guide.pdf'))[3]);
      keydown(locked, 'ArrowDown');
      expect(menu()).not.toBeNull();
      expect(document.activeElement).toBe(menu());
      expect(menuItems()[0].disabled).toBeTrue();
      menuItems()[0].click();
      expect(remove).not.toHaveBeenCalled();
    });

    it('keeps the tree keyboard model with folder commands and does not navigate from a command key press', async () => {
      await setup({ folderCommands: [{ tooltip: 'Rename folder', prefixIcon: 'edit', click: () => undefined }] });
      const root = treeNode(t('root'));
      root.focus();
      keydown(root, 'ArrowDown');
      expect(document.activeElement).toBe(treeNode('Projects'));
      keydown(treeNode('Projects'), 'End');
      expect(document.activeElement).toBe(treeNode('Docs'));
      const rename = nativeButton(actionButtons(treeNode('Docs'), '.node-actions')[0]);
      for (const key of ['Enter', ' ', 'ArrowUp']) keydown(rename, key);
      await settle();
      expect(q('.heading')?.textContent?.trim()).toBe(t('root'));
      keydown(treeNode('Docs'), 'Enter');
      await settle();
      expect(q('.heading')?.textContent?.trim()).toBe('Docs');
    });

    it('wraps the commands of a narrow desktop row onto their own line instead of overlapping the name', async () => {
      const click = () => undefined;
      // The narrowest desktop layout: below 720 px the compact layout moves commands into the drawer instead.
      await setup(
        {
          selector: {},
          fileCommands: [
            { title: 'Download a copy for offline use', prefixIcon: 'download', click },
            { tooltip: 'More file actions', children: [{ title: 'Rename', click }] },
          ],
        },
        760
      );
      await wait(50);
      fixture.detectChanges();
      expect(element().classList).not.toContain('sd-file-explorer--compact');
      const guide = row('Guide.pdf');
      const commands = guide.querySelector('.commands') as HTMLElement;
      expect(overlaps(commands, guide.querySelector('.name') as HTMLElement)).toBeFalse();
      expect(guide.scrollWidth).toBeLessThanOrEqual(guide.clientWidth);
      for (const button of actionButtons(guide))
        expect(guide.getBoundingClientRect().right).toBeGreaterThanOrEqual(button.getBoundingClientRect().right);
    });
  });

  describe('action areas on desktop and touch', () => {
    const commands = () => ({
      selector: { actions: [{ title: 'Move', click: () => undefined }] },
      fileCommands: [
        { tooltip: 'Download file', prefixIcon: 'download', click: () => undefined },
        { tooltip: 'More file actions', children: [{ title: 'Rename', click: () => undefined }] },
      ],
      folderCommands: [{ tooltip: 'Rename folder', prefixIcon: 'edit', click: () => undefined }],
    });

    it('reveals desktop row commands on focus, keeps them reachable with Tab and visible while their menu is open', async () => {
      await setup(commands());
      const area = row('Guide.pdf').querySelector('.commands') as HTMLElement;
      expect(getComputedStyle(area).opacity).toBe('0');
      const first = area.querySelector('button') as HTMLButtonElement;
      expect(first.tabIndex).toBe(0);
      first.focus();
      expect(getComputedStyle(area).opacity).toBe('1');
      first.blur();
      expect(getComputedStyle(area).opacity).toBe('0');

      press(actionButtons(row('Guide.pdf'))[1]);
      expect(area.contains(document.activeElement)).toBeFalse();
      expect(getComputedStyle(area).opacity).toBe('1');
      keydown(menuItems()[0], 'Escape');
      expect(document.activeElement).toBe(nativeButton(actionButtons(row('Guide.pdf'))[1]));
    });

    it('shows tree commands only for the focused folder so the roving tree keeps one tab stop', async () => {
      await setup(commands());
      const projects = treeNode('Projects').querySelector('.node-actions') as HTMLElement;
      const docs = treeNode('Docs').querySelector('.node-actions') as HTMLElement;
      expect(getComputedStyle(projects).display).toBe('none');
      treeNode('Projects').focus();
      expect(getComputedStyle(projects).display).not.toBe('none');
      expect(getComputedStyle(docs).display).toBe('none');
      keydown(treeNode('Projects'), 'ArrowDown');
      expect(document.activeElement).toBe(treeNode('Docs'));
      expect(getComputedStyle(projects).display).toBe('none');
      expect(getComputedStyle(docs).display).not.toBe('none');
    });

    // Flat command + two groups, as consumers declare them; names as short as real folder names.
    const treeCommands = () => [
      { tooltip: 'Rename folder', prefixIcon: 'edit', click: () => undefined },
      {
        tooltip: 'Share folder',
        prefixIcon: 'share',
        children: [
          { title: 'Share', click: () => undefined },
          { title: 'Copy link', click: () => undefined },
        ],
      },
      { tooltip: 'More folder actions', children: [{ title: 'Delete', color: 'error' as const, click: () => undefined }] },
    ];
    const ordinaryFolders = () => [folder('du-an', null, 'Dự án 2026'), folder('hop-dong', null, 'Hợp đồng', { hasChildren: false })];

    it('keeps ordinary folder names whole while desktop tree commands are hidden, and shrinks the name, never covers it, while they show', async () => {
      await setup({ list: ({ parentId }) => (parentId === null ? ordinaryFolders() : []), folderCommands: treeCommands() });
      for (const name of ['Dự án 2026', 'Hợp đồng']) {
        const label = treeNode(name).querySelector('.label') as HTMLElement;
        expect(getComputedStyle(treeNode(name).querySelector('.node-actions') as HTMLElement).display).toBe('none');
        expect(label.scrollWidth).withContext(`${name} is not cut while its commands are hidden`).toBeLessThanOrEqual(label.clientWidth);
      }

      const node = treeNode('Dự án 2026');
      node.focus();
      const label = node.querySelector('.label') as HTMLElement;
      expect(getComputedStyle(node.querySelector('.node-actions') as HTMLElement).display).not.toBe('none');
      expect(node.scrollWidth).toBeLessThanOrEqual(node.clientWidth);
      expect(label.getBoundingClientRect().width).toBeGreaterThan(0);
      for (const button of actionButtons(node, '.node-actions')) expect(overlaps(nativeButton(button), label)).toBeFalse();
      // The full name stays available: tooltip on the label, and the label alone names the tree item.
      expect(label.getAttribute('title')).toBe('Dự án 2026');
      expect(document.getElementById(node.getAttribute('aria-labelledby') ?? '')?.textContent?.trim()).toBe('Dự án 2026');
    });

    it('keeps a deep folder with long and grouped commands inside the narrow tree, in the declared order', async () => {
      const data: Record<string, SdFileExplorerItem[]> = {
        root: [folder('a', null, 'Dự án 2026')],
        a: [folder('b', 'a', 'Thiết kế')],
        b: [folder('c', 'b', 'Bản vẽ kỹ thuật')],
        c: [],
      };
      await setup({
        list: listSpy(data),
        folderCommands: [
          { title: 'Đổi tên thư mục này', prefixIcon: 'edit', click: () => undefined },
          { title: 'Chia sẻ với cả nhóm dự án', prefixIcon: 'share', children: [{ title: 'Share', click: () => undefined }] },
          { tooltip: 'More folder actions', children: [{ title: 'Delete', click: () => undefined }] },
          { title: 'Tải toàn bộ thư mục về máy', prefixIcon: 'download', click: () => undefined },
        ],
      });
      treeNode('Dự án 2026').querySelector<HTMLButtonElement>('button.toggle')?.click();
      await settle();
      treeNode('Thiết kế').querySelector<HTMLButtonElement>('button.toggle')?.click();
      await settle();
      const node = treeNode('Bản vẽ kỹ thuật');
      expect(node.getAttribute('aria-level')).toBe('4');
      node.focus();

      const tree = q('.sidebar-tree') as HTMLElement;
      expect(tree.scrollWidth).toBeLessThanOrEqual(tree.clientWidth);
      expect(node.scrollWidth).toBeLessThanOrEqual(node.clientWidth);
      const box = node.getBoundingClientRect();
      const label = node.querySelector('.label') as HTMLElement;
      const buttons = actionButtons(node, '.node-actions');
      expect(buttons.map(entry => entry.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
        jasmine.stringContaining('Đổi tên thư mục này'),
        jasmine.stringContaining('Chia sẻ với cả nhóm dự án'),
        jasmine.stringContaining('more_vert'),
        jasmine.stringContaining('Tải toàn bộ thư mục về máy'),
      ]);
      for (const entry of buttons) {
        const button = nativeButton(entry).getBoundingClientRect();
        expect(button.left).toBeGreaterThanOrEqual(box.left - 0.5);
        expect(button.right).toBeLessThanOrEqual(box.right + 0.5);
        expect(overlaps(nativeButton(entry), label)).toBeFalse();
      }
      expect(label.getBoundingClientRect().width).toBeGreaterThan(0);
    });

    it('always shows tree commands on desktop touch screens with 44 px targets and keeps ordinary names whole', async () => {
      emulateTouch();
      // A tablet-wide explorer: the 238 px desktop tree keeps its commands inline (the compact layout uses the drawer).
      await setup({ list: ({ parentId }) => (parentId === null ? ordinaryFolders() : []), folderCommands: treeCommands() });
      expect(element().classList).not.toContain('sd-file-explorer--compact');
      for (const name of ['Dự án 2026', 'Hợp đồng']) {
        const node = treeNode(name);
        const label = node.querySelector('.label') as HTMLElement;
        expect(getComputedStyle(node.querySelector('.node-actions') as HTMLElement).display).not.toBe('none');
        expect(label.scrollWidth).withContext(`${name} is not cut on touch`).toBeLessThanOrEqual(label.clientWidth);
        expect(node.scrollWidth).toBeLessThanOrEqual(node.clientWidth);
        for (const entry of actionButtons(node, '.node-actions')) {
          const button = nativeButton(entry).getBoundingClientRect();
          expect(button.height).toBeGreaterThanOrEqual(44);
          expect(button.width).toBeGreaterThanOrEqual(44);
          expect(overlaps(nativeButton(entry), label)).toBeFalse();
        }
      }
    });

    it('always shows commands on desktop touch screens with targets of at least 44 px', async () => {
      emulateTouch();
      await setup({ ...commands(), defaultView: 'list' });
      expect(element().classList).toContain('sd-file-explorer--touch');
      expect(element().classList).not.toContain('sd-file-explorer--compact');
      const area = row('Guide.pdf').querySelector('.commands') as HTMLElement;
      expect(getComputedStyle(area).opacity).toBe('1');
      for (const button of Array.from(area.querySelectorAll('button'))) {
        const box = button.getBoundingClientRect();
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
      expect(getComputedStyle(treeNode('Projects').querySelector('.node-actions') as HTMLElement).display).not.toBe('none');
      toggle(selectBox('Guide.pdf'));
      expect((q('.selection-clear') as HTMLElement).getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
      expect(nativeButton(selectionActions()[0]).getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    });

    it('sizes the selection band like the row commands on desktop and keeps 48 px actions and a 44 px clear button on touch', async () => {
      const click = () => undefined;
      const option = (): Partial<SdFileExplorerOption> => ({
        selector: {
          actions: [
            { title: 'Move', prefixIcon: 'drive_file_move', click },
            { title: 'Tools', children: [{ title: 'Download', click }] },
            { tooltip: 'More', children: [{ title: 'Delete', click }] },
          ],
        },
        fileCommands: [
          { tooltip: 'Download file', prefixIcon: 'download', click },
          { tooltip: 'More file actions', children: [{ title: 'Rename', click }] },
        ],
      });
      const measure = () => {
        toggle(selectBox('Guide.pdf'));
        const clear = q('.selection-clear') as HTMLElement;
        const clearBox = clear.getBoundingClientRect();
        return {
          band: Math.round((q('.selection') as HTMLElement).getBoundingClientRect().height),
          actions: selectionActions().map(buttonMetrics),
          commands: actionButtons(row('Plan.xlsx')).map(buttonMetrics),
          clear: [clearBox.width, clearBox.height, (clear.querySelector('sd-icon') as HTMLElement).getBoundingClientRect().width],
        };
      };

      // Desktop: actions at the row-command size (32 px, 16 px icons, 14 px text); the clear button keeps its 20 px icon.
      await setup(option());
      expect(measure()).toEqual({
        band: 46,
        actions: [
          [32, 16, '14px'],
          [32, 16, '14px'],
          [32, 16, '14px'],
        ],
        commands: [
          [32, 16, '14px'],
          [32, 16, '14px'],
        ],
        clear: [32, 32, 20],
      });
      fixture.destroy();

      emulateTouch();
      await setup(option());
      const touch = measure();
      expect(touch.actions).toEqual([
        [48, 24, '16px'],
        [48, 24, '16px'],
        [48, 24, '16px'],
      ]);
      expect(touch.commands).toEqual([
        [48, 24, '16px'],
        [48, 24, '16px'],
      ]);
      expect(touch.clear).toEqual([44, 44, 20]);
      fixture.destroy();

      // Narrow touch screen: sd-button's own sm size (not a shrunken lg); the clear button keeps its 44 px target.
      await setupCompact(option());
      toggle(selectBox('Guide.pdf'));
      expect(selectionActions().map(buttonMetrics)).toEqual([
        [32, 16, '14px'],
        [32, 16, '14px'],
        [32, 16, '14px'],
      ]);
      expect(selectionActions().every(entry => nativeButton(entry).classList.contains('c-sm'))).toBeTrue();
      const clear = (q('.selection-clear') as HTMLElement).getBoundingClientRect();
      expect([clear.width, clear.height]).toEqual([44, 44]);
    });

    it('keeps the 48 px Material touch targets of wrapped compact selection actions apart from each other and from the clear button', async () => {
      emulateTouch();
      const click = () => undefined;
      await setupCompact(
        {
          selector: {
            actions: [
              { title: 'Move', prefixIcon: 'drive_file_move', click },
              { title: 'Copy', prefixIcon: 'content_copy', click },
              { tooltip: 'Approve', prefixIcon: 'task_alt', color: 'success', click },
              { title: 'Tools', children: [{ title: 'Download', click }] },
              { tooltip: 'More', children: [{ title: 'Delete', click }] },
              { title: 'Archive', prefixIcon: 'archive', click },
            ],
          },
        },
        320
      );
      toggle(selectBox('Guide.pdf'));
      const buttons = selectionActions().map(nativeButton);
      const rows = new Set(buttons.map(button => Math.round(button.getBoundingClientRect().top)));
      expect(rows.size).withContext('the actions wrap onto several lines').toBeGreaterThan(1);
      const targets = buttons.map(button => button.querySelector('.mat-mdc-button-touch-target') as HTMLElement);
      // Material keeps a 48 px touch target around each 32 px button: wrapped lines need 16 px between them.
      for (const target of targets) expect(Math.round(target.getBoundingClientRect().height)).toBe(48);
      const clear = q('.selection-clear') as HTMLElement;
      targets.forEach((target, i) => {
        expect(overlaps(target, clear)).withContext(`action ${i} / clear`).toBeFalse();
        for (let j = i + 1; j < targets.length; j++) expect(overlaps(target, targets[j])).withContext(`action ${i} / ${j}`).toBeFalse();
      });
      const band = q('.selection') as HTMLElement;
      expect(band.scrollWidth).toBeLessThanOrEqual(band.clientWidth);
    });

    it('emits derived data-autoid attributes for selection and commands', async () => {
      await setup({
        autoId: 'drive',
        selector: {
          actions: [
            { title: 'Move', click: () => undefined },
            { tooltip: 'More', children: [{ title: 'Delete', click: () => undefined }] },
          ],
        },
        fileCommands: [
          { tooltip: 'Download file', prefixIcon: 'download', click: () => undefined },
          { tooltip: 'More', children: [{ title: 'Rename', click: () => undefined }] },
        ],
        folderCommands: [{ tooltip: 'Rename folder', prefixIcon: 'edit', click: () => undefined }],
      });
      toggle(selectBox('Guide.pdf'));
      const autoId = (suffix: string) => q(`[data-autoid="components-file-explorer-drive-${suffix}"]`);
      for (const suffix of [
        'selection',
        'select-all',
        'selection-clear',
        'item-guide-select',
        'selection-action-0',
        'selection-action-1',
        'item-guide-command-0',
        'item-guide-command-1',
        'item-projects-command-0',
        'tree-projects-command-0',
      ]) {
        expect(autoId(suffix)).withContext(suffix).not.toBeNull();
      }
      press(selectionActions()[1]);
      expect(menu()?.querySelector('[data-autoid="components-file-explorer-drive-selection-action-1-0"]')).not.toBeNull();
      press(actionButtons(row('Guide.pdf'))[1]);
      expect(menu()?.querySelector('[data-autoid="components-file-explorer-drive-item-guide-command-1-0"]')).not.toBeNull();
    });

    it('keeps the original list, grid and tree without selector or commands', async () => {
      await setup({ download: () => undefined, share: () => 'https://s.example/x' });
      expect(q('.selection')).toBeNull();
      expect(q('.cell--select')).toBeNull();
      expect(q('.commands')).toBeNull();
      expect(q('.node-actions')).toBeNull();
      const shortcuts = row('Guide.pdf').querySelector('.cell--action') as HTMLElement;
      expect(shortcuts.querySelector('.row-download')).not.toBeNull();
      expect(shortcuts.querySelector('.row-share')).not.toBeNull();
      expect(getComputedStyle(shortcuts).opacity).toBe('1');
      qa<HTMLButtonElement>('.icon-button--toggle')[1].click();
      fixture.detectChanges();
      expect(q('.card-top')).toBeNull();
      expect(q('.grid-head')).toBeNull();
    });
  });

  describe('compact command drawer', () => {
    const renameFolder = (): SdFileExplorerCommand => ({ title: 'Rename folder', prefixIcon: 'edit', click: () => undefined });

    it('gives each compact row one actions trigger in place of inline commands and shortcuts, and keeps desktop rows as they were', async () => {
      await setupCompact({ download: () => undefined, share: () => 'https://s.example/x', folderCommands: [renameFolder()] });
      const guide = row('Guide.pdf');
      expect(guide.querySelector('.commands')).toBeNull();
      expect(guide.querySelector('.row-download')).toBeNull();
      expect(guide.querySelector('.row-share')).toBeNull();
      const trigger = menuTrigger(guide);
      expect(trigger.getAttribute('aria-label')).toBe(t('item-actions', { name: 'Guide.pdf' }));
      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(trigger.textContent).toContain('more_vert');
      const box = trigger.getBoundingClientRect();
      expect([box.width, box.height]).toEqual([32, 32]);
      // Four files with the shortcuts, two folders with their folder command.
      expect(qa('.row .sd-file-explorer-menu-trigger').length).toBe(6);
      expect(menuTrigger(row('Projects')).getAttribute('aria-label')).toBe(t('item-actions', { name: 'Projects' }));

      // Grid cards never had the shortcuts: only declared commands give a card its trigger.
      qa<HTMLButtonElement>('.icon-button--toggle')[1].click();
      fixture.detectChanges();
      expect(card('Guide.pdf').querySelector('.sd-file-explorer-menu-trigger')).toBeNull();
      expect(card('Projects').querySelector('.commands')).toBeNull();
      expect(menuTrigger(card('Projects')).getAttribute('aria-label')).toBe(t('item-actions', { name: 'Projects' }));

      // The desktop layout keeps its inline commands and shortcuts, without triggers.
      host.width.set(1100);
      fixture.detectChanges();
      await wait(50);
      await settle();
      expect(q('.sd-file-explorer-menu-trigger')).toBeNull();
      expect(actionButtons(card('Projects')).length).toBe(1);
      qa<HTMLButtonElement>('.icon-button--toggle')[0].click();
      fixture.detectChanges();
      expect(row('Guide.pdf').querySelector('.row-download')).not.toBeNull();
      expect(row('Guide.pdf').querySelector('.row-share')).not.toBeNull();
      expect(actionButtons(row('Projects')).length).toBe(1);
    });

    it('lists the download and share shortcuts in the drawer only while fileCommands is undeclared', async () => {
      const share = () => 'https://s.example/x';
      await setupCompact({ download: () => undefined, share, fileCommands: [] });
      expect(q('.sd-file-explorer-menu-trigger')).toBeNull();
      fixture.destroy();

      await setupCompact({
        download: () => undefined,
        share,
        fileCommands: [{ title: 'Copy link', prefixIcon: 'link', click: () => undefined }],
      });
      await openCommandsOf(row('Guide.pdf'));
      expect(commandLabels()).toEqual(['Copy link']);
      closeCommandDrawer();
      await settle();
      fixture.destroy();

      await setupCompact({ download: () => undefined, share });
      await openCommandsOf(row('Guide.pdf'));
      expect(commandLabels()).toEqual([t('share'), t('download')]);
      closeCommandDrawer();
      await settle();
      fixture.destroy();

      await setupCompact({ share });
      await openCommandsOf(row('Guide.pdf'));
      expect(commandLabels()).toEqual([t('share')]);
      closeCommandDrawer();
      await settle();
      fixture.destroy();

      await setupCompact();
      expect(q('.sd-file-explorer-menu-trigger')).toBeNull();
    });

    it('runs the shortcuts from the drawer: download queues a transfer, share opens its dialog and both give focus back to the trigger', async () => {
      const download = jasmine.createSpy('download').and.returnValue(undefined);
      await setupCompact({ download, share: () => 'https://s.example/x' });
      let trigger = await openCommandsOf(row('Guide.pdf'));
      commandEntries()[1].click();
      await settle();
      expect(download).toHaveBeenCalledTimes(1);
      expect((download.calls.mostRecent().args[0] as SdFileExplorerDownloadArgs).item.id).toBe('guide');
      expect(transferCards().map(entry => entry.name)).toEqual(['Guide.pdf']);
      expect(document.activeElement).toBe(trigger);

      trigger = await openCommandsOf(row('Plan.xlsx'));
      commandEntries()[0].click();
      await settle();
      expect(q('.dialog-title')?.textContent).toContain('Plan.xlsx');
      press(q('.close-button'));
      await settle();
      expect(document.activeElement).toBe(trigger);
    });

    it('opens a Core side drawer on <body>, titled with the whole item name, that locks page scroll and gives focus back when closed', async () => {
      const name = 'Báo cáo tài chính quý 4 năm 2026 - bản cuối cùng đã được ban giám đốc phê duyệt.pdf';
      await setupCompact({
        list: ({ parentId }) => (parentId === null ? [file('report', null, name, { mimeType: 'application/pdf', size: 2048 })] : []),
        fileCommands: [{ title: 'Rename', click: () => undefined }],
      });
      const overflow = document.body.style.overflow;
      const trigger = await openCommandsOf(row(name));
      const drawer = commandDrawer() as HTMLElement;
      expect(drawer).not.toBeNull();
      expect(element().contains(drawer)).toBeFalse();
      expect(drawer.getAttribute('role')).toBe('dialog');
      expect(drawer.getAttribute('aria-modal')).toBe('true');
      expect(drawer.getAttribute('aria-label')).toBe(name);
      // The whole name, wrapped over several lines instead of cut.
      const title = drawer.querySelector('.sd-side-drawer-title') as HTMLElement;
      expect(title.textContent?.trim()).toBe(name);
      expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth);
      expect(title.getBoundingClientRect().height).toBeGreaterThan(40);
      expect(drawer.querySelector('.context')?.textContent).toContain(t('type.pdf'));
      expect(drawer.contains(document.activeElement)).toBeTrue();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(document.body.style.overflow).toBe('hidden');
      // Never the whole viewport: a strip of backdrop stays to tap the drawer away (min(400px, 100vw - 56px)).
      expect(drawer.style.width).toMatch(/^min\(400px, .*100vw/);
      expect(drawer.style.width).toContain('56px');
      expect(drawer.getBoundingClientRect().left).toBeGreaterThanOrEqual(48);

      closeCommandDrawer();
      await settle();
      expect(commandDrawer()).toBeNull();
      expect(document.body.style.overflow).toBe(overflow);
      expect(document.activeElement).toBe(trigger);
      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      // Escape and the backdrop close it the same way, and it opens again each time.
      await openCommandsOf(row(name));
      keydown(commandDrawer() as HTMLElement, 'Escape');
      await settle();
      expect(commandDrawer()).toBeNull();
      expect(document.activeElement).toBe(trigger);

      await openCommandsOf(row(name));
      (document.querySelector('.sd-side-drawer-backdrop:not(.sd-side-drawer-backdrop-contained)') as HTMLElement).click();
      await settle();
      expect(commandDrawer()).toBeNull();
      expect(document.activeElement).toBe(trigger);
      expect(document.body.style.overflow).toBe(overflow);
    });

    it('lists commands in declared order with labelled groups, neutral labels, semantic icons and their current states', async () => {
      const tokens: Record<string, string> = {
        '--sd-success': 'rgb(46, 125, 50)',
        '--sd-error': 'rgb(186, 26, 26)',
        '--sd-text': 'rgb(26, 27, 31)',
      };
      const root = document.documentElement.style;
      for (const [name, value] of Object.entries(tokens)) root.setProperty(name, value);
      try {
        const click = jasmine.createSpy('click');
        await setupCompact({
          fileCommands: [
            { title: 'Download a copy', prefixIcon: 'download', type: 'outline', color: 'success', click },
            {
              tooltip: 'More file actions',
              children: [
                { title: 'Rename', prefixIcon: 'edit', click },
                { title: 'Delete', prefixIcon: 'delete', color: 'error', click },
                { title: 'Ghost', hidden: true, click },
              ],
            },
            { title: 'Archive', hidden: true, click },
            { title: 'Locked tools', prefixIcon: 'lock', disabled: true, children: [{ title: 'Lock', click }] },
            { tooltip: 'Sync', prefixIcon: 'sync', loading: true, click },
            { title: 'Copy name', suffixIcon: 'content_copy', click },
          ],
        });
        await openCommandsOf(row('Guide.pdf'));
        expect(commandLabels()).toEqual(['Download a copy', 'Rename', 'Delete', 'Lock', 'Sync', 'Copy name']);
        const drawer = commandDrawer() as HTMLElement;
        const groups = Array.from(drawer.querySelectorAll<HTMLElement>('[role="group"]'));
        expect(groups.map(group => document.getElementById(group.getAttribute('aria-labelledby') ?? '')?.textContent?.trim())).toEqual([
          'More file actions',
          'Locked tools',
        ]);
        expect(groups.map(group => group.querySelectorAll('button.command').length)).toEqual([2, 1]);
        // No menu inside the drawer and no button variants: the group's children are listed right there.
        expect(menu()).toBeNull();
        expect(drawer.querySelector('sd-button')).toBeNull();

        const [copy, rename, remove, lock, sync, copyName] = commandEntries();
        const label = (entry: HTMLElement) => getComputedStyle(entry.querySelector('.command-label') as HTMLElement).color;
        const icon = (entry: HTMLElement) => getComputedStyle(entry.querySelector('sd-icon') as HTMLElement).color;
        // Labels stay neutral like Core menu items; the declared color paints the icon; `type` changes nothing here.
        expect([copy, rename, remove].map(label)).toEqual([tokens['--sd-text'], tokens['--sd-text'], tokens['--sd-text']]);
        expect(icon(copy)).toBe(tokens['--sd-success']);
        expect(icon(remove)).toBe(tokens['--sd-error']);
        expect(icon(rename)).toBe(tokens['--sd-text']);
        expect(lock.disabled).toBeTrue();
        expect(sync.disabled).toBeTrue();
        expect(sync.querySelector('.spinner')).not.toBeNull();
        expect(sync.textContent).toContain(t('action-loading'));
        expect((copyName.querySelector('.command-label') as HTMLElement).nextElementSibling?.textContent).toContain('content_copy');

        lock.click();
        sync.click();
        await settle();
        expect(click).not.toHaveBeenCalled();
        expect(commandDrawer()).not.toBeNull();
      } finally {
        for (const name of Object.keys(tokens)) root.removeProperty(name);
      }
    });

    it('runs a pressed command once, after the drawer and its focus trap have closed, so focus the command moves stays there', async () => {
      // Stand-in for the consumer's confirmation dialog: the command focuses its button.
      const dialog = document.createElement('div');
      const confirm = document.createElement('button');
      confirm.textContent = 'Confirm';
      dialog.appendChild(confirm);
      document.body.appendChild(dialog);
      try {
        const data = tree();
        const remove = jasmine.createSpy('remove').and.callFake(() => confirm.focus());
        await setupCompact({
          list: listSpy(data),
          fileCommands: [{ title: 'Delete', prefixIcon: 'delete', color: 'error', click: remove }],
        });
        await openCommandsOf(row('Guide.pdf'));
        expect(document.body.style.overflow).toBe('hidden');
        const [entry] = commandEntries();
        entry.click();
        entry.click();
        // Closed at once — the page scroll lock is already released — while the command waits for the next render.
        expect(document.body.style.overflow).not.toBe('hidden');
        expect(remove).not.toHaveBeenCalled();
        fixture.detectChanges();
        expect(remove).toHaveBeenCalledTimes(1);
        expect(remove.calls.mostRecent().args[0]).toBe(data['root'][0]);
        await settle();
        expect(commandDrawer()).toBeNull();
        expect(remove).toHaveBeenCalledTimes(1);
        // The trap handed focus back to the trigger before the command ran, so it did not pull focus away from the dialog.
        expect(document.activeElement).toBe(confirm);
      } finally {
        dialog.remove();
      }
    });

    it('checks an entry again when it is pressed and shows the current states while open and when it reopens', async () => {
      const locked = new Set<string>(); // consumer state kept outside signals
      const busy = signal(false);
      const lock = jasmine.createSpy('lock');
      await setupCompact({
        fileCommands: [
          { title: 'Lock', disabled: entry => locked.has(entry.id), click: lock },
          { title: 'Sync', loading: () => busy(), click: () => undefined },
        ],
      });
      const trigger = await openCommandsOf(row('Guide.pdf'));
      expect(commandEntries()[0].disabled).toBeFalse();
      // Locked after the last render: the press is refused, the drawer stays open and now shows the entry disabled.
      locked.add('guide');
      commandEntries()[0].click();
      await settle();
      expect(lock).not.toHaveBeenCalled();
      expect(commandDrawer()).not.toBeNull();
      expect(commandEntries()[0].disabled).toBeTrue();

      // A signal read by a state re-renders the open drawer and the trigger behind it.
      busy.set(true);
      fixture.detectChanges();
      expect(commandEntries()[1].disabled).toBeTrue();
      expect(commandEntries()[1].querySelector('.spinner')).not.toBeNull();
      expect(trigger.querySelector('.spinner')).not.toBeNull();
      expect(trigger.getAttribute('aria-label')).toContain(t('action-loading'));

      // Reopening evaluates everything again, state outside signals included.
      closeCommandDrawer();
      await settle();
      locked.delete('guide');
      busy.set(false);
      await openCommandsOf(row('Guide.pdf'));
      expect(commandEntries().map(entry => entry.disabled)).toEqual([false, false]);
      expect(trigger.querySelector('.spinner')).toBeNull();
      commandEntries()[0].click();
      await settle();
      expect(lock).toHaveBeenCalledTimes(1);
    });

    it('closes without running anything when reload(), the keyword, the history, the list callback, the folder or the layout changes', async () => {
      const run = jasmine.createSpy('run');
      await setupCompact({ fileCommands: [{ title: 'Rename', click: run }] });
      for (const method of ['back', 'forward', 'go', 'pushState', 'replaceState'] as const) spyOn(history, method);
      const closesOn = async (change: () => void, context: string): Promise<HTMLButtonElement> => {
        const trigger = await openCommandsOf(row('Guide.pdf'));
        expect(commandDrawer()).withContext(context).not.toBeNull();
        change();
        await settle();
        expect(commandDrawer()).withContext(context).toBeNull();
        expect(document.body.style.overflow).withContext(context).not.toBe('hidden');
        return trigger;
      };

      let trigger = await closesOn(() => host.explorer().reload(), 'reload()');
      expect(document.activeElement).toBe(trigger);
      await closesOn(() => type(q<HTMLInputElement>('.search-input') as HTMLInputElement, 'gui'), 'keyword');
      type(q<HTMLInputElement>('.search-input') as HTMLInputElement, '');
      await settle();
      trigger = await closesOn(() => window.dispatchEvent(new PopStateEvent('popstate')), 'popstate');
      expect(document.activeElement).toBe(trigger);
      // The drawer owns no history entry: it never goes back or writes a state of its own.
      for (const method of ['back', 'forward', 'go', 'pushState', 'replaceState'] as const) expect(history[method]).not.toHaveBeenCalled();
      await closesOn(() => host.option.update(option => ({ ...option, list: listSpy() })), 'list callback');
      await closesOn(() => row('Projects').click(), 'folder');
      expect(q('.heading')?.textContent?.trim()).toBe('Projects');

      // A wide layout puts the commands back on the row: focus goes to the row of the item, not to the page.
      await openCommandsOf(row('Brief.docx'));
      host.width.set(1100);
      fixture.detectChanges();
      await wait(50);
      await settle();
      expect(commandDrawer()).toBeNull();
      expect(document.activeElement).toBe(row('Brief.docx'));
      expect(run).not.toHaveBeenCalled();
    });

    it('closes when its item leaves the listing and moves focus into the list instead of losing it', async () => {
      const data = tree();
      const upload = deferred<void>();
      const run = jasmine.createSpy('run');
      await setupCompact({ list: listSpy(data), upload: () => upload.promise, fileCommands: [{ title: 'Rename', click: run }] });
      pickFiles([new File(['x'], 'x.txt')]);
      await settle();
      const trigger = await openCommandsOf(row('Plan.xlsx'));
      data['root'] = data['root'].filter(entry => entry.id !== 'plan');
      upload.resolve();
      await settle();
      await settle();
      expect(commandDrawer()).toBeNull();
      expect(trigger.isConnected).toBeFalse();
      expect(run).not.toHaveBeenCalled();
      expect(document.activeElement?.getAttribute('data-item-id')).toBe('projects');
      expect(document.body.style.overflow).not.toBe('hidden');
    });

    it('drops a pressed command whose context changes before it runs, and releases the drawer when destroyed', async () => {
      const run = jasmine.createSpy('run');
      await setupCompact({ fileCommands: [{ title: 'Rename', click: run }] });
      await openCommandsOf(row('Guide.pdf'));
      commandEntries()[0].click();
      host.explorer().reload();
      await settle();
      expect(run).not.toHaveBeenCalled();

      await openCommandsOf(row('Guide.pdf'));
      commandEntries()[0].click();
      fixture.destroy();
      await wait(0);
      expect(run).not.toHaveBeenCalled();

      await setupCompact({ fileCommands: [{ title: 'Rename', click: run }] });
      await openCommandsOf(row('Guide.pdf'));
      expect(document.body.style.overflow).toBe('hidden');
      fixture.destroy();
      expect(document.body.style.overflow).not.toBe('hidden');
      // The drawer leaves <body> once the (noop) animation renderer flushes its removals.
      for (let i = 0; i < 20 && document.querySelector('.sd-file-explorer-command-drawer'); i++) await wait(10);
      expect(document.querySelector('.sd-file-explorer-command-drawer')).toBeNull();
      expect(run).not.toHaveBeenCalled();
    });

    it('never hands a command the item of a row the drawer was opened for before', async () => {
      const data = tree();
      const rename = jasmine.createSpy('rename');
      await setupCompact({ list: listSpy(data), fileCommands: [{ title: 'Rename', click: rename }] });
      await openCommandsOf(row('Guide.pdf'));
      const stale = commandEntries()[0];
      closeCommandDrawer();
      await settle();
      await openCommandsOf(row('Plan.xlsx'));
      expect(commandDrawer()?.querySelector('.sd-side-drawer-title')?.textContent?.trim()).toBe('Plan.xlsx');
      stale.click();
      await settle();
      expect(rename).not.toHaveBeenCalled();
      expect(commandDrawer()).not.toBeNull();
      commandEntries()[0].click();
      await settle();
      expect(rename).toHaveBeenCalledTimes(1);
      expect(rename.calls.mostRecent().args[0]).toBe(data['root'][2]);
    });

    // A press is checked once more right before the command runs, after the render that tears the drawer down: the
    // consumer may change things in between, and the drawer is already closed by then.
    describe('a pressed command, between the press and the render that runs it', () => {
      /** Opens Guide.pdf's drawer, presses the entry labelled `label`, applies `change`, then lets the command run. */
      async function press(label: string, change: () => void): Promise<void> {
        await openCommandsOf(row('Guide.pdf'));
        const entry = commandEntries().find(button => button.querySelector('.command-label')?.textContent?.trim() === label);
        if (!entry) throw new Error(`no drawer entry "${label}" in [${commandLabels().join(', ')}]`);
        entry.click();
        change();
        await settle();
        expect(commandDrawer()).withContext(label).toBeNull();
      }

      it('does not run once its own or its group state turns hidden, disabled or loading, signals or not', async () => {
        const locked = signal(false);
        const archived = new Set<string>(); // consumer state kept outside signals
        const syncing = signal(false);
        const rename = jasmine.createSpy('rename');
        const archive = jasmine.createSpy('archive');
        const move = jasmine.createSpy('move');
        const zip = jasmine.createSpy('zip');
        let zipping = false; // consumer state kept outside signals
        await setupCompact({
          fileCommands: [
            { title: 'Rename', disabled: () => locked(), click: rename },
            { title: 'Archive', hidden: entry => archived.has(entry.id), click: archive },
            { tooltip: 'More', loading: () => syncing(), children: [{ title: 'Move', click: move }] },
            { tooltip: 'Tools', children: [{ title: 'Zip', loading: () => zipping, click: zip }] },
          ],
        });
        await press('Rename', () => locked.set(true));
        await press('Archive', () => archived.add('guide'));
        await press('Move', () => syncing.set(true));
        await press('Zip', () => (zipping = true));
        expect(rename).not.toHaveBeenCalled();
        expect(archive).not.toHaveBeenCalled();
        expect(move).not.toHaveBeenCalled();
        expect(zip).not.toHaveBeenCalled();

        // Unchanged, the same press runs exactly once.
        locked.set(false);
        await settle();
        await press('Rename', () => undefined);
        expect(rename).toHaveBeenCalledTimes(1);
      });

      it('does not run once the consumer withdraws its definition, even with the same list callback', async () => {
        const rename = jasmine.createSpy('rename');
        const move = jasmine.createSpy('move');
        const commands = (): SdFileExplorerCommand[] => [
          { title: 'Rename', click: rename },
          { tooltip: 'More', children: [{ title: 'Move', click: move }] },
        ];
        await setupCompact({ fileCommands: commands() });
        const listing = list();
        // Removed from fileCommands.
        await press('Rename', () =>
          host.option.update(option => ({ ...option, fileCommands: [option.fileCommands?.[1] as SdFileExplorerCommand] }))
        );
        // Replaced by new definitions (same content, other objects): the pressed group is no longer declared.
        await press('Move', () => host.option.update(option => ({ ...option, fileCommands: commands() })));
        expect(rename).not.toHaveBeenCalled();
        expect(move).not.toHaveBeenCalled();
        // The provider did not change, so nothing was reset or listed again.
        expect(list()).toBe(listing);
        expect(listing).toHaveBeenCalledTimes(1);

        await press('Move', () => undefined);
        expect(move).toHaveBeenCalledTimes(1);
      });

      it('treats the row shortcuts the same way: a withdrawn one does not run, the other one still does', async () => {
        const download = jasmine.createSpy('download').and.returnValue(undefined);
        await setupCompact({ download, share: () => 'https://s.example/x' });
        // The download callback goes away before the render: nothing is queued.
        await press(t('download'), () => host.option.update(option => ({ ...option, download: undefined })));
        expect(download).not.toHaveBeenCalled();
        expect(transferCards()).toEqual([]);

        // Share is still offered although download changed again: it opens its dialog for the current item.
        host.option.update(option => ({ ...option, download }));
        await settle();
        await press(t('share'), () => host.option.update(option => ({ ...option, download: undefined })));
        expect(q('.dialog-title')?.textContent).toContain('Guide.pdf');
      });

      it('runs with the item the listing holds now, or not at all once the listing dropped it', async () => {
        const data = tree();
        let upload = deferred<void>();
        const rename = jasmine.createSpy('rename');
        await setupCompact({ list: listSpy(data), upload: () => upload.promise, fileCommands: [{ title: 'Rename', click: rename }] });
        /**
         * Presses Rename for the row `name`, then a finished upload lists the folder again as `next`: same provider, no
         * scope change, nothing that closes the drawer.
         */
        const relist = async (name: string, next: SdFileExplorerItem[]) => {
          pickFiles([new File(['x'], 'x.txt')]);
          await settle();
          await openCommandsOf(row(name));
          commandEntries()[0].click();
          data['root'] = next;
          upload.resolve();
          // why: let the new listing land before the render that runs the command.
          await wait(0);
          await settle();
          upload = deferred<void>();
        };

        // Same id, new object: the command gets the new one.
        const replaced = file('guide', null, 'Guide (v2).pdf', { mimeType: 'application/pdf' });
        await relist(
          'Guide.pdf',
          data['root'].map(entry => (entry.id === 'guide' ? replaced : entry))
        );
        expect(rename).toHaveBeenCalledTimes(1);
        expect(rename.calls.mostRecent().args[0]).toBe(replaced);

        // Gone from the listing: nothing runs, and focus stays inside the explorer.
        await relist(
          'Guide (v2).pdf',
          data['root'].filter(entry => entry.id !== 'guide')
        );
        expect(rename).toHaveBeenCalledTimes(1);
        expect(rowNames()).not.toContain('Guide (v2).pdf');
        expect(element().contains(document.activeElement)).toBeTrue();
      });
    });

    it('keeps section headings text-only, so they never repeat a child icon, while entries keep their icons and a busy section its spinner', async () => {
      const busy = signal(false);
      const click = () => undefined;
      await setupCompact({
        fileCommands: [
          {
            tooltip: 'Chia sẻ tệp',
            prefixIcon: 'share',
            children: [
              { title: 'Chia sẻ', prefixIcon: 'share', click },
              { title: 'Sao chép liên kết', prefixIcon: 'link', suffixIcon: 'content_copy', click },
            ],
          },
          {
            title: 'Công cụ',
            prefixIcon: 'build',
            fontSet: 'material-icons-outlined',
            color: 'warning',
            loading: () => busy(),
            children: [{ title: 'Nén', prefixIcon: 'folder_zip', click }],
          },
        ],
        folderCommands: [
          { tooltip: 'Chia sẻ thư mục', prefixIcon: 'share', children: [{ title: 'Chia sẻ thư mục', prefixIcon: 'share', click }] },
        ],
      });
      const headings = () => Array.from(commandDrawer()?.querySelectorAll<HTMLElement>('.group-label') ?? []);
      const icons = (element: Element) => Array.from(element.querySelectorAll('sd-icon')).map(icon => icon.textContent?.trim());

      await openCommandsOf(row('Guide.pdf'));
      expect(headings().map(heading => heading.textContent?.trim())).toEqual(['Chia sẻ tệp', 'Công cụ']);
      for (const heading of headings())
        expect(icons(heading))
          .withContext(heading.textContent ?? '')
          .toEqual([]);
      // Entries keep their prefix and suffix icons.
      expect(commandEntries().map(icons)).toEqual([['share'], ['link', 'content_copy'], ['folder_zip']]);

      // A busy section keeps its spinner and its spoken "in progress" in the heading, still without an icon.
      busy.set(true);
      fixture.detectChanges();
      const tools = headings()[1];
      const section = tools.closest('[role="group"]') as HTMLElement;
      expect(tools.querySelector('.spinner')).not.toBeNull();
      expect(icons(tools)).toEqual([]);
      expect(section.getAttribute('aria-busy')).toBe('true');
      const name = (section.getAttribute('aria-labelledby') ?? '').split(' ').map(id => document.getElementById(id)?.textContent?.trim());
      expect(name).toEqual(['Công cụ', t('action-loading')]);
      expect(commandEntries()[2].disabled).toBeTrue();
      expect(icons(commandEntries()[2])).toEqual(['folder_zip']);
      closeCommandDrawer();
      await settle();

      // Folder drawers too.
      await openCommandsOf(row('Projects'));
      expect(headings().map(heading => heading.textContent?.trim())).toEqual(['Chia sẻ thư mục']);
      expect(icons(headings()[0])).toEqual([]);
      expect(commandEntries().map(icons)).toEqual([['share']]);
      closeCommandDrawer();
      await settle();

      // The desktop group triggers keep their declared icons.
      host.width.set(1100);
      fixture.detectChanges();
      await wait(50);
      await settle();
      expect(icons(nativeButton(actionButtons(row('Guide.pdf'))[0]))).toEqual(['share']);
      expect(icons(nativeButton(actionButtons(row('Projects'))[0]))).toEqual(['share']);
    });

    it('paints the drawer header with the drawer surface, so a dark theme keeps title and close readable, and leaves other drawers alone', async () => {
      const tokens: Record<string, string> = {
        '--sd-surface': 'rgb(18, 19, 22)',
        '--sd-text': 'rgb(227, 226, 230)',
        '--sd-text-secondary': 'rgb(196, 198, 208)',
      };
      const root = document.documentElement.style;
      for (const [name, value] of Object.entries(tokens)) root.setProperty(name, value);
      try {
        await setupCompact({ preview: () => null, fileCommands: [{ title: 'Rename', click: () => undefined }] });
        const header = () => commandDrawer()?.querySelector('.sd-side-drawer-header') as HTMLElement;
        const background = (element: Element) => getComputedStyle(element).backgroundColor;

        // Dark surface: the header is the drawer's own surface, title and close keep Core's text tokens.
        await openCommandsOf(row('Guide.pdf'));
        expect(background(header())).toBe('rgb(18, 19, 22)');
        expect(background(header())).toBe(background(commandDrawer() as HTMLElement));
        expect(getComputedStyle(header().querySelector('.sd-side-drawer-title') as HTMLElement).color).toBe(tokens['--sd-text']);
        expect(getComputedStyle(header().querySelector('.sd-side-drawer-close-btn') as HTMLElement).color).toBe(
          tokens['--sd-text-secondary']
        );
        closeCommandDrawer();
        await settle();

        // Light surface: the header follows it as well.
        root.setProperty('--sd-surface', 'rgb(253, 251, 255)');
        await openCommandsOf(row('Guide.pdf'));
        expect(background(header())).toBe('rgb(253, 251, 255)');
        closeCommandDrawer();
        await settle();

        // Any other sd-side-drawer — here the explorer's own detail drawer — keeps Core's header.
        row('Cover.jpg').click();
        await settle();
        expect(background(detail()?.querySelector('.sd-side-drawer-header') as HTMLElement)).toBe('rgb(255, 255, 255)');
      } finally {
        for (const name of Object.keys(tokens)) root.removeProperty(name);
      }
    });

    it('opens folder commands of compact tree nodes in the same drawer and keeps the folder panel open for focus return', async () => {
      const data = tree();
      const rename = jasmine.createSpy('rename');
      await setupCompact({
        list: listSpy(data),
        folderCommands: [
          { title: 'Rename folder', prefixIcon: 'edit', click: rename },
          { tooltip: 'More folder actions', children: [{ title: 'Move', click: () => undefined }] },
        ],
      });
      q<HTMLButtonElement>('.toolbar .icon-button')?.click();
      fixture.detectChanges();
      const projects = treeNode('Projects');
      expect(projects.querySelector('.node-actions')).toBeNull();
      expect(treeNode(t('root')).querySelector('.sd-file-explorer-menu-trigger')).toBeNull();
      const trigger = menuTrigger(projects);
      // The tree keeps one tab stop: only the trigger of the focused node is in the tab order.
      expect(trigger.tabIndex).toBe(-1);
      projects.focus();
      fixture.detectChanges();
      expect(trigger.tabIndex).toBe(0);
      expect(menuTrigger(treeNode('Docs')).tabIndex).toBe(-1);
      expect(document.getElementById(projects.getAttribute('aria-labelledby') ?? '')?.textContent?.trim()).toBe('Projects');
      // Keys pressed on the trigger belong to it: they neither move through the tree nor open the folder.
      for (const key of ['ArrowDown', 'Enter', ' ']) keydown(trigger, key);
      await settle();
      expect(q('.heading')?.textContent?.trim()).toBe(t('root'));

      trigger.click();
      await settle();
      expect(commandDrawer()?.getAttribute('aria-label')).toBe('Projects');
      expect(commandLabels()).toEqual(['Rename folder', 'Move']);
      closeCommandDrawer();
      await settle();
      expect(q('aside.sidebar')?.classList).toContain('sidebar--open');
      expect(document.activeElement).toBe(trigger);

      trigger.click();
      await settle();
      commandEntries()[0].click();
      await settle();
      expect(rename).toHaveBeenCalledTimes(1);
      expect(rename.calls.mostRecent().args[0]).toBe(data['root'][1]);
      expect(q('.heading')?.textContent?.trim()).toBe(t('root'));
      expect(document.activeElement).toBe(trigger);
    });

    it('gives touch screens 44 px triggers, 48 px drawer entries and a 44 px close button', async () => {
      emulateTouch();
      await setupCompact({ download: () => undefined, share: () => 'https://s.example/x', folderCommands: [renameFolder()] });
      const guide = row('Guide.pdf');
      const box = menuTrigger(guide).getBoundingClientRect();
      expect([box.width, box.height]).toEqual([44, 44]);
      expect(guide.scrollWidth).toBeLessThanOrEqual(guide.clientWidth);
      await openCommandsOf(guide);
      const drawer = commandDrawer() as HTMLElement;
      expect(drawer.classList).toContain('sd-file-explorer-command-drawer--touch');
      for (const entry of commandEntries()) expect(entry.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
      const close = (drawer.querySelector('.sd-side-drawer-close-btn') as HTMLElement).getBoundingClientRect();
      expect([close.width, close.height]).toEqual([44, 44]);
    });

    it('keeps compact rows, cards, the selection band and the tree inside 320 and 390 px explorers', async () => {
      for (const width of [320, 390]) {
        await setupCompact(
          {
            selector: { actions: [{ title: 'Move', prefixIcon: 'drive_file_move', click: () => undefined }] },
            download: () => undefined,
            share: () => 'https://s.example/x',
            folderCommands: [renameFolder()],
          },
          width
        );
        toggle(selectBox('Guide.pdf'));
        for (const entry of qa('.row:not(.row--head)')) {
          const name = entry.querySelector('.name') as HTMLElement;
          expect(entry.scrollWidth).withContext(`${width} px row ${name.textContent}`).toBeLessThanOrEqual(entry.clientWidth);
          expect(menuTrigger(entry).getBoundingClientRect().right).toBeLessThanOrEqual(entry.getBoundingClientRect().right + 0.5);
          expect(overlaps(menuTrigger(entry), name)).toBeFalse();
        }
        const band = q('.selection') as HTMLElement;
        expect(band.scrollWidth).withContext(`${width} px band`).toBeLessThanOrEqual(band.clientWidth);
        qa<HTMLButtonElement>('.icon-button--toggle')[1].click();
        fixture.detectChanges();
        for (const entry of qa('.card')) expect(entry.scrollWidth).withContext(`${width} px card`).toBeLessThanOrEqual(entry.clientWidth);
        q<HTMLButtonElement>('.toolbar .icon-button')?.click();
        fixture.detectChanges();
        for (const node of qa('[role="treeitem"]'))
          expect(node.scrollWidth).withContext(`${width} px tree`).toBeLessThanOrEqual(node.clientWidth);
        fixture.destroy();
      }
    });

    it('emits derived data-autoid attributes for the triggers and the drawer', async () => {
      await setupCompact({
        autoId: 'drive',
        download: () => undefined,
        share: () => 'https://s.example/x',
        folderCommands: [renameFolder(), { tooltip: 'More', children: [{ title: 'Move', click: () => undefined }] }],
      });
      for (const suffix of ['item-guide-commands', 'item-projects-commands', 'tree-projects-commands']) {
        expect(q(`[data-autoid="components-file-explorer-drive-${suffix}"]`))
          .withContext(suffix)
          .not.toBeNull();
      }
      await openCommandsOf(row('Guide.pdf'));
      const drawer = commandDrawer() as HTMLElement;
      expect(drawer.getAttribute('data-autoid')).toBe('components-side-drawer-file-explorer-drive-commands');
      for (const suffix of ['commands', 'commands-share', 'commands-download']) {
        expect(drawer.querySelector(`[data-autoid="components-file-explorer-drive-${suffix}"]`))
          .withContext(suffix)
          .not.toBeNull();
      }
      closeCommandDrawer();
      await settle();
      await openCommandsOf(row('Projects'));
      for (const suffix of ['commands-0', 'commands-1-0']) {
        expect(commandDrawer()?.querySelector(`[data-autoid="components-file-explorer-drive-${suffix}"]`))
          .withContext(suffix)
          .not.toBeNull();
      }
    });
  });
});
