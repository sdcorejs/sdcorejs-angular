import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, QueryList } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AnchorService } from '../../../services';
import { SdAnchorItem } from '../../anchor-item/anchor-item.component';

@Component({
  selector: 'sd-horizontal-anchor-list',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './anchor-list.component.html',
  styleUrl: './anchor-list.component.scss',
})
export class SdHorizontalAnchorList implements OnInit {
  @Input() sections!: QueryList<SdAnchorItem>;
  activeId: string | null = null;
  @Output() sdOnClickSectionItem = new EventEmitter<SdAnchorItem>();

  constructor(private service: AnchorService) {}

  ngOnInit() {
    this.service.activeIdAsObservable.subscribe(id => (this.activeId = id));
  }

  onTabClick(section: SdAnchorItem) {
    this.service.scrollSectionToView(section.id);
    this.sdOnClickSectionItem.emit(section);
  }

  onWheel(event: WheelEvent, container: HTMLElement) {
    if (container.scrollWidth > container.clientWidth) {
      event.preventDefault();
      container.scrollLeft += event.deltaY;
    }
  }
}
