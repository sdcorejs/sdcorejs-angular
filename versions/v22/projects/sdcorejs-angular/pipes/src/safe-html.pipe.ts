import { Injectable, Pipe, PipeTransform, SecurityContext, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Render an HTML string through `[innerHTML]`.
 *
 * why: this pipe used to call `bypassSecurityTrustHtml()` unconditionally, on every value, with no
 * sanitize step. That turned every call site into a stored-XSS sink — and the library itself pipes
 * server-supplied table cell data through it
 * (`components/table/src/components/desktop-cell/view/view.component.html`), while
 * `components/table/sd-table.md` already described the value as "sanitized via sdSafeHtml".
 *
 * Now it **sanitizes by default** and the bypass is an explicit, per-call-site opt-in:
 *
 * ```html
 * <!-- untrusted / server-supplied: script, on* handlers and javascript: urls are stripped -->
 * <div [innerHTML]="row.note | sdSafeHtml"></div>
 *
 * <!-- app-authored markup you control, e.g. an inline SVG sprite -->
 * <span [innerHTML]="iconSvg | sdSafeHtml: true"></span>
 * ```
 *
 * This mirrors the decision already taken for the toast in `services/notify`: text-safe by default,
 * opt-in HTML. Auto-detecting "this looks like HTML" is deliberately NOT done — it would escalate
 * untrusted text that merely contains `<` straight back into the unsanitized sink.
 */
@Pipe({
  name: 'sdSafeHtml',
  standalone: true,
})
// why: kept `providedIn: 'root'` — consumer có thể `inject(SdSafeHtmlPipe)` để dùng ngoài template.
// Bỏ nó đi là một breaking change về DI (NullInjectorError) không liên quan gì tới việc siết XSS.
@Injectable({
  providedIn: 'root',
})
export class SdSafeHtmlPipe implements PipeTransform {
  readonly #sanitizer = inject(DomSanitizer);

  transform(html: string | number | undefined | null, trusted = false): SafeHtml | string | number | undefined {
    if (typeof html === 'number') {
      return html;
    }
    if (!html) {
      return undefined;
    }
    if (trusted) {
      // Caller has explicitly declared this markup as app-authored.
      return this.#sanitizer.bypassSecurityTrustHtml(html);
    }
    // `sanitize` returns `null` when the value is entirely stripped; normalise to `''` so the
    // binding clears the element instead of rendering the string "null".
    return this.#sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
  }
}
