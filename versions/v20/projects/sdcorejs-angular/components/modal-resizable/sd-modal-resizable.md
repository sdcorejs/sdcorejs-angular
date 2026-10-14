# sd-modal-resizable (deprecated alias)

Prefer [sd-window](../window/sd-window.md). The old import, `SdModalResizable` and selector remain compatible aliases of the exact same `SdWindow` component; there is no duplicate implementation or public service.

```ts
/** @deprecated Prefer SdWindow from components/window. */
import { SdModalResizable } from '@sdcorejs/angular/components/modal-resizable';
```

```html
<sd-modal-resizable #window width="480px" autoId="order">
  <span sdTitle>Order details</span>
  <div sdBody><p>Legacy content remains supported.</p></div>
  <sd-button sdFooterRight title="Close" (click)="window.close()" />
</sd-modal-resizable>
```

Existing `width`, `editable`, `editingChanged`, writable signals and all callable methods remain. `maximize()` and `toggleMaximum()` alias the preferred `restore()` and `toggleFullscreen()`. Old title/body/footer slots and CSS/token hooks remain. An explicit old selector keeps the `components-modal-resizable-` autoId prefix; direct dynamic construction defaults to the new Window prefix.

The optional additive `beforeClose` guard, `hideClose`, `windowClass`, `sdClosed`, `sdCloseError`, `requestClose()` and `forceClose()` follow Core Modal/Drawer conventions. With no guard, `close()` stays synchronous. Window remains nonmodal, with no backdrop, focus trap or page scroll lock.

[Canonical API, lifecycle, theme and full migration mapping](../window/sd-window.md). No old API is removed in this release; future removal requires an explicit breaking-release notice.

The standard npm build/prepack hooks retain the alias's TypeScript deprecation tag on Angular 19–22. Legacy imports from the root, `components` and this entry point produce TypeScript deprecation suggestion diagnostics while the canonical name stays unmarked. Both entry points keep the same class identity; editor hover text and presentation can vary. See the canonical documentation for raw `ng build`/watch packaging and SSR lifecycle behavior.
