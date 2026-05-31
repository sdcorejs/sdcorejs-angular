import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdInputColor } from '@sdcorejs/angular/forms/input-color';

@Component({
  selector: 'app-input-color-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdInputColor, FormsModule],
  template: `
    <demo-page
      title="Input Color"
      description="Ã” nháº­p mÃ£ mÃ u HEX vá»›i swatch hiá»ƒn thá»‹ mÃ u hiá»‡n táº¡i. Báº¥m swatch Ä‘á»ƒ má»Ÿ báº£ng chá»n mÃ u hoáº·c gÃµ tay mÃ£ HEX (#RGB / #RRGGBB / #RRGGBBAA).">

      <demo-section heading="CÆ¡ báº£n" note="GiÃ¡ trá»‹ bind hai chiá»u â€” pick hoáº·c gÃµ tay Ä‘á»u cáº­p nháº­t signal.">
        <div class="row">
          <sd-input-color label="MÃ u thÆ°Æ¡ng hiá»‡u" [(model)]="brand" />
          <span class="value">Äang chá»n: <code>{{ brand() || '(trá»‘ng)' }}</code></span>
        </div>
      </demo-section>

      <demo-section heading="Validator (required + hex)" note="Äá»ƒ trá»‘ng hoáº·c gÃµ chuá»—i sai Ä‘á»‹nh dáº¡ng (vd 'red') sáº½ hiá»‡n lá»—i.">
        <sd-input-color
          label="required"
          helperText="Äá»‹nh dáº¡ng #RGB, #RRGGBB hoáº·c #RRGGBBAA"
          [required]="true"
          [(model)]="tagColor" />
      </demo-section>

      <demo-section heading="Tráº¡ng thÃ¡i (state)">
        <sd-input-color label="disabled" [model]="'#1565C0'" [disabled]="true" />
        <sd-input-color label="readonly" [model]="'#4CAF50'" [readonly]="true" />
        <sd-input-color label="viewed" [model]="'#F82C13'" [viewed]="true" />
      </demo-section>

      <demo-section heading="Hex dáº¡ng ngáº¯n / kÃ¨m alpha" note="Picker tá»± normalize #RGB â†’ #RRGGBB vÃ  bá» alpha; swatch giá»¯ giÃ¡ trá»‹ tháº­t.">
        <div class="row">
          <sd-input-color label="Hex 3 kÃ½ tá»±" [(model)]="shortHex" />
          <span class="value">Swatch hiá»ƒn thá»‹: <code>{{ shortHex() }}</code></span>
        </div>
        <div class="row">
          <sd-input-color label="Hex 8 kÃ½ tá»± (cÃ³ alpha)" [(model)]="alphaHex" />
          <span class="value">Swatch hiá»ƒn thá»‹: <code>{{ alphaHex() }}</code></span>
        </div>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    :host ::ng-deep demo-section .demo-section__body {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .value {
      font-size: 13px;
      color: #4a4a4a;
    }
    code {
      background: #f0f3f7;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputColorDemoComponent {
  readonly brand = signal<string | undefined>('#1565C0');
  readonly tagColor = signal<string | undefined>(undefined);
  readonly shortHex = signal<string | undefined>('#0AF');
  readonly alphaHex = signal<string | undefined>('#1565C088');
}

