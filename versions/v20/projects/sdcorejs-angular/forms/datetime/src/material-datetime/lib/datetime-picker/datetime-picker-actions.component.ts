import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sd-datetime-picker-actions',
  standalone: true,
  template: `<ng-content></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sd-datetime-picker-actions' },
  styles: [`
    :host {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px 12px 12px;
      border-top: 1px solid var(--mat-sys-outline-variant, rgba(0, 0, 0, 0.08));
    }
    /* "Now" button always anchors to the left; other buttons flow right */
    :host ::ng-deep button[sdDatetimePickerNow] {
      margin-right: auto;
    }
    :host ::ng-deep button.mat-mdc-button,
    :host ::ng-deep button.mat-mdc-unelevated-button,
    :host ::ng-deep button.mat-mdc-raised-button {
      height: 32px;
      min-height: 32px;
      padding: 0 12px;
      font-size: 13px;
      line-height: 1;
    }
    /* Compact icon inside an icon+label button */
    :host ::ng-deep button[sdDatetimePickerNow] .mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
      vertical-align: middle;
    }
  `],
})
export class SdDatetimePickerActions {}
