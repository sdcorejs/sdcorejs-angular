import { Injectable, signal } from '@angular/core';
import { ResolvedPanelMeta, SplitterLayoutState } from './splitter.models';

// Bảo vệ phép chia khi totalFlexWeight = 0 (tất cả flex panel collapsed)
// hoặc flexBudgetPx = 0 (px panels chiếm hết container)
const NEAR_ZERO = 1e-9;

@Injectable()
export class SplitterStateService {
  readonly liveSizes = signal<ReadonlyMap<string | number, number>>(new Map());
  readonly collapsedMap = signal<ReadonlyMap<string | number, boolean>>(new Map());
  readonly committedLayout = signal<SplitterLayoutState>({ v: 1, panels: [] });

  #metas: ResolvedPanelMeta[] = [];

  setPanelMeta(metas: ResolvedPanelMeta[]): void {
    this.#metas = metas;
  }

  getPanelMetas(): ReadonlyArray<Readonly<ResolvedPanelMeta>> {
    return this.#metas;
  }

  setLiveSize(id: string | number, size: number): void {
    const next = new Map(this.liveSizes());
    next.set(id, size);
    this.liveSizes.set(next);
  }

  setCollapsed(id: string | number, collapsed: boolean): void {
    const next = new Map(this.collapsedMap());
    next.set(id, collapsed);
    this.collapsedMap.set(next);
  }

  reconcile(metas: ResolvedPanelMeta[], stored: SplitterLayoutState | null | undefined): void {
    this.setPanelMeta(metas);
    const liveNext = new Map<string | number, number>();
    const collapsedNext = new Map<string | number, boolean>();

    for (const meta of metas) {
      let restoredSize: number | undefined;
      let restoredCollapsed = false;

      if (stored?.panels?.length) {
        // Try match by id, ưu tiên trùng id tuyệt đối
        const byId = stored.panels.find(p => p.id === meta.id);
        // Fallback by index chỉ khi panel không có panelId string. Theo convention
        // ResolvedPanelMeta.id = panelId nếu có (string), else fallback về index (number).
        // → id là số ⇔ template không khai báo panelId → index match là valid.
        const match = byId ?? (typeof meta.id === 'number' ? stored.panels[meta.index] : undefined);

        // Chỉ accept nếu unit trùng
        if (match && match.unit === meta.unit) {
          restoredSize = match.size;
          restoredCollapsed = match.collapsed;
        }
      }

      liveNext.set(meta.id, restoredSize ?? meta.declaredSize);
      collapsedNext.set(meta.id, restoredCollapsed);
    }

    this.liveSizes.set(liveNext);
    this.collapsedMap.set(collapsedNext);
  }

  /**
   * Áp delta px lên 2 panel kề handleIndex (prev = handleIndex, next = handleIndex + 1).
   * Khi snap collapsible panel: tự set collapsed + reset size = 0.
   * Khi expand collapsible panel đang collapsed: nếu delta đủ lớn → expand.
   * Trả về delta thực sự đã áp.
   */
  applyDelta(handleIndex: number, deltaPx: number, containerPx: number, snapThreshold = 0.5): number {
    const prev = this.#metas[handleIndex];
    const next = this.#metas[handleIndex + 1];
    if (!prev || !next) return 0;

    // Trường hợp 1: 1 trong 2 panel đang collapsed → expand khi delta đủ lớn.
    // So sánh deltaPx (px) với minSize đã convert sang px (vì minSize có thể là flex weight).
    const prevCollapsed = this.collapsedMap().get(prev.id) === true;
    const nextCollapsed = this.collapsedMap().get(next.id) === true;

    if (prevCollapsed || nextCollapsed) {
      const flexBudgetPx = this.#flexBudgetPx(containerPx);
      const totalFlexWeight = this.#totalFlexWeight();

      if (prevCollapsed && prev.collapsible) {
        const prevMinPx = this.#sizeToPx(prev, prev.minSize, flexBudgetPx, totalFlexWeight);
        if (deltaPx >= prevMinPx) {
          this.expandPanel(prev.id);
          return prevMinPx;
        }
      }
      if (nextCollapsed && next.collapsible) {
        const nextMinPx = this.#sizeToPx(next, next.minSize, flexBudgetPx, totalFlexWeight);
        if (-deltaPx >= nextMinPx) {
          this.expandPanel(next.id);
          return -nextMinPx;
        }
      }
      return 0;
    }

    const sizes = this.liveSizes();
    const prevSize = sizes.get(prev.id) ?? prev.declaredSize;
    const nextSize = sizes.get(next.id) ?? next.declaredSize;

    const flexBudgetPx = this.#flexBudgetPx(containerPx);
    const totalFlexWeight = this.#totalFlexWeight();
    const prevPx = prev.unit === 'px' ? prevSize : (flexBudgetPx * prevSize) / Math.max(totalFlexWeight, NEAR_ZERO);
    const nextPx = next.unit === 'px' ? nextSize : (flexBudgetPx * nextSize) / Math.max(totalFlexWeight, NEAR_ZERO);

    const rawNewPrevPx = prevPx + deltaPx;
    const rawNewNextPx = nextPx - deltaPx;

    const prevMinPx = this.#sizeToPx(prev, prev.minSize, flexBudgetPx, totalFlexWeight);
    const nextMinPx = this.#sizeToPx(next, next.minSize, flexBudgetPx, totalFlexWeight);

    // Snap check: panel kéo dưới minSize × snapThreshold + collapsible → snap collapse
    if (prev.collapsible && prevMinPx > 0 && rawNewPrevPx < prevMinPx * snapThreshold) {
      this.collapsePanel(prev.id);
      this.setLiveSize(prev.id, 0);
      return prevPx * -1;
    }
    if (next.collapsible && nextMinPx > 0 && rawNewNextPx < nextMinPx * snapThreshold) {
      this.collapsePanel(next.id);
      this.setLiveSize(next.id, 0);
      return nextPx;
    }

    // Không snap → clamp logic cũ
    const prevMaxPx = prev.maxSize != null ? this.#sizeToPx(prev, prev.maxSize, flexBudgetPx, totalFlexWeight) : Infinity;
    const nextMaxPx = next.maxSize != null ? this.#sizeToPx(next, next.maxSize, flexBudgetPx, totalFlexWeight) : Infinity;

    let delta = deltaPx;
    delta = Math.max(delta, prevMinPx - prevPx);
    delta = Math.min(delta, prevMaxPx - prevPx);
    delta = Math.max(delta, nextPx - nextMaxPx);
    delta = Math.min(delta, nextPx - nextMinPx);

    if (delta === 0) return 0;

    const newPrevPx = prevPx + delta;
    const newNextPx = nextPx - delta;
    const pxBudgetDelta = (prev.unit === 'px' ? delta : 0) + (next.unit === 'px' ? -delta : 0);
    const nextFlexBudgetPx = Math.max(flexBudgetPx - pxBudgetDelta, 0);
    const liveNext = new Map(this.liveSizes());
    liveNext.set(prev.id, this.#pxToLiveSize(prev, prevSize, newPrevPx, nextFlexBudgetPx, totalFlexWeight));
    liveNext.set(next.id, this.#pxToLiveSize(next, nextSize, newNextPx, nextFlexBudgetPx, totalFlexWeight));
    this.liveSizes.set(liveNext);

    return delta;
  }

  #flexBudgetPx(containerPx: number): number {
    let pxConsumed = 0;
    const sizes = this.liveSizes();
    for (const m of this.#metas) {
      if (m.unit === 'px' && !this.collapsedMap().get(m.id)) {
        pxConsumed += sizes.get(m.id) ?? m.declaredSize;
      }
    }
    return Math.max(containerPx - pxConsumed, 0);
  }

  #totalFlexWeight(): number {
    let total = 0;
    const sizes = this.liveSizes();
    for (const m of this.#metas) {
      if (m.unit === 'flex' && !this.collapsedMap().get(m.id)) {
        total += sizes.get(m.id) ?? m.declaredSize;
      }
    }
    return total;
  }

