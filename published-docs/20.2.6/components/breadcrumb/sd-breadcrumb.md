# `<sd-breadcrumb>`

**Type**: standalone component
**Selector**: `sd-breadcrumb`
**Import path**: `@sdcorejs/angular/components/breadcrumb`
**Class**: `SdBreadcrumb`
**Change detection**: `OnPush`

## Purpose

Render an accessible breadcrumb from explicit items or the active primary router chain. Labels may be synchronous, promises, observables, or route-aware resolver functions.

## Inputs

| Name        | Type                                  | Default         | Notes                                                                                   |
| ----------- | ------------------------------------- | --------------- | --------------------------------------------------------------------------------------- |
| `items`     | `readonly SdBreadcrumbItem[] \| null` | `undefined`     | Explicit/manual trail. When omitted, route mode reads `route.data.breadcrumb`.          |
| `maxItems`  | `number`                              | `5`             | Minimum effective value is 3. Long trails retain the first item and the newest context. |
| `ariaLabel` | `string`                              | `Breadcrumb`    | Accessible name for the native `nav`.                                                   |
| `separator` | `string`                              | `chevron_right` | Icon name used between entries.                                                         |

`SdBreadcrumbItem` supports `label`, `url`, `icon`, `fontSet`, `disabled`, and `clickable`. A `url` string renders a native link. Router command arrays and action-only items render native buttons, preserving keyboard behavior.

## Output

| Name             | Type               | Notes                                                                            |
| ---------------- | ------------------ | -------------------------------------------------------------------------------- |
| `sdItemActivate` | `SdBreadcrumbItem` | Emitted for enabled link or button activation before optional router navigation. |

## Manual usage

```ts
readonly trail: SdBreadcrumbItem[] = [
  { label: 'Home', icon: 'home', url: '/' },
  { label: 'Orders', url: ['/orders'] },
  { label: orderName$ },
];
```

```html
<sd-breadcrumb [items]="trail" [maxItems]="4"></sd-breadcrumb>
```

## Router mode

Omit `items` and add breadcrumb data to primary routes:

```ts
{
  path: ':id',
  component: OrderPage,
  data: {
    breadcrumb: (route: ActivatedRouteSnapshot) => loadOrderName(route.paramMap.get('id')),
  },
}
```

Route data may also be `{ label, icon, url, disabled, clickable }`. Router labels are rebuilt after `NavigationEnd`; explicit manual labels are not restarted by unrelated navigation.

## Custom item template

```html
<sd-breadcrumb [items]="trail">
  <ng-template let-item>
    <strong>{{ item.label }}</strong>
  </ng-template>
</sd-breadcrumb>
```

The context exposes both `$implicit` and `item` as `SdBreadcrumbResolvedItem`.

## Accessibility

The component renders native `nav`, `ol`, anchors, and buttons. The current item receives `aria-current="page"`; disabled items are non-interactive with `aria-disabled="true"`. Icons and separators are hidden from assistive technology.
