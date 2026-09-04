import { Directive } from '@angular/core';

/**
 * Marker cho vùng action custom chiếu vào <sd-inform>.
 * Khi có phần tử mang [sdInformAction], component ẩn link `actionLabel` mặc định.
 */
@Directive({
  selector: '[sdInformAction]',
  standalone: true,
})
export class SdInformActionDirective {}
