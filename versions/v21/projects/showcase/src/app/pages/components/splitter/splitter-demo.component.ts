import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdSplitterComponent, SdSplitterPanelComponent } from '@sdcorejs/angular/components/splitter';
import { SdButton } from '@sdcorejs/angular/components/button';

@Component({
  selector: 'app-splitter-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdSplitterComponent, SdSplitterPanelComponent, SdButton],
  template: `
    <demo-page
      title="Splitter"
      description="Chia không gian thành các panel có thể kéo để resize — hỗ trợ chiều ngang / dọc, đơn vị flex / px, panel gập được.">

      <demo-section heading="Splitter ngang 2 panel (flex)">
        <div class="wrap" style="height: 240px;">
          <sd-splitter orientation="horizontal">
            <sd-splitter-panel [size]="1" unit="flex">
              <div class="pane bg-blue">Sidebar (1)</div>
            </sd-splitter-panel>
            <sd-splitter-panel [size]="3" unit="flex">
              <div class="pane bg-grey">Nội dung chính (3)</div>
            </sd-splitter-panel>
          </sd-splitter>
        </div>
      </demo-section>

      <demo-section heading="Splitter dọc 3 panel với panel cố định px">
        <div class="wrap" style="height: 320px;">
          <sd-splitter orientation="vertical">
            <sd-splitter-panel [size]="64" unit="px">
              <div class="pane bg-blue">Header — 64px cố định</div>
            </sd-splitter-panel>
            <sd-splitter-panel [size]="1" unit="flex">
              <div class="pane bg-grey">Nội dung — flex 1</div>
            </sd-splitter-panel>
            <sd-splitter-panel [size]="100" unit="px">
              <div class="pane bg-blue">Footer — 100px</div>
            </sd-splitter-panel>
          </sd-splitter>
        </div>
      </demo-section>

      <demo-section heading="Panel có thể gập với API điều khiển từ ngoài">
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <sd-button type="light" color="primary" prefixIcon="menu_open" title="Gập / mở sidebar" (click)="toggleSidebar()"></sd-button>
          <sd-button type="light" color="secondary" prefixIcon="restart_alt" title="Reset layout" (click)="reset()"></sd-button>
        </div>

        <div class="wrap" style="height: 280px;">
          <sd-splitter #apiSplitter orientation="horizontal">
            <sd-splitter-panel panelId="sidebar" [size]="240" unit="px" [minSize]="100" [collapsible]="true">
              <div class="pane bg-blue">Sidebar (collapsible)</div>
            </sd-splitter-panel>
            <sd-splitter-panel panelId="main" [size]="1" unit="flex">
              <div class="pane bg-grey">Nội dung chính</div>
            </sd-splitter-panel>
            <sd-splitter-panel panelId="detail" [size]="320" unit="px" [minSize]="200" [collapsible]="true">
              <div class="pane bg-blue">Chi tiết (collapsible)</div>
            </sd-splitter-panel>
          </sd-splitter>
        </div>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    .wrap {
      width: 100%;
      border: 1px solid #e6e6e6;
      border-radius: 8px;
      overflow: hidden;
    }
    .pane {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      color: #1565c0;
    }
    .bg-blue { background: #e3f2fd; }
    .bg-grey { background: #f5f5f5; color: #424242; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplitterDemoComponent {
  readonly apiSplitter = viewChild<SdSplitterComponent>('apiSplitter');

  toggleSidebar() {
    this.apiSplitter()?.toggle('sidebar');
  }

  reset() {
    this.apiSplitter()?.resetLayout();
  }
}

