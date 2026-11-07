import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';

@Component({
  selector: 'app-tab-sync-query-params-example',
  standalone: true,
  imports: [SdSection, SdSectionItem, SdTab, SdTabGroup],
  templateUrl: './tab-sync-query-params.example.html',
  styleUrl: './tab-pattern-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabSyncQueryParamsExampleComponent {}
