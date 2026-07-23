import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdDataState, SdDataStateTemplateDirective } from '@sdcorejs/angular/components/data-state';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

@Component({
  selector: 'app-data-state-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdDataState, SdDataStateTemplateDirective],
  template: `
    <demo-page
      #demoPage
      title="Data State"
      description="SdDataState – presentation nhất quán cho loading, empty, error, forbidden và success mà không trộn với utilities/data-state.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-loading') {
        <demo-section heading="Loading" [props]="[{ name: 'compact', value: 'true' }]">
          <sd-data-state state="loading" compact></sd-data-state>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-empty') {
        <demo-section heading="Empty" note="Custom template nhận state/retry/action context thay cho default presentation.">
          <sd-data-state state="empty" compact>
            <ng-template sdDataStateTemplate let-state>
              <div class="custom-empty">Custom {{ state }}: chưa có đơn hàng phù hợp.</div>
            </ng-template>
          </sd-data-state>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-error') {
        <demo-section
          heading="Error"
          [props]="[
            { name: 'retryable', value: 'true' },
            { name: 'actionLabel', value: 'Mở nhật ký' },
          ]">
          <sd-data-state state="error" retryable actionLabel="Mở nhật ký" (sdRetry)="onRetry()" (sdAction)="onAction()"> </sd-data-state>
          <div>Retry: {{ retryCount() }} · Action: {{ actionCount() }}</div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-forbidden') {
        <demo-section heading="Forbidden" [props]="[{ name: 'fullPage', value: 'true' }]">
          <div class="full-page-preview">
            <sd-data-state state="forbidden" fullPage></sd-data-state>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-success') {
        <demo-section heading="Success" note="Không có presentation wrapper dư thừa; content được project trực tiếp.">
          <sd-data-state state="success">
            <article data-success>Dữ liệu đã sẵn sàng</article>
          </sd-data-state>
        </demo-section>
      }
    </demo-page>
  `,
  styles: `
    .custom-empty,
    [data-success] {
      padding: 16px;
      border: 1px dashed #98a2b3;
      border-radius: 8px;
    }

    .full-page-preview {
      max-height: 360px;
      overflow: auto;
      border: 1px solid #e4e7ec;
      border-radius: 8px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataStateDemoComponent {
  readonly retryCount = signal(0);
  readonly actionCount = signal(0);

  onRetry(): void {
    this.retryCount.update(value => value + 1);
  }

  onAction(): void {
    this.actionCount.update(value => value + 1);
  }
}
