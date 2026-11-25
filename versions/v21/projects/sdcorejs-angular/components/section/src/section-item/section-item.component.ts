import { Component, input } from '@angular/core';

@Component({
  selector: 'sd-section-item',
  templateUrl: './section-item.component.html',
  styleUrl: 'section-item.component.scss',
  standalone: true,
  host: { '[class.sd-section-item--auto]': "labelWidth() === 'auto'" },
})
export class SdSectionItem {
  /** Left column text. Optional when the left column is projected through `[itemLeft]`. */
  label = input<string>('');
  labelWidth = input<string, string | null | undefined>('150px', {
    transform: value => value || '150px',
  });
}
