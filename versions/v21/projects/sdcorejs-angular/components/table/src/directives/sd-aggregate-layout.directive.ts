import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectorRef,
  contentChildren,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Input,
} from '@angular/core';
import { MatFooterRowDef, MatTable } from '@angular/material/table';

/** Internal footer definition registered explicitly so dynamic rows retain their template order. */
@Directive({
  selector: '[sdTableFooterRowDef]',
})
export class SdTableFooterRowDefDirective extends MatFooterRowDef {
  @Input() set sdTableFooterRowDef(value: Iterable<string>) {
    this.columns = value;
  }
  @Input({ transform: booleanAttribute }) set sdTableFooterRowDefSticky(value: boolean) {
    this.sticky = value;
  }
}

/** Re-measure stacked sticky footers when a consumer template changes its actual height. */
@Directive({ selector: 'table[sdAggregateLayout]' })
export class SdAggregateLayoutDirective {
  readonly rows = contentChildren(SdTableFooterRowDefDirective, { descendants: true });
  constructor() {
    const element = inject<ElementRef<HTMLTableElement>>(ElementRef).nativeElement;
    const table = inject(MatTable);
    const destroy = inject(DestroyRef);
    const ref = inject(ChangeDetectorRef);
    let registered: readonly SdTableFooterRowDefDirective[] = [];
    // CDK 19 does not invalidate its footer outlet for late content-query additions.
    // Use its public registration API for both rows, preserving aggregate-before-footer order.
    effect(() => {
      const rows = this.rows();
      for (const row of registered) table.removeFooterRowDef(row);
      for (const row of rows) table.addFooterRowDef(row);
      registered = rows;
      ref.markForCheck();
    });
    destroy.onDestroy(() => registered.forEach(row => table.removeFooterRowDef(row)));
    let frame: number | undefined;
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined' || !element.tFoot) return;
      const observer = new ResizeObserver(() => {
        if (frame !== undefined) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          frame = undefined;
          table.updateStickyFooterRowStyles();
          table.updateStickyColumnStyles();
          ref.markForCheck();
        });
      });
      observer.observe(element.tFoot);
      destroy.onDestroy(() => {
        observer.disconnect();
        if (frame !== undefined) cancelAnimationFrame(frame);
      });
    });
  }
}
