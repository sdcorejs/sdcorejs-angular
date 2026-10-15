import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdFormRender } from '@sdcorejs/angular/components/form-generic';
import { SdInform } from '@sdcorejs/angular/components/inform';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { filter } from 'rxjs';
import { sdGenericBuildForm, sdGenericRenderTitle } from '../../core';
import type { SdGenericActionContext, SdGenericCustomAction, SdGenericDisplay, SdGenericFormAction, SdGenericRecord } from '../../models';
import { SD_GENERIC_LIST_HOST, SD_GENERIC_SCOPE } from '../../registry';
import { sdGenericRouteParams, type SdGenericRouteData } from '../../routes/generic-route.guards';
import { SdGenericDataService, SdGenericPermissionService } from '../../services';

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** Route state of the form: the resolved entity of the list route and the record id. */
interface FormRouteState {
  generic: SdGenericRouteData | undefined;
  id: string | null;
}

/**
 * Create / detail / update of one record. The display mode is decided once the schema is resolved
 * (entity `display` -> adapter `display` -> `'page'`); a side drawer opens over the list kept behind it (INV-009).
 */
@Component({
  selector: 'sd-generic-form-host',
  templateUrl: './generic-form-host.page.html',
  styleUrl: './generic-form-host.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, SdButton, SdFormRender, SdInform, SdPageComponent, SdSideDrawer, SdTranslatePipe],
})
export class GenericFormHostPage {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #data = inject(SdGenericDataService);
  readonly #permission = inject(SdGenericPermissionService);
  readonly #scope = inject(SD_GENERIC_SCOPE);
  readonly #notify = inject(SdNotifyService);
  readonly #i18n = inject(I18nService);
  readonly #list = inject(SD_GENERIC_LIST_HOST, { optional: true });

  readonly action = signal(this.#route.snapshot.data['sdGenericAction'] as SdGenericFormAction);
  /** Replaced when the router reuses this page for another record or entity (same route, other params). */
  readonly #state = signal<FormRouteState>(this.#readRoute());
  readonly schema = computed(() => this.#state().generic?.resolved?.schema ?? null);
  readonly display = computed<SdGenericDisplay>(() => {
    const schema = this.schema();
    if (!schema) return 'page';
    const args = { schema, action: this.action() };
    return (
      this.#scope.entity(schema.module, schema.entity)?.display?.(args) ?? this.#scope.adapter(schema.module)?.display?.(args) ?? 'page'
    );
  });
  readonly formSchema = computed(() => {
    const schema = this.schema();
    return schema ? sdGenericBuildForm(schema, this.action()) : null;
  });
  readonly viewed = computed(() => this.action() === 'detail');
  readonly value = signal<Record<string, unknown>>({});
  readonly record = signal<SdGenericRecord | null>(null);
  readonly loading = signal(false);
  /** Message of a failed record load; the screen shows it in place of the form. */
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  /** An update saves only over a loaded record; saving the empty form of a failed load would blank its fields. */
  readonly canSave = computed(() => this.action() === 'create' || this.record() !== null);
  readonly form = new FormGroup({});
  readonly title = computed(() => {
    const schema = this.schema();
    if (!schema) return '';
    const template = schema[this.action()]?.title;
    // why: rendered as text with interpolation, never as HTML (INV-006).
    return template
      ? sdGenericRenderTitle(template, this.record())
      : this.#i18n.t(`core.module.generic.title.${this.action()}`, { label: schema.general.label });
  });
  readonly canEdit = computed(() => {
    const schema = this.schema();
    return !!schema && this.action() === 'detail' && this.#permission.allows(schema.module, schema.entity, 'update');
  });
  readonly detailActions = computed(() => {
    const schema = this.schema();
    const record = this.record();
    if (!schema || this.action() !== 'detail' || !record) return [];
    const context = this.#context(record);
    return (this.#scope.entity(schema.module, schema.entity)?.detailActions ?? []).filter(
      action => this.#permission.canCode(action.permission) && (action.visible?.(context) ?? true)
    );
  });
  readonly drawer = viewChild(SdSideDrawer);
  readonly renderer = viewChild(SdFormRender);
  readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  #closing = false;

  constructor() {
    if (this.action() !== 'create') void this.#load();
    effect(() => {
      const drawer = this.drawer();
      if (drawer) untracked(() => drawer.open());
    });
    effect(() => {
      const display = this.display();
      untracked(() => this.#list?.setFormDisplay(display));
    });
    // why: a page form replaces the list the user came from; move the focus to its heading (the drawer traps its own).
    afterNextRender(() => {
      if (this.display() === 'page') this.heading()?.nativeElement.focus();
    });
    this.#router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.#onNavigated());
  }

  async save(): Promise<void> {
    const schema = this.schema();
    if (!schema || this.action() === 'detail' || this.saving() || !this.canSave()) return;
    const validation = await this.renderer()?.validate();
    if (validation && !validation.valid) return;
    this.saving.set(true);
    try {
      await this.#data.save(schema, this.action() === 'create' ? 'create' : 'update', this.value(), this.#state().id ?? undefined);
      this.#notify.success(this.#i18n.t('core.module.generic.save.success'));
      this.#list?.reload();
      await this.close();
    } catch (error) {
      this.#notify.error(message(error));
    } finally {
      this.saving.set(false);
    }
  }

  edit(): void {
    void this.#router.navigate(['..', 'update'], { relativeTo: this.#route });
  }

  async runAction(action: SdGenericCustomAction): Promise<void> {
    const record = this.record();
    if (!record) return;
    try {
      await action.run(this.#context(record));
    } catch (error) {
      this.#notify.error(message(error));
    }
  }

  /** Back to the list route. A cancelled navigation (e.g. a guard) leaves Cancel and the drawer close usable. */
  async close(): Promise<void> {
    if (this.#closing) return;
    this.#closing = true;
    // why: navigating relative to the list route keeps its URL encoding instead of re-joining decoded segments.
    const closed = await this.#router.navigate(['.'], { relativeTo: this.#route.parent });
    if (!closed) this.#closing = false;
  }

  onDrawerClosed(): void {
    void this.close();
  }

  #readRoute(): FormRouteState {
    return {
      generic: this.#route.parent?.snapshot.data['generic'] as SdGenericRouteData | undefined,
      id: sdGenericRouteParams(this.#route.snapshot).id,
    };
  }

  /** The router keeps this page when only `:id` or the parent entity changes; start over for the new record. */
  #onNavigated(): void {
    const next = this.#readRoute();
    const current = this.#state();
    if (next.generic === current.generic && next.id === current.id) return;
    this.#state.set(next);
    this.record.set(null);
    this.loadError.set(null);
    this.value.set({});
    this.#closing = false;
    if (this.action() !== 'create') void this.#load();
  }

  async #load(): Promise<void> {
    const schema = this.schema();
    const { id } = this.#state();
    if (!schema || id === null) return;
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const record = await this.#data.detail(schema.module, schema.entity, id);
      // why: a slow answer for a record the user already left must not overwrite the current one.
      if (this.#state().id !== id) return;
      this.record.set(record);
      this.value.set(this.#data.toFormValue(schema, record));
    } catch (error) {
      if (this.#state().id === id) this.loadError.set(message(error));
    } finally {
      if (this.#state().id === id) this.loading.set(false);
    }
  }

  #context(record: SdGenericRecord): SdGenericActionContext {
    return {
      schema: this.schema()!,
      row: record,
      reload: () => {
        this.#list?.reload();
        void this.#load();
      },
    };
  }
}
