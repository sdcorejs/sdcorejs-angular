# `<sd-modal-resizable>`

Right-docked, non-modal panel that can be minimized, expanded, or pushed fullscreen. Several panels stack side by side along the right edge of the viewport, so the user can keep multiple records open at once while still working with the page behind them.

Use it for side-by-side comparison / inspector workflows. Use `<sd-modal>` when the task is blocking, and `<sd-side-drawer>` when a single overlay with a backdrop is enough.

## Import

```ts
import { SdModalResizable } from '@sdcorejs/angular/components/modal-resizable';
```

## Inputs

| Name       | Type      | Default   | Notes                                                     |
| ---------- | --------- | --------- | --------------------------------------------------------- |
| `editable` | `boolean` | `false`   | Marks the panel as editable. Bare attribute = true.       |
| `width`    | `string`  | `'480px'` | CSS width used while the panel is expanded (not minimum). |

## Outputs

| Name             | Type      | Notes                                       |
| ---------------- | --------- | ------------------------------------------- |
| `editingChanged` | `boolean` | Emitted by `toggleEditable()` with the new editing state. |

## Slots

| Selector          | Where it renders          |
| ----------------- | ------------------------- |
| `[sdTitle]`       | Header title area.        |
| `[sdBody]`        | Scrollable content area.  |
| `[sdFooterLeft]`  | Footer left action group. |
| `[sdFooterRight]` | Footer right action group. |

Header, body and footer only render while the panel is open.

## Public API

| Member                          | Notes                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `open()`                        | Opens the panel, captures its rendered width, and expands it.                    |
| `close()`                       | Collapses the panel to zero width and stops loading.                             |
| `minimize()` / `maximize()`     | Switches between the 300px minimum strip and the expanded width.                 |
| `toggleMaximum()`               | Toggles fullscreen (`calc(100% - 16px)`).                                        |
| `toggleEditable()`              | Flips `isEditing` and emits `editingChanged`.                                     |
| `startLoading()` / `stopLoading()` | Drives the scoped loading overlay through `SdLoadingService`.                  |
| `onFocus()` / `onBlur()`        | Hover state hooks bound in the template.                                          |
| `id`                            | Generated DOM id of the panel element (`I<uuid>`).                                |
| `isOpened` / `isMinimum` / `isMaximum` / `isLoading` / `isEditing` / `isHover` | Read-only-ish signals reflecting panel state. |

## Panel stacking

The panel is portalled onto `document.body` (via `CdkPortal` + `DomPortalOutlet`), so laying panels out is a concern shared by all live instances rather than by a single view.

Arrangement is scoped through the root-provided `SdModalResizableRegistry`: each `<sd-modal-resizable>` registers its panel id on construction and unregisters it on destroy. `open`, `close`, `minimize`, `maximize` and `toggleMaximum` re-run the arrangement and rewrite inline `width` / `right` **only on registered, still-mounted panels**, in registration order.

Consequences worth knowing:

- Markup of your own that happens to carry the `.modal-resizable` class is **not** touched. (Earlier builds ran `document.querySelectorAll('.modal-resizable')` and rewrote every match in the document.)
- A destroyed panel immediately stops taking up a slot for the instances that outlive it.
- Panels marked `c-closed`, and expanded panels with no captured `data-width`, are skipped by the layout pass.

## Lifecycle / teardown

`open()`, `close()` and the arrangement pass each schedule a short `setTimeout` (100ms / 100ms / 200ms) that mutates DOM. All of them are tracked and cleared in `DestroyRef.onDestroy`, together with unregistering from the registry and destroying the portal view. Destroying the component mid-animation cannot run layout work against a detached panel.

## Example

```html
<sd-button title="Open detail" type="fill" color="primary" (click)="panel.open()"></sd-button>

<sd-modal-resizable #panel width="520px">
  <span sdTitle>Đơn hàng #1024</span>

  <div sdBody class="panel-body">
    <sd-section icon="receipt" title="Thông tin chung">
      <sd-section-item label="Khách hàng">Nguyen Van An</sd-section-item>
    </sd-section>
  </div>

  <sd-button sdFooterRight type="text" title="Đóng" (click)="panel.close()"></sd-button>
</sd-modal-resizable>
```

## Anti-patterns

- ❌ Rendering `<sd-modal-resizable>` inside a scroll container and expecting it to be clipped — it lives on `<body>`.
- ❌ Reusing the `.modal-resizable` class on your own elements to "join" the stack; register a real component instead.
- ❌ Writing inline `width` / `right` on a panel yourself — the next arrangement pass overwrites both.

## Tests

- `src/modal-resizable.component.spec.ts` — portal attach, open/close/minimize/maximize math, loading, editing, **timer teardown**, **registry scoping**.
- Run: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/modal-resizable/src/modal-resizable.component.spec.ts'`

## Related

- `<sd-modal>` — blocking dialog / bottom-sheet.
- `<sd-side-drawer>` — single right-side overlay with a body scroll lock.
- `SdLoadingService` (`@sdcorejs/angular/services`) — powers `startLoading()` / `stopLoading()`.
