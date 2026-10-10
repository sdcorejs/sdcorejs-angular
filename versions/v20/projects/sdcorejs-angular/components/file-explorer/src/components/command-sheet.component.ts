import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, viewChild } from '@angular/core';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import type { SdFileExplorerCommandSheetView, SdFileExplorerSheetCommand, SdFileExplorerSheetGroup } from '../file-explorer.view-model';
import { SdFileExplorerFileIcon } from './file-icon.component';

/** Never the whole viewport: a strip of backdrop stays visible to tap the drawer away. */
const SHEET_WIDTH = 'min(400px, calc(100vw - 56px))';

let nextSheetId = 0;

/** Entry pressed in the drawer, with the group it belongs to. */
export interface SdFileExplorerSheetActivation<T = unknown> {
  readonly command: SdFileExplorerSheetCommand<T>;
  readonly group: SdFileExplorerSheetGroup<T> | null;
}

/**
 * Command drawer of the compact layout (internal): the commands of one item in a Core `<sd-side-drawer>` that covers
 * the viewport — portalled to `<body>`, with its backdrop, `Escape`, close button, focus trap and page scroll lock.
 *
 * The explorer owns the item and decides when the drawer opens and closes: `show()` / `hide()`. The drawer lists the
 * same commands as the desktop buttons, as menu-like entries; a group is a labelled section with its children. A
 * pressed entry is only reported (`activate`): the explorer checks it again, closes the drawer and runs it. `close`
 * reports that the user closed the drawer (close button, `Escape`, backdrop).
 *
 * Content projected into the drawer belongs to this view, so its encapsulated styles still apply in `<body>`; the
 * drawer element itself is styled through the class this component passes as `drawerClass`.
 */
@Component({
  selector: 'sd-file-explorer-command-sheet',
  standalone: true,
  imports: [NgTemplateOutlet, SdIcon, SdSideDrawer, SdFileExplorerFileIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sd-file-explorer-command-sheet',
  },
  template: `
    @let _sheet = sheet();
    @let _autoId = autoId();
    <sd-side-drawer
      [width]="width"
      [title]="_sheet?.title ?? ''"
      [drawerClass]="drawerClass()"
      [autoId]="drawerAutoId()"
      (sdClosed)="onDrawerClosed()">
      @if (_sheet) {
        <div class="sheet" [class.sheet--touch]="touch()" [attr.data-autoid]="_autoId ?? null">
          <p class="context">
            <sd-file-explorer-file-icon [icon]="_sheet.icon" [size]="24" />
            <span class="context-text">{{ _sheet.context }}</span>
          </p>
          <div class="entries">
            @for (entry of _sheet.entries; track entry.key) {
              @if (entry.kind === 'group') {
                @let _labelId = sheetId + '-group-' + entry.key;
                <div
                  class="group"
                  role="group"
                  [attr.aria-labelledby]="entry.loading ? _labelId + ' ' + _labelId + '-busy' : _labelId"
                  [attr.aria-disabled]="entry.disabled ? true : null"
                  [attr.aria-busy]="entry.loading ? true : null">
                  <!-- why: the heading is not a control: text only, so it never repeats the icon of a child (a "Share"
                       group over a "Share" item). The group's icon stays on its desktop trigger; a busy group still
                       shows its spinner and says "in progress". -->
                  <p class="group-label">
                    @if (entry.loading) {
                      <span class="spinner" aria-hidden="true"></span>
                    }
                    <span class="group-title" [id]="_labelId">{{ entry.label }}</span>
                    @if (entry.loading) {
                      <span class="visually-hidden" [id]="_labelId + '-busy'">{{ loadingLabel() }}</span>
                    }
                  </p>
                  @for (child of entry.children; track child.key) {
                    <ng-container
                      [ngTemplateOutlet]="command"
                      [ngTemplateOutletContext]="{
                        $implicit: child,
                        group: entry,
                        autoId: _autoId ? _autoId + '-' + entry.key + '-' + child.key : null,
                      }" />
                  }
                </div>
              } @else {
                <ng-container
                  [ngTemplateOutlet]="command"
                  [ngTemplateOutletContext]="{ $implicit: entry, group: null, autoId: _autoId ? _autoId + '-' + entry.key : null }" />
              }
            }
          </div>
        </div>
      }
    </sd-side-drawer>

    <!-- One entry: neutral label, icons in the declared color (as Core menu items), spinner + hidden text while loading. -->
    <ng-template #command let-command let-group="group" let-entryAutoId="autoId">
      <button
        type="button"
        class="command"
        [disabled]="command.disabled"
        [style.--sd-fe-command-accent]="accent(command.color)"
        [attr.data-autoid]="entryAutoId"
        (click)="activate.emit({ command, group })">
        @if (command.loading) {
          <span class="spinner" aria-hidden="true"></span>
        } @else if (command.prefixIcon) {
          <sd-icon class="command-icon" size="20px" [name]="command.prefixIcon" [fontSet]="command.fontSet" />
        }
        <span class="command-label">{{ command.label }}</span>
        @if (command.suffixIcon && !command.loading) {
          <sd-icon class="command-icon" size="20px" [name]="command.suffixIcon" [fontSet]="command.fontSet" />
        }
        @if (command.loading) {
          <span class="visually-hidden">{{ loadingLabel() }}</span>
        }
      </button>
    </ng-template>
  `,
  styleUrl: './command-sheet.component.scss',
})
export class SdFileExplorerCommandSheet<T = unknown> {
  readonly #i18n = inject(I18nService);

