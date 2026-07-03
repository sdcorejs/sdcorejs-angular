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
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ActivatedRouteSnapshot, Router } from '@angular/router';

import { AutoidElement, AutoidAuditResult } from './models/autoid-element.model';
import {
  SdAutoidInspectorConfiguration,
  AUTOID_DEFAULT_REQUIRE_SELECTORS,
  SD_AUTOID_INSPECTOR_CONFIGURATION,
} from './models/autoid-inspector-config.model';
import { AutoidE2eTarget, AutoidExportJson, AutoidExportMeta, AutoidRobotExportContext } from './models/autoid-export-format.model';
import { SdAutoidScannerService } from './services/autoid-scanner.service';
import { SdAutoidAuditService } from './services/autoid-audit.service';
import { SdAutoidHighlightService } from './services/autoid-highlight.service';
import { SdAutoidExportService } from './services/autoid-export.service';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

type Segment = 'audit' | 'elements' | 'export';
type RobotContextField = keyof AutoidRobotExportContext;

@Component({
  selector: 'sd-autoid-inspector',
  templateUrl: './autoid-inspector.component.html',
  styleUrl: './autoid-inspector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SdIcon, CommonModule, FormsModule, MatTooltipModule],
})
export class SdAutoidInspector implements OnDestroy {
  readonly #injectedConfig = inject<SdAutoidInspectorConfiguration | null>(SD_AUTOID_INSPECTOR_CONFIGURATION, { optional: true });

  // ==========================================
  // INPUTS
  // ==========================================
  enabled = input(true, { transform: booleanAttribute });
  config = input<SdAutoidInspectorConfiguration | undefined>(undefined);

  // ==========================================
  // STATE
  // ==========================================
  open = signal(false);
  segment = signal<Segment>('audit');
  filter = signal('');
  elements = signal<AutoidElement[]>([]);
  audit = signal<AutoidAuditResult | null>(null);
  copyOk = signal(false);
  e2eExporting = signal<AutoidE2eTarget | null>(null);
  e2eExportOk = signal<string | null>(null);
  e2eExportError = signal<string | null>(null);
  robotContextOpen = signal(false);
  robotExportContext = signal<AutoidRobotExportContext>({});
  // Default true để mở panel lần đầu là có highlight ngay. Đóng panel KHÔNG
  // tự tắt — user toggle qua nút trong tab Audit khi muốn nhìn DOM gốc.
  highlightOn = signal(true);
  // Ẩn tạm FAB — chỉ in-memory, reload trang sẽ hiện lại (theo thiết kế).
  dismissed = signal(false);

