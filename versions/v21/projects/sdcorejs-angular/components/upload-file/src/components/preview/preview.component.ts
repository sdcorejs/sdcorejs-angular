import { Dialog, DialogRef } from '@angular/cdk/dialog';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { sdIsSafeResourceUrl } from '@sdcorejs/angular/utilities/extensions';

import { sdFileExtension, sdFileMeta, sdFileTypeGroup, sdFileTypeSymbol } from '../../helpers/file-type';
import { PreviewFile } from '../../services';

/** Các mức zoom sau "vừa khung" (%). */
const ZOOM_LEVELS = [50, 75, 100, 150, 200, 300, 400];
/** Trạng thái đang tải chỉ hiện sau 150ms để không nháy với file tải nhanh. */
const LOADING_DELAY = 150;

type SdViewerKind = 'image' | 'pdf' | 'other';
type SdViewerStatus = 'loading' | 'loaded' | 'error';

let nextId = 0;

/**
 * Popup xem tệp của `sd-upload-file` (đợt 3 · 4b, design handoff `upload-file.md` mục H2, phương án A): viewer nền tối,
 * top bar theo file, toolbar theo loại file, filmstrip ở đáy, PDF xem inline, có trạng thái đang tải và lỗi.
 *
 * why: CDK `Dialog` chứ không `sd-modal` — sd-modal đổi sang bottom-sheet trên mobile, ép `max-width`, đệm body 80vh, Esc
 * không đóng và focus vào phần tử tab được đầu tiên thay vì stage. Nội bộ, không export.
 */
@Component({
  selector: 'preview',
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, SdTranslatePipe],
})
export class PreviewComponent {
  readonly #dialog = inject(Dialog);
  readonly #injector = inject(Injector);
  readonly #sanitizer = inject(DomSanitizer);
  readonly #i18n = inject(I18nService);

  readonly download = output<PreviewFile>();
  readonly close = output<void>();

  readonly viewer = viewChild.required<TemplateRef<unknown>>('viewer');
  readonly stage = viewChild<ElementRef<HTMLElement>>('stage');
  readonly strip = viewChild<ElementRef<HTMLElement>>('strip');

  readonly nameId = `sd-upload-file-viewer-name-${nextId++}`;
  readonly locale = this.#i18n.locale;

  readonly files = signal<PreviewFile[]>([]);
  readonly index = signal(0);
  readonly current = computed<PreviewFile | undefined>(() => this.files()[this.index()]);
  readonly extension = computed(() => {
    const file = this.current();
    return file ? (file.extension || sdFileExtension(file.fileName) || sdFileExtension(file.src))?.toLowerCase() : undefined;
  });
  readonly name = computed(() => this.current()?.fileName || this.current()?.src || '');
  readonly meta = computed(() => sdFileMeta(this.extension(), this.current()?.fileSize, this.locale()));
  readonly kind = computed<SdViewerKind>(() => {
    const file = this.current();
    if (!file) return 'other';
    if (file.isPreviewImage && (file.previewSrc || file.src || file.file)) return 'image';
    if (this.extension() === 'pdf' && this.url()) return 'pdf';
    return 'other';
  });

  /** Ảnh đang xem: dữ liệu đã đọc của file local (FileReader), hay URL. */
  readonly imageSrc = computed(() => {
    const file = this.current();
    if (!file) return null;
    if (typeof file.previewSrc === 'string') return file.previewSrc;
    return this.url();
  });
  /** URL mở được của file: `src` an toàn, hoặc object URL của file local. */
  readonly url = computed(() => {
    const file = this.current();
    if (!file) return null;
    if (file.src && sdIsSafeResourceUrl(file.src)) return file.src;
    return file.file ? this.#objectUrl(file.file) : null;
  });
  readonly pdfUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.kind() === 'pdf' ? this.url() : null;
    // why: chỉ bỏ qua sanitizer cho URL đã qua `sdIsSafeResourceUrl` (http/https, blob, data ảnh) — iframe cần
    // SafeResourceUrl.
    return url ? this.#sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  readonly status = signal<SdViewerStatus>('loading');
  readonly showLoading = signal(false);
  /** Tăng mỗi lần "Thử lại": dựng lại `<img>` để trình duyệt tải lại `src`. */
  readonly attempt = signal(0);
  readonly #failedThumbs = signal<ReadonlySet<number>>(new Set());

