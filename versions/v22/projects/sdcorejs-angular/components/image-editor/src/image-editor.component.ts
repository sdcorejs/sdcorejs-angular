import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  NgZone,
  PLATFORM_ID,
  Signal,
  WritableSignal,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import {
  sdImageEditorClampQuality,
  sdImageEditorColorToHex,
  sdImageEditorDrawPreview,
  sdImageEditorEncodableFormats,
  sdImageEditorExport,
  sdImageEditorFileName,
  sdImageEditorFormatBytes,
  sdImageEditorHasTransparency,
} from './image-editor.export';
import {
  SD_IMAGE_EDITOR_FIT_VIEW,
  SdImageEditorCropHandle,
  SdImageEditorOrientationOp,
  SdImageEditorView,
  clamp,
  sdImageEditorClampPan,
  sdImageEditorCompose,
  sdImageEditorFitRatio,
  sdImageEditorFitScale,
  sdImageEditorImageToStage,
  sdImageEditorMoveRect,
  sdImageEditorOrientationMatrix,
  sdImageEditorResizeRect,
  sdImageEditorScale,
  sdImageEditorViewMatrix,
  sdImageEditorViewport,
  sdImageEditorZoomAt,
} from './image-editor.geometry';
import type {
  SdImageEditorAspectRatio,
  SdImageEditorEdits,
  SdImageEditorError,
  SdImageEditorErrorCode,
  SdImageEditorFormat,
  SdImageEditorOption,
  SdImageEditorRect,
  SdImageEditorResult,
  SdImageEditorSize,
  SdImageEditorSourceInfo,
  SdImageEditorStatus,
} from './image-editor.model';
import {
  SD_IMAGE_EDITOR_EDITABLE_FORMATS,
  SdImageEditorDecoded,
  SdImageEditorFailure,
  sdImageEditorIsEditableFormat,
  sdImageEditorLoad,
} from './image-editor.source';
import {
  SdImageEditorHistory,
  SdImageEditorOutputRules,
  SdImageEditorOutputSize,
  sdImageEditorBounds,
  sdImageEditorClampResize,
  sdImageEditorHistoryCommit,
  sdImageEditorHistoryRedo,
  sdImageEditorHistoryStart,
  sdImageEditorHistoryUndo,
  sdImageEditorInitialEdits,
  sdImageEditorKeepRatio,
  sdImageEditorOperate,
  sdImageEditorOutputSize,
  sdImageEditorRatioLabel,
  sdImageEditorSameEdits,
  sdImageEditorSetAspectRatio,
  sdImageEditorSetCrop,
  sdImageEditorSetResize,
} from './image-editor.state';

const DEFAULT_RATIOS: readonly SdImageEditorAspectRatio[] = [
  { value: null },
  { value: 1 },
  { value: 4 / 3 },
  { value: 16 / 9 },
  { value: 3 / 4 },
];
const DEFAULT_LIMITS = {
  maxSourceSize: 40 * 1024 * 1024,
  maxSourcePixels: 40_000_000,
  maxOutputPixels: 16_777_216,
  maxOutputSide: 16_384,
} as const;
const DEFAULT_HISTORY_LIMIT = 50;
const DEFAULT_QUALITY = 0.92;
/** The on-screen copy is downscaled to this many pixels; the export always reads the full source. */
const PREVIEW_MAX_PIXELS = 4_000_000;
/** Pause after the last edit before the output is encoded to measure its real size. */
const ESTIMATE_DELAY_MS = 500;
/** Above this output size the real size is only measured on Apply, to keep editing responsive. */
const ESTIMATE_MAX_PIXELS = 24_000_000;
const STAGE_PADDING = 24;
const PAN_MARGIN = 48;
const ZOOM_STEP = 1.25;
/** Highest preview zoom, in CSS pixels per image pixel. */
const MAX_SCALE = 8;
/** Lowest zoom, relative to "fit". */
const MIN_ZOOM = 0.5;
/** Smallest crop the pointer can drag, in CSS pixels, so the handles stay usable. */
const MIN_CROP_CSS = 24;
/** Keyboard nudges closer than this are merged into one undo step. */
const KEY_COALESCE_MS = 800;
const COMPACT_MAX_WIDTH = 720;

type LoadState = 'empty' | 'loading' | 'ready' | 'error';
/** Gesture in progress on the stage. */
type SdImageEditorDragMode = 'move' | 'resize' | 'pan';

interface LoadedSource {
  readonly seq: number;
  readonly blob: Blob;
  readonly decoded: SdImageEditorDecoded;
  readonly info: SdImageEditorSourceInfo;
  readonly size: SdImageEditorSize;
  readonly initial: SdImageEditorEdits;
}

interface DragState {
  readonly pointerId: number;
  readonly mode: SdImageEditorDragMode;
  readonly handle: SdImageEditorCropHandle | null;
  readonly startX: number;
  readonly startY: number;
  readonly edits: SdImageEditorEdits;
  readonly view: SdImageEditorView;
  readonly scale: number;
  /** Screen pixels per stage CSS pixel when the gesture started. */
  readonly visual: number;
}

/** Real encoded size of the current output, or why it is not known. */
interface EstimateState {
  readonly key: string;
  readonly status: 'pending' | 'ready' | 'skipped' | 'error';
  readonly size?: number;
  readonly error?: SdImageEditorError;
}

interface RatioChip {
  readonly key: string;
  readonly label: string;
  readonly value: number | null;
}

interface FormatChoice {
  readonly format: SdImageEditorFormat;
  readonly label: string;
  readonly disabled: boolean;
}

const FORMAT_LABELS: Record<SdImageEditorFormat, string> = { 'image/jpeg': 'JPEG', 'image/png': 'PNG', 'image/webp': 'WebP' };
const HANDLES: readonly SdImageEditorCropHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

let nextEditorId = 0;

/**
 * Inline image editor: crop (free or fixed ratio), quarter-turn rotation, flips, resize, zoom/pan, undo/redo/reset and
 * the choice of output format and quality. It only edits: the consumer owns the Apply/Cancel buttons and asks for
 * the result with `getResult()`, `getFile()` or `getBlob()`. It never uploads or saves anything.
 *
 * Works inline or inside `sd-modal` / `sd-side-drawer` without extra setup. Pass a `File` or `Blob`: images behind
 * authentication or presigned URLs are fetched by the consumer first.
 *
 * Independent of `sd-upload-file` and `sd-file-explorer` (neither imports it): open it from their keys or `(open)`
 * event, then upload the result as a new file so the original is never overwritten (see `sd-image-editor.md`).
 *
 * @example
 * ```html
 * <sd-image-editor #editor [source]="file" [option]="{ aspectRatio: 1, lockAspectRatio: true, output: { width: 512 } }" />
 * <sd-button type="fill" color="primary" title="Save" [disabled]="editor.status() !== 'ready'" (click)="save(editor)" />
 * ```
 * ```ts
 * async save(editor: SdImageEditor): Promise<void> {
 *   const file = await editor.getFile(); // 512 × 512, extension matching the real format
 *   await this.api.uploadAvatar(file);
 * }
 * ```
 */
