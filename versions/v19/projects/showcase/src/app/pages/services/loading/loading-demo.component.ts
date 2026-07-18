import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdLoadingService } from '@sdcorejs/angular/services/loading';

@Component({
  selector: 'app-loading-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, MatButtonModule],
  template: `
    <demo-page
      #demoPage
      title="Loading"
      description="SdLoadingService – phủ spinner lên phần tử khớp CSS selector. start/stop/isLoading dùng querySelectorAll nên mọi host trùng selector (ví dụ nhiều tab router) đều nhận overlay.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-loading-toan-trang') {
        <demo-section
          heading="Loading toàn trang"
          [props]="[{ name: 'start()', value: 'body' }]"
          note="start('body') → setTimeout 2000ms → stop('body').">
          <button mat-flat-button color="primary" [disabled]="busy()" (click)="onFullPage()">Hiển thị loading toàn trang</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-loading-o-dich') {
        <demo-section
          heading="Loading ô đích"
          [props]="[{ name: 'start()', value: '#demo-target' }]"
          note="start('#demo-target') chỉ phủ phần tử có id='demo-target'.">
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
          note="Giả lập router tabs: nhiều panel cùng class. Một lần start('.demo-tab-panel') gắn overlay lên cả hai — không chỉ panel đầu tiên.">
          <button mat-flat-button color="primary" (click)="onMultiHost()">Loading cả hai tab</button>
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
            { name: 'start()', value: 'method' },
            { name: 'stop()', value: 'method' },
            { name: 'isLoading()', value: 'method' },
          ]"
          note="Kiểm tra trạng thái bằng isLoading('body').">
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
  readonly busy = signal(false);
  readonly status = signal('chưa kiểm tra');

  onFullPage() {
    this.busy.set(true);
    this.#loading.start();
    setTimeout(() => {
      this.#loading.stop();
      this.busy.set(false);
    }, 2000);
  }

  onTarget() {
    this.#loading.start('#demo-target');
    setTimeout(() => this.#loading.stop('#demo-target'), 2000);
  }

  onMultiHost() {
    this.#loading.start('.demo-tab-panel');
    setTimeout(() => this.#loading.stop('.demo-tab-panel'), 2000);
  }

  onStart() {
    this.#loading.start();
  }
  onStop() {
    this.#loading.stop();
  }
  onCheck() {
    this.status.set(this.#loading.isLoading() ? 'đang loading' : 'không loading');
  }
}
