import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-button-icon-only-example',
  standalone: true,
  imports: [SdButton],
  templateUrl: './button-icon-only.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonIconOnlyExampleComponent {}
