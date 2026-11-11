import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SchedulerBookingExampleComponent } from './examples/scheduler-booking.example';
import { SchedulerLeaveExampleComponent } from './examples/scheduler-leave.example';
import { SchedulerTimesheetExampleComponent } from './examples/scheduler-timesheet.example';
import { SchedulerVehiclesExampleComponent } from './examples/scheduler-vehicles.example';

@Component({
  selector: 'app-scheduler-demo',
  standalone: true,
  imports: [
    DemoPageComponent,
    DemoSectionComponent,
    SchedulerBookingExampleComponent,
    SchedulerVehiclesExampleComponent,
    SchedulerLeaveExampleComponent,
    SchedulerTimesheetExampleComponent,
  ],
  template: `<demo-page
    #demoPage
    title="Scheduler"
    description="Lịch theo tài nguyên: phòng, xe, người theo hàng; Ngày theo giờ, Tuần và Tháng theo ngày; nhóm thu gọn được, dời theo hai trục.">
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dat-phong-hop') {
      <demo-section
        heading="Đặt phòng họp"
        data-example-typescript="./examples/scheduler-booking.example.ts"
        data-example-template="./examples/scheduler-booking.example.html"
        data-example-style="./examples/scheduler-example.scss"
        [props]="[
          { name: 'resources', value: 'group · icon · data.seats' },
          { name: 'move.droppable', value: 'seats ≥ people' },
          { name: 'onMove', value: 'true | false | throw | slow' },
        ]"
        note="Phòng nhóm theo tầng, bấm hàng nhóm để thu gọn. Kéo cuộc họp sang phòng ít chỗ hơn số người thì hàng đó bị chặn. Quét trên một hàng để đặt phòng; hộp thoại demo trả lịch đặt hoặc huỷ. Nút 150 tài nguyên × 31 ngày dựng lịch Tháng nặng để đo hiệu năng.">
        <app-scheduler-booking-example></app-scheduler-booking-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-xe-giao-hang') {
      <demo-section
        heading="Xe giao hàng"
        data-example-typescript="./examples/scheduler-vehicles.example.ts"
        data-example-template="./examples/scheduler-vehicles.example.html"
        data-example-style="./examples/scheduler-example.scss"
        [props]="[
          { name: 'view', value: 'week' },
          { name: 'group', value: 'kho' },
        ]"
        note="Chuyến trong ngày là khối có giờ, chuyến nhiều ngày là thanh cả ngày; kéo để đổi xe hoặc đổi ngày.">
        <app-scheduler-vehicles-example></app-scheduler-vehicles-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nghi-phep-phong-ban') {
      <demo-section
        heading="Nghỉ phép phòng ban"
        data-example-typescript="./examples/scheduler-leave.example.ts"
        data-example-template="./examples/scheduler-leave.example.html"
        data-example-style="./examples/scheduler-example.scss"
        [props]="[
          { name: 'view', value: 'month' },
          { name: 'resource.avatar', value: 'chữ cái đầu' },
          { name: 'move.axis', value: 'time' },
        ]"
        note="Lượt nghỉ chỉ dời theo ngày, không sang người khác; Alt + ↑ ↓ không làm gì.">
        <app-scheduler-leave-example></app-scheduler-leave-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-cham-cong') {
      <demo-section
        heading="Chấm công"
        data-example-typescript="./examples/scheduler-timesheet.example.ts"
        data-example-template="./examples/scheduler-timesheet.example.html"
        data-example-style="./examples/scheduler-example.scss"
        [props]="[
          { name: 'sdSchedulerCellTemplate', value: 'let-events · let-off' },
          { name: 'sdSchedulerResourceTemplate', value: 'cột tổng' },
          { name: 'sdCellSelect', value: '{ resource, date, events }' },
        ]"
        note="Template ô thay khối bằng mã công của consumer (X đủ công, ½ nửa công, P nghỉ phép, Ô nghỉ ốm, KL không lương, ! thiếu giờ vào hoặc ra); cột tổng nằm trong template tài nguyên. Không kéo. Bấm ô có mã để phát sdCellSelect.">
        <app-scheduler-timesheet-example></app-scheduler-timesheet-example>
      </demo-section>
    }
  </demo-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulerDemoComponent {}
