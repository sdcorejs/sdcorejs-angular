import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { TableExportService } from '../../services/table-export/table-export.service';
import type { SdTable } from '../../table.component';
import type { SdTableMobileAction } from '../mobile-cards/mobile-action.model';
import { SdTableSheetHistory, sdTableSheetSwipe } from '../mobile-sheet/mobile-sheet';

type ToolTone = 'success' | 'info' | 'primary' | 'secondary';

interface Tool {
  action: SdTableMobileAction;
  title: string;
  hint: string;
  icon: string;
  tone: ToolTone;
  /** Short note next to the title, e.g. "Customized" while the table uses a setup of its own. */
  badge?: string;
}

let nextToolsId = 0;

/**
 * Tools sheet of the phone (⋮, handoff table-mobile 2): the exports as tiles (format, file kind, progress while one runs)
 * and the table settings as a row that says when the table uses a setup of its own. Same chrome as the other phone
 * sheets: handle, title, swipe down and Back close it. An export keeps the sheet open until it is done.
 */
@Component({
  selector: 'sd-table-mobile-tools-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, SdModal, SdIcon, SdTranslatePipe],
  templateUrl: './mobile-tools-sheet.component.html',
  styleUrl: './mobile-tools-sheet.component.scss',
})
export class SdTableMobileToolsSheetComponent<T = unknown> {
  readonly table = input.required<SdTable<T>>();
  /** `SdTable.mobileToolsActions`. */
  readonly actions = input.required<SdTableMobileAction[]>();
  readonly sheet = viewChild.required<SdModal>('sheet');
  protected readonly head = viewChild<ElementRef<HTMLElement>>('head');
  protected readonly ids = { export: `sd-table-tools-export-${nextToolsId}`, table: `sd-table-tools-table-${nextToolsId++}` };
  readonly #i18n = inject(I18nService);
  readonly #export = inject(TableExportService);
  readonly #history = new SdTableSheetHistory(inject(DOCUMENT).defaultView, inject(ElementRef).nativeElement);
  /** Key of the export started from this sheet, until it is done. */
  readonly running = signal<string | undefined>(undefined);
  readonly exporting = this.#export.exporting;
  /** A tool to run once the sheet has closed (settings open their own dialog). */
  #pending?: SdTableMobileAction;

  readonly tools = computed<Tool[]>(() => {
    const t = (key: string) => this.#i18n.t(key);
    const custom = this.table().hasCustomSetup();
    return this.actions().map(action => {
      switch (action.key) {
        case 'tool-export-excel':
          return { action, title: 'Excel', hint: t('core.component.table.mobile.export-excel-hint'), icon: 'table_view', tone: 'success' };
        case 'tool-export-csv':
          return { action, title: 'CSV', hint: t('core.component.table.mobile.export-csv-hint'), icon: 'description', tone: 'info' };
        case 'tool-export':
          return {
            action,
            title: t('core.component.table.export'),
            hint: t('core.component.table.mobile.export-custom-hint'),
            icon: 'download',
            tone: 'primary',
          };
        case 'tool-config':
          return {
            action,
            title: t('core.component.table.setup'),
            hint: t('core.component.table.mobile.config-hint'),
            icon: 'tune',
            tone: 'secondary',
            badge: custom ? t('core.component.table.mobile.config-custom') : undefined,
          };
        default:
          return { action, title: action.title, hint: '', icon: action.icon || 'chevron_right', tone: 'secondary' };
      }
    });
  });
  readonly exportTools = computed(() => this.tools().filter(tool => tool.action.key.startsWith('tool-export')));
  readonly tableTools = computed(() => this.tools().filter(tool => !tool.action.key.startsWith('tool-export')));
  /** Hint of the running export: the percent of a paged export, else "Exporting…". */
  readonly progress = computed(() => {
    const percent = this.#export.exportPercent();
    return percent === null
      ? this.#i18n.t('core.component.table.mobile.exporting')
      : this.#i18n.t('core.component.table.exporting', { percent });
  });

  constructor() {
    effect(onCleanup => {
      const head = this.head()?.nativeElement;
      if (head) onCleanup(sdTableSheetSwipe(head, () => this.sheet().close()));
    });
    // An export started here closes the sheet when it is done.
    effect(() => {
      if (this.exporting() || !untracked(this.running)) return;
      untracked(() => {
        this.running.set(undefined);
        this.sheet().close();
      });
    });
    inject(DestroyRef).onDestroy(() => this.#history.dispose());
  }

  open(): void {
    this.sheet().open();
    // why: Back closes the sheet instead of leaving the page.
    this.#history.push(() => this.sheet().forceClose());
  }

  run(tool: Tool): void {
    const action = tool.action;
    if (this.exporting() || action.disabled || !action.run) return;
    // why: finish closing before another dialog takes focus and overlay ownership.
    if (action.closeBeforeRun) {
      this.#pending = action;
      this.sheet().close();
      return;
    }
    try {
      action.run();
    } catch (error) {
      console.error(error);
    }
    if (this.exporting()) this.running.set(action.key);
    else this.sheet().close();
  }

  /** Every close path ends here: drop the history entry, then run a tool that waited for the close. */
  onClosed(): void {
    this.#history.release();
    const pending = this.#pending;
    this.#pending = undefined;
    pending?.run?.();
  }
}
