import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DocsClipboardService } from '../core/docs-clipboard.service';
import { DocsI18nService } from '../core/docs-i18n.service';
import { DocsReleaseBadge } from '../core/docs-release-badges';
import { DocPageDefinition } from '../core/documentation.models';

interface IdentityCell {
  readonly key: 'selector' | 'import' | 'class' | 'provided';
  readonly label: string;
  readonly value: string;
  readonly grow: boolean;
}

interface InlineSegment {
  readonly text: string;
  readonly code: boolean;
}

/** First `code` span of a metadata value: "`SdButton` (implements `OnInit`)" → "SdButton". */
export function metadataCode(value: string | undefined): string | null {
  if (!value) return null;
  const code = /`([^`]+)`/.exec(value)?.[1] ?? value.trim();
  return code || null;
}

/** Splits text on `backticks` into plain and inline-code segments. */
export function inlineCodeSegments(text: string): readonly InlineSegment[] {
  return text
    .split('`')
    .map((part, index) => ({ text: part, code: index % 2 === 1 }))
    .filter(segment => segment.text.length > 0);
}

@Component({
  selector: 'docs-page-header',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './docs-page-header.component.html',
  styleUrl: './docs-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsPageHeaderComponent {
  readonly i18n = inject(DocsI18nService);
  readonly clipboard = inject(DocsClipboardService);

  readonly page = input.required<DocPageDefinition>();
  readonly version = input.required<string>();
  readonly release = input('');
  readonly invalidVersion = input<string | null>(null);
  /** Metadata lines of the published document (Type, Class, Provided in…). */
  readonly metadata = input<Readonly<Record<string, string>>>({});
  /** English one-line purpose from the published document; the registry description (Vietnamese) is the fallback. */
  readonly lead = input<string | null>(null);
  readonly badge = input<DocsReleaseBadge | null>(null);

  readonly leadText = computed(() => {
    const english = this.lead();
    if (english && this.i18n.language() === 'en') return { lang: 'en', segments: inlineCodeSegments(english) };
    return { lang: 'vi', segments: inlineCodeSegments(this.page().description) };
  });

  readonly badgeText = computed(() => {
    const badge = this.badge();
    if (!badge || !this.release()) return null;
    return this.i18n.format(badge === 'new' ? 'newIn' : 'updatedIn', { v: this.release() });
  });

  readonly identity = computed<readonly IdentityCell[]>(() => {
    const page = this.page();
    const metadata = this.metadata();
    const t = this.i18n.t();
    const className = metadataCode(metadata['Class']);
    const providedIn = metadataCode(metadata['Provided in']);
    const cells: IdentityCell[] = [];
    if (page.selector) cells.push({ key: 'selector', label: t.selector, value: page.selector, grow: false });
    else if (className) cells.push({ key: 'class', label: t.className, value: className, grow: false });
    cells.push({ key: 'import', label: t.importPath, value: page.importPath, grow: true });
    if (page.selector && className) cells.push({ key: 'class', label: t.className, value: className, grow: false });
    if (providedIn) cells.push({ key: 'provided', label: t.providedIn, value: providedIn, grow: false });
    return cells;
  });

  copy(cell: IdentityCell): void {
    void this.clipboard.copy(cell.value, `identity-${cell.key}`);
  }
}