  /** Content for the item whose commands are shown; `null` while nothing is open. */
  readonly sheet = input<SdFileExplorerCommandSheetView<T> | null>(null);
  /** Touch screen: 48 px entries and a 44 px close button. */
  readonly touch = input(false);
  /** E2E scope of the content and its entries. */
  readonly autoId = input<string | undefined>(undefined);
  /** An entry was pressed. Nothing has run yet. */
  readonly activate = output<SdFileExplorerSheetActivation<T>>();
  /** The user closed the drawer (close button, `Escape` or backdrop). */
  readonly close = output<void>();

  // why: query signal, not an ES private field — Angular queries need a TypeScript `private` member.
  private readonly drawer = viewChild.required(SdSideDrawer);

  protected readonly width = SHEET_WIDTH;
  protected readonly sheetId = `sd-file-explorer-commands-${nextSheetId++}`;
  // why: sd-side-drawer renders in <body>, out of reach of this view's encapsulated styles. The explorer-owned class
  // scopes the few rules aimed at the drawer itself (the close button size) to this drawer only.
  protected readonly drawerClass = computed(() => ({
    'sd-file-explorer-command-drawer': true,
    'sd-file-explorer-command-drawer--touch': this.touch(),
  }));
  // why: sd-side-drawer adds its own `components-side-drawer-` prefix; drop the explorer's `components-` to avoid a repeat.
  protected readonly drawerAutoId = computed(() => this.autoId()?.replace(/^components-/, ''));
  protected readonly loadingLabel = computed(() => this.#i18n.t('core.component.file-explorer.action-loading'));

  /** Opens the drawer; its content follows `sheet`. */
  show(): void {
    this.drawer().open();
  }

  /** Closes the drawer at once — focus trap, backdrop and page scroll lock included — without reporting `close`. */
  hide(): void {
    const drawer = this.drawer();
    if (drawer.isOpened()) drawer.forceClose();
  }

  protected accent(color: string | undefined): string | null {
    return color ? `var(--sd-${color})` : null;
  }

  protected onDrawerClosed(): void {
    // Closed by the explorer (it has already let go of the item) or by the user: the explorer tells them apart.
    if (this.sheet()) this.close.emit();
  }
}
