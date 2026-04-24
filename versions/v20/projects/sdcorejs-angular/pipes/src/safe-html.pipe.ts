import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'sdSafeHtml',
  standalone: true,
})
@Injectable({
  providedIn: 'root',
})
export class SdSafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
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
