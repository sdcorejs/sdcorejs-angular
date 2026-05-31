import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  TemplateRef,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'sd-tab',
  standalone: true,
  template: `<ng-template #body><ng-content></ng-content></ng-template>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdTab {
  label = input.required<string>();
  icon = input<string | null | undefined>(undefined);
  badge = input<string | number | null | undefined>(undefined);
  disabled = input(false, { transform: booleanAttribute });
  closable = input(false, { transform: booleanAttribute });

  close = output<void>();

  // why: viewChild on `#body` template captures projected content so the parent
  // <sd-tab-group> can render it lazily via matTabContent + ngTemplateOutlet.
  // If we projected raw ng-content into <mat-tab> directly, mat-tab would render
  // eagerly and lose the lazy-load behavior.
  bodyTpl = viewChild.required<TemplateRef<unknown>>('body');
}
