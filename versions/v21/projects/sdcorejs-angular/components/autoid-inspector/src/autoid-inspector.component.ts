import { CommonModule } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  input,
  OnDestroy,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

import { SdAutoidElement, SdAutoidAuditResult } from './models/autoid-element.model';
import {
  SdAutoidInspectorConfig,
  SD_AUTOID_DEFAULT_REQUIRE_SELECTORS,
} from './models/autoid-inspector-config.model';
import { SdAutoidExportMeta } from './models/autoid-export-format.model';
import { SdAutoidScannerService } from './services/autoid-scanner.service';
import { SdAutoidAuditService } from './services/autoid-audit.service';
import { SdAutoidHighlightService } from './services/autoid-highlight.service';
import { SdAutoidExportService } from './services/autoid-export.service';

type Segment = 'audit' | 'elements' | 'export';

@Component({
  selector: 'sd-autoid-inspector',
  templateUrl: './autoid-inspector.component.html',
  styleUrls: ['./autoid-inspector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule],
})
export class SdAutoidInspector implements OnDestroy {
  // ==========================================
  // INPUTS
  // ==========================================
  enabled = input(true, { transform: booleanAttribute });
  config = input<SdAutoidInspectorConfig | undefined>(undefined);

  // ==========================================
  // STATE
  // ==========================================
  open = signal(false);
  segment = signal<Segment>('audit');
  filter = signal('');
  elements = signal<SdAutoidElement[]>([]);
  audit = signal<SdAutoidAuditResult | null>(null);
  copyOk = signal(false);
  // Default true để mở panel lần đầu là có highlight ngay. Đóng panel KHÔNG
  // tự tắt — user toggle qua nút trong tab Audit khi muốn nhìn DOM gốc.
  highlightOn = signal(true);
  // Ẩn tạm FAB — chỉ in-memory, reload trang sẽ hiện lại (theo thiết kế).
  dismissed = signal(false);

  filteredElements = computed(() => {
    const q = this.filter().trim().toLowerCase();
    if (!q) return this.elements();
    return this.elements().filter(
      el =>
        el.autoid.toLowerCase().includes(q) ||
        el.name.toLowerCase().includes(q) ||
        el.tag.toLowerCase().includes(q)
    );
  });

  /**
   * Elements not inside any sd-table — rendered in the main "Top-level" section.
   */
  readonly topLevelElements = computed(() =>
    this.filteredElements().filter(el => !el.tableScope)
  );

  /**
   * Map of `sd-table` autoid → its inner autoid elements. Tables themselves
   * stay in `topLevelElements` (the table's own autoid is top-level).
   */
  readonly tableGroups = computed(() => {
    const groups = new Map<string, SdAutoidElement[]>();
    for (const el of this.filteredElements()) {
      if (!el.tableScope) continue;
      if (!groups.has(el.tableScope)) groups.set(el.tableScope, []);
      groups.get(el.tableScope)!.push(el);
    }
    // Return a sorted array for stable rendering.
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([scope, items]) => ({ scope, items }));
  });

  // ==========================================
  // DATA-* ATTRIBUTE COMPUTEDS (for E2E selectors)
  // ==========================================
  readonly dataOpened = computed(() => (this.open() ? 'true' : 'false'));
  readonly dataHighlightOn = computed(() => (this.highlightOn() ? 'true' : 'false'));
  readonly dataSegment = computed(() => this.segment());
  readonly dataElementCount = computed(() => String(this.elements().length));
  readonly dataMissingCount = computed(() => String(this.audit()?.missingCount ?? 0));
  readonly dataDuplicateCount = computed(() => String(this.audit()?.duplicateCount ?? 0));

  // ==========================================
  // SERVICES
  // ==========================================
  #scanner = inject(SdAutoidScannerService);
  #auditSvc = inject(SdAutoidAuditService);
  #highlight = inject(SdAutoidHighlightService);
  #export = inject(SdAutoidExportService);

  // ==========================================
  // LIFECYCLE
  // ==========================================
  ngOnDestroy(): void {
    this.#highlight.clear(this.#root());
  }

  // ==========================================
  // ACTIONS
  // ==========================================
  togglePanel = (): void => {
    if (this.open()) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  };

  openPanel = (): void => {
    if (!this.enabled()) return;
    this.refresh();
    this.open.set(true);
  };

  closePanel = (): void => {
    this.open.set(false);
    // Highlight được giữ lại để user vẫn thấy outline khi panel ẩn —
    // toggleHighlight trong tab Audit là cách duy nhất để clear.
  };

  refresh = (): void => {
    const root = this.#root();
    const elements = this.#scanner.scan(root);
    const result = this.#auditSvc.audit(elements, {
      root,
      requireSelectors: this.#requireSelectors(),
    });
    this.elements.set(elements);
    this.audit.set(result);
    this.#applyHighlightIfOn(result);
  };

  dismissFab = (event: Event): void => {
    event.stopPropagation();
    this.dismissed.set(true);
    if (this.open()) this.closePanel();
  };

  toggleHighlight = (): void => {
    const next = !this.highlightOn();
    this.highlightOn.set(next);
    if (next) {
      this.#applyHighlightIfOn(this.audit());
    } else {
      this.#highlight.clear(this.#root());
    }
  };

  setSegment = (seg: Segment): void => this.segment.set(seg);

  copyJson = async (): Promise<void> => {
    await this.#export.copyToClipboard(this.#export.toJson(this.elements()));
    this.#flashCopyOk();
  };

  copyXpath = async (autoid: string): Promise<void> => {
    await this.#export.copyToClipboard(`//*[@data-autoid="${autoid}"]`);
    this.#flashCopyOk();
  };

  exportCsv = (): void => {
    this.#export.download(
      this.#export.toCsv(this.elements()),
      this.#filename('csv'),
      'text/csv;charset=utf-8'
    );
  };

  exportJson = (): void => {
    this.#export.download(
      this.#export.toJson(this.elements()),
      this.#filename('json'),
      'application/json'
    );
  };

  exportMdPom = (): void => {
    this.#export.download(
      this.#export.toMarkdownPom(this.elements(), this.#meta()),
      this.#filename('pom.md'),
      'text/markdown'
    );
  };

  exportMdTable = (): void => {
    this.#export.download(
      this.#export.toMarkdownTable(this.elements(), this.#meta()),
      this.#filename('reference.md'),
      'text/markdown'
    );
  };

  // ==========================================
  // KEYBOARD: Esc đóng panel
  // ==========================================
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.closePanel();
  }

  // ==========================================
  // HELPERS
  // ==========================================
  #root(): HTMLElement {
    return this.config()?.root ?? document.body;
  }

  #requireSelectors(): ReadonlyArray<string> {
    const extra = this.config()?.extraRequireSelectors ?? [];
    return [...SD_AUTOID_DEFAULT_REQUIRE_SELECTORS, ...extra];
  }

  #highlightMissing(result: SdAutoidAuditResult): void {
    if (!result.missing.length) return;
    const root = this.#root();
    const selector = this.#requireSelectors().join(',');
    const all = Array.from(root.querySelectorAll<HTMLElement>(selector));
    const missingNodes = all.filter(
      n => !n.hasAttribute('data-autoid') && !n.querySelector('[data-autoid]')
    );
    this.#highlight.applyMissing(missingNodes);
  }

  #applyHighlightIfOn(result: SdAutoidAuditResult | null): void {
    if (!this.highlightOn()) return;
    const root = this.#root();
    this.#highlight.apply(root);
    if (result) this.#highlightMissing(result);
  }

  #meta(): SdAutoidExportMeta {
    return {
      pageUrl: window.location.pathname + window.location.search,
      pageTitle: document.title || 'Page',
      timestamp: new Date().toISOString(),
    };
  }

  #filename(ext: string): string {
    const slug = (document.title || 'autoid')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${slug || 'autoid'}-${Date.now()}.${ext}`;
  }

  #flashCopyOk(): void {
    this.copyOk.set(true);
    setTimeout(() => this.copyOk.set(false), 1200);
  }
}
