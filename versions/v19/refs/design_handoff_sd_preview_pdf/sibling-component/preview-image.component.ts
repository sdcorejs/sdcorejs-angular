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
  // WHY tabindex='0': host pháº£i focusable Ä‘á»ƒ @HostListener('keydown') nháº­n event
  // mÃ  khÃ´ng cáº§n bind document. Consumer (modal/drawer/page) chá»‰ cáº§n tháº£ component
  // vÃ o DOM â€” keyboard shortcut tá»± hoáº¡t Ä‘á»™ng khi component hoáº·c descendant Ä‘ang focus.
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
  // Zoom giá»›i háº¡n theo handoff: stage hiá»ƒn thá»‹ tá»« 25% â†’ 400% lÃ  dáº£i há»¯u dá»¥ng.
  // NgoÃ i dáº£i nÃ y áº£nh hoáº·c quÃ¡ nhá» Ä‘á»ƒ thao tÃ¡c hoáº·c Ä‘Ã£ pixelated náº·ng.
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
  // Declarative items input â€” consumer drives state. Má»—i láº§n items() Ä‘á»•i,
  // effect() bÃªn dÆ°á»›i sáº½ normalize + load láº¡i danh sÃ¡ch.
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
  // `close`: user requested dismissal (X button hoáº·c Esc). Consumer tá»± quyáº¿t
  // Ä‘á»‹nh Ä‘Ã³ng modal / Ä‘iá»u hÆ°á»›ng / hide section.
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
  // CDN strings hoÃ¡ ra Fileâ†’blob URL ná»™i bá»™ â€” báº¯t buá»™c pháº£i revoke Ä‘á»ƒ khÃ´ng leak.
  readonly #ownedBlobUrls = new Set<string>();

  // Token chá»‘ng race: náº¿u items() Ä‘á»•i liÃªn tiáº¿p (user click ráº¥t nhanh) thÃ¬
  // promise normalize cá»§a láº§n trÆ°á»›c pháº£i bá»‹ bá» qua khi resolve.
  #loadToken = 0;

  // Pointer state for drag/pinch â€” khÃ´ng cáº§n signal vÃ¬ khÃ´ng drive template.
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

  // Transform style cho áº£nh stage. WHY: gom translate/scale/rotate vÃ o 1 string
  // duy nháº¥t Ä‘á»ƒ OnPush phÃ¡t hiá»‡n thay Ä‘á»•i qua signal kÃ©o theo computed.
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
  // CONSTRUCTOR â€” declarative wiring
  // ==========================================
  constructor() {
    // Reactive normalize: má»—i láº§n items() Ä‘á»•i â†’ revoke blob cÅ© â†’ load má»›i.
    // WHY effect khÃ´ng async: effect() callback khÃ´ng há»— trá»£ async cleanup,
    // dÃ¹ng token-based race guard trong #normalizeAndLoad Ä‘á»ƒ bá» qua káº¿t quáº£ cÅ©.
    effect(() => {
      const list = this.items();
      const start = this.startIndex();
      this.#normalizeAndLoad(list, start);
    });

    // Auto-focus host sau láº§n render Ä‘áº§u Ä‘á»ƒ keyboard hoáº¡t Ä‘á»™ng ngay.
    // WHY: náº¿u consumer KHÃ”NG bá»c trong modal, khÃ´ng cÃ³ ai focus giÃºp.
    // Consumer bá»c modal sáº½ tá»± focus trap riÃªng â€” focus() nÃ y vÃ´ háº¡i (no-op
    // náº¿u element khÃ´ng visible).
    afterNextRender(() => {
      try {
        this.#hostEl.nativeElement.focus({ preventScroll: true });
      } catch {
        // ignore â€” focus() can throw on detached/hidden elements.
      }
    });

    // Cleanup khi component bá»‹ destroy.
    this.#destroyRef.onDestroy(() => {
      this.#revokeAllBlobs();
      if (document.fullscreenElement === this.#hostEl.nativeElement) {
        // TrÃ¡nh Ä‘á»ƒ fullscreen "treo" khi component bá»‹ huá»· giá»¯a chá»«ng.
        document.exitFullscreen?.().catch(() => undefined);
      }
    });
  }

  // ==========================================
  // LIFECYCLE
  // ==========================================
  ngOnDestroy(): void {
    // Giá»¯ ngOnDestroy Ä‘á»ƒ váº«n tÆ°Æ¡ng thÃ­ch vá»›i khai bÃ¡o `implements OnDestroy`.
    // Logic dá»n dáº¹p Ä‘Ã£ Ä‘Æ°á»£c dá»i sang DestroyRef.onDestroy á»Ÿ constructor Ä‘á»ƒ cÃ³
    // thá»ƒ chia sáº» vá»›i effect() teardown náº¿u cáº§n sau nÃ y.
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
    // Wrap vá» [0, 360) cho gá»n â€” khÃ´ng strictly cáº§n thiáº¿t vá» máº·t visual.
    this.#rotation.update(r => ((r + delta) % 360 + 360) % 360);
  }

  downloadCurrent(): void {
    if (!this.allowDownload()) return;
    const img = this.activeImage();
    if (!img || img.error) return;
    // Æ¯u tiÃªn CDN URL náº¿u cÃ³ Ä‘á»ƒ táº­n dá»¥ng Content-Disposition cá»§a server,
    // fallback vá» blob URL khi user upload File trá»±c tiáº¿p.
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
      // Fullscreen the host element directly. WHY: component giá» tá»± chá»©a
      // toÃ n bá»™ chrome â€” khÃ´ng cÃ²n modal overlay nÃ o cáº§n "thoÃ¡t ra" nhÆ° v2.
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
      // Trao Ä‘á»•i nguyÃªn record Ä‘á»ƒ giá»¯ id thumbnail (avoid track-by reset).
      this.#images.update(arr => {
        const next = [...arr];
        // Revoke blob cÅ© TRÆ¯á»šC khi thay Ä‘á»ƒ khÃ´ng leak record vá»«a fail táº£i.
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

  /** User clicked the X button â€” emit close intent for the consumer to react. */
  requestClose(): void {
    this.close.emit();
  }

  // ==========================================
  // KEYBOARD â€” bound to HOST (not document)
  // ==========================================
  // WHY @HostListener('keydown') on host: component cÃ³ tabindex=0 nÃªn nháº­n Ä‘Æ°á»£c
  // keyboard event khi nÃ³ hoáº·c descendant Ä‘ang focused. KhÃ´ng bind document Ä‘á»ƒ
  // trÃ¡nh "cÆ°á»›p" phÃ­m táº¯t cá»§a cÃ¡c pháº§n khÃ¡c trong app khi component khÃ´ng hoáº¡t Ä‘á»™ng.
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Bá» qua khi user Ä‘ang gÃµ trong input â€” toolbar / overlay cÃ³ thá»ƒ chá»©a
    // input áº©n (search), khÃ´ng muá»‘n â† â†’ cÆ°á»›p event cá»§a há».
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
        // Esc = consumer-controlled dismiss intent. Component KHÃ”NG tá»± Ä‘Ã³ng modal â€”
        // nÃ³ khÃ´ng biáº¿t mÃ¬nh cÃ³ náº±m trong modal hay khÃ´ng.
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
    // deltaY < 0 nghÄ©a lÃ  cuá»™n lÃªn = zoom in (giá»‘ng Google Photos / macOS Preview).
    const factor = event.deltaY < 0 ? 1 + SdPreviewImage.ZOOM_STEP : 1 - SdPreviewImage.ZOOM_STEP;
    this.#setZoom(this.#zoom() * factor);
  }

  onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    (event.target as Element).setPointerCapture?.(event.pointerId);
    this.#activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.#activePointers.size === 2) {
      // Báº¯t Ä‘áº§u pinch â€” khoÃ¡ zoom hiá»‡n táº¡i lÃ m anchor.
      const pts = [...this.#activePointers.values()];
      this.#pinchStartDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      this.#pinchStartZoom = this.#zoom();
      this.#dragStart = null;
      this.#swipeStart = null;
      return;
    }

    if (this.#zoom() > 1) {
      // ÄÃ£ zoom â†’ pointer drag = pan, khÃ´ng pháº£i swipe.
      this.#isDragging.set(true);
      this.#dragStart = {
        x: event.clientX,
        y: event.clientY,
        panX: this.#pan().x,
        panY: this.#pan().y,
      };
    } else {
      // á»ž má»©c 100% â†’ pointer drag Ä‘Æ°á»£c coi lÃ  swipe sang áº£nh káº¿.
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

    // Detect swipe â€” chá»‰ khi Ä‘ang á»Ÿ fit/100% vÃ  di chuyá»ƒn ngang Ä‘á»§ xa.
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

    // Revoke trÆ°á»›c khi map má»›i â€” items() Ä‘á»•i liÃªn tiáº¿p sáº½ leak náº¿u khÃ´ng.
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

    // Race guard: náº¿u items() Ä‘Ã£ Ä‘á»•i trong lÃºc await thÃ¬ káº¿t quáº£ nÃ y lÃ  stale.
    // LÆ°u Ã½: blob URL cá»§a batch nÃ y Ä‘Ã£ add vÃ o #ownedBlobUrls â€” batch má»›i sáº½
    // revoke chÃºng khi nÃ³ cÅ©ng vÃ o #normalizeAndLoad.
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
    // Auto-scroll thumbnail strip â€” Ä‘á»£i 1 microtask Ä‘á»ƒ DOM rendered xong.
    // WHY scoped query: thumbnail id lÃ  global ('sd-preview-thumb-N'); náº¿u cÃ³
    // > 1 instance trÃªn page sáº½ collide. Query trong nativeElement Ä‘á»ƒ isolate.
    queueMicrotask(() => {
      const el = this.#hostEl.nativeElement.querySelector(`#sd-preview-thumb-${index}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  }

  #setZoom(value: number): void {
    const clamped = Math.min(SdPreviewImage.MAX_ZOOM, Math.max(SdPreviewImage.MIN_ZOOM, value));
    this.#zoom.set(clamped);
    if (clamped <= 1) {
      // Khi vá» fit/100% â€” pan khÃ´ng cÃ²n Ã½ nghÄ©a, reset Ä‘á»ƒ khÃ´ng bá»‹ "lá»‡ch" khi
      // zoom láº¡i láº§n sau.
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
        // Object form: cháº¥p nháº­n file hoáº·c url, Æ°u tiÃªn file vÃ¬ khÃ´ng cáº§n network.
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
    // Láº¥y filename tá»« pháº§n path cuá»‘i â€” bá» query string.
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
      // Váº«n tráº£ vá» record Ä‘á»ƒ Artboard G cÃ³ thá»ƒ hiá»ƒn thá»‹ Retry â€” error=true sáº½
      // Ä‘Æ°á»£c stage signal chuyá»ƒn sang tráº¡ng thÃ¡i lá»—i khi Ä‘Ã¢y lÃ  active image.
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
      // Silently filter â€” handoff yÃªu cáº§u non-image File bá»‹ drop yÃªn láº·ng Ä‘á»ƒ
      // tÆ°Æ¡ng thÃ­ch vá»›i upload form nÆ¡i user trá»™n láº«n áº£nh vÃ  tÃ i liá»‡u.
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

