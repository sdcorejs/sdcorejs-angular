�# `<sd-bar-chart>` / `<sd-line-chart>` / `<sd-pie-chart>` / `<sd-doughnut-chart>`

**Type**: Component family (4 separate components, one per chart type)
**Selectors**: `sd-bar-chart`, `sd-line-chart`, `sd-pie-chart`, `sd-doughnut-chart`
**Import path**: `@sdcorejs/angular/components/chart` (or barrel: `@sdcorejs/angular/components`)
**Classes**: `SdBarChartComponent`, `SdLineChartComponent`, `SdPieChartComponent`, `SdDoughnutChartComponent`
**Standalone**: yes
**Change detection**: `OnPush`
**Underlying engine**: [Chart.js](https://www.chartjs.org/) (all `registerables` registered)

## One-line purpose
Thin signal-based wrappers around Chart.js � render bar / line / pie / doughnut visualizations from declarative `data` / `options` / `plugins` inputs, with auto-update on signal changes.

## When to use
- Dashboards: KPI cards, time-series, breakdown by category
- Reports: monthly/quarterly comparisons, share-of-total
- Analytics widgets inside detail pages
- Any place a Chart.js chart fits � these wrappers don't add domain styling, they relay Chart.js config

## When NOT to use
- For sparkline / inline trend cells in tables � use a smaller dedicated component
- For non-Chart.js visualizations (D3, ECharts, mermaid) � use those libraries directly
- For numeric "stat tiles" without a graph � use a card + typography
- When data updates faster than ~10 fps � Chart.js redraw cost will dominate; consider canvas-level rendering

## Inputs (identical shape across all 4 charts; the generic chart-type changes)

### `<sd-bar-chart>`
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `data` | `ChartData<'bar'>` | (required) | Chart.js v4 bar dataset (`labels`, `datasets[]`). |
| `options` | `ChartOptions<'bar'>` | `undefined` | Chart.js options (scales, plugins, legend, tooltips, ⬦). |
| `plugins` | `Plugin<'bar'>[]` | `[]` | Chart.js plugins (chart-local; `Chart.register(...registerables)` is already called globally). |

### `<sd-line-chart>`
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `data` | `ChartData<'line'>` | (required) | Chart.js v4 line dataset. |
| `options` | `ChartOptions<'line'>` | `undefined` | Chart.js options. |
| `plugins` | `Plugin<'line'>[]` | `[]` | Chart-local plugins. |

### `<sd-pie-chart>`
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `data` | `ChartData<'pie'>` | (required) | Chart.js v4 pie dataset. |
| `options` | `ChartOptions<'pie'>` | `undefined` | Chart.js options. |
| `plugins` | `Plugin<'pie'>[]` | `[]` | Chart-local plugins. |

### `<sd-doughnut-chart>`
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `data` | `ChartData<'doughnut'>` | (required) | Chart.js v4 doughnut dataset. |
| `options` | `ChartOptions<'doughnut'>` | `undefined` | Chart.js options. |
| `plugins` | `Plugin<'doughnut'>[]` | `[]` | Chart-local plugins. |

## Outputs
None. To respond to user interaction, attach Chart.js plugins or pass `options.onClick` / `options.onHover` callbacks via `options`.

## Content projection (slots)
None � these are pure canvas wrappers.

## Behavior notes
- An internal `effect()` watches `data`/`options` signals and calls `chart.update()` on change (no destroy/recreate, so animations are smooth).
- The chart instance is created in `ngOnInit` and destroyed in `ngOnDestroy`.
- **Bar and line** add a horizontal-scroll wrapper when `data.labels.length > 15`: the inner div gets `min-width = labels.length * 50 px` and the outer wrapper gets `overflow-x: auto`. This avoids cramped axes on dense series.
- **Pie and doughnut** are 100% width / 100% height of their host � set the host's size via CSS.

## Visual cues
- **Bar**: vertical bars over a horizontal label axis; horizontally scrollable when many labels.
- **Line**: time-series line(s) with optional area fill (per Chart.js config); horizontally scrollable when many labels.
- **Pie**: full-circle slice diagram, 100%-of-total proportions.
- **Doughnut**: same as pie with a hollow center (good for a centered KPI label).
- All four obey `data.datasets[*].backgroundColor` / `borderColor` � colors come from the data, not the component.

## Examples

### 1. Monthly revenue bar chart
```ts
revenueData = signal<ChartData<'bar'>>({
  labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
  datasets: [{
    label: 'Doanh thu (tri�!u ��ng)',
    data: [120, 135, 110, 160, 180, 150],
    backgroundColor: '#3498db',
  }],
});
revenueOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' } },
};
```
```html
<div style="height: 320px;">
  <sd-bar-chart [data]="revenueData()" [options]="revenueOptions"></sd-bar-chart>
</div>
```

### 2. Multi-series line chart
```html
<div style="height: 280px;">
  <sd-line-chart [data]="trafficData()" [options]="trafficOptions"></sd-line-chart>
</div>
```

### 3. Pie chart for category breakdown
```ts
breakdownData = signal<ChartData<'pie'>>({
  labels: ['Sản phẩm A', 'Sản phẩm B', 'Sản phẩm C'],
  datasets: [{ data: [45, 30, 25], backgroundColor: ['#1abc9c', '#3498db', '#e67e22'] }],
});
```
```html
<div style="height: 240px; width: 240px;">
  <sd-pie-chart [data]="breakdownData()"></sd-pie-chart>
</div>
```

### 4. Doughnut KPI with center label (via plugin)
```html
<div style="height: 200px; width: 200px; position: relative;">
  <sd-doughnut-chart
    [data]="kpiData()"
    [options]="kpiOptions"
    [plugins]="[centerLabelPlugin]">
  </sd-doughnut-chart>
</div>
```

## Anti-patterns
- Forgetting to set a height on the host � Chart.js needs a sized container to render; `height: 0` produces a blank canvas
- Passing brand-new object references on every change-detection cycle for `options` � every change triggers `chart.update()`; memoize when possible
- Using these wrappers for fundamentally different chart types (radar, scatter, polar) without adding a corresponding component � these 4 selectors are typed to specific chart types
- Manually calling `Chart.register(...)` again � already registered at module load
- Putting these inside a `*ngIf` that toggles rapidly � destroys/recreates the canvas; consider keeping mounted and toggling visibility

## Related
- `<sd-card>` � common host for charts on a dashboard
- `<sd-tab>` � to switch between multiple chart views
- `<sd-page>` � page shell containing reporting dashboards

