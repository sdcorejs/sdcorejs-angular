# sd-window

Nonmodal record window docked to the inline end of the viewport. Use it for inspectors and comparing records while the page remains interactive and scrollable. Use [SdModal](../modal/sd-modal.md) for blocking dialogs, or [SdSideDrawer](../side-drawer/sd-side-drawer.md) for a backdrop-based detail panel. Window supports minimize, restore and fullscreen; it has no drag or pointer-resize handles and no public window service.

```ts
import { SdWindow, type SdWindowBeforeClose } from '@sdcorejs/angular/components/window';
import { SdButton } from '@sdcorejs/angular/components/button';
```

```html
<sd-button title="Open details" (click)="window.open()" />
<sd-window #window title="Order details" width="480px" autoId="order"
  [beforeClose]="confirmClose" (sdClosed)="onClosed()" (sdCloseError)="showCloseError($event)">
  <p>Record details</p>
  <sd-button sdFooterLeft size="sm" type="text" title="Close" (click)="window.close()" />
  <sd-button sdFooterRight size="sm" type="fill" title="Save" (click)="saveThenForceClose()" />
</sd-window>
```

`confirmClose: SdWindowBeforeClose` has the same `() => boolean | Promise<boolean>` shape as Modal/Drawer. Consumer owns form validation, saving, disabled states, error presentation and request cancellation. Call `forceClose()` after a successful save/discard when bypassing the guard is intentional.

## Inputs

| Input | Type | Default | Contract |
| --- | --- | --- | --- |
| `title` | `string \| null \| undefined` | `''` | Fallback when a title/header slot is absent; empty uses the localized Details label. |
| `width` | `string \| null \| undefined` | `'480px'` | Requested CSS width, clamped to the visible viewport. Changes while open and restores after fullscreen. Null/undefined use the default. |
| `hideClose` | `boolean`, bare attribute supported | `false` | Hides the built-in X only; programmatic close and opt-in Escape remain available. |
| `beforeClose` | `SdWindowBeforeClose \| undefined` | `undefined` | Optional asynchronous dismissal guard. Only literal `true` permits close. |
| `windowClass` | `string \| string[] \| Record<string, boolean> \| null \| undefined` | `''` | Classes on the portal window root, following Modal's class-option shape. Avoid reserved lifecycle classes. |
| `disableEscapeClose` | `boolean`, bare attribute supported | `true` | Escape dismissal is opt-in; consumed events, IME composition and expanded inline comboboxes are respected. |
| `ariaDescribedBy` | `string \| undefined` | `undefined` | Optional ID of a concise description in the document. |
| `autoId` | `string \| null \| undefined` | `undefined` | Root prefix `components-window-`; explicit legacy selector hosts retain `components-modal-resizable-`. |
| `editable` | `boolean`, bare attribute supported | `false` | Retained legacy consumer metadata; no built-in edit toolbar. |

## Outputs and methods

| API | Contract |
| --- | --- |
| `sdClosed: void` | Once per real opening, after focus/state/loading/layout cleanup; also on host destruction. Does not fire for never-opened/repeatedly closed hosts. A handler may reopen. |
| `sdCloseError: unknown` | Current guard errors fail closed and are delivered for consumer presentation. Stale/destroyed openings emit no error. |
| `editingChanged: boolean` | Retained; emits the new state when `toggleEditable()` is called. |
| `open(): void` | Opens and captures the opener. Calling again selects the existing window without resetting modes or replacing the original opener. |
| `close(): void` | Synchronous when no guard is configured; otherwise starts/coalesces `requestClose()`. Same Core signature as Modal/Drawer. |
| `requestClose(): Promise<boolean>` | Guard dismissal decision, not a business result payload. Resolves false when already closed/destroyed, denied, stale or rejected. Pending requests coalesce per opening. |
| `forceClose(): void` | Bypasses the guard and resets modes/releases loading. Invalidates old requests so they cannot close a newly opened window. |
| `minimize() / restore()` | Collapse to the header and restore the existing fullscreen/normal mode. Minimize keeps outside page focus clear of the strip; restore selects/focuses an open window when called from outside. |
| `toggleFullscreen()` | Toggle fullscreen within viewport gutters and select/focus an open window when called from outside. |
| `startLoading() / stopLoading()` | Manage only the owned `SdLoadingRef`; body/footer inert, header available. Pre-open loading queues until body attachment. |

`isMinimized` and `isFullscreen` are readonly signals. Existing writable `isOpened`, `isLoading`, `isMinimum`, `isMaximum`, `isEditing` and `isHover` remain writable for compatibility; prefer lifecycle methods over direct writes. Existing `id`, `portal`, `onFocus()`, `onBlur()` and `toggleEditable()` remain available. `dataOpened`/`dataLoading` expose Core string data flags on the root.

## Slots