@Component({
  selector: 'sd-image-editor',
  standalone: true,
  imports: [SdButton, SdIcon, SdInputNumber, SdSelect, SdTooltipDirective, SdTranslatePipe],
  templateUrl: './image-editor.component.html',
  styleUrl: './image-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sd-image-editor',
    '[class.sd-image-editor--compact]': 'compact()',
    '[class.sd-image-editor--dragging]': 'dragging() !== null',
    '[attr.data-autoid]': 'autoId()',
    '[attr.aria-busy]': "status() === 'loading' || status() === 'exporting' ? 'true' : null",
    '(keydown)': 'onKeydown($event)',
  },
})
export class SdImageEditor {
  readonly #i18n = inject(I18nService);
  readonly #document = inject(DOCUMENT);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #injector = inject(Injector);
  readonly #zone = inject(NgZone);
  readonly #browser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * Image to edit: a `File` or `Blob` holding a still JPEG, PNG or WebP. The editor reads it and never modifies,
   * revokes or re-uploads it. Changing the value discards the current edits; `null` shows the empty state.
   */
  readonly source = input<Blob | null | undefined>(null);
  /** Ratios, output format/size and limits. See `SdImageEditorOption`. */
  readonly option = input<SdImageEditorOption | null | undefined>(undefined);

  /**
   * Emitted when the source cannot be loaded (unsupported, animated, too large, corrupt…), with `stage: 'load'`. The
   * same message is shown in the editor. Export failures reject the promise of `getResult()` instead.
   */
  readonly failed = output<SdImageEditorError>();

  // ---- State ----
  readonly #loadState = signal<LoadState>('empty');
  readonly #loaded = signal<LoadedSource | null>(null);
  readonly #history = signal<SdImageEditorHistory<SdImageEditorEdits> | null>(null);
  /** Edits while a drag is in progress; committed to the history on pointer up. */
  readonly #draft = signal<SdImageEditorEdits | null>(null);
  readonly #stageSize = signal<SdImageEditorSize>({ width: 0, height: 0 });
  readonly #hostWidth = signal(0);
  readonly #encodable = signal<ReadonlySet<SdImageEditorFormat> | null>(null);
  readonly #exporting = signal(false);
  readonly #loadError = signal<SdImageEditorError | null>(null);
  readonly #estimate = signal<EstimateState | null>(null);

  protected readonly view = signal<SdImageEditorView>(SD_IMAGE_EDITOR_FIT_VIEW);
  // why: kiểu khai báo tường minh bằng alias — union literal tự suy ra được in vào d.ts theo thứ tự nội bộ của
  // TypeScript, thứ tự này đổi theo máy build (xem file-explorer shareFeedback).
  protected readonly dragging: WritableSignal<SdImageEditorDragMode | null> = signal<SdImageEditorDragMode | null>(null);
  protected readonly format = signal<SdImageEditorFormat>('image/png');
  protected readonly quality = signal(DEFAULT_QUALITY);
  protected readonly background = signal('white');
  protected readonly exportError = signal<SdImageEditorError | null>(null);
  /** Shown under the size fields when a typed size had to be reduced. */
  protected readonly resizeNotice = signal('');

  protected readonly stage = viewChild<ElementRef<HTMLElement>>('stage');
  protected readonly previewCanvas = viewChild<ElementRef<HTMLCanvasElement>>('previewCanvas');
  protected readonly cropBox = viewChild<ElementRef<HTMLElement>>('cropBox');

  // ---- Non-reactive bookkeeping ----
  #loadSeq = 0;
  #drag: DragState | null = null;
  #estimateTimer: ReturnType<typeof setTimeout> | null = null;
  #estimating = false;
  #estimateQueued = false;
  /** Last encoded output, reused by Apply when nothing changed since. */
  #encoded: { key: string; blob: Blob; format: SdImageEditorFormat } | null = null;
  #coalesce: { kind: string; at: number } | null = null;
  /** Export in progress, shared by concurrent `getResult()` calls. */
  #pendingResult: Promise<SdImageEditorResult> | null = null;
  #resizeObserver: ResizeObserver | null = null;
  #destroyed = false;

  protected readonly instanceId = `sd-image-editor-${nextEditorId++}`;
  protected readonly handles = HANDLES;

  // ---- Public read-only state ----

  /** Current lifecycle state. See `SdImageEditorStatus`. */
  readonly status: Signal<SdImageEditorStatus> = computed<SdImageEditorStatus>(() => {
    const state = this.#loadState();
    return state === 'ready' && this.#exporting() ? 'exporting' : state;
  });