  // ─── Zoom, xoay, kéo ───────────────────────────────────────────────────
  readonly zoom = signal<number | 'fit'>('fit');
  readonly rotation = signal(0);
  readonly pan = signal({ x: 0, y: 0 });
  readonly panning = signal(false);
  readonly #natural = signal<{ width: number; height: number } | null>(null);
  readonly #stageSize = signal({ width: 0, height: 0 });

  /** Kích thước ảnh theo chiều đang xoay. */
  readonly #rotated = computed(() => {
    const natural = this.#natural();
    if (!natural) return null;
    return this.rotation() % 180 === 0 ? natural : { width: natural.height, height: natural.width };
  });
  /** Tỉ lệ "vừa khung" (như `object-fit: contain`). */
  readonly fitScale = computed(() => {
    const size = this.#rotated();
    const stage = this.#stageSize();
    if (!size || !stage.width || !stage.height) return 1;
    return Math.min(stage.width / size.width, stage.height / size.height);
  });
  readonly scale = computed(() => {
    const zoom = this.zoom();
    return zoom === 'fit' ? this.fitScale() : zoom / 100;
  });
  readonly percent = computed(() => Math.round(this.scale() * 100));
  /** Kích thước khung `<img>` (chưa xoay). */
  readonly imageBox = computed(() => {
    const natural = this.#natural();
    const scale = this.scale();
    return natural ? { width: natural.width * scale, height: natural.height * scale } : null;
  });
  readonly imageTransform = computed(() => `translate(${this.pan().x}px, ${this.pan().y}px) rotate(${this.rotation()}deg)`);
  /** Ảnh (đã xoay) lớn hơn stage: kéo để xem phần bị khuất. */
  readonly pannable = computed(() => {
    const size = this.#rotated();
    const stage = this.#stageSize();
    const scale = this.scale();
    return !!size && (size.width * scale > stage.width + 0.5 || size.height * scale > stage.height + 0.5);
  });
  readonly canZoomIn = computed(() => ZOOM_LEVELS.some(level => level > this.percent()));
  readonly canZoomOut = computed(() => this.zoom() !== 'fit');

  #ref?: DialogRef<unknown, unknown>;
  #loadingTimer?: ReturnType<typeof setTimeout>;
  #objectUrls = new Map<File, string>();
  #resize?: ResizeObserver;
  #drag?: { pointerId: number; x: number; y: number; pan: { x: number; y: number } };

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.#ref?.close();
      this.#cleanup();
    });
  }

  // ─── API (giữ nguyên) ──────────────────────────────────────────────────
  /** Danh sách đang xem (tên cũ, chỉ đọc). */
  get previewFiles(): PreviewFile[] {
    return this.files();
  }

  /** Vị trí đang xem (tên cũ, chỉ đọc). */
  get activeIndex(): number {
    return this.index();
  }

  /** Mở popup tại `index` (mặc định 0). Mảng rỗng thì không làm gì. */
  open = async (previewFiles: PreviewFile[] | undefined | null, index?: number) => {
    if (!Array.isArray(previewFiles) || previewFiles.length === 0) return;
    this.files.set(previewFiles);
    this.#failedThumbs.set(new Set());
    this.select(Math.min(Math.max(index ?? 0, 0), previewFiles.length - 1), true);
    if (this.#ref) return;
    this.#ref = this.#dialog.open(this.viewer(), {
      // why: pane phủ cả màn hình, khung viewer tự canh giữa và tự đổi sang full-screen ≤ 600px bằng CSS (cấu hình
      // dialog không có media query). Bấm ra ngoài khung đóng popup — xem `onShellClick`.
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'sd-upload-file-viewer-pane',
      backdropClass: 'cdk-overlay-dark-backdrop',
      autoFocus: '.sd-upload-file-viewer__stage',
      restoreFocus: true,
      ariaLabelledBy: this.nameId,
      injector: this.#injector,
    });
    this.#ref.closed.subscribe(() => {
      this.#ref = undefined;
      this.#cleanup();
      this.close.emit();
    });
    afterNextRender(() => this.#observeStage(), { injector: this.#injector });
  };

  /** Đóng popup. */
  closeViewer = (): void => {
    this.#ref?.close();
  };

  /** Chuyển sang file `index`; không quay vòng ở hai đầu. */
  select = (index: number, force = false): void => {
    const files = this.files();
    if (index < 0 || index >= files.length || (!force && index === this.index())) return;
    this.index.set(index);
    this.zoom.set('fit');
    this.rotation.set(0);
    this.pan.set({ x: 0, y: 0 });
    this.#natural.set(null);
    this.attempt.set(0);
    // why: ô ảnh của field đã báo lỗi (`isImgError`) thì vào thẳng trạng thái lỗi, không chờ `<img>` lỗi lần nữa.
    const kind = this.kind();
    this.#startLoading(kind === 'other' ? 'loaded' : kind === 'image' && this.current()?.isImgError ? 'error' : 'loading');
    afterNextRender(() => this.#centerThumb(), { injector: this.#injector });
  };

  /** Tên cũ: bấm một ô trong dải ảnh. */
  onClickThumbnailImage = (index: number): void => this.select(index);

  /** Tên cũ: file trước (-1) / sau (1). Từ đợt 3 · 4b không quay vòng ở hai đầu. */
  updateCurrentImage = (direction: 1 | -1): void => this.select(this.index() + direction);

  onDownload = (previewFile: PreviewFile | undefined = this.current()): void => {
    if (previewFile) this.download.emit(previewFile);
  };

  onClose = (): void => this.closeViewer();

  openInNewTab = (): void => {
    const url = this.url();
    // why: `url` đã qua `sdIsSafeResourceUrl` hoặc là object URL của chính file local; mở với noopener.
    if (url && typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ─── Zoom ──────────────────────────────────────────────────────────────
  zoomIn = (): void => {
    const next = ZOOM_LEVELS.find(level => level > this.percent());
    if (next) this.#setZoom(next);
  };

  zoomOut = (): void => {
    if (this.zoom() === 'fit') return;
    const previous = [...ZOOM_LEVELS].reverse().find(level => level < this.percent());
    this.#setZoom(!previous || previous <= Math.round(this.fitScale() * 100) ? 'fit' : previous);
  };

  fit = (): void => this.#setZoom('fit');

  rotate = (): void => {
    this.rotation.update(value => (value + 90) % 360);
    this.pan.set({ x: 0, y: 0 });
  };

  // ─── Sự kiện của stage ─────────────────────────────────────────────────
  onImageLoad = (event: Event): void => {
    const image = event.target as HTMLImageElement;
    this.#natural.set({ width: image.naturalWidth || 1, height: image.naturalHeight || 1 });
    this.#measureStage();
    this.#startLoading('loaded');
  };

  onImageError = (): void => this.#startLoading('error');

  onFrameLoad = (): void => this.#startLoading('loaded');

  retry = (): void => {
    this.attempt.update(value => value + 1);
    this.#natural.set(null);
    this.#startLoading('loading');
  };

  onThumbError = (index: number): void => {
    this.#failedThumbs.update(set => new Set(set).add(index));
  };

  thumbFailed = (index: number): boolean => this.#failedThumbs().has(index) || !!this.files()[index]?.isImgError;

  thumbSrc = (file: PreviewFile): string | null =>
    file.isPreviewImage
      ? typeof file.previewSrc === 'string'
        ? file.previewSrc
        : file.src && sdIsSafeResourceUrl(file.src)
          ? file.src
          : null
      : null;

  thumbExtension = (file: PreviewFile): string =>
    (file.extension || sdFileExtension(file.fileName) || sdFileExtension(file.src) || '').toLowerCase();

  readonly symbol = sdFileTypeSymbol;
  readonly group = sdFileTypeGroup;

  // ←/→ file trước/sau; +/= phóng to, - thu nhỏ, 0 vừa khung (chỉ với ảnh). Esc do CDK Dialog đóng.
  onKeydown = (event: KeyboardEvent): void => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('.sd-upload-file-viewer__strip') && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      // Trong filmstrip ←/→ vẫn là đổi file — focus đi theo ô đang chọn.
      event.preventDefault();
      this.select(this.index() + (event.key === 'ArrowRight' ? 1 : -1));
      afterNextRender(() => this.#stripButtons()[this.index()]?.focus(), { injector: this.#injector });
      return;
    }
    const image = this.kind() === 'image' && this.status() === 'loaded';
    switch (event.key) {
      case 'ArrowLeft':
        this.select(this.index() - 1);
        break;
      case 'ArrowRight':
        this.select(this.index() + 1);
        break;
      case '+':
      case '=':
        if (!image) return;
        this.zoomIn();
        break;
      case '-':
        if (!image) return;
        this.zoomOut();
        break;
      case '0':
        if (!image) return;
        this.fit();
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  /** Bấm vào vùng tối quanh khung viewer: đóng. */
  onShellClick = (event: MouseEvent): void => {
    if (event.target === event.currentTarget) this.closeViewer();
  };

  onPointerDown = (event: PointerEvent): void => {
    if (!this.pannable() || event.button !== 0) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.#drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, pan: this.pan() };
    this.panning.set(true);
  };

  onPointerMove = (event: PointerEvent): void => {
    const drag = this.#drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    this.pan.set(this.#clampPan({ x: drag.pan.x + event.clientX - drag.x, y: drag.pan.y + event.clientY - drag.y }));
  };

  onPointerUp = (event: PointerEvent): void => {
    if (this.#drag?.pointerId !== event.pointerId) return;
    this.#drag = undefined;
    this.panning.set(false);
  };

  // ─── Nội bộ ────────────────────────────────────────────────────────────
  #setZoom = (zoom: number | 'fit'): void => {
    this.zoom.set(zoom);
    this.pan.set(this.#clampPan(this.pan()));
  };

  // why: không cho kéo ảnh ra khỏi stage — chỉ trong phần ảnh lớn hơn stage, mỗi phía một nửa.
  #clampPan = (pan: { x: number; y: number }): { x: number; y: number } => {
    const size = this.#rotated();
    const stage = this.#stageSize();
    if (!size) return { x: 0, y: 0 };
    const maxX = Math.max(0, (size.width * this.scale() - stage.width) / 2);
    const maxY = Math.max(0, (size.height * this.scale() - stage.height) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, pan.x)), y: Math.min(maxY, Math.max(-maxY, pan.y)) };
  };

  #startLoading = (status: SdViewerStatus): void => {
    clearTimeout(this.#loadingTimer);
    this.status.set(status);
    this.showLoading.set(false);
    if (status === 'loading') {
      this.#loadingTimer = setTimeout(() => {
        if (this.status() === 'loading') this.showLoading.set(true);
      }, LOADING_DELAY);
    }
  };

  #objectUrl = (file: File): string | null => {
    if (typeof URL === 'undefined' || !URL.createObjectURL) return null;
    let url = this.#objectUrls.get(file);
    if (!url) {
      url = URL.createObjectURL(file);
      this.#objectUrls.set(file, url);
    }
    return url;
  };

  #observeStage = (): void => {
    const stage = this.stage()?.nativeElement;
    if (!stage || this.#resize) return;
    this.#measureStage();
    if (typeof ResizeObserver === 'undefined') return;
    this.#resize = new ResizeObserver(() => this.#measureStage());
    this.#resize.observe(stage);
  };

  // Vùng ảnh = stage trừ đệm (24px trên dưới, 72px hai bên cho nút điều hướng).
  #measureStage = (): void => {
    const stage = this.stage()?.nativeElement;
    if (!stage) return;
    const style = getComputedStyle(stage);
    const width = stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height = stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    this.#stageSize.set({ width: Math.max(0, width), height: Math.max(0, height) });
  };

  #stripButtons = (): HTMLElement[] =>
    Array.from(this.strip()?.nativeElement.querySelectorAll<HTMLElement>('.sd-upload-file-viewer__thumb') ?? []);

  // why: cuộn filmstrip để ô đang chọn nằm giữa bằng `scrollTo` của chính filmstrip — `scrollIntoView` cuộn cả trang.
  #centerThumb = (): void => {
    const strip = this.strip()?.nativeElement;
    const thumb = this.#stripButtons()[this.index()];
    if (!strip || !thumb) return;
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    strip.scrollTo({ left: thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  };

  #cleanup = (): void => {
    clearTimeout(this.#loadingTimer);
    this.#resize?.disconnect();
    this.#resize = undefined;
    this.#drag = undefined;
    for (const url of this.#objectUrls.values()) URL.revokeObjectURL(url);
    this.#objectUrls.clear();
  };
}
