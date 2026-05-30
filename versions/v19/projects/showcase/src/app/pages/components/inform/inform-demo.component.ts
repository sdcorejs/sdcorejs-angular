import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdInform, SdInformActionDirective } from '@sdcorejs/angular/components/inform';

const LONG = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec semper nunc in faucibus dictum. Suspendisse interdum tempor est, vitae rutrum mauris gravida vitae. Praesent mattis libero id consequat imperdiet. Donec egestas, purus at ultricies condimentum, nulla nisi pulvinar.`;

@Component({
  selector: 'app-inform-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdInform, SdInformActionDirective],
  template: `
    <demo-page
      title="Inform"
      description="Banner / alert neo trÃªn page â€” bÃ¡o lá»—i, cáº£nh bÃ¡o, thÃ´ng tin. 6 mÃ u, Ä‘Ã³ng Ä‘Æ°á»£c, action, line-clamp.">

      <demo-section heading="Báº£ng mÃ u (color)">
        <sd-inform primary title="primary" description="Message body."></sd-inform>
        <sd-inform secondary title="secondary" description="Message body."></sd-inform>
        <sd-inform info title="info" description="Message body."></sd-inform>
        <sd-inform success title="success" description="Message body."></sd-inform>
        <sd-inform warning title="warning" description="Message body."></sd-inform>
        <sd-inform error title="error" description="Message body."></sd-inform>
      </demo-section>

      <demo-section heading="ÄÃ³ng Ä‘Æ°á»£c + action link">
        <sd-inform error closable title="KhÃ´ng táº£i Ä‘Æ°á»£c dá»¯ liá»‡u" description="MÃ¡y chá»§ khÃ´ng pháº£n há»“i." actionLabel="Thá»­ láº¡i"></sd-inform>
        <sd-inform info closable title="Báº£n nhÃ¡p Ä‘Ã£ lÆ°u" description="Tá»± Ä‘á»™ng lÆ°u lÃºc 14:30." actionLabel="Xem"></sd-inform>
      </demo-section>

      <demo-section heading="áº¨n icon">
        <sd-inform success hideIcon title="ÄÃ£ lÆ°u" description="KhÃ´ng cÃ³ icon."></sd-inform>
      </demo-section>

      <demo-section heading="Line-clamp (Xem thÃªm / Thu gá»n)">
        <sd-inform info title="Äiá»u khoáº£n" [description]="long" [lineClamp]="3"></sd-inform>
        <sd-inform success [description]="long" [lineClamp]="2"></sd-inform>
      </demo-section>

      <demo-section heading="Action custom (projection)">
        <sd-inform warning title="Cháº¿ Ä‘á»™ chá»‰ Ä‘á»c" description="Báº¡n khÃ´ng cÃ³ quyá»n chá»‰nh sá»­a.">
          <button sdInformAction class="demo-action-btn">YÃªu cáº§u quyá»n</button>
        </sd-inform>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    :host ::ng-deep demo-section > * { display: block; margin-bottom: 12px; }
    .demo-action-btn { border: none; background: none; color: inherit; cursor: pointer; padding: 0; text-decoration: underline; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InformDemoComponent {
  readonly long = LONG;
}

