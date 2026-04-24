import { CommonModule } from '@angular/common';
import { Component, ElementRef, effect, inject, input } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { IAnchorItemV2 } from '../../models';

@Component({
  selector: 'sd-anchor-item-v2',
  templateUrl: './anchor-item-v2.component.html',
  styleUrls: ['./anchor-item-v2.component.scss'],
  imports: [CommonModule],
  standalone: true,
})
export class SdAnchorItemV2 implements IAnchorItemV2 {
  title = input.required<string>();
  icon = input<string | undefined>();
  id: string = uuidv4();
  elementRef = inject(ElementRef);

  constructor() {
    effect(() => {
      if (this.title()) {
        this.elementRef.nativeElement.removeAttribute('title');
      }
    });
  }
}
