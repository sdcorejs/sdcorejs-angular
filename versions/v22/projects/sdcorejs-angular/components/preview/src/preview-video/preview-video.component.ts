import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdUtilities, sdIsSafeResourceUrl } from '@sdcorejs/angular/utilities/extensions';

/** Trạng thái hiển thị của `sd-preview-video`. */
export type SdPreviewVideoStatus = 'empty' | 'loading' | 'ready' | 'error';

/** `MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED` — trình duyệt không phát được định dạng/codec này. */
const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;

/**
 * Xem trước video bằng `<video>` native (có controls, không autoplay).
 *
 * - `source` là URL hoặc `Blob`/`File`. Blob được đổi thành object URL và thu hồi khi đổi nguồn / huỷ.
 * - URL đi qua `sdIsSafeResourceUrl` (D-033): scheme không an toàn thì không gắn vào `<video>`, hiện lỗi.
 * - Lỗi media hiện thông báo i18n kèm nút thử lại; định dạng không hỗ trợ có thông báo riêng.
 * - Tải xuống qua `SdUtilities.download` (cùng guard URL).
 */
@Component({
  selector: 'sd-preview-video',
  standalone: true,
  imports: [SdTranslatePipe],
  templateUrl: './preview-video.component.html',
  styleUrl: './preview-video.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sd-preview-video',
    '[attr.data-autoId]': 'autoId()',
    '[attr.data-status]': 'status()',
  },
})
export class SdPreviewVideo {
  /** URL (http/https, tương đối, `blob:`) hoặc `Blob`/`File` của video. */
  readonly source = input<string | Blob | null | undefined>(null);
  /** Ảnh đại diện hiển thị trước khi phát. Chỉ nhận URL an toàn. */
  readonly poster = input<string | null | undefined>(null);
  /** Tên file khi tải xuống và nhãn của video cho screen reader. */
  readonly fileName = input<string | null | undefined>(null);
  /** Hiện nút tải xuống (mặc định `true`). */
  readonly downloadable = input(true, { transform: booleanAttribute });
  readonly autoIdInput = input<string | null | undefined>(undefined, { alias: 'autoId' });

  /** Phát sau khi người dùng bấm tải xuống và URL qua được guard. */
  readonly download = output<{ fileName: string }>();
  /** Phát khi `<video>` báo lỗi (hoặc URL bị guard từ chối). `null` khi không có `MediaError`. */
  readonly loadError = output<MediaError | null>();

  readonly autoId = computed(() => (this.autoIdInput() ? `components-preview-video-${this.autoIdInput()}` : undefined));
  readonly #childAutoId = (suffix: string): string | undefined => (this.autoId() ? `${this.autoId()}-${suffix}` : undefined);
  readonly autoIdVideo = computed(() => this.#childAutoId('video'));
  readonly autoIdRetry = computed(() => this.#childAutoId('retry'));
  readonly autoIdDownload = computed(() => this.#childAutoId('download'));
  readonly autoIdError = computed(() => this.#childAutoId('error'));

  readonly #src = signal<string | null>(null);
  readonly #status = signal<SdPreviewVideoStatus>('empty');
  readonly #unsupported = signal(false);

  /** URL đang gắn vào `<video>` (object URL khi nguồn là Blob). */
  readonly src = this.#src.asReadonly();
  readonly status = this.#status.asReadonly();
  readonly errorKey = computed(() =>
    this.#unsupported() ? 'core.component.preview-video.unsupported' : 'core.component.preview-video.error'
  );
  readonly safePoster = computed(() => {
    const poster = this.poster();
    return poster && sdIsSafeResourceUrl(poster) ? poster : null;
  });
  readonly canDownload = computed(() => this.downloadable() && !!this.#src());

  // why: viewChild không dùng được với field ES private (#).
  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');

  constructor() {
    effect(onCleanup => {
      const source = this.source();
      this.#unsupported.set(false);
      if (typeof Blob !== 'undefined' && source instanceof Blob) {
        // why: object URL giữ Blob trong bộ nhớ tới khi bị thu hồi — thu hồi ngay khi đổi nguồn hoặc huỷ
        // component, nếu không mỗi lần xem trước để lại một Blob không bao giờ được giải phóng.
        const url = URL.createObjectURL(source);
        this.#src.set(url);
        this.#status.set('loading');
        onCleanup(() => URL.revokeObjectURL(url));
        return;
      }
      if (typeof source === 'string' && source.trim()) {
        if (sdIsSafeResourceUrl(source)) {
          this.#src.set(source);
          this.#status.set('loading');
        } else {
          this.#src.set(null);
          this.#status.set('error');
          this.loadError.emit(null);
        }
        return;
      }
      this.#src.set(null);
      this.#status.set('empty');
    });
  }

  onLoaded(): void {
    if (this.#status() === 'loading') this.#status.set('ready');
  }

  onMediaError(): void {
    const error = this.video()?.nativeElement.error ?? null;
    this.#unsupported.set(error?.code === MEDIA_ERR_SRC_NOT_SUPPORTED);
    this.#status.set('error');
    this.loadError.emit(error);
  }

  /** Nạp lại video sau lỗi (nút "Thử lại"). */
  retry(): void {
    const video = this.video()?.nativeElement;
    if (!video || !this.#src()) return;
    this.#unsupported.set(false);
    this.#status.set('loading');
    video.load();
  }

  downloadFile(): void {
    const href = this.#src();
    if (!this.downloadable() || !href || !sdIsSafeResourceUrl(href)) return;
    const fileName = this.fileName() || 'video';
    SdUtilities.download(href, fileName);
    this.download.emit({ fileName });
  }
}
