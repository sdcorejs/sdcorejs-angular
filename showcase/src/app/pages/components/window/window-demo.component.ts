import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdWindow } from '@sdcorejs/angular/components/window';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-window-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DemoPageComponent, DemoSectionComponent, SdButton, SdWindow, SdModal],
  template: `
    <demo-page
      #demoPage
      title="Window"
      description="Cửa sổ chi tiết không chặn trang: thu nhỏ, khôi phục và toàn màn hình. API thống nhất với Core overlays; chưa có kéo hoặc resize bằng tay.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chi-tiet-va-thao-tac') {
        <demo-section
          heading="Chi tiết và thao tác"
          [props]="[
            { name: 'width', value: '480px' },
            { name: 'sdFooterLeft / sdFooterRight', value: 'template' },
          ]">
          <sd-button autoId="window-demo-open" type="fill" color="primary" title="Mở chi tiết đơn hàng" (click)="detail.open()" />
          <sd-button autoId="window-demo-loading" type="text" title="Bật loading" (click)="detail.startLoading()" />
          <sd-button autoId="window-demo-stop-loading" type="text" title="Dừng loading" (click)="detail.stopLoading()" />
          <sd-window #detail width="480px" autoId="detail">
            <span sdHeaderLeft>DH-1024 · Đơn hàng · Chờ xác nhận</span>
            <div class="demo-window-content">
              <h3>Thông tin đơn hàng</h3>
              <dl>
                <dt>Khách hàng</dt>
                <dd>Công ty An Bình</dd>
                <dt>Ngày tạo</dt>
                <dd>12/10/2026</dd>
                <dt>Trạng thái</dt>
                <dd>Chờ xác nhận</dd>
              </dl>
              <sd-button size="sm" type="outline" title="Mở hộp thoại con" (click)="nested.open()" />
              <h3>Lịch sử kiểm tra</h3>
              <p>Giữ cửa sổ mở và tiếp tục làm việc trên trang. Nội dung dài cuộn riêng, các thao tác cuối cửa sổ vẫn dễ tìm.</p>
              @for (row of rows; track row) {
                <p class="demo-window-row">Mục kiểm tra {{ row }} — thông tin chi tiết cần đối chiếu trước khi xác nhận.</p>
              }
            </div>
            <sd-button sdFooterLeft size="sm" type="text" color="secondary" title="Đóng" (click)="detail.close()" />
            <sd-button sdFooterRight size="sm" type="outline" color="secondary" title="Lưu bản nháp" />
            <sd-button sdFooterRight size="sm" type="fill" color="primary" title="Xác nhận đơn hàng" (click)="detail.close()" />
          </sd-window>
          <sd-modal #nested title="Xác nhận thông tin" width="sm" autoId="window-demo-nested">
            <p>Overlay con giữ focus riêng; cửa sổ chi tiết vẫn mở khi quay lại.</p>
            <sd-button sdFooterRight type="text" title="Quay lại chi tiết" (click)="nested.close()" />
          </sd-modal>
        </demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-hai-cua-so-cung-mo') {
        <demo-section
          heading="Hai cửa sổ cùng mở"
          [props]="[
            { name: 'open()', value: 'method' },
            { name: 'minimize() / restore()', value: 'method' },
          ]">
          <sd-button
            autoId="window-demo-compare"
            type="outline"
            color="primary"
            title="Mở để đối chiếu"
            (click)="left.open(); right.open()" />
          <sd-button autoId="window-demo-select-left" type="text" title="Chọn DH-1024" (click)="left.open()" />
          <sd-button autoId="window-demo-select-right" type="text" title="Chọn DH-1025" (click)="right.open()" />
          <sd-window #left width="420px">
            <span sdHeaderLeft>Đơn hàng DH-1024</span>
            <div class="demo-window-content">
              <h3>Đơn hàng đang chọn</h3>
              <p>Chuyển focus giữa hai cửa sổ hoặc quay lại trang bằng Tab.</p>
            </div>
            <sd-button sdFooterRight type="text" title="Đóng" (click)="left.close()" />
          </sd-window>
          <sd-window #right width="420px">
            <span sdHeaderLeft>Đơn hàng DH-1025</span>
            <div class="demo-window-content">
              <h3>Đơn hàng đối chiếu</h3>
              <p>Trên màn hình hẹp, cửa sổ chồng lên nhau trong phạm vi viewport.</p>
            </div>
            <sd-button sdFooterRight type="text" title="Đóng" (click)="right.close()" />
          </sd-window>
        </demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-khong-co-footer') {
        <demo-section
          heading="Không có footer"
          [props]="[
            { name: 'default content', value: 'body' },
            { name: 'footer', value: 'empty hidden' },
          ]">
          <sd-button autoId="window-demo-preview" type="text" title="Xem ghi chú" (click)="preview.open()" />
          <sd-window #preview width="360px"
            ><span sdHeaderLeft>Ghi chú nội bộ</span>
            <div class="demo-window-content"><p>Cửa sổ chỉ đọc, không có vùng footer rỗng.</p></div></sd-window
          >
        </demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-contract-dong') {
        <demo-section
          heading="Contract đóng"
          [props]="[
            { name: 'beforeClose', value: 'async guard' },
            { name: 'sdClosed / sdCloseError', value: 'outputs' },
          ]">
          <sd-button
            autoId="window-demo-guard-open"
            type="outline"
            title="Mở cửa sổ có guard"
            (click)="closed.set(false); closeError.set(''); guarded.open()" />
          <sd-button
            autoId="window-demo-guard-allow"
            type="text"
            [title]="allowClose() ? 'Chặn đóng' : 'Cho phép đóng'"
            (click)="allowClose.set(!allowClose())" />
          <sd-button
            autoId="window-demo-guard-error"
            type="text"
            [title]="failGuard() ? 'Tắt lỗi giả lập' : 'Giả lập lỗi guard'"
            (click)="failGuard.set(!failGuard())" />
          <p role="status">{{ closed() ? 'Đã nhận sdClosed.' : 'Guard hiện ' + (allowClose() ? 'cho phép' : 'chặn') + ' đóng.' }}</p>
          <sd-window
            #guarded
            title="Thử contract đóng"
            autoId="guarded"
            [beforeClose]="guardClose"
            [disableEscapeClose]="false"
            (sdClosed)="closed.set(true)"
            (sdCloseError)="closeError.set('Guard gặp lỗi; cửa sổ vẫn mở.')">
            @if (closeError()) {
              <p role="alert">{{ closeError() }}</p>
            }
            <p>Thử nút đóng hoặc Escape. Guard không cho phép thì cửa sổ vẫn mở; hoàn tất dùng forceClose như Core overlays.</p>
            <sd-button sdFooterLeft size="sm" type="text" title="Đóng" (click)="guarded.close()" />
            <sd-button sdFooterRight size="sm" type="fill" title="Hoàn tất" (click)="guarded.forceClose()" />
          </sd-window>
        </demo-section>
      }
    </demo-page>
  `,
  styles: `
    .demo-window-content h3 {
      margin: 0 0 12px;
      font-size: 16px;
    }
    .demo-window-content p {
      line-height: 1.5;
    }
    .demo-window-content dl {
      display: grid;
      grid-template-columns: 100px 1fr;
      gap: 8px;
      margin: 0 0 24px;
    }
    .demo-window-content dt {
      color: var(--sd-text-secondary);
    }
    .demo-window-content dd {
      margin: 0;
      overflow-wrap: anywhere;
    }
    .demo-window-row {
      padding-block: 12px;
      border-bottom: 1px solid var(--sd-border);
    }
  `,
})
export class WindowDemoComponent {
  readonly allowClose = signal(false);
  readonly failGuard = signal(false);
  readonly closed = signal(false);
  readonly closeError = signal('');
  readonly guardClose = () => (this.failGuard() ? Promise.reject(new Error('Demo guard failure')) : Promise.resolve(this.allowClose()));
  readonly rows = Array.from({ length: 20 }, (_, index) => index + 1);
}
