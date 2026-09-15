import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdButton, SdButtonItem, SdButtonItemDivider } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-button-action-popover-example',
  standalone: true,
  imports: [SdButton, SdButtonItem, SdButtonItemDivider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button-action-popover.example.html',
  styleUrl: './button-example.scss',
})
export class ButtonActionPopoverExampleComponent {
  readonly showActions = signal(true);
  readonly result = signal('Chọn một action để kiểm tra callback.');
}
