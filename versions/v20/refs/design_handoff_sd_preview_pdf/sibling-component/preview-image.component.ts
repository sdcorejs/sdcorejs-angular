import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnDestroy,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import * as uuid from 'uuid';
import {
  NormalizedImage,
  PreviewItem,
  PreviewStage,
  ThumbnailPosition,
} from './preview-image.types';

@Component({
  selector: 'sd-preview-image',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  templateUrl: './preview-image.component.html',
  styleUrl: './preview-image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // WHY tabindex='0': host phải focusable để @HostListener('keydown') nhận event
  // mà không cần bind document. Consumer (modal/drawer/page) chỉ cần thả component
  // vào DOM — keyboard shortcut tự hoạt động khi component hoặc descendant đang focus.
  host: {
    tabindex: '0',
    class: 'sd-preview-image-host',
    '[class.sd-preview-image-host--fullscreen]': 'isFullscreen()',
  },
})
export class SdPreviewImage implements OnDestroy {
  // ==========================================
  // CONSTANTS
  // ==========================================
  // Zoom giới hạn theo handoff: stage hiển thị từ 25% → 400% là dải hữu dụng.
  // Ngoài dải này ảnh hoặc quá nhỏ để thao tác hoặc đã pixelated nặng.
  static readonly MIN_ZOOM = 0.25;
  static readonly MAX_ZOOM = 4;
  static readonly ZOOM_STEP = 0.1;
  static readonly SWIPE_THRESHOLD = 40;

  // ==========================================
  // DI
  // ==========================================
  readonly #hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #destroyRef = inject(DestroyRef);

  // ==========================================
  // INPUTS (signal-based, Angular 19 style)
  // ==========================================
  // Declarative items input — consumer drives state. Mỗi lần items() đổi,
  // effect() bên dưới sẽ normalize + load lại danh sách.
  readonly items = input<PreviewItem[]>([]);
  readonly title = input<string | undefined>(undefined);
  readonly thumbnailPosition = input<ThumbnailPosition>('bottom');
  readonly showToolbar = input(true);
  readonly allowDownload = input(true);
  readonly allowZoom = input(true);
  readonly loop = input(true);
  readonly startIndex = input(0);

  // ==========================================
  // OUTPUTS
  // ==========================================
  // `close`: user requested dismissal (X button hoặc Esc). Consumer tự quyết
  // định đóng modal / điều hướng / hide section.
  readonly close = output<void>();
  readonly activeIndexChange = output<number>();
  readonly download = output<{ index: number; item: NormalizedImage }>();
  readonly imageError = output<{ index: number; reason: string }>();

  // ==========================================
  // STATE (signals)
  // ==========================================
  readonly #activeIndex = signal(0);
  readonly #images = signal<NormalizedImage[]>([]);
  readonly #zoom = signal(1);
  readonly #rotation = signal(0);
  readonly #pan = signal({ x: 0, y: 0 });
  readonly #stage = signal<PreviewStage>('empty');
  readonly #isFullscreen = signal(false);
  readonly #isDragging = signal(false);

  // Track every blob URL we created so we can revoke on destroy / re-normalize.
  // CDN strings hoá ra File→blob URL nội bộ — bắt buộc phải revoke để không leak.
  readonly #ownedBlobUrls = new Set<string>();

  // Token chống race: nếu items() đổi liên tiếp (user click rất nhanh) thì
  // promise normalize của lần trước phải bị bỏ qua khi resolve.
  #loadToken = 0;

  // Pointer state for drag/pinch — không cần signal vì không drive template.
  #dragStart: { x: number; y: number; panX: number; panY: number } | null = null;
  #swipeStart: { x: number; y: number; t: number } | null = null;
  readonly #activePointers = new Map<number, { x: number; y: number }>();
  #pinchStartDistance = 0;
  #pinchStartZoom = 1;

  // ==========================================
  // COMPUTED (template-readable)
  // ==========================================
  readonly activeIndex = this.#activeIndex.asReadonly();
  readonly images = this.#images.asReadonly();
  readonly zoom = this.#zoom.asReadonly();
  readonly rotation = this.#rotation.asReadonly();
  readonly pan = this.#pan.asReadonly();
  readonly stage = this.#stage.asReadonly();
  readonly isFullscreen = this.#isFullscreen.asReadonly();