  readonly e2eGeneratorHost = computed(() => this.#normalizeHost(this.#effectiveConfig().host));
  readonly hasRobotExportContext = computed(() => Object.values(this.robotExportContext()).some(value => Boolean(value?.trim())));

  filteredElements = computed(() => {
    const q = this.filter().trim().toLowerCase();
    if (!q) return this.elements();
    return this.elements().filter(
      el => el.autoid.toLowerCase().includes(q) || el.name.toLowerCase().includes(q) || el.tag.toLowerCase().includes(q)
    );
  });

  /**
   * Elements not inside any sd-table — rendered in the main "Top-level" section.
   */
  readonly topLevelElements = computed(() => this.filteredElements().filter(el => !el.tableScope));

  /**
   * Map of `sd-table` autoid → its inner autoid elements. Tables themselves
   * stay in `topLevelElements` (the table's own autoid is top-level).
   */
  readonly tableGroups = computed(() => {
    const groups = new Map<string, AutoidElement[]>();
    for (const el of this.filteredElements()) {
      if (!el.tableScope) continue;
      if (!groups.has(el.tableScope)) groups.set(el.tableScope, []);
      groups.get(el.tableScope)!.push(el);
    }
    // Return a sorted array for stable rendering.
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([scope, items]) => ({ scope, items }));
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
  // Optional — chỉ có khi app dùng RouterModule; dùng để lấy route params cho meta.
  #router = inject(Router, { optional: true });

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
    const elements = this.#scanner.scan(root, this.#requireSelectors());
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
    await this.#export.copyToClipboard(this.#export.toJson(this.elements(), this.#meta()));
    this.#flashCopyOk();
  };

  copyXpath = async (autoid: string): Promise<void> => {
    await this.#export.copyToClipboard(`//*[@data-autoid="${autoid}"]`);
    this.#flashCopyOk();
  };

  exportCsv = (): void => {
    this.#export.download(this.#export.toCsv(this.elements()), this.#filename('csv'), 'text/csv;charset=utf-8');
  };

  exportJson = (): void => {
    this.#export.download(this.#export.toJson(this.elements(), this.#meta()), this.#filename('json'), 'application/json');
  };

  exportMdPom = (): void => {
    this.#export.download(this.#export.toMarkdownPom(this.elements(), this.#meta()), this.#filename('pom.md'), 'text/markdown');
  };

  exportMdTable = (): void => {
    this.#export.download(this.#export.toMarkdownTable(this.elements(), this.#meta()), this.#filename('reference.md'), 'text/markdown');
  };

  openRobotExportContext = (): void => {
    if (this.e2eExporting()) return;
    this.e2eExportOk.set(null);
    this.e2eExportError.set(null);
    this.robotContextOpen.set(true);
  };

  closeRobotExportContext = (): void => {
    if (this.e2eExporting()) return;
    this.robotContextOpen.set(false);
  };

  updateRobotExportContext = (field: RobotContextField, value: string): void => {
    this.robotExportContext.update(context => ({
      ...context,
      [field]: value,
    }));
  };

  confirmRobotExport = async (): Promise<void> => {
    const context = this.#cleanRobotExportContext();
    if (!context) return;
    const exported = await this.exportE2eTest('robot', context);
    if (exported) this.robotContextOpen.set(false);
  };

  exportE2eTest = async (target: AutoidE2eTarget, context?: AutoidRobotExportContext): Promise<boolean> => {
    const host = this.e2eGeneratorHost();
    if (!host || this.e2eExporting()) return false;

    this.e2eExporting.set(target);
    this.e2eExportOk.set(null);
    this.e2eExportError.set(null);

    try {
      this.refresh();
      const response = await fetch(this.#e2eEndpoint(host, target), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.#testGenerationRequest(target, context)),
      });

      if (!response.ok) {
        throw new Error(await this.#responseErrorMessage(response));
      }

      const blob = await response.blob();
      this.#export.downloadBlob(blob, this.#zipFilename(response, target));
      this.#flashE2eExportOk(this.#targetLabel(target));
      return true;
    } catch (err) {
      this.e2eExportError.set(this.#toErrorMessage(err));
      return false;
    } finally {
      this.e2eExporting.set(null);
    }
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
    return this.#effectiveConfig().root ?? document.body;
  }

  #requireSelectors(): readonly string[] {
    const extra = this.#effectiveConfig().extraRequireSelectors ?? [];
    return [...new Set([...AUTOID_DEFAULT_REQUIRE_SELECTORS, ...extra])];
  }

  #effectiveConfig(): SdAutoidInspectorConfiguration {
    const injected = this.#injectedConfig ?? {};
    const local = this.config() ?? {};
    return {
      ...injected,
      ...local,
      extraRequireSelectors: [...(injected.extraRequireSelectors ?? []), ...(local.extraRequireSelectors ?? [])],
    };
  }

