import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'sd-quick-action',
  templateUrl: './quick-action.component.html',
  styleUrls: ['./quick-action.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class SdQuickAction {
  isOpened = false;
  @Input('isOpened') set _isOpened(isOpened: '' | boolean | undefined | null) {
    this.isOpened = !!isOpened;
  }
  constructor() {}
  open = () => {
    this.isOpened = true;
  };

  close = () => {
    this.isOpened = false;
  };
}
