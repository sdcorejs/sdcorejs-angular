import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdCard, SdCardGroup } from '@sdcorejs/angular/components/card';

@Component({
  selector: 'app-card-states-example',
  standalone: true,
  imports: [SdCard, SdCardGroup],
  templateUrl: './card-states.example.html',
  styleUrl: './card-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardStatesExampleComponent {
  readonly selection = signal<string | null>('locked');
  readonly disabledGroupSelection = signal<string | null>(null);
  readonly standaloneSelected = signal(false);
}