  #highlightMissing(result: AutoidAuditResult): void {
    if (!result.missing.length) return;
    const root = this.#root();
    const selector = this.#requireSelectors().join(',');
    const all = Array.from(root.querySelectorAll<HTMLElement>(selector));
    const missingNodes = all.filter(n => !n.hasAttribute('data-autoid') && !n.querySelector('[data-autoid]'));
    this.#highlight.applyMissing(missingNodes);
  }

  #applyHighlightIfOn(result: AutoidAuditResult | null): void {
    if (!this.highlightOn()) return;
    const root = this.#root();
    this.#highlight.apply(root);
    if (result) this.#highlightMissing(result);
  }

  #meta(): AutoidExportMeta {
    const loc = window.location;
    return {
      pageUrl: loc.pathname + loc.search,
      pageTitle: document.title || 'Page',
      timestamp: new Date().toISOString(),
      url: loc.href,
      pathname: loc.pathname,
      search: loc.search,
      queryParams: this.#export.parseQueryParams(loc.search),
      params: this.#routeParams(),
    };
  }

  /**
   * Route path params gộp dọc cây ActivatedRoute (nếu có Router). Trả về undefined khi
   * không có Router hoặc không có param nào — để `meta.params` được bỏ qua khỏi JSON.
   */
  #routeParams(): Record<string, string> | undefined {
    if (!this.#router) return undefined;
    const params: Record<string, string> = {};
    let route: ActivatedRouteSnapshot | null = this.#router.routerState.snapshot.root;
    while (route) {
      Object.assign(params, route.params);
      route = route.firstChild;
    }
    return Object.keys(params).length ? params : undefined;
  }

  #filename(ext: string): string {
    const slug = (document.title || 'autoid')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${slug || 'autoid'}-${Date.now()}.${ext}`;
  }

  #normalizeHost(host: string | undefined): string | undefined {
    const trimmed = host?.trim();
    if (!trimmed) return undefined;
    return trimmed.replace(/\/+$/g, '');
  }

  #e2eEndpoint(host: string, target: AutoidE2eTarget): string {
    const endpoint = target === 'playwright' ? 'playwright' : 'robot';
    return `${host}/e2e/test-generator/${endpoint}`;
  }

  #testGenerationRequest(
    target: AutoidE2eTarget,
    context?: AutoidRobotExportContext
  ): {
    payload: AutoidExportJson;
    options: {
      language: 'vi';
      mode: 'happy-path';
      outputName: string;
      testName: string;
      baseUrl?: string;
    };
    prompt?: string;
    context?: AutoidRobotExportContext;
  } {
    const baseUrl = this.#baseUrl();
    const options = {
      language: 'vi' as const,
      mode: 'happy-path' as const,
      outputName: this.#outputBaseName(target),
      testName: `${document.title || 'AutoId'} ${this.#targetLabel(target)}`,
      ...(baseUrl ? { baseUrl } : {}),
    };

    return {
      payload: {
        meta: this.#meta(),
        elements: this.elements(),
      },
      options,
      ...(context
        ? {
            prompt: 'Sinh Robot Framework E2E test bám theo ngữ cảnh QC, testcase, test data và requirement được cung cấp.',
            context,
          }
        : {}),
    };
  }

  #cleanRobotExportContext(): AutoidRobotExportContext | undefined {
    const context = this.robotExportContext();
    const cleaned: AutoidRobotExportContext = {};

    for (const [key, value] of Object.entries(context) as [RobotContextField, string | undefined][]) {
      const trimmed = value?.trim();
      if (trimmed) cleaned[key] = trimmed;
    }

    return Object.keys(cleaned).length ? cleaned : undefined;
  }

  #baseUrl(): string | undefined {
    const origin = window.location.origin;
    return /^https?:\/\//.test(origin) ? origin : undefined;
  }

  #outputBaseName(target: AutoidE2eTarget): string {
    const slug = (document.title || 'autoid')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `${slug || 'autoid'}-${target === 'playwright' ? 'playwright' : 'robot-framework'}`;
  }

  #targetLabel(target: AutoidE2eTarget): string {
    return target === 'playwright' ? 'Playwright' : 'Robot Framework';
  }

  #zipFilename(response: Response, target: AutoidE2eTarget): string {
    const header = response.headers.get('Content-Disposition') ?? '';
    const filenameStar = /filename\*=UTF-8''([^;]+)/i.exec(header)?.[1];
    if (filenameStar) return this.#decodeFilename(filenameStar.replace(/^"|"$/g, ''));

    const filename = /filename="?([^";]+)"?/i.exec(header)?.[1];
    return filename?.trim() || this.#filename(`e2e-${target}.zip`);
  }

  #decodeFilename(value: string): string {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  async #responseErrorMessage(response: Response): Promise<string> {
    const fallback = `Không sinh được E2E test (HTTP ${response.status}).`;
    const text = await response.text().catch(() => '');
    if (!text) return fallback;

    try {
      const parsed = JSON.parse(text) as { message?: unknown; error?: unknown };
      const message = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message;
      if (typeof message === 'string' && message.trim()) return message;
      if (typeof parsed.error === 'string' && parsed.error.trim()) return parsed.error;
    } catch {
      return text.slice(0, 180);
    }

    return fallback;
  }

  #toErrorMessage(err: unknown): string {
    if (err instanceof Error && err.message) return err.message;
    return 'Không sinh được E2E test.';
  }

  #flashCopyOk(): void {
    this.copyOk.set(true);
    setTimeout(() => this.copyOk.set(false), 1200);
  }

  #flashE2eExportOk(label: string): void {
    this.e2eExportOk.set(label);
    setTimeout(() => {
      if (this.e2eExportOk() === label) this.e2eExportOk.set(null);
    }, 1800);
  }
}
