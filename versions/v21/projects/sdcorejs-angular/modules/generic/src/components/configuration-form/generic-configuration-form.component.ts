import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdFormBuilder, type SdFormGenericSchema } from '@sdcorejs/angular/components/form-generic';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdSegmentedComponent, type SdSegmentedItem } from '@sdcorejs/angular/forms/segmented';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { sdGenericBuildForm, sdGenericCanInsert, sdGenericCanUpdate, sdGenericFieldType } from '../../core';
import type { SdGenericFormAction, SdGenericProperty, SdGenericSchema } from '../../models';

type JsonRecord = Record<string, unknown>;

const fieldKeys = (form: SdFormGenericSchema): Set<string> => {
  const keys = new Set<string>();
  const visit = (elements: unknown) => {
    for (const element of Array.isArray(elements) ? elements : []) {
      const node = element as JsonRecord;
      if (node['type'] === 'group') visit(node['elements']);
      else if (typeof node['key'] === 'string') keys.add(node['key']);
    }
  };
  for (const page of form.pages ?? []) visit(page.elements);
  return keys;
};

/**
 * "Form" tab: the layout of detail / create / update in sd-form-builder plus a panel of the properties not placed
 * yet (D-023). Adding a property replaces the builder schema, which also clears its undo history and selection.
 */
@Component({
  selector: 'sd-generic-configuration-form',
  templateUrl: './generic-configuration-form.component.html',
  styleUrl: '../generic-configuration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdSection, SdButton, SdCheckbox, SdFormBuilder, SdInput, SdSegmentedComponent, SdTranslatePipe],
})
export class GenericConfigurationForm {
  readonly schema = input.required<SdGenericSchema>();
  readonly schemaChange = output<SdGenericSchema>();

  readonly #i18n = inject(I18nService);
  readonly actions: SdGenericFormAction[] = ['detail', 'create', 'update'];
  readonly action = signal<SdGenericFormAction>('detail');
  /** Choices of the action switcher; sd-segmented exposes them as a radio group with the selected state. */
  readonly actionItems = computed<SdSegmentedItem<SdGenericFormAction>[]>(() =>
    this.actions.map(value => ({ value, label: this.#i18n.t(`core.module.generic.configuration.form.${value}`) }))
  );
  readonly section = computed(() => this.schema()[this.action()]);
  readonly sameAsDetail = computed(() => this.action() !== 'detail' && !this.section()?.form);
  /**
   * Layout shown in the builder: the stored one, or the one the screens would generate today. A rebuilt layout
   * with the same content keeps the previous object, so edits in other tabs do not reload sd-form-builder.
   */
  readonly layout = computed<SdFormGenericSchema>(
    () => {
      const schema = this.schema();
      const action = this.action();
      return schema[action]?.form ?? (action === 'detail' ? undefined : schema.detail?.form) ?? sdGenericBuildForm(schema, action);
    },
    { equal: (previous, next) => previous === next || JSON.stringify(previous) === JSON.stringify(next) }
  );
  readonly missing = computed(() => {
    const placed = fieldKeys(this.layout());
    const action = this.action();
    return this.schema().general.properties.filter(
      property =>
        !placed.has(property.key) &&
        (action === 'create' ? sdGenericCanInsert(property) : action === 'update' ? sdGenericCanUpdate(property) : true)
    );
  });

  selectValue(value: unknown): void {
    const action = this.actions.find(item => item === value);
    if (action) this.select(action);
  }

  select(action: SdGenericFormAction): void {
    this.action.set(action);
  }

  setTitle(raw: unknown): void {
    const title = raw === undefined || raw === null ? '' : String(raw);
    this.#setSection({ title: title || undefined });
  }

  setLayout(form: SdFormGenericSchema | undefined): void {
    if (form) this.#setSection({ form });
  }

  setSameAsDetail(same: unknown): void {
    if (same === true) this.#setSection({ form: undefined });
    else this.#setSection({ form: structuredClone(this.layout()) });
  }

  add(property: SdGenericProperty): void {
    const layout = structuredClone(this.layout());
    const pages = layout.pages.length ? layout.pages : [{ id: 'main', elements: [] }];
    const field = {
      id: `${property.key}-${Date.now().toString(36)}`,
      key: property.key,
      type: sdGenericFieldType(property),
      label: property.label,
    };
    (pages[pages.length - 1].elements as unknown[]).push(field);
    this.#setSection({ form: { ...layout, pages } as SdFormGenericSchema });
  }

  #setSection(patch: { title?: string; form?: SdFormGenericSchema }): void {
    const schema = this.schema();
    const action = this.action();
    const next = { ...schema[action], ...patch };
    if (Object.hasOwn(patch, 'form') && patch.form === undefined) delete next.form;
    this.schemaChange.emit({ ...schema, [action]: next });
  }
}
