import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdHistoryItemType } from '../models/history.model';
import { ViewDateTimePipe } from '../pipes/view-date.pipe';
import { TranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  selector: 'sd-history',
  imports: [CommonModule, SdBadge, ViewDateTimePipe, TranslatePipe],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class SdHistoryItem {
  @Input() items: SdHistoryItemType[] = [];
}

