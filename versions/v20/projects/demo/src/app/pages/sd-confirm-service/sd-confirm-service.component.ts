import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SdConfirmService } from '@sdcorejs/angular/services';
import { SdSection, SdButton } from '@sdcorejs/angular/components';

@Component({
  templateUrl: './sd-confirm-service.component.html',
  imports: [CommonModule, SdSection, SdButton],
})
export class SdConfirmServiceDemoComponent {
  constructor(private confirmService: SdConfirmService) {}

  // Basic confirm
  showBasicConfirm = () => {
    this.confirmService.confirm('Are you sure you want to proceed?').then(
      value => {
        console.log('Confirmed, value:', value);
        alert('Confirmed!');
      },
      action => {
        console.log('Cancelled, action:', action);
        alert('Cancelled!');
      }
    );
  };

  // Confirm with custom options
  showCustomConfirm = () => {
    this.confirmService
      .confirm('Do you want to delete this item?', {
        title: 'Delete Confirmation',
        yesTitle: 'Delete',
        noTitle: 'Cancel',
        yesButtonColor: 'error',
        noButtonColor: 'secondary',
      })
      .then(
        value => {
          console.log('Deleted, value:', value);
          alert('Item deleted!');
        },
        action => {
          console.log('Delete cancelled, action:', action);
          alert('Delete cancelled!');
        }
      );
  };

  // Confirm with disableBackdropClose = false
  showConfirmWithDisableBackdropClose = () => {
    this.confirmService
      .confirm('This confirm dialog can be closed by clicking outside.', {
        title: 'Closable Confirmation',
        yesTitle: 'Understood',
        noTitle: 'Cancel',
        disableBackdropClose: false,
      })
      .then(
        value => {
          console.log('Confirmed, value:', value);
        },
        action => {
          console.log('Cancelled, action:', action);
        }
      );
  };

  // Confirm with input
  showConfirmWithInput = () => {
    this.confirmService
      .withInput('Please enter your reason:', {
        title: 'Input Required',
        yesTitle: 'Submit',
        noTitle: 'Cancel',
        required: true,
        maxlength: 100,
        defaultValue: '',
      })
      .then(
        value => {
          console.log('Input value:', value);
          alert(`Input submitted: ${value}`);
        },
        action => {
          console.log('Input cancelled, action:', action);
          alert('Input cancelled!');
        }
      );
  };

  // Confirm with date
  showConfirmWithDate = () => {
    this.confirmService
      .withDate('Please select a date:', {
        title: 'Date Selection',
        yesTitle: 'Select',
        noTitle: 'Cancel',
        required: true,
        defaultValue: '',
      })
      .then(
        value => {
          console.log('Selected date:', value);
          alert(`Date selected: ${value}`);
        },
        action => {
          console.log('Date selection cancelled, action:', action);
          alert('Date selection cancelled!');
        }
      );
  };

  // Confirm with radio
  showConfirmWithRadio = () => {
    const options = [
      { value: 'option1', label: 'Option 1 - Basic Plan' },
      { value: 'option2', label: 'Option 2 - Standard Plan' },
      { value: 'option3', label: 'Option 3 - Premium Plan' },
    ];

    this.confirmService
      .withRadio('Please select a plan:', {
        title: 'Plan Selection',
        yesTitle: 'Select Plan',
        noTitle: 'Cancel',
        required: true,
        items: options,
        valueField: 'value',
        displayField: 'label',
        display: 'column',
        defaultValue: 'option2',
      })
      .then(
        (value: any) => {
          console.log('Selected option:', value);
          alert(`Plan selected: ${value}`);
        },
        action => {
          console.log('Plan selection cancelled, action:', action);
          alert('Plan selection cancelled!');
        }
      );
  };

  // Radio with row display
  showConfirmWithRadioRow = () => {
    const priorities = [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ];

    this.confirmService
      .withRadio('Select priority level:', {
        title: 'Priority Selection',
        yesTitle: 'Set Priority',
        noTitle: 'Cancel',
        required: true,
        items: priorities,
        valueField: 'value',
        displayField: 'label',
        display: 'row',
        defaultValue: 'medium',
      })
      .then(
        (value: any) => {
          console.log('Selected priority:', value);
          alert(`Priority set to: ${value}`);
        },
        action => {
          console.log('Priority selection cancelled, action:', action);
          alert('Priority selection cancelled!');
        }
      );
  };
}

