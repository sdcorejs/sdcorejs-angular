import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, WritableSignal, computed, inject, signal, viewChild } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdImageEditor, SdImageEditorError, SdImageEditorOption, SdImageEditorResult } from '@sdcorejs/angular/components/image-editor';
import { SdUploadFile, SdUploadFileDetail, SdUploadFileFuncDetails, SdUploadFileFuncUpload } from '@sdcorejs/angular/components/upload-file';
import { SdFileExplorer, SdFileExplorerItem, SdFileExplorerOpenEvent, SdFileExplorerOption } from '@sdcorejs/angular/components/file-explorer';

type Rgb = readonly [number, number, number];

const rgb = ([r, g, b]: Rgb, alpha = 1) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

/**
 * Test image drawn in the browser: four differently coloured corners and an asymmetric "F" + arrow, so a wrong
 * rotation, a mirrored export or an off-by-one crop is visible at a glance. `transparent` leaves the area outside
 * a rounded frame transparent (to try the JPEG background).
 */
function drawFixture(width: number, height: number, options: { transparent?: boolean; label?: string } = {}): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, rgb([214, 228, 247]));
  gradient.addColorStop(1, rgb([146, 180, 222]));
  if (options.transparent) {
    const r = Math.min(width, height) * 0.18;
    ctx.beginPath();
    ctx.roundRect(width * 0.06, height * 0.06, width * 0.88, height * 0.88, r);
    ctx.clip();
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  // Corner markers: red TL, green TR, blue BL, yellow BR.
  const s = Math.round(Math.min(width, height) * 0.16);
  const inset = options.transparent ? Math.round(Math.min(width, height) * 0.1) : 0;
  const corners: [number, number, Rgb][] = [
    [inset, inset, [220, 38, 38]],
    [width - inset - s, inset, [22, 163, 74]],
    [inset, height - inset - s, [37, 99, 235]],
    [width - inset - s, height - inset - s, [234, 179, 8]],
  ];
  for (const [x, y, color] of corners) {
    ctx.fillStyle = rgb(color);
    ctx.fillRect(x, y, s, s);
  }
  // Rule-of-thirds grid.
  ctx.strokeStyle = rgb([255, 255, 255], 0.55);
  ctx.lineWidth = Math.max(1, Math.round(Math.min(width, height) / 300));
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo((width * i) / 3, 0);
    ctx.lineTo((width * i) / 3, height);
    ctx.moveTo(0, (height * i) / 3);
    ctx.lineTo(width, (height * i) / 3);
    ctx.stroke();
  }
  // Asymmetric glyph: an "F" (mirrors and rotations are obvious) and an arrow pointing to the top.
  const unit = Math.min(width, height) / 10;
  ctx.fillStyle = rgb([15, 23, 42]);
  const fx = width / 2 - unit * 1.2;
  const fy = height / 2 - unit * 2;
  ctx.fillRect(fx, fy, unit * 0.7, unit * 4);
  ctx.fillRect(fx, fy, unit * 2.4, unit * 0.7);
  ctx.fillRect(fx, fy + unit * 1.6, unit * 1.7, unit * 0.7);
  ctx.beginPath();
  ctx.moveTo(fx + unit * 3.4, fy + unit * 1.2);
  ctx.lineTo(fx + unit * 4.1, fy);
  ctx.lineTo(fx + unit * 4.8, fy + unit * 1.2);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(fx + unit * 3.85, fy + unit * 1.1, unit * 0.5, unit * 2.9);
  ctx.font = `600 ${Math.round(unit * 0.55)}px system-ui, sans-serif`;
  ctx.fillText(options.label ?? `${width} × ${height}`, fx, fy + unit * 4.9);
  return canvas;
}

