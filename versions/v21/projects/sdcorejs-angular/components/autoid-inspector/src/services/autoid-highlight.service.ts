import { Injectable } from '@angular/core';

const ATTR = 'data-sd-autoid-highlight';
const SAVED_OUTLINE = 'data-sd-autoid-prev-outline';
const SAVED_OUTLINE_OFFSET = 'data-sd-autoid-prev-outline-offset';
const SAVED_BG = 'data-sd-autoid-prev-bg';
const SAVED_BORDER_RADIUS = 'data-sd-autoid-prev-radius';

// Token mÃ u láº¥y tá»« @sdcorejs/angular theme (--sd-*). Fallback hex Ã¡p dá»¥ng khi
// consumer chÆ°a import sd-core.scss. DÃ¹ng cÃ¹ng bá»™ var vá»›i scss component Ä‘á»ƒ
// nháº¥t quÃ¡n visual giá»¯a highlight ok / duplicate / missing.
const COLOR_OK = 'var(--sd-success, #4CAF50)';
const COLOR_OK_BG = 'var(--sd-success-light, rgba(76, 175, 80, 0.12))';
const COLOR_DUP = 'var(--sd-error, #F82C13)';
const COLOR_DUP_BG = 'var(--sd-error-light, rgba(248, 44, 19, 0.12))';
const COLOR_MISSING = 'var(--sd-warning, #FF9600)';
const COLOR_MISSING_BG = 'var(--sd-warning-light, rgba(255, 150, 0, 0.12))';

@Injectable({ providedIn: 'root' })
export class SdAutoidHighlightService {
  /** Apply outline cho má»i [data-autoid]: xanh náº¿u unique, Ä‘á» náº¿u duplicate. Idempotent. */
  apply(root: HTMLElement = document.body): void {
    this.clear(root);
    const nodes = root.querySelectorAll<HTMLElement>('[data-autoid]');
    const count: Record<string, number> = {};
    nodes.forEach(n => {
      const id = n.getAttribute('data-autoid');
      if (!id) return;
      count[id] = (count[id] ?? 0) + 1;
    });

    // Äá»ƒ trÃ¡nh apply 2 láº§n lÃªn cÃ¹ng 1 target khi nhiá»u [data-autoid] cÃ¹ng
    // chia sáº» 1 sd-* host (vd 2 input lá»“ng trong 1 sd-date-range).
    const visited = new Set<HTMLElement>();

    nodes.forEach(node => {
      const id = node.getAttribute('data-autoid');
      if (!id) return;

      // Highlight HOST sd-* (giá»‘ng applyMissing) â€” outline Ã´m trá»n card,
      // khÃ´ng hiá»ƒn thá»‹ lá»‡ch trÃªn input con / label fragment. Fallback vá»
      // chÃ­nh node khi khÃ´ng tÃ¬m tháº¥y sd-* ancestor (vd native button).
      const target = this.#resolveTarget(node);
      if (visited.has(target)) return;
      visited.add(target);

      const isDup = count[id] > 1;
      this.#paint(
        target,
        isDup ? COLOR_DUP : COLOR_OK,
        isDup ? COLOR_DUP_BG : COLOR_OK_BG,
        'solid',
        isDup ? 'duplicate' : 'ok'
      );
    });
  }

  /** Highlight táº­p element khÃ´ng cÃ³ autoid (missing) báº±ng outline cam dashed. */
  applyMissing(nodes: HTMLElement[]): void {
    nodes.forEach(node => {
      if (node.hasAttribute(ATTR)) return;
      this.#paint(node, COLOR_MISSING, COLOR_MISSING_BG, 'dashed', 'missing');
    });
  }

  /** Restore inline style nhÆ° trÆ°á»›c khi apply. */
  clear(root: HTMLElement = document.body): void {
    const nodes = root.querySelectorAll<HTMLElement>(`[${ATTR}]`);
    nodes.forEach(node => {
      node.style.outline = node.getAttribute(SAVED_OUTLINE) ?? '';
      node.style.outlineOffset = node.getAttribute(SAVED_OUTLINE_OFFSET) ?? '';
      node.style.backgroundColor = node.getAttribute(SAVED_BG) ?? '';
      node.style.borderRadius = node.getAttribute(SAVED_BORDER_RADIUS) ?? '';
      node.removeAttribute(SAVED_OUTLINE);
      node.removeAttribute(SAVED_OUTLINE_OFFSET);
      node.removeAttribute(SAVED_BG);
      node.removeAttribute(SAVED_BORDER_RADIUS);
      node.removeAttribute(ATTR);
    });
  }

  // ==========================================
  // HELPERS
  // ==========================================
  #resolveTarget(node: HTMLElement): HTMLElement {
    let cur: HTMLElement | null = node;
    while (cur) {
      if (cur.tagName.toLowerCase().startsWith('sd-')) return cur;
      cur = cur.parentElement;
    }
    return node;
  }

  #paint(
    node: HTMLElement,
    color: string,
    bg: string,
    style: 'solid' | 'dashed',
    marker: 'ok' | 'duplicate' | 'missing'
  ): void {
    // Backup full style cáº§n restore Ä‘á»ƒ clear() Ä‘Æ°a vá» nguyÃªn tráº¡ng.
    node.setAttribute(SAVED_OUTLINE, node.style.outline ?? '');
    node.setAttribute(SAVED_OUTLINE_OFFSET, node.style.outlineOffset ?? '');
    node.setAttribute(SAVED_BG, node.style.backgroundColor ?? '');
    node.setAttribute(SAVED_BORDER_RADIUS, node.style.borderRadius ?? '');

    node.style.outline = `2px ${style} ${color}`;
    // outline-offset 2px trÃ¡nh Ä‘Ã¨ lÃªn border cá»§a host (mat-form-field, button)
    // â†’ highlight náº±m gá»n ngoÃ i card thay vÃ¬ cáº¯t vÃ o ná»™i dung.
    node.style.outlineOffset = '2px';
    node.style.backgroundColor = bg;
    // Bo nháº¹ Ä‘á»ƒ outline trÃ´ng sáº¡ch trÃªn host bo gÃ³c sáºµn.
    if (!node.style.borderRadius) {
      node.style.borderRadius = '6px';
    }
    node.setAttribute(ATTR, marker);
  }
}

