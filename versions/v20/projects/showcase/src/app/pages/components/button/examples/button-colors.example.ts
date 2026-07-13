import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-button-colors-example',
  standalone: true,
  imports: [SdButton],
  templateUrl: './button-colors.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonColorsExampleComponent {}
