import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EmbeddedViewRef,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Utilities } from '@sdcorejs/utils/fns';
import { CdkPortal, DomPortalOutlet, PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { SdLoadingService } from '@sdcorejs/angular/services';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdModalResizableRegistry } from './modal-resizable.registry';

/**
 * `<sd-modal-resizable>` — right-docked, non-modal panel that can be minimized, expanded or pushed
 * fullscreen. Several panels stack side by side along the right edge of the viewport, so the user
 * can keep multiple records open at once while still working with the page behind them.
 *
 * Use it for side-by-side comparison / inspector workflows. Use `<sd-modal>` when the task is
 * blocking, and `<sd-side-drawer>` when a single overlay with a backdrop is enough.
 *
 * NOTE ON DOCS: this component deliberately has **no** sibling `sd-modal-resizable.md`. Every `*.md`
 * under the library is swept into `published-docs/<version>/index.json` by `scripts/collect-docs.mjs`,
 * and `scripts/generate-showcase-example-sources.test.mjs` asserts that list is 1:1 with the
 * `publishedDocId` set in the showcase documentation registry. A published doc with no showcase page
 * therefore turns that release guard red. Keep the reference here until the component ships a
 * showcase demo + registry entry; only then add the `.md`.
 *
 * ```ts
 * import { SdModalResizable } from '@sdcorejs/angular/components/modal-resizable';
 * ```
 *
 * ```html
 * <sd-button title="Open detail" type="fill" color="primary" (click)="panel.open()"></sd-button>
 *
 * <sd-modal-resizable #panel width="520px">
 *   <span sdTitle>Đơn hàng #1024</span>
 *
 *   <div sdBody class="panel-body">
 *     <sd-section icon="receipt" title="Thông tin chung">
 *       <sd-section-item label="Khách hàng">Nguyen Van An</sd-section-item>
 *     </sd-section>
 *   </div>
 *
 *   <sd-button sdFooterRight type="text" title="Đóng" (click)="panel.close()"></sd-button>
 * </sd-modal-resizable>
 * ```
 *
 * ### Slots
 * | Selector          | Where it renders          |
 * | ----------------- | ------------------------- |
 * | `[sdTitle]`       | Header title area.        |
 * | `[sdBody]`        | Scrollable content area.  |
 * | `[sdFooterLeft]`  | Footer left action group. |
 * | `[sdFooterRight]` | Footer right action group.|
 *
 * Header, body and footer only render while the panel is open.
 *
 * ### Panel stacking
 * The panel is portalled onto `document.body` (via `CdkPortal` + `DomPortalOutlet`), so laying panels
 * out is a concern shared by all live instances rather than by a single view. Arrangement is scoped
 * through the root-provided `SdModalResizableRegistry`: each instance registers its panel id on
 * construction and unregisters it on destroy. `open`, `close`, `minimize`, `maximize` and
 * `toggleMaximum` re-run the arrangement and rewrite inline `width` / `right` **only on registered,
 * still-mounted panels**, in registration order. Consequences worth knowing:
 * - Markup of your own that happens to carry the `.modal-resizable` class is **not** touched.
 *   (Earlier builds ran `document.querySelectorAll('.modal-resizable')` and rewrote every match.)
 * - A destroyed panel immediately stops taking up a slot for the instances that outlive it.
 * - Panels marked `c-closed`, and expanded panels with no captured `data-width`, are skipped.
 *
 * ### Lifecycle / teardown
 * `open()`, `close()` and the arrangement pass each schedule a short `setTimeout` (100ms / 100ms /
 * 200ms) that mutates DOM. All of them are tracked and cleared in `DestroyRef.onDestroy`, together
 * with unregistering from the registry and destroying the portal view. Destroying the component
 * mid-animation cannot run layout work against a detached panel.
 *
 * ### Anti-patterns
 * - Rendering it inside a scroll container and expecting it to be clipped — it lives on `<body>`.
 * - Reusing the `.modal-resizable` class on your own elements to "join" the stack; register a real
 *   component instead.
 * - Writing inline `width` / `right` on a panel yourself — the next arrangement pass overwrites both.
 *
 * ### Tests
 * `src/modal-resizable.component.spec.ts` — portal attach, open/close/minimize/maximize math,
 * loading, editing, timer teardown, registry scoping. Run:
 * `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include='projects/sdcorejs-angular/components/modal-resizable/src/modal-resizable.component.spec.ts'`
 *
 * ### Related
 * `<sd-modal>` (blocking dialog / bottom-sheet), `<sd-side-drawer>` (single right-side overlay with
 * a body scroll lock), `SdLoadingService` (powers `startLoading()` / `stopLoading()`).
 */
@Component({
  selector: 'sd-modal-resizable',
  templateUrl: './modal-resizable.component.html',
  styleUrl: './modal-resizable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SdIcon, CommonModule, MatDialogModule, MatButtonModule, PortalModule],
})
export class SdModalResizable {
  /** Generated DOM id of the panel element (`I<uuid>`). */
  readonly id = `I${Utilities.generateUuid()}`;
  readonly portal = viewChild.required(CdkPortal);
  /** Marks the panel as editable. Bare attribute = `true`. Default `false`. */
  readonly editable = input<boolean, boolean | ''>(false, { transform: booleanAttribute });
  /** CSS width used while the panel is expanded (not a minimum). Default `'480px'`. */
  readonly width = input<string>('480px');
  /** Emitted by `toggleEditable()` with the new editing state. */
  readonly sdEditingChanged = output<boolean>();
  #embeddedViewRef!: EmbeddedViewRef<any>;
  readonly #ref = inject(ChangeDetectorRef);
  readonly #loadingService = inject(SdLoadingService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #registry = inject(SdModalResizableRegistry);
  // why: open/close/#arrangePanels đều hẹn setTimeout thao tác DOM. Gom id vào một set để
  // onDestroy clear sạch, tránh callback chạy trên portal đã tháo (element không còn, hoặc tệ
  // hơn: element của instance khác vừa tái sử dụng id).
  readonly #timers = new Set<ReturnType<typeof setTimeout>>();
  // Trạng thái panel — đọc được từ ngoài (template/consumer), chỉ component tự ghi.
  readonly isEditing = signal(false);
  readonly isOpened = signal(false);
  readonly isHover = signal(false);
  readonly isLoading = signal(false);
  readonly isMinimum = signal(false);
  readonly isMaximum = signal(false);

