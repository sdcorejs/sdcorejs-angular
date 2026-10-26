import { signal } from '@angular/core';
import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdViewportService } from '@sdcorejs/angular/services/viewport';
import { SdTableOption } from './models/table-option.model';
import { SdTable } from './table.component';

interface Row {
  id: number;
  name: string;
}

// why: host sd-table có tabindex="0"; sd-section từng coi mọi phần tử có tabindex phía trên là action của header
// nên bấm vào header của external filter không thu gọn được, chỉ nút mũi tên dùng được.
describe('SdTable external filter header', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [SdTable, NoopAnimationsModule],
      // why: the Karma frame is narrower than the mobile breakpoint; pin desktop.
      providers: [{ provide: SdViewportService, useValue: { isMobile: signal(false) } }],
    })
  );

  it('collapses and expands the external filter when its header is clicked', fakeAsync(() => {
    const fixture = TestBed.createComponent(SdTable<Row>);
    fixture.componentRef.setInput('option', {
      type: 'local',
      items: () => [{ id: 1, name: 'Đơn 1' }],
      columns: [{ field: 'name', type: 'string', title: 'Tên' }],
      filter: { externalFilters: [{ field: 'note', title: 'Ghi chú', type: 'string' }] },
    } as SdTableOption<Row>);
    fixture.detectChanges();
    tick(250);
    flushMicrotasks();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const body = () => host.querySelector('external-filter .sd-external-filter-body');
    const header = () => host.querySelector('external-filter .sd-section-header') as HTMLElement;
    expect(body()).not.toBeNull();

    header().click();
    fixture.detectChanges();
    expect(body()).toBeNull();

    header().click();
    fixture.detectChanges();
    expect(body()).not.toBeNull();
  }));
});
