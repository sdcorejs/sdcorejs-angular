import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, booleanAttribute, computed, contentChild, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SdOrgChartItemDefDirective } from './org-chart-item-def.directive';
import { SdOrgChartItem, SdOrgChartItemContext } from './org-chart.model';

@Component({
  selector: 'sd-org-chart',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './org-chart.component.html',
  styleUrls: ['./org-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-autoid]': 'autoId()',
  },
})
export class SdOrgChart {
  readonly autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  readonly autoId = computed(() => (this.autoIdInput() ? `components-org-chart-${this.autoIdInput()}` : undefined));

  readonly items = input.required<SdOrgChartItem[]>();
  readonly itemTemplate = input<TemplateRef<SdOrgChartItemContext> | undefined | null>(undefined);
  readonly collapsible = input(true, { transform: booleanAttribute });

  readonly itemDef = contentChild(SdOrgChartItemDefDirective);

  readonly resolvedItemTemplate = computed<TemplateRef<SdOrgChartItemContext> | undefined>(() => {
    return this.itemDef()?.templateRef || this.itemTemplate() || undefined;
  });

  readonly #expandedState = signal<Record<string, boolean>>({});

  readonly trackByItem = (_index: number, item: SdOrgChartItem) => item.id;

  hasChildren = (item: SdOrgChartItem): boolean => {
    return this.childrenOf(item).length > 0;
  };

  childrenOf = (item: SdOrgChartItem): SdOrgChartItem[] => {
    return item.children || [];
  };

  isExpanded = (item: SdOrgChartItem): boolean => {
    if (!this.collapsible()) {
      return true;
    }

    const key = this.#itemKey(item);
    const state = this.#expandedState();
    return state[key] ?? item.expanded ?? true;
  };

  toggle = (item: SdOrgChartItem, event?: Event): void => {
    event?.stopPropagation();

    if (!this.collapsible() || !this.hasChildren(item)) {
      return;
    }

    const key = this.#itemKey(item);
    this.#expandedState.update(state => ({
      ...state,
      [key]: !(state[key] ?? item.expanded ?? true),
    }));
  };

  createContext = (item: SdOrgChartItem, depth: number, parent: SdOrgChartItem | null): SdOrgChartItemContext => {
    const hasChildren = this.hasChildren(item);
    const expanded = this.isExpanded(item);

    return {
      $implicit: item,
      item,
      depth,
      parent,
      expanded,
      hasChildren,
      isLeaf: !hasChildren,
      toggle: () => this.toggle(item),
    };
  };

  nodeAutoId = (item: SdOrgChartItem, part: 'node' | 'image' | 'title' | 'description' | 'toggle'): string | undefined => {
    const base = this.autoId();
    if (!base) {
      return undefined;
    }

    return `${base}-${part}-${this.#autoIdKey(item)}`;
  };

  #itemKey = (item: SdOrgChartItem): string => {
    return String(item.id);
  };

  #autoIdKey = (item: SdOrgChartItem): string => {
    return this.#itemKey(item).replace(/[^a-zA-Z0-9_-]/g, '-');
  };
}
