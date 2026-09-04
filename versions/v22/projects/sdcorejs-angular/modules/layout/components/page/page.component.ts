import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { booleanAttribute, Component, effect, ElementRef, inject, input } from '@angular/core';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'sd-page',
  templateUrl: './page.component.html',
  styleUrl: './page.component.scss',
})
export class SdPageComponent {
  private el = inject(ElementRef);

  title = input<string>('', { alias: 'title' });
  description = input<string>('', { alias: 'description' });
  noHeader = input(false, { transform: booleanAttribute, alias: 'noHeader' });

  constructor() {
    effect(() => {
      if (this.title()) {
        this.el.nativeElement.removeAttribute('title');
      }
    });
  }
}
