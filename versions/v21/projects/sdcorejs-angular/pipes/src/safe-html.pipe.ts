import { Injectable, Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'sdSafeHtml',
  standalone: true,
})
@Injectable({
  providedIn: 'root',
})
export class SdSafeHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}
  transform(html: string | number | undefined | null) {
    if (typeof html === 'number') {
      return html;
    }
    if (!html) {
      return undefined;
    }
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