  readonly activeImage = computed<NormalizedImage | undefined>(
    () => this.#images()[this.#activeIndex()],
  );
  readonly hasPrev = computed(() => {
    const len = this.#images().length;
    return len > 1 && (this.loop() || this.#activeIndex() > 0);
  });
  readonly hasNext = computed(() => {
    const len = this.#images().length;
    return len > 1 && (this.loop() || this.#activeIndex() < len - 1);
  });
  readonly zoomPercent = computed(() => Math.round(this.#zoom() * 100));

  // Transform style cho ảnh stage. WHY: gom translate/scale/rotate vào 1 string
  // duy nhất để OnPush phát hiện thay đổi qua signal kéo theo computed.
  readonly imageTransform = computed(() => {
    const p = this.#pan();
    const z = this.#zoom();
    const r = this.#rotation();
    return `translate(${p.x}px, ${p.y}px) scale(${z}) rotate(${r}deg)`;
  });

  readonly shellClass = computed(() => {
    const pos = this.thumbnailPosition();
    return {
      'sd-preview-shell': true,
      [`sd-preview-shell--pos-${pos}`]: true,
      'sd-preview-shell--fullscreen': this.#isFullscreen(),
    };
  });

  // ==========================================
  // CONSTRUCTOR — declarative wiring
  // ==========================================
  constructor() {
    // Reactive normalize: mỗi lần items() đổi → revoke blob cũ → load mới.
    // WHY effect không async: effect() callback không hỗ trợ async cleanup,
    // dùng token-based race guard trong #normalizeAndLoad để bỏ qua kết quả cũ.
    effect(() => {
      const list = this.items();
      const start = this.startIndex();
      this.#normalizeAndLoad(list, start);
    });

    // Auto-focus host sau lần render đầu để keyboard hoạt động ngay.
    // WHY: nếu consumer KHÔNG bọc trong modal, không có ai focus giúp.
    // Consumer bọc modal sẽ tự focus trap riêng — focus() này vô hại (no-op
    // nếu element không visible).
    afterNextRender(() => {
      try {
        this.#hostEl.nativeElement.focus({ preventScroll: true });
      } catch {
        // ignore — focus() can throw on detached/hidden elements.
      }
    });

    // Cleanup khi component bị destroy.
    this.#destroyRef.onDestroy(() => {
      this.#revokeAllBlobs();
      if (document.fullscreenElement === this.#hostEl.nativeElement) {
        // Tránh để fullscreen "treo" khi component bị huỷ giữa chừng.
        document.exitFullscreen?.().catch(() => undefined);
      }
    });
  }

  // ==========================================
  // LIFECYCLE
  // ==========================================
  ngOnDestroy(): void {
    // Giữ ngOnDestroy để vẫn tương thích với khai báo `implements OnDestroy`.
    // Logic dọn dẹp đã được dời sang DestroyRef.onDestroy ở constructor để có
    // thể chia sẻ với effect() teardown nếu cần sau này.
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  onClickThumbnailImage(index: number): void {
    if (index < 0 || index >= this.#images().length) return;
    if (index === this.#activeIndex()) return;
    this.#setActive(index);
  }

  updateCurrentImage(direction: 1 | -1): void {
    const len = this.#images().length;
    if (len <= 1) return;
    const next = this.#activeIndex() + direction;
    let target: number;
    if (this.loop()) {
      target = (next + len) % len;
    } else {
      if (next < 0 || next >= len) return;
      target = next;
    }
    this.#setActive(target);
  }

  zoomIn(): void {
    if (!this.allowZoom()) return;
    this.#setZoom(this.#zoom() + SdPreviewImage.ZOOM_STEP);
  }

  zoomOut(): void {
    if (!this.allowZoom()) return;
    this.#setZoom(this.#zoom() - SdPreviewImage.ZOOM_STEP);
  }

  fitToScreen(): void {
    this.#resetTransform();
  }

  rotate(direction: 'left' | 'right'): void {
    const delta = direction === 'right' ? 90 : -90;
    // Wrap về [0, 360) cho gọn — không strictly cần thiết về mặt visual.
    this.#rotation.update(r => ((r + delta) % 360 + 360) % 360);
  }

  downloadCurrent(): void {
    if (!this.allowDownload()) return;
    const img = this.activeImage();
    if (!img || img.error) return;
    // Ưu tiên CDN URL nếu có để tận dụng Content-Disposition của server,
    // fallback về blob URL khi user upload File trực tiếp.
    const href = img.url || img.blobUrl;
    const a = document.createElement('a');
    a.href = href;
    a.download = img.name || 'image';
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.download.emit({ index: this.#activeIndex(), item: img });
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      // Fullscreen the host element directly. WHY: component giờ tự chứa
      // toàn bộ chrome — không còn modal overlay nào cần "thoát ra" như v2.
      const target = this.#hostEl.nativeElement;
      target.requestFullscreen?.()
        .then(() => this.#isFullscreen.set(true))
        .catch(() => undefined);
    } else {
      document.exitFullscreen?.()
        .then(() => this.#isFullscreen.set(false))
        .catch(() => undefined);
    }
  }

  /** Retry just the active image (Artboard G action). */
  async retryActive(): Promise<void> {
    const idx = this.#activeIndex();
    const img = this.#images()[idx];
    if (!img || !img.url) return;
    this.#stage.set('loading');
    const refreshed = await this.#normalize(img.url, { name: img.name, caption: img.caption, alt: img.alt });
    if (refreshed) {
      // Trao đổi nguyên record để giữ id thumbnail (avoid track-by reset).
      this.#images.update(arr => {
        const next = [...arr];
        // Revoke blob cũ TRƯỚC khi thay để không leak record vừa fail tải.
        if (this.#ownedBlobUrls.has(arr[idx].blobUrl)) {
          URL.revokeObjectURL(arr[idx].blobUrl);
          this.#ownedBlobUrls.delete(arr[idx].blobUrl);
        }
        next[idx] = { ...refreshed, id: img.id };
        return next;
      });
      this.#stage.set(refreshed.error ? 'error' : 'ready');
    } else {
      this.#stage.set('error');
    }
  }

  /** User clicked the X button — emit close intent for the consumer to react. */
  requestClose(): void {
    this.close.emit();
  }

  // ==========================================
  // KEYBOARD — bound to HOST (not document)
  // ==========================================
  // WHY @HostListener('keydown') on host: component có tabindex=0 nên nhận được
  // keyboard event khi nó hoặc descendant đang focused. Không bind document để
  // tránh "cướp" phím tắt của các phần khác trong app khi component không hoạt động.
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Bỏ qua khi user đang gõ trong input — toolbar / overlay có thể chứa
    // input ẩn (search), không muốn ← → cướp event của họ.
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.updateCurrentImage(-1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.updateCurrentImage(1);
        break;
      case 'Escape':
        // Esc = consumer-controlled dismiss intent. Component KHÔNG tự đóng modal —
        // nó không biết mình có nằm trong modal hay không.
        event.preventDefault();
        this.requestClose();
        break;
      case '+':
      case '=':
        if (this.allowZoom()) {
          event.preventDefault();
          this.zoomIn();
        }
        break;
      case '-':
        if (this.allowZoom()) {
          event.preventDefault();
          this.zoomOut();
        }
        break;
      case '0':
        event.preventDefault();
        this.fitToScreen();
        break;
      case 'r':
        event.preventDefault();
        this.rotate('right');
        break;
      case 'R':
        event.preventDefault();
        this.rotate('left');
        break;
      case 'f':
        event.preventDefault();
        this.toggleFullscreen();
        break;
      case 'd':
        if (this.allowDownload()) {
          event.preventDefault();
          this.downloadCurrent();
        }
        break;
    }
  }

  // ==========================================
  // MOUSE / POINTER HANDLERS (template-bound)
  // ==========================================
  onWheel(event: WheelEvent): void {
    if (!this.allowZoom()) return;
    event.preventDefault();
    // deltaY < 0 nghĩa là cuộn lên = zoom in (giống Google Photos / macOS Preview).
    const factor = event.deltaY < 0 ? 1 + SdPreviewImage.ZOOM_STEP : 1 - SdPreviewImage.ZOOM_STEP;
    this.#setZoom(this.#zoom() * factor);
  }

  onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    (event.target as Element).setPointerCapture?.(event.pointerId);
    this.#activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.#activePointers.size === 2) {
      // Bắt đầu pinch — khoá zoom hiện tại làm anchor.
      const pts = [...this.#activePointers.values()];
      this.#pinchStartDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      this.#pinchStartZoom = this.#zoom();
      this.#dragStart = null;
      this.#swipeStart = null;
      return;
    }

    if (this.#zoom() > 1) {
      // Đã zoom → pointer drag = pan, không phải swipe.
      this.#isDragging.set(true);
      this.#dragStart = {
        x: event.clientX,
        y: event.clientY,
        panX: this.#pan().x,
        panY: this.#pan().y,
      };
    } else {
      // Ở mức 100% → pointer drag được coi là swipe sang ảnh kế.
      this.#swipeStart = { x: event.clientX, y: event.clientY, t: performance.now() };
    }
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.#activePointers.has(event.pointerId)) return;
    this.#activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.#activePointers.size === 2 && this.allowZoom() && this.#pinchStartDistance > 0) {
      const pts = [...this.#activePointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ratio = dist / this.#pinchStartDistance;
      this.#setZoom(this.#pinchStartZoom * ratio);
      return;
    }

    if (this.#dragStart && this.#zoom() > 1) {
      const dx = event.clientX - this.#dragStart.x;
      const dy = event.clientY - this.#dragStart.y;
      this.#pan.set({ x: this.#dragStart.panX + dx, y: this.#dragStart.panY + dy });
    }
  }

  onPointerUp(event: PointerEvent): void {
    const start = this.#swipeStart;
    this.#activePointers.delete(event.pointerId);

    if (this.#activePointers.size < 2) {
      this.#pinchStartDistance = 0;
    }

    if (this.#dragStart) {
      this.#dragStart = null;
      this.#isDragging.set(false);
    }

    // Detect swipe — chỉ khi đang ở fit/100% và di chuyển ngang đủ xa.
    if (start && this.#zoom() <= 1) {
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.abs(dx) >= SdPreviewImage.SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
        this.updateCurrentImage(dx < 0 ? 1 : -1);
      }
    }
    this.#swipeStart = null;
  }

  onPointerCancel(event: PointerEvent): void {
    this.#activePointers.delete(event.pointerId);
    this.#dragStart = null;
    this.#swipeStart = null;
    this.#isDragging.set(false);
    if (this.#activePointers.size < 2) {
      this.#pinchStartDistance = 0;
    }
  }

  onImageDblClick(): void {
    if (!this.allowZoom()) return;
    if (this.#zoom() === 1) {
      this.#setZoom(2);
    } else {
      this.#resetTransform();
    }
  }

  onImageError(): void {
    const idx = this.#activeIndex();
    const img = this.#images()[idx];
    if (!img) return;
    this.#images.update(arr => {
      const next = [...arr];
      next[idx] = { ...img, error: true, loading: false };
      return next;
    });
    this.#stage.set('error');
    this.imageError.emit({ index: idx, reason: 'render-failed' });
  }

