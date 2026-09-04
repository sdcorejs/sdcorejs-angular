import { ChangeDetectionStrategy, Component, ElementRef, InputSignal, OnDestroy, OnInit, effect, input, viewChild } from '@angular/core';
import { Chart, ChartData, ChartOptions, Plugin, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'sd-doughnut-chart',
  template: `
    <div style="position: relative; height: 100%; width: 100%;">
      <canvas #canvas></canvas>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class SdDoughnutChartComponent implements OnInit, OnDestroy {
  canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  data: InputSignal<ChartData<'doughnut'>> = input.required<ChartData<'doughnut'>>();
  options: InputSignal<ChartOptions<'doughnut'> | undefined> = input<ChartOptions<'doughnut'>>();
  plugins: InputSignal<Plugin<'doughnut'>[]> = input<Plugin<'doughnut'>[]>([]);

  chart: Chart<'doughnut'> | undefined;

  constructor() {
    effect(() => {
      const currentData = this.data();
      const currentOptions = this.options();

      if (this.chart) {
        this.chart.data = currentData;
        if (currentOptions) {
          this.chart.options = currentOptions;
        }
        this.chart.update();
      }
    });
  }

  ngOnInit() {
    this.#initChart();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  #initChart() {
    if (this.chart) {
      this.chart.destroy();
    }
    const ctx = this.canvas().nativeElement.getContext('2d');
    if (ctx) {
      this.chart = new Chart(ctx, {
        type: 'doughnut',
        data: this.data(),
        options: this.options() || {},
        plugins: this.plugins(),
      });
    }
  }
}
