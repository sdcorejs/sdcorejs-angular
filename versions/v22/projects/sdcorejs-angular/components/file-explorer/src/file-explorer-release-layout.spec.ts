import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SdFileExplorer } from './file-explorer.component';
import { SdFileExplorerFolderTree } from './components/folder-tree.component';
import type { SdFileExplorerItem } from './file-explorer.model';

describe('Explorer release review browser geometry', () => {
  let fixture: ComponentFixture<SdFileExplorer | SdFileExplorerFolderTree>;
  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  afterEach(() => {
    fixture.destroy();
    (fixture.nativeElement as HTMLElement).remove();
  });

  it('keeps a compact touch error folder label and its retry and command targets inside a narrow tree', async () => {
    TestBed.configureTestingModule({ imports: [SdFileExplorerFolderTree], providers: [provideNoopAnimations()] });
    fixture = TestBed.createComponent(SdFileExplorerFolderTree);
    const root = fixture.nativeElement as HTMLElement;
    root.style.width = '220px';
    document.body.appendChild(root);
    const folder: SdFileExplorerItem = { id: 'folder', kind: 'folder', parentId: null, name: 'Long failed folder name' };
    fixture.componentRef.setInput('nodes', [
      {
        key: 'f:folder',
        id: folder.id,
        item: folder,
        name: folder.name,
        level: 2,
        expandable: true,
        expanded: true,
        status: 'error',
        selected: true,
      },
    ]);
    fixture.componentRef.setInput('commands', [{ title: 'Rename', onClick: () => undefined }]);
    fixture.componentRef.setInput('compact', true);
    fixture.componentRef.setInput('touch', true);
    await settle();
    const row = root.querySelector<HTMLElement>('.node')!;
    const bounds = row.getBoundingClientRect();
    const label = row.querySelector<HTMLElement>('.label')!;
    expect(label.getBoundingClientRect().width).withContext('the failed folder retains a readable name lane').toBeGreaterThan(35);
    for (const element of row.querySelectorAll<HTMLElement>('.label,.retry,.node-menu')) {
      expect(element.getBoundingClientRect().right)
        .withContext(element.className)
        .toBeLessThanOrEqual(bounds.right + 1);
      expect(element.getBoundingClientRect().left)
        .withContext(element.className)
        .toBeGreaterThanOrEqual(bounds.left - 1);
    }
    expect(row.scrollWidth).withContext('the error row cannot create horizontal overflow').toBeLessThanOrEqual(row.clientWidth);
  });

  it('keeps a long destination picker and its footer within a consumer-supplied short Explorer host', async () => {
    TestBed.configureTestingModule({ imports: [SdFileExplorer], providers: [provideNoopAnimations()] });
    fixture = TestBed.createComponent(SdFileExplorer);
    const root = fixture.nativeElement as HTMLElement;
    root.style.cssText = 'width:320px;height:320px;min-height:0';
    document.body.appendChild(root);
    const file: SdFileExplorerItem = { id: 'file', kind: 'file', parentId: null, name: 'File.pdf' };
    const folders: SdFileExplorerItem[] = Array.from({ length: 24 }, (_, index) => ({
      id: `folder-${index}`,
      kind: 'folder',
      parentId: null,
      name: `Destination folder ${index}`,
      hasChildren: false,
    }));
    fixture.componentRef.setInput('option', { list: () => [file, ...folders], move: { onMove: () => true } });
    await settle();
    root.querySelector<HTMLButtonElement>('[data-item-id="file"] .move-file-button button')!.click();
    await settle();
    const dialog = root.querySelector<HTMLElement>('.move-picker')!;
    expect(dialog.querySelectorAll('.node').length).toBe(25);
    const host = root.getBoundingClientRect();
    const bounds = dialog.getBoundingClientRect();
    expect(bounds.top).withContext('dialog stays below the contained host top').toBeGreaterThanOrEqual(host.top);
    expect(bounds.bottom).withContext('dialog stays above the contained host bottom').toBeLessThanOrEqual(host.bottom);
    dialog.scrollTop = dialog.scrollHeight;
    const footer = dialog.querySelector<HTMLElement>('.dialog-actions')!.getBoundingClientRect();
    expect(footer.top).toBeGreaterThanOrEqual(bounds.top);
    expect(footer.bottom).toBeLessThanOrEqual(bounds.bottom);
  });
});