| Slot | Region |
| --- | --- |
| `[sdHeaderLeft]` | Projected title/header text; takes precedence over `title`. Supply a meaningful accessible name. |
| `[sdHeaderRight]` | Additional compact Core toolbar actions before the built-in controls. |
| Unselected content | Scrollable body with 16px token padding, matching the projection convention of Modal/Drawer. |
| `[sdFooterLeft]` | Secondary actions. |
| `[sdFooterRight]` | One primary action with optional secondary actions. |
| `[sdTitle]` / `[sdBody]` | Retained legacy projection aliases. Supply one title/header slot, not both. |

Header/footer stay outside body scrolling. Empty footer is hidden; populated groups wrap with 12px/16px padding, 8px gaps and bottom safe-area support. Use Core `SdButton`; small toolbar buttons remain keyboard operable.

## Nonmodal accessibility and lifecycle

The named root has `role="dialog"` and `aria-modal="false"`. Open focuses the window; Tab may return to the page. No backdrop, trap or page scroll lock is added; consequently there is no `disableBackdropClose`, `view`, `container` or dialog-size-preset option. Height follows the docked viewport layout, rather than Modal's auto-height API.

Close restores the opener only while focus belongs to this window. Loading/minimize move focus to the header before blocking content. Localized polite loading status lives outside inert/busy content. Pointer/focus selects overlapping windows; hover does not raise them over keyboard focus. Windows covering page focus minimize, preserving fullscreen mode; strips move to the opposite edge only when it clears that point. Native resize rechecks existing page focus.

Widths fit an 8px visible-viewport gutter, including scrollbar accounting; minimized strips cap at 300px. Overflow stacks overlap within the viewport. Layout follows document RTL and reduced motion. Portals live under `document.body`; put shared theme/direction at document/body scope. Browser work uses injected DOCUMENT in `afterNextRender`, which does not run during server rendering. SSR renders the component hosts without the window body portal; content attaches on the client. Server lifecycle methods and application destruction are verified on Angular 19–22. This does not promise prerendered window content or full application hydration coverage. Emulated browser touch, native screen readers and physical devices are separate verification environments.

## Surface and compatibility hooks

Window/Modal/Drawer default to `--sd-overlay-surface → --sd-surface`: near-white `#fdfbff` in default light mode, `#121316` in default dark mode. They do not force white chrome or redefine `--sd-white`. Each overlay keeps its component surface override.

Canonical Window hooks are intentionally unset globally so inherited aliases cannot mask local overrides:
- `--sd-window-surface`: root/body/footer and default header.
- `--sd-window-header-bg`: optional separate header surface.
- `--sd-window-text` / `--sd-window-border`: text/boundary overrides.

Existing `--sd-modal-resizable-bg/header-bg/title/divider` hooks and DOM classes remain. Header precedence is modern header → modern surface → legacy header → legacy body → shared surface. Legacy body/header overrides stay independent unless the modern surface is supplied. Put shared palette/overlay overrides at the same document/theme scope that emits `sd.theme()`; inherited legacy token values have already resolved there. For individual windows, use the modern or legacy Window hooks directly. `--sd-modal-resizable-top` retains the normal top-offset hook.

## Deprecated aliases and migration

| Before | Preferred |
| --- | --- |
| `SdModalResizable` from `components/modal-resizable` | `SdWindow` from `components/window` |
| `<sd-modal-resizable>` | `<sd-window>` |
| `maximize()` | `restore()` |
| `toggleMaximum()` | `toggleFullscreen()` |
| `isMinimum / isMaximum` | Readonly `isMinimized / isFullscreen` |
| `[sdTitle] / [sdBody]` | `[sdHeaderLeft]` / unselected body |

Old component/import/selector and methods remain deprecated aliases, with the exact same class identity. No consumer imports/selectors are rewritten. Direct dynamic construction has no legacy-selector context and uses the new autoId prefix; the autoId input itself was additive. Removal requires a separately documented breaking release. `sd-window` names the nonmodal/minimizable surface more precisely than `sd-dialog`; its ARIA dialog role remains valid.

The alias has a source TypeScript `@deprecated` tag. Standard workspace `npm run build`, `npm run pack` and `npm run build-pack` lifecycle hooks restore this tag when declaration flattening drops it, on Angular 19–22. The bounded annotation changes only alias JSDoc, preserving JavaScript, class identity and type signatures. TypeScript suggestion diagnostics mark legacy aliases imported from the root, `components` and `components/modal-resizable` routes as deprecated; the canonical `SdWindow` remains unmarked. Editor hover text and visual rendering depend on the editor. Raw `ng build`, watch commands or direct packing inside `dist` bypass the workspace hooks; run the standard build/pack script, or `node ../../scripts/annotate-window-deprecation.mjs` from the owning version workspace, before packaging their output.

The new `disableEscapeClose` input has an explicit `boolean | ''` write type and boolean attribute transform, consistent with Core overlays. Strict Angular templates reject invalid object bindings. Its default and runtime behavior are unchanged; the type tightening applies to this unreleased additive input.
