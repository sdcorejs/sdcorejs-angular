import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';

@Component({
  selector: 'app-modal-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdButton, SdModal],
  template: `
    <demo-page
      title="Modal"
      description="Hộp thoại trung tâm (hoặc bottom-sheet trên mobile) — mở bằng phương thức open() / close() qua template ref.">

      <demo-section heading="Modal cơ bản với footer">
        <sd-button type="fill" color="primary" prefixIcon="info" title="Xem chi tiết" (click)="basic.open()"></sd-button>

        <sd-modal #basic title="Chi tiết khách hàng" width="md">
          <p>Đây là phần thân của modal. Nội dung sẽ tự động cuộn khi vượt quá <strong>80vh</strong>.</p>
          <p>Bạn có thể đặt form, bảng dữ liệu, hoặc bất kỳ component nào ở đây.</p>
          <sd-button sdFooterRight type="fill" color="primary" title="Đóng" (click)="basic.close()"></sd-button>
        </sd-modal>
      </demo-section>

      <demo-section heading="Xác nhận xóa (size nhỏ, footer 2 nút)">
        <sd-button type="fill" color="error" prefixIcon="delete" title="Xóa bản ghi" (click)="confirm.open()"></sd-button>

        <sd-modal #confirm title="Xác nhận xóa" width="sm">
          <p>Bạn có chắc muốn xóa khách hàng <strong>Nguyễn Văn A</strong>? Thao tác này không thể hoàn tác.</p>
          <sd-button sdFooterLeft type="outline" color="secondary" title="Hủy" (click)="confirm.close()"></sd-button>
          <sd-button sdFooterRight type="fill" color="error" title="Xóa" (click)="confirm.close()"></sd-button>
        </sd-modal>
      </demo-section>

      <demo-section heading="Modal lớn với header-right action">
        <sd-button type="light" color="primary" prefixIcon="history" title="Xem lịch sử" (click)="history.open()"></sd-button>

        <sd-modal #history title="Lịch sử thay đổi" width="lg">
          <sd-button sdHeaderRight type="link" color="primary" prefixIcon="refresh" tooltip="Tải lại"></sd-button>
          <ul style="margin: 0; padding-left: 18px;">
            <li>09/05/2026 14:30 — Nguyễn Văn A cập nhật trạng thái</li>
            <li>08/05/2026 09:12 — Trần Thị B tạo mới hồ sơ</li>
            <li>07/05/2026 16:45 — Lê Văn C gửi yêu cầu phê duyệt</li>
          </ul>
        </sd-modal>
      </demo-section>

      <demo-section heading="Bottom-sheet (ép chế độ trượt từ dưới lên)">
        <sd-button type="outline" color="primary" prefixIcon="more_vert" title="Tùy chọn" (click)="sheet.open()"></sd-button>

        <sd-modal #sheet title="Tùy chọn nhanh" view="bottom-sheet" width="100%">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <sd-button type="link" color="primary" prefixIcon="edit" title="Chỉnh sửa" (click)="sheet.close()"></sd-button>
            <sd-button type="link" color="primary" prefixIcon="share" title="Chia sẻ" (click)="sheet.close()"></sd-button>
            <sd-button type="link" color="error" prefixIcon="delete" title="Xóa" (click)="sheet.close()"></sd-button>
          </div>
        </sd-modal>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalDemoComponent {}
