import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { SdTable, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDateRange } from '@sdcorejs/angular/forms/date-range';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

interface Row {
  id: number;
  day: string;
  at: string;
}

// 20/05/1960 00:00 in Asia/Ho_Chi_Minh (UTC+08 until 1975); 19/05/1960 23:00 in Asia/Bangkok.
const ROWS: Row[] = [{ id: 1, day: '1960-05-19T16:00:00Z', at: '1960-05-19T16:00:00Z' }];

@Component({
  selector: 'app-date-time-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdDate, SdDatetime, SdDateRange, SdTable],
  template: `
    <demo-page
      #demoPage
      title="Date Time"
      description="SdDateTimeService đổi, đọc và giới hạn ngày giờ theo ISdCoreConfiguration.timeZone. Thêm ?timeZone=Asia/Ho_Chi_Minh vào URL rồi tải lại trang để xem mọi control theo múi giờ đó.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-mui-gio-dang-dung') {
        <demo-section
          heading="Múi giờ đang dùng"
          [props]="[{ name: 'timeZone', value: zone }]"
          note="Showcase đọc ?timeZone= một lần lúc khởi động. Giá trị không hợp lệ (ví dụ +07:00) bị bỏ qua và trang chạy 'local'.">
          <p class="T14R m-0">
            ISdCoreConfiguration.timeZone: <strong data-e2e="zone">{{ zone }}</strong>
          </p>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-form-ngay-gio') {
        <demo-section
          heading="Form ngày giờ"
          [props]="[{ name: 'transform', value: 'ISOString' }]"
          note="Có timeZone thì form.value giữ giá trị model: sd-date 'yyyy/MM/dd', sd-datetime 'yyyy/MM/dd HH:mm:ss', sd-date-range { from, to }; transform ISOString cho instant tính trong múi giờ đó.">
          <div class="d-flex flex-wrap gap-16 w-100">
            <sd-date autoId="tz-date" [form]="form" name="date" label="sd-date" />
            <sd-date autoId="tz-date-iso" [form]="form" name="dateIso" label="sd-date (ISOString)" transform="ISOString" />
            <sd-datetime autoId="tz-datetime" [form]="form" name="datetime" label="sd-datetime" />
            <sd-datetime autoId="tz-datetime-iso" [form]="form" name="datetimeIso" label="sd-datetime (ISOString)" transform="ISOString" />
            <sd-date-range autoId="tz-range" [form]="form" name="range" label="sd-date-range" />
          </div>
          <pre class="T12R w-100 m-0" data-e2e="form-value">{{ formValue() }}</pre>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bang-va-bo-loc-server') {
        <demo-section
          heading="Bảng và bộ lọc server"
          [props]="[{ name: 'type', value: 'server' }, { name: 'filter.externalFilters', value: 'daterange' }]"
          note="Dòng mẫu là instant 1960-05-19T16:00:00Z. Chọn khoảng ngày để xem pagingReq.filters: một ngày là [đầu ngày, đầu ngày kế tiếp) trong múi giờ đang dùng.">
          <div class="w-100" data-e2e="table">
            <sd-table autoId="tz-table" [option]="tableOption" />
          </div>
          <pre class="T12R w-100 m-0" data-e2e="paging-filters">{{ pagingFilters() }}</pre>
        </demo-section>
      }
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateTimeDemoComponent {
  readonly zone = inject(SdDateTimeService).timeZone;
  readonly form = new FormGroup({});
  readonly formValue = signal('{}');
  readonly pagingFilters = signal('[]');

  readonly tableOption: SdTableOption<Row> = {
    type: 'server',
    items: async (_filterRequest, pagingRequest) => {
      this.pagingFilters.set(JSON.stringify(pagingRequest.filters ?? []));
      return { items: ROWS, total: ROWS.length };
    },
    filter: {
      externalFilters: [{ field: 'period', title: 'Khoảng ngày', type: 'daterange', defaultShowing: true }],
    },
    columns: [
      { field: 'day', title: 'Ngày (date)', type: 'date', width: '180px' },
      { field: 'at', title: 'Thời điểm (datetime)', type: 'datetime', width: '220px' },
    ],
  };

  constructor() {
    // form.valueChanges emits once per user edit with the model values the date controls register.
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(value => this.formValue.set(JSON.stringify(value)));
  }
}
