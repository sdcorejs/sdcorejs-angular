import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SD_CORE_CONFIGURATION, type SdTimeZone } from '@sdcorejs/angular/configurations';
import { I18N_STORAGE_KEY } from '@sdcorejs/angular/i18n';
import { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import { SdFileExplorer } from './file-explorer.component';
import type { SdFileExplorerItem, SdFileExplorerOption } from './file-explorer.model';
import { sdFileExplorerFormatDate, sdFileExplorerFormatDateTime } from './file-explorer.utils';

// file-explorer modifiedAt under ISdCoreConfiguration.timeZone: the calendar day, the today/yesterday
// labels and the tooltip follow the zone. Every expectation is pinned, so it holds on any machine zone.

const VN = 'Asia/Ho_Chi_Minh';
const labels = { today: 'TODAY', yesterday: 'YESTERDAY' };

const service = (timeZone: SdTimeZone): SdDateTimeService => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone } }] });
  return TestBed.inject(SdDateTimeService);
};

describe('file-explorer with ISdCoreConfiguration.timeZone', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('labels today and yesterday by the calendar day of the zone', () => {
    const now = new Date('2026-08-14T18:00:00Z'); // 15/08/2026 01:00 in Asia/Ho_Chi_Minh
    const modifiedAt = '2026-08-14T16:30:00Z'; // 14/08/2026 23:30 there, 16:30 the same day in UTC
    expect(sdFileExplorerFormatDate(modifiedAt, now, 'vi-VN', labels, service(VN))).toBe('YESTERDAY');
    expect(sdFileExplorerFormatDate(modifiedAt, now, 'vi-VN', labels, service('UTC'))).toBe('TODAY');
    expect(sdFileExplorerFormatDate('2026-08-14T17:30:00Z', now, 'vi-VN', labels, service(VN))).toBe('TODAY');
  });

  it('shows older dates and the tooltip in the zone', () => {
    const now = new Date('2026-08-14T18:00:00Z');
    const instant = '1960-05-19T16:00:00Z'; // 20/05/1960 00:00 in Asia/Ho_Chi_Minh (+08 in 1960)
    expect(sdFileExplorerFormatDate(instant, now, 'vi-VN', labels, service(VN))).toBe('20/05/1960');
    expect(sdFileExplorerFormatDate(instant, now, 'vi-VN', labels, service('Asia/Bangkok'))).toBe('19/05/1960');
    expect(sdFileExplorerFormatDate('2026-08-10T17:30:00Z', now, 'vi-VN', labels, service(VN))).toBe('11/08');
    const title = sdFileExplorerFormatDateTime(instant, 'en-GB', service(VN));
    expect(title).toContain('20/05/1960');
    expect(title).toContain('00:00');
  });

  it("keeps the machine zone when the zone is 'local'", () => {
    const now = new Date(2026, 8, 24, 12);
    const dateTime = service('local');
    for (const value of [new Date(2026, 8, 24, 0, 1), new Date(2026, 8, 23, 23, 59), new Date(2026, 8, 21), new Date(2025, 0, 5)]) {
      expect(sdFileExplorerFormatDate(value, now, 'vi-VN', labels, dateTime)).toBe(sdFileExplorerFormatDate(value, now, 'vi-VN', labels));
      expect(sdFileExplorerFormatDateTime(value, 'vi-VN', dateTime)).toBe(sdFileExplorerFormatDateTime(value, 'vi-VN'));
    }
  });

  it('renders modifiedAt in the zone', async () => {
    @Component({
      standalone: true,
      imports: [SdFileExplorer],
      template: `<div style="width: 1100px; height: 720px"><sd-file-explorer [option]="option()" /></div>`,
    })
    class Host {
      readonly option = signal<SdFileExplorerOption>({
        list: () =>
          Promise.resolve([
            { id: 'old', parentId: null, name: 'Old.pdf', kind: 'file', modifiedAt: '1960-05-19T16:00:00Z' } as SdFileExplorerItem,
          ]),
      });
    }
    localStorage.removeItem(I18N_STORAGE_KEY);
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideNoopAnimations(), { provide: SD_CORE_CONFIGURATION, useValue: { timeZone: VN } }],
    });
    const fixture = TestBed.createComponent(Host);
    for (let i = 0; i < 3; i++) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
    fixture.detectChanges();
    const cell = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.row:not(.row--head) .cell--modified')!;
    expect(cell.textContent?.trim()).toBe('20/05/1960');
    expect(cell.title).toContain('20/05/1960');
    fixture.destroy();
  });
});
