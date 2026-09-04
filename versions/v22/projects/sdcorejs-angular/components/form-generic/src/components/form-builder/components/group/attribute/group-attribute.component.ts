import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, input, untracked } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SD_COMPONENT_ICONS, SdFormGenericComponent, SdFormGenericGroup } from '../../../../../models';
import { BuilderService } from '../../../services';
import { AttributeExpression } from '../../attribute-expression/attribute-expression.component';
import { AttributeInput } from '../../attribute-input/attribute-input.component';

const ICON_PRESETS = ['category', 'folder', 'inventory_2', 'group_work', 'workspaces', 'view_quilt'] as const;
const COLOR_PRESETS = ['primary', 'secondary', 'success', 'warning', 'error'] as const;

@Component({
  selector: 'group-attribute',
  templateUrl: './group-attribute.component.html',
  styleUrl: './group-attribute.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AttributeInput, AttributeExpression, SdTranslatePipe],
})
export class GroupAttribute {
  // ── constants ────────────────────────────────────────────────────────
  readonly iconPresets = ICON_PRESETS;
  readonly colorPresets = COLOR_PRESETS;
  readonly componentIcons = SD_COMPONENT_ICONS;

  form = new FormGroup({});

  // ── signal input ─────────────────────────────────────────────────────
  /** Required group reference. Mutated in place khi user pick icon/color/expression. */
  readonly group = input.required<SdFormGenericGroup>();

  // ── injected services ────────────────────────────────────────────────
  readonly #builderService = inject(BuilderService);
  readonly #ref = inject(ChangeDetectorRef);

  constructor() {
    // Bảo đảm group có properties + defaults khi input ref thay đổi.
    // untracked() vì ta mutate group (không phải read signal) — tránh tạo cycle.
    effect(() => {
      const g = this.group();
      untracked(() => {
        if (!g.properties) {
          g.properties = { icon: 'category', color: 'primary' };
        } else {
          g.properties.icon = g.properties.icon || 'category';
          g.properties.color = g.properties.color || ('primary' as any);
        }
      });
    });
  }

  pickIcon = (icon: string) => {
    this.group().properties.icon = icon;
    this.#builderService.componentEmitters.next(this.group());
    this.#ref.markForCheck();
  };

  pickColor = (color: (typeof COLOR_PRESETS)[number]) => {
    this.group().properties.color = color as any;
    this.#builderService.componentEmitters.next(this.group());
    this.#ref.markForCheck();
  };

  symbolForChild = (c: SdFormGenericComponent): string => {
    return this.componentIcons[c.type]?.symbol ?? 'help';
  };

  labelForChild = (c: SdFormGenericComponent): string => {
    return 'label' in c ? c.label : c.key || c.id;
  };
}
