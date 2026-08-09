import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, booleanAttribute, computed, contentChild, input, signal } from '@angular/core';
import { SdOrgChartItemDefDirective } from './org-chart-item-def.directive';
import { SdOrgChartItem, SdOrgChartItemContext, SdOrgChartOption } from './org-chart.model';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

/** Shared empty children list — leaf nodes reuse this ref instead of a new `[]` per call. */
const EMPTY_ORG_CHART_ITEMS: SdOrgChartItem[] = [];

@Component({
  selector: 'sd-org-chart',
  standalone: true,
  imports: [SdIcon, CommonModule],
  templateUrl: './org-chart.component.html',
  styleUrl: './org-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-autoid]': 'autoId()',
  },
})
export class SdOrgChart {
  readonly autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  readonly option = input<SdOrgChartOption | undefined>(undefined);
  readonly autoId = computed(() => {
    const scope = this.option()?.autoId ?? this.autoIdInput();
    return scope ? `components-org-chart-${scope}` : undefined;
  });

  readonly items = input<SdOrgChartItem[] | undefined>(undefined);
  readonly itemTemplate = input<TemplateRef<SdOrgChartItemContext> | undefined | null>(undefined);
  readonly collapsible = input(true, { transform: booleanAttribute });

  readonly itemDef = contentChild(SdOrgChartItemDefDirective);
  readonly resolvedItems = computed(() => this.option()?.items ?? this.items() ?? []);
  readonly resolvedCollapsible = computed(() => this.option()?.collapsible ?? this.collapsible());

  readonly resolvedItemTemplate = computed<TemplateRef<SdOrgChartItemContext> | undefined>(() => {
    return this.itemDef()?.templateRef || this.option()?.itemTemplate || this.itemTemplate() || undefined;
  });

  readonly #expandedState = signal<Record<string, boolean>>({});

  /**
   * `item.id` → template context, memo hoá trong một `computed`.
   *
   * why: `createContext()` được gọi thẳng từ template (`@let _context = createContext(...)`) nên
   * trước đây MỖI node cấp phát một context MỚI ở MỖI chu kỳ change detection, rồi đưa vào
   * `*ngTemplateOutlet` — đúng bug class cấp-phát-mỗi-CD (`ngTemplateOutletContext` đổi ref mỗi
   * CD → outlet ghi lại context liên tục). Computed chỉ chạy lại khi cấu trúc items hoặc trạng
   * thái expand đổi, nên giữa hai lần CD ref context là như nhau.
   */
  readonly #contextByKey = computed<Map<string, SdOrgChartItemContext>>(() => {
    const map = new Map<string, SdOrgChartItemContext>();
    const walk = (items: SdOrgChartItem[], depth: number, parent: SdOrgChartItem | null): void => {
      for (const item of items) {
        map.set(this.#itemKey(item), this.#buildContext(item, depth, parent));
        const children = this.childrenOf(item);
        if (children.length > 0) walk(children, depth + 1, item);
      }
    };
    walk(this.resolvedItems(), 0, null);
    return map;
  });

  readonly trackByItem = (_index: number, item: SdOrgChartItem) => item.id;

  hasChildren = (item: SdOrgChartItem): boolean => {
    return this.childrenOf(item).length > 0;
  };

  /** why: trả về hằng số dùng chung thay vì `[]` mới, để leaf không cấp phát mỗi lần CD gọi tới. */
  childrenOf = (item: SdOrgChartItem): SdOrgChartItem[] => {
    return item.children || EMPTY_ORG_CHART_ITEMS;
  };

  isExpanded = (item: SdOrgChartItem): boolean => {
    if (!this.resolvedCollapsible()) {
      return true;
    }

    const key = this.#itemKey(item);
    const state = this.#expandedState();
    return state[key] ?? item.expanded ?? true;
  };

  toggle = (item: SdOrgChartItem, event?: Event): void => {
    event?.stopPropagation();

    if (!this.resolvedCollapsible() || !this.hasChildren(item)) {
      return;
    }

    const key = this.#itemKey(item);
    const expanded = !(this.#expandedState()[key] ?? item.expanded ?? true);
    this.#expandedState.update(state => ({
      ...state,
      [key]: expanded,
    }));
    this.option()?.onToggle?.({ item, expanded });
  };

  /**
   * Template context của một node. Ref ổn định giữa các lần CD nhờ `#contextByKey`.
   * Item không nằm trong `resolvedItems()` (gọi thủ công từ bên ngoài) thì dựng mới — trường hợp
   * này không nằm trên đường render nên không gây churn.
   */
  createContext = (item: SdOrgChartItem, depth: number, parent: SdOrgChartItem | null): SdOrgChartItemContext => {
    return this.#contextByKey().get(this.#itemKey(item)) ?? this.#buildContext(item, depth, parent);
  };

  nodeAutoId = (item: SdOrgChartItem, part: 'node' | 'image' | 'title' | 'description' | 'toggle'): string | undefined => {
    const base = this.autoId();
    if (!base) {
      return undefined;
    }

    return `${base}-${part}-${this.#autoIdKey(item)}`;
  };

  #buildContext = (item: SdOrgChartItem, depth: number, parent: SdOrgChartItem | null): SdOrgChartItemContext => {
    const hasChildren = this.hasChildren(item);

    return {
      $implicit: item,
      item,
      depth,
      parent,
      expanded: this.isExpanded(item),
      hasChildren,
      isLeaf: !hasChildren,
      toggle: () => this.toggle(item),
    };
  };

  #itemKey = (item: SdOrgChartItem): string => {
    return String(item.id);
  };

  #autoIdKey = (item: SdOrgChartItem): string => {
    return this.#itemKey(item).replace(/[^a-zA-Z0-9_-]/g, '-');
  };
}
