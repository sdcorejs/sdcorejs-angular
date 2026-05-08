import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SdBarChartComponent,
  SdLineChartComponent,
  SdPieChartComponent,
  SdDoughnutChartComponent,
} from '@sdcorejs/angular/components/chart';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-sd-chart-demo',
  standalone: true,
  imports: [CommonModule, SdBarChartComponent, SdLineChartComponent, SdPieChartComponent, SdDoughnutChartComponent],
  templateUrl: './sd-chart-demo.component.html',
  styles: [
    `
      .chart-container {
        width: 600px;
        height: 400px;
        margin-bottom: 2rem;
      }
      .demo-container {
        padding: 2rem;
      }
    `,
  ],
})
export class SdChartDemoComponent {
  barChartData: ChartData<'bar'> = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Sales',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
        data: [65, 59, 80, 81, 56, 55, 40],
      },
    ],
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Mixed chart: Bar + Line
  mixedChartData: ChartData<'bar'> = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        type: 'bar',
        label: 'Sales',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        data: [65, 59, 80, 81, 56, 55, 40],
      },
      // {
      //   type: 'line',
      //   label: 'Trend',
      //   borderColor: 'rgb(255, 99, 132)',
      //   borderWidth: 2,
      //   fill: false,
      //   data: [60, 65, 75, 80, 60, 50, 45],
      // }
    ],
  };

  // Scrolling Bar Chart Data
  scrollingBarChartData: ChartData<'bar'> = {
    labels: Array.from({ length: 50 }, (_, i) => `Day ${i + 1}`),
    datasets: [
      {
        label: 'Daily Active Users',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        data: Array.from({ length: 50 }, () => Math.floor(Math.random() * 100)),
      },
    ],
  };

  lineChartData: ChartData<'line'> = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Revenue',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgb(75, 192, 192)',
        data: [65, 59, 80, 81, 56, 55, 40],
        fill: false,
        tension: 0.4,
      },
    ],
  };

  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
  };

  pieChartData: ChartData<'pie'> = {
    labels: ['Red', 'Blue', 'Yellow'],
    datasets: [
      {
        label: 'Dataset 1',
        data: [300, 50, 100],
        backgroundColor: ['rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(255, 205, 86)'],
        hoverOffset: 4,
      },
    ],
  };

  doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Red', 'Blue', 'Yellow', 'Green'],
    datasets: [
      {
        label: 'Dataset 1',
        data: [300, 50, 100, 80],
        backgroundColor: ['rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(255, 205, 86)', 'rgb(75, 192, 192)'],
        hoverOffset: 4,
      },
    ],
  };
}

