import { Clipboard } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  ViewEncapsulation,
  booleanAttribute,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import * as Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import 'prismjs/components/prism-markup'; // HTML

export type CodeLanguage = 'html' | 'typescript' | 'json' | 'css' | 'scss';

@Component({
  selector: 'sd-code-editor',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss'],
  encapsulation: ViewEncapsulation.None, // Bắt buộc để nhận màu Prism
})
export class SdCodeEditor {
  #clipboard = inject(Clipboard);
  #sanitizer = inject(DomSanitizer);

  // ==========================================
  // 1. SIGNAL INPUTS & MODEL
  // ==========================================
  // Nhận bất kỳ kiểu dữ liệu nào (string, array, object)
  valueModel = model<any>(undefined, { alias: 'model' });

  language = input<CodeLanguage>('typescript');
  maxHeight = input<string>('500px');

  // Trạng thái Viewed (true = Read Only, false = Editable)
  viewed = input(false, { transform: booleanAttribute });

  // ==========================================
  // 2. INTERNAL STATE
  // ==========================================
  copied = signal<boolean>(false);

  // Chuỗi text nội bộ dùng để map với thẻ <textarea>
  textValue = signal<string>('');

  prismLang = computed(() => (this.language() === 'html' ? 'markup' : this.language()));

  // Cờ lưu vết để chống Loop (Vòng lặp vô tận khi bắn 2 chiều)
  private _lastEmittedValue: any = undefined;

  constructor() {
    // ==========================================
    // EFFECT 1: Dữ liệu từ CHA truyền vào (Model -> TextValue)
    // ==========================================
    effect(() => {
      const extVal = this.valueModel();
      const lang = this.language();

      untracked(() => {
        // Nếu giá trị này do chính component bắn ra, bỏ qua để tránh loop
        if (extVal === this._lastEmittedValue) return;

        if (typeof extVal === 'string') {
          this.textValue.set(extVal);
        } else if (extVal !== undefined && extVal !== null) {
          // Tự động format Object -> String nếu là JSON
          if (lang === 'json') {
            try {
              this.textValue.set(JSON.stringify(extVal, null, 2));
            } catch {
              this.textValue.set('// Lỗi: Object có tham chiếu vòng (Circular Reference)');
            }
          } else {
            this.textValue.set(String(extVal));
          }
        } else {
          this.textValue.set('');
        }
      });
    });
  }

  // ==========================================
  // EFFECT 2: PrismJS render (TextValue -> HTML MÀU)
  // ==========================================
  highlightedCode = computed<SafeHtml>(() => {
    // Dùng khoảng trắng để giữ độ cao cho thẻ pre nếu rỗng
    const rawCode = this.textValue() || ' ';
    const langKey = this.prismLang();
    const grammar = Prism.languages[langKey] || Prism.languages['markup'];

    // Cộng thêm \n ở cuối để chống lỗi con trỏ textarea ăn lẹm dòng cuối
    const highlightedString = Prism.highlight(rawCode, grammar, langKey) + '\n';
    return this.#sanitizer.bypassSecurityTrustHtml(highlightedString);
  });

  // ==========================================
  // EVENTS
  // ==========================================

  // Khi người dùng gõ vào Textarea (TextValue -> Model)
  onTextChange(newText: string) {
    this.textValue.set(newText);

    let valToEmit: any = newText;

    // Nếu ngôn ngữ là JSON, cố gắng trả về Object thật
    if (this.language() === 'json') {
      try {
        valToEmit = JSON.parse(newText);
      } catch {
        // Nếu gõ dở ngoặc/sai cú pháp -> Trả về chuỗi String tạm
        valToEmit = newText;
      }
    }

    // Ghi sổ và bắn ra ngoài
    this._lastEmittedValue = valToEmit;
    this.valueModel.set(valToEmit);
  }

  copyToClipboard() {
    const rawCode = this.textValue();
    if (!rawCode) return;

    if (this.#clipboard.copy(rawCode)) {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }
}
