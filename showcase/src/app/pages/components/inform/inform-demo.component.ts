import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdInform, SdInformActionDirective } from '@sdcorejs/angular/components/inform';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdTable, SdTableOption } from '@sdcorejs/angular/components/table';

const LONG = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec semper nunc in faucibus dictum. Suspendisse interdum tempor est, vitae rutrum mauris gravida vitae. Praesent mattis libero id consequat imperdiet. Donec egestas, purus at ultricies condimentum, nulla nisi pulvinar.`;

@Component({
  selector: 'app-inform-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdInform, SdInformActionDirective, SdInput, SdTable],
  template: `
    <demo-page
      #demoPage
      title="Inform"
      description="Thông báo trong trang với icon nền nhẹ, 6 màu trạng thái, nút thao tác nhỏ và nội dung thu gọn.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bang-mau') {
        <demo-section heading="Bảng màu" [props]="[{ name: 'color', value: 'primary / secondary / info / success / warning / error' }]">
          <sd-inform primary title="primary" description="Message body."></sd-inform>
          <sd-inform secondary title="secondary" description="Message body."></sd-inform>
          <sd-inform info title="info" description="Message body."></sd-inform>
          <sd-inform success title="success" description="Message body."></sd-inform>
          <sd-inform warning title="warning" description="Message body."></sd-inform>
          <sd-inform error title="error" description="Message body."></sd-inform>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chi-co-tieu-de') {
        <demo-section
          heading="Chỉ có tiêu đề"
          [props]="[
            { name: 'title', value: 'text' },
            { name: 'closable', value: 'true' },
          ]"
          note="Tiêu đề căn giữa với icon kể cả khi không có mô tả hoặc có thêm action.">
          <sd-inform success title="Đã lưu thay đổi"></sd-inform>
          <sd-inform warning closable title="Phiên làm việc sắp hết hạn"></sd-inform>
          <sd-inform error closable title="Không thể kết nối" actionLabel="Thử lại"></sd-inform>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-noi-dung-tuy-bien') {
        <demo-section
          heading="Nội dung tùy biến"
          [props]="[
            { name: 'ng-content', value: 'template' },
            { name: 'closable', value: 'true' },
          ]"
          note="Nội dung truyền vào thay title, description và action mặc định; icon và nút đóng vẫn giữ nguyên.">
          <sd-inform warning closable title="Tiêu đề mặc định" description="Mô tả mặc định" actionLabel="Action mặc định">
            <strong>Cần kiểm tra lại thông tin</strong>
            <span>Có <b>2 trường</b> chưa hoàn tất. Bạn có thể giữ bản nháp để xử lý sau.</span>
            <button type="button" class="demo-action-btn" (click)="customActionCount = customActionCount + 1">Giữ bản nháp</button>
          </sd-inform>
          <sd-inform info closable>Nội dung ngắn truyền trực tiếp, vẫn có icon và nút đóng.</sd-inform>
          <p aria-live="polite">Đã giữ bản nháp {{ customActionCount }} lần.</p>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dong-duoc-action') {
        <demo-section
          heading="Đóng được + action"
          [props]="[
            { name: 'closable', value: 'true' },
            { name: 'actionLabel', value: 'text' },
          ]">
          <sd-inform error closable title="Không tải được dữ liệu" description="Máy chủ không phản hồi." actionLabel="Thử lại"></sd-inform>
          <sd-inform info closable title="Bản nháp đã lưu" description="Tự động lưu lúc 14:30." actionLabel="Xem"></sd-inform>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-an-icon') {
        <demo-section heading="Ẩn icon" [props]="[{ name: 'hideIcon', value: 'true' }]">
          <sd-inform success hideIcon title="Đã lưu" description="Không có icon."></sd-inform>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-line-clamp') {
        <demo-section heading="Line-clamp" [props]="[{ name: 'lineClamp', value: '[số]' }]">
          <sd-inform info title="Điều khoản" [description]="long" [lineClamp]="3"></sd-inform>
          <sd-inform success [description]="long" [lineClamp]="2"></sd-inform>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-action-custom-projection') {
        <demo-section heading="Action custom (projection)" [props]="[{ name: 'sdInformAction', value: 'template' }]">
          <sd-inform warning title="Chế độ chỉ đọc" description="Bạn không có quyền chỉnh sửa.">
            <button sdInformAction class="demo-action-btn">Yêu cầu quyền</button>
          </sd-inform>
        </demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tip-mot-dong') {
        <demo-section
          heading="Tip một dòng"
          [props]="[
            { name: 'type', value: 'tip' },
            { name: 'color', value: 'info' },
          ]">
          <div class="tip-examples">
            <sd-inform type="tip" color="info">Bấm Thêm bộ lọc để chọn trường cần tìm kiếm.</sd-inform>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tip-co-tieu-de') {
        <demo-section
          heading="Tip có tiêu đề"
          [props]="[
            { name: 'type', value: 'tip' },
            { name: 'title', value: 'text' },
            { name: 'description', value: 'text' },
          ]">
          <div class="tip-examples tip-narrow">
            <sd-inform
              type="tip"
              color="info"
              title="Tìm kiếm chính xác hơn"
              description="Chọn trường cần tìm trước khi nhập giá trị. Bạn có thể kết hợp nhiều điều kiện và lưu bộ lọc để sử dụng trong lần truy cập tiếp theo."></sd-inform>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tip-noi-dung-phong-phu') {
        <demo-section
          heading="Tip nội dung phong phú"
          [props]="[
            { name: 'type', value: 'tip' },
            { name: 'ng-content', value: 'template' },
          ]"
          note="Chữ đậm, inline code, liên kết và binding Angular giữ nguyên trong cùng luồng văn bản.">
          <div class="tip-examples">
            <sd-inform type="tip" color="info">
              Bấm <strong>{{ filterAction }}</strong> để chọn trường. Bật <code>showSavedFilters</code> để lưu bộ lọc. Đã chọn
              <strong>{{ selectedFilters }}</strong> trường.
              <a href="#tip-filter-help" (click)="$event.preventDefault(); showFilterHelp = !showFilterHelp">Xem hướng dẫn</a>.
            </sd-inform>
            <button type="button" class="demo-action-btn" (click)="selectedFilters = selectedFilters + 1">Thêm trường</button>
            @if (showFilterHelp) {
              <p id="tip-filter-help">Chọn tên trường, toán tử và giá trị rồi bấm Tìm kiếm để áp dụng bộ lọc.</p>
            }
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tip-bang-mau') {
        <demo-section
          heading="Tip bảng màu"
          [props]="[
            { name: 'type', value: 'tip' },
            { name: 'color', value: 'primary / secondary / info / success / warning / error' },
          ]"
          note="Tất cả tip dùng role note, kể cả màu warning và error.">
          <div class="tip-examples">
            <sd-inform type="tip" color="primary">Primary — chọn mục để xem chi tiết.</sd-inform>
            <sd-inform type="tip" color="secondary">Secondary — bạn có thể lưu bản nháp.</sd-inform>
            <sd-inform type="tip" color="info">Info — dùng bộ lọc để thu hẹp kết quả.</sd-inform>
            <sd-inform type="tip" color="success">Success — dữ liệu hợp lệ có thể được gửi ngay.</sd-inform>
            <sd-inform type="tip" color="warning">Warning — kiểm tra định dạng trước khi nhập dữ liệu.</sd-inform>
            <sd-inform type="tip" color="error">Error — xem hướng dẫn xử lý dòng không hợp lệ.</sd-inform>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-tip-trong-form-va-bang') {
        <demo-section
          heading="Tip trong form và bảng"
          [props]="[
            { name: 'type', value: 'tip' },
            { name: 'ng-content', value: 'template' },
          ]">
          <div class="tip-examples">
            <form class="tip-form" (submit)="$event.preventDefault()">
              <sd-input label="Tên bộ lọc" [(model)]="filterName" placeholder="Ví dụ: Công việc của tôi"></sd-input>
              <sd-inform type="tip" color="info"
                >Đặt tên dễ nhớ để tìm lại bộ lọc <strong>{{ filterName || 'của bạn' }}</strong
                >.</sd-inform
              >
            </form>
            <sd-inform type="tip" color="info">Bấm tiêu đề cột để <strong>sắp xếp</strong> danh sách công việc bên dưới.</sd-inform>
            <sd-table autoId="inform-tip-tasks" [option]="tipTableOption"></sd-table>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: [
    `
      :host ::ng-deep demo-section > * {
        display: block;
        margin-bottom: 12px;
      }
      .demo-action-btn {
        border: none;
        background: none;
        color: inherit;
        cursor: pointer;
        padding: 0;
        text-decoration: underline;
      }
      .tip-examples {
        display: grid;
        gap: 12px;
        width: 100%;
        min-width: 0;
      }
      .tip-narrow {
        max-width: 440px;
      }
      .tip-form {
        display: grid;
        gap: 8px;
        max-width: 440px;
      }
      .tip-examples > .demo-action-btn {
        justify-self: start;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InformDemoComponent {
  readonly long = LONG;
  customActionCount = 0;
  readonly filterAction = 'Thêm bộ lọc';
  selectedFilters = 0;
  showFilterHelp = false;
  filterName = '';
  readonly tipTableOption: SdTableOption<{ id: number; name: string; status: string }> = {
    type: 'local',
    rowKey: 'id',
    items: () => [
      { id: 1, name: 'Kiểm tra dữ liệu', status: 'Đang làm' },
      { id: 2, name: 'Lưu bộ lọc', status: 'Hoàn tất' },
    ],
    sort: { enable: true },
    columns: [
      { field: 'name', type: 'string', title: 'Công việc' },
      { field: 'status', type: 'string', title: 'Trạng thái' },
    ],
  };
}
