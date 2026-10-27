import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';

type Scenario = 'ready' | 'empty' | 'error';

@Component({
  selector: 'app-tab-loading-example',
  standalone: true,
  imports: [SdButton, SdDataState, SdSection, SdSectionItem, SdTab, SdTabGroup],
  templateUrl: './tab-loading.example.html',
  styleUrl: './tab-pattern-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabLoadingExampleComponent {
  readonly tabs = [
    { label: 'Thông tin chung', icon: 'info', content: 'Khách hàng doanh nghiệp · Miền Bắc' },
    { label: 'Đơn hàng', icon: 'receipt_long', content: '24 đơn hàng · Giao hàng theo đợt' },
    { label: 'Lịch sử', icon: 'history', content: 'Nguyễn An cập nhật hồ sơ · 15/09/2026' },
  ];
  readonly scenario = signal<Scenario>('ready');
  readonly loading = signal(false);
  readonly selectedIndex = signal(0);

  /** Every tab has its own source: opening one loads it again (simulated 1.2 s). */
  async load(scenario = this.scenario()): Promise<void> {
    this.scenario.set(scenario);
    this.loading.set(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    this.loading.set(false);
  }

  open(index: number): void {
    this.selectedIndex.set(index);
    void this.load();
  }
}
