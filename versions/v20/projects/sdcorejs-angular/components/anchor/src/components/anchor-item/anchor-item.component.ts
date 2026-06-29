import { CommonModule } from '@angular/common';
import { Component, ElementRef, effect, inject, input } from '@angular/core';
import { IAnchorItem } from '../../models';
import { Utilities } from '@sdcorejs/utils/fns';

@Component({
  selector: 'sd-anchor-item',
  templateUrl: './anchor-item.component.html',
  styleUrl: './anchor-item.component.scss',
  imports: [CommonModule],
  standalone: true,
})
export class SdAnchorItem implements IAnchorItem {
  title = input.required<string>();
  icon = input<string | undefined>();
  // Stable key dùng cho data-autoId. Nếu không truyền thì fallback về uuid (không stable giữa các lần render).
  key = input<string | undefined>(undefined);
  id: string = Utilities.generateUuid();
  elementRef = inject(ElementRef);

  constructor() {
    effect(() => {
      if (this.title()) {
        this.elementRef.nativeElement.removeAttribute('title');
      }
    });
  }
}
