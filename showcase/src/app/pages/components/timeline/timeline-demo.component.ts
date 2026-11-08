import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { TimelineApprovalExampleComponent } from './examples/timeline-approval.example';
import { TimelineChangeLogExampleComponent } from './examples/timeline-change-log.example';
import { TimelineEmptyExampleComponent } from './examples/timeline-empty.example';

@Component({
  selector: 'app-timeline-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, TimelineApprovalExampleComponent, TimelineChangeLogExampleComponent, TimelineEmptyExampleComponent],
  template: `<demo-page
    #demoPage
    title="Timeline"
    description="Dòng thời gian dọc cho lịch sử thay đổi, bình luận và sự kiện của một bản ghi; dữ liệu có sẵn hoặc tải theo cursor.">
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-luong-duyet') {
      <demo-section
        heading="Luồng duyệt"
        data-example-typescript="./examples/timeline-approval.example.ts"
        data-example-template="./examples/timeline-approval.example.html"
        data-example-style="./examples/timeline-example.scss"
        [props]="[
          { name: 'groupBy', value: 'none' },
          { name: 'layout', value: 'event' },
        ]"
        note="Không nhóm theo ngày: tiêu đề đứng một mình, người làm và giờ đầy đủ ở dòng thứ hai.">
        <app-timeline-approval-example></app-timeline-approval-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhat-ky-cap-nhat') {
      <demo-section
        heading="Nhật ký cập nhật"
        data-example-typescript="./examples/timeline-change-log.example.ts"
        data-example-template="./examples/timeline-change-log.example.html"
        data-example-style="./examples/timeline-example.scss"
        [props]="[
          { name: 'layout', value: 'change' },
          { name: 'groupBy', value: 'day' },
        ]"
        note="Giá trị cũ gạch ngang, rỗng hiện dấu gạch, trạng thái hiện bằng badge; từ hàng thứ 4 gom vào +N thay đổi khác.">
        <app-timeline-change-log-example></app-timeline-change-log-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-rong') {
      <demo-section
        heading="Rỗng"
        data-example-typescript="./examples/timeline-empty.example.ts"
        data-example-template="./examples/timeline-empty.example.html"
        data-example-style="./examples/timeline-example.scss"
        [props]="[
          { name: 'emptyText', value: 'i18n empty' },
          { name: 'sdTimelineEmpty', value: 'ng-template' },
        ]">
        <app-timeline-empty-example></app-timeline-empty-example>
      </demo-section>
    }
  </demo-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineDemoComponent {}
