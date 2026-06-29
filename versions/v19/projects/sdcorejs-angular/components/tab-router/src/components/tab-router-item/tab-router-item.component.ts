import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { debounceTime, startWith } from 'rxjs/operators';

import { MatIconModule } from '@angular/material/icon';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdTab, SdTabInfo } from '../../models';
import { SdTabRouterService } from '../../services/tab-router.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SdTabInfoPipe } from '../../pipes/tab-info.pipe';

@Component({
  selector: 'sd-tab-router-item',
  templateUrl: './tab-router-item.component.html',
  styleUrl: './tab-router-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatIconModule, SdBadge, SdTabInfoPipe],
})
export class SdTabRouterItemComponent implements OnInit, OnDestroy {
  @Input({ required: true }) tab!: SdTab;

  #subsctiption: Subscription = new Subscription();
  tabInfo?: SdTabInfo;
  constructor(
    private cdRef: ChangeDetectorRef,
    private tabRouterService: SdTabRouterService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.#subsctiption.add(
      this.tabRouterService.events.pipe(debounceTime(100)).subscribe(() => {
        this.cdRef.markForCheck();
      })
    );

    this.#subsctiption.add(
      this.tab.tabInfoChanges.pipe(startWith(null)).subscribe(tabInfo => {
        if (tabInfo) {
          this.tabInfo = tabInfo;
          this.cdRef.markForCheck();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.#subsctiption.unsubscribe();
  }

  onTabClick = (event: Event) => {
    event.preventDefault();
    this.router.navigate([this.tab.url], {
      queryParams: this.tab.queryParams,
      state: { switchTab: true },
    });
  };

  close = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    this.#closeTab();
  };

  onMousedown = (event: MouseEvent) => {
    if (event.button === 1) {
      event.preventDefault();
    }
  };

  onMouseup = (event: MouseEvent) => {
    if (event.button === 1) {
      event.preventDefault();
      event.stopPropagation();
      this.#closeTab();
    }
  };

  #closeTab = () => {
    this.tabRouterService.close(this.tab);
  };
}
