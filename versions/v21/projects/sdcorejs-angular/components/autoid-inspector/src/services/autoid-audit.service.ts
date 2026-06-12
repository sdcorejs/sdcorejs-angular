import { Injectable } from '@angular/core';
import { AutoidElement, AutoidAuditResult, AutoidMissing } from '../models/autoid-element.model';
import { AUTOID_DEFAULT_REQUIRE_SELECTORS } from '../models/autoid-inspector-config.model';

@Injectable({ providedIn: 'root' })
export class SdAutoidAuditService {
  /**
   * Audit kết quả scan + DOM:
   * - duplicates: map autoid → count khi count > 1
   * - missing: element khớp selector yêu cầu nhưng KHÔNG có [data-autoid]
   */
  audit(elements: AutoidElement[], options: { requireSelectors?: readonly string[]; root?: HTMLElement } = {}): AutoidAuditResult {
    const requireSelectors = options.requireSelectors ?? AUTOID_DEFAULT_REQUIRE_SELECTORS;
    const root = options.root ?? document.body;

    const duplicates: Record<string, number> = {};
    for (const el of elements) {
      if (el.duplicate) {
        duplicates[el.autoid] = (duplicates[el.autoid] ?? 0) + 1;
      }
    }

    const missing = this.findMissing(root, requireSelectors);

    return {
      total: elements.length,
      duplicates,
      duplicateCount: Object.keys(duplicates).length,
      missing,
      missingCount: missing.length,
    };
  }

  private findMissing(root: HTMLElement, selectors: readonly string[]): AutoidMissing[] {
    if (!selectors.length) return [];
    const joined = selectors.join(',');
    const nodes = root.querySelectorAll<HTMLElement>(joined);
    const missing: AutoidMissing[] = [];

    nodes.forEach(node => {
      // Coi là missing khi element + mọi descendant đều không có data-autoid.
      // Lý do: sd-button render thành <button data-autoid="..."> bên trong host
      // <sd-button>. Nếu chỉ check chính host sẽ false-positive cho mọi sd-button.
      if (node.hasAttribute('data-autoid')) return;
      if (node.querySelector('[data-autoid]')) return;

      missing.push({
        tag: node.tagName.toLowerCase(),
        selector: this.buildSelectorPath(node),
        outerHtmlPreview: this.shortHtml(node),
        nameHint: this.resolveNameHint(node),
      });
    });

    return missing;
  }

  private buildSelectorPath(node: HTMLElement): string {
    const parts: string[] = [];
    let cur: HTMLElement | null = node;
    let depth = 0;
    while (cur && depth < 4) {
      let part = cur.tagName.toLowerCase();
      if (cur.id) {
        part += `#${cur.id}`;
        parts.unshift(part);
        break;
      }
      const cls = (cur.getAttribute('class') ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
      if (cls.length) part += `.${cls.join('.')}`;
      parts.unshift(part);
      cur = cur.parentElement;
      depth++;
    }
    return parts.join(' > ');
  }

  private shortHtml(node: HTMLElement): string {
    const html = node.outerHTML.replace(/\s+/g, ' ');
    return html.length > 160 ? html.slice(0, 157) + '...' : html;
  }

  private resolveNameHint(node: HTMLElement): string {
    return (
      node.getAttribute('label') ?? node.getAttribute('placeholder') ?? node.getAttribute('aria-label') ?? node.getAttribute('title') ?? ''
    );
  }
}
