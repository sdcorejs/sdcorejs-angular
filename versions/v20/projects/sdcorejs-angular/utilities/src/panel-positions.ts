import type { ConnectedPosition } from '@angular/cdk/overlay';

/** @internal Control popups sit 6px below their trigger and can flip vertically or horizontally near the viewport edge. */
export function ɵsdPanelPositions(align: 'start' | 'end'): ConnectedPosition[] {
  const opposite = align === 'start' ? 'end' : 'start';
  return [
    { originX: align, originY: 'bottom', overlayX: align, overlayY: 'top', offsetY: 6 },
    { originX: align, originY: 'top', overlayX: align, overlayY: 'bottom', offsetY: -6 },
    { originX: opposite, originY: 'bottom', overlayX: opposite, overlayY: 'top', offsetY: 6 },
    { originX: opposite, originY: 'top', overlayX: opposite, overlayY: 'bottom', offsetY: -6 },
  ];
}
