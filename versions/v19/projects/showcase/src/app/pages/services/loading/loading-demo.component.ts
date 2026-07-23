import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdLoadingRef, SdLoadingService } from '@sdcorejs/angular/services/loading';

@Component({
  selector: 'app-loading-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, MatButtonModule],
  template: `
    <demo-page
      #demoPage
      title="Loading"
      description="SdLoadingService – handle/ref-counted overlay cho mọi phần tử khớp selector, có run() scope, ARIA busy, SSR no-op và teardown xác định.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-loading-toan-trang') {
        <demo-section
          heading="Loading toàn trang"
          [props]="[{ name: 'start()', value: 'body' }]"
          note="run() luôn đóng loading ref trong finally và giữ nguyên result/error của task.">
          <button mat-flat-button color="primary" [disabled]="busy()" (click)="onFullPage()">Hiển thị loading toàn trang</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-loading-o-dich') {
        <demo-section
          heading="Loading ô đích"
          [props]="[{ name: 'start()', value: '#demo-target' }]"
          note="start('#demo-target') trả về handle idempotent sở hữu đúng host đã match.">
          <button mat-flat-button color="primary" (click)="onTarget()">Loading vùng bên dưới</button>
          <div id="demo-target" class="demo-host">Nội dung mẫu — loading sẽ phủ chính khung này.</div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhieu-host-cung-selector-multi-tab') {
        <demo-section
          heading="Nhiều host cùng selector (multi-tab)"
          [props]="[
            { name: 'start()', value: '.demo-tab-panel' },
            { name: 'querySelectorAll', value: 'all matches' },
          ]"
          note="Hai owner overlap trên cùng hai host; đóng owner đầu không gỡ overlay của owner thứ hai.">
          <button mat-flat-button color="primary" (click)="onMultiHost()">Chạy hai owner overlap</button>
          <div class="demo-tabs">
            <div class="demo-tab-panel demo-host">
              <strong>Tab 1</strong>
              <p>Panel đầu tiên trong DOM.</p>
            </div>
            <div class="demo-tab-panel demo-host">
              <strong>Tab 2</strong>
              <p>Panel thứ hai — trước đây không hiện loading vì querySelector chỉ lấy phần tử đầu.</p>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bat-tat-thu-cong') {
        <demo-section
          heading="Bật / tắt thủ công"
          [props]="[
            { name: 'start()', value: 'SdLoadingRef' },
            { name: 'close()', value: 'idempotent' },
            { name: 'stop()', value: 'compatibility FIFO' },
            { name: 'isLoading()', value: 'method' },
          ]"
          note="Code mới giữ ref; stop(selector) vẫn hoạt động cho call site cũ theo thứ tự start cũ nhất.">
          <button mat-stroked-button (click)="onStart()">Bật loading</button>
          <button mat-stroked-button color="warn" (click)="onStop()">Tắt loading</button>
          <button mat-stroked-button (click)="onCheck()">Kiểm tra trạng thái</button>
          <span class="demo-status">Trạng thái: {{ status() }}</span>
        </demo-section>
      }
    </demo-page>
  `,
  styles: `
    .demo-host {
      position: relative;
      width: 100%;
      min-height: 120px;
      background: #fafafa;
      border: 1px dashed #bdbdbd;
      border-radius: 6px;
      padding: 16px;
      margin-top: 8px;
    }
    .demo-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 8px;
    }
    .demo-tabs .demo-host {
      margin-top: 0;
    }
    .demo-status {
      font-size: 12px;
      color: #666;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingDemoComponent {
  readonly #loading = inject(SdLoadingService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #timers = new Set<ReturnType<typeof setTimeout>>();
  readonly #refs = new Set<SdLoadingRef>();
  readonly busy = signal(false);
  readonly status = signal('chưa kiểm tra');
  #manualRef: SdLoadingRef | undefined;

  constructor() {
    this.#destroyRef.onDestroy(() => {
      for (const timer of this.#timers) clearTimeout(timer);
      for (const ref of this.#refs) ref.close();
      this.#timers.clear();
      this.#refs.clear();
    });
  }

  async onFullPage(): Promise<void> {
    this.busy.set(true);
    try {
      await this.#loading.run(this.#delay(1200));
    } finally {
      this.busy.set(false);
    }
  }

  onTarget(): void {
    const ref = this.#trackRef(this.#loading.start('#demo-target'));
    this.#schedule(() => this.#closeRef(ref), 1200);
  }

  onMultiHost(): void {
    const first = this.#trackRef(this.#loading.start('.demo-tab-panel'));
    const second = this.#trackRef(this.#loading.start('.demo-tab-panel'));
    this.status.set('2 owner đang giữ overlay');
    this.#schedule(() => {
      this.#closeRef(first);
      this.status.set('owner 1 đã đóng, owner 2 vẫn giữ overlay');
    }, 800);
    this.#schedule(() => {
      this.#closeRef(second);
      this.status.set('cả 2 owner đã đóng');
    }, 1600);
  }

  onStart(): void {
    if (this.#manualRef && !this.#manualRef.closed) return;
    this.#manualRef = this.#trackRef(this.#loading.start());
    this.status.set('manual ref đang mở');
  }

  onStop(): void {
    if (this.#manualRef) this.#closeRef(this.#manualRef);
    else this.#loading.stop();
    this.#manualRef = undefined;
    this.status.set('manual ref đã đóng');
  }

  onCheck(): void {
    this.status.set(this.#loading.isLoading() ? 'đang loading' : 'không loading');
  }

  #delay(milliseconds: number): Promise<void> {
    return new Promise(resolve => this.#schedule(resolve, milliseconds));
  }

  #schedule(callback: () => void, milliseconds: number): void {
    const timer = setTimeout(() => {
      this.#timers.delete(timer);
      callback();
    }, milliseconds);
    this.#timers.add(timer);
  }

  #trackRef(ref: SdLoadingRef): SdLoadingRef {
    if (!ref.closed) this.#refs.add(ref);
    return ref;
  }

  #closeRef(ref: SdLoadingRef): void {
    ref.close();
    this.#refs.delete(ref);
  }
}
