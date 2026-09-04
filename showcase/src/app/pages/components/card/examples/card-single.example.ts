import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdCard, SdCardGroup } from '@sdcorejs/angular/components/card';

interface StatusOption {
  code: string;
  name: string;
}

@Component({
  selector: 'app-card-single-example',
  standalone: true,
  imports: [SdCard, SdCardGroup],
  templateUrl: './card-single.example.html',
  styleUrl: './card-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardSingleExampleComponent {
  readonly statuses: StatusOption[] = [
    { code: 'active', name: 'Đang hoạt động' },
    { code: 'paused', name: 'Tạm dừng' },
    { code: 'archived', name: 'Đã lưu trữ' },
  ];
  readonly selectedStatus = signal<StatusOption | null>(null);
  readonly lastChange = signal('Chưa có interaction');

  onStatusChange(value: StatusOption | StatusOption[] | null): void {
    this.lastChange.set(Array.isArray(value) ? 'invalid' : (value?.code ?? 'null'));
  }
}
