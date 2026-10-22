import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdRadio } from '@sdcorejs/angular/forms/radio';
import { type SdIconSet } from '@sdcorejs/angular/modules/icon';

interface FontSetOption {
  value: SdIconSet;
  display: string;
}

@Component({
  selector: 'app-badge-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdBadge, SdRadio],
  template: `
    <demo-page #demoPage title="Badge" description="Nhãn trạng thái / số đếm — có 6 dạng (type): icon, round, tag, solid, dot, pair.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-sau-dang') {
        <demo-section heading="Sáu dạng" [props]="[{ name: 'type', value: 'icon / round / tag / solid / dot / pair' }]">
          <div class="d-flex flex-wrap align-items-center gap-16">
            <sd-badge type="icon" primary icon="check_circle" title="icon"></sd-badge>
            <sd-badge type="round" primary title="round"></sd-badge>
            <sd-badge type="tag" primary icon="label" title="tag"></sd-badge>
            <sd-badge type="solid" primary title="solid"></sd-badge>
            <sd-badge type="dot" primary title="dot"></sd-badge>
            <sd-badge type="pair" primary label="pair" title="giá trị"></sd-badge>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-fontset-switch') {
        <demo-section
          heading="fontSet switch"
          [props]="[
            { name: 'fontSet', value: 'material-icons / material-icons-outlined / lucide' },
            { name: 'type', value: 'icon / round / tag' },
          ]"
          note="Chon fontSet bang radio de so sanh alignment cua cung mot bo badge icon.">
          <div class="d-flex flex-column gap-16 w-full">
            <sd-radio
              label="fontSet"
              [items]="fontSetOptions"
              valueField="value"
              displayField="display"
              [(model)]="selectedFontSet"
              [form]="fontSetForm"></sd-radio>

            <div class="d-flex flex-wrap align-items-center gap-16">
              <sd-badge type="icon" success icon="check_circle" [fontSet]="selectedFontSet()" title="Approved"></sd-badge>
              <sd-badge type="icon" info icon="visibility" [fontSet]="selectedFontSet()" title="Visible"></sd-badge>
              <sd-badge type="icon" warning icon="warning" [fontSet]="selectedFontSet()" title="Warning"></sd-badge>
            </div>

            <div class="d-flex flex-wrap align-items-center gap-16">
              <sd-badge type="round" success icon="check_circle" [fontSet]="selectedFontSet()" title="Round success"></sd-badge>
              <sd-badge type="round" info icon="local_offer" [fontSet]="selectedFontSet()" title="Round offer"></sd-badge>
              <sd-badge type="round" error icon="delete" [fontSet]="selectedFontSet()" title="Round error"></sd-badge>
            </div>

            <div class="d-flex flex-wrap align-items-center gap-16">
              <sd-badge type="tag" primary icon="local_offer" [fontSet]="selectedFontSet()" title="Tag primary"></sd-badge>
              <sd-badge type="tag" warning icon="warning" [fontSet]="selectedFontSet()" title="Tag warning"></sd-badge>
              <sd-badge type="tag" secondary icon="visibility" [fontSet]="selectedFontSet()" title="Tag secondary"></sd-badge>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-mau-sac-round') {
        <demo-section
          heading="Màu sắc round"
          [props]="[
            { name: 'type', value: 'round' },
            { name: 'color', value: 'primary / secondary / success / info / warning / error' },
          ]">
          <sd-badge type="round" primary title="primary"></sd-badge>
          <sd-badge type="round" secondary title="secondary"></sd-badge>
          <sd-badge type="round" success title="success"></sd-badge>
          <sd-badge type="round" info title="info"></sd-badge>
          <sd-badge type="round" warning title="warning"></sd-badge>
          <sd-badge type="round" error title="error"></sd-badge>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-mau-sac-tag') {
        <demo-section
          heading="Màu sắc tag"
          [props]="[
            { name: 'type', value: 'tag' },
            { name: 'color', value: 'primary / secondary / success / info / warning / error' },
          ]">
          <sd-badge type="tag" primary icon="label" title="primary"></sd-badge>
          <sd-badge type="tag" secondary icon="label" title="secondary"></sd-badge>
          <sd-badge type="tag" success icon="label" title="success"></sd-badge>
          <sd-badge type="tag" info icon="label" title="info"></sd-badge>
          <sd-badge type="tag" warning icon="label" title="warning"></sd-badge>
          <sd-badge type="tag" error icon="label" title="error"></sd-badge>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-mau-sac-icon') {
        <demo-section
          heading="Màu sắc icon"
          [props]="[
            { name: 'type', value: 'icon' },
            { name: 'color', value: 'primary / secondary / success / info / warning / error' },
            { name: 'icon', value: 'name / —' },
          ]"
          note="Không có icon thì badge vẽ chấm CSS màu gốc (8px, lg 10px).">
          <div class="d-flex flex-column gap-12">
            <div class="d-flex flex-wrap align-items-center gap-16">
              <sd-badge type="icon" primary icon="flag" title="Mới"></sd-badge>
              <sd-badge type="icon" secondary icon="edit_note" title="Nháp"></sd-badge>
              <sd-badge type="icon" info icon="sync" title="Đang xử lý"></sd-badge>
              <sd-badge type="icon" success icon="check_circle" title="Đã duyệt"></sd-badge>
              <sd-badge type="icon" warning icon="schedule" title="Chờ duyệt"></sd-badge>
              <sd-badge type="icon" error icon="cancel" title="Đã huỷ"></sd-badge>
            </div>
            <div class="d-flex flex-wrap align-items-center gap-16">
              <sd-badge type="icon" primary title="Mới"></sd-badge>
              <sd-badge type="icon" secondary title="Nháp"></sd-badge>
              <sd-badge type="icon" info title="Đang xử lý"></sd-badge>
              <sd-badge type="icon" success title="Đã duyệt"></sd-badge>
              <sd-badge type="icon" warning title="Chờ duyệt"></sd-badge>
              <sd-badge type="icon" error title="Đã huỷ"></sd-badge>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-solid') {
        <demo-section
          heading="Solid"
          [props]="[
            { name: 'type', value: 'solid' },
            { name: 'color', value: 'primary / secondary / success / info / warning / error' },
          ]"
          note="Nền màu gốc, chữ màu contrast: trạng thái cần chú ý ngay, tối đa một badge solid mỗi dòng. Title là số thì thành số đếm như round.">
          <div class="d-flex flex-wrap align-items-center gap-16">
            <sd-badge type="solid" primary title="Mới"></sd-badge>
            <sd-badge type="solid" secondary title="Nháp"></sd-badge>
            <sd-badge type="solid" info title="Đang xử lý"></sd-badge>
            <sd-badge type="solid" success title="Hoàn tất"></sd-badge>
            <sd-badge type="solid" warning icon="schedule" title="Khẩn"></sd-badge>
            <sd-badge type="solid" error title="Quá hạn"></sd-badge>
            <sd-badge type="solid" error [title]="errorsCount()"></sd-badge>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-dot-va-pulse') {
        <demo-section
          heading="Dot và pulse"
          [props]="[
            { name: 'type', value: 'dot / icon' },
            { name: 'pulse', value: 'true' },
            { name: 'size', value: 'sm / md / lg' },
          ]"
          note="Dot chỉ có chấm; title không hiện mà làm tooltip và tên cho screen reader (bắt buộc). pulse thêm vòng sáng nhấp nháy 1.6s, đứng yên khi giảm chuyển động.">
          <div class="d-flex flex-column gap-12">
            <div class="d-flex flex-wrap align-items-center gap-16">
              <sd-badge type="dot" primary title="Mới"></sd-badge>
              <sd-badge type="dot" secondary title="Ngoại tuyến"></sd-badge>
              <sd-badge type="dot" info title="Đang xử lý"></sd-badge>
              <sd-badge type="dot" success title="Đang hoạt động"></sd-badge>
              <sd-badge type="dot" warning title="Vắng mặt"></sd-badge>
              <sd-badge type="dot" error title="Không làm phiền"></sd-badge>
            </div>
            <div class="d-flex flex-wrap align-items-center gap-16">
              <sd-badge type="dot" success title="Đang gọi" pulse></sd-badge>
              <sd-badge type="dot" success title="Đang gọi" size="md" pulse></sd-badge>
              <sd-badge type="dot" success title="Đang gọi" size="lg" pulse></sd-badge>
              <sd-badge type="icon" success title="Đang gọi" pulse></sd-badge>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-pair') {
        <demo-section
          heading="Pair"
          [props]="[
            { name: 'type', value: 'pair' },
            { name: 'label', value: 'text' },
            { name: 'size', value: 'sm / md / lg' },
          ]"
          note="Cặp thuộc tính – giá trị: nhãn nền secondary nhạt, giá trị theo color. Quá dài thì cắt phần giá trị trước, nhãn giữ nguyên.">
          <div class="d-flex flex-column gap-12">
            <div class="d-flex flex-wrap align-items-center gap-16">
              <sd-badge type="pair" warning label="SLA" title="4 giờ"></sd-badge>
              <sd-badge type="pair" error label="Ưu tiên" title="Cao"></sd-badge>
              <sd-badge type="pair" info label="Phiên bản" title="2.3.1"></sd-badge>
              <sd-badge type="pair" success label="Kênh" title="Trực tuyến" size="md"></sd-badge>
              <sd-badge type="pair" primary label="Kênh" title="Trực tuyến" size="lg"></sd-badge>
            </div>
            <div class="badge-demo-cell">
              <sd-badge type="pair" info label="Phiên bản" title="2.3.1-beta.4 bản dựng thử nghiệm"></sd-badge>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kich-thuoc-round') {
        <demo-section
          heading="Kích thước round"
          [props]="[
            { name: 'type', value: 'round' },
            { name: 'size', value: 'sm / md / lg' },
          ]">
          <sd-badge type="round" primary title="sm" size="sm"></sd-badge>
          <sd-badge type="round" primary title="md" size="md"></sd-badge>
          <sd-badge type="round" primary title="lg" size="lg"></sd-badge>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-round-voi-icon') {
        <demo-section
          heading="Round với icon"
          [props]="[
            { name: 'type', value: 'round' },
            { name: 'icon', value: 'name' },
            { name: 'size', value: 'sm / md / lg' },
          ]">
          <sd-badge type="round" success icon="check_circle" title="sm" size="sm"></sd-badge>
          <sd-badge type="round" success icon="check_circle" title="md" size="md"></sd-badge>
          <sd-badge type="round" success icon="check_circle" title="lg" size="lg"></sd-badge>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kich-thuoc-tag') {
        <demo-section
          heading="Kích thước tag"
          [props]="[
            { name: 'type', value: 'tag' },
            { name: 'size', value: 'sm / md / lg' },
          ]">
          <sd-badge type="tag" info icon="label" title="sm" size="sm"></sd-badge>
          <sd-badge type="tag" info icon="label" title="md" size="md"></sd-badge>
          <sd-badge type="tag" info icon="label" title="lg" size="lg"></sd-badge>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kem-mo-ta') {
        <demo-section
          heading="Kèm mô tả"
          [props]="[
            { name: 'description', value: 'text' },
            { name: 'type', value: 'icon / tag' },
          ]"
          note="Description 12px. Tag có description thành khối hai dòng; icon căn theo dòng đầu.">
          <sd-badge type="icon" success icon="check_circle" title="Đã duyệt" description="Bởi Nguyễn Văn A"></sd-badge>
          <sd-badge type="icon" info title="Đang xử lý" description="Bước 2 / 3"></sd-badge>
          <sd-badge type="tag" info icon="label" title="Hợp đồng dài hạn" description="Gia hạn 12 tháng"></sd-badge>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-so-dem') {
        <demo-section
          heading="Số đếm"
          [props]="[
            { name: 'type', value: 'round' },
            { name: 'title', value: 'number' },
            { name: 'size', value: 'sm / md' },
          ]"
          note="Title là số: hình tròn khi một chữ số, chữ số đều bề rộng; lớn hơn 99 hiện 99+ (screen reader vẫn đọc số thật).">
          <sd-badge type="round" primary [title]="unreadCount()"></sd-badge>
          <sd-badge type="round" error [title]="errorsCount()"></sd-badge>
          <sd-badge type="round" warning [title]="overflowCount()"></sd-badge>
          <sd-badge type="round" primary [title]="unreadCount()" size="md"></sd-badge>
          <sd-badge type="round" error [title]="errorsCount()" size="md"></sd-badge>
        </demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-ten-dai-trong-o-hep') {
        <demo-section
          heading="Tên dài trong ô hẹp"
          [props]="[
            { name: 'type', value: 'icon / round / tag' },
            { name: 'tooltip', value: 'text' },
          ]"
          note="Luôn một dòng, chữ dài bị cắt bằng dấu ba chấm. Tooltip chỉ hiện khi chữ bị cắt (title đầy đủ) hoặc khi có tooltip riêng.">
          <div class="d-flex flex-wrap gap-24">
            <div class="badge-demo-cell">
              <sd-badge type="round" warning title="Đã chuyển sang kế toán xử lý"></sd-badge>
            </div>
            <div class="badge-demo-cell">
              <sd-badge type="tag" info icon="label" title="Hợp đồng dài hạn có điều khoản gia hạn"></sd-badge>
            </div>
            <div class="badge-demo-cell">
              <sd-badge type="icon" success icon="check_circle" title="Đã xác nhận thông tin khách hàng"></sd-badge>
            </div>
            <div class="badge-demo-cell">
              <sd-badge type="round" success title="Đã duyệt" tooltip="Phê duyệt lúc 14:30
Bởi Nguyễn Văn A"></sd-badge>
            </div>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-bam-duoc') {
        <demo-section
          heading="Bấm được"
          [props]="[
            { name: '(click)', value: 'output' },
            { name: 'type', value: 'round / tag / icon' },
          ]"
          note="Chỉ khi có (click): role button, Tab tới được, Enter/Space. Hover trộn 6% màu đậm vào nền, nhấn 10%; vòng focus giữ bo góc.">
          <div class="d-flex flex-wrap align-items-center gap-16">
            <sd-badge type="round" primary title="Lọc: Mới" (click)="filterClicks.set(filterClicks() + 1)"></sd-badge>
            <sd-badge type="tag" info icon="label" title="Bán buôn" (click)="filterClicks.set(filterClicks() + 1)"></sd-badge>
            <sd-badge type="icon" warning icon="schedule" title="Chờ duyệt" (click)="filterClicks.set(filterClicks() + 1)"></sd-badge>
            <span class="badge-demo-log">Đã bấm {{ filterClicks() }} lần</span>
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: [
    `
      .badge-demo-cell {
        width: 160px;
        padding: 8px;
        border: 1px dashed var(--sd-border);
        border-radius: 6px;
      }
      .badge-demo-log {
        font-size: 12px;
        color: var(--sd-text-secondary);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeDemoComponent {
  readonly fontSetForm = new FormGroup({});
  readonly selectedFontSet = signal<SdIconSet>('lucide');
  readonly fontSetOptions: FontSetOption[] = [
    { value: 'material-icons', display: 'Material filled' },
    { value: 'material-icons-outlined', display: 'Material outlined' },
    { value: 'lucide', display: 'Lucide' },
  ];

  readonly unreadCount = signal(7);
  readonly errorsCount = signal(12);
  readonly overflowCount = signal(150);
  readonly filterClicks = signal(0);
}