function canvasBlob(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), type, quality));
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** A receipt photographed sideways on a desk: the typical evidence photo that needs a rotation and a crop. */
function drawEvidence(title: string, amount: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const desk = ctx.createLinearGradient(0, 0, 1200, 900);
  desk.addColorStop(0, rgb([122, 86, 60]));
  desk.addColorStop(1, rgb([84, 57, 40]));
  ctx.fillStyle = desk;
  ctx.fillRect(0, 0, 1200, 900);
  ctx.save();
  ctx.translate(600, 450);
  ctx.rotate(-Math.PI / 2 + 0.05);
  ctx.fillStyle = rgb([0, 0, 0], 0.25);
  ctx.fillRect(-268, -408, 560, 840);
  ctx.fillStyle = rgb([250, 250, 245]);
  ctx.fillRect(-280, -420, 560, 840);
  ctx.fillStyle = rgb([28, 28, 30]);
  ctx.font = '700 40px system-ui, sans-serif';
  ctx.fillText(title, -240, -340);
  ctx.font = '26px system-ui, sans-serif';
  ctx.fillText('Ngày 28/09/2026 · Quầy 03', -240, -290);
  ctx.fillStyle = rgb([28, 28, 30], 0.7);
  for (let i = 0; i < 12; i++) {
    ctx.fillRect(-240, -220 + i * 44, 280 - (i % 3) * 40, 14);
    ctx.fillRect(150, -220 + i * 44, 90, 14);
  }
  ctx.fillStyle = rgb([28, 28, 30]);
  ctx.font = '700 44px system-ui, sans-serif';
  ctx.fillText(`TỔNG ${amount}`, -240, 360);
  ctx.strokeStyle = rgb([200, 30, 30], 0.8);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(170, 300, 70, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  return canvas;
}

/**
 * What a consumer writes to open the editor from anywhere (upload field, file explorer, table row…): one modal whose
 * footer holds the consumer's own Cancel / Apply buttons, and a promise that resolves with the result on Apply and
 * with `null` on Cancel or close.
 */
class EditorDialog {
  readonly source = signal<Blob | null>(null);
  #resolve: ((result: SdImageEditorResult | null) => void) | null = null;

  constructor(
    private readonly modal: () => SdModal,
    private readonly editor: () => SdImageEditor | undefined
  ) {}

  /** Apply is available once the image is loaded and while nothing is being encoded. */
  readonly canApply = computed(() => this.editor()?.status() === 'ready');
  readonly applying = computed(() => this.editor()?.status() === 'exporting');

  open(source: Blob): Promise<SdImageEditorResult | null> {
    this.#settle(null);
    this.source.set(source);
    this.modal().open();
    return new Promise(resolve => (this.#resolve = resolve));
  }

  /** The Apply button of the modal footer. On failure the editor shows the error and the modal stays open. */
  async apply(): Promise<void> {
    const editor = this.editor();
    if (!editor) return;
    try {
      const result = await editor.getResult();
      this.#settle(result);
      this.modal().close();
    } catch {
      // Shown by the editor (error() / the notice in its panel); the user can change the format and retry.
    }
  }

  /** Bound to `(sdClosed)`: Cancel, the close button, Esc (anything but Apply) yields `null`. */
  closed(): void {
    this.#settle(null);
    this.source.set(null);
  }

  #settle(result: SdImageEditorResult | null): void {
    const resolve = this.#resolve;
    this.#resolve = null;
    resolve?.(result);
  }
}

/** In-memory "server": every upload gets a new key, nothing is ever overwritten. */
class DemoImageStore {
  readonly #items = new Map<string, { blob: Blob; name: string; url: string }>();
  #seq = 0;

  put(blob: Blob, name: string): string {
    const key = `img-${++this.#seq}`;
    this.#items.set(key, { blob, name, url: URL.createObjectURL(blob) });
    return key;
  }

  has(key: string): boolean {
    return this.#items.has(key);
  }

  get(key: string): { blob: Blob; name: string } | undefined {
    return this.#items.get(key);
  }

  detail(key: string): SdUploadFileDetail | null {
    const item = this.#items.get(key);
    return item ? { idOrKey: key, cdn: item.url, name: item.name, extension: item.name.split('.').pop(), size: item.blob.size } : null;
  }

  get size(): number {
    return this.#items.size;
  }

  dispose(): void {
    for (const item of this.#items.values()) URL.revokeObjectURL(item.url);
    this.#items.clear();
  }
}

/** In-memory photo folder behind `sd-file-explorer`. */
class DemoPhotoDrive {
  readonly #files: { item: SdFileExplorerItem; blob: Blob }[] = [];
  #seq = 0;

  add(blob: Blob, name: string): SdFileExplorerItem {
    const item: SdFileExplorerItem = {
      id: `photo-${++this.#seq}`,
      parentId: null,
      name,
      kind: 'file',
      mimeType: blob.type,
      size: blob.size,
      modifiedAt: Date.now(),
    };
    this.#files.push({ item, blob });
    return item;
  }

  blob(id: string): Blob | undefined {
    return this.#files.find(file => file.item.id === id)?.blob;
  }

  readonly option: SdFileExplorerOption = {
    autoId: 'photos',
    title: 'Ảnh sản phẩm',
    description: 'Mở một ảnh rồi bấm Chỉnh sửa phía trên',
    defaultView: 'grid',
    list: () => this.#files.map(file => file.item),
    preview: ({ item }) => this.blob(item.id) ?? null,
    download: ({ item }) => this.blob(item.id),
    upload: ({ file }) => this.add(file, file.name),
  };
}

/** Human-readable facts of a result, as a consumer would log or show them. */
interface ResultView {
  readonly url: string;
  readonly name: string;
  readonly facts: string;
  readonly edits: string;
}

function formatBytes(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

@Component({
  selector: 'app-image-editor-demo',
  standalone: true,
  imports: [NgTemplateOutlet, DemoPageComponent, DemoSectionComponent, SdButton, SdModal, SdImageEditor, SdUploadFile, SdFileExplorer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <demo-page
      #demoPage
      title="Image Editor"
      description="Trình chỉnh sửa ảnh inline: cắt tự do hoặc theo tỷ lệ, xoay 90°, lật, resize theo pixel, zoom/pan, undo/redo và chọn định dạng/chất lượng. Nhận File/Blob, Apply trả Blob/File thật; không tự upload, tải xuống hay ghi đè ảnh gốc.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-anh-dai-dien-vuong-1-1') {
        <demo-section
          heading="Ảnh đại diện vuông 1:1"
          [props]="[
            { name: 'option.aspectRatio', value: '1' },
            { name: 'option.lockAspectRatio', value: 'true' },
            { name: 'output', value: 'JPEG 512 × 512, nền trắng' },
            { name: 'source', value: 'File chọn từ máy / PNG trong suốt' }
          ]"
          note="Ảnh mẫu là PNG có vùng trong suốt: chọn JPEG để thấy ô màu nền. Chọn ảnh của bạn bằng nút bên dưới — ảnh được đọc tại trình duyệt, không gửi đi đâu.">
          <div class="toolbar">
            <label class="picker">
              <input type="file" accept="image/jpeg,image/png,image/webp" (change)="pickAvatar($event)" />
              <span>Chọn ảnh…</span>
            </label>
            <sd-button type="text" color="secondary" size="sm" title="Dùng lại ảnh mẫu" (click)="loadAvatarSample()" />
          </div>
          <div class="frame">
            <sd-image-editor #avatarEditor [source]="avatarSource()" [option]="avatarOption" />
          </div>
          <div class="consumer-actions">
            <sd-button type="outline" color="secondary" size="md" title="Bỏ thay đổi" [disabled]="!avatarEditor.dirty()" (click)="avatarEditor.reset()" />
            <sd-button
              type="fill"
              color="primary"
              size="md"
              prefixIcon="check"
              title="Áp dụng"
              [loading]="avatarEditor.status() === 'exporting'"
              [disabled]="avatarEditor.status() !== 'ready'"
              (click)="applyInline(avatarEditor, avatarResult)" />
          </div>
          <ng-container *ngTemplateOutlet="resultTpl; context: { $implicit: avatarResult() }" />
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-banner-16-9-va-resize-dau-ra') {
        <demo-section
          heading="Banner 16:9 và resize đầu ra"
          [props]="[
            { name: 'option.aspectRatio', value: '16 / 9 (khóa)' },
            { name: 'output.width', value: '1600 (không phóng to)' },
            { name: 'output.format', value: 'image/webp, quality 0.85' },
            { name: 'limits.maxOutputPixels', value: '4 MP' }
          ]"
          note="Ảnh nguồn 3000 × 2000. Vùng cắt 16:9 được thu về 1600 px chiều rộng; gõ kích thước khác trong mục Kích thước. Dung lượng hiển thị là kết quả encode thật, không phải ước tính.">
          <div class="frame">
            <sd-image-editor #bannerEditor [source]="bannerSource()" [option]="bannerOption" />
          </div>
          <div class="consumer-actions">
            <sd-button type="outline" color="secondary" size="md" title="Bỏ thay đổi" [disabled]="!bannerEditor.dirty()" (click)="bannerEditor.reset()" />
            <sd-button
              type="fill"
              color="primary"
              size="md"
              prefixIcon="check"
              title="Áp dụng"
              [loading]="bannerEditor.status() === 'exporting'"
              [disabled]="bannerEditor.status() !== 'ready'"
              (click)="applyInline(bannerEditor, bannerResult)" />
          </div>
          <ng-container *ngTemplateOutlet="resultTpl; context: { $implicit: bannerResult() }" />
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-mo-trong-modal') {
        <demo-section
          heading="Mở trong modal"
          [props]="[
            { name: 'consumer', value: 'tải ảnh → Blob → [source]' },
            { name: '@defer', value: 'chỉ tải editor khi mở' },
            { name: 'Áp dụng (footer modal)', value: 'await editor.getResult()' },
            { name: 'Hủy (footer modal)', value: 'đóng, ảnh giữ nguyên' }
          ]"
          note="Nút Chỉnh sửa mô phỏng consumer tải ảnh có xác thực thành Blob (400 ms) rồi mới mở modal. Nút Hủy/Áp dụng nằm ở footer của modal (của consumer), Áp dụng gọi getResult(). Editor nằm trong @defer; Hủy không đổi ảnh trên thẻ.">
          <div class="product">
            <img class="product__image" [src]="productUrl()" alt="Ảnh sản phẩm hiện tại" />
            <div class="product__body">
              <strong>Ảnh sản phẩm</strong>
              <span>{{ productCaption() }}</span>
              <sd-button
                type="fill"
                color="primary"
                size="md"
                prefixIcon="edit"
                title="Chỉnh sửa ảnh"
                [loading]="fetching()"
                (click)="openProductEditor()" />
            </div>
          </div>
          <sd-modal #productModal title="Chỉnh sửa ảnh sản phẩm" width="lg" (sdClosed)="productSource.set(null)">
            @defer (when productSource()) {
              <div class="modal-frame">
                <sd-image-editor #productEditor [source]="productSource()" [option]="productOption" />
              </div>
            } @placeholder {
              <p class="muted">Đang chuẩn bị trình chỉnh sửa…</p>
            }
            <sd-button sdFooterLeft type="text" color="secondary" title="Hủy" (click)="productModal.close()" />
            <sd-button
              sdFooterRight
              type="fill"
              color="primary"
              prefixIcon="check"
              title="Áp dụng"
              [loading]="productEditor()?.status() === 'exporting'"
              [disabled]="productEditor()?.status() !== 'ready'"
              (click)="applyProduct()" />
          </sd-modal>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-loi-va-gioi-han') {
        <demo-section
          heading="Lỗi và giới hạn"
          [props]="[
            { name: 'limits.maxSourcePixels', value: '2 MP' },
            { name: 'limits.maxSourceSize', value: '2 MB' },
            { name: '(failed)', value: 'SdImageEditorError' }
          ]"
          note="Mỗi nút đưa vào editor một nguồn lỗi: GIF (định dạng không hỗ trợ), ảnh 3000 × 2000 vượt 2 MP (bị chặn trước khi decode), tệp PNG bị cắt cụt. Editor báo lỗi rõ và phát (failed).">
          <div class="toolbar">
            <sd-button type="outline" color="secondary" size="sm" title="GIF" (click)="loadError('gif')" />
            <sd-button type="outline" color="secondary" size="sm" title="Ảnh quá lớn" (click)="loadError('large')" />
            <sd-button type="outline" color="secondary" size="sm" title="Tệp hỏng" (click)="loadError('corrupt')" />
            <sd-button type="text" color="primary" size="sm" title="Ảnh hợp lệ" (click)="loadError('valid')" />
          </div>
          <div class="frame frame--short">
            <sd-image-editor [source]="errorSource()" [option]="errorOption" (failed)="lastError.set($event)" />
          </div>
          <p class="log" aria-live="polite">
            <strong>(failed)</strong>
            @if (lastError(); as error) {
              {{ error.code }} · {{ error.stage }} — {{ error.message }}
            } @else {
              — chưa có lỗi
            }
          </p>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-mo-tu-upload-file-anh-minh-chung') {
        <demo-section
          heading="Mở từ Upload File (ảnh minh chứng)"
          [props]="[
            { name: 'sd-upload-file', value: '[upload] + [details] + [(model)]' },
            { name: 'Sửa ảnh', value: 'Blob từ kho → editor → bản mới' },
            { name: 'model', value: 'thay key cũ bằng key của bản mới' },
            { name: 'ảnh gốc', value: 'giữ nguyên trong kho' }
          ]"
          note="Biên lai chụp bị nằm ngang: bấm Sửa ảnh, xoay phải, cắt rồi Áp dụng. Consumer tải bản mới lên kho (key mới) và thay key trong model của sd-upload-file; bản gốc không bị ghi đè. sd-upload-file không import editor — chỉ trang này ghép hai component.">
          <div class="integration">
            <sd-upload-file
              #evidenceUpload
              label="Ảnh minh chứng"
              type="image"
              previewWidth="120px"
              previewHeight="90px"
              autoId="evidence-upload"
              [max]="4"
              [extensions]="['jpg', 'jpeg', 'png', 'webp']"
              [upload]="uploadEvidence"
              [details]="evidenceDetails"
              [(model)]="evidenceKeys" />
            <div class="toolbar">
              @for (key of storedEvidence(); track key; let index = $index) {
                <sd-button type="outline" color="primary" size="sm" prefixIcon="crop" [title]="'Sửa ảnh ' + (index + 1)" (click)="editEvidence(key)" />
              }
              <sd-button type="text" color="secondary" size="sm" title="Tải lên ảnh vừa chọn" (click)="evidenceUpload.upload()" />
            </div>
            <p class="log" aria-live="polite">{{ evidenceLog() }}</p>
          </div>
          <sd-modal #evidenceModal title="Chỉnh sửa ảnh minh chứng" width="lg" (sdClosed)="evidenceDialog.closed()">
            @defer (when evidenceDialog.source()) {
              <div class="modal-frame">
                <sd-image-editor #evidenceEditor [source]="evidenceDialog.source()" [option]="evidenceEditorOption()" />
              </div>
            }
            <sd-button sdFooterLeft type="text" color="secondary" title="Hủy" (click)="evidenceModal.close()" />
            <sd-button
              sdFooterRight
              type="fill"
              color="primary"
              prefixIcon="check"
              title="Áp dụng"
              [loading]="evidenceDialog.applying()"
              [disabled]="!evidenceDialog.canApply()"
              (click)="evidenceDialog.apply()" />
          </sd-modal>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-mo-tu-file-explorer') {
        <demo-section
          heading="Mở từ File Explorer"
          [props]="[
            { name: '(open)', value: 'nhớ ảnh đang mở' },
            { name: 'nguồn', value: 'Blob từ API của drive' },
            { name: 'Áp dụng', value: 'upload bản -da-sua, reload()' },
            { name: 'ảnh gốc', value: 'không đổi' }
          ]"
          note="Mở một ảnh trong explorer rồi bấm Chỉnh sửa. Kết quả được lưu thành tệp mới (tên có hậu tố -da-sua) và explorer.reload() hiện tệp đó; ảnh gốc giữ nguyên. sd-file-explorer không import editor.">
          <div class="toolbar">
            <sd-button
              type="fill"
              color="primary"
              size="sm"
              prefixIcon="crop"
              [title]="openedPhoto() ? 'Chỉnh sửa ' + openedPhoto()?.name : 'Mở một ảnh để chỉnh sửa'"
              [disabled]="!openedPhoto()"
              (click)="editOpenedPhoto()" />
          </div>
          <div class="frame frame--short">
            <sd-file-explorer #photoExplorer [option]="photoDrive.option" (open)="onPhotoOpen($event)" />
          </div>
          <p class="log" aria-live="polite">{{ photoLog() }}</p>
          <sd-modal #photoModal title="Chỉnh sửa ảnh trong thư mục" width="lg" (sdClosed)="photoDialog.closed()">
            @defer (when photoDialog.source()) {
              <div class="modal-frame">
                <sd-image-editor #photoEditor [source]="photoDialog.source()" [option]="photoEditorOption()" />
              </div>
            }
            <sd-button sdFooterLeft type="text" color="secondary" title="Hủy" (click)="photoModal.close()" />
            <sd-button
              sdFooterRight
              type="fill"
              color="primary"
              prefixIcon="check"
              title="Áp dụng"
              [loading]="photoDialog.applying()"
              [disabled]="!photoDialog.canApply()"
              (click)="photoDialog.apply()" />
          </sd-modal>
        </demo-section>
      }
    </demo-page>

    <ng-template #resultTpl let-result>
      @if (result) {
        <figure class="result">
          <img [src]="result.url" [alt]="'Kết quả ' + result.name" />
          <figcaption>
            <strong>getResult()</strong> {{ result.name }}<br />
            {{ result.facts }}<br />
            <code>{{ result.edits }}</code>
          </figcaption>
        </figure>
      } @else {
        <p class="log"><strong>getResult()</strong> — chưa áp dụng</p>
      }
    </ng-template>
  `,
  styles: `
    .frame {
      box-sizing: border-box;
      /* why: demo-section xếp con theo flex — frame phải giãn hết bề ngang, nếu không editor đo được bề rộng nhỏ
         và vào layout compact. */
      width: 100%;
      height: 640px;
    }
    .frame--short {
      height: 560px;
    }
    .modal-frame {
      height: min(72vh, 680px);
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .picker {
      position: relative;
      display: inline-flex;
      align-items: center;
      height: 32px;
      padding: 0 12px;
      border: 1px solid var(--sd-border, #c4c6d0);
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
    }
    .picker:focus-within {
      outline: 2px solid var(--sd-focus-ring-color, #005cbb);
      outline-offset: 2px;
    }
    .picker input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }
    .result {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 16px;
      margin: 16px 0 0;
      font-size: 13px;
      line-height: 20px;
    }
    .result img {
      max-width: 240px;
      max-height: 180px;
      border: 1px solid var(--sd-border, #c4c6d0);
      border-radius: 8px;
      background: repeating-conic-gradient(rgba(0, 0, 0, 0.08) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px;
    }
    .result code {
      font-size: 12px;
      word-break: break-all;
    }
    .product {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border: 1px solid var(--sd-border, #c4c6d0);
      border-radius: 12px;
      max-width: 560px;
    }
    .product__image {
      width: 200px;
      height: 150px;
      object-fit: cover;
      border-radius: 8px;
      background: var(--sd-surface-muted, #e7e8ed);
    }
    .product__body {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 13px;
    }
    .consumer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 12px;
    }
    .integration {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 640px;
    }
    .log,
    .muted {
      margin: 12px 0 0;
      font-size: 13px;
      color: var(--docs-text-secondary, #4a4a4a);
    }
  `,
})
export class ImageEditorDemoComponent {
  readonly #urls = new Set<string>();

  readonly avatarOption: SdImageEditorOption = {
    autoId: 'avatar',
    aspectRatio: 1,
    lockAspectRatio: true,
    output: { format: 'image/jpeg', quality: 0.9, width: 512, height: 512, fileName: 'avatar' },
    limits: { maxSourceSize: 20 * 1024 * 1024 },
  };
  readonly avatarSource = signal<Blob | null>(null);
  readonly avatarResult = signal<ResultView | null>(null);

  readonly bannerOption: SdImageEditorOption = {
    autoId: 'banner',
    aspectRatio: 16 / 9,
    lockAspectRatio: true,
    output: { format: 'image/webp', quality: 0.85, width: 1600, fileName: 'banner' },
    limits: { maxOutputPixels: 4_000_000 },
  };
  readonly bannerSource = signal<Blob | null>(null);
  readonly bannerResult = signal<ResultView | null>(null);

  readonly productOption: SdImageEditorOption = {
    autoId: 'product',
    aspectRatios: [{ value: null }, { value: 4 / 3 }, { value: 1 }],
    aspectRatio: 4 / 3,
    output: { format: 'image/jpeg', width: 1200, fileName: 'product' },
  };
  readonly productModal = viewChild.required<SdModal>('productModal');
  readonly productEditor = viewChild<SdImageEditor>('productEditor');
  readonly productSource = signal<Blob | null>(null);
  readonly productUrl = signal('');
  readonly productCaption = signal('Ảnh gốc 1600 × 1200 PNG');
  readonly fetching = signal(false);
  #productBlob: Blob | null = null;

  readonly errorOption: SdImageEditorOption = {
    autoId: 'errors',
    limits: { maxSourcePixels: 2_000_000, maxSourceSize: 2 * 1024 * 1024 },
  };
  readonly errorSource = signal<Blob | null>(null);
  readonly lastError = signal<SdImageEditorError | null>(null);

  // ---- Opened from sd-upload-file ----
  readonly #store = new DemoImageStore();
  readonly evidenceModal = viewChild.required<SdModal>('evidenceModal');
  readonly evidenceEditor = viewChild<SdImageEditor>('evidenceEditor');
  readonly evidenceDialog = new EditorDialog(
    () => this.evidenceModal(),
    () => this.evidenceEditor()
  );
  readonly evidenceKeys = signal<(string | number)[]>([]);
  readonly evidenceLog = signal('Chưa chỉnh sửa ảnh nào.');
  readonly evidenceEditorOption = signal<SdImageEditorOption>({ autoId: 'evidence' });
  /** Keys already stored on the "server" (a fresh pick carries an internal key until it is uploaded). */
  readonly storedEvidence = computed(() =>
    this.evidenceKeys()
      .map(String)
      .filter(key => this.#store.has(key))
  );

  /** `[upload]` of sd-upload-file: store each picked file under a new key. */
  readonly uploadEvidence: SdUploadFileFuncUpload<unknown> = async files => files.map(file => this.#store.put(file, file.name));
  /** `[details]` of sd-upload-file: resolve keys to preview URLs. */
  readonly evidenceDetails: SdUploadFileFuncDetails<unknown> = async keys =>
    keys.map(key => this.#store.detail(String(key))).filter((detail): detail is SdUploadFileDetail => !!detail);

  async editEvidence(key: string): Promise<void> {
    const stored = this.#store.get(key);
    if (!stored) return;
    const stem = stored.name.replace(/\.[^.]+$/, '');
    this.evidenceEditorOption.set({
      autoId: 'evidence',
      aspectRatios: [{ value: null }, { value: 3 / 4 }, { value: 4 / 3 }],
      output: { format: 'image/jpeg', quality: 0.85, width: 1600, height: 1600, fileName: `${stem}-v2` },
    });
    // In an app the blob comes from your API (with auth); the editor only ever sees a File/Blob.
    const result = await this.evidenceDialog.open(new File([stored.blob], stored.name, { type: stored.blob.type }));
    if (!result) {
      this.evidenceLog.set(`Đã hủy — ${key} không đổi.`);
      return;
    }
    const newKey = this.#store.put(result.blob, result.fileName);
    this.evidenceKeys.update(keys => keys.map(value => (String(value) === key ? newKey : value)));
    this.evidenceLog.set(
      `${key} → ${newKey}: ${result.fileName}, ${result.width} × ${result.height}, ${formatBytes(result.size)}. Bản gốc ${key} vẫn còn trong kho (${this.#store.size} tệp).`
    );
  }

  // ---- Opened from sd-file-explorer ----
  readonly photoDrive = new DemoPhotoDrive();
  readonly photoExplorer = viewChild<SdFileExplorer>('photoExplorer');
  readonly photoModal = viewChild.required<SdModal>('photoModal');
  readonly photoEditor = viewChild<SdImageEditor>('photoEditor');
  readonly photoDialog = new EditorDialog(
    () => this.photoModal(),
    () => this.photoEditor()
  );
  readonly openedPhoto = signal<SdFileExplorerItem | null>(null);
  readonly photoLog = signal('Chưa mở ảnh nào.');
  readonly photoEditorOption = signal<SdImageEditorOption>({ autoId: 'photo' });

  onPhotoOpen(event: SdFileExplorerOpenEvent): void {
    const image = event.item.mimeType?.startsWith('image/') ? event.item : null;
    this.openedPhoto.set(image);
    this.photoLog.set(image ? `Đang mở ${image.name}.` : `${event.item.name} không phải ảnh.`);
  }

  async editOpenedPhoto(): Promise<void> {
    const item = this.openedPhoto();
    const blob = item && this.photoDrive.blob(item.id);
    if (!item || !blob) return;
    const stem = item.name.replace(/\.[^.]+$/, '');
    this.photoEditorOption.set({ autoId: 'photo', output: { fileName: `${stem}-da-sua` } });
    const result = await this.photoDialog.open(new File([blob], item.name, { type: blob.type }));
    if (!result) {
      this.photoLog.set(`Đã hủy — ${item.name} không đổi.`);
      return;
    }
    const saved = this.photoDrive.add(result.blob, result.fileName);
    this.photoExplorer()?.reload();
    this.photoLog.set(`Đã lưu ${saved.name} (${result.width} × ${result.height}, ${formatBytes(result.size)}); ${item.name} giữ nguyên.`);
  }

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.#store.dispose();
      // The page owns the object URLs it created for results; the editor never revokes them.
      for (const url of this.#urls) URL.revokeObjectURL(url);
      this.#urls.clear();
    });
    void this.loadAvatarSample();
    void canvasBlob(drawFixture(3000, 2000, { label: 'Banner nguồn 3000 × 2000' }), 'image/jpeg', 0.92).then(blob => this.bannerSource.set(blob));
    void canvasBlob(drawFixture(1600, 1200, { label: 'Sản phẩm 1600 × 1200' })).then(blob => {
      this.#productBlob = blob;
      this.productUrl.set(this.#track(URL.createObjectURL(blob)));
    });
    void this.loadError('valid');
    void Promise.all([
      canvasBlob(drawEvidence('BIÊN LAI #0042', '1.250.000đ'), 'image/jpeg', 0.9),
      canvasBlob(drawEvidence('PHIẾU NHẬP #17', '860.000đ'), 'image/jpeg', 0.9),
    ]).then(([a, b]) => this.evidenceKeys.set([this.#store.put(a, 'bien-lai-0042.jpg'), this.#store.put(b, 'phieu-nhap-17.jpg')]));
    void Promise.all([
      canvasBlob(drawFixture(1600, 1200, { label: 'giay-the-thao.png' })),
      canvasBlob(drawFixture(1400, 1400, { label: 'balo.jpg' }), 'image/jpeg', 0.9),
    ]).then(([shoes, bag]) => {
      this.photoDrive.add(shoes, 'giay-the-thao.png');
      this.photoDrive.add(bag, 'balo.jpg');
      this.photoExplorer()?.reload();
    });
  }

  async loadAvatarSample(): Promise<void> {
    this.avatarSource.set(await canvasBlob(drawFixture(900, 700, { transparent: true, label: 'PNG trong suốt' })));
  }

  pickAvatar(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.avatarSource.set(file);
  }

  /** Simulates a consumer downloading an authenticated image into a Blob before opening the editor. */
  async openProductEditor(): Promise<void> {
    if (!this.#productBlob || this.fetching()) return;
    this.fetching.set(true);
    try {
      // In an app: `await firstValueFrom(http.get(url, { responseType: 'blob' }))` with your auth interceptor.
      await wait(400);
      this.productSource.set(this.#productBlob);
      this.productModal().open();
    } finally {
      this.fetching.set(false);
    }
  }

  /** Apply of the modal footer: ask the editor for the result, then do what the app needs with it. */
  async applyProduct(): Promise<void> {
    const editor = this.productEditor();
    if (!editor) return;
    let result: SdImageEditorResult;
    try {
      result = await editor.getResult();
    } catch {
      return; // the editor shows the error; the modal stays open
    }
    // Here: show it on the card (an app would upload it).
    this.#productBlob = result.blob;
    const previous = this.productUrl();
    this.productUrl.set(this.#track(URL.createObjectURL(result.blob)));
    this.#release(previous);
    this.productCaption.set(`${result.fileName} · ${result.width} × ${result.height} · ${formatBytes(result.size)}`);
    this.productModal().close();
  }

  async loadError(kind: 'gif' | 'large' | 'corrupt' | 'valid'): Promise<void> {
    this.lastError.set(null);
    if (kind === 'gif') {
      const gif = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0));
      this.errorSource.set(new Blob([gif], { type: 'image/gif' }));
    } else if (kind === 'large') {
      this.errorSource.set(await canvasBlob(drawFixture(3000, 2000), 'image/jpeg', 0.6));
    } else if (kind === 'corrupt') {
      const png = new Uint8Array(await (await canvasBlob(drawFixture(200, 150))).arrayBuffer());
      this.errorSource.set(new Blob([png.subarray(0, 120)], { type: 'image/png' }));
    } else {
      this.errorSource.set(await canvasBlob(drawFixture(1200, 800)));
    }
  }

  /** Apply button under an inline editor. */
  async applyInline(editor: SdImageEditor, target: WritableSignal<ResultView | null>): Promise<void> {
    try {
      this.showResult(target, await editor.getResult());
    } catch {
      // The editor shows the error in its panel.
    }
  }

  /** Shows a result under the editor; the page creates (and later revokes) the object URL, never the editor. */
  showResult(target: WritableSignal<ResultView | null>, result: SdImageEditorResult | null): void {
    const previous = target();
    target.set(result ? this.#view(result) : null);
    if (previous) this.#release(previous.url);
  }

  #view(result: SdImageEditorResult): ResultView {
    const url = this.#track(URL.createObjectURL(result.blob));
    const { crop, rotate, flip, resize } = result.edits;
    return {
      url,
      name: result.fileName,
      facts: `${result.mimeType} · ${result.width} × ${result.height} px · ${formatBytes(result.size)}${result.file ? ' · File' : ' · Blob'}${
        result.sizeLimited ? ' · đã giới hạn kích thước' : ''
      }`,
      edits: JSON.stringify({ rotate, flip, crop, resize }),
    };
  }

  #track(url: string): string {
    this.#urls.add(url);
    return url;
  }

  #release(url: string): void {
    if (!this.#urls.delete(url)) return;
    URL.revokeObjectURL(url);
  }
}
