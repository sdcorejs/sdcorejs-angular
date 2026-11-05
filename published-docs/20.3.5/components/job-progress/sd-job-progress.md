# `<sd-job-progress>`

**Type:** standalone component
**Selector:** `sd-job-progress`
**Import path:** `@sdcorejs/angular/components/job-progress`
**Class:** `SdJobProgress`
**Change detection:** `OnPush`

## Purpose

Present long-running work consistently without coupling UI copy to a polling endpoint, queue provider or SSE backend. The component accepts either a direct `SdTaskState` or a `taskId` registered in `SdTaskService`.

## Inputs

| Name          | Type                              | Default       | Notes                                               |
| ------------- | --------------------------------- | ------------- | --------------------------------------------------- |
| `taskId`      | `string \| undefined`             | `undefined`   | Resolves a live task from `SdTaskService`.          |
| `state`       | `SdTaskState \| undefined`        | `undefined`   | Direct state; takes precedence over `taskId` state. |
| `mode`        | `'bar' \| 'compact' \| 'details'` | `'bar'`       | Details mode exposes the task message.              |
| `title`       | `string \| undefined`             | state title   | Presentation override.                              |
| `message`     | `string \| undefined`             | state message | Presentation override.                              |
| `showActions` | `boolean`                         | `true`        | Hides cancel/retry actions when false.              |

## Outputs

| Name       | Type   | Notes                                                                                                |
| ---------- | ------ | ---------------------------------------------------------------------------------------------------- |
| `sdCancel` | `void` | Emitted after a cancel click; registry cancellation is delegated automatically when `taskId` exists. |
| `sdRetry`  | `void` | Emitted after a retry click; registry retry is delegated automatically when `taskId` exists.         |

## Usage

```html
<sd-job-progress taskId="export-42" mode="details" (sdCancel)="trackCancel()"></sd-job-progress>

<sd-job-progress
  [state]="{ id: 'preview', status: 'running', progress: 60, title: 'Preparing preview' }"
  mode="compact"
  (sdCancel)="cancelPreview()"></sd-job-progress>
```

With direct state, outputs let the host own actions. With `taskId`, the component delegates to `SdTaskService` and still emits the output for analytics or host-side effects.

## Accessibility and responsive behavior

Active/determinate states expose a semantic `progressbar` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and a localized label. Indeterminate work omits `aria-valuenow`. Errors use `role="alert"`; the host is a polite live region; actions are native buttons.

The compact layout keeps identity and progress on one row and lets errors/actions span the row. The component uses CSS custom properties for surface, border, text, primary, track and error colors. Reduced-motion preference removes indeterminate animation and width transitions.
