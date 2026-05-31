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
  booleanAttribute
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
  encapsulation: ViewEncapsulation.None, // Báº¯t buá»™c Ä‘á»ƒ nháº­n mÃ u Prism
})
export class SdCodeEditor {
  #clipboard = inject(Clipboard);
  #sanitizer = inject(DomSanitizer);

  // ==========================================
  // 1. SIGNAL INPUTS & MODEL
  // ==========================================
  // Nháº­n báº¥t ká»³ kiá»ƒu dá»¯ liá»‡u nÃ o (string, array, object)
  valueModel = model<any>(undefined, { alias: 'model' });
  
  language = input<CodeLanguage>('typescript');
  maxHeight = input<string>('500px');
  
  // Tráº¡ng thÃ¡i Viewed (true = Read Only, false = Editable)
  viewed = input(false, { transform: booleanAttribute });

  // ==========================================
  // 2. INTERNAL STATE
  // ==========================================
  copied = signal<boolean>(false);
  
  // Chuá»—i text ná»™i bá»™ dÃ¹ng Ä‘á»ƒ map vá»›i tháº» <textarea>
  textValue = signal<string>('');
  
  prismLang = computed(() => this.language() === 'html' ? 'markup' : this.language());

  // Cá» lÆ°u váº¿t Ä‘á»ƒ chá»‘ng Loop (VÃ²ng láº·p vÃ´ táº­n khi báº¯n 2 chiá»u)
  private _lastEmittedValue: any = undefined;

  constructor() {
    // ==========================================
    // EFFECT 1: Dá»¯ liá»‡u tá»« CHA truyá»n vÃ o (Model -> TextValue)
    // ==========================================
    effect(() => {
      const extVal = this.valueModel();
      const lang = this.language();
      
      untracked(() => {
        // Náº¿u giÃ¡ trá»‹ nÃ y do chÃ­nh component báº¯n ra, bá» qua Ä‘á»ƒ trÃ¡nh loop
        if (extVal === this._lastEmittedValue) return;

        if (typeof extVal === 'string') {
          this.textValue.set(extVal);
        } else if (extVal !== undefined && extVal !== null) {
          // Tá»± Ä‘á»™ng format Object -> String náº¿u lÃ  JSON
          if (lang === 'json') {
            try {
              this.textValue.set(JSON.stringify(extVal, null, 2));
            } catch {
              this.textValue.set('// Lá»—i: Object cÃ³ tham chiáº¿u vÃ²ng (Circular Reference)');
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
  // EFFECT 2: PrismJS render (TextValue -> HTML MÃ€U)
  // ==========================================
  highlightedCode = computed<SafeHtml>(() => {
    // DÃ¹ng khoáº£ng tráº¯ng Ä‘á»ƒ giá»¯ Ä‘á»™ cao cho tháº» pre náº¿u rá»—ng
    const rawCode = this.textValue() || ' '; 
    const langKey = this.prismLang();
    const grammar = Prism.languages[langKey] || Prism.languages['markup'];
    
    // Cá»™ng thÃªm \n á»Ÿ cuá»‘i Ä‘á»ƒ chá»‘ng lá»—i con trá» textarea Äƒn láº¹m dÃ²ng cuá»‘i
    const highlightedString = Prism.highlight(rawCode, grammar, langKey) + '\n';
    return this.#sanitizer.bypassSecurityTrustHtml(highlightedString);
  });

  // ==========================================
  // EVENTS
  // ==========================================
  
  // Khi ngÆ°á»i dÃ¹ng gÃµ vÃ o Textarea (TextValue -> Model)
  onTextChange(newText: string) {
    this.textValue.set(newText);
    
    let valToEmit: any = newText;
    
    // Náº¿u ngÃ´n ngá»¯ lÃ  JSON, cá»‘ gáº¯ng tráº£ vá» Object tháº­t
    if (this.language() === 'json') {
      try {
        valToEmit = JSON.parse(newText);
      } catch {
        // Náº¿u gÃµ dá»Ÿ ngoáº·c/sai cÃº phÃ¡p -> Tráº£ vá» chuá»—i String táº¡m
        valToEmit = newText; 
      }
    }
    
    // Ghi sá»• vÃ  báº¯n ra ngoÃ i
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
