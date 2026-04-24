import { CommonModule } from '@angular/common';
import { Component, ContentChildren, EventEmitter, Input, OnInit, Output, QueryList } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, Subject, Subscription } from 'rxjs';
import { SdAnchorItemV2 } from '../anchor-item-v2/anchor-item-v2.component';

@Component({
  selector: 'sd-anchor-vertical-list-v2',
  templateUrl: './anchor-vertical-list-v2.component.html',
  styleUrl: './anchor-vertical-list-v2.component.scss',
  imports: [CommonModule, MatIconModule],
  standalone: true,
})
export class SdAnchorVerticalListV2 implements OnInit {
  constructor() {}
  @Input() sections!: QueryList<SdAnchorItemV2>;
  @Input() activeSectionId: string = '';
  @Input() ellipsis!: boolean;
  @Input() sidebarWidth!: string;

  @Output() sdClickSection = new EventEmitter<string>();

  #delay: number = 200;
  #clickSectionSubject = new Subject<string>();
  #subscription = new Subscription();

  ngOnInit() {
    this.#subscription.add(
      this.#clickSectionSubject.pipe(debounceTime(this.#delay)).subscribe((idSectionTarget: string) => {
        this.sdClickSection.emit(idSectionTarget);
      })
    );
  }

  onClickSection = (idSectionTarget: string): void => {
    this.#clickSectionSubject.next(idSectionTarget);
  };
  
  ngOnDestroy() {
    this.#subscription?.unsubscribe();
  }
}