  trackByImage(_i: number, item: NormalizedImage): string {
    return item.id;
  }

  formatBytes(bytes: number): string {
    if (!bytes || bytes < 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  // ==========================================
  // INTERNALS
  // ==========================================
  async #normalizeAndLoad(items: PreviewItem[] | null | undefined, startIndex: number): Promise<void> {
    const token = ++this.#loadToken;

    // Revoke trước khi map mới — items() đổi liên tiếp sẽ leak nếu không.
    this.#revokeAllBlobs();
    this.#resetTransform();

    if (!Array.isArray(items) || items.length === 0) {
      this.#images.set([]);
      this.#activeIndex.set(0);
      this.#stage.set('empty');
      return;
    }

    this.#activeIndex.set(Math.max(0, Math.min(startIndex ?? 0, items.length - 1)));
    this.#stage.set('loading');

    const normalized = await Promise.all(items.map(item => this.#normalize(item)));

    // Race guard: nếu items() đã đổi trong lúc await thì kết quả này là stale.
    // Lưu ý: blob URL của batch này đã add vào #ownedBlobUrls — batch mới sẽ
    // revoke chúng khi nó cũng vào #normalizeAndLoad.
    if (token !== this.#loadToken) {
      return;
    }

    const valid = normalized.filter((img): img is NormalizedImage => img !== null);
    this.#images.set(valid);
    if (valid.length === 0) {
      this.#stage.set('empty');
    } else {
      const idx = Math.min(this.#activeIndex(), valid.length - 1);
      this.#activeIndex.set(idx);
      const current = valid[idx];
      this.#stage.set(current.error ? 'error' : 'ready');
    }
  }

  #setActive(index: number): void {
    this.#activeIndex.set(index);
    this.#resetTransform();
    const img = this.#images()[index];
    this.#stage.set(img?.error ? 'error' : 'ready');
    this.activeIndexChange.emit(index);
    // Auto-scroll thumbnail strip — đợi 1 microtask để DOM rendered xong.
    // WHY scoped query: thumbnail id là global ('sd-preview-thumb-N'); nếu có
    // > 1 instance trên page sẽ collide. Query trong nativeElement để isolate.
    queueMicrotask(() => {
      const el = this.#hostEl.nativeElement.querySelector(`#sd-preview-thumb-${index}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  }

  #setZoom(value: number): void {
    const clamped = Math.min(SdPreviewImage.MAX_ZOOM, Math.max(SdPreviewImage.MIN_ZOOM, value));
    this.#zoom.set(clamped);
    if (clamped <= 1) {
      // Khi về fit/100% — pan không còn ý nghĩa, reset để không bị "lệch" khi
      // zoom lại lần sau.
      this.#pan.set({ x: 0, y: 0 });
    }
  }

  #resetTransform(): void {
    this.#zoom.set(1);
    this.#rotation.set(0);
    this.#pan.set({ x: 0, y: 0 });
  }

  #revokeAllBlobs(): void {
    for (const url of this.#ownedBlobUrls) {
      URL.revokeObjectURL(url);
    }
    this.#ownedBlobUrls.clear();
  }

  async #normalize(
    item: PreviewItem,
    override?: { name?: string; caption?: string; alt?: string },
  ): Promise<NormalizedImage | null> {
    try {
      if (typeof item === 'string') {
        return await this.#fromUrl(item, override);
      }
      if (item instanceof File) {
        return this.#fromFile(item, override);
      }
      if (item && typeof item === 'object') {
        // Object form: chấp nhận file hoặc url, ưu tiên file vì không cần network.
        if (item.file) {
          return this.#fromFile(item.file, { name: item.name, caption: item.caption, alt: item.alt });
        }
        if (item.url) {
          return await this.#fromUrl(item.url, {
            name: item.name,
            caption: item.caption,
            alt: item.alt,
          });
        }
      }
      return null;
    } catch (err) {
      console.error('[sd-preview-image] normalize failed', err);
      return null;
    }
  }

