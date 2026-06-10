# User Guide — `<sd-org-chart>`

## Purpose

`<sd-org-chart>` renders a hierarchical organization chart for people, departments, teams, or reporting lines.

## Import

```ts
import { SdOrgChart, SdOrgChartItemDefDirective, SdOrgChartItem } from '@sdcorejs/angular/components/org-chart';
```

For most default usage, import `SdOrgChart`. Import `SdOrgChartItemDefDirective` when using `<ng-template sdOrgChartItemDef>`.

## Basic Usage

```html
<sd-org-chart [items]="items"></sd-org-chart>
```

```ts
const items: SdOrgChartItem[] = [
  {
    id: 'ceo',
    image: '/assets/amy.png',
    title: 'Amy Elsner',
    description: 'CEO',
    color: '#dfe6ff',
    children: [{ id: 'sales', title: 'Sales' }],
  },
];
```

## Custom Node Template

```html
<sd-org-chart [items]="items">
  <ng-template sdOrgChartItemDef let-item let-depth="depth" let-toggle="toggle">
    <button type="button" (click)="toggle()">{{ depth + 1 }} · {{ item.title }}</button>
  </ng-template>
</sd-org-chart>
```

## TemplateRef Input

```html
<ng-template #node let-item>
  <strong>{{ item.title }}</strong>
</ng-template>

<sd-org-chart [items]="items" [itemTemplate]="node"></sd-org-chart>
```

## AutoId

```html
<sd-org-chart [items]="items" autoId="team"></sd-org-chart>
```

Generated selectors:

- Host: `components-org-chart-team`
- Node card: `components-org-chart-team-node-ceo`
- Image: `components-org-chart-team-image-ceo`
- Title: `components-org-chart-team-title-ceo`
- Description: `components-org-chart-team-description-ceo`
- Toggle: `components-org-chart-team-toggle-ceo`

The last segment comes from `item.id` after replacing selector-unsafe characters with `-`.

## Coverage vs Request

- Default item fields: `id`, `image`, `title`, `description`, `color`.
- Tree children: `children`.
- Initial node state: `expanded`.
- Custom directive: `sdOrgChartItemDef`.
- TemplateRef input: `[itemTemplate]`.
- AutoId: host + default node parts + toggle.
- Selector: `sd-org-chart`.
- Location: `projects/sdcorejs-angular/components/org-chart`.
