import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdTimeline, SdTimelineEmptyDirective } from '@sdcorejs/angular/components/timeline';

@Component({
  selector: 'app-timeline-empty-example',
  standalone: true,
  imports: [SdTimeline, SdTimelineEmptyDirective],
  templateUrl: './timeline-empty.example.html',
  styleUrl: './timeline-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineEmptyExampleComponent {}
