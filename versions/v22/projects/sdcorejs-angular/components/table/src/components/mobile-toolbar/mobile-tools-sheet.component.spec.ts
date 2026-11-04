import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TableExportService } from '../../services/table-export/table-export.service';
import type { SdTable } from '../../table.component';
import type { SdTableMobileAction } from '../mobile-cards/mobile-action.model';
import { SdTableMobileToolsSheetComponent } from './mobile-tools-sheet.component';

const exporter = {
  exporting: signal(false),
  exportPercent: signal<number | null>(null),
};

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdTableMobileToolsSheetComponent],
  providers: [{ provide: TableExportService, useValue: exporter }],
  template: `<sd-table-mobile-tools-sheet [table]="table" [actions]="actions()"></sd-table-mobile-tools-sheet>`,
})
class ToolsHost {
  readonly customSetup = signal(false);
  readonly table = { autoId: () => 'orders', hasCustomSetup: this.customSetup } as unknown as SdTable<unknown>;
  readonly excel = jasmine.createSpy('excel');
  readonly csv = jasmine.createSpy('csv');
  readonly config = jasmine.createSpy('config');
  readonly actions = signal<SdTableMobileAction[]>([
    { key: 'tool-export-excel', title: 'Xuất excel', icon: 'table_view', run: this.excel },
    { key: 'tool-export-csv', title: 'Xuất CSV', icon: 'description', run: this.csv },
    { key: 'tool-config', title: 'Thiết lập', icon: 'settings', closeBeforeRun: true, run: this.config },
  ]);
  readonly sheet = viewChild.required(SdTableMobileToolsSheetComponent);
}

/** Handoff table-mobile 2: the Tools sheet (⋮). */
describe('SdTableMobileToolsSheetComponent', () => {
  let fixture: ComponentFixture<ToolsHost>;
  let host: ToolsHost;
  const settle = () => {
    fixture.detectChanges();
    tick(300);
    flush();
    fixture.detectChanges();
  };
  const overlay = (): HTMLElement => TestBed.inject(OverlayContainer).getContainerElement();
  const sheet = (): HTMLElement | null => overlay().querySelector('.sd-table-mobile-tools-sheet');
  const tool = (key: string): HTMLButtonElement => overlay().querySelector<HTMLButtonElement>(`[data-autoid="orders-mobile-${key}"]`)!;
  const open = () => {
    host.sheet().open();
    settle();
  };

  beforeEach(() => {
    spyOn(history, 'pushState');
    spyOn(history, 'go').and.callFake(() => window.dispatchEvent(new PopStateEvent('popstate')));
    exporter.exporting.set(false);
    exporter.exportPercent.set(null);
    TestBed.configureTestingModule({ imports: [ToolsHost], providers: [provideNoopAnimations()] });
    fixture = TestBed.createComponent(ToolsHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });
  afterEach(() =>
    overlay()
      .querySelectorAll('.cdk-overlay-pane')
      .forEach(pane => pane.remove())
  );

  it('lays the exports out as tiles with their file kind, and the settings as a row', fakeAsync(() => {
    open();
    const tiles = Array.from(overlay().querySelectorAll<HTMLElement>('.sd-mobile-tool-tile'));
    expect(tiles.map(tile => tile.querySelector('.sd-mobile-tool-title')!.textContent!.trim())).toEqual(['Excel', 'CSV']);
    expect(tiles[0].querySelector('.sd-mobile-tool-hint')!.textContent).toContain('.xlsx');
    expect(tiles[1].querySelector('.sd-mobile-tool-hint')!.textContent).toContain('.csv');
    expect(tiles.map(tile => tile.getAttribute('data-tone'))).toEqual(['success', 'info']);
    const tilesBox = overlay().querySelector<HTMLElement>('.sd-mobile-tools-tiles')!;
    expect(getComputedStyle(tilesBox).gridTemplateColumns.split(' ').length).toBe(2);

    const settings = tool('tool-config');
    expect(settings.classList).toContain('sd-mobile-tool-row');
    expect(settings.querySelector('.sd-mobile-tool-hint')).not.toBeNull();
    expect(settings.querySelector('.sd-mobile-tool-badge')).toBeNull();
    expect(overlay().querySelectorAll('.sd-mobile-tools-label').length).toBe(2);
  }));

  it('marks the settings row while the table uses a setup of its own', fakeAsync(() => {
    host.customSetup.set(true);
    open();
    expect(tool('tool-config').querySelector('.sd-mobile-tool-badge')?.textContent?.trim()).toBeTruthy();
  }));

  it('focuses the title on open and has no close button', fakeAsync(() => {
    open();
    expect(document.activeElement?.classList).toContain('sd-mobile-sheet-title');
    expect(sheet()!.querySelector('.sd-modal-close-btn')).toBeNull();
    expect(history.pushState).toHaveBeenCalledTimes(1);
  }));

  it('keeps the sheet open while an export runs, with its progress, then closes', fakeAsync(() => {
    host.excel.and.callFake(() => exporter.exporting.set(true));
    open();
    tool('tool-export-excel').click();
    settle();
    expect(sheet()).not.toBeNull();
    const excel = tool('tool-export-excel');
    expect(excel.getAttribute('aria-busy')).toBe('true');
    expect(excel.querySelector('mat-spinner')).not.toBeNull();
    expect(tool('tool-export-csv').disabled).toBeTrue();
    const before = excel.querySelector('.sd-mobile-tool-hint')!.textContent;

    exporter.exportPercent.set(40);
    fixture.detectChanges();
    expect(excel.querySelector('.sd-mobile-tool-hint')!.textContent).toContain('40');
    expect(excel.querySelector('.sd-mobile-tool-hint')!.textContent).not.toBe(before);
    expect(overlay().querySelector('.sd-mobile-tools-status')!.textContent).toContain('40');

    exporter.exporting.set(false);
    settle();
    expect(sheet()).toBeNull();
    expect(host.csv).not.toHaveBeenCalled();
  }));

  it('closes at once after an export that is done right away', fakeAsync(() => {
    open();
    tool('tool-export-csv').click();
    settle();
    expect(host.csv).toHaveBeenCalledTimes(1);
    expect(sheet()).toBeNull();
    expect(history.go).toHaveBeenCalledOnceWith(-1);
  }));

  it('closes before it opens the settings', fakeAsync(() => {
    open();
    tool('tool-config').click();
    // why: the settings open their own dialog; it must not race the closing sheet for focus and the overlay.
    expect(host.config).not.toHaveBeenCalled();
    settle();
    expect(host.config).toHaveBeenCalledTimes(1);
    expect(sheet()).toBeNull();
  }));

  it('gives one export the full width', fakeAsync(() => {
    host.actions.set([{ key: 'tool-export', title: 'Xuất dữ liệu', icon: 'download', run: host.excel }]);
    open();
    expect(overlay().querySelector('.sd-mobile-tools-tiles')!.classList).toContain('sd-mobile-tools-tiles--single');
    expect(tool('tool-export').getAttribute('data-tone')).toBe('primary');
    expect(overlay().querySelectorAll('.sd-mobile-tools-label').length).toBe(1);
  }));

  it('closes on Back', fakeAsync(() => {
    open();
    window.dispatchEvent(new PopStateEvent('popstate'));
    settle();
    expect(sheet()).toBeNull();
    expect(history.go).not.toHaveBeenCalled();
  }));
});
