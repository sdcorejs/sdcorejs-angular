import { booleanAttribute, Component, computed, effect, ElementRef, inject, input, model } from '@angular/core';
import { Color } from '@sdcorejs/utils/models';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

@Component({
  selector: 'sd-section',
  templateUrl: './section.component.html',
  styleUrl: './section.component.scss',
  imports: [SdIcon],
})
export class SdSection {
  #el = inject(ElementRef);

  title = input<string | undefined | null>(undefined);
  subTitle = input<string | undefined | null>(undefined);
  icon = input<string | undefined | null>(undefined);
  iconColor = input<Color>('primary', { alias: 'iconColor' });

  collapsed = model<boolean>(false, { alias: 'collapsed' });
  collapsible = input(false, { transform: booleanAttribute });

  /** @deprecated Use `collapsible` instead. */
  collapsable = input(false, { transform: booleanAttribute });

  readonly isCollapsible = computed(() => this.collapsible() || this.collapsable());

  hideHeader = input(false, { transform: booleanAttribute });
  noPaddingBody = input(false, { transform: booleanAttribute });

  constructor() {
    effect(() => {
      if (this.title()) {
        this.#el.nativeElement.removeAttribute('title');
      }
    });
  }

  toggleCollapse = () => {
    if (this.isCollapsible()) {
      this.collapsed.set(!this.collapsed());
    } else {
      if (this.collapsed()) {
        this.collapsed.set(false);
      }
    }
  };
}
