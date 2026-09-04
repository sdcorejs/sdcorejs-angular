import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdCard } from '@sdcorejs/angular/components/card';

@Component({
  selector: 'app-card-standalone-example',
  standalone: true,
  imports: [SdCard],
  templateUrl: './card-standalone.example.html',
  styleUrl: './card-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardStandaloneExampleComponent {
  readonly lastSelected = signal(false);

  onCardClick(selected: boolean): void {
    this.lastSelected.set(selected);
  }
}
