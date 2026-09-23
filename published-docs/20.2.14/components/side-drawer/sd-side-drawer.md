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

Header and footer use a white background (`--sd-white`, default `#fff`) and compact 12px vertical / 16px horizontal padding. Body content uses `padding: 12px 16px` on desktop and mobile, giving it its own top and bottom spacing within the separate body surface. Body content scrolls, while the footer remains available and wraps on narrow screens. The footer is hidden when both footer slots are empty.

## Public API

| Method           | Notes                                                                          |
| ---------------- | ------------------------------------------------------------------------------ |
| `open()`         | Opens the drawer and locks background body scroll.                             |
| `close()`        | Closes the drawer, emits `sdClosed`, stops loading, and restores body scroll.  |
| `requestClose()` | Runs/coalesces `beforeClose`, closes when allowed, and resolves to the result. |
| `forceClose()`   | Bypasses `beforeClose`; reserve for successful save/discard workflows.         |
| `startLoading()` | Starts the loading overlay inside the drawer.                                  |
| `stopLoading()`  | Stops the loading overlay.                                                     |

## Body scroll lock

While a drawer is open, page scroll is locked by setting `document.body.style.overflow = 'hidden'`.

The lock is **ref-counted and shared across every `<sd-side-drawer>` instance** (root-provided `SdBodyScrollLockService`), so stacked drawers behave correctly:

- The first drawer to open records the app's previous `overflow` value and applies the lock.
- Further drawers only bump the counter — the DOM is not touched again.
- Closing a drawer only restores `overflow` when it is the **last** one holding a lock. Close order does not matter: closing the outer drawer first keeps the page locked while an inner drawer is still open, and the original value (not `hidden`) is restored at the end.
- Destroying a drawer while it is open releases its lock too, so teardown can never strand the page in a permanently unscrollable state.
- `open()` / `close()` are idempotent per instance — repeated calls cannot unbalance the counter.

Do not write `document.body.style.overflow` yourself while a drawer is open; the value is restored from the snapshot taken at the first lock.

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
  padding: 0; // The drawer supplies the content insets.
}
```

## Accessibility

- The drawer root is a labelled modal: `role="dialog"`, `aria-modal="true"`, `aria-label` bound to `title`.
- **Escape closes the drawer** (new). Previously "click the backdrop" was the only dismissal besides the close button, and it had no keyboard equivalent at all. Escape is gated on the same `disableBackdropClose` flag: with `[disableBackdropClose]="true"` neither the backdrop click nor Escape dismisses the drawer.
- The backdrop declares `role="presentation"` instead of `aria-hidden="true"` — it is a decorative click-catcher with no content, and `role="presentation"` is the accurate signal for that.
- The close button uses an i18n `aria-label` (`core.common.close`, previously the hard-coded English string `"Close"`) and keeps a `:focus-visible` ring.

## Focus and responsive presentation

Each open creates a CDK focus trap around the drawer content. Focus moves inside, Tab/Shift+Tab cycle within it, and closing/destroying the content restores the opener. A rejected beforeClose guard keeps the content and focus trap active. Escape/backdrop behavior still follows disableBackdropClose and beforeClose.

Opening makes the drawer visible immediately so focus can enter before the slide/fade animation finishes. Closing delays the hidden state until that animation completes. Reduced motion removes these transitions.

The default radius is 8px, overridable through --sd-overlay-radius. Header/footer use 12px vertical padding and header/body/footer align at 16px horizontally; the body scrolls while footer actions remain available. Close/actions are at least 44px on mobile, footer groups wrap, and reduced motion is enforced by the component itself.
