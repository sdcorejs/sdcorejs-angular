import { DOCUMENT } from '@angular/common';
import { Directive, inject, input } from '@angular/core';

/** Builds a same-document fragment URL without resolving it against the application's base href. */
export function buildDocsFragmentHref(pathname: string, search: string, fragment: string): string {
  const normalizedFragment = fragment.replace(/^#/, '');
  return `${pathname || '/'}${search || ''}#${encodeURIComponent(normalizedFragment)}`;
}

@Directive({
  selector: 'a[docsFragmentLink]',
  standalone: true,
  host: {
    '[attr.href]': 'href',
  },
})
export class DocsFragmentLinkDirective {
  readonly fragment = input.required<string>({ alias: 'docsFragmentLink' });
  readonly #document = inject(DOCUMENT);

  get href(): string {
    const { pathname, search } = this.#document.location;
    return buildDocsFragmentHref(pathname, search, this.fragment());
  }
}
