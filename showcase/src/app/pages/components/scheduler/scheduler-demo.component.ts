import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SchedulerBookingExampleComponent } from './examples/scheduler-booking.example';

@Component({
  selector: 'app-scheduler-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SchedulerBookingExampleComponent],
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
          { name: 'resources', value: 'group · icon' },
          { name: 'view', value: 'day' },
        ]"
        note="Phòng nhóm theo tầng, bấm hàng nhóm để thu gọn. Nút 150 tài nguyên × 31 ngày dựng lịch Tháng nặng để đo hiệu năng.">
        <app-scheduler-booking-example></app-scheduler-booking-example>
      </demo-section>
    }
  </demo-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulerDemoComponent {}
