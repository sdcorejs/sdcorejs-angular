import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { type SdIconFontSet } from '@sdcorejs/angular/modules/icon';

@Component({
  selector: 'app-button-icon-set-example',
  standalone: true,
  imports: [SdButton],
  templateUrl: './button-icon-set.example.html',
  styleUrl: './button-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonIconSetExampleComponent {
  readonly fontSet = signal<SdIconFontSet>('material-icons-outlined');

  useFontSet(fontSet: SdIconFontSet): void {
    this.fontSet.set(fontSet);
  }
}
