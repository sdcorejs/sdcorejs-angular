import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SdCheckbox } from '@sdcorejs/angular/forms/checkbox';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import type { SdGenericEnumOption, SdGenericProperty, SdGenericPropertyValidation, SdGenericRelation, SdGenericSchema } from '../../models';

const DEFAULT_EDITABLE = new Set(['string', 'text', 'number']);

/** "General" tab: display and form settings of each property. `key` and `dataType` stay read-only (AC-020). */
@Component({
  selector: 'sd-generic-configuration-general',
  templateUrl: './generic-configuration-general.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdCheckbox, SdInput, SdTranslatePipe],
})
export class GenericConfigurationGeneral {
  readonly schema = input.required<SdGenericSchema>();
  /** Default configuration: a property its backend locks (`insertable` / `updatable` false) cannot be reopened here. */
  readonly base = input<SdGenericSchema | null>(null);
  readonly schemaChange = output<SdGenericSchema>();

  readonly rows = computed(() => {
    const base = new Map((this.base()?.general.properties ?? []).map(property => [property.key, property]));
    return this.schema().general.properties.map(property => ({
      property,
      insertLocked: base.get(property.key)?.insertable === false,
      updateLocked: base.get(property.key)?.updatable === false,
      defaultEditable: DEFAULT_EDITABLE.has(property.dataType) && !property.multiple,
      defaultText: property.defaultValue === undefined || property.defaultValue === null ? '' : String(property.defaultValue),
      searchFields: property.relation?.searchFields?.join(', ') ?? '',
    }));
  });

  setEntityLabel(label: string): void {
    const schema = this.schema();
    this.schemaChange.emit({ ...schema, general: { ...schema.general, label } });
  }

  setProperty(key: string, patch: Partial<SdGenericProperty>): void {
    const schema = this.schema();
    this.schemaChange.emit({
      ...schema,
      general: {
        ...schema.general,
        properties: schema.general.properties.map(property => (property.key === key ? { ...property, ...patch } : property)),
      },
    });
  }

  setValidation(property: SdGenericProperty, patch: Partial<SdGenericPropertyValidation>): void {
    this.setProperty(property.key, { validation: { ...property.validation, ...patch } });
  }

  setDefault(property: SdGenericProperty, raw: unknown): void {
    const text = raw === undefined || raw === null ? '' : String(raw);
    if (!text) {
      const { defaultValue: _removed, ...rest } = property;
      const schema = this.schema();
      this.schemaChange.emit({
        ...schema,
        general: { ...schema.general, properties: schema.general.properties.map(item => (item.key === property.key ? rest : item)) },
      });
      return;
    }
    const value = property.dataType === 'number' ? Number(text) : text;
    if (property.dataType === 'number' && !Number.isFinite(value)) return;
    this.setProperty(property.key, { defaultValue: value });
  }

  setEnum(property: SdGenericProperty, value: string, patch: Partial<SdGenericEnumOption>): void {
    this.setProperty(property.key, {
      enums: (property.enums ?? []).map(option => (option.value === value ? { ...option, ...patch } : option)),
    });
  }

  setRelation(property: SdGenericProperty, patch: Partial<SdGenericRelation>): void {
    if (!property.relation) return;
    this.setProperty(property.key, { relation: { ...property.relation, ...patch } });
  }

  setSearchFields(property: SdGenericProperty, raw: unknown): void {
    const fields = String(raw ?? '')
      .split(',')
      .map(field => field.trim())
      .filter(Boolean);
    // why: an empty list is stored (not dropped) so that clearing the backend's search fields survives the merge.
    this.setRelation(property, { searchFields: fields });
  }

  text(value: unknown): string {
    return value === undefined || value === null ? '' : String(value);
  }

  flag(value: unknown): boolean {
    return value === true;
  }
}
