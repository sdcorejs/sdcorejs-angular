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
  // Inner SVG markup (hình phễu) dùng khi chưa chọn operator.
  static readonly FALLBACK_ICON = '<path d="M4 5h16l-6.5 7.5V19l-3 2v-8.5z"/>';

  readonly #i18n = inject(I18nService);
  readonly #sanitizer = inject(DomSanitizer);

  /** Operator hiện tại — binding hai chiều [(model)]. */
  model = model<Operator | undefined>();

  /** Danh sách operator cho phép, giữ nguyên thứ tự truyền vào. */
  operators = input<Operator[]>([]);

  /** Vô hiệu hóa trigger (không mở được menu). */
  disabled = input(false, { transform: booleanAttribute });

  /** data-autoId cho e2e selector. */
  autoId = input<string>();

  /** Allowed operators map sang { value, icon, display } theo thứ tự input. */
  readonly items = computed<OperatorItem[]>(() => {
    const out: OperatorItem[] = [];
    for (const value of this.operators()) {
      const r = this.#resolve(value);
      if (!r) continue;
      out.push({ value, icon: this.#svg(r.icon), display: r.display });
    }
    return out;
  });

  /** Icon SVG ở trigger — fallback phễu khi model chưa set / không tìm thấy. */
  readonly currentIcon = computed<SafeHtml>(() => {
    return this.#svg(this.#resolve(this.model())?.icon ?? SdOperator.FALLBACK_ICON);
  });

  /** Tooltip = i18n label của operator hiện tại ('' khi chưa chọn). */
  readonly currentLabel = computed<string>(() => this.#resolve(this.model())?.display ?? '');

  // Resolve một operator → { inner-svg, nhãn đã dịch } từ bảng OPERATORS dùng chung.
  // why: OPERATORS[].display là i18n KEY ('core.operator.*.display'), KHÔNG phải text —
  // phải dịch qua I18nService, nếu không UI hiện key thô (code) thay vì nhãn đã dịch.
  #resolve(value: Operator | undefined): { icon: string; display: string } | undefined {
    if (value == null) return undefined;
    const entry = OPERATORS.find(o => o.value === value);
    return entry ? { icon: entry.icon, display: this.#i18n.t(entry.display) } : undefined;
  }

  // why: OPERATORS.icon là inner SVG (path/line/rect). Bọc <svg> + bypass sanitizer
  // (nguồn là hằng số nội bộ, không phải input người dùng) để Angular không strip svg con.
  #svg(inner: string): SafeHtml {
    return this.#sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
    );
  }

  private readonly trigger = viewChild(MatMenuTrigger);

  /** Open the operator menu programmatically (used by the query-bar build flow). */
  open(): void {
    this.trigger()?.openMenu();
  }

  /** Chọn operator từ menu. */
  select(value: Operator): void {
    this.model.set(value);
  }
}
