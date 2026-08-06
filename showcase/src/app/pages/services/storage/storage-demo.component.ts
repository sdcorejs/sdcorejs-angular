import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdStorage, SdStorageService } from '@sdcorejs/angular/services/storage';

@Component({
  selector: 'app-storage-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <demo-page
      #demoPage
      title="Storage"
      description="SdStorageService.create(key) trả về typed handle reactive. Dữ liệu dùng versioned graph serializer, legacy migration và local/session adapter SSR-safe.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-localstorage') {
        <demo-section
          heading="localStorage"
          [props]="[{ name: 'type', value: 'local' }]"
          note="Key 'demo:user-name'. Đóng trình duyệt rồi mở lại vẫn còn.">
          <mat-form-field appearance="outline" style="width:240px">
            <mat-label>Tên người dùng</mat-label>
            <input matInput [(ngModel)]="draftLocal" placeholder="Nhập tên..." />
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="saveLocal()">Lưu</button>
          <button mat-stroked-button (click)="readLocal()">Đọc lại</button>
          <button mat-stroked-button color="warn" (click)="removeLocal()">Xóa</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-sessionstorage') {
        <demo-section
          heading="sessionStorage"
          [props]="[{ name: 'type', value: 'session' }]"
          note="Key 'demo:session-note'. Mất khi đóng tab.">
          <mat-form-field appearance="outline" style="width:240px">
            <mat-label>Ghi chú phiên</mat-label>
            <input matInput [(ngModel)]="draftSession" placeholder="Nhập ghi chú..." />
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="saveSession()">Lưu (session)</button>
          <button mat-stroked-button color="warn" (click)="removeSession()">Xóa</button>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-gia-tri-dang-luu-cap-nhat-truc-tiep-qua-subject') {
        <demo-section heading="Giá trị đang lưu (cập nhật trực tiếp qua subject)">
          <pre style="margin:0;font-size:12px;background:#f5f5f5;padding:8px 12px;border-radius:6px;width:100%">
demo:user-name    = {{ liveLocal() ?? '(trống)' }}
demo:session-note = {{ liveSession() ?? '(trống)' }}</pre
          >
        </demo-section>
      }
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorageDemoComponent implements OnDestroy {
  readonly #storage = inject(SdStorageService);
  readonly #local: SdStorage<string> = this.#storage.create<string>('demo:user-name');
  readonly #session: SdStorage<string> = this.#storage.create<string>('demo:session-note', { type: 'session' });

  draftLocal = '';
  draftSession = '';
  readonly liveLocal = signal<string | undefined>(this.#local.get());
  readonly liveSession = signal<string | undefined>(this.#session.get());

  readonly #subLocal = this.#local.observer.subscribe(v => this.liveLocal.set(v));
  readonly #subSession = this.#session.observer.subscribe(v => this.liveSession.set(v));

  saveLocal() {
    this.#local.set(this.draftLocal);
  }
  readLocal() {
    this.draftLocal = this.#local.get() ?? '';
  }
  removeLocal() {
    this.#local.remove();
    this.draftLocal = '';
  }

  saveSession() {
    this.#session.set(this.draftSession);
  }
  removeSession() {
    this.#session.remove();
    this.draftSession = '';
  }

  ngOnDestroy() {
    this.#subLocal.unsubscribe();
    this.#subSession.unsubscribe();
  }
}
