import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SdNotifyService } from '@sdcorejs/angular/services';
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'sd-notify',
  templateUrl: './sd-notify.component.html',
  imports: [CommonModule],
})
export class SdNotifyComponent {
  constructor(private notifyService: SdNotifyService) {}

  notify = (message: string) => {
    if (message === 'success') {
      this.notifyService.success('This is success message');
    } else if (message === 'error') {
      this.notifyService.error('This is error message');
    } else if (message === 'warning') {
      this.notifyService.warning('This is warning message');
    } else {
      this.notifyService.info(
        'This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message'
      );
    }
  };

  action = (message: string) => {
    if (message === 'success') {
      this.notifyService.success('This is success message', {
        actionLabel: 'Success',
        onAction: () => alert('success'),
      });
    } else if (message === 'error') {
      this.notifyService.error('<strong>This is error message</strong>', {
        actionLabel: 'Error',
        onAction: () => alert('error'),
      });
    } else if (message === 'warning') {
      this.notifyService.warning('This is warning message', {
        actionLabel: 'Warning',
        onAction: () => alert('warning'),
      });
    } else {
      this.notifyService.info(
        'This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message This is info message',
        {
          actionLabel: 'Info',
          onAction: () => alert('info'),
        }
      );
    }
  };
}

