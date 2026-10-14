import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  forwardRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdInform } from '@sdcorejs/angular/components/inform';
import { SdTable, type SdTableCommand, type SdTableOption } from '@sdcorejs/angular/components/table';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { map } from 'rxjs';
import { GenericImportDialog } from '../../components/import-dialog/generic-import-dialog.component';
import { sdGenericExternalFilters, sdGenericPageSize, sdGenericPrimaryKey, sdGenericRenderTitle, sdGenericTableColumns } from '../../core';
import type {
  SdGenericActionContext,
  SdGenericCustomAction,
  SdGenericDefaultAction,
  SdGenericDisplay,
  SdGenericFormAction,
  SdGenericRecord,
  SdGenericSchema,
} from '../../models';
import { SD_GENERIC_LIST_HOST, SD_GENERIC_SCOPE, type SdGenericListHost } from '../../registry';
import type { SdGenericRouteData } from '../../routes/generic-route.guards';
import { SdGenericDataService, SdGenericPermissionService } from '../../services';

type SelectorAction = NonNullable<NonNullable<SdTableOption<SdGenericRecord>['selector']>['actions']>[number];

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * List of one entity: sd-table driven by the effective schema, built-in and custom actions, and an outlet for
 * create / detail / update. The page stays mounted while a side drawer is open, so sd-table keeps its filters.
 */
@Component({
  selector: 'sd-generic-list-page',
  templateUrl: './generic-list.page.html',
  styleUrl: './generic-list.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SdButton, SdInform, SdPageComponent, SdTable, SdTranslatePipe, GenericImportDialog],
  providers: [{ provide: SD_GENERIC_LIST_HOST, useExisting: forwardRef(() => GenericListPage) }],
})
export class GenericListPage implements SdGenericListHost {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #data = inject(SdGenericDataService);
  readonly #permission = inject(SdGenericPermissionService);
  readonly #scope = inject(SD_GENERIC_SCOPE);
  readonly #confirm = inject(SdConfirmService);
  readonly #notify = inject(SdNotifyService);
  readonly #i18n = inject(I18nService);

