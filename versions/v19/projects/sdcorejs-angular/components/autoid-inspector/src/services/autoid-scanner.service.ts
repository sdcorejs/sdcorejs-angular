import { Injectable } from '@angular/core';
import { SdAutoidElement, SdAutoidElementState } from '../models/autoid-element.model';

@Injectable({ providedIn: 'root' })
export class SdAutoidScannerService {
  /** Quét toàn bộ element có [data-autoid] trong root, gắn thông tin name/tag/value/xpath. */
  scan(root: HTMLElement = document.body): SdAutoidElement[] {
    const nodes = root.querySelectorAll<HTMLElement>('[data-autoid]');
    const dupCount: Record<string, number> = {};
    nodes.forEach(n => {
      const id = n.getAttribute('data-autoid');
      if (!id) return;
      dupCount[id] = (dupCount[id] ?? 0) + 1;
    });

    const result: SdAutoidElement[] = [];
    let stt = 1;
    nodes.forEach(node => {
      const autoid = node.getAttribute('data-autoid');
      if (!autoid) return;
      const state = this.readState(node);
      const tableScope = this.resolveTableScope(node);
      result.push({
        stt: stt++,
        name: this.resolveName(node),
        autoid,
        tag: this.resolveSdTag(node),
        text: this.resolveText(node),
        xpath: `//*[@data-autoid="${autoid}"]`,
        duplicate: dupCount[autoid] > 1,
        state,
        tableScope,
      });
    });
    return result;
  }

  /** Group element theo autoid để consumer lấy duplicate map. */
  groupByAutoid(elements: SdAutoidElement[]): Record<string, SdAutoidElement[]> {
    const map: Record<string, SdAutoidElement[]> = {};
    for (const el of elements) {
      (map[el.autoid] ??= []).push(el);
    }
    return map;
  }

  /**
   * Read the optional `data-*` E2E state attributes off the same node.
   * Only includes fields actually present on the DOM (skipped fields stay undefined).
   */
  private readState(node: HTMLElement): SdAutoidElementState {
    const get = (n: string): string | undefined => {
      const v = node.getAttribute(n);
      return v === null ? undefined : v;
    };
    return {
      disabled: get('data-disabled'),
      loading: get('data-loading'),
      empty: get('data-empty'),
      invalid: get('data-invalid'),
      opened: get('data-opened'),
      count: get('data-count'),
      dataValue: get('data-value'),
      required: get('data-required'),
      maxlength: get('data-maxlength'),
      minlength: get('data-minlength'),
      pattern: get('data-pattern'),
      errorMessage: get('data-error-message'),
    };
  }

  /**
   * If the node is inside an `<sd-table>` element, return that table's `data-autoid`.
   * Walks up via closest('sd-table') — skips the node itself if it IS the table.
   */
  private resolveTableScope(node: HTMLElement): string | undefined {
    // Skip self if the node itself is the sd-table host.
    const start = node.tagName.toLowerCase() === 'sd-table' ? node.parentElement : node;
    const table = start?.closest('sd-table') as HTMLElement | null;
    if (!table || table === node) return undefined;
    const id = table.getAttribute('data-autoid');
    return id ?? undefined;
  }

  private resolveName(node: HTMLElement): string {
    if (node.id) {
      // CSS.escape phòng id chứa ký tự đặc biệt làm vỡ selector.
      const sel = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(node.id) : node.id;
      const label = document.querySelector(`label[for="${sel}"]`);
      const text = label?.textContent?.trim();
      if (text) return text;
    }
    return node.getAttribute('aria-label')?.trim()
      ?? node.getAttribute('placeholder')?.trim()
      ?? node.getAttribute('title')?.trim()
      ?? '';
  }

  private resolveSdTag(node: HTMLElement): string {
    let cur: HTMLElement | null = node;
    while (cur) {
      const tag = cur.tagName.toLowerCase();
      if (tag.startsWith('sd-')) return tag;
      cur = cur.parentElement;
    }
    return node.tagName.toLowerCase();
  }

  private resolveText(node: HTMLElement): string {
    const input = node as HTMLInputElement;
    if (typeof input.value === 'string' && input.value) return input.value;
    return (node.textContent ?? '').trim().slice(0, 80);
  }
}
