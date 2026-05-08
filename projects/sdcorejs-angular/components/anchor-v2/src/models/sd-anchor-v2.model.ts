import { ElementRef, InputSignal } from "@angular/core";

export interface IAnchorItemV2 {
  id: string;
  title: InputSignal<string>;
  icon: InputSignal<string | undefined>;
  elementRef: ElementRef;
}

