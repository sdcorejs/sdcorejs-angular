import { Directive, HostListener } from '@angular/core';
import { RouterLinkWithHref } from '@angular/router';

@Directive({
  selector: 'a[routerLink],area[routerLink]',
  standalone: true,
})
export class RouterLinkMouseDownDirective extends RouterLinkWithHref {
  @HostListener('mousedown', ['$event.button', '$event.ctrlKey', '$event.shiftKey', '$event.altKey', '$event.metaKey'])
  onMouseDown(button: number, ctrlKey: boolean, shiftKey: boolean, altKey: boolean, metaKey: boolean): boolean {
    return this.onClick(button, ctrlKey, shiftKey, altKey, metaKey);
  }
}
