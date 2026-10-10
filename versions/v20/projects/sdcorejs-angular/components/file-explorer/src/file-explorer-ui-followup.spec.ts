import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdFileExplorer } from './file-explorer.component';
import type { SdFileExplorerItem, SdFileExplorerOption } from './file-explorer.model';

@Component({ imports: [SdFileExplorer], template: '<sd-file-explorer [option]="option()" />' })
class UiHost {
  readonly file: SdFileExplorerItem = { id: 'file', parentId: null, kind: 'file', name: 'File' };
  readonly folder: SdFileExplorerItem = { id: 'folder', parentId: null, kind: 'folder', name: 'Folder' };
  readonly explorer = viewChild.required(SdFileExplorer);
  readonly option = signal<SdFileExplorerOption>({ list: () => [this.file, this.folder], selector: {}, move: { onMove: () => true } });
}

describe('Explorer user UI follow-up', () => {
  async function setup() {
    TestBed.configureTestingModule({ imports: [UiHost], providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(UiHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
  }
  it('shows the selection toolbar only for a nonempty selection through 0 → 1 → 0', async () => {
    const { fixture, root } = await setup();
    expect(root.querySelector('.selection')).toBeNull();
    const checkbox = root.querySelector<HTMLInputElement>('[data-item-id="file"] input[type="checkbox"]')!;
    checkbox.click();
    fixture.detectChanges();
    expect(root.querySelector('.selection')).not.toBeNull();
    root.querySelector<HTMLButtonElement>('.selection-clear')!.click();
    fixture.detectChanges();
    expect(root.querySelector('.selection')).toBeNull();
    expect(root.querySelector('.select-all')).not.toBeNull();
    fixture.destroy();
  });
  it('uses one current-location line and Core buttons in the destination picker', async () => {
    const { fixture, root } = await setup();
    expect(root.querySelector('.heading-row .heading')).toBeNull();
    root.querySelector<HTMLButtonElement>('.move-file-button button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('.move-picker > p')).toBeNull();
    const cancel = fixture.debugElement.query(By.css('.move-cancel-button'));
    expect(cancel?.componentInstance instanceof SdButton).toBeTrue();
    fixture.destroy();
  });

  it('offers non-live destination guidance only inside a move picker with an unavailable target', async () => {
    const { fixture, root } = await setup();
    expect(root.querySelector('.move-destination-tip')).toBeNull();
    root.querySelector<HTMLButtonElement>('.move-file-button button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const tip = root.querySelector('.move-destination-tip');
    expect(tip).not.toBeNull();
    if (!tip) {
      fixture.destroy();
      return;
    }
    expect(tip?.querySelector('[role="note"]')).not.toBeNull();
    expect(tip?.textContent).not.toContain('core.component.file-explorer.move.destination-tip');
    root.querySelector<HTMLButtonElement>('.move-cancel-button button')!.click();
    fixture.detectChanges();
    expect(root.querySelector('.move-destination-tip')).toBeNull();
    fixture.destroy();
  });
});
