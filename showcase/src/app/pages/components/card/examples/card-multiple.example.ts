import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { SdCard, SdCardGroup } from '@sdcorejs/angular/components/card';

interface ChannelOption {
  code: string;
  name: string;
}

@Component({
  selector: 'app-card-multiple-example',
  standalone: true,
  imports: [SdCard, SdCardGroup],
  templateUrl: './card-multiple.example.html',
  styleUrl: './card-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardMultipleExampleComponent {
  readonly channels: ChannelOption[] = [
    { code: 'email', name: 'Email' },
    { code: 'sms', name: 'SMS' },
    { code: 'push', name: 'Push notification' },
  ];
  readonly selectedChannels = signal<ChannelOption[]>([]);
  readonly lastChange = signal('none');
  readonly selectedCodes = computed(() => {
    const selection = this.selectedChannels();
    return selection.map(item => item.code).join(', ') || 'none';
  });

  onChannelsChange(value: ChannelOption | ChannelOption[] | null): void {
    this.lastChange.set(Array.isArray(value) ? value.map(item => item.code).join(', ') || 'none' : 'invalid');
  }
}
