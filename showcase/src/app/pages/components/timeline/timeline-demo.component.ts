import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { TimelineActionsExampleComponent } from './examples/timeline-actions.example';
import { TimelineActivityExampleComponent } from './examples/timeline-activity.example';
import { TimelineApprovalExampleComponent } from './examples/timeline-approval.example';
import { TimelineAsideExampleComponent } from './examples/timeline-aside.example';
import { TimelineChangeLogExampleComponent } from './examples/timeline-change-log.example';
import { TimelineEmptyExampleComponent } from './examples/timeline-empty.example';
import { TimelinePagedExampleComponent } from './examples/timeline-paged.example';

@Component({
  selector: 'app-timeline-demo',
  standalone: true,
  imports: [
    DemoPageComponent,
    DemoSectionComponent,
    TimelineActivityExampleComponent,
    TimelineAsideExampleComponent,
    TimelineApprovalExampleComponent,
    TimelineChangeLogExampleComponent,
    TimelinePagedExampleComponent,
    TimelineActionsExampleComponent,
    TimelineEmptyExampleComponent,
  ],
  template: `<demo-page
    #demoPage
    title="Timeline"
    description="Dòng thời gian dọc cho lịch sử thay đổi, bình luận và sự kiện của một bản ghi; dữ liệu có sẵn hoặc tải theo cursor.">
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-md-nhom-theo-ngay') {
      <demo-section
        heading="Cỡ md, nhóm theo ngày"
        data-example-typescript="./examples/timeline-activity.example.ts"
        data-example-template="./examples/timeline-activity.example.html"
        data-example-style="./examples/timeline-example.scss"
        [props]="[
          { name: 'layout', value: 'comment | change | event' },
          { name: 'groupBy', value: 'day | none' },
          { name: 'size', value: 'md | sm' },
        ]"
        note="Đủ ba layout; Xem thêm chỉ hiện khi chữ thật sự bị cắt, từ thay đổi thứ 4 gom vào +N.">
        <app-timeline-activity-example></app-timeline-activity-example>
      </demo-section>
    }
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
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-sm-trong-cot-phu') {
      <demo-section
        heading="Cỡ sm trong cột phụ"
        data-example-typescript="./examples/timeline-aside.example.ts"
        data-example-template="./examples/timeline-aside.example.html"
        data-example-style="./examples/timeline-example.scss"
        [props]="[
          { name: 'size', value: 'sm' },
          { name: 'headingLevel', value: '4' },
        ]"
        note="Cột phụ 360px: marker 24px, chữ 13px, bỏ nguồn.">
        <app-timeline-aside-example></app-timeline-aside-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tai-theo-cursor') {
      <demo-section
        heading="Tải theo cursor"
        data-example-typescript="./examples/timeline-paged.example.ts"
        data-example-template="./examples/timeline-paged.example.html"
        data-example-style="./examples/timeline-example.scss"
        [props]="[
          { name: 'option.dataSource.onLoad', value: 'cursor' },
          { name: 'loadMore', value: 'button | auto' },
          { name: 'sdLoadError', value: 'unknown' },
        ]"
        note="Mock trễ 800ms: đang tải, tải thêm, lỗi (bật bằng công tắc), rỗng và reload().">
        <app-timeline-paged-example></app-timeline-paged-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tac-vu-cua-binh-luan') {
      <demo-section
        heading="Tác vụ của bình luận"
        data-example-typescript="./examples/timeline-actions.example.ts"
        data-example-template="./examples/timeline-actions.example.html"
        data-example-style="./examples/timeline-example.scss"
        [props]="[
          { name: 'sdTimelineItemActions', value: 'ng-template' },
        ]"
        note="Sửa / Xoá ở cuối dòng đầu, hiện khi rê chuột hoặc focus.">
        <app-timeline-actions-example></app-timeline-actions-example>
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