  async #fromUrl(
    url: string,
    override?: { name?: string; caption?: string; alt?: string },
  ): Promise<NormalizedImage> {
    const id = uuid.v4();
    // Lấy filename từ phần path cuối — bỏ query string.
    const baseSrc = url.split('?')[0];
    const inferredName = override?.name || baseSrc.substring(baseSrc.lastIndexOf('/') + 1) || 'image';
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const file = new File([blob], inferredName, { type: blob.type });
      const blobUrl = URL.createObjectURL(file);
      this.#ownedBlobUrls.add(blobUrl);
      return {
        id,
        url,
        blobUrl,
        name: inferredName,
        size: file.size,
        caption: override?.caption,
        alt: override?.alt,
        loading: false,
        error: false,
      };
    } catch {
      // Vẫn trả về record để Artboard G có thể hiển thị Retry — error=true sẽ
      // được stage signal chuyển sang trạng thái lỗi khi đây là active image.
      return {
        id,
        url,
        blobUrl: '',
        name: inferredName,
        size: 0,
        caption: override?.caption,
        alt: override?.alt,
        loading: false,
        error: true,
      };
    }
  }

  #fromFile(
    file: File,
    override?: { name?: string; caption?: string; alt?: string },
  ): NormalizedImage | null {
    if (!file.type.startsWith('image/')) {
      // Silently filter — handoff yêu cầu non-image File bị drop yên lặng để
      // tương thích với upload form nơi user trộn lẫn ảnh và tài liệu.
      return null;
    }
    const blobUrl = URL.createObjectURL(file);
    this.#ownedBlobUrls.add(blobUrl);
    return {
      id: uuid.v4(),
      blobUrl,
      name: override?.name || file.name,
      size: file.size,
      caption: override?.caption,
      alt: override?.alt,
      loading: false,
      error: false,
    };
  }
}
