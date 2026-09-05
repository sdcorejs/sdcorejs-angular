# `<sd-modal>`

Centered dialog or bottom-sheet overlay opened imperatively through a template reference. Use it for confirmations, short forms, detail previews, and mobile-friendly action sheets.

## Import

```ts
import { SdModal } from '@sdcorejs/angular/components/modal';
```

## Inputs

| Name                   | Type                                            | Default     | Notes                                                                           |
| ---------------------- | ----------------------------------------------- | ----------- | ------------------------------------------------------------------------------- |
| `autoId`               | `string \| null \| undefined`                   | `undefined` | Renders `data-autoid="components-modal-<autoId>"` on the root template wrapper. |
| `title`                | `string`                                        | `''`        | Header title. Header renders when title is truthy.                              |
| `color`                | `Color` (`@sdcorejs/utils/models`)              | `'primary'` | Accepted and coerced (`null`/`undefined` → `'primary'`), but **currently has no visual effect** — nothing in the template or stylesheet reads it. Declared for a themed header that is not implemented yet; do not rely on it. |
| `width`                | `Size \| string`                                | `'md'`      | `Size` is `'sm' \| 'md' \| 'lg'` → `40vw` / `60vw` / `80vw`. Anything else is passed through as a raw CSS width (`'600px'`, `'90%'`). The resolver also recognises one extra literal outside `Size`, `'sx'` → `20vw` (spelled `sx`, not `xs`). On mobile the token mapping is skipped and the value is used verbatim. |
| `height`               | `string`                                        | `'auto'`    | Reserved for custom height.                                                     |
| `view`                 | `'dialog' \| 'bottom-sheet' \| undefined`       | `undefined` | `undefined` chooses dialog on desktop and bottom-sheet on mobile.               |
| `modalClass`           | `string \| string[] \| Record<string, boolean>` | `''`        | Extra Material panel class(es).                                                 |
| `lazyLoadContent`      | `boolean`                                       | `true`      | Renders projected content only after first open.                                |
| `hideClose`            | `boolean`                                       | `false`     | Hides the built-in close button. Bare attribute = true.                         |
| `disableBackdropClose` | `boolean`                                       | `true`      | Prevents backdrop/ESC close. Bare attribute = true.                             |
| `beforeClose`          | `SdModalBeforeClose \| undefined`               | `undefined` | Optional sync/async guard. Only `true` closes; errors fail closed.              |

## Outputs

| Name           | Type      | Notes                                                            |
| -------------- | --------- | ---------------------------------------------------------------- |
| `sdClosed`     | `void`    | Emitted after the Material dialog/bottom-sheet finishes closing — **including the destroy path**, where it is emitted synchronously (see Lifecycle). Emitted at most once per open. |
| `sdCloseError` | `unknown` | Emitted when `beforeClose` throws or rejects.                    |

## Slots

| Selector          | Where it renders                                    |
| ----------------- | --------------------------------------------------- |
| `[sdHeaderLeft]`  | Header left. Replaces the fallback title cell.      |
| `[sdHeaderRight]` | Header right, before the close button.              |
| (default)         | Scrollable body/content. Padding is `0` by default. |
| `[sdFooterLeft]`  | Footer left action group.                           |
| `[sdFooterRight]` | Footer right action group.                          |

Header/footer padding is `16px`. Body padding is `0`; add your own body wrapper when content needs spacing. The footer is hidden when both footer slots are empty.

## Public API

| Method           | Notes                                                                          |
| ---------------- | ------------------------------------------------------------------------------ |
| `open()`         | Opens the dialog or bottom-sheet. No-op when already open.                     |
| `close()`        | Closes the active dialog/bottom-sheet ref.                                     |
| `requestClose()` | Runs/coalesces `beforeClose`, closes when allowed, and resolves to the result. |
| `forceClose()`   | Bypasses `beforeClose`; reserve for successful save/discard workflows.         |

## Lifecycle

The dialog / bottom-sheet opens into the CDK overlay container on `<body>`, **outside** the host view. Destroying `<sd-modal>` while it is open — route change, `@if` removing the branch, parent list re-render — therefore does **not** remove the overlay on its own.

`<sd-modal>` closes its own overlay on destroy: the active `MatDialogRef` / `MatBottomSheetRef` is force-closed from `ngOnDestroy`, so no orphaned panel or backdrop is left blocking the page.

`(sdClosed)` **does** fire on this path, and it fires **synchronously**, before the overlay is force-closed. `isOpened()` flips back to `false` at the same moment. This matters because the normal emit path rides on `afterClosed()` / `afterDismissed()`, which are asynchronous — by the time they emit, the component's `takeUntilDestroyed` subscription is already gone. Emitting up front keeps consumers that clean up on `(sdClosed)` (unlock a form, cancel an in-flight request, restore a tab) working when the host is torn down while the modal is open. The emit is idempotent: if the Material ref still manages to emit afterwards, `sdClosed` does not fire twice.

Two implementation constraints are load-bearing here, so do not "simplify" them: the hook must be `ngOnDestroy` (Angular runs lifecycle destroy hooks **before** any `DestroyRef.onDestroy` callback, and `output()` registers its own `DestroyRef.onDestroy` at field-initialization time — a callback registered in the constructor would run after the emitter is already marked destroyed and `emit()` would be a no-op), and the emit must precede `forceClose()`.

`beforeClose` is **not** consulted on this path. Teardown has already happened and cannot be vetoed; a guard that returns `false` would only strand the overlay. Run confirmation flows before destroying the host (e.g. in a route guard), not from `beforeClose`.

## Examples

```html
<sd-button title="Open" type="fill" color="primary" (click)="modal.open()"></sd-button>

<sd-modal #modal title="Customer detail" width="md">
  <div class="modal-body">
    <sd-section icon="person" title="Profile">
      <sd-section-item label="Name">Nguyen Van An</sd-section-item>
      <sd-section-item label="Email">an.nv@onemount.com</sd-section-item>
    </sd-section>
  </div>

  <sd-button sdFooterRight type="fill" color="primary" title="Close" (click)="modal.close()"></sd-button>
</sd-modal>
```

```html
<sd-modal #sheet title="Pick a delivery time" view="bottom-sheet" width="100%">
  <div class="sheet-body">
    <!-- action rows / form controls -->
  </div>

  <sd-button sdFooterLeft type="text" title="Cancel" (click)="sheet.close()"></sd-button>
  <sd-button sdFooterRight type="fill" color="primary" title="Confirm" (click)="sheet.close()"></sd-button>
</sd-modal>
```

## Accessibility

- `<sd-modal>` uses `ViewEncapsulation.None`, so its stylesheet is **global**. The rule `.sd-modal-root button:focus { outline: none !important }` therefore stripped the focus ring from every consumer-projected button inside any modal, and `!important` meant consumers could not win it back. A matching `.sd-modal-root button:focus-visible { outline: 2px solid var(--sd-primary) !important }` now restores a visible ring for keyboard navigation while mouse clicks stay borderless.
- The built-in close button already had its own `:focus-visible` ring; it is unchanged.

The real dialog/bottom-sheet container is associated with its visible heading using a unique `aria-labelledby` target. The accessible name follows title changes while the overlay is open, including projected header-left content.
