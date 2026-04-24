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
  
  // input.required() sáº½ Ã©p dev báº¯t buá»™c pháº£i truyá»n [display] vÃ o, y há»‡t @Input({ required: true })
  display = input.required<string | null | undefined>(); 
  hyperlink = input<string | null | undefined>();

  // Input Ä‘á»ƒ há»©ng template tá»« component cha (nhÆ° sd-input, sd-select) truyá»n xuá»‘ng
  labelTemplate = input<TemplateRef<any> | undefined>();
  valueTemplate = input<TemplateRef<any> | undefined>(); 

  // ==========================================
  // 2. SIGNAL QUERIES (Thay tháº¿ @ContentChild)
  // ==========================================
  // Tráº£ vá» Signal chá»©a TemplateRef náº¿u Dev dÃ¹ng tháº» <sd-view> vÃ  truyá»n #sdLabel, #sdValue
  contentLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');
  contentValueTemplate = contentChild<TemplateRef<any>>('sdValue');

  // ==========================================
  // 3. COMPUTED SIGNALS (Thay tháº¿ Getters)
  // ==========================================
  // Æ¯u tiÃªn Input tá»« cha truyá»n xuá»‘ng, khÃ´ng cÃ³ thÃ¬ láº¥y ContentChild
  // Lá»£i Ã­ch: Cache giÃ¡ trá»‹, khÃ´ng bá»‹ cháº¡y láº¡i vÃ´ tá»™i váº¡ nhÆ° Getter cÅ©!
  activeLabelTemplate = computed(() => this.labelTemplate() ?? this.contentLabelTemplate());
  
  activeValueTemplate = computed(() => this.valueTemplate() ?? this.contentValueTemplate());
}