  readonly generic = toSignal(this.#route.data.pipe(map(data => data['generic'] as SdGenericRouteData | undefined)), {
    initialValue: this.#route.snapshot.data['generic'] as SdGenericRouteData | undefined,
  });
  readonly schema = computed(() => this.generic()?.resolved?.schema ?? null);
  readonly error = computed(() => this.generic()?.error ?? null);
  readonly #entityConfig = computed(() => {
    const generic = this.generic();
    return generic ? this.#scope.entity(generic.module, generic.entity) : undefined;
  });
  readonly #hidden = computed(() => new Set<SdGenericDefaultAction>(this.#entityConfig()?.hiddenDefaults ?? []));
  readonly title = computed(() => {
    const schema = this.schema();
    if (!schema) return this.generic()?.entity ?? '';
    return schema.list?.title
      ? sdGenericRenderTitle(schema.list.title)
      : this.#i18n.t('core.module.generic.title.list', { label: schema.general.label });
  });
  readonly canCreate = computed(() => this.#allowed('create', 'create'));
  readonly canImport = computed(() => this.#allowed('import', 'import'));
  readonly canConfigure = computed(() => {
    const generic = this.generic();
    return !!generic && this.#permission.can(generic.module, generic.entity, 'configuration');
  });
  /** Shown only to users who can fix the configuration (AC-007). */
  readonly showInvalidBanner = computed(() => !!this.generic()?.resolved?.invalid && this.canConfigure());
  readonly listActions = computed(() => {
    const schema = this.schema();
    return schema ? this.#visibleActions(this.#entityConfig()?.listActions, { schema, reload: () => this.reload() }) : [];
  });
  /** A form shown as a full page takes the place of the list; the list stays mounted (filters, sort, page). */
  readonly pageChildActive = signal(false);
  readonly tableOption = computed(() => {
    const schema = this.schema();
    return schema ? this.#tableOption(schema) : null;
  });
  readonly table = viewChild(SdTable);
  readonly importDialog = viewChild(GenericImportDialog);
  readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  readonly #injector = inject(Injector);

  reload(): void {
    void this.table()?.reload(true, false);
  }

  setFormDisplay(display: SdGenericDisplay): void {
    this.pageChildActive.set(display === 'page');
  }

  onDeactivate(): void {
    this.pageChildActive.set(false);
    // why: the closed form held the focus; hand it to the list heading instead of losing it to <body>.
    afterNextRender(() => this.heading()?.nativeElement.focus(), { injector: this.#injector });
  }

  create(): void {
    void this.#router.navigate(['create'], { relativeTo: this.#route });
  }

  openImport(): void {
    this.importDialog()?.open();
  }

  openConfiguration(): void {
    void this.#router.navigate(['configuration'], { relativeTo: this.#route });
  }

  async runAction(action: SdGenericCustomAction, context: Omit<SdGenericActionContext, 'schema' | 'reload'> = {}): Promise<void> {
    const schema = this.schema();
    if (!schema) return;
    try {
      await action.run({ ...context, schema, reload: () => this.reload() });
    } catch (error) {
      this.#notify.error(message(error));
    }
  }

  #allowed(action: 'create' | 'import' | 'detail' | 'update' | 'delete', hidden: SdGenericDefaultAction): boolean {
    const generic = this.generic();
    return !!generic && !this.#hidden().has(hidden) && this.#permission.can(generic.module, generic.entity, action);
  }

  #visibleActions(actions: SdGenericCustomAction[] | undefined, context: SdGenericActionContext): SdGenericCustomAction[] {
    return (actions ?? []).filter(action => this.#permission.canCode(action.permission) && (action.visible?.(context) ?? true));
  }

  #open(row: SdGenericRecord, schema: SdGenericSchema, action: SdGenericFormAction): void {
    void this.#router.navigate([String(row[sdGenericPrimaryKey(schema)]), action], { relativeTo: this.#route });
  }

  async #delete(schema: SdGenericSchema, rows: SdGenericRecord[]): Promise<void> {
    const confirmMessage =
      rows.length === 1
        ? this.#i18n.t('core.module.generic.delete.confirm')
        : this.#i18n.t('core.module.generic.delete.confirm-many', { count: rows.length });
    try {
      await this.#confirm.confirm(confirmMessage, { title: this.#i18n.t('core.module.generic.delete.title'), yesButtonColor: 'error' });
    } catch {
      return;
    }
    const primaryKey = sdGenericPrimaryKey(schema);
    const failures: string[] = [];
    // why: one request at a time, so a backend never receives a burst of deletes (R-012).
    for (const row of rows) {
      try {
        await this.#data.delete(schema.module, schema.entity, String(row[primaryKey]));
      } catch (error) {
        failures.push(message(error));
      }
    }
    if (failures.length) this.#notify.error(failures);
    else this.#notify.success(this.#i18n.t('core.module.generic.delete.success'));
    this.reload();
  }

  #tableOption(schema: SdGenericSchema): SdTableOption<SdGenericRecord> {
    const deps = this.#data.columnDeps(schema);
    const t = (key: string) => this.#i18n.t(`core.module.generic.action.${key}`);
    const context = (row?: SdGenericRecord, rows?: SdGenericRecord[]): SdGenericActionContext => ({
      schema,
      row,
      rows,
      reload: () => this.reload(),
    });
    // why: a row opens its detail through a link on its first column (update when detail is not allowed); edit
    // lives in the detail screen and delete in the selector, so built-in row commands would only repeat them.
    const target: SdGenericFormAction | null = this.#allowed('detail', 'detail')
      ? 'detail'
      : this.#allowed('update', 'update')
        ? 'update'
        : null;
    const commands: SdTableCommand<SdGenericRecord>[] = [];
    for (const action of (this.#entityConfig()?.rowCommands ?? []).filter(item => this.#permission.canCode(item.permission))) {
      commands.push({
        icon: action.icon ?? 'more_horiz',
        title: action.label,
        hidden: row => !(action.visible?.(context(row)) ?? true),
        click: row => void this.runAction(action, { row }),
      });
    }
    const bulk: SelectorAction[] = [];
    if (this.#allowed('delete', 'delete'))
      bulk.push({
        icon: 'delete',
        color: 'error',
        title: t('delete'),
        click: (rows?: SdGenericRecord[]) => void this.#delete(schema, rows ?? []),
      });
    for (const action of this.#visibleActions(this.#entityConfig()?.bulkActions, context(undefined, []))) {
      bulk.push({
        icon: action.icon,
        title: action.label,
        click: (rows?: SdGenericRecord[]) => void this.runAction(action, { rows: rows ?? [] }),
      });
    }
    return {
      type: 'server',
      key: `sd-generic.${schema.module}.${schema.entity}`,
      rowKey: sdGenericPrimaryKey(schema),
      columns: sdGenericTableColumns(schema, deps, target ? row => this.#open(row, schema, target) : undefined),
      filter: { externalFilters: sdGenericExternalFilters(schema, deps), hideExternalFilterToolbar: true },
      paginate: { pageSize: sdGenericPageSize(schema) },
      ...(schema.list?.export && !this.#hidden().has('export')
        ? { export: { visible: 'EXCEL' as const, fileName: `${schema.module}-${schema.entity}` } }
        : {}),
      ...(bulk.length ? { selector: { visible: true, actions: bulk } } : {}),
      commands,
      items: async (_filterRequest, pagingReq) => {
        const orders = pagingReq.orders?.length ? pagingReq.orders : (schema.list?.orders ?? []);
        const page = await this.#data.query(schema.module, schema.entity, { ...pagingReq, orders });
        return { items: page.items, total: page.total };
      },
    };
  }
}
