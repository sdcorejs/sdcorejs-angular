import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { AnchorService } from '../../services';

@Component({
  selector: 'sd-anchor-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './anchor-item.component.html',
  styleUrl: './anchor-item.component.scss',
})
export class SdAnchorItem implements AfterViewInit, OnDestroy {
  @Input() title!: string;
  @Input() icon?: string;
  id = uuidv4();

  constructor(
    public elementRef: ElementRef,
    private service: AnchorService
  ) {}

  ngAfterViewInit() {
    this.service.registerSection({
      id: this.id,
      element: this.elementRef.nativeElement,
      title: this.title,
    });
  }

  ngOnDestroy() {}
}
