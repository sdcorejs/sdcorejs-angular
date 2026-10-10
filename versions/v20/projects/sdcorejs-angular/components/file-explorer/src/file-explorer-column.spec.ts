import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SdFileExplorer } from './file-explorer.component';
import { SdFileExplorerColumnDef } from './file-explorer-column.directive';
import type { SdFileExplorerConfig } from './file-explorer.model';

@Component({
  standalone: true,
  imports: [SdFileExplorer, SdFileExplorerColumnDef],
  template: ` <sd-file-explorer [option]="option">
    <ng-template sdFileExplorerColumnDef="owner" [sdFileExplorerColumnFor]="option" title="Owner" width="160px" let-item let-data="data"
      >{{ data?.owner }} / {{ item.name }}</ng-template
    >
    <ng-template sdFileExplorerColumnDef="code" [sdFileExplorerColumnFor]="option" title="Code" let-index="index">{{ index }}</ng-template>
  </sd-file-explorer>`,
})
class ColumnHost {
  readonly option: SdFileExplorerConfig<{ owner: string }> = {
    list: () => [{ id: 'a', parentId: null, name: 'A', kind: 'file', data: { owner: 'Ada' } }],
  };
}

@Component({
  standalone: true,
  imports: [SdFileExplorer, SdFileExplorerColumnDef],
  template: ` <div style="width:1100px;height:720px">
    <sd-file-explorer [option]="option">
      @for (column of declarations(); track column.key) {
        <ng-template
          [sdFileExplorerColumnDef]="column.id"
          [sdFileExplorerColumnFor]="option"
          [title]="column.title"
          let-item
          let-data="data"
          let-index="index"
          >{{ data?.owner }} / {{ item.name }} / {{ index }}</ng-template
        >
      }
    </sd-file-explorer>
  </div>`,
})
class DynamicColumnHost {
  readonly declarations = signal([
    { key: 1, id: 'owner', title: 'Owner' },
    { key: 2, id: 'code', title: 'Code' },
  ]);
  readonly option: SdFileExplorerConfig<{ owner: string }> = {
    list: () => [
      { id: 'a', parentId: null, name: 'A', kind: 'file', data: { owner: 'Ada' } },
      { id: 'f', parentId: null, name: 'Folder', kind: 'folder', data: { owner: 'Grace' } },
    ],
  };
}
describe('Explorer typed projected columns', () => {
  it('appends headers in declaration order and preserves item/data context', async () => {
    TestBed.configureTestingModule({ imports: [ColumnHost], providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(ColumnHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(Array.from(root.querySelectorAll('.cell--custom[role="columnheader"]')).map(n => n.textContent?.trim())).toEqual([
      'Owner',
      'Code',
    ]);
    expect(root.querySelector('.cell--custom[role="cell"]')?.textContent).toContain('Ada / A');
  });
  it('updates order/removal, keeps the first duplicate, and uses folder context and displayed index', async () => {
    TestBed.configureTestingModule({ imports: [DynamicColumnHost], providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(DynamicColumnHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const headers = () => Array.from(root.querySelectorAll('.cell--custom[role="columnheader"]')).map(node => node.textContent?.trim());
    expect(headers()).toEqual(['Owner', 'Code']);
    expect(root.querySelector('.cell--custom[role="cell"]')?.textContent).toContain('Grace / Folder / 0');
    fixture.componentInstance.declarations.update(columns => [...columns].reverse());
    fixture.detectChanges();
    expect(headers()).toEqual(['Code', 'Owner']);
    const warning = spyOn(console, 'warn');
    fixture.componentInstance.declarations.set([
      { key: 3, id: 'owner', title: 'First' },
      { key: 4, id: 'owner', title: 'Duplicate' },
    ]);
    fixture.detectChanges();
    expect(headers()).toEqual(['First']);
    expect(warning).toHaveBeenCalledTimes(1);
    fixture.componentInstance.declarations.set([]);
    fixture.detectChanges();
    expect(headers()).toEqual([]);
    expect(root.querySelector('[role="table"]')?.getAttribute('aria-colcount')).toBe('3');
    fixture.destroy();
  });
});
