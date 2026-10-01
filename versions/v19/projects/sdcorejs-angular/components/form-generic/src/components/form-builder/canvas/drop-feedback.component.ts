import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { BuilderDragService } from '../state/builder-drag';
import { CanvasGeometry, DropIntent, GeoRect } from '../state/builder-layout';
import { BuilderDragState, FormBuilderStore } from '../state/builder-store';

interface IndicatorView {
  readonly kind: 'row' | 'inline';
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
}

interface DropFeedbackView {
  readonly indicator: IndicatorView | null;
  /** Khung group đang là vùng thả (chèn BÊN TRONG group). */
  readonly target: GeoRect | null;
}

/** Khoảng đệm của hàng group (`.fb-row--group`) quanh thẻ group. */
const GROUP_ROW_PADDING = 6;
const INDICATOR_INSET = 8;

/**
 * Phản hồi thị giác trong lúc kéo: vạch chỉ vị trí thả và khung group đích (cùng hình học mà `hitTest`
 * dùng), vẽ trên một lớp phủ NGOÀI vùng cuộn của canvas.
 *
 * why: component riêng — mỗi lần con trỏ đổi đích chỉ view nhỏ này được vẽ lại. Nếu canvas tự đọc
 * `store.drag()` thì cả canvas (hàng trăm field) phải refresh mỗi lần intent đổi: đo được ~60 ms
 * mỗi lần ở form 300 field (dev mode), so với dưới 1 ms cho `hitTest` + `planDrop`. Lớp phủ nằm ngoài
 * vùng cuộn và `contain: strict` để thay đổi của nó không buộc trình duyệt tính lại layout nội dung canvas.
 */
@Component({
  selector: 'fb-drop-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'fb-drop-layer', 'aria-hidden': 'true' },
  template: `
    @let _view = view();
    @if (_view?.target; as _target) {
      <div
        class="fb-drop-target"
        [style.transform]="'translate(' + _target.left + 'px, ' + _target.top + 'px)'"
        [style.width.px]="_target.right - _target.left"
        [style.height.px]="_target.bottom - _target.top"></div>
    }
    @if (_view?.indicator; as _indicator) {
      <div
        class="fb-indicator"
        [class.fb-indicator--inline]="_indicator.kind === 'inline'"
        [style.transform]="'translate(' + _indicator.left + 'px, ' + _indicator.top + 'px)'"
        [style.width.px]="_indicator.width"
        [style.height.px]="_indicator.height">
        @if (_indicator.label) {
          <span class="fb-indicator__label">{{ _indicator.label }}</span>
        }
      </div>
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      overflow: hidden;
      contain: strict;
      pointer-events: none;
      z-index: 5;
    }

    /*
     * why: each feedback element is its own compositing layer moved with transform, so updating it
     * never repaints the canvas content underneath.
     */
    .fb-drop-target,
    .fb-indicator {
      position: absolute;
      top: 0;
      left: 0;
      will-change: transform;
    }

    .fb-drop-target {
      box-sizing: border-box;
      border: 1px dashed var(--sd-primary);
      border-radius: var(--sd-radius-8, 8px);
      background: color-mix(in srgb, var(--sd-primary) 4%, transparent);
    }

    .fb-indicator {
      border-radius: var(--sd-radius-999, 999px);
      background: var(--sd-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--sd-primary) 18%, transparent);
    }

    .fb-indicator__label {
      position: absolute;
      left: 50%;
      top: -24px;
      transform: translateX(-50%);
      padding: 2px 8px;
      border-radius: var(--sd-radius-999, 999px);
      background: var(--sd-primary);
      color: var(--sd-primary-contrast);
      font-size: var(--sd-font-size-11, 11px);
      font-weight: var(--sd-font-weight-semibold, 600);
      white-space: nowrap;
    }

    .fb-indicator--inline .fb-indicator__label {
      top: -22px;
    }
  `,
})
export class DropIndicatorComponent {
  readonly #store = inject(FormBuilderStore);
  readonly #drag = inject(BuilderDragService);

  readonly view = computed<DropFeedbackView | null>(() => {
    const drag = this.#store.drag();
    const geometry = this.#drag.geometry();
    if (!drag?.intent || !geometry) return null;
    // Toạ độ nội dung (hình học đo trong vùng cuộn) → toạ độ của lớp phủ (khung nhìn canvas).
    const { top, left } = this.#drag.scroll();
    const indicator = this.#indicatorFor(drag, drag.intent, geometry);
    const target = this.#targetFor(drag.intent, geometry);
    return {
      indicator: indicator && { ...indicator, left: indicator.left - left, top: indicator.top - top },
      target: target && { left: target.left - left, right: target.right - left, top: target.top - top, bottom: target.bottom - top },
    };
  });

