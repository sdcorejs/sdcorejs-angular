import { Directive, ElementRef, HostListener, OnInit, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[sdScroll]',
  standalone: true,
})
export class SdScrollDirective implements OnInit {
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);

  #overflowX: 'hidden' | 'auto' | 'overlay' = 'hidden';
  #overflowY: 'hidden' | 'auto' | 'overlay' = 'auto';
  @HostListener('mouseover')
  onMouseOver() {
    this.#overflowX = 'auto';
    // this.#overflowY = 'auto';
    this.renderer.setStyle(this.elementRef.nativeElement, 'overflow-x', this.#overflowX);
    // this.renderer.setStyle(this.elementRef.nativeElement, 'overflow-y', this.#overflowY);
  }

  @HostListener('mouseout')
  onMouseOut() {
    this.#overflowX = 'hidden';
    this.renderer.setStyle(this.elementRef.nativeElement, 'overflow-x', this.#overflowX);
  }

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  ngOnInit(): void {
    this.renderer.setStyle(this.elementRef.nativeElement, '-webkit-transform', 'translate3d(0, 0, 0)');
    this.renderer.setStyle(this.elementRef.nativeElement, 'overflow-x', this.#overflowX);
    this.renderer.setStyle(this.elementRef.nativeElement, 'overflow-y', this.#overflowY);
  }

  scrollTop = () => {
    setTimeout(() => {
      if (this.elementRef?.nativeElement) {
        this.elementRef.nativeElement.scrollTop = 0;
      }
    }, 1);
  };
}
