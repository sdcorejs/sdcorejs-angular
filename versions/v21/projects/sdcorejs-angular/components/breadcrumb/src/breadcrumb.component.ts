import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, PRIMARY_OUTLET, Router } from '@angular/router';
import { MaybeAsync, normalizeAsync } from '@sdcorejs/utils/models';
import { SdIcon, SdIconSet } from '@sdcorejs/angular/modules/icon';
import { catchError, combineLatest, defer, filter, map, of } from 'rxjs';

export type SdBreadcrumbLabel =
  | MaybeAsync<string | null | undefined>
  | ((route?: ActivatedRouteSnapshot) => MaybeAsync<string | null | undefined>);

export interface SdBreadcrumbItem {
  readonly label: SdBreadcrumbLabel;
  readonly url?: string | unknown[];
  readonly icon?: string;
  readonly fontSet?: SdIconSet;
  readonly disabled?: boolean;
  readonly clickable?: boolean;
}

export interface SdBreadcrumbRouteConfig extends Omit<SdBreadcrumbItem, 'url'> {
  readonly url?: string | unknown[];
}

export interface SdBreadcrumbResolvedItem extends Omit<SdBreadcrumbItem, 'label'> {
  readonly label: string;
  readonly source: SdBreadcrumbItem;
}

export interface SdBreadcrumbItemTemplateContext {
  readonly $implicit: SdBreadcrumbResolvedItem;
  readonly item: SdBreadcrumbResolvedItem;
}

interface SdBreadcrumbItemEntry {
  readonly kind: 'item';
  readonly item: SdBreadcrumbResolvedItem;
}

interface SdBreadcrumbEllipsisEntry {
  readonly kind: 'ellipsis';
}

type SdBreadcrumbEntry = SdBreadcrumbItemEntry | SdBreadcrumbEllipsisEntry;

interface SdBreadcrumbSourceItem extends SdBreadcrumbItem {
  readonly route?: ActivatedRouteSnapshot;
}

@Component({
  selector: 'sd-breadcrumb',
  standalone: true,
  imports: [NgTemplateOutlet, SdIcon],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdBreadcrumb {
  readonly #router = inject(Router, { optional: true });
  readonly #routeVersion = signal(0);
  readonly #resolvedItems = signal<SdBreadcrumbResolvedItem[]>([]);

  readonly items = input<readonly SdBreadcrumbItem[] | null | undefined>(undefined);
  readonly maxItems = input(5, { transform: normalizeMaxItems });
  readonly ariaLabel = input('Breadcrumb');
  readonly separator = input('chevron_right');
  readonly sdItemActivate = output<SdBreadcrumbItem>();

  protected readonly itemTemplate = contentChild<TemplateRef<SdBreadcrumbItemTemplateContext>>(TemplateRef);
  protected readonly visibleEntries = computed<readonly SdBreadcrumbEntry[]>(() => {
    const entries = this.#resolvedItems().map(item => ({ kind: 'item' as const, item }));
    const maxItems = this.maxItems();
    if (entries.length <= maxItems) return entries;

    const tailCount = maxItems - 2;
    return [entries[0]!, { kind: 'ellipsis' as const }, ...entries.slice(-tailCount)];
  });

  constructor() {
    this.#router?.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.#routeVersion.update(version => version + 1));

    effect(onCleanup => {
      const providedItems = this.items();
      if (providedItems == null) this.#routeVersion();
      const sourceItems: readonly SdBreadcrumbSourceItem[] = providedItems ?? this.#createRouteItems();
      if (sourceItems.length === 0) {
        this.#resolvedItems.set([]);
        return;
      }

      const subscription = combineLatest(
        sourceItems.map(item =>
          defer(() => normalizeAsync(resolveLabelSource(item.label, item.route))).pipe(
            map(label => ({
              ...item,
              label: String(label ?? '').trim(),
              source: item,
            })),
            catchError(() => of({ ...item, label: '', source: item }))
          )
        )
      ).subscribe(items => this.#resolvedItems.set(items.filter(item => item.label)));
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected activate(item: SdBreadcrumbResolvedItem, event: Event): void {
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    this.sdItemActivate.emit(item.source);

    if (!item.url || !this.#router || isModifiedMouseEvent(event)) return;
    event.preventDefault();
    if (typeof item.url === 'string') {
      void this.#router.navigateByUrl(item.url);
    } else {
      void this.#router.navigate(item.url);
    }
  }

  protected href(item: SdBreadcrumbResolvedItem): string | null {
    return typeof item.url === 'string' ? item.url : null;
  }

  protected templateContext(item: SdBreadcrumbResolvedItem): SdBreadcrumbItemTemplateContext {
    return { $implicit: item, item };
  }

  #createRouteItems(): SdBreadcrumbSourceItem[] {
    const root = this.#router?.routerState.snapshot.root;
    if (!root) return [];

    const items: SdBreadcrumbSourceItem[] = [];
    const segments: string[] = [];
    let route: ActivatedRouteSnapshot | null = root;

    while (route) {
      if (route.outlet === PRIMARY_OUTLET) {
        segments.push(...route.url.map(segment => segment.path).filter(Boolean));
        const value = route.data['breadcrumb'] as SdBreadcrumbLabel | SdBreadcrumbRouteConfig | undefined;
        if (value !== undefined && value !== null) {
          const config = isRouteConfig(value) ? value : { label: value };
          items.push({
            ...config,
            url: config.url ?? `/${segments.join('/')}`,
            route,
          });
        }
      }
      route = route.children?.find(child => child.outlet === PRIMARY_OUTLET) ?? route.firstChild;
    }

    return items;
  }
}

function resolveLabelSource(label: SdBreadcrumbLabel, route?: ActivatedRouteSnapshot): MaybeAsync<string | null | undefined> {
  return typeof label === 'function' ? label(route) : label;
}

function isRouteConfig(value: SdBreadcrumbLabel | SdBreadcrumbRouteConfig): value is SdBreadcrumbRouteConfig {
  return typeof value === 'object' && value !== null && 'label' in value;
}

function normalizeMaxItems(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(3, Math.floor(parsed)) : 5;
}

function isModifiedMouseEvent(event: Event): boolean {
  return event instanceof MouseEvent && (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey);
}