  /** Khung thẻ group đích = hàng group ở cấp gốc, trừ khoảng đệm của hàng. */
  #targetFor(intent: DropIntent, geometry: CanvasGeometry): GeoRect | null {
    if (intent.parentId === null) return null;
    const row = geometry.root.rows.find(candidate => candidate.key === intent.parentId);
    if (!row) return null;
    return {
      left: row.left + GROUP_ROW_PADDING,
      top: row.top + GROUP_ROW_PADDING,
      right: row.right - GROUP_ROW_PADDING,
      bottom: row.bottom - GROUP_ROW_PADDING,
    };
  }

  #indicatorFor(drag: BuilderDragState, intent: DropIntent, geometry: CanvasGeometry): IndicatorView | null {
    const container = intent.parentId === null ? geometry.root : geometry.groups.find(group => group.parentId === intent.parentId);
    if (!container) return null;
    const rows = container.rows;
    const t = this.#store.t;
    const groupLabel = () => {
      const group = this.#store.index().get(intent.parentId ?? '')?.item;
      return group ? t('core.component.form-builder.drop.into-group', { label: this.#store.labelOf(group) }) : '';
    };
    if (intent.kind === 'row') {
      const label =
        drag.hint === 'row-full'
          ? t('core.component.form-builder.drop.row-full')
          : intent.parentId
            ? groupLabel()
            : t('core.component.form-builder.drop.new-row');
      const left = rows[0]?.left ?? container.left;
      const right = rows[0]?.right ?? container.right;
      let top: number;
      if (!rows.length) top = container.top + INDICATOR_INSET;
      else if (intent.beforeRowKey === null) top = rows[rows.length - 1].bottom + 2;
      else {
        const index = rows.findIndex(row => row.key === intent.beforeRowKey);
        if (index < 0) return null;
        top = index === 0 ? rows[0].top - 2 : (rows[index - 1].bottom + rows[index].top) / 2;
      }
      return {
        kind: 'row',
        left: left + INDICATOR_INSET,
        top: top - 1,
        width: Math.max(24, right - left - INDICATOR_INSET * 2),
        height: 3,
        label,
      };
    }
    const row = rows.find(candidate => candidate.key === intent.rowKey);
    if (!row) return null;
    const movingId = drag.subject.kind === 'move' ? drag.subject.id : null;
    const items = row.items.filter(item => item.id !== movingId);
    const before = intent.beforeItemId ? items.find(item => item.id === intent.beforeItemId) : undefined;
    const x = before ? before.left : (items[items.length - 1]?.right ?? row.left);
    const label = intent.parentId ? groupLabel() : t('core.component.form-builder.drop.inline');
    return { kind: 'inline', left: x - 1.5, top: row.top + 4, width: 3, height: Math.max(24, row.bottom - row.top - 8), label };
  }
}

/**
 * Dòng trạng thái khi kéo (vì sao đích bị đổi / thả ở đây sẽ huỷ). Vùng `role="status"` luôn có mặt
 * trong lúc kéo để trình đọc màn hình đọc được thay đổi.
 */
@Component({
  selector: 'fb-drop-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon],
  template: `
    @if (dragging()) {
      @let _hint = hint();
      <!-- why: stable DOM while dragging (text and visibility change only); adding or removing nodes forces layout. -->
      <div class="fb-drop-status" role="status" aria-live="polite" [class.is-empty]="!_hint">
        <sd-icon name="info" size="16px"></sd-icon><span>{{ _hint }}</span>
      </div>
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      overflow: hidden;
      contain: strict;
      pointer-events: none;
      z-index: 6;
    }

    .fb-drop-status {
      position: absolute;
      left: 50%;
      bottom: 12px;
      transform: translateX(-50%);
      z-index: 6;
      display: flex;
      align-items: center;
      gap: 6px;
      max-width: calc(100% - 32px);
      padding: 6px 12px;
      border-radius: var(--sd-radius-999, 999px);
      background: var(--sd-surface-inverse, var(--sd-text));
      color: var(--sd-surface);
      font-size: var(--sd-font-size-12, 12px);
      pointer-events: none;
    }

    .fb-drop-status.is-empty {
      display: none;
    }
  `,
})
export class DropStatusComponent {
  readonly #store = inject(FormBuilderStore);

  readonly dragging = computed(() => !!this.#store.drag());

  readonly hint = computed(() => {
    const drag = this.#store.drag();
    if (!drag) return '';
    if (drag.hint === 'nested-group') return this.#store.t('core.component.form-builder.drop.nested-group');
    if (!drag.intent) return this.#store.t('core.component.form-builder.drop.cancel');
    if (drag.hint === 'row-full') return this.#store.t('core.component.form-builder.drop.row-full');
    return '';
  });
}