  constructor() {
    this.#registry.register(this.id);

    afterNextRender(() => {
      // why: attachTemplatePortal tạo embedded view từ VCR của chính CdkPortal →
      // KHÔNG cần appRef/injector/document. Chỉ truyền outletElement để tương thích
      // mọi CDK (19 còn slot ComponentFactoryResolver, 20/21 đã bỏ → tránh lệch arg).
      const outlet = new DomPortalOutlet(document.body);
      this.#embeddedViewRef = outlet.attachTemplatePortal(this.portal());
      this.#detectChanges();
    });

    this.#destroyRef.onDestroy(() => {
      this.#registry.unregister(this.id);
      for (const timer of this.#timers) clearTimeout(timer);
      this.#timers.clear();
      this.#embeddedViewRef?.destroy();
    });
  }

  /** setTimeout có theo dõi — huỷ được hàng loạt trong onDestroy. */
  #schedule(callback: () => void, delay: number): void {
    const timer = setTimeout(() => {
      this.#timers.delete(timer);
      callback();
    }, delay);
    this.#timers.add(timer);
  }

  /** Opens the panel, captures its rendered width, and expands it. */
  open = () => {
    this.isOpened.set(true);
    this.#detectChanges();

    const element = this.#getElement();
    if (element && !element.classList.contains('c-minium')) {
      this.#schedule(() => {
        const maximumWidth = element.offsetWidth;
        if (maximumWidth > 0) {
          element.dataset['width'] = maximumWidth.toString();
        }
        element.classList.remove('c-closed');
      }, 100);
    }

    this.maximize();
  };

  /** Collapses the panel to zero width and stops loading. */
  close = () => {
    this.isOpened.set(false);
    this.#detectChanges();
    this.#schedule(() => {
      const element = this.#getElement();
      element?.style.setProperty('width', '0px');
      element?.style.setProperty('right', '0px');
      element?.classList.remove('c-minium');
      element?.classList.add('c-closed');
    }, 100);
    this.stopLoading();

    this.#arrangePanels();
  };

  /** Shrinks the panel to the 300px minimum strip. */
  minimize = () => {
    this.isMinimum.set(true);
    this.#detectChanges();
    this.#arrangePanels();
  };

  /** Restores the panel to its expanded width. */
  maximize = () => {
    this.isMinimum.set(false);
    this.#detectChanges();
    this.#arrangePanels();
  };

  /** Toggles fullscreen (`calc(100% - 16px)`). */
  toggleMaximum = () => {
    this.isMaximum.update(isMaximum => !isMaximum);
    this.#detectChanges();
    this.#arrangePanels();
  };

  /** Drives the scoped loading overlay through `SdLoadingService`. */
  startLoading = () => {
    this.isLoading.set(true);
    this.#detectChanges();
    this.#loadingService.stop(`#${this.id}`);
    this.#loadingService.start(`#${this.id}`);
  };

  /** Stops the scoped loading overlay. */
  stopLoading = () => {
    this.isLoading.set(false);
    this.#detectChanges();
    this.#loadingService.stop(`#${this.id}`);
  };

  /** Flips `isEditing` and emits `editingChanged`. */
  toggleEditable() {
    this.isEditing.update(isEditing => !isEditing);
    this.#detectChanges();
    this.sdEditingChanged.emit(this.isEditing());
  }

  /** Hover state hook bound in the template. */
  onFocus = () => {
    this.isHover.set(true);
  };

  /** Hover state hook bound in the template. */
  onBlur = () => {
    this.isHover.set(false);
  };

  #arrangePanels = () => {
    this.#schedule(() => {
      let totalRight = 0;
      const minimumWidth = 300;
      // why: chỉ xếp chỗ các panel do <sd-modal-resizable> đang sống sở hữu (registry), KHÔNG
      // querySelectorAll('.modal-resizable') toàn document — query đó ghi đè inline width/right
      // lên mọi phần tử trùng class, kể cả markup của component khác không liên quan.
      this.#registry.panels().forEach(item => {
        if (item.classList.contains('c-minium')) {
          item.style.setProperty('width', `${minimumWidth}px`);
          item.style.setProperty('right', `${totalRight}px`);
          totalRight += minimumWidth + 8;
          return;
        }

        if (item.classList.contains('c-closed')) {
          return;
        }

        const expandedWidth = Number.parseInt(item.dataset['width'] || '', 10);
        if (Number.isNaN(expandedWidth)) {
          return;
        }

        if (item.classList.contains('c-fullscreen')) {
          item.style.setProperty('width', 'calc(100% - 16px)');
          item.style.setProperty('right', '8px');
        } else {
          item.style.setProperty('width', `${expandedWidth}px`);
          item.style.setProperty('right', `${totalRight}px`);
        }
        totalRight += expandedWidth + 8;
      });
    }, 200);
  };

  #getElement() {
    return document.getElementById(this.id);
  }

  #detectChanges() {
    this.#ref.markForCheck();
    this.#embeddedViewRef?.detectChanges();
  }
}