  /** Current edits (including a drag in progress), or `null` while no image is loaded. */
  readonly edits: Signal<SdImageEditorEdits | null> = computed(() => this.#draft() ?? this.#history()?.present ?? null);

  /** Facts about the loaded source, or `null`. */
  readonly sourceInfo: Signal<SdImageEditorSourceInfo | null> = computed(() => this.#loaded()?.info ?? null);

  /** Last load or export error, or `null`. */
  readonly error: Signal<SdImageEditorError | null> = computed(() => this.#loadError() ?? this.exportError());

  readonly canUndo: Signal<boolean> = computed(() => this.#interactive() && !!this.#history()?.past.length);
  readonly canRedo: Signal<boolean> = computed(() => this.#interactive() && !!this.#history()?.future.length);

  /** The edits differ from the freshly loaded image. */
  readonly dirty: Signal<boolean> = computed(() => {
    const edits = this.edits();
    const loaded = this.#loaded();
    return !!edits && !!loaded && !sdImageEditorSameEdits(edits, loaded.initial);
  });

  readonly autoId = computed(() => {
    const scope = this.option()?.autoId;
    return scope ? `components-image-editor-${scope}` : undefined;
  });

  // ---- Derived configuration ----

  readonly #limits = computed(() => {
    const limits = this.option()?.limits ?? {};
    return {
      maxSourceSize: positive(limits.maxSourceSize) ?? DEFAULT_LIMITS.maxSourceSize,
      maxSourcePixels: positive(limits.maxSourcePixels) ?? DEFAULT_LIMITS.maxSourcePixels,
      maxOutputPixels: positive(limits.maxOutputPixels) ?? DEFAULT_LIMITS.maxOutputPixels,
      maxOutputSide: positive(limits.maxOutputSide) ?? DEFAULT_LIMITS.maxOutputSide,
    };
  });

  readonly #rules = computed<SdImageEditorOutputRules>(() => {
    const output = this.option()?.output ?? {};
    const limits = this.#limits();
    return {
      targetWidth: positive(output.width),
      targetHeight: positive(output.height),
      allowUpscale: !!output.allowUpscale,
      maxPixels: limits.maxOutputPixels,
      maxSide: limits.maxOutputSide,
    };
  });

  readonly #historyLimit = computed(() => positive(this.option()?.historyLimit) ?? DEFAULT_HISTORY_LIMIT);
  readonly #interactive = computed(() => this.#loadState() === 'ready' && !this.#exporting());
  protected readonly interactive = this.#interactive;
  protected readonly busy = computed(() => this.#exporting());
  protected readonly compact = computed(() => {
    const width = this.#hostWidth();
    return width > 0 && width < COMPACT_MAX_WIDTH;
  });

  protected readonly showRatios = computed(() => !this.option()?.lockAspectRatio);
  /** "Keep ratio" is on: the crop keeps its shape while dragging, typing or rotating. */
  protected readonly ratioLocked = computed(() => this.edits()?.aspectRatio != null);
  /** The ratio is fixed by `option.lockAspectRatio`; the user cannot unlock it. */
  protected readonly ratioFixed = computed(() => !!this.option()?.lockAspectRatio);
  protected readonly ratioText = computed(() => {
    const ratio = this.edits()?.aspectRatio;
    return ratio ? sdImageEditorRatioLabel(ratio) : '';
  });
  protected readonly ratioChips = computed<readonly RatioChip[]>(() => {
    const list = this.option()?.aspectRatios;
    const ratios = list && list.length ? list : DEFAULT_RATIOS;
    return ratios.map((ratio, index) => {
      const value = positive(ratio.value ?? undefined) ?? null;
      const label = ratio.label || (value ? sdImageEditorRatioLabel(value) : this.#i18n.t('core.component.image-editor.ratio-free'));
      return { key: `${index}-${value ?? 'free'}`, label, value };
    });
  });

  protected readonly formatChoices = computed<FormatChoice[]>(() => {
    const encodable = this.#encodable();
    return this.#formats().map(format => {
      const disabled = !!encodable && !encodable.has(format);
      const label = disabled
        ? this.#i18n.t('core.component.image-editor.format-unsupported-option', { format: FORMAT_LABELS[format] })
        : FORMAT_LABELS[format];
      return { format, label, disabled };
    });
  });
  protected readonly showFormatPicker = computed(() => this.#formats().length > 1);
  protected readonly lossy = computed(() => this.format() !== 'image/png');
  protected readonly qualityPercent = computed(() => Math.round(this.quality() * 100));
  protected readonly showBackground = computed(() => this.format() === 'image/jpeg' && !!this.sourceInfo()?.hasAlpha);
  protected readonly backgroundHex = computed(
    () => (this.#browser ? sdImageEditorColorToHex(this.#document, this.background()) : null) ?? ''
  );
  protected readonly formatLabel = computed(() => FORMAT_LABELS[this.format()]);
  protected readonly formatUnsupported = computed(() => {
    const encodable = this.#encodable();
    return !!encodable && !encodable.has(this.format());
  });

  readonly #formats = computed<readonly SdImageEditorFormat[]>(() => {
    const list = (this.option()?.output?.formats ?? []).filter(sdImageEditorIsEditableFormat);
    return list.length ? [...new Set(list)] : SD_IMAGE_EDITOR_EDITABLE_FORMATS;
  });

  // ---- Geometry ----

  readonly #bounds = computed(() => {
    const edits = this.edits();
    const loaded = this.#loaded();
    return edits && loaded ? sdImageEditorBounds(edits, loaded.size) : null;
  });

  readonly #viewport = computed(() => {
    const bounds = this.#bounds();
    return bounds ? sdImageEditorViewport(this.#stageSize(), bounds, this.view(), STAGE_PADDING) : null;
  });

  readonly #maxZoom = computed(() => {
    const bounds = this.#bounds();
    if (!bounds) return 1;
    return Math.max(1, MAX_SCALE / sdImageEditorFitScale(this.#stageSize(), bounds, STAGE_PADDING));
  });

  readonly #previewSize = signal<SdImageEditorSize>({ width: 1, height: 1 });

  /** CSS transform of the preview canvas: preview pixels → source pixels → oriented image → stage. */
  protected readonly previewTransform = computed(() => {
    const viewport = this.#viewport();
    const edits = this.edits();
    const loaded = this.#loaded();
    if (!viewport || !edits || !loaded) return 'none';
    const preview = this.#previewSize();
    const m = sdImageEditorCompose(
      sdImageEditorViewMatrix(viewport),
      sdImageEditorOrientationMatrix(loaded.size, edits),
      sdImageEditorScale(loaded.size.width / preview.width, loaded.size.height / preview.height)
    );
    return `matrix(${m.map(value => round(value, 6)).join(', ')})`;
  });

  protected readonly previewSize = this.#previewSize.asReadonly();

  protected readonly imageBox = computed(() => {
    const viewport = this.#viewport();
    const bounds = this.#bounds();
    return viewport && bounds ? sdImageEditorImageToStage(viewport, { x: 0, y: 0, ...bounds }) : null;
  });

  protected readonly cropStyle = computed(() => {
    const viewport = this.#viewport();
    const edits = this.edits();
    return viewport && edits ? sdImageEditorImageToStage(viewport, edits.crop) : null;
  });

  protected readonly zoomPercent = computed(() => Math.round((this.#viewport()?.scale ?? 1) * 100));
  protected readonly canZoomIn = computed(() => this.#interactive() && this.view().zoom < this.#maxZoom() - 1e-6);
  protected readonly canZoomOut = computed(() => this.#interactive() && this.view().zoom > MIN_ZOOM + 1e-6);
  protected readonly isFit = computed(() => {
    const view = this.view();
    return view.zoom === 1 && view.panX === 0 && view.panY === 0;
  });

  protected readonly cropLimits = computed(() => {
    const bounds = this.#bounds();
    const crop = this.edits()?.crop;
    if (!bounds || !crop) return null;
    return { maxX: bounds.width - crop.width, maxY: bounds.height - crop.height, maxWidth: bounds.width, maxHeight: bounds.height };
  });

  protected readonly cropLabel = computed(() => {
    const crop = this.edits()?.crop;
    if (!crop) return '';
    return this.#i18n.t('core.component.image-editor.crop-area', { x: crop.x, y: crop.y, width: crop.width, height: crop.height });
  });

  // ---- Output ----

  readonly #outputSize = computed<SdImageEditorOutputSize | null>(() => {
    const edits = this.edits();
    return edits ? sdImageEditorOutputSize(edits, this.#rules()) : null;
  });
  protected readonly outputSize = this.#outputSize;

  /** Largest size the user may type for the current crop (no upscaling unless allowed). */
  protected readonly resizeMax = computed(() => {
    const edits = this.edits();
    if (!edits) return null;
    const huge = 1e9;
    return sdImageEditorClampResize({ width: huge, height: huge }, edits.crop, this.#rules()).size;
  });

  /** Key of the committed output; `null` during a drag so nothing is encoded mid-gesture. */
  readonly #outputKey = computed(() => {
    const loaded = this.#loaded();
    const edits = this.#history()?.present;
    const size = this.#outputSize();
    if (!loaded || !edits || !size || this.#draft() || this.#loadState() !== 'ready') return null;
    const format = this.format();
    return JSON.stringify({
      seq: loaded.seq,
      edits,
      size: [size.width, size.height],
      format,
      quality: format === 'image/png' ? null : sdImageEditorClampQuality(this.quality()),
      background: format === 'image/jpeg' ? this.background() : null,
    });
  });

  protected readonly estimateLabel = computed(() => {
    const estimate = this.#estimate();
    const key = this.#outputKey();
    if (!estimate || !key || estimate.key !== key) return this.#i18n.t('core.component.image-editor.size-pending');
    switch (estimate.status) {
      case 'ready':
        return sdImageEditorFormatBytes(estimate.size ?? 0, this.#i18n.locale());
      case 'skipped':
        return this.#i18n.t('core.component.image-editor.size-on-apply');
      case 'error':
        return this.#i18n.t('core.component.image-editor.size-unavailable');
      default:
        return this.#i18n.t('core.component.image-editor.size-pending');
    }
  });

  protected readonly sourceSummary = computed(() => {
    const info = this.sourceInfo();
    if (!info) return '';
    return `${info.width} × ${info.height} px · ${FORMAT_LABELS[info.mimeType]} · ${sdImageEditorFormatBytes(info.size, this.#i18n.locale())}`;
  });

  protected readonly outputSummary = computed(() => {
    const size = this.#outputSize();
    return size ? `${size.width} × ${size.height} px · ${FORMAT_LABELS[this.format()]}` : '';
  });

  protected readonly statusMessage = computed(() => {
    if (this.#exporting()) return this.#i18n.t('core.component.image-editor.exporting');
    return this.exportError()?.message ?? '';
  });

  constructor() {
    effect(() => {
      const source = this.source();
      untracked(() => void this.#load(source ?? null));
    });

    effect(() => {
      const key = this.#outputKey();
      untracked(() => this.#scheduleEstimate(key));
    });

    afterNextRender(() => {
      const host = this.#host.nativeElement;
      this.#hostWidth.set(host.offsetWidth);
      this.#measureStage();
      if (typeof ResizeObserver === 'undefined') return;
      this.#resizeObserver = new ResizeObserver(() => {
        this.#hostWidth.set(host.offsetWidth);
        this.#measureStage();
      });
      this.#resizeObserver.observe(host);
      const stage = this.stage()?.nativeElement;
      if (stage) this.#resizeObserver.observe(stage);
    });

    inject(DestroyRef).onDestroy(() => this.#teardown());
  }

  // ---- Public API ----

  /** Steps back one edit. Zoom and pan are not part of the history. */
  undo(): void {
    const history = this.#history();
    if (!history || !this.canUndo()) return;
    this.#coalesce = null;
    this.#history.set(sdImageEditorHistoryUndo(history));
    this.#afterHistoryChange();
  }

  redo(): void {
    const history = this.#history();
    if (!history || !this.canRedo()) return;
    this.#coalesce = null;
    this.#history.set(sdImageEditorHistoryRedo(history));
    this.#afterHistoryChange();
  }

  /** Returns to the image as loaded (no crop, rotation, flip or resize). Undoable. */
  reset(): void {
    const loaded = this.#loaded();
    if (!loaded || !this.#interactive()) return;
    this.#commit(loaded.initial);
    this.fitToView();
  }

  /** Shows the whole image again. Does not change the edits. */
  fitToView(): void {
    this.view.set(SD_IMAGE_EDITOR_FIT_VIEW);
  }

  /** Rotates by 90° as the toolbar buttons do. Undoable. */
  rotate(direction: 'left' | 'right'): void {
    this.operate(direction === 'left' ? 'rotate-ccw' : 'rotate-cw');
  }

  /** Mirrors the image as shown, as the toolbar buttons do. Undoable. */
  flip(axis: 'horizontal' | 'vertical'): void {
    this.operate(axis === 'horizontal' ? 'flip-horizontal' : 'flip-vertical');
  }

  /**
   * Encodes the current edits from the full-resolution source and resolves with the image and its facts. Reuses the
   * encoding made for the size preview when nothing changed; concurrent calls share one encoding. While it runs,
   * `status()` is `'exporting'` and the controls are disabled.
   *
   * Rejects with an `SdImageEditorError`: `not-ready` when no image is loaded (or it was replaced meanwhile), or an
   * export code such as `format-unsupported`, `render-failed` or `encode-failed`.
   *
   * @example
   * ```ts
   * try {
   *   const result = await this.editor().getResult();
   *   await this.api.upload(result.blob, result.fileName);
   * } catch (error) {
   *   this.notify.error((error as SdImageEditorError).message);
   * }
   * ```
   */
  getResult(): Promise<SdImageEditorResult> {
    if (this.#pendingResult) return this.#pendingResult;
    const loaded = this.#loaded();
    const edits = this.#history()?.present;
    const size = this.#outputSize();
    if (!loaded || !edits || !size || this.#loadState() !== 'ready') {
      return Promise.reject(this.#toError(new SdImageEditorFailure('not-ready'), 'export'));
    }
    const pending = this.#export(loaded, edits, size).finally(() => {
      if (this.#pendingResult === pending) this.#pendingResult = null;
    });
    this.#pendingResult = pending;
    return pending;
  }

  /** `getResult()` then its `blob`. */
  async getBlob(): Promise<Blob> {
    return (await this.getResult()).blob;
  }

  /**
   * `getResult()` as a `File`, whatever `output.resultType` says. `fileName` (without extension) overrides
   * `output.fileName`; the extension always matches the encoded format.
   *
   * @example
   * ```ts
   * const file = await this.editor().getFile('receipt-0042'); // receipt-0042.jpg
   * ```
   */
  async getFile(fileName?: string): Promise<File> {
    const result = await this.getResult();
    if (!fileName && result.file) return result.file;
    const name = fileName ? sdImageEditorFileName(fileName, result.mimeType) : result.fileName;
    return new File([result.blob], name, { type: result.mimeType, lastModified: Date.now() });
  }

  // ---- Toolbar ----

  protected operate(op: SdImageEditorOrientationOp): void {
    const edits = this.#history()?.present;
    const loaded = this.#loaded();
    if (!edits || !loaded || !this.#interactive()) return;
    this.#commit(sdImageEditorOperate(edits, op, loaded.size, this.#rules()));
    // why: xoay 90° đổi khung ảnh — giữ mức zoom nhưng đưa ảnh về giữa để không "mất" ảnh ngoài vùng nhìn.
    this.view.update(view => ({ ...view, panX: 0, panY: 0 }));
  }

  protected zoomIn(): void {
    this.#zoomTo(this.view().zoom * ZOOM_STEP);
  }

  protected zoomOut(): void {
    this.#zoomTo(this.view().zoom / ZOOM_STEP);
  }

  // ---- Panel ----

  protected selectRatio(value: number | null): void {
    const edits = this.#history()?.present;
    const loaded = this.#loaded();
    if (!edits || !loaded || !this.#interactive()) return;
    this.#commit(sdImageEditorSetAspectRatio(edits, value, loaded.size, this.#rules()));
  }

  /** Commits a crop field on blur or Enter (not per keystroke, so typing "1280" never passes through "1"). */
  protected onCropField(field: keyof SdImageEditorRect, input: unknown, control?: SdInputNumber): void {
    const edits = this.#history()?.present;
    const loaded = this.#loaded();
    if (!edits || !loaded || !this.#interactive()) return;
    const value = typeof input === 'number' ? input : Number(input);
    if (input === null || input === undefined || input === '' || !Number.isFinite(value)) {
      control?.valueModel.set(edits.crop[field]);
      return;
    }
    const bounds = sdImageEditorBounds(edits, loaded.size);
    const ratio = edits.aspectRatio;
    let rect: SdImageEditorRect = { ...edits.crop, [field]: Math.round(value) };
    if (ratio && (field === 'width' || field === 'height')) {
      const width = field === 'width' ? rect.width : rect.height * ratio;
      const fitted = sdImageEditorFitRatio(Math.min(bounds.width, Math.max(1, width)), bounds.height, ratio);
      // why: giữ tâm vùng cắt khi đổi kích thước theo tỷ lệ — cảm giác giống kéo handle đối xứng.
      const cx = edits.crop.x + edits.crop.width / 2;
      const cy = edits.crop.y + edits.crop.height / 2;
      rect = { x: cx - fitted.width / 2, y: cy - fitted.height / 2, ...fitted };
    }
    const next = sdImageEditorSetCrop(edits, rect, loaded.size, this.#rules());
    this.#commit(next);
    control?.valueModel.set(next.crop[field]);
  }

  /** Output width or height, committed on blur or Enter. The other side always follows the crop ratio. */
  protected onResizeField(field: 'width' | 'height', input: unknown, control?: SdInputNumber): void {
    const edits = this.#history()?.present;
    const current = this.#outputSize();
    if (!edits || !current || !this.#interactive()) return;
    const value = typeof input === 'number' ? input : Number(input);
    if (input === null || input === undefined || input === '' || !Number.isFinite(value) || value < 1) {
      control?.valueModel.set(current[field]);
      return;
    }
    const ratio = edits.crop.width / edits.crop.height;
    const typed = Math.round(value);
    const width = field === 'width' ? typed : typed * ratio;
    const { size: clamped, limited } = sdImageEditorClampResize({ width, height: width / ratio }, edits.crop, this.#rules());
    this.#commit(sdImageEditorSetResize(edits, clamped, this.#rules()));
    this.resizeNotice.set(
      limited ? this.#i18n.t('core.component.image-editor.resize-limited', { width: clamped.width, height: clamped.height }) : ''
    );
    control?.valueModel.set(clamped[field]);
  }

  /** "Keep ratio": on locks the current crop shape, off lets the crop be dragged freely. */
  protected toggleKeepRatio(): void {
    const edits = this.#history()?.present;
    if (!edits || !this.#interactive() || this.ratioFixed()) return;
    this.#commit(sdImageEditorKeepRatio(edits, edits.aspectRatio === null));
  }

  /** Output follows the crop again. */
  protected resetResize(): void {
    const edits = this.#history()?.present;
    if (!edits || !this.#interactive()) return;
    this.resizeNotice.set('');
    this.#commit(sdImageEditorSetResize(edits, null, this.#rules()));
  }

  protected onFormatChange(value: unknown): void {
    if (typeof value !== 'string' || !sdImageEditorIsEditableFormat(value)) return;
    this.format.set(value);
    this.exportError.set(null);
  }

  protected onQualityInput(value: string): void {
    const percent = Number(value);
    if (Number.isFinite(percent)) this.quality.set(sdImageEditorClampQuality(percent / 100));
  }

  protected onBackgroundInput(value: string): void {
    if (value) this.background.set(value);
  }

  protected sameRatio(a: number | null, b: number | null): boolean {
    return a === b || (a !== null && b !== null && Math.abs(a - b) < 1e-6);
  }

  // ---- Pointer ----

  protected onCropPointerDown(event: PointerEvent, handle: SdImageEditorCropHandle | null): void {
    event.stopPropagation();
    this.#startDrag(event, handle ? 'resize' : 'move', handle);
  }

  protected onStagePointerDown(event: PointerEvent): void {
    this.#startDrag(event, 'pan', null);
  }

  protected onPointerMove(event: PointerEvent): void {
    const drag = this.#drag;
    const loaded = this.#loaded();
    if (!drag || !loaded || event.pointerId !== drag.pointerId) return;
    event.preventDefault();
    const dxCss = (event.clientX - drag.startX) / drag.visual;
    const dyCss = (event.clientY - drag.startY) / drag.visual;
    if (drag.mode === 'pan') {
      const bounds = sdImageEditorBounds(drag.edits, loaded.size);
      const next = { zoom: drag.view.zoom, panX: drag.view.panX + dxCss, panY: drag.view.panY + dyCss };
      this.view.set(sdImageEditorClampPan(this.#stageSize(), bounds, next, STAGE_PADDING, PAN_MARGIN));
      return;
    }
    const dx = dxCss / drag.scale;
    const dy = dyCss / drag.scale;
    const bounds = sdImageEditorBounds(drag.edits, loaded.size);
    const crop =
      drag.mode === 'move'
        ? sdImageEditorMoveRect(drag.edits.crop, dx, dy, bounds)
        : sdImageEditorResizeRect(
            drag.edits.crop,
            drag.handle ?? 'se',
            dx,
            dy,
            bounds,
            drag.edits.aspectRatio,
            Math.ceil(MIN_CROP_CSS / drag.scale)
          );
    this.#draft.set(sdImageEditorSetCrop(drag.edits, crop, loaded.size, this.#rules()));
  }

  protected onPointerUp(event: PointerEvent): void {
    const drag = this.#drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    this.#endDrag(event.pointerId);
    const draft = this.#draft();
    this.#draft.set(null);
    if (draft) this.#commit(draft);
  }

  /** The browser took the pointer away (touch interrupted): drop the gesture instead of committing it. */
  protected onPointerCancel(event: PointerEvent): void {
    const drag = this.#drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    this.#endDrag(event.pointerId);
    this.#draft.set(null);
    if (drag.mode === 'pan') this.view.set(drag.view);
  }

  protected onWheel(event: WheelEvent): void {
    // why: chỉ zoom khi giữ Ctrl/⌘ (hoặc pinch trên touchpad, trình duyệt gắn ctrlKey) — cuộn thường vẫn cuộn trang.
    if (!this.#interactive() || !(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    const stage = this.stage()?.nativeElement;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const visual = this.#visualScale(stage);
    this.#zoomTo(
      this.view().zoom * Math.exp(-event.deltaY * 0.002),
      (event.clientX - rect.left) / visual,
      (event.clientY - rect.top) / visual
    );
  }

  // ---- Keyboard ----

  protected onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || !this.#interactive()) return;
    const editable = isEditableTarget(event.target);
    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (mod && !event.altKey && (key === 'z' || key === 'y')) {
      // why: trong ô nhập số, Ctrl+Z phải là undo của chính ô đó — không cướp phím của trình duyệt.
      if (editable) return;
      event.preventDefault();
      if (key === 'y' || event.shiftKey) this.redo();
      else this.undo();
      return;
    }
    if (editable || mod || event.altKey) return;
    if (event.key === '+' || event.key === '=') this.zoomIn();
    else if (event.key === '-' || event.key === '_') this.zoomOut();
    else if (event.key === '0') this.fitToView();
    else return;
    event.preventDefault();
  }

  protected onCropKeydown(event: KeyboardEvent): void {
    const edits = this.#history()?.present;
    const loaded = this.#loaded();
    if (!edits || !loaded || !this.#interactive() || event.altKey) return;
    const step = event.shiftKey ? 10 : 1;
    let dx = 0;
    let dy = 0;
    if (event.key === 'ArrowLeft') dx = -step;
    else if (event.key === 'ArrowRight') dx = step;
    else if (event.key === 'ArrowUp') dy = -step;
    else if (event.key === 'ArrowDown') dy = step;
    else return;
    event.preventDefault();
    event.stopPropagation();
    const bounds = sdImageEditorBounds(edits, loaded.size);
    const resize = event.ctrlKey || event.metaKey;
    const crop = resize
      ? sdImageEditorResizeRect(edits.crop, 'se', dx, dy, bounds, edits.aspectRatio, 1)
      : sdImageEditorMoveRect(edits.crop, dx, dy, bounds);
    this.#commit(sdImageEditorSetCrop(edits, crop, loaded.size, this.#rules()), resize ? 'key-resize' : 'key-move');
  }

  // ---- Internals: loading ----

  async #load(source: Blob | null): Promise<void> {
    const seq = ++this.#loadSeq;
    this.#releaseSource();
    this.#loadError.set(null);
    this.exportError.set(null);
    this.resizeNotice.set('');
    this.view.set(SD_IMAGE_EDITOR_FIT_VIEW);
    if (!source || !this.#browser) {
      this.#loadState.set('empty');
      return;
    }
    this.#loadState.set('loading');
    try {
      if (typeof Blob === 'undefined' || !(source instanceof Blob)) throw new SdImageEditorFailure('unsupported-format', typeof source);
      const [{ header, decoded }, encodable] = await Promise.all([
        sdImageEditorLoad(source, this.#limits(), this.#document),
        sdImageEditorEncodableFormats(this.#document),
      ]);
      if (seq !== this.#loadSeq || this.#destroyed) {
        decoded.release();
        return;
      }
      const size = { width: decoded.width, height: decoded.height };
      const info: SdImageEditorSourceInfo = {
        mimeType: header.format as SdImageEditorFormat,
        width: size.width,
        height: size.height,
        size: source.size,
        hasAlpha: header.format !== 'image/jpeg' && header.hasAlpha,
        exifOrientation: header.orientation,
      };
      const option = this.option();
      const ratio = positive(option?.aspectRatio ?? undefined) ?? null;
      const initial = sdImageEditorInitialEdits(size, ratio);
      this.#encodable.set(encodable);
      this.#loaded.set({ seq, blob: source, decoded, info, size, initial });
      this.#history.set(sdImageEditorHistoryStart(initial));
      this.#applyOutputDefaults(info);
      this.#loadState.set('ready');
      this.#drawPreview(decoded);
    } catch (error) {
      if (seq !== this.#loadSeq || this.#destroyed) return;
      const failure = this.#toError(error, 'load');
      this.#loadError.set(failure);
      this.#loadState.set('error');
      this.failed.emit(failure);
    }
  }

  #applyOutputDefaults(info: SdImageEditorSourceInfo): void {
    const output = this.option()?.output ?? {};
    this.format.set(this.#defaultFormat(info, output.format));
    this.quality.set(sdImageEditorClampQuality(output.quality ?? DEFAULT_QUALITY));
    this.background.set(output.background?.trim() || 'white');
  }

  /** Requested format, else the source format, else PNG (transparency) or JPEG — among the encodable formats. */
  #defaultFormat(info: SdImageEditorSourceInfo, requested: SdImageEditorFormat | undefined): SdImageEditorFormat {
    const formats = this.#formats();
    const encodable = this.#encodable();
    const usable = formats.filter(format => !encodable || encodable.has(format));
    // why: consumer chỉ định rõ định dạng thì giữ nguyên, kể cả khi trình duyệt không encode được — panel báo lỗi,
    // Apply trả `format-unsupported`; không âm thầm đổi sang định dạng khác.
    if (requested && formats.includes(requested)) return requested;
    if (usable.includes(info.mimeType)) return info.mimeType;
    const fallback: SdImageEditorFormat = info.hasAlpha ? 'image/png' : 'image/jpeg';
    if (usable.includes(fallback)) return fallback;
    return usable[0] ?? formats[0];
  }

  #drawPreview(decoded: SdImageEditorDecoded): void {
    const draw = () => {
      const canvas = this.previewCanvas()?.nativeElement;
      if (!canvas || this.#destroyed || this.#loaded()?.decoded !== decoded) return;
      try {
        const size = sdImageEditorDrawPreview(canvas, decoded, PREVIEW_MAX_PIXELS);
        this.#previewSize.set(size);
        const loaded = this.#loaded();
        // why: encoder canvas/PNG thường ghi kênh alpha cả khi ảnh đục — chỉ báo "có trong suốt" khi thật sự có pixel trong suốt.
        if (loaded?.info.hasAlpha && !sdImageEditorHasTransparency(canvas)) {
          const info = { ...loaded.info, hasAlpha: false };
          this.#loaded.set({ ...loaded, info });
          this.#applyOutputDefaults(info);
        }
      } catch (error) {
        const failure = this.#toError(error, 'load');
        this.#releaseSource();
        this.#loadError.set(failure);
        this.#loadState.set('error');
        this.failed.emit(failure);
      }
      this.#measureStage();
    };
    if (this.previewCanvas()) draw();
    else afterNextRender(draw, { injector: this.#injector });
  }

  #releaseSource(): void {
    this.#endDrag(null);
    this.#draft.set(null);
    this.#clearEstimate();
    this.#encoded = null;
    this.#coalesce = null;
    const loaded = this.#loaded();
    if (loaded) loaded.decoded.release();
    this.#loaded.set(null);
    this.#history.set(null);
    this.#exporting.set(false);
    this.#pendingResult = null;
    const canvas = this.previewCanvas()?.nativeElement;
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  // ---- Internals: history ----

  #commit(next: SdImageEditorEdits, coalesce?: string): void {
    const history = this.#history();
    if (!history) return;
    const now = Date.now();
    const merge = !!coalesce && this.#coalesce?.kind === coalesce && now - this.#coalesce.at < KEY_COALESCE_MS && history.past.length > 0;
    if (merge) {
      if (!sdImageEditorSameEdits(history.present, next)) this.#history.set({ past: history.past, present: next, future: [] });
    } else {
      this.#history.set(sdImageEditorHistoryCommit(history, next, this.#historyLimit(), sdImageEditorSameEdits));
    }
    this.#coalesce = coalesce ? { kind: coalesce, at: now } : null;
    this.#afterHistoryChange();
  }

  #afterHistoryChange(): void {
    this.exportError.set(null);
    this.resizeNotice.set('');
  }

  // ---- Internals: view ----

  #zoomTo(zoom: number, anchorX?: number, anchorY?: number): void {
    const bounds = this.#bounds();
    if (!bounds || !this.#interactive()) return;
    const stage = this.#stageSize();
    const next = clamp(zoom, MIN_ZOOM, this.#maxZoom());
    const view = sdImageEditorZoomAt(
      stage,
      bounds,
      this.view(),
      STAGE_PADDING,
      next,
      anchorX ?? stage.width / 2,
      anchorY ?? stage.height / 2
    );
    // why: về đúng mức "vừa khung" thì bỏ luôn độ lệch pan, để nút Fit hiển thị trạng thái active chính xác.
    this.view.set(
      Math.abs(next - 1) < 1e-6 ? SD_IMAGE_EDITOR_FIT_VIEW : sdImageEditorClampPan(stage, bounds, view, STAGE_PADDING, PAN_MARGIN)
    );
  }

  #measureStage(): void {
    const stage = this.stage()?.nativeElement;
    if (!stage) return;
    // why: đo kích thước layout, không dùng getBoundingClientRect — modal/drawer mở bằng animation scale nên rect lúc đó
    // nhỏ hơn thật, còn ResizeObserver không bắn lại khi chỉ transform thay đổi → ảnh lệch tâm vĩnh viễn.
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const current = this.#stageSize();
    if (current.width !== width || current.height !== height) this.#stageSize.set({ width, height });
  }

  /** Screen pixels per CSS pixel of the stage — not 1 while an ancestor is transformed (opening animation, zoom). */
  #visualScale(stage: HTMLElement): number {
    const width = stage.clientWidth;
    const ratio = width ? stage.getBoundingClientRect().width / width : 1;
    return Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
  }

  #startDrag(event: PointerEvent, mode: SdImageEditorDragMode, handle: SdImageEditorCropHandle | null): void {
    const edits = this.#history()?.present;
    const viewport = this.#viewport();
    if (!edits || !viewport || !this.#interactive() || this.#drag || event.button !== 0) return;
    event.preventDefault();
    const stage = this.stage()?.nativeElement;
    try {
      stage?.setPointerCapture(event.pointerId);
    } catch {
      // why: pointer tổng hợp (test, một số trình duyệt) có thể không capture được — vẫn kéo được trong stage.
    }
    this.#drag = {
      pointerId: event.pointerId,
      mode,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      edits,
      view: this.view(),
      scale: viewport.scale,
      visual: stage ? this.#visualScale(stage) : 1,
    };
    this.dragging.set(mode);
    if (mode !== 'pan') this.cropBox()?.nativeElement.focus({ preventScroll: true });
  }

  #endDrag(pointerId: number | null): void {
    if (!this.#drag) return;
    const stage = this.stage()?.nativeElement;
    if (pointerId !== null && stage?.hasPointerCapture?.(pointerId)) stage.releasePointerCapture(pointerId);
    this.#drag = null;
    this.dragging.set(null);
  }

  // ---- Internals: output ----

  async #export(loaded: LoadedSource, edits: SdImageEditorEdits, size: SdImageEditorOutputSize): Promise<SdImageEditorResult> {
    const seq = loaded.seq;
    const key = this.#outputKey();
    const format = this.format();
    const quality = sdImageEditorClampQuality(this.quality());
    const current = () => seq === this.#loadSeq && !this.#destroyed;
    this.#exporting.set(true);
    this.exportError.set(null);
    try {
      let encoded: { blob: Blob; format: SdImageEditorFormat };
      try {
        const cached = this.#encoded && key && this.#encoded.key === key ? this.#encoded : null;
        encoded = cached ?? (await sdImageEditorExport(this.#document, this.#request(loaded, edits, size, format, quality)));
        if (key && !cached && current()) this.#encoded = { key, blob: encoded.blob, format: encoded.format };
      } catch (error) {
        const failure = this.#toError(error, 'export');
        if (current()) this.exportError.set(failure);
        throw failure;
      }
      // why: nguồn bị thay (hoặc editor bị huỷ) trong lúc encode — kết quả thuộc ảnh cũ, không được trả ra.
      if (!current()) throw this.#toError(new SdImageEditorFailure('not-ready'), 'export');
      return this.#result(loaded, edits, size, encoded.blob, encoded.format, quality);
    } finally {
      if (current()) this.#exporting.set(false);
    }
  }

  #request(loaded: LoadedSource, edits: SdImageEditorEdits, size: SdImageEditorSize, format: SdImageEditorFormat, quality: number) {
    return {
      source: loaded.decoded,
      edits,
      output: { width: size.width, height: size.height },
      format,
      quality,
      background: this.background(),
    };
  }

  #result(
    loaded: LoadedSource,
    edits: SdImageEditorEdits,
    size: SdImageEditorOutputSize,
    blob: Blob,
    format: SdImageEditorFormat,
    quality: number
  ): SdImageEditorResult {
    const output = this.option()?.output ?? {};
    const sourceName = typeof File !== 'undefined' && loaded.blob instanceof File ? loaded.blob.name : undefined;
    const fileName = sdImageEditorFileName(output.fileName ?? sourceName, format);
    const resultType = output.resultType ?? 'auto';
    const wantsFile = resultType === 'file' || (resultType === 'auto' && sourceName !== undefined);
    const file = wantsFile && typeof File !== 'undefined' ? new File([blob], fileName, { type: format, lastModified: Date.now() }) : null;
    return {
      blob: file ?? blob,
      file,
      fileName,
      mimeType: format,
      width: size.width,
      height: size.height,
      size: blob.size,
      quality: format === 'image/png' ? null : quality,
      edits,
      sizeLimited: size.limited,
    };
  }

  #scheduleEstimate(key: string | null): void {
    if (this.#estimateTimer) clearTimeout(this.#estimateTimer);
    this.#estimateTimer = null;
    if (!key) return;
    if (this.#encoded?.key === key) {
      this.#estimate.set({ key, status: 'ready', size: this.#encoded.blob.size });
      return;
    }
    const size = this.#outputSize();
    if (size && size.width * size.height > ESTIMATE_MAX_PIXELS) {
      this.#estimate.set({ key, status: 'skipped' });
      return;
    }
    this.#estimate.set({ key, status: 'pending' });
    // why: timer chạy ngoài zone — chờ debounce không được giữ app ở trạng thái "chưa ổn định" (whenStable, e2e).
    this.#estimateTimer = this.#zone.runOutsideAngular(() =>
      setTimeout(() => this.#zone.run(() => void this.#runEstimate()), ESTIMATE_DELAY_MS)
    );
  }

  /** Encodes the committed output once to learn its real size. Single-flight: a newer request waits its turn. */
  async #runEstimate(): Promise<void> {
    this.#estimateTimer = null;
    if (this.#estimating) {
      this.#estimateQueued = true;
      return;
    }
    const key = this.#outputKey();
    const loaded = this.#loaded();
    const edits = this.#history()?.present;
    const size = this.#outputSize();
    if (!key || !loaded || !edits || !size || this.#destroyed) return;
    this.#estimating = true;
    const format = this.format();
    const quality = sdImageEditorClampQuality(this.quality());
    try {
      const encoded = await sdImageEditorExport(this.#document, this.#request(loaded, edits, size, format, quality));
      if (this.#destroyed || loaded.seq !== this.#loadSeq) return;
      this.#encoded = { key, blob: encoded.blob, format: encoded.format };
      if (this.#outputKey() === key) this.#estimate.set({ key, status: 'ready', size: encoded.blob.size });
    } catch (error) {
      if (this.#destroyed || loaded.seq !== this.#loadSeq) return;
      if (this.#outputKey() === key) this.#estimate.set({ key, status: 'error', error: this.#toError(error, 'export') });
    } finally {
      this.#estimating = false;
      if (this.#estimateQueued && !this.#destroyed) {
        this.#estimateQueued = false;
        const current = this.#outputKey();
        if (current && this.#estimate()?.key === current && this.#estimate()?.status === 'pending') void this.#runEstimate();
      }
    }
  }

  #clearEstimate(): void {
    if (this.#estimateTimer) clearTimeout(this.#estimateTimer);
    this.#estimateTimer = null;
    this.#estimateQueued = false;
    this.#estimate.set(null);
  }

  #toError(error: unknown, stage: SdImageEditorError['stage']): SdImageEditorError {
    const failure = error instanceof SdImageEditorFailure ? error : null;
    const code: SdImageEditorErrorCode = failure?.code ?? (stage === 'load' ? 'decode-failed' : 'encode-failed');
    return { code, stage, message: this.#message(code, failure?.detail), cause: failure ? failure.detail : error };
  }

  #message(code: SdImageEditorErrorCode, detail: unknown): string {
    const t = (key: string, params?: Record<string, string | number>) => this.#i18n.t(`core.component.image-editor.error.${key}`, params);
    const locale = this.#i18n.locale();
    const limits = this.#limits();
    switch (code) {
      case 'source-too-large':
        return t(code, {
          size: sdImageEditorFormatBytes(typeof detail === 'number' ? detail : 0, locale),
          max: sdImageEditorFormatBytes(limits.maxSourceSize, locale),
        });
      case 'source-too-many-pixels': {
        const size = detail as Partial<SdImageEditorSize> | undefined;
        return t(code, {
          width: size?.width ?? 0,
          height: size?.height ?? 0,
          max: round(limits.maxSourcePixels / 1_000_000, 1),
        });
      }
      case 'format-unsupported':
        return t(code, { format: FORMAT_LABELS[this.format()] });
      default:
        return t(code);
    }
  }

  #teardown(): void {
    this.#destroyed = true;
    this.#loadSeq++;
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    this.#releaseSource();
  }
}

function positive(value: number | null | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as HTMLElement).tagName !== 'string') return false;
  const element = target as HTMLElement;
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable;
}
