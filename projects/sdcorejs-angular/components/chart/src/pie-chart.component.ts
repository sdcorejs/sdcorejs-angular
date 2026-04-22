import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BaseChartDirective } from './base-chart.directive';

@Component({
  selector: 'sd-pie-chart',
  template: `
    <div style="position: relative; height: 100%; width: 100%;">
      <canvas sdBaseChart [type]="'pie'" [data]="data()" [options]="options()" [plugins]="plugins()"></canvas>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [BaseChartDirective],
})
export class SdPieChartComponent {
  data = input.required<any>();
  options = input<any>();
  plugins = input<any[]>([]);
}
