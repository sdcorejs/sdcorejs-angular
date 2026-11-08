import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdTimeline } from '@sdcorejs/angular/components/timeline';
import { TIMELINE_ACTIVITY } from './timeline-activity.example';

@Component({
  selector: 'app-timeline-aside-example',
  standalone: true,
  imports: [SdTimeline],
  templateUrl: './timeline-aside.example.html',
  styleUrl: './timeline-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineAsideExampleComponent {
  readonly items = TIMELINE_ACTIVITY;
}
