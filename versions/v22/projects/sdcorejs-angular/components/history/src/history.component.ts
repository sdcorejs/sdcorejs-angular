import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdHistoryItemType } from '../models/history.model';
import { ViewDateTimePipe } from '../pipes/view-date.pipe';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'sd-history',
  imports: [CommonModule, SdBadge, ViewDateTimePipe, SdTranslatePipe],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class SdHistoryItem {
  @Input() items: SdHistoryItemType[] = [];
}