  #sizeToPx(meta: ResolvedPanelMeta, value: number, flexBudgetPx: number, totalFlexWeight: number): number {
    return meta.unit === 'px' ? value : (flexBudgetPx * value) / Math.max(totalFlexWeight, NEAR_ZERO);
  }

  #pxToLiveSize(
    meta: ResolvedPanelMeta,
    currentSize: number,
    nextPx: number,
    nextFlexBudgetPx: number,
    totalFlexWeight: number,
  ): number {
    if (meta.unit === 'px') return nextPx;
    if (nextFlexBudgetPx <= NEAR_ZERO || totalFlexWeight <= NEAR_ZERO) {
      // A flex pane can be visually 0px because sibling px panes consume the whole
      // container. Keep a positive weight so dragging back has a stable anchor.
      return Math.max(currentSize, meta.lastSize, meta.declaredSize, meta.minSize, NEAR_ZERO);
    }
    if (nextPx <= 0) return 0;
    return (nextPx * totalFlexWeight) / nextFlexBudgetPx;
  }

  collapsePanel(id: string | number): void {
    const meta = this.#metas.find(m => m.id === id);
    if (!meta || !meta.collapsible) return;
    // Lưu size hiện tại để expand sau
    const current = this.liveSizes().get(id);
    if (current !== undefined && current > 0) {
      meta.lastSize = current;
    }
    this.setCollapsed(id, true);
  }

  expandPanel(id: string | number): void {
    const meta = this.#metas.find(m => m.id === id);
    if (!meta) return;
    let restoreSize = meta.lastSize;
    if (!restoreSize || restoreSize <= 0) {
      // Fallback chain: lastSize → minSize → declaredSize. Giả định declaredSize > 0;
      // nếu cả 3 đều ≤ 0 (template sai), panel expand về size 0 — visually invisible
      // nhưng state nhất quán (collapsed=false). Caller chịu trách nhiệm khai báo size hợp lý.
      restoreSize = meta.minSize > 0 ? meta.minSize : meta.declaredSize;
    }
    this.setLiveSize(id, restoreSize);
    this.setCollapsed(id, false);
  }

  togglePanel(id: string | number): void {
    if (this.collapsedMap().get(id)) {
      this.expandPanel(id);
    } else {
      this.collapsePanel(id);
    }
  }

  commit(): void {
    const sizes = this.liveSizes();
    const collapsed = this.collapsedMap();
    const panels = this.#metas.map(meta => ({
      id: meta.id,
      size: sizes.get(meta.id) ?? meta.declaredSize,
      unit: meta.unit,
      collapsed: collapsed.get(meta.id) ?? false,
    }));
    this.committedLayout.set({ v: 1, panels });
  }
}
