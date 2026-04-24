import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';

import { SdTab } from '../../models/tab-router.model';
import { SdTabRouterItemComponent } from '../tab-router-item/tab-router-item.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sd-tab-router-nav',
  templateUrl: './tab-router-nav.component.html',
  styleUrls: ['./tab-router-nav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, DragDropModule, SdTabRouterItemComponent],
})
export class SdTabRouterNavComponent {
  @ViewChild('tabRouterNav') tabRouterNav?: ElementRef;

  @Input() tabs: SdTab[] = [];
  mode: 'default' | 'compact' = 'default';

  constructor(
    private cdRef: ChangeDetectorRef,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public elementRef: ElementRef<any>
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkUI();
  }

  checkUI = () => {
    const width = this.tabRouterNav?.nativeElement.clientWidth;
    const nameWidth = (width - this.tabs!.length * 68) / this.tabs!.length;
    if (nameWidth <= 20) {
      this.mode = 'compact';
    } else {
      this.mode = 'default';
    }
    this.cdRef.markForCheck();
  };

  onDrop = (event: CdkDragDrop<SdTab[]>) => {
    moveItemInArray(this.tabs!, event.previousIndex, event.currentIndex);
  };
}
