import { Injectable } from '@angular/core';

const ATTR = 'data-sd-autoid-highlight';
const SAVED_OUTLINE = 'data-sd-autoid-prev-outline';
const SAVED_OUTLINE_OFFSET = 'data-sd-autoid-prev-outline-offset';
const SAVED_BG = 'data-sd-autoid-prev-bg';
const SAVED_BORDER_RADIUS = 'data-sd-autoid-prev-radius';

// Token màu lấy từ @sdcorejs/angular theme (--sd-*). Fallback hex áp dụng khi
// consumer chưa import sd-core.scss. Dùng cùng bộ var với scss component để
// nhất quán visual giữa highlight ok / duplicate / missing.
const COLOR_OK = 'var(--sd-success, #4CAF50)';
const COLOR_OK_BG = 'var(--sd-success-light, rgba(76, 175, 80, 0.12))';
const COLOR_DUP = 'var(--sd-error, #F82C13)';
const COLOR_DUP_BG = 'var(--sd-error-light, rgba(248, 44, 19, 0.12))';
const COLOR_MISSING = 'var(--sd-warning, #FF9600)';
const COLOR_MISSING_BG = 'var(--sd-warning-light, rgba(255, 150, 0, 0.12))';

@Injectable({ providedIn: 'root' })
export class SdAutoidHighlightService {
  /** Apply outline cho mọi [data-autoid]: xanh nếu unique, đỏ nếu duplicate. Idempotent. */
  apply(root: HTMLElement = document.body): void {
    this.clear(root);
    const nodes = root.querySelectorAll<HTMLElement>('[data-autoid]');
    const count: Record<string, number> = {};
    nodes.forEach(n => {
      const id = n.getAttribute('data-autoid');
      if (!id) return;
      count[id] = (count[id] ?? 0) + 1;
    });

    // Để tránh apply 2 lần lên cùng 1 target khi nhiều [data-autoid] cùng
    // chia sẻ 1 sd-* host (vd 2 input lồng trong 1 sd-date-range).
    const visited = new Set<HTMLElement>();

    nodes.forEach(node => {
      const id = node.getAttribute('data-autoid');
      if (!id) return;

      // Highlight HOST sd-* (giống applyMissing) — outline ôm trọn card,
      // không hiển thị lệch trên input con / label fragment. Fallback về
      // chính node khi không tìm thấy sd-* ancestor (vd native button).
      const target = this.#resolveTarget(node);
      if (visited.has(target)) return;
      visited.add(target);

      const isDup = count[id] > 1;
      this.#paint(target, isDup ? COLOR_DUP : COLOR_OK, isDup ? COLOR_DUP_BG : COLOR_OK_BG, 'solid', isDup ? 'duplicate' : 'ok');
    });
  }

  /** Highlight tập element không có autoid (missing) bằng outline cam dashed. */
  applyMissing(nodes: HTMLElement[]): void {
    nodes.forEach(node => {
      if (node.hasAttribute(ATTR)) return;
      this.#paint(node, COLOR_MISSING, COLOR_MISSING_BG, 'dashed', 'missing');
    });
  }

  /** Restore inline style như trước khi apply. */
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

  #paint(node: HTMLElement, color: string, bg: string, style: 'solid' | 'dashed', marker: 'ok' | 'duplicate' | 'missing'): void {
    // Backup full style cần restore để clear() đưa về nguyên trạng.
    node.setAttribute(SAVED_OUTLINE, node.style.outline ?? '');
    node.setAttribute(SAVED_OUTLINE_OFFSET, node.style.outlineOffset ?? '');
    node.setAttribute(SAVED_BG, node.style.backgroundColor ?? '');
    node.setAttribute(SAVED_BORDER_RADIUS, node.style.borderRadius ?? '');

    node.style.outline = `2px ${style} ${color}`;
    // outline-offset 2px tránh đè lên border của host (mat-form-field, button)
    // → highlight nằm gọn ngoài card thay vì cắt vào nội dung.
    node.style.outlineOffset = '2px';
    node.style.backgroundColor = bg;
    // Bo nhẹ để outline trông sạch trên host bo góc sẵn.
    if (!node.style.borderRadius) {
      node.style.borderRadius = '6px';
    }
    node.setAttribute(ATTR, marker);
  }
}
