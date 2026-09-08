# `<sd-data-state>`

**Type**: standalone component
**Selector**: `sd-data-state`
**Import path**: `@sdcorejs/angular/components/data-state`
**Class**: `SdDataState`
**Change detection**: `OnPush`

## Purpose

Provide a consistent presentation for `loading`, `empty`, `error`, and `forbidden` states while allowing successful content to pass through without a presentation wrapper.

## Inputs

| Name          | Type                                                | Default        | Notes                                                                        |
| ------------- | --------------------------------------------------- | -------------- | ---------------------------------------------------------------------------- |
| `state`       | `loading \| empty \| error \| forbidden \| success` | `success`      | Current data state.                                                          |
| `title`       | `string \| null`                                    | locale default | Empty string intentionally hides the default title.                          |
| `message`     | `string \| null`                                    | locale default | Empty string intentionally hides the default message.                        |
| `icon`        | `string \| null`                                    | state default  | Pass an empty string to hide the icon; null/undefined use the state default. |
| `fontSet`     | `SdIconSet`                                         | inherited      | Icon font set.                                                               |
| `retryable`   | `boolean`                                           | `false`        | Shows the retry button.                                                      |
| `retryLabel`  | `string \| null`                                    | locale default | Retry button label.                                                          |
| `actionLabel` | `string \| null`                                    | `undefined`    | Shows a secondary action when non-empty.                                     |
| `compact`     | `boolean`                                           | `false`        | Reduces minimum height and spacing.                                          |
| `fullPage`    | `boolean`                                           | `false`        | Uses viewport-height presentation.                                           |

## Outputs

| Name       | Type   | Notes                                                            |
| ---------- | ------ | ---------------------------------------------------------------- |
| `sdRetry`  | `void` | Emitted by the native retry button or custom template callback.  |
| `sdAction` | `void` | Emitted by the native action button or custom template callback. |

## Default and success usage

```html
<sd-data-state state="loading" compact></sd-data-state>
<sd-data-state state="error" retryable actionLabel="Open logs" (sdRetry)="reload()" (sdAction)="openLogs()"></sd-data-state>

<sd-data-state state="success">
  <app-orders-table></app-orders-table>
</sd-data-state>
```

The success branch projects content directly; it does not add `.sd-data-state` around the application content.

## Custom template

Import `SdDataStateTemplateDirective` and use the `state`, `retry`, and `action` context members:

```html
<sd-data-state state="empty" (sdAction)="createOrder()">
  <ng-template sdDataStateTemplate let-state let-action="action">
    <p>No matching orders ({{ state }}).</p>
    <button type="button" (click)="action()">Create order</button>
  </ng-template>
</sd-data-state>
```

## Accessibility

Error and forbidden defaults use `role="alert"` with assertive live announcements. Loading and empty defaults use `role="status"`; loading also exposes `aria-busy="true"`. Actions are native buttons with visible labels. Loading animation is removed when the user prefers reduced motion.

This UI component is separate from `@sdcorejs/angular/utilities/data-state`, which contains data-state utilities rather than presentation.
