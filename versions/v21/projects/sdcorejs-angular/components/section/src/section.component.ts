import { booleanAttribute, Component, computed, effect, ElementRef, inject, input, model } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Color } from '@sdcorejs/utils/models';

@Component({
  selector: 'sd-section',
  templateUrl: './section.component.html',
  styleUrls: ['./section.component.scss'],
  imports: [MatIconModule],
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
