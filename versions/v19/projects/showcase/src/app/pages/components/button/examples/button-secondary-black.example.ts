import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-button-secondary-black-example',
  standalone: true,
  imports: [SdButton],
  templateUrl: './button-secondary-black.example.html',
  styleUrl: './button-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonSecondaryBlackExampleComponent {}
