import { Directive, ElementRef, OnDestroy, OnInit, effect, input } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, DefaultDataPoint, registerables } from 'chart.js';

Chart.register(...registerables);

@Directive({
  selector: '[sdBaseChart]',
  standalone: true
})
export class BaseChartDirective implements OnInit, OnDestroy {
  type = input.required<ChartType>();
  data = input.required<any>();
  options = input<any>();
  plugins = input<any[]>([]);

  chart: Chart | undefined;

  constructor(private elementRef: ElementRef) {
    effect(() => {
      const currentData = this.data();
      const currentOptions = this.options();
      
      if (this.chart) {
        this.chart.data = currentData;
        this.chart.options = currentOptions || {};
        this.chart.update();
      }
    });
  }

  ngOnInit() {
    this.initChart();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private initChart() {
    if (this.chart) {
      this.chart.destroy();
    }
    const ctx = this.elementRef.nativeElement.getContext('2d');
    if (ctx) {
      this.chart = new Chart(ctx, {
        type: this.type(),
        data: this.data(),
        options: this.options() || {},
        plugins: this.plugins(),
      });
    }
  }
}
