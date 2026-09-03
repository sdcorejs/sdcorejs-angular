import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Directive, TemplateRef, computed, contentChild, inject, input } from '@angular/core';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdAuditDiffOptions, SdAuditDiffRow, SdAuditDiffSide, sdBuildAuditDiff } from './audit-diff.engine';

export type SdAuditDiffMode = 'table' | 'detail-list';

export interface SdAuditDiffValueTemplateContext {
  readonly $implicit: unknown;
  readonly row: SdAuditDiffRow;
  readonly side: SdAuditDiffSide;
}

@Directive({
  selector: 'ng-template[sdAuditDiffValue]',
  standalone: true,
})
export class SdAuditDiffValueTemplateDirective {
  readonly template = inject<TemplateRef<SdAuditDiffValueTemplateContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _directive: SdAuditDiffValueTemplateDirective,
    _context: unknown
  ): _context is SdAuditDiffValueTemplateContext {
    return true;
  }
}

@Component({
  selector: 'sd-audit-diff',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './audit-diff.component.html',
  styleUrl: './audit-diff.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdAuditDiff {
  readonly before = input<unknown>(undefined);
  readonly after = input<unknown>(undefined);
  readonly options = input<SdAuditDiffOptions>({});
  readonly mode = input<SdAuditDiffMode>('table');
  readonly ariaLabel = input<string | undefined>(undefined);

  readonly #i18n = inject(I18nService);
  readonly rows = computed(() => {
    const options = this.options();
    return sdBuildAuditDiff(this.before(), this.after(), {
      ...options,
      rootLabel: options.rootLabel ?? this.text('value.label'),
    });
  });
  protected readonly valueTemplate = contentChild(SdAuditDiffValueTemplateDirective);

  protected text(key: string): string {
    return this.#i18n.t(`core.component.audit-diff.${key}`);
  }

  protected valueContext(row: SdAuditDiffRow, side: SdAuditDiffSide): SdAuditDiffValueTemplateContext {
    return { $implicit: row[side], row, side };
  }

  protected displayValue(row: SdAuditDiffRow, side: SdAuditDiffSide): string {
    const present = side === 'before' ? row.beforePresent : row.afterPresent;
    if (!present) return this.text('value.not-set');
    const value = row[side];
    if (value === undefined) return this.text('value.undefined');
    if (value === null) return this.text('value.null');
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'boolean') return this.text(`value.${value ? 'true' : 'false'}`);
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'bigint') return String(value);
    return safeStringify(value);
  }
}

function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  try {
    const result = JSON.stringify(value, (_key, current: unknown) => {
      if (typeof current !== 'object' || current === null) return current;
      if (seen.has(current)) return '[Circular]';
      seen.add(current);
      return current;
    });
    return result ?? String(value);
  } catch {
    return String(value);
  }
}
