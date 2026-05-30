/* eslint-disable @angular-eslint/no-input-rename */
import { booleanAttribute, Component, effect, ElementRef, inject, input, model } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SdBaseSecureComponent } from '@sdcorejs/angular/components/base';
import { Color } from '@sdcorejs/utils/models';

@Component({
  selector: 'sd-section',
  templateUrl: './section.component.html',
  styleUrls: ['./section.component.scss'],
  imports: [MatIconModule],
})
export class SdSection extends SdBaseSecureComponent {
  #el = inject(ElementRef);

  title = input<string | undefined | null>(undefined);
  subTitle = input<string | undefined | null>(undefined);
  icon = input<string | undefined | null>(undefined);
  iconColor = input<Color>('primary', { alias: 'iconColor' });

  collapsed = model<boolean>(false, { alias: 'collapsed' });
  collapsable = input(false, { transform: booleanAttribute });
  hideHeader = input(false, { transform: booleanAttribute });
  noPaddingBody = input(false, { transform: booleanAttribute });

  constructor() {
    super();
    effect(() => {
      if (this.title()) {
        this.#el.nativeElement.removeAttribute('title');
      }
    });
  }

  toggleCollapse = () => {
    if (this.collapsable()) {
      this.collapsed.set(!this.collapsed());
    } else {
      if (this.collapsed()) {
        this.collapsed.set(false);
      }
    }
  };
}

