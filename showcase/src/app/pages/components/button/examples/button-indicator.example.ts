import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-button-indicator-example',
  standalone: true,
  imports: [SdButton],
  templateUrl: './button-indicator.example.html',
  styleUrl: './button-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonIndicatorExampleComponent {
  readonly unread = signal(3);

  addUnread(): void {
    this.unread.update(count => count + 1);
  }

  clearUnread(): void {
    this.unread.set(0);
  }
}
