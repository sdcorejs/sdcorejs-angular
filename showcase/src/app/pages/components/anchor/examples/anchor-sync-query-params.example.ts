import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdAnchor, SdAnchorItem } from '@sdcorejs/angular/components/anchor';

@Component({
  selector: 'app-anchor-sync-query-params-example',
  standalone: true,
  imports: [SdAnchor, SdAnchorItem],
  templateUrl: './anchor-sync-query-params.example.html',
  styles: [
    `
      .anchor-wrap {
        height: 320px;
        border: 1px solid var(--sd-border);
        border-radius: var(--sd-panel-radius, 8px);
        padding: 12px;
      }
      .block {
        min-height: 260px;
        padding: 8px 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnchorSyncQueryParamsExampleComponent {}
