import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SdBarChartComponent, SdLineChartComponent, SdPieChartComponent } from '@sdcorejs/angular/components/chart';

@Component({
  selector: 'app-sd-chart-demo',
  standalone: true,
  imports: [CommonModule, SdBarChartComponent, SdLineChartComponent, SdPieChartComponent],
  templateUrl: './sd-chart-demo.component.html',
  styles: [`
    .chart-container {
      width: 600px;
      height: 400px;
      margin-bottom: 2rem;
    }
    .demo-container {
      padding: 2rem;
    }
  `]
})
export class SdChartDemoComponent {
  barChartData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Sales',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
        data: [65, 59, 80, 81, 56, 55, 40],
      }
    ]
  };
  
  barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  lineChartData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Revenue',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgb(75, 192, 192)',
        data: [65, 59, 80, 81, 56, 55, 40],
        fill: false,
        tension: 0.4
      }
    ]
  };

  pieChartData = {
    labels: ['Red', 'Blue', 'Yellow'],
    datasets: [
      {
        label: 'Dataset 1',
        data: [300, 50, 100],
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 205, 86)'
        ],
        hoverOffset: 4
      }
    ]
  };
}

