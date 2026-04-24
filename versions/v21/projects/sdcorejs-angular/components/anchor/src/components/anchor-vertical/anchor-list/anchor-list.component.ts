import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, QueryList } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AnchorService } from '../../../services';
import { SdAnchorItem } from '../../anchor-item/anchor-item.component';

@Component({
  selector: 'sd-vertical-anchor-list',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './anchor-list.component.html',
  styleUrl: './anchor-list.component.scss',
})
export class SdVerticalAnchorList implements OnInit {
  @Input() sections!: QueryList<SdAnchorItem>;
  @Input() width!: string;
  @Input() ellipsis!:boolean
  
  @Output() sdOnClickSectionItem = new EventEmitter<SdAnchorItem>();
  activeId: string | null = null;

  constructor(private service: AnchorService) {}

  ngOnInit() {
    this.service.activeIdAsObservable.subscribe(id => (this.activeId = id));
  }

  onTabClick(section: SdAnchorItem) {
    this.service.scrollSectionToView(section.id);
    this.sdOnClickSectionItem.emit(section);
  }
}
