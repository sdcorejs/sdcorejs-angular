import { ChangeDetectionStrategy, Component, booleanAttribute, computed, inject, input, model, viewChild } from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { OPERATORS } from '@sdcorejs/utils/constants';
import { Operator } from '@sdcorejs/utils/models';
import { I18nService } from '@sdcorejs/angular/i18n';

interface OperatorItem {
  value: Operator;
  icon: SafeHtml;
  display: string;
}

@Component({
  selector: 'sd-operator',
  templateUrl: './operator.component.html',
  styleUrls: ['./operator.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatMenuModule, MatTooltipModule],
})
export class SdOperator {
  // Inner SVG markup (hÃ¬nh phá»…u) dÃ¹ng khi chÆ°a chá»n operator.
  static readonly FALLBACK_ICON = '<path d="M4 5h16l-6.5 7.5V19l-3 2v-8.5z"/>';

  readonly #i18n = inject(I18nService);
  readonly #sanitizer = inject(DomSanitizer);

  /** Operator hiá»‡n táº¡i â€” binding hai chiá»u [(model)]. */
  model = model<Operator | undefined>();

  /** Danh sÃ¡ch operator cho phÃ©p, giá»¯ nguyÃªn thá»© tá»± truyá»n vÃ o. */
  operators = input<Operator[]>([]);

  /** VÃ´ hiá»‡u hÃ³a trigger (khÃ´ng má»Ÿ Ä‘Æ°á»£c menu). */
  disabled = input(false, { transform: booleanAttribute });

  /** data-autoId cho e2e selector. */
  autoId = input<string>();

  /** Allowed operators map sang { value, icon, display } theo thá»© tá»± input. */
  readonly items = computed<OperatorItem[]>(() => {
    const out: OperatorItem[] = [];
    for (const value of this.operators()) {
      const r = this.#resolve(value);
      if (!r) continue;
      out.push({ value, icon: this.#svg(r.icon), display: r.display });
    }
    return out;
  });

  /** Icon SVG á»Ÿ trigger â€” fallback phá»…u khi model chÆ°a set / khÃ´ng tÃ¬m tháº¥y. */
  readonly currentIcon = computed<SafeHtml>(() => {
    return this.#svg(this.#resolve(this.model())?.icon ?? SdOperator.FALLBACK_ICON);
  });

  /** Tooltip = i18n label cá»§a operator hiá»‡n táº¡i ('' khi chÆ°a chá»n). */
  readonly currentLabel = computed<string>(() => this.#resolve(this.model())?.display ?? '');

  // Resolve má»™t operator â†’ { inner-svg, nhÃ£n Ä‘Ã£ dá»‹ch } tá»« báº£ng OPERATORS dÃ¹ng chung.
  #resolve(value: Operator | undefined): { icon: string; display: string } | undefined {
    if (value == null) return undefined;
    const entry = OPERATORS.find((o) => o.value === value);
    return entry ? { icon: entry.icon, display: entry.display } : undefined;
  }

  // why: OPERATORS.icon lÃ  inner SVG (path/line/rect). Bá»c <svg> + bypass sanitizer
  // (nguá»“n lÃ  háº±ng sá»‘ ná»™i bá»™, khÃ´ng pháº£i input ngÆ°á»i dÃ¹ng) Ä‘á»ƒ Angular khÃ´ng strip svg con.
  #svg(inner: string): SafeHtml {
    return this.#sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`,
    );
  }

  private readonly trigger = viewChild(MatMenuTrigger);

  /** Open the operator menu programmatically (used by the query-bar build flow). */
  open(): void {
    this.trigger()?.openMenu();
  }

  /** Chá»n operator tá»« menu. */
  select(value: Operator): void {
    this.model.set(value);
  }
}

