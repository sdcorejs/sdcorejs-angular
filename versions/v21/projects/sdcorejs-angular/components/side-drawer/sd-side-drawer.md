# `<sd-side-drawer>`

Right-edge slide-in panel rendered into `document.body` via CDK Portal. Use it for create/edit/detail/filter workflows that need more room than a modal without leaving the current page.

## Import

```ts
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
```

## Inputs

| Name                   | Type                                   | Default     | Notes                                                                   |
| ---------------------- | -------------------------------------- | ----------- | ----------------------------------------------------------------------- |
| `title`                | `string`                               | `''`        | Fallback header title when `[sdHeaderLeft]` is not projected.           |
| `width`                | `string`                               | `'480px'`   | CSS width such as `'560px'`, `'40vw'`, or `'100%'`.                     |
| `hideClose`            | `boolean`                              | `false`     | Hides the built-in close button. Bare attribute = true.                 |
| `disableBackdropClose` | `boolean`                              | `false`     | Prevents backdrop click from closing the drawer. Bare attribute = true. |
| `drawerClass`          | `any`                                  | `''`        | Extra class(es) bound to the root drawer element through `ngClass`.     |
| `autoId`               | `string \| null \| undefined`          | `undefined` | Renders `data-autoid="components-side-drawer-<autoId>"`.                |
| `beforeClose`          | `SdSideDrawerBeforeClose \| undefined` | `undefined` | Optional sync/async guard. Only `true` closes; errors fail closed.      |

## Outputs

| Name           | Type      | Notes                                         |
| -------------- | --------- | --------------------------------------------- |
| `sdClosed`     | `void`    | Emitted after the drawer closes.              |
| `sdCloseError` | `unknown` | Emitted when `beforeClose` throws or rejects. |

## Slots

| Selector          | Where it renders                                    |
| ----------------- | --------------------------------------------------- |
| `[sdHeaderLeft]`  | Header left. Replaces the fallback `title`.         |
| `[sdHeaderRight]` | Header right, before the close button.              |
| (default)         | Scrollable body/content. Padding is `0` by default. |
| `[sdFooterLeft]`  | Footer left action group.                           |
| `[sdFooterRight]` | Footer right action group.                          |

Header/footer padding is `16px`. Body padding is `0`; add your own wrapper when content needs spacing. The footer is hidden when both footer slots are empty.

## Public API

| Method           | Notes                                                                          |
| ---------------- | ------------------------------------------------------------------------------ |
| `open()`         | Opens the drawer and locks background body scroll.                             |
| `close()`        | Closes the drawer, emits `sdClosed`, stops loading, and restores body scroll.  |
| `requestClose()` | Runs/coalesces `beforeClose`, closes when allowed, and resolves to the result. |
| `forceClose()`   | Bypasses `beforeClose`; reserve for successful save/discard workflows.         |
| `startLoading()` | Starts the loading overlay inside the drawer.                                  |
| `stopLoading()`  | Stops the loading overlay.                                                     |

## Example

```html
<sd-button title="Create" type="fill" color="primary" prefixIcon="add" (click)="drawer.open()"></sd-button>

<sd-side-drawer #drawer title="Create employee" width="560px">
  <div class="drawer-body">
    <sd-section icon="person" title="Personal info">
      <sd-section-item label="Name">Nguyen Van An</sd-section-item>
      <sd-section-item label="Email">an.nv@onemount.com</sd-section-item>
    </sd-section>
  </div>

  <sd-button sdFooterLeft type="text" title="Reset"></sd-button>
  <sd-button sdFooterRight type="text" title="Cancel" (click)="drawer.close()"></sd-button>
  <sd-button sdFooterRight type="fill" color="primary" title="Save" (click)="save(); drawer.close()"></sd-button>
</sd-side-drawer>
```

```scss
.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}
```
