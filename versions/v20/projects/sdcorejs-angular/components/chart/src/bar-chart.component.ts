import { ChangeDetectionStrategy, Component, ElementRef, InputSignal, OnDestroy, OnInit, effect, input, computed, viewChild } from '@angular/core';
import { Chart, ChartData, ChartOptions, Plugin, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'sd-bar-chart',
  template: `
    <div [style.overflow-x]="isScrollable() ? 'auto' : 'visible'" style="width: 100%; height: 100%;">
      <div [style.height]="'100%'" [style.min-width.px]="computedMinWidth()" style="position: relative;">
        <canvas #canvas></canvas>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class SdBarChartComponent implements OnInit, OnDestroy {
  canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  data: InputSignal<ChartData<'bar'>> = input.required<ChartData<'bar'>>();
  options: InputSignal<ChartOptions<'bar'> | undefined> = input<ChartOptions<'bar'>>();
  plugins: InputSignal<Plugin<'bar'>[]> = input<Plugin<'bar'>[]>([]);

  isScrollable = computed(() => {
    const labelsLength = this.data()?.labels?.length || 0;
    return labelsLength > 15;
  });

  computedMinWidth = computed(() => {
    if (!this.isScrollable()) return null;
    const labelsLength = this.data()?.labels?.length || 0;
    return labelsLength * 50;
  });

  chart: Chart<'bar'> | undefined;

  constructor() {
    effect(() => {
      const currentData = this.data();
      const currentOptions = this.options();
      
      if (this.chart) {
        this.chart.data = currentData as any;
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
        type: 'bar',
        data: this.data() as any,
        options: this.options() || {},
        plugins: this.plugins(),
      });
    }
  }
}
