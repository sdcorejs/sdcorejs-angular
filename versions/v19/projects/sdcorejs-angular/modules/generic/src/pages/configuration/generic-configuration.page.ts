import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdInform } from '@sdcorejs/angular/components/inform';
import { SdTab, SdTabGroup } from '@sdcorejs/angular/components/tab';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { filter } from 'rxjs';
import { GenericConfigurationForm } from '../../components/configuration-form/generic-configuration-form.component';
import { GenericConfigurationGeneral } from '../../components/configuration-general/generic-configuration-general.component';
import { GenericConfigurationImport } from '../../components/configuration-import/generic-configuration-import.component';
import { GenericConfigurationList } from '../../components/configuration-list/generic-configuration-list.component';
import type { SdGenericSchema, SdGenericSchemaIssue } from '../../models';
import type { SdGenericRouteData } from '../../routes/generic-route.guards';
import { SdGenericSchemaService } from '../../services';

/**
 * Configuration screen of one entity. The draft lives here until Save; saving goes only through
 * `SdGenericSchemaService.save` (validate, store, drop the cache) (INV-015).
 */
@Component({
  selector: 'sd-generic-configuration-page',
  templateUrl: './generic-configuration.page.html',
  styleUrl: './generic-configuration.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SdButton,
    SdInform,
    SdPageComponent,
    SdTab,
    SdTabGroup,
    SdTranslatePipe,
    GenericConfigurationGeneral,
    GenericConfigurationList,
    GenericConfigurationForm,
    GenericConfigurationImport,
  ],
})
export class GenericConfigurationPage {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #schemas = inject(SdGenericSchemaService);
  readonly #notify = inject(SdNotifyService);
  readonly #i18n = inject(I18nService);

  /** Resolved entity; replaced when the router reuses this page for another entity. */
  readonly generic = signal(this.#route.snapshot.data['generic'] as SdGenericRouteData | undefined);
  readonly draft = signal<SdGenericSchema | null>(this.#draftOf(this.generic()));
  readonly issues = signal<SdGenericSchemaIssue[]>([]);
  readonly saving = signal(false);
  readonly removed = computed(() => (this.generic()?.resolved?.removed ?? []).join(', '));
  readonly added = computed(() => (this.generic()?.resolved?.added ?? []).join(', '));
  /** Default configuration (backend schema after the entity schema function): what a stored one may only narrow. */
  readonly base = computed(() => this.generic()?.resolved?.base ?? null);
  readonly title = computed(() => {
    const draft = this.draft();
    return draft ? this.#i18n.t('core.module.generic.configuration.title', { label: draft.general.label }) : '';
  });

  constructor() {
    // why: the router keeps this page when only :module / :entity change; the resolver then hands new data.
    this.#router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        const next = this.#route.snapshot.data['generic'] as SdGenericRouteData | undefined;
        if (next === this.generic()) return;
        this.generic.set(next);
        this.draft.set(this.#draftOf(next));
        this.issues.set([]);
      });
  }

  update(next: SdGenericSchema): void {
    this.draft.set(next);
    this.issues.set([]);
  }

  async save(): Promise<void> {
    const draft = this.draft();
    const generic = this.generic();
    if (!draft || !generic || this.saving()) return;
    this.saving.set(true);
    try {
      const issues = await this.#schemas.save(generic.module, generic.entity, draft);
      this.issues.set(issues);
      if (issues.length) {
        this.#notify.error(this.#i18n.t('core.module.generic.configuration.save-blocked'));
        return;
      }
      this.#notify.success(this.#i18n.t('core.module.generic.configuration.saved'));
      await this.back();
    } catch (error) {
      this.#notify.error(error instanceof Error ? error.message : String(error));
    } finally {
      this.saving.set(false);
    }
  }

  back(): Promise<boolean> {
    return this.#router.navigate(['..'], { relativeTo: this.#route });
  }

  #draftOf(generic: SdGenericRouteData | undefined): SdGenericSchema | null {
    return generic?.resolved ? structuredClone(generic.resolved.schema) : null;
  }
}
