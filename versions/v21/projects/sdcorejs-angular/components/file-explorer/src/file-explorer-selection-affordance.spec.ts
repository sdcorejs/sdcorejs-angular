import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdFileExplorer } from './file-explorer.component';
import { SdFileExplorerItemList } from './components/item-list.component';
import type {
  SdFileExplorerItem,
  SdFileExplorerOption,
  SdFileExplorerSelectionAction,
  SdFileExplorerSelector,
} from './file-explorer.model';

@Component({ imports: [SdFileExplorer], template: '<sd-file-explorer [option]="option()" />' })
class SelectionHost {
  readonly files: SdFileExplorerItem[] = [
    { id: 'a', parentId: null, kind: 'file', name: 'A.pdf' },
    { id: 'b', parentId: null, kind: 'file', name: 'B.pdf' },
  ];
  readonly list = () => this.files;
  readonly option = signal<SdFileExplorerOption>({ list: this.list, selector: {} });
  readonly explorer = viewChild.required(SdFileExplorer);
}

describe('Explorer useful selection affordances', () => {
  let fixture: ComponentFixture<SelectionHost>;
  let host: SelectionHost;
  let root: HTMLElement;
  const action = (extra: Partial<SdFileExplorerSelectionAction> = {}): SdFileExplorerSelectionAction =>
    ({ title: 'Selected action', onClick: () => undefined, ...extra }) as SdFileExplorerSelectionAction;
  const picker = (mode: 'picker' | 'actions'): SdFileExplorerSelector => ({ visible: true, mode }) as SdFileExplorerSelector;
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  async function setup(selector: SdFileExplorerSelector = {}, fileCount = 2) {
    TestBed.configureTestingModule({ imports: [SelectionHost], providers: [provideNoopAnimations()] });
    fixture = TestBed.createComponent(SelectionHost);
    host = fixture.componentInstance;
    if (fileCount === 3) host.files.push({ id: 'c', parentId: null, kind: 'file', name: 'C.pdf' });
    host.option.set({ list: host.list, selector });
    root = fixture.nativeElement;
    await settle();
  }
  function selected() {
    return (host.explorer() as unknown as { selectedItems(): readonly SdFileExplorerItem[] }).selectedItems();
  }
  async function choose() {
    root.querySelector<HTMLInputElement>('[data-item-id="a"] input[type="checkbox"]')!.click();
    await settle();
  }
  function expectNoSelection() {
    expect(root.querySelectorAll('.select,.select-all').length).toBe(0);
    expect(root.querySelector('.selection')).toBeNull();
    expect(selected()).toEqual([]);
  }
  afterEach(() => fixture?.destroy());

  for (const fileCount of [2, 3]) {
    it(`retains intermediate selections until a nonmonotonic action becomes visible with ${fileCount} files`, async () => {
      const run = jasmine.createSpy('run');
      await setup({ actions: [{ title: 'Exactly two', hidden: items => items.length !== 2, onClick: run }] }, fileCount);
      expect(root.querySelectorAll('.select,.select-all').length).toBe(fileCount + 1);
      await choose();
      expect(selected().map(file => file.id)).toEqual(['a']);
      expect(root.querySelectorAll('.select,.select-all').length).toBe(fileCount + 1);
      expect(root.querySelector('.selection-actions sd-button')).toBeNull();
      root.querySelector<HTMLInputElement>('[data-item-id="b"] input[type="checkbox"]')!.click();
      await settle();
      expect(selected().map(file => file.id)).toEqual(['a', 'b']);
      root.querySelector<HTMLButtonElement>('.selection-actions sd-button button')!.click();
      await settle();
      expect(run).toHaveBeenCalledOnceWith([host.files[0], host.files[1]]);
    });
  }

  for (const view of ['list', 'grid'] as const) {
    it(`hides all ${view} selection controls when no actions or picker callback exist`, async () => {
      await setup();
      host.option.update(o => ({ ...o, defaultView: view }));
      (host.explorer() as unknown as { view: { set(v: string): void } }).view.set(view);
      await settle();
      expectNoSelection();
      fixture.debugElement.query(By.directive(SdFileExplorerItemList)).componentInstance.toggleSelect.emit(host.files[0]);
      await settle();
      expectNoSelection();
      root.querySelector<HTMLElement>('[data-item-id="a"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await settle();
      expect(selected()).toEqual([]);
    });
  }
  for (const actions of [
    [],
    [{ title: 'Empty group', children: [] }],
    [{ title: 'Hidden group', children: [{ title: 'Hidden leaf', hidden: true, onClick: () => undefined }] }],
    [action({ hidden: true })],
  ] as readonly SdFileExplorerSelectionAction[][]) {
    it(`hides selection for ${JSON.stringify(actions.map(a => a.title))}`, async () => {
      await setup({ actions });
      expectNoSelection();
    });
  }
  it('keeps disabled actions visible and retains selection', async () => {
    const disabled = signal(false);
    await setup({ actions: [action({ disabled: () => disabled() })] });
    await choose();
    disabled.set(true);
    await settle();
    expect(root.querySelectorAll('.select,.select-all').length).toBe(3);
    expect(selected().map(f => f.id)).toEqual(['a']);
    const button = fixture.debugElement.query(By.css('.selection-actions sd-button')).componentInstance as SdButton;
    expect(button.disabled()).toBeTrue();
  });
  it('hides and clears when all configured actions become statically hidden, then returns unchecked when visible again', async () => {
    const clear = jasmine.createSpy('clear');
    await setup({ actions: [action({ hidden: false })], onClear: clear });
    await choose();
    host.option.update(o => ({ ...o, selector: { actions: [action({ hidden: true })], onClear: clear } }));
    await settle();
    expectNoSelection();
    expect(clear).toHaveBeenCalledTimes(1);
    host.option.update(o => ({ ...o, selector: { actions: [action({ hidden: false })], onClear: clear } }));
    await settle();
    expect(root.querySelectorAll('.select,.select-all').length).toBe(3);
    expect(selected()).toEqual([]);
  });
  it('updates context-dependent action visibility without discarding a reachable intermediate selection', async () => {
    const hidden = signal(false),
      clear = jasmine.createSpy('clear');
    await setup({ actions: [action({ hidden: () => hidden() })], onClear: clear });
    await choose();
    hidden.set(true);
    await settle();
    expect(root.querySelector('.selection-actions sd-button')).toBeNull();
    expect(root.querySelectorAll('.select,.select-all').length).toBe(3);
    expect(selected().map(file => file.id)).toEqual(['a']);
    expect(clear).not.toHaveBeenCalled();
    hidden.set(false);
    await settle();
    expect(root.querySelector('.selection-actions sd-button')).not.toBeNull();
    expect(selected().map(file => file.id)).toEqual(['a']);
  });
  it('handles runtime configuration withdrawal and blocks stale checkbox events', async () => {
    await setup({ actions: [action()] });
    await choose();
    host.option.update(o => ({ ...o, selector: { actions: [] } }));
    await settle();
    fixture.debugElement.query(By.directive(SdFileExplorerItemList)).componentInstance.toggleSelect.emit(host.files[1]);
    await settle();
    expectNoSelection();
  });
  it('recognizes a visible action for a prospective single-item selection', async () => {
    await setup({ actions: [action({ hidden: items => items.length !== 1 })] });
    expect(root.querySelector('.select')).not.toBeNull();
    await choose();
    expect(root.querySelector('.selection-actions sd-button')).not.toBeNull();
  });
  it('preserves existing callback-owned picker selection without actions', async () => {
    const pick = jasmine.createSpy('pick');
    await setup({ onSelect: pick });
    await choose();
    expect(pick).toHaveBeenCalledWith(host.files[0], [host.files[0]]);
    expect(selected().length).toBe(1);
  });
  it('supports explicit picker mode while explicit action mode requires a visible action', async () => {
    await setup(picker('picker'));
    await choose();
    expect(selected().length).toBe(1);
    host.option.update(o => ({ ...o, selector: { ...picker('actions'), onSelect: () => undefined } }));
    await settle();
    expectNoSelection();
  });
  it('places configured move/share/download in the selection action area and dispatches their real callbacks', async () => {
    const download = jasmine.createSpy('download').and.returnValue(undefined),
      share = jasmine.createSpy('share').and.returnValue('https://example.test/share');
    await setup();
    host.option.update(o => ({ ...o, move: { onMove: () => true }, download, share }));
    await settle();
    await choose();
    expect(root.querySelector('.move-selection-button')).toBeNull();
    const buttons = fixture.debugElement.queryAll(By.css('.selection-actions sd-button'));
    expect(buttons.map(b => (b.componentInstance as SdButton).prefixIcon())).toEqual(['drive_file_move', 'share', 'file_download']);
    buttons[2].nativeElement.querySelector('button').click();
    await settle();
    expect(download).toHaveBeenCalled();
    buttons[1].nativeElement.querySelector('button').click();
    await settle();
    expect(share).toHaveBeenCalled();
  });
  it('uses sm Core buttons for narrow selector and move-picker footer without custom visual geometry', async () => {
    await setup();
    host.option.update(o => ({ ...o, move: { onMove: () => true } }));
    await settle();
    root.style.width = '390px';
    root.style.display = 'block';
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    await settle();
    await choose();
    const move = fixture.debugElement.query(By.css('.selection-actions sd-button'));
    expect((move.componentInstance as SdButton).size()).toBe('sm');
    move.nativeElement.querySelector('button').click();
    await settle();
    for (const b of fixture.debugElement.queryAll(By.css('.move-picker .dialog-actions sd-button')))
      expect((b.componentInstance as SdButton).size()).toBe('sm');
  });
  it('uses sm Core Share/Download buttons in the mobile item preview footer', async () => {
    await setup();
    host.option.update(o => ({ ...o, download: () => undefined, share: () => 'https://example.test/share' }));
    root.style.width = '390px';
    root.style.display = 'block';
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    await settle();
    root.querySelector<HTMLElement>('[data-item-id="a"] .name')!.click();
    await settle();
    // The Core drawer reparents its physical footer into the owned main region; query actual component instances.
    const buttons = fixture.debugElement
      .queryAll(By.directive(SdButton))
      .filter(b => b.nativeElement.classList.contains('share-button') || b.nativeElement.classList.contains('download-button'));
    expect(buttons.length).toBe(2);
    expect(buttons.map(b => (b.componentInstance as SdButton).size())).toEqual(['sm', 'sm']);
  });
  it('keeps the per-file Core touch target outside its visual box reachable without unclipping the filename', async () => {
    await setup();
    host.option.update(o => ({ ...o, move: { onMove: () => true } }));
    root.style.width = '320px';
    root.style.display = 'block';
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    await settle();
    const button = root.querySelector<HTMLButtonElement>('[data-item-id="a"] .move-file-button button')!;
    const cell = button.closest<HTMLElement>('.cell--name')!;
    expect(getComputedStyle(cell).overflowY).toBe('visible');
    expect(getComputedStyle(cell.querySelector<HTMLElement>('.name')!).overflowY).toBe('hidden');
    expect(cell.querySelector<HTMLElement>('.name')!.getBoundingClientRect().width).toBeGreaterThan(0);
    const component = fixture.debugElement.query(By.css('[data-item-id="a"] .move-file-button')).componentInstance as SdButton;
    expect(component.size()).toBe('sm');
    button.click();
    await settle();
    expect(root.querySelector('.move-picker')).not.toBeNull();
  });
});
