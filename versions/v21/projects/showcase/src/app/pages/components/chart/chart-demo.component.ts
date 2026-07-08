import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import {
  SdLineChartComponent,
  SdBarChartComponent,
  SdPieChartComponent,
  SdDoughnutChartComponent,
} from '@sdcorejs/angular/components/chart';

@Component({
  selector: 'app-chart-demo',
  standalone: true,
  imports: [
    DemoPageComponent,
    DemoSectionComponent,
    SdLineChartComponent,
    SdBarChartComponent,
    SdPieChartComponent,
    SdDoughnutChartComponent,
  ],
  template: `
    <demo-page
      title="Chart"
      description="Bộ biểu đồ dựa trên Chart.js — line / bar / pie / doughnut. Thường dùng trên dashboard và báo cáo.">

      <demo-section heading="Biểu đồ Line" [props]="[{ name: 'type', value: 'line' }]">
        <div class="chart-box">
          <sd-line-chart [data]="lineData" [options]="lineOptions"></sd-line-chart>
        </div>
      </demo-section>

      <demo-section heading="Biểu đồ Bar" [props]="[{ name: 'type', value: 'bar' }]">
        <div class="chart-box">
          <sd-bar-chart [data]="barData" [options]="barOptions"></sd-bar-chart>
        </div>
      </demo-section>

      <demo-section heading="Biểu đồ Pie & Doughnut" [props]="[{ name: 'type', value: 'pie / doughnut' }]">
        <div class="row">
          <div class="chart-box small">
            <sd-pie-chart [data]="pieData"></sd-pie-chart>
          </div>
          <div class="chart-box small">
            <sd-doughnut-chart [data]="doughnutData"></sd-doughnut-chart>
          </div>
        </div>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    .chart-box {
      width: 100%;
      height: 320px;
    }
    .chart-box.small {
      height: 280px;
      flex: 1;
      min-width: 280px;
    }
    .row {
      display: flex;
      gap: 24px;
      width: 100%;
      flex-wrap: wrap;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartDemoComponent {
  readonly lineData: ChartData<'line'> = {
    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
    datasets: [
      {
        label: 'Doanh thu (tỷ VND)',
        data: [12.5, 14.2, 13.8, 16.4, 18.1, 19.5],
        borderColor: '#005cbb',
        backgroundColor: 'rgba(0, 92, 187, 0.14)',
        fill: true,
        tension: 0.35,
      },
      {
        label: 'Chi phí (tỷ VND)',
        data: [9.4, 10.1, 10.6, 11.0, 11.8, 12.3],
        borderColor: '#e64a19',
        backgroundColor: 'rgba(230, 74, 25, 0.10)',
        fill: true,
        tension: 0.35,
      },
    ],
  };

  readonly lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  readonly barData: ChartData<'bar'> = {
    labels: ['Công nghệ', 'Kinh doanh', 'Nhân sự', 'Tài chính', 'Marketing'],
    datasets: [
      {
        label: 'KPI đạt được (%)',
        data: [92, 110, 85, 96, 102],
        backgroundColor: ['#005cbb', '#2e7d32', '#f9a825', '#6a1b9a', '#0277bd'],
      },
    ],
  };

  readonly barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  readonly pieData: ChartData<'pie'> = {
    labels: ['Nhân sự', 'Marketing', 'Vận hành', 'Khác'],
    datasets: [
      {
        data: [42, 23, 25, 10],
        backgroundColor: ['#005cbb', '#e64a19', '#2e7d32', '#9e9e9e'],
      },
    ],
  };

  readonly doughnutData: ChartData<'doughnut'> = {
    labels: ['Nhân sự', 'Marketing', 'Vận hành', 'Khác'],
    datasets: [
      {
        data: [42, 23, 25, 10],
        backgroundColor: ['#005cbb', '#e64a19', '#2e7d32', '#9e9e9e'],
      },
    ],
  };
}
