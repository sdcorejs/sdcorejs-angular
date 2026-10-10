import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SdFileExplorer } from './file-explorer.component';
import { SdFileExplorerFolderTree } from './components/folder-tree.component';
import type { SdFileExplorerTreeNode } from './file-explorer.view-model';
import type {
  SdFileExplorerOption,
  SdFileExplorerDataSourceOption,
  SdFileExplorerItem,
  SdFileExplorerSearchArgs,
} from './file-explorer.model';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdFileExplorer],
  template: '<div style="width:1100px;height:760px"><sd-file-explorer [option]="option()" /></div>',
})
class ReviewHost {
  readonly first: SdFileExplorerItem = { id: 'a', parentId: null, name: 'A', kind: 'file' };
  readonly second: SdFileExplorerItem = { id: 'b', parentId: null, name: 'B', kind: 'file' };
  readonly folder: SdFileExplorerItem = { id: 'f', parentId: null, name: 'Folder', kind: 'folder' };
  readonly fresh: SdFileExplorerItem = { ...this.first, parentId: 'remote-a' };
  readonly uncached: SdFileExplorerItem = { id: 'c', parentId: 'remote-c', name: 'C', kind: 'file' };
  readonly locked = signal(false);
  readonly list = jasmine.createSpy('list').and.returnValue([this.first, this.second, this.folder]);
  readonly search = jasmine.createSpy('search').and.returnValue([this.fresh, this.uncached]);
  readonly move = jasmine.createSpy('move').and.returnValue(true);
  readonly option = signal<SdFileExplorerOption>({
    list: this.list,
    search: this.search,
    selector: { disabled: item => this.locked() && item.id === 'a' },
    move: { onMove: this.move },
  });
  readonly explorer = viewChild.required(SdFileExplorer);
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdFileExplorer],
  template: '<sd-file-explorer [option]="option()" />',
})
class SourceReviewHost {
  readonly item: SdFileExplorerItem = { id: 'source', parentId: null, name: 'Source result', kind: 'file' };
  readonly replacementItem: SdFileExplorerItem = { id: 'replacement', parentId: null, name: 'Replacement result', kind: 'file' };
  readonly list = jasmine.createSpy('sourceList').and.returnValue([]);
  readonly search = jasmine.createSpy('sourceSearch').and.returnValue([]);
  readonly option = signal<SdFileExplorerDataSourceOption>({ dataSource: { onList: this.list, onSearch: this.search } });
}
describe('Explorer reviewed provider and move boundaries', () => {
  async function setup() {
    TestBed.configureTestingModule({ imports: [ReviewHost], providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(ReviewHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
  }
  async function search(root: HTMLElement, keyword = 'remote') {
    const input = root.querySelector<HTMLInputElement>('.search-input')!;
    input.value = keyword;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 350));
  }
  it('leaves unrelated picker keys available to outer handlers', async () => {
    const { fixture, root } = await setup();
    root.querySelector<HTMLButtonElement>('.move-file-button button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const outer = jasmine.createSpy('outer unrelated key handler');
    document.addEventListener('keydown', outer);
    try {
      const event = new KeyboardEvent('keydown', { key: 'q', bubbles: true, cancelable: true });
      root.querySelector<HTMLElement>('.move-picker h3')!.dispatchEvent(event);
      expect(outer).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBeFalse();
    } finally {
      document.removeEventListener('keydown', outer);
      fixture.destroy();
    }
  });
  it('retains Escape ownership and restores the picker opener', async () => {
    const { fixture, root } = await setup();
    const opener = root.querySelector<HTMLButtonElement>('.move-file-button button')!;
    opener.focus();
    opener.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const outer = jasmine.createSpy('outer Escape handler');
    const listener = (event: KeyboardEvent) => {
      if (!event.defaultPrevented) outer(event);
    };
    document.addEventListener('keydown', listener);
    try {
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      root.querySelector<HTMLElement>('.move-picker h3')!.dispatchEvent(event);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(root.querySelector('.move-picker')).toBeNull();
      expect(document.activeElement).toBe(opener);
      expect(outer).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBeTrue();
    } finally {
      document.removeEventListener('keydown', listener);
      fixture.destroy();
    }
  });
  for (const shiftKey of [false, true]) {
    it(`owns ${shiftKey ? 'Shift+Tab' : 'Tab'} inside the picker without preventing native focus movement`, async () => {
      const { fixture, root } = await setup();
      root.querySelector<HTMLButtonElement>('.move-file-button button')!.click();
      fixture.detectChanges();
      await fixture.whenStable();
      const outer = jasmine.createSpy('outer modal Tab handler').and.callFake((event: KeyboardEvent) => event.preventDefault());
      document.addEventListener('keydown', outer);
      try {
        const event = new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', shiftKey, bubbles: true, cancelable: true });
        root.querySelector<HTMLElement>('.move-picker .move-cancel-button button')!.dispatchEvent(event);
        expect(outer).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBeFalse();
      } finally {
        document.removeEventListener('keydown', outer);
        fixture.destroy();
      }
    });
  }
  it('moves fresh same-ID and uncached mixed-parent search objects without replacing their identities', async () => {
    const { fixture, host, root } = await setup();
    await search(root);
    fixture.detectChanges();
    expect(await host.explorer().moveFiles([host.fresh, host.uncached], host.folder)).toBeTrue();
    expect(host.move).toHaveBeenCalledTimes(1);
    expect(host.move.calls.mostRecent().args[0].items[0]).toBe(host.fresh);
    expect(host.move.calls.mostRecent().args[0].items[1]).toBe(host.uncached);
    fixture.destroy();
  });
  it('refreshes cached folders containing moved IDs from fresh search snapshots', async () => {
    const { fixture, host, root } = await setup();
    await search(root);
    host.move.and.callFake(() => {
      host.first.parentId = host.folder.id;
      host.list.and.returnValue([host.second, host.folder]);
      return true;
    });
    expect(await host.explorer().moveFiles([host.fresh], host.folder)).toBeTrue();
    expect(host.list).toHaveBeenCalledTimes(2);
    await search(root, '');
    fixture.detectChanges();
    expect(root.querySelector('[data-item-id="a"]')).toBeNull();
    expect(root.querySelector('[data-item-id="b"]')).not.toBeNull();
    expect(host.move).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });
  it('aborts and reruns an unchanged keyword when only the search provider changes', async () => {
    const { fixture, host, root } = await setup();
    let resolve!: (items: SdFileExplorerItem[]) => void;
    host.search.and.returnValue(new Promise<SdFileExplorerItem[]>(r => (resolve = r)));
    await search(root);
    const original = host.search.calls.mostRecent().args[0] as SdFileExplorerSearchArgs;
    const replacement = jasmine.createSpy('replacement').and.returnValue([host.uncached]);
    host.option.update(option => ({ ...option, search: replacement }));
    fixture.detectChanges();
    await new Promise(r => setTimeout(r, 30));
    fixture.detectChanges();
    expect(original.signal.aborted).toBeTrue();
    expect(replacement).toHaveBeenCalledTimes(1);
    resolve([host.fresh]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('[data-item-id="c"]')).not.toBeNull();
    expect(root.querySelector('[data-item-id="a"]')).toBeNull();
    fixture.destroy();
  });
  it('aborts a removed search provider and retains the list cache for local filtering', async () => {
    const { fixture, host, root } = await setup();
    let resolve!: (items: SdFileExplorerItem[]) => void;
    host.search.and.returnValue(new Promise<SdFileExplorerItem[]>(r => (resolve = r)));
    await search(root, 'A');
    const original = host.search.calls.mostRecent().args[0] as SdFileExplorerSearchArgs;
    host.option.update(option => ({ ...option, search: undefined }));
    fixture.detectChanges();
    expect(original.signal.aborted).toBeTrue();
    resolve([{ ...host.uncached, name: 'A obsolete' }]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.list).toHaveBeenCalledTimes(1);
    expect(root.querySelector('[data-item-id="a"]')).not.toBeNull();
    expect(root.querySelector('[data-item-id="c"]')).toBeNull();
    fixture.destroy();
  });
  it('replaces dataSource.onSearch without reloading onList or accepting its stale response', async () => {
    TestBed.configureTestingModule({ imports: [SourceReviewHost], providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(SourceReviewHost);
    const host = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    let resolve!: (items: SdFileExplorerItem[]) => void;
    host.search.and.returnValue(new Promise<SdFileExplorerItem[]>(r => (resolve = r)));
    fixture.detectChanges();
    await fixture.whenStable();
    await search(root);
    const original = host.search.calls.mostRecent().args[0] as SdFileExplorerSearchArgs;
    const replacement = jasmine.createSpy('sourceReplacement').and.returnValue([host.replacementItem]);
    host.option.update(option => ({ ...option, dataSource: { ...option.dataSource, onSearch: replacement } }));
    fixture.detectChanges();
    expect(original.signal.aborted).toBeTrue();
    resolve([host.item]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(replacement).toHaveBeenCalledTimes(1);
    expect(host.list).toHaveBeenCalledTimes(1);
    expect(root.querySelector('[data-item-id="replacement"]')).not.toBeNull();
    expect(root.querySelector('[data-item-id="source"]')).toBeNull();
    fixture.destroy();
  });
  it('retains API moves without a selector', async () => {
    const { fixture, host } = await setup();
    host.option.update(option => ({ ...option, selector: undefined }));
    fixture.detectChanges();
    expect(await host.explorer().moveFiles([host.first], host.folder)).toBeTrue();
    expect(host.move).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });
  it('keeps unselected single-file drag governed by movable rather than selector eligibility', async () => {
    const { fixture, host, root } = await setup();
    host.locked.set(true);
    fixture.detectChanges();
    const transfer = new DataTransfer();
    root
      .querySelector<HTMLElement>('[data-item-id="a"] .name')!
      .dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: transfer }));
    root
      .querySelector<HTMLElement>('[data-item-id="f"]')!
      .dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
    await fixture.whenStable();
    expect(host.move).toHaveBeenCalledTimes(1);
    expect(host.move.calls.mostRecent().args[0].items).toEqual([host.first]);
    fixture.destroy();
  });
  it('rejects the entire selected drag snapshot when a member becomes selection-disabled', async () => {
    const { fixture, host, root } = await setup();
    root.querySelector<HTMLInputElement>('[data-item-id="a"] .cell--select input')!.click();
    root.querySelector<HTMLInputElement>('[data-item-id="b"] .cell--select input')!.click();
    fixture.detectChanges();
    const transfer = new DataTransfer();
    root
      .querySelector<HTMLElement>('[data-item-id="a"] .name')!
      .dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: transfer }));
    host.locked.set(true);
    fixture.detectChanges();
    root
      .querySelector<HTMLElement>('[data-item-id="f"]')!
      .dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
    await fixture.whenStable();
    expect(host.move).not.toHaveBeenCalled();
    fixture.destroy();
  });
  it('rechecks the selected picker snapshot without shrinking the batch', async () => {
    const { fixture, host, root } = await setup();
    root.querySelector<HTMLInputElement>('[data-item-id="a"] .cell--select input')!.click();
    root.querySelector<HTMLInputElement>('[data-item-id="b"] .cell--select input')!.click();
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('.selection-actions sd-button button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    Array.from(root.querySelectorAll<HTMLElement>('.move-picker [role="treeitem"]'))
      .find(e => e.textContent?.includes('Folder'))!
      .click();
    fixture.detectChanges();
    host.locked.set(true);
    fixture.detectChanges();
    expect(root.querySelector<HTMLButtonElement>('.move-submit-button button')!.disabled).toBeTrue();
    root.querySelector<HTMLButtonElement>('.move-submit-button button')!.click();
    await fixture.whenStable();
    expect(host.move).not.toHaveBeenCalled();
    fixture.destroy();
  });
});

