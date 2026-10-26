import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-button-query-example',
  standalone: true,
  imports: [SdButton],
  templateUrl: './button-query.example.html',
  styleUrl: './button-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonQueryExampleComponent {
  readonly message = signal('');
}
