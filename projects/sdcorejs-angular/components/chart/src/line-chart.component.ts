import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BaseChartDirective } from './base-chart.directive';

@Component({
  selector: 'sd-line-chart',
  template: `
    <div style="position: relative; height: 100%; width: 100%;">
      <canvas sdBaseChart [type]="'line'" [data]="data()" [options]="options()" [plugins]="plugins()"></canvas>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [BaseChartDirective],
})
export class SdLineChartComponent {
  data = input.required<any>();
  options = input<any>();
  plugins = input<any[]>([]);
}
