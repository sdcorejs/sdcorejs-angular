import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdCard, SdCardGroup, type SdCardCompareWith } from '@sdcorejs/angular/components/card';

interface StatusOption {
  code: string;
  name: string;
}

@Component({
  selector: 'app-card-compare-example',
  standalone: true,
  imports: [SdCard, SdCardGroup],
  templateUrl: './card-compare.example.html',
  styleUrl: './card-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardCompareExampleComponent {
  readonly statuses: StatusOption[] = [
    { code: 'active', name: 'Option reference' },
    { code: 'paused', name: 'Paused' },
  ];
  readonly selectedStatus = signal<StatusOption | null>({
    code: 'active',
    name: 'Different model reference',
  });
  readonly compareStatus: SdCardCompareWith<StatusOption> = (modelValue, cardValue) => modelValue.code === cardValue.code;
}
