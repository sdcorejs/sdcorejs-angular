/**
 * Shape descriptor accepted by SdPreviewImage's `items` signal input.
 *
 * - `string` — CDN/HTTP URL; component will fetch as blob and create a File.
 * - `File` — already-selected file from <input type="file">. Must be `image/*`.
 * - Detailed object — when the caller wants to override name/caption/alt.
 */
export type PreviewItem =
  | string
  | File
  | {
      url?: string;
      file?: File;
      name?: string;
      caption?: string;
      alt?: string;
      mime?: string;
    };

/**
 * Internal normalized record. One per slot in the gallery.
 * `blobUrl` is always set after a successful load so the <img> binding can
 * be uniform; `url` retains the original CDN URL for download fallback.
 */
export interface NormalizedImage {
  id: string;
  url?: string;
  blobUrl: string;
  name: string;
  size: number;
  caption?: string;
  alt?: string;
  loading: boolean;
  error: boolean;
}

/**
 * Stage = the visual state of the main image area inside the viewer shell.
 * Driven by an internal `_stage` signal in the component.
 */
export type PreviewStage = 'ready' | 'loading' | 'error' | 'empty';

/**
 * Where the thumbnail navigator sits relative to the stage. `none` removes
 * thumbnails entirely (single-image lightbox); `dots` swaps the strip for
 * compact dot indicators (≤ 8 images).
 */
export type ThumbnailPosition = 'bottom' | 'right' | 'left' | 'top' | 'dots' | 'none';

/**
 * Color scheme for the preview shell. `'dark'` (default) keeps the original
 * dark-theme tokens (black surfaces, white text). `'light'` flips the token
 * set to white surfaces / dark text — picks up `--sd-primary`, `--sd-error`,
 * `--sd-success` from the consumer theme when present.
 *
 * Exposed via `[attr.data-theme]` on the host so SCSS can swap CSS custom
 * properties via the `:host([data-theme="light"])` selector — no runtime
 * style switching is required.
 */
export type PreviewTheme = 'dark' | 'light';
