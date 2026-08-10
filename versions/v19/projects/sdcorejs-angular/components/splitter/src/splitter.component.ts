import {
  afterNextRender,
  booleanAttribute,
  Component,
  ComponentRef,
  computed,
  contentChildren,
  createComponent,
  DestroyRef,
  effect,
  ElementRef,
  EnvironmentInjector,
  inject,
  Injector,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { SdSplitterHandleComponent } from './splitter-handle/splitter-handle.component';
import { SdSplitterPanelComponent } from './splitter-panel/splitter-panel.component';
import { ResolvedPanelMeta, SdSplitterOption, SplitterLayoutState, SplitterOrientation } from './splitter.models';
import { SplitterStateService } from './splitter-state.service';
import { SdStorageService } from '@sdcorejs/angular/services/storage';

@Component({
  selector: 'sd-splitter',
  standalone: true,
  templateUrl: './splitter.component.html',
  styleUrl: './splitter.component.scss',
  providers: [SplitterStateService],
  host: {
    class: 'sd-splitter',
    '[class.sd-splitter--horizontal]': 'resolvedOrientation() === "horizontal"',
    '[class.sd-splitter--vertical]': 'resolvedOrientation() === "vertical"',
    '[class.sd-splitter--disabled]': 'resolvedDisabled()',
  },
})
export class SdSplitterComponent {
  #host = inject<ElementRef<HTMLElement>>(ElementRef);
  // EnvironmentInjector: dùng cho createComponent (cần injector tree). Lifetime application-scope.
  #envInjector = inject(EnvironmentInjector);
  // Component-scoped Injector: gắn DestroyRef của component → afterNextRender callback tự cancel khi destroy
  #injector = inject(Injector);
  #destroyRef = inject(DestroyRef);
  #state = inject(SplitterStateService);
  #storage = inject(SdStorageService);

  #storageHandle = computed(() => {
    const key = this.resolvedStorageKey();
    return key ? this.#storage.create<SplitterLayoutState>(key) : null;
  });

  option = input<SdSplitterOption | undefined>(undefined);
  orientation = input<SplitterOrientation>('horizontal');
  disabled = input(false, { transform: booleanAttribute });
  storageKey = input<string | undefined>(undefined);
  snapThreshold = input<number, unknown>(0.5, { transform: numberAttribute });
  keyboardStep = input<number, unknown>(10, { transform: numberAttribute });

  resolvedOrientation = computed(() => this.option()?.orientation ?? this.orientation());
  resolvedDisabled = computed(() => this.option()?.disabled ?? this.disabled());
  resolvedStorageKey = computed(() => this.option()?.storageKey ?? this.storageKey());
  resolvedSnapThreshold = computed(() => this.option()?.snapThreshold ?? this.snapThreshold());
  resolvedKeyboardStep = computed(() => this.option()?.keyboardStep ?? this.keyboardStep());

  readonly resizeEnd = output<SplitterLayoutState>();
  readonly collapsedChange = output<{ panelId: string | number; collapsed: boolean }>();
  readonly layoutChange = output<SplitterLayoutState>();

  readonly panels = contentChildren(SdSplitterPanelComponent);

  #handleRefs: ComponentRef<SdSplitterHandleComponent>[] = [];

  #dragStartSize: { handleIndex: number; containerPx: number } | null = null;
  #dragLastDelta = 0;
  #prevCollapsedMap = new Map<string | number, boolean>();
  // Lật true sau lần render đầu → effect sync handle mới được phép chạm DOM.
  #firstRenderDone = signal(false);

  constructor() {
    // 1. Reconcile state khi panels signal đổi (panel add/remove qua @if/@for)
    effect(() => {
      const panels = this.panels();
      const stored = this.#storageHandle()?.get() ?? null;
      const metas = panels.map((p, i) => this.#toMeta(p, i));
      this.#state.reconcile(metas, stored);
    });

    // Auto-save vào storage khi committedLayout đổi (only commit triggers, không phải live drag)
    effect(() => {
      const layout = this.#state.committedLayout();
      const handle = this.#storageHandle();
      if (handle && layout.panels.length > 0) {
        handle.setSilent(layout); // setSilent: không emit qua storage subject
      }
    });

    // Emit layoutChange + collapsedChange (diff) khi committedLayout đổi
    effect(() => {
      const layout = this.#state.committedLayout();
      if (layout.panels.length === 0) return;
      this.option()?.onLayoutChange?.(layout);
      this.layoutChange.emit(layout);

      // Detect collapsed change qua diff với prev map
      const currMap = this.#state.collapsedMap();
      for (const [id, isCollapsed] of currMap) {
        const prev = this.#prevCollapsedMap.get(id) ?? false;
        if (prev !== isCollapsed) {
          const event = { panelId: id, collapsed: isCollapsed };
          this.option()?.onCollapsedChange?.(event);
          this.collapsedChange.emit(event);
        }
      }
      this.#prevCollapsedMap = new Map(currMap);
    });

    // 2. Apply flex style lên panel host element dựa trên liveSizes + collapsedMap.
    // Normalize flex-grow của các panel flex để sum = 1 → CSS phân phối hết free space.
    // Nếu để raw weight (vd 0.7), sum < 1 → flexbox để lại khoảng trống bên rìa.
    effect(() => {
      const sizes = this.#state.liveSizes();
      const collapsed = this.#state.collapsedMap();
      const panels = this.panels();

      // Tính tổng weight của panel flex đang không collapsed (để normalize)
      let totalFlexWeight = 0;
      for (let i = 0; i < panels.length; i++) {
        const panel = panels[i];
        const id = panel.panelId() ?? i;
        if (panel.unit() === 'flex' && !collapsed.get(id)) {
          totalFlexWeight += sizes.get(id) ?? 1;
        }
      }

      for (let i = 0; i < panels.length; i++) {
        const panel = panels[i];
        const id = panel.panelId() ?? i;
        const isCollapsed = collapsed.get(id) === true;
        const size = sizes.get(id) ?? 1;
        let flex: string;
        if (isCollapsed) {
          flex = '0 0 0';
        } else if (panel.unit() === 'px') {
          flex = `0 0 ${size}px`;
        } else {
          // Normalize: grow = weight / totalWeight → sum(grow) = 1
          const grow = totalFlexWeight > 0 ? size / totalFlexWeight : 1;
          flex = `${grow} 1 0`;
        }
        panel.elementRef.nativeElement.style.flex = flex;
      }
    });

    // Sync handles sau khi DOM render xong (panels đã projected vào host).
    // why: afterNextRender đăng ký BÊN TRONG effect() sẽ tạo MỘT hook one-shot mới cho MỖI lần
    // panels/orientation/disabled/keyboardStep tick — cùng với đó là một sequence + một
    // DestroyRef.onDestroy mới xếp hàng trong AfterRenderManager. Đăng ký ĐÚNG MỘT lần ở
    // constructor (chỉ để mở cổng sau lần render đầu), rồi đọc reactive value trong effect.
    afterNextRender(() => this.#firstRenderDone.set(true), { injector: this.#injector });

    effect(() => {
      const panelCount = this.panels().length;
      const orientation = this.resolvedOrientation();
      const disabled = this.resolvedDisabled();
      const keyboardStep = this.resolvedKeyboardStep();
      // Lần CD đầu tiên panel chưa render xong → chờ afterNextRender mở cổng rồi effect tự chạy lại.
      if (!this.#firstRenderDone()) return;
      this.#syncHandles(panelCount, orientation, disabled, keyboardStep);
    });

    // Destroy handle ComponentRef khi container bị destroy (tránh leak)
    this.#destroyRef.onDestroy(() => {
      for (const ref of this.#handleRefs) ref.destroy();
      this.#handleRefs = [];
    });
  }

  #toMeta(panel: SdSplitterPanelComponent, index: number): ResolvedPanelMeta {
    return {
      id: panel.panelId() ?? index,
      index,
      unit: panel.unit(),
      minSize: panel.minSize(),
      maxSize: panel.maxSize(),
      collapsible: panel.collapsible(),
      resizable: panel.resizable(),
      declaredSize: panel.size(),
      lastSize: panel.size(),
    };
  }

  #syncHandles(panelCount: number, orientation: SplitterOrientation, disabled: boolean, keyboardStep: number): void {
    const panels = this.panels();
    const needed = Math.max(0, panelCount - 1);
    // Remove excess
    while (this.#handleRefs.length > needed) {
      this.#handleRefs.pop()!.destroy();
    }
    // Create missing + wire events
    while (this.#handleRefs.length < needed) {
      const ref = createComponent(SdSplitterHandleComponent, { environmentInjector: this.#envInjector });
      const handleIndex = this.#handleRefs.length;
      ref.instance.dragStart.subscribe(() => this.#onDragStart(handleIndex));
      ref.instance.dragMove.subscribe(delta => this.#onDragMove(handleIndex, delta));
      ref.instance.dragEnd.subscribe(() => this.#onDragEnd(handleIndex));
      ref.instance.toggleRequest.subscribe(() => this.#onHandleToggle(handleIndex));
      this.#handleRefs.push(ref);
    }
    // Apply inputs với disabled tính theo per-panel resizable
    for (let i = 0; i < this.#handleRefs.length; i++) {
      const ref = this.#handleRefs[i];
      const prev = panels[i];
      const next = panels[i + 1];
      const handleDisabled = disabled || !prev.resizable() || !next.resizable();
      ref.setInput('orientation', orientation);
      ref.setInput('disabled', handleDisabled);
      ref.setInput('keyboardStep', keyboardStep);
      ref.changeDetectorRef.detectChanges();
    }
    // Re-arrange DOM: panel0, handle0, panel1, handle1, ..., panelN
    const host = this.#host.nativeElement;
    for (let i = 0; i < panels.length; i++) {
      host.appendChild(panels[i].elementRef.nativeElement);
      if (i < this.#handleRefs.length) host.appendChild(this.#handleRefs[i].location.nativeElement);
    }
  }

  #onDragStart(handleIndex: number): void {
    const rect = this.#host.nativeElement.getBoundingClientRect();
    const containerPx = this.resolvedOrientation() === 'horizontal' ? rect.width : rect.height;
    this.#dragStartSize = { handleIndex, containerPx };
    this.#dragLastDelta = 0;
    this.#host.nativeElement.classList.add('sd-splitter--dragging');
  }

  #onDragMove(handleIndex: number, deltaSinceStart: number): void {
    if (!this.#dragStartSize) return;
    const incrementalDelta = deltaSinceStart - this.#dragLastDelta;
    const applied = this.#state.applyDelta(handleIndex, incrementalDelta, this.#dragStartSize.containerPx, this.resolvedSnapThreshold());
    // why: chỉ cộng dồn phần delta THỰC SỰ áp được (applyDelta trả về), không phải toàn bộ
    // dịch chuyển con trỏ. Cộng raw pointer delta → overshoot (kéo quá mép/min/collapse) tích
    // lũy thành dead-zone: phải kéo ngược đúng bằng overshoot mới thấy handle nhúc nhích.
    this.#dragLastDelta += applied;
  }

  #onDragEnd(_handleIndex: number): void {
    this.#dragStartSize = null;
    this.#host.nativeElement.classList.remove('sd-splitter--dragging');
    this.#state.commit();
    const layout = this.#state.committedLayout();
    this.option()?.onResizeEnd?.(layout);
    this.resizeEnd.emit(layout);
  }

  #onHandleToggle(handleIndex: number): void {
    // Double-click / Enter / Space — ưu tiên collapse panel collapsible ở phía prev, fallback next
    const panels = this.panels();
    const prev = panels[handleIndex];
    const next = panels[handleIndex + 1];
    const target = prev.collapsible() ? prev : next.collapsible() ? next : null;
    if (!target) return;
    const id = target.panelId() ?? panels.indexOf(target);
    this.#state.togglePanel(id);
    this.#state.commit();
  }

  // --- Imperative API ---

  getLayout(): SplitterLayoutState {
    const metas = this.#state.getPanelMetas();
    const sizes = this.#state.liveSizes();
    const collapsed = this.#state.collapsedMap();
    return {
      v: 1,
      panels: metas.map(m => ({
        id: m.id,
        size: sizes.get(m.id) ?? m.declaredSize,
        unit: m.unit,
        collapsed: collapsed.get(m.id) ?? false,
      })),
    };
  }

  setLayout(state: SplitterLayoutState): void {
    const metas = this.#state.getPanelMetas();
    for (const stored of state.panels) {
      const meta = metas.find(m => m.id === stored.id);
      if (!meta || meta.unit !== stored.unit) continue;
      this.#state.setLiveSize(meta.id, stored.size);
      this.#state.setCollapsed(meta.id, stored.collapsed);
    }
    this.#state.commit();
  }

  resetLayout(): void {
    const metas = this.#state.getPanelMetas();
    for (const m of metas) {
      this.#state.setLiveSize(m.id, m.declaredSize);
      this.#state.setCollapsed(m.id, false);
    }
    this.#state.commit();
  }

  collapse(target: number | string): void {
    const id = this.#resolveTarget(target);
    this.#state.collapsePanel(id);
    this.#state.commit();
  }

  expand(target: number | string): void {
    const id = this.#resolveTarget(target);
    this.#state.expandPanel(id);
    this.#state.commit();
  }

  toggle(target: number | string): void {
    const id = this.#resolveTarget(target);
    this.#state.togglePanel(id);
    this.#state.commit();
  }

  resizePanel(target: number | string, size: number): void {
    const id = this.#resolveTarget(target);
    const meta = this.#state.getPanelMetas().find(m => m.id === id);
    if (!meta) return;
    let clamped = Math.max(size, meta.minSize);
    if (meta.maxSize != null) clamped = Math.min(clamped, meta.maxSize);
    this.#state.setLiveSize(id, clamped);
    this.#state.commit();
  }

  #resolveTarget(target: number | string): string | number {
    const metas = this.#state.getPanelMetas();
    if (typeof target === 'number') {
      const meta = metas[target] ?? metas.find(m => m.id === target);
      if (!meta) throw new Error(`Splitter: no panel at index ${target}`);
      return meta.id;
    }
    const meta = metas.find(m => m.id === target);
    if (!meta) throw new Error(`Splitter: no panel with id "${target}"`);
    return meta.id;
  }
}
