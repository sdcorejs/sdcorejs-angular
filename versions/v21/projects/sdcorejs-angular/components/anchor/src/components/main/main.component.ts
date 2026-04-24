import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChild,
} from '@angular/core';
import { AnchorService } from '../../services';
import { SdHorizontalAnchorList } from '../anchor-horizontal/anchor-list/anchor-list.component';
import { SdAnchorItem } from '../anchor-item/anchor-item.component';
import { SdVerticalAnchorList } from '../anchor-vertical/anchor-list/anchor-list.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'sd-anchor',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  imports: [CommonModule, SdVerticalAnchorList, SdHorizontalAnchorList],
  providers: [AnchorService],
})
export class SdAnchor implements AfterViewInit, OnDestroy {
  @Input() type: 'vertical' | 'horizontal' = 'vertical';
  @Input() scrollContainer?: 'parent' | HTMLElement | null = null;
  @Input() width: string = '200px';
  ellipsis = false;
  @Input('ellipsis') set _ellipsis(value: '' | boolean | undefined | null) {
    this.ellipsis = value === '' || !!value;
  }
  @ContentChildren(SdAnchorItem) sections!: QueryList<SdAnchorItem>;
  @ViewChild('scrollContainer') scrollContainerRef!: ElementRef<HTMLElement>;

  @Output() sdClickSectionItem = new EventEmitter<SdAnchorItem>();
  @Output() sdSectionChange = new EventEmitter<SdAnchorItem>();

  #scrollContainer: HTMLElement | Window | null = null;
  #subscription: Subscription | null = null;

  constructor(
    private service: AnchorService,
    private elementRef: ElementRef
  ) {}

  ngAfterViewInit() {
    this.#setScrollContainer();

    if (this.#scrollContainer) {
      this.service.onScroll(this.#scrollContainer);
    }

    this.#subscription = this.service.activeIdAsObservable.subscribe(id => {
      const section = this.sections.find(section => section.id === id);
      if (section) {
        this.sdSectionChange.emit(section);
      }
    });
  }

  ngOnDestroy() {
    this.#subscription?.unsubscribe();
    this.service.destroy();
  }

  #setScrollContainer() {
    if (this.scrollContainer === 'parent') {
      this.#scrollContainer = this.elementRef?.nativeElement?.parentElement;
    } else if (this.scrollContainer instanceof HTMLElement) {
      this.#scrollContainer = this.scrollContainer;
    } else {
      this.#scrollContainer = this.type === 'vertical' ? window : this.scrollContainerRef?.nativeElement;
    }
  }

  handleClickSectionItem(section: SdAnchorItem) {
    this.sdClickSectionItem.emit(section);
  }
}
