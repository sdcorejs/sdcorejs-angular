import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, inject, input, viewChild } from '@angular/core';

import { SdTab } from '../../models/tab-router.model';
import { SdTabRouterItemComponent } from '../tab-router-item/tab-router-item.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sd-tab-router-nav',
  templateUrl: './tab-router-nav.component.html',
  styleUrl: './tab-router-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, DragDropModule, SdTabRouterItemComponent],
})
export class SdTabRouterNavComponent {
  tabRouterNav = viewChild<ElementRef>('tabRouterNav');

  tabs = input<SdTab[]>([]);
  mode: 'default' | 'compact' = 'default';
  cdRef = inject(ChangeDetectorRef);
  elementRef = inject<ElementRef<any>>(ElementRef);

  @HostListener('window:resize')
  onResize(): void {
    this.checkUI();
  }

  checkUI = () => {
    const width = this.tabRouterNav()?.nativeElement.clientWidth ?? 0;
    const tabs = this.tabs();
    if (tabs.length === 0) {
      this.mode = 'default';
      this.cdRef.markForCheck();
      return;
    }

    const nameWidth = (width - tabs.length * 68) / tabs.length;
    if (nameWidth <= 20) {
      this.mode = 'compact';
    } else {
      this.mode = 'default';
    }
    this.cdRef.markForCheck();
  };

  onDrop = (event: CdkDragDrop<SdTab[]>) => {
    moveItemInArray(this.tabs(), event.previousIndex, event.currentIndex);
  };
}
