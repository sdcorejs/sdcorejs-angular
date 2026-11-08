import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { CalendarDrawerExampleComponent } from './examples/calendar-drawer.example';
import { CalendarPlaygroundExampleComponent } from './examples/calendar-playground.example';
import { CalendarServerExampleComponent } from './examples/calendar-server.example';
import { CalendarTimesheetExampleComponent } from './examples/calendar-timesheet.example';
import { CalendarUrlExampleComponent } from './examples/calendar-url.example';

@Component({
  selector: 'app-calendar-demo',
  standalone: true,
  imports: [
    DemoPageComponent,
    DemoSectionComponent,
    CalendarPlaygroundExampleComponent,
    CalendarServerExampleComponent,
    CalendarDrawerExampleComponent,
    CalendarTimesheetExampleComponent,
    CalendarUrlExampleComponent,
  ],
  template: `<demo-page
    #demoPage
    title="Calendar"
    description="Lịch tháng, tuần, ngày và danh sách: tải theo khoảng, tạo bằng bấm hoặc quét, dời bằng kéo, kéo mép hoặc Alt + mũi tên.">
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-lich-hop-nguon-client') {
      <demo-section
        heading="Lịch họp, nguồn client"
        data-example-typescript="./examples/calendar-playground.example.ts"
        data-example-template="./examples/calendar-playground.example.html"
        data-example-style="./examples/calendar-example.scss"
        [props]="[
          { name: 'option.create', value: 'onCreate' },
          { name: 'option.move', value: 'movable · onMove' },
          { name: 'onMove', value: 'true | false | cancel | throw' },
        ]"
        note="Công tắc phía trên đổi input; hộp thoại demo trả sự kiện hoặc huỷ; onMove chấp nhận, từ chối, ném lỗi, chậm 2 giây hoặc mở hộp lý do ('cancel' khi đóng). Họp giao ban là sự kiện lặp: dời sẽ hỏi phạm vi.">
        <app-calendar-playground-example></app-calendar-playground-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nguon-server') {
      <demo-section
        heading="Nguồn server"
        data-example-typescript="./examples/calendar-server.example.ts"
        data-example-template="./examples/calendar-server.example.html"
        data-example-style="./examples/calendar-example.scss"
        [props]="[
          { name: 'dataSource.onLoad', value: '{ from, to, view, signal }' },
          { name: 'reload()', value: '' },
        ]"
        note="Trễ 600ms mỗi lần tải; đổi khoảng nhanh thì lần cũ bị huỷ. Bật lỗi để thấy dải lỗi, Thử lại và sdLoadError.">
        <app-calendar-server-example></app-calendar-server-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tao-bang-drawer-doi-co-hoan-tac') {
      <demo-section
        heading="Tạo bằng drawer, dời có hoàn tác"
        data-example-typescript="./examples/calendar-drawer.example.ts"
        data-example-template="./examples/calendar-drawer.example.html"
        data-example-style="./examples/calendar-example.scss"
        [props]="[
          { name: 'onCreate', value: 'Promise' },
          { name: 'move()', value: 'request.from, api' },
        ]"
        note="onCreate mở drawer không route; khối nét đứt giữ nguyên tới khi Lưu hoặc Đóng. Sau khi dời, toast có nút Hoàn tác gọi move(id, request.from, 'api').">
        <app-calendar-drawer-example></app-calendar-drawer-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bang-cham-cong-mot-nguoi') {
      <demo-section
        heading="Bảng chấm công một người"
        data-example-typescript="./examples/calendar-timesheet.example.ts"
        data-example-template="./examples/calendar-timesheet.example.html"
        data-example-style="./examples/calendar-example.scss"
        [props]="[
          { name: 'view', value: 'month' },
          { name: 'sdCalendarDayCellTemplate', value: 'let-events' },
        ]"
        note="Template ô Tháng thay phần dưới số ngày bằng mã công đọc từ event.data.">
        <app-calendar-timesheet-example></app-calendar-timesheet-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cot-hep-va-dong-bo-url') {
      <demo-section
        heading="Cột hẹp và đồng bộ URL"
        data-example-typescript="./examples/calendar-url.example.ts"
        data-example-template="./examples/calendar-url.example.html"
        data-example-style="./examples/calendar-example.scss"
        [props]="[
          { name: 'compact', value: 'host < 600px' },
          { name: '[(view)] · [(date)]', value: '?view= &date=' },
        ]"
        note="Cột 400px trên desktop vẫn chuyển giao diện hẹp vì đo bề rộng của component. URL lấy view từ viewChange và ngày từ dateChange.">
        <app-calendar-url-example></app-calendar-url-example>
      </demo-section>
    }
  </demo-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarDemoComponent {}
