import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdLoadingService } from '@sdcorejs/angular/services/loading';

@Component({
  selector: 'app-loading-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, MatButtonModule],
  template: `
    <demo-page title="Loading" description="SdLoadingService – phủ spinner lên một phần tử bất kỳ qua CSS selector. Hai API chính: start(selector) và stop(selector). Mặc định selector là 'body'.">
      <demo-section heading="Loading toàn trang" [props]="[{ name: 'start()', value: 'global' }]" note="start('body') -> setTimeout 2000ms -> stop('body').">
        <button mat-flat-button color="primary" [disabled]="busy()" (click)="onFullPage()">Hiển thị loading toàn trang</button>
      </demo-section>

      <demo-section heading="Loading ô đích" [props]="[{ name: 'start()', value: 'target' }]" note="start('#demo-target') chỉ phủ phần tử có id='demo-target'.">
        <button mat-flat-button color="primary" (click)="onTarget()">Loading vùng bên dưới</button>
        <div id="demo-target" style="position:relative;width:100%;min-height:120px;background:#fafafa;border:1px dashed #bdbdbd;border-radius:6px;padding:16px;margin-top:8px">
          Nội dung mẫu — loading sẽ phủ chính khung này.
        </div>
      </demo-section>

      <demo-section heading="Bật / tắt thủ công" [props]="[{ name: 'start()', value: 'method' }, { name: 'stop()', value: 'method' }, { name: 'isLoading()', value: 'method' }]" note="Kiểm tra trạng thái bằng isLoading('body').">
        <button mat-stroked-button (click)="onStart()">Bật loading</button>
        <button mat-stroked-button color="warn" (click)="onStop()">Tắt loading</button>
        <button mat-stroked-button (click)="onCheck()">Kiểm tra trạng thái</button>
        <span style="font-size:12px;color:#666">Trạng thái: {{ status() }}</span>
      </demo-section>
    </demo-page>
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

  onStart() { this.#loading.start(); }
  onStop() { this.#loading.stop(); }
  onCheck() {
    this.status.set(this.#loading.isLoading() ? 'đang loading' : 'không loading');
  }
}
