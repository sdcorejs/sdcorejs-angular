import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdCodeEditor } from '@sdcorejs/angular/components';

@Component({
  selector: 'demo-code-editor',
  standalone: true,
  imports: [CommonModule, SdCodeEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="padding: 32px; max-width: 1000px; margin: 0 auto; font-family: system-ui, sans-serif;">
      <h1 style="margin-bottom: 32px; color: #333;">ðŸš€ Demo Super Portal Editor</h1>

      <h3 style="color: #444; border-bottom: 2px solid #eee; padding-bottom: 8px;">1. Cháº¿ Ä‘á»™ Chá»‰ Ä‘á»c (Viewed = true) - HTML</h3>
      <p style="color: #666; font-size: 14px;">Chá»‰ dÃ¹ng Ä‘á»ƒ hiá»ƒn thá»‹ code cho Dev copy, khÃ´ng cho phÃ©p gÃµ.</p>

      <sd-code-editor language="html" [model]="sampleHtml()" [viewed]="true"> </sd-code-editor>

      <h3 style="color: #444; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-top: 48px;">
        2. Cháº¿ Ä‘á»™ Chá»‰nh sá»­a (Viewed = false) - TypeScript
      </h3>
      <p style="color: #666; font-size: 14px;">Click vÃ o khung code vÃ  gÃµ thá»­ Ä‘á»ƒ tháº¥y mÃ u sáº¯c tá»± Ä‘á»™ng nháº­n diá»‡n!</p>

      <sd-code-editor language="typescript" [(model)]="sampleTs" [viewed]="false"> </sd-code-editor>

      <h3 style="color: #444; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-top: 48px;">
        3. PhÃ©p thuáº­t JSON & Two-way Binding
      </h3>
      <p style="color: #666; font-size: 14px;">
        Thá»­ Ä‘á»•i chá»¯ <strong style="color: #e2777a">"Product Owner"</strong> thÃ nh tÃªn cá»§a báº¡n, hoáº·c Ä‘á»•i
        <strong style="color: #f08d49">true</strong> thÃ nh <strong style="color: #f08d49">false</strong>.<br />
        Xem dá»¯ liá»‡u <b>Object thá»±c táº¿</b> mÃ  Component Cha nháº­n Ä‘Æ°á»£c á»Ÿ Ã´ mÃ u vÃ ng bÃªn dÆ°á»›i nháº£y mÃºa theo thá»i gian thá»±c!
      </p>

      <div style="display: flex; gap: 24px; align-items: flex-start;">
        <div style="flex: 1;">
          <sd-code-editor language="json" [(model)]="sampleJsonObject" [viewed]="false"> </sd-code-editor>
        </div>

        <div style="flex: 1; background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px; padding: 16px;">
          <h4 style="margin-top: 0; color: #ff8f00;">ðŸ“¦ Dá»¯ liá»‡u Component Cha Ä‘ang giá»¯:</h4>
          <pre style="font-size: 13px; color: #424242; white-space: pre-wrap;">{{ currentJsonOutput() }}</pre>

          <div style="margin-top: 16px; font-size: 13px; color: #ff6f00; font-weight: bold;">Kiá»ƒu dá»¯ liá»‡u hiá»‡n táº¡i: {{ jsonType() }}</div>
        </div>
      </div>
    </div>
  `,
})
export class DemoCodeEditorComponent {
  // ==========================================
  // DATA DEMO Sá»¬ Dá»¤NG SIGNALS
  // ==========================================

  // 1. Dá»¯ liá»‡u String thuáº§n
  sampleHtml = signal(`<div class="portal-grid">
  <sd-input 
    label="Há» vÃ  tÃªn" 
    [(model)]="user.fullName" 
    [required]="true">
  </sd-input>

  <select-province 
    label="Tá»‰nh/ThÃ nh phá»‘" 
    [(model)]="user.provinceCode">
  </select-province>
</div>`);

  // 2. Dá»¯ liá»‡u String thuáº§n cho Two-way binding
  sampleTs = signal(`export class DynamicForm {
  // PO cÃ³ thá»ƒ gÃµ thÃªm code vÃ o Ä‘Ã¢y
  schemaId = "form_01";
  
  initForm() {
    console.log("Khá»Ÿi táº¡o form thÃ nh cÃ´ng!");
  }
}`);

  // 3. Dá»¯ liá»‡u truyá»n vÃ o lÃ  má»™t OBJECT thuáº§n tÃºy (KhÃ´ng pháº£i chuá»—i)
  sampleJsonObject = signal<any>({
    schemaId: 'user_table',
    isActive: true, // Thá»­ sá»­a chá»¯ true nÃ y thÃ nh false trÃªn mÃ n hÃ¬nh nhÃ©!
    author: 'Product Owner',
    columns: [
      { field: 'code', header: 'MÃ£ NV', width: 150 },
      { field: 'status', type: 'badge' },
    ],
  });

  // Signal phá»¥ trá»£ Ä‘á»ƒ hiá»ƒn thá»‹ káº¿t quáº£ cho demo sá»‘ 3
  currentJsonOutput = () => {
    try {
      return JSON.stringify(this.sampleJsonObject(), null, 2);
    } catch {
      return 'Dá»¯ liá»‡u Ä‘ang nháº­p bá»‹ sai cáº¥u trÃºc JSON...';
    }
  };

  jsonType = () => {
    const val = this.sampleJsonObject();
    return Array.isArray(val) ? 'Array' : typeof val; // Náº¿u lÃ  JSON chuáº©n, nÃ³ sáº½ bÃ¡o lÃ  "object"
  };
}

