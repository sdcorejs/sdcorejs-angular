import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { booleanAttribute, Component, ElementRef, inject, input, model, numberAttribute } from '@angular/core';
import { SplitterPanelUnit } from '../splitter.models';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'sd-splitter-panel',
  standalone: true,
  templateUrl: './splitter-panel.component.html',
  styleUrl: './splitter-panel.component.scss',
  host: {
    class: 'sd-splitter__panel',
    '[class.sd-splitter__panel--flex]': 'unit() === "flex"',
    '[class.sd-splitter__panel--px]': 'unit() === "px"',
    '[class.sd-splitter__panel--collapsed]': 'collapsed()',
  },
})
export class SdSplitterPanelComponent {
  readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  panelId = input<string | undefined>(undefined);
  size = input<number, unknown>(1, { transform: numberAttribute });
  unit = input<SplitterPanelUnit>('flex');
  minSize = input<number, unknown>(0, { transform: numberAttribute });
  maxSize = input<number | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v == null || v === '' ? undefined : Number(v)),
  });
  collapsible = input(false, { transform: booleanAttribute });
  collapsed = model(false);
  resizable = input(true, { transform: booleanAttribute });
}
