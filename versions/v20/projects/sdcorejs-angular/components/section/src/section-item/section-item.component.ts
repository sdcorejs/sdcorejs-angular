import { Component, input } from '@angular/core';

@Component({
  selector: 'sd-section-item',
  templateUrl: './section-item.component.html',
  styleUrl: 'section-item.component.scss',
  standalone: true,
})
export class SdSectionItem {
  label = input.required<string>();
  labelWidth = input<string, string | null | undefined>('150px', {
    transform: (val: any): string => {
      return val || '150px';
    },
  });
}
