import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdInform } from '@sdcorejs/angular/components/inform';
import { SdSection, SdSectionItem } from '@sdcorejs/angular/components/section';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';

@Component({
  selector: 'app-tab-disabled-example',
  standalone: true,
  imports: [SdButton, SdInform, SdSection, SdSectionItem, SdTab, SdTabGroup],
  templateUrl: './tab-disabled.example.html',
  styleUrl: './tab-pattern-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabDisabledExampleComponent {
  // "Hợp đồng" depends on a completed profile: explain the condition and offer the action that meets it.
  readonly profileComplete = signal(false);
}
