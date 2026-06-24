import { ElementRef, InputSignal } from '@angular/core';

export interface IAnchorItem {
  id: string;
  title: InputSignal<string>;
  icon: InputSignal<string | undefined>;
  elementRef: ElementRef;
}
