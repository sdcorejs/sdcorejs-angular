import { NgTemplateOutlet } from '@angular/common';
import { 
  ChangeDetectionStrategy, 
  Component, 
  TemplateRef, 
  input, 
  contentChild, 
  computed 
} from '@angular/core';
import { SdHrefDirective } from '@sdcorejs/angular/directives';
import { SdEmptyPipe } from '@sdcorejs/angular/pipes';

@Component({
  selector: 'sd-view',
  standalone: true,
  imports: [SdEmptyPipe, SdHrefDirective, NgTemplateOutlet],
  templateUrl: './view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdView {
  // ==========================================
  // 1. SIGNAL INPUTS
  // ==========================================
  label = input<string | null | undefined>();
  value = input<any>(); 
  
  // input.required() sẽ ép dev bắt buộc phải truyền [display] vào, y hệt @Input({ required: true })
  display = input.required<string | null | undefined>(); 
  hyperlink = input<string | null | undefined>();

  // Input để hứng template từ component cha (như sd-input, sd-select) truyền xuống
  labelTemplate = input<TemplateRef<any> | undefined>();
  valueTemplate = input<TemplateRef<any> | undefined>();

  // why: cha (sd-select) chuyển danh sách item đã chọn xuống để template "head +N"
  // (chip multi sd-select) có thể đọc displayField — sd-view chỉ là proxy, không tự build list.
  selectedItems = input<any[] | undefined>();

  // ==========================================
  // 2. SIGNAL QUERIES (Thay thế @ContentChild)
  // ==========================================
  // Trả về Signal chứa TemplateRef nếu Dev dùng thẻ <sd-view> và truyền #sdLabel, #sdValue
  contentLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');
  contentValueTemplate = contentChild<TemplateRef<any>>('sdValue');

  // ==========================================
  // 3. COMPUTED SIGNALS (Thay thế Getters)
  // ==========================================
  // Ưu tiên Input từ cha truyền xuống, không có thì lấy ContentChild
  // Lợi ích: Cache giá trị, không bị chạy lại vô tội vạ như Getter cũ!
  activeLabelTemplate = computed(() => this.labelTemplate() ?? this.contentLabelTemplate());
  
  activeValueTemplate = computed(() => this.valueTemplate() ?? this.contentValueTemplate());
}