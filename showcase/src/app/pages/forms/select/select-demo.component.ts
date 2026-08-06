import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdSelect, SdSelectFooterActionDirective } from '@sdcorejs/angular/forms/select';

interface Option { value: string; display: string; }

@Component({
  selector: 'app-select-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdSelect, SdSelectFooterActionDirective],
  template: `
    <demo-page #demoPage title="Select" description="sd-select – dropdown chọn 1 giá trị. Truyền items với valueField + displayField.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-co-ban') {
      <demo-section heading="Cơ bản" [props]="[{ name: '[(model)]', value: 'two-way' }]" note="Bind hai chiều, hiển thị giá trị đã chọn.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-select [items]="items" valueField="value" displayField="display"
            label="Chọn phòng ban" placeholder="Chọn..." [(model)]="dept" [form]="form"></sd-select>
          <div style="font-size:12px; color:#555">Giá trị: <b>{{ dept() ?? '(trống)' }}</b></div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-validator') {
      <demo-section heading="Validator" [props]="[{ name: 'required', value: 'true' }]" note="Bấm Kiểm tra để hiện lỗi.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <sd-select [items]="items" valueField="value" displayField="display"
            label="required" helperText="Chọn phòng đang công tác"
            [(model)]="deptR" [form]="formValid" required></sd-select>
          <div style="display:flex; gap:8px">
            <button type="button" (click)="check()">Kiểm tra</button>
            <button type="button" (click)="reset()">Đặt lại</button>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-trang-thai') {
      <demo-section heading="Trạng thái" [props]="[{ name: 'disabled', value: 'true' }, { name: 'viewed', value: 'true' }]" note="Giá trị đã có sẵn.">
        <div style="display:flex; gap:16px; flex-wrap:wrap; width:100%">
          <sd-select style="width: 240px" [items]="items" valueField="value" displayField="display"
            label="disabled" [(model)]="lockedA" [form]="form" disabled></sd-select>
          <sd-select style="width: 240px" [items]="items" valueField="value" displayField="display"
            label="viewed" [(model)]="lockedB" [form]="form" viewed></sd-select>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-chinh-sua-noi-tuyen') {
      <demo-section heading="Chỉnh sửa nội tuyến" [props]="[{ name: 'viewed', value: 'inline' }]" note="Hiển thị như text — bấm vào để mở panel chọn (không hiện ô input). Text giữ nguyên trong lúc panel mở, chỉ đổi khi chọn giá trị mới.">
        <div style="width: 320px; display:flex; flex-direction:column; gap:12px">
          <div style="font-size:12px; color:#555">
            Phòng ban:
            <sd-select [items]="items" valueField="value" displayField="display"
              [viewed]="'inline'" [(model)]="inlineDept" [form]="form"></sd-select>
          </div>
          <div style="font-size:12px; color:#555">Giá trị: <b>{{ inlineDept() ?? '(trống)' }}</b></div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-kich-thuoc') {
      <demo-section heading="Kích thước" [props]="[{ name: 'size', value: 'sm' }]" note="UI gọn cho bảng / toolbar.">
        <div style="width: 280px">
          <sd-select [items]="items" valueField="value" displayField="display"
            label="sm" size="sm" [(model)]="quick" [form]="form"></sd-select>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-footer-action-khi-khong-co-ket-qua') {
      <demo-section
        heading="Footer action khi không có kết quả"
        [props]="[{ name: 'sdSelectFooterAction', value: 'template' }, { name: 'when', value: 'empty' }, { name: 'searchText', value: 'context' }]"
        note="Gõ một phòng ban chưa có trong danh sách. Khi search text khác rỗng và danh sách lọc về 0 item, footer hiển thị nút thêm mới.">
        <div class="select-demo-column">
          <sd-select
            [items]="footerItems"
            valueField="value"
            displayField="display"
            label="Tìm hoặc thêm phòng ban"
            placeholder="Gõ để tìm..."
            minWidthPanel="360px"
            [(model)]="footerDept"
            [form]="form">
            <ng-template sdSelectFooterAction when="empty" let-searchText="searchText">
              <div class="select-demo-footer-padding">
                <button type="button" class="select-demo-footer-btn select-demo-footer-btn--primary" (click)="addDepartment(searchText)">
                  Thêm "{{ searchText }}"
                </button>
              </div>
            </ng-template>
          </sd-select>

          <div class="select-demo-status">
            Giá trị đang chọn: <b>{{ footerDept() ?? '(trống)' }}</b>
          </div>
          <div class="select-demo-status">
            Log: <b>{{ lastFooterAction() }}</b>
          </div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-nhieu-footer-action-va-thu-tu-khai-bao') {
      <demo-section
        heading="Nhiều footer action và thứ tự khai báo"
        [props]="[{ name: 'when', value: 'always / has-result / empty' }, { name: 'contentChildren', value: 'order' }]"
        note="Các template được render theo đúng thứ tự khai báo trong sd-select. Event binding vẫn chạy trong context của component cha.">
        <div class="select-demo-column select-demo-column--wide">
          <sd-select
            [items]="largeItems"
            valueField="value"
            displayField="display"
            label="Chọn đơn vị xử lý"
            placeholder="Gõ để lọc..."
            minWidthPanel="420px"
            [(model)]="footerActionDept"
            [form]="form">
            <ng-template sdSelectFooterAction>
              <div class="select-demo-footer-padding">
                <button type="button" class="select-demo-footer-btn" (click)="recordFooterAction('always')">
                  Luôn hiển thị: mở cấu hình danh mục
                </button>
              </div>
            </ng-template>

            <ng-template sdSelectFooterAction when="has-result" let-searchText="searchText">
              <div class="select-demo-footer-padding">
                <button type="button" class="select-demo-footer-btn" (click)="recordFooterAction('has-result', searchText)">
                  Có kết quả: dùng "{{ searchText || 'tất cả' }}" làm bộ lọc nhanh
                </button>
              </div>
            </ng-template>

            <ng-template sdSelectFooterAction when="empty" let-searchText="searchText">
              <div class="select-demo-footer-padding">
                <button type="button" class="select-demo-footer-btn select-demo-footer-btn--primary" (click)="recordFooterAction('empty', searchText)">
                  Không có kết quả: gửi yêu cầu tạo "{{ searchText }}"
                </button>
              </div>
            </ng-template>
          </sd-select>

          <pre class="select-demo-log">{{ lastFooterAction() }}</pre>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-footer-action-giong-dropdown-item') {
      <demo-section
        heading="Footer action giống dropdown item"
        [props]="[{ name: 'custom CSS', value: 'padding + item row' }, { name: 'tag', value: 'div' }]"
        note="Không bắt buộc dùng button. Có thể dùng div role=button, tự thêm padding và hover style để footer action nhìn như một option trong dropdown.">
        <div class="select-demo-column select-demo-column--wide">
          <sd-select
            [items]="largeItems"
            valueField="value"
            displayField="display"
            label="Tạo nhanh nhóm xử lý"
            placeholder="Gõ tên nhóm mới..."
            minWidthPanel="420px"
            [(model)]="footerItemDept"
            [form]="form">
            <ng-template sdSelectFooterAction when="empty" let-searchText="searchText">
              <div class="select-demo-footer-padding">
                <div
                  class="select-demo-footer-item"
                  role="button"
                  tabindex="0"
                  (click)="recordFooterAction('dropdown-item', searchText)"
                  (keydown.enter)="recordFooterAction('dropdown-item', searchText)"
                  (keydown.space)="recordFooterAction('dropdown-item', searchText)">
                  <span class="select-demo-footer-item__mark">+</span>
                  <span class="select-demo-footer-item__main">Tạo nhóm "{{ searchText }}"</span>
                  <span class="select-demo-footer-item__meta">Footer custom</span>
                </div>
              </div>
            </ng-template>
          </sd-select>

          <pre class="select-demo-log">{{ lastFooterAction() }}</pre>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-api-footer-action') {
      <demo-section
        heading="API footer action"
        [props]="[{ name: 'selector', value: 'ng-template[sdSelectFooterAction]' }, { name: 'standalone', value: 'true' }]"
        note="Import SdSelectFooterActionDirective cùng với SdSelect khi dùng trong standalone component.">
        <div class="select-demo-api">
          <div><b>Directive</b><span><code>sdSelectFooterAction</code> đặt trên <code>ng-template</code> bên trong <code>sd-select</code>.</span></div>
          <div><b>Padding</b><span>Core không áp padding cho footer. Consumer tự bọc nội dung bằng class riêng, ví dụ <code>.select-demo-footer-padding</code>.</span></div>
          <div><b>when="always"</b><span>Render mọi lúc, miễn là panel đang có footer action.</span></div>
          <div><b>when="empty"</b><span>Chỉ render khi người dùng đã nhập search text và số option sau lọc bằng 0.</span></div>
          <div><b>when="has-result"</b><span>Render khi số option sau lọc lớn hơn 0.</span></div>
          <div><b>Context</b><span><code>let-searchText="searchText"</code> truyền search text hiện tại vào template.</span></div>
          <div><b>Event</b><span><code>(click)="addNew(searchText)"</code> chạy bình thường trong component cha.</span></div>
        </div>
      </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-snippet-mau') {
      <demo-section
        heading="Snippet mẫu"
        [props]="[{ name: 'copy pattern', value: 'HTML' }]"
        note="Mẫu tối thiểu cho case thêm nhanh item khi không tìm thấy kết quả.">
        <pre class="select-demo-code">{{ footerActionSnippet }}</pre>
      </demo-section>
      }
    </demo-page>
  `,
  styles: [`
    .select-demo-column {
      width: min(100%, 420px);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .select-demo-column--wide {
      width: min(100%, 520px);
    }

    .select-demo-status {
      font-size: 12px;
      color: #555;
    }

    .select-demo-log,
    .select-demo-code {
      width: 100%;
      margin: 0;
      padding: 10px 12px;
      border: 1px solid #e6e6e6;
      border-radius: 6px;
      background: #f7f8fa;
      color: #222;
      font-size: 12px;
      line-height: 1.5;
      white-space: pre-wrap;
      overflow: auto;
    }

    .select-demo-api {
      width: min(100%, 760px);
      display: grid;
      gap: 8px;
    }

    .select-demo-api > div {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 12px;
      align-items: start;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
      font-size: 13px;
      color: #444;
    }

    .select-demo-api > div:last-child {
      border-bottom: 0;
    }

    .select-demo-api b {
      color: #1f2937;
      font-weight: 600;
    }

    .select-demo-api code {
      padding: 1px 4px;
      border-radius: 4px;
      background: #f0f3f7;
      font-size: 12px;
    }

    .select-demo-footer-btn {
      width: 100%;
      min-height: 34px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      background: #fff;
      color: #24292f;
      font-size: 13px;
      text-align: left;
      padding: 6px 10px;
      cursor: pointer;
    }

    .select-demo-footer-btn:hover {
      background: #f6f8fa;
    }

    .select-demo-footer-btn--primary {
      border-color: #1f6feb;
      color: #0b57d0;
      font-weight: 600;
    }

    .select-demo-footer-padding {
      padding: 8px;
    }

    .select-demo-footer-item {
      display: grid;
      grid-template-columns: 24px 1fr auto;
      gap: 8px;
      align-items: center;
      min-height: 36px;
      padding: 8px 10px;
      border-radius: 4px;
      color: #24292f;
      cursor: pointer;
      user-select: none;
    }

    .select-demo-footer-item:hover,
    .select-demo-footer-item:focus-visible {
      background: #f6f8fa;
      outline: none;
    }

    .select-demo-footer-item__mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #eaf2ff;
      color: #0b57d0;
      font-weight: 700;
      line-height: 1;
    }

    .select-demo-footer-item__main {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
      font-weight: 500;
    }

    .select-demo-footer-item__meta {
      color: #6b7280;
      font-size: 12px;
    }

    @media (max-width: 640px) {
      .select-demo-api > div {
        grid-template-columns: 1fr;
        gap: 4px;
      }

      .select-demo-footer-item {
        grid-template-columns: 24px 1fr;
      }

      .select-demo-footer-item__meta {
        grid-column: 2;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectDemoComponent {
  form = new FormGroup({});
  formValid = new FormGroup({});

  items: Option[] = [
    { value: 'IT',  display: 'Công nghệ thông tin' },
    { value: 'HR',  display: 'Nhân sự' },
    { value: 'FIN', display: 'Tài chính' },
    { value: 'OPS', display: 'Vận hành' },
  ];

  largeItems: Option[] = [
    { value: 'IT', display: 'Công nghệ thông tin' },
    { value: 'HR', display: 'Nhân sự' },
    { value: 'FIN', display: 'Tài chính' },
    { value: 'OPS', display: 'Vận hành' },
    { value: 'MKT', display: 'Marketing' },
    { value: 'SALES', display: 'Kinh doanh' },
    { value: 'CS', display: 'Chăm sóc khách hàng' },
    { value: 'LEGAL', display: 'Pháp chế' },
    { value: 'ADMIN', display: 'Hành chính' },
    { value: 'PMO', display: 'Quản lý dự án' },
    { value: 'QA', display: 'Đảm bảo chất lượng' },
    { value: 'DATA', display: 'Phân tích dữ liệu' },
    { value: 'SEC', display: 'An toàn thông tin' },
    { value: 'RND', display: 'Nghiên cứu phát triển' },
  ];

  footerItems: Option[] = [...this.largeItems];

  dept = signal<string | null>(null);
  deptR = signal<string | null>(null);
  lockedA = signal<string | null>('HR');
  lockedB = signal<string | null>('FIN');
  inlineDept = signal<string | null>('IT');
  quick = signal<string | null>(null);
  footerDept = signal<string | null>(null);
  footerActionDept = signal<string | null>(null);
  footerItemDept = signal<string | null>(null);
  lastFooterAction = signal<string>('Chưa có thao tác footer action.');

  readonly footerActionSnippet = `<sd-select [items]="items" valueField="value" displayField="display">
  <ng-template
    sdSelectFooterAction
    when="empty"
    let-searchText="searchText"
  >
    <div class="my-select-footer-padding">
      <button type="button" (click)="addNew(searchText)">
        Add "{{ searchText }}"
      </button>
    </div>
  </ng-template>
</sd-select>`;

  #customDepartmentSeq = 1;

  check() { this.formValid.markAllAsTouched(); }
  reset() { this.formValid.reset(); this.formValid.markAsUntouched(); }

  addDepartment(searchText: string): void {
    const display = searchText.trim();
    if (!display) {
      this.lastFooterAction.set('Footer empty chỉ nên thêm khi searchText khác rỗng.');
      return;
    }

    const value = `CUSTOM_${this.#customDepartmentSeq++}`;
    this.footerItems = [...this.footerItems, { value, display }];
    this.footerDept.set(value);
    this.lastFooterAction.set(`Đã thêm phòng ban "${display}" và chọn giá trị ${value}.`);
  }

  recordFooterAction(when: string, searchText = ''): void {
    const text = searchText.trim() || '(không nhập search text)';
    this.lastFooterAction.set(`Action "${when}" được bấm với searchText: ${text}.`);
  }
}