describe('Explorer touch retry name layout', () => {
  for (const direction of ['ltr', 'rtl']) {
    for (const scale of [1, 2]) {
      it(`retains readable Projects text and 48px controls at narrow ${direction} and text scale ${scale}`, () => {
        TestBed.configureTestingModule({ imports: [SdFileExplorerFolderTree] });
        const fixture = TestBed.createComponent(SdFileExplorerFolderTree);
        const nodes: SdFileExplorerTreeNode[] = [
          {
            key: 'f:project',
            id: 'project',
            item: null,
            name: 'Projects',
            level: 2,
            expandable: true,
            expanded: true,
            status: 'error',
            selected: false,
          },
        ];
        fixture.componentRef.setInput('nodes', nodes);
        fixture.componentRef.setInput('touch', true);
        const host = fixture.nativeElement as HTMLElement;
        host.style.width = '166px';
        host.style.direction = direction;
        host.style.setProperty('--sd-font-size-15', `${15 * scale}px`);
        host.style.setProperty('--sd-line-height-20', `${20 * scale}px`);
        fixture.detectChanges();
        const label = host.querySelector<HTMLElement>('.label')!;
        expect(label.getBoundingClientRect().width).toBeGreaterThanOrEqual(label.scrollWidth - 1);
        expect(label.getBoundingClientRect().width).toBeGreaterThan(0);
        for (const button of host.querySelectorAll<HTMLElement>('.toggle, .retry')) {
          expect(button.getBoundingClientRect().width).toBeGreaterThanOrEqual(48);
          expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
        }
        expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth + 1);
        const retry = spyOn(fixture.componentInstance.retry, 'emit');
        const select = spyOn(fixture.componentInstance.select, 'emit');
        host.querySelector<HTMLButtonElement>('.retry')!.click();
        expect(retry).toHaveBeenCalledTimes(1);
        expect(select).not.toHaveBeenCalled();
        fixture.destroy();
      });
    }
  }
  for (const direction of ['ltr', 'rtl']) {
    it(`shows the entire long error folder name with enlarged text in ${direction}`, () => {
      TestBed.configureTestingModule({ imports: [SdFileExplorerFolderTree] });
      const fixture = TestBed.createComponent(SdFileExplorerFolderTree);
      const name = 'ProjectReportingFolderWithoutSeparatorsForReadableRetry';
      const nodes: SdFileExplorerTreeNode[] = [
        { key: 'f:long', id: 'long', item: null, name, level: 2, expandable: true, expanded: true, status: 'error', selected: false },
      ];
      fixture.componentRef.setInput('nodes', nodes);
      fixture.componentRef.setInput('touch', true);
      const host = fixture.nativeElement as HTMLElement;
      host.style.width = '166px';
      host.style.direction = direction;
      host.style.setProperty('--sd-font-size-15', '30px');
      host.style.setProperty('--sd-line-height-20', '40px');
      fixture.detectChanges();
      const label = host.querySelector<HTMLElement>('.label')!;
      expect(label.textContent).toBe(name);
      expect(label.getBoundingClientRect().width).toBeGreaterThanOrEqual(label.scrollWidth - 1);
      expect(label.getBoundingClientRect().height).toBeGreaterThan(40);
      expect(label.clientHeight).toBeGreaterThanOrEqual(label.scrollHeight - 1);
      expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth + 1);
      for (const button of host.querySelectorAll<HTMLElement>('.toggle, .retry')) {
        expect(button.getBoundingClientRect().width).toBeGreaterThanOrEqual(48);
        expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
      }
      fixture.destroy();
    });
  }
});
