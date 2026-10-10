import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SdFileExplorer } from './file-explorer.component';
import type { SdFileExplorerItem, SdFileExplorerOption, SdFileExplorerMoveRequest } from './file-explorer.model';

@Component({ standalone: true, imports: [SdFileExplorer], template: '<sd-file-explorer [option]="option" />' })
class MoveHost {
  readonly file: SdFileExplorerItem = { id: 'a', parentId: null, name: 'A', kind: 'file' };
  readonly target: SdFileExplorerItem = { id: 'f', parentId: null, name: 'Folder', kind: 'folder' };
  readonly second: SdFileExplorerItem = { id: 'b', parentId: null, name: 'B', kind: 'file' };
  readonly list = jasmine.createSpy('list').and.callFake(() => [this.file, this.second, this.target]);
  readonly onMove = jasmine.createSpy('onMove').and.returnValue(true);
  readonly option: SdFileExplorerOption = { list: this.list, selector: {}, move: { onMove: this.onMove } };
  readonly explorer = viewChild.required(SdFileExplorer);
}
describe('Explorer consumer-controlled move lifecycle', () => {
  async function setup() {
    TestBed.configureTestingModule({ imports: [MoveHost], providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(MoveHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const api = host.explorer() as unknown as {
      moveFiles(
        items: readonly SdFileExplorerItem[],
        target: SdFileExplorerItem | null,
        source?: SdFileExplorerMoveRequest['source']
      ): Promise<boolean>;
      cancelMove(): void;
      retryMoveRefresh(): Promise<boolean>;
    };
    return { fixture, host, api };
  }
  it('awaits a single mutation, preserves item identity and refreshes only after acceptance', async () => {
    const { fixture, host, api } = await setup();
    let accept!: (accepted: boolean) => void;
    host.onMove.and.returnValue(new Promise<boolean>(resolve => (accept = resolve)));
    const pending = api.moveFiles([host.file], host.target);
    expect(host.onMove.calls.mostRecent().args[0].items[0]).toBe(host.file);
    expect(Object.isFrozen(host.onMove.calls.mostRecent().args[0].items)).toBeTrue();
    expect(host.list).toHaveBeenCalledTimes(1);
    expect(await api.moveFiles([host.file], host.target)).toBeFalse();
    accept(true);
    expect(await pending).toBeTrue();
    expect(host.onMove).toHaveBeenCalledTimes(1);
    expect(host.list).toHaveBeenCalledTimes(2);
    fixture.destroy();
  });
  it('false/denied/throw never refresh or clear the original list', async () => {
    const { fixture, host, api } = await setup();
    host.onMove.and.returnValue(false);
    expect(await api.moveFiles([host.file], host.target)).toBeFalse();
    host.option.move!.movable = false;
    expect(await api.moveFiles([host.file], host.target)).toBeFalse();
    expect(host.onMove).toHaveBeenCalledTimes(1);
    host.option.move!.movable = true;
    host.onMove.and.throwError('denied');
    expect(await api.moveFiles([host.file], host.target)).toBeFalse();
    expect(host.list).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });
  it('refresh failure retries only refresh and never repeats the accepted mutation', async () => {
    const { fixture, host, api } = await setup();
    host.list.and.throwError('offline');
    expect(await api.moveFiles([host.file], host.target)).toBeFalse();
    host.list.and.returnValue([host.target]);
    expect(await api.retryMoveRefresh()).toBeTrue();
    expect(host.onMove).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });
  it('cancel aborts cooperatively and ignores a late accepted mutation result', async () => {
    const { fixture, host, api } = await setup();
    let accept!: (accepted: boolean) => void;
    host.onMove.and.returnValue(new Promise<boolean>(resolve => (accept = resolve)));
    const pending = api.moveFiles([host.file], host.target);
    const request = host.onMove.calls.mostRecent().args[0] as SdFileExplorerMoveRequest;
    api.cancelMove();
    expect(request.signal.aborted).toBeTrue();
    accept(true);
    expect(await pending).toBeFalse();
    expect(host.list).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });
  it('the dedicated picker is available with empty custom commands and shares the same callback', async () => {
    const { fixture, host } = await setup();
    host.option.fileCommands = [];
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    root.querySelector<HTMLButtonElement>('.move-file-button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const folder = Array.from(root.querySelectorAll<HTMLElement>('.move-picker [role="treeitem"]')).find(node =>
      node.textContent?.includes('Folder')
    )!;
    folder.click();
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('.move-submit-button button')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.onMove).toHaveBeenCalledTimes(1);
    expect(root.querySelector('.move-picker')).toBeNull();
    fixture.destroy();
  });
  it('native internal drag resolves only its own memory token and uses the drag pipeline', async () => {
    const { fixture, host } = await setup();
    const root: HTMLElement = fixture.nativeElement;
    const transfer = new DataTransfer();
    root
      .querySelector<HTMLElement>('[data-item-id="a"] .name')!
      .dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: transfer }));
    const token = transfer.getData('application/x-sd-file-explorer-move');
    expect(token).toBeTruthy();
    root
      .querySelector<HTMLElement>('[data-item-id="f"]')!
      .dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
    await fixture.whenStable();
    expect(host.onMove).toHaveBeenCalledTimes(1);
    expect(host.onMove.calls.mostRecent().args[0].source).toBe('drag');
    expect(host.onMove.calls.mostRecent().args[0].items[0]).toBe(host.file);
    fixture.destroy();
  });
  it('forged tokens and mixed internal/native file payloads never mutate or upload', async () => {
    const { fixture, host } = await setup();
    const root: HTMLElement = fixture.nativeElement;
    const upload = jasmine.createSpy('upload');
    host.option.upload = upload;
    const forged = new DataTransfer();
    forged.setData('application/x-sd-file-explorer-move', JSON.stringify([host.file]));
    root
      .querySelector<HTMLElement>('[data-item-id="f"]')!
      .dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: forged }));
    const mixed = new DataTransfer();
    root
      .querySelector<HTMLElement>('[data-item-id="a"] .name')!
      .dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: mixed }));
    mixed.items.add(new File(['x'], 'external.txt'));
    root
      .querySelector<HTMLElement>('[data-item-id="f"]')!
      .dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: mixed }));
    await fixture.whenStable();
    expect(host.onMove).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
    fixture.destroy();
  });
  it('captures source parents before the consumer changes its original item objects', async () => {
    const { fixture, host, api } = await setup();
    host.onMove.and.callFake(() => {
      host.file.parentId = host.target.id;
      return true;
    });
    expect(await api.moveFiles([host.file], host.target)).toBeTrue();
    expect(host.list.calls.mostRecent().args[0].parentId).toBeNull();
    fixture.destroy();
  });
  it('selected-file drag preserves visible order while unselected drag leaves selection untouched', async () => {
    const { fixture, host } = await setup();
    const root: HTMLElement = fixture.nativeElement;
    root.querySelector<HTMLInputElement>('[data-item-id="b"] .cell--select input')!.click();
    fixture.detectChanges();
    const single = new DataTransfer();
    root
      .querySelector<HTMLElement>('[data-item-id="a"] .name')!
      .dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: single }));
    expect(root.querySelector<HTMLInputElement>('[data-item-id="b"] .cell--select input')!.checked).toBeTrue();
    expect(root.querySelector<HTMLInputElement>('[data-item-id="a"] .cell--select input')!.checked).toBeFalse();
    root.querySelector<HTMLInputElement>('[data-item-id="a"] .cell--select input')!.click();
    fixture.detectChanges();
    const batch = new DataTransfer();
    root
      .querySelector<HTMLElement>('[data-item-id="a"] .name')!
      .dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: batch }));
    root
      .querySelector<HTMLElement>('[data-item-id="f"]')!
      .dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: batch }));
    await fixture.whenStable();
    expect(host.onMove.calls.mostRecent().args[0].items).toEqual([host.file, host.second]);
    fixture.destroy();
  });
});
