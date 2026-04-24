import { BehaviorSubject, fromEvent, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AnchorSection } from '../models/anchor.model';
import { HasEventTargetAddRemove } from 'rxjs/internal/observable/fromEvent';

export class AnchorService {
  #sections: AnchorSection[] = [];
  #activeIdSubject = new BehaviorSubject<string | null>(null);
  #scrollSubscription: Subscription | null = null;
  #TOP_OFFSET = 140;
  #BOTTOM_OFFSET = 8;
  #CANCEL_SCROLL_DELAY = 1000;
  #lastProgrammaticScroll = 0;

  constructor() {}

  get activeIdAsObservable() {
    return this.#activeIdSubject.asObservable();
  }
  get activeId() {
    return this.#activeIdSubject.value;
  }

  registerSection(section: AnchorSection) {
    this.#sections.push(section);
    if (this.#sections.length === 1) {
      this.#setActiveId(section.id);
    }
  }

  scrollSectionToView(id: string) {
    const section = this.#sections.find(s => s.id === id);
    if (section) {
      section.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.#setActiveId(id);
      this.#lastProgrammaticScroll = Date.now();
    }
  }

  #setActiveId(id: string) {
    this.#activeIdSubject.next(id);
  }

  onScroll(scrollContainer: HasEventTargetAddRemove<Event>) {
    this.#scrollSubscription?.unsubscribe();
    this.#scrollSubscription = fromEvent(scrollContainer, 'scroll')
      .pipe(debounceTime(100))
      .subscribe(() => {
        // Chặn việc sau khi scroll bằng code (bấm ở menu) và thực hiện scroll tự nhiên nhẹ nó sẽ nhảy
        if (Date.now() - this.#lastProgrammaticScroll < this.#CANCEL_SCROLL_DELAY) {
          return;
        }
        const sections = document.querySelectorAll('sd-anchor-item');
        sections.forEach(section => {
          const rect = section.getBoundingClientRect();
          if (rect.top <= this.#TOP_OFFSET && rect.bottom > this.#BOTTOM_OFFSET) {
            const id = section.querySelector('section')?.getAttribute('data-sd-anchor-section-id')!;
            this.#setActiveId(id);
          }
        });
      });
  }

  destroy() {
    this.#scrollSubscription?.unsubscribe();
    this.#activeIdSubject.complete();
  }
}
