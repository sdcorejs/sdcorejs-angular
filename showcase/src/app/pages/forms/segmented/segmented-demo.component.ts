import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  SdSegmentedComponent,
  SdSegmentedItem,
  SdSegmentedItemTemplateDirective,
  SdSegmentedModel,
  SdSegmentedType,
} from '@sdcorejs/angular/forms/segmented';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

type Mode = 'design' | 'preview' | 'schema';
@Component({
  selector: 'app-segmented-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdSegmentedComponent, SdSegmentedItemTemplateDirective],
  template: `
    <demo-page
      #demoPage
      title="Segmented control"
      description="Compact single or multiple choices. The application owns the content shown for the chosen value.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-single-choice') {
        <demo-section
          heading="Single choice"
          [props]="[
            { name: 'size', value: 'sm / md / lg' },
            { name: 'color', value: 'primary / info / success' },
          ]"
          note="Use arrow keys to choose a mode. Changing the choice updates the content owned by this demo.">
          <sd-segmented label="Form builder mode" [items]="modes" [(model)]="mode" autoId="builder-mode" />
          <div class="consumer-panel">
            @switch (mode()) {
              @case ('design') {
                <strong>Design your form</strong>
                <p>Add fields, arrange groups, and choose validation.</p>
              }
              @case ('preview') {
                <strong>Preview your form</strong>
                <p>Try the form as a person filling it out.</p>
              }
              @case ('schema') {
                <strong>Form schema</strong>
                <p>Inspect the schema generated from your design.</p>
              }
            }
          </div>
          <div class="choices-row">
            <sd-segmented label="Small" size="sm" color="info" [items]="views" [(model)]="view" />
            <sd-segmented label="Large" size="lg" color="success" [items]="views" [(model)]="view" />
          </div>
        </demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-types') {
        <demo-section
          heading="Types"
          [props]="[{ name: 'type', value: 'light / fill / outline' }]"
          note="Light is the default: a neutral track with a raised choice. Fill uses the solid colour and outline a border and tint. Behavior is identical for every type.">
          <div class="choices-row">
            @for (type of types; track type.value) {
              <sd-segmented [label]="type.label" [type]="type.value" [items]="modes" [(model)]="typeMode" />
            }
          </div>
          <div class="choices-row">
            <sd-segmented label="Fill, info, small" type="fill" color="info" size="sm" [items]="views" [(model)]="view" />
            <sd-segmented label="Outline, success, large" type="outline" color="success" size="lg" [items]="views" [(model)]="view" />
            <sd-segmented
              label="Fill, vertical"
              type="fill"
              color="warning"
              [option]="{ orientation: 'vertical' }"
              [items]="modes"
              [(model)]="typeMode" />
            <sd-segmented
              label="Outline, multiple, stretch"
              type="outline"
              color="secondary"
              [option]="{ multiple: true, stretch: true }"
              [items]="channels"
              [(model)]="selectedChannels" />
          </div>
        </demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-multiple-and-templates') {
        <demo-section
          heading="Multiple and templates"
          [props]="[{ name: 'option.multiple', value: 'true' }]"
          note="Arrows move focus; Space or Enter toggles a choice. Custom content retains the accessible label.">
          <sd-segmented label="Visible channels" [items]="channels" [option]="{ multiple: true }" [(model)]="selectedChannels" color="info">
            <ng-template [sdSegmentedItemTemplate]="channels" let-item let-selected="selected">
              <span aria-hidden="true">{{ selected ? '✓' : '+' }}</span
              ><span>{{ item.label }}</span>
            </ng-template>
          </sd-segmented>
          <p>Selected: {{ selectedChannelText() || 'None' }}</p>
          <sd-segmented label="Layout" [items]="iconViews" [(model)]="view" />
        </demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-form-and-states') {
        <demo-section
          heading="Form and states"
          [props]="[{ name: 'form / name / required', value: 'Core UI form registration' }]"
          note="A required choice shows an error after the form is touched. Readonly keeps the form value; loading blocks changes.">
          <sd-segmented label="Required choice" [form]="form" name="mode" [items]="modes" required [(model)]="requiredMode" />
          <div class="demo-actions">
            <button type="button" (click)="form.markAllAsTouched()">Check form</button
            ><button type="button" (click)="reset()">Reset</button>
          </div>
          <div class="choices-row">
            <sd-segmented label="Disabled" [items]="views" [model]="'list'" disabled />
            <sd-segmented label="Readonly" [items]="views" [model]="'grid'" readonly />
            <sd-segmented label="Loading" [items]="views" loading />
            <sd-segmented label="Empty choices" />
          </div>
        </demo-section>
      }
    </demo-page>
  `,
  styles: [
    `
      .choices-row {
        display: flex;
        flex-wrap: wrap;
        align-items: start;
        gap: 20px;
        margin-top: 20px;
        /* why: the row is a flex item of the section body; its automatic minimum is the widest unscrolled
           segmented-control track, which overflowed the 320px preview. Let it shrink so each track scrolls. */
        min-width: 0;
        max-width: 100%;
      }
      .consumer-panel {
        padding: 20px;
        margin-top: 16px;
        border: 1px solid var(--sd-border);
        border-radius: 8px;
        background: var(--sd-surface-muted);
      }
      .consumer-panel p {
        margin: 8px 0 0;
        color: var(--sd-text-secondary);
      }
      .demo-actions {
        display: flex;
        gap: 8px;
        margin: 12px 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedDemoComponent {
  readonly modes: readonly SdSegmentedItem<Mode>[] = [
    { value: 'design', label: 'Design', prefixIcon: 'edit' },
    { value: 'preview', label: 'Preview', prefixIcon: 'visibility' },
    { value: 'schema', label: 'Schema', prefixIcon: 'code', suffixIcon: 'data_object' },
  ];
  readonly views: readonly SdSegmentedItem<'list' | 'grid'>[] = [
    { value: 'list', label: 'List', prefixIcon: 'view_list' },
    { value: 'grid', label: 'Grid', prefixIcon: 'grid_view' },
  ];
  readonly iconViews = this.views.map(item => ({ ...item, iconOnly: true }));
  readonly channels: readonly SdSegmentedItem<string>[] = [
    { value: 'web', label: 'Web' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'email', label: 'Email' },
    { value: 'archived', label: 'Archived', disabled: true },
  ];
  readonly types: readonly { value: SdSegmentedType; label: string }[] = [
    { value: 'light', label: 'Light (default)' },
    { value: 'fill', label: 'Fill' },
    { value: 'outline', label: 'Outline' },
  ];
  readonly mode = signal<SdSegmentedModel<Mode>>('design');
  readonly typeMode = signal<SdSegmentedModel<Mode>>('preview');
  readonly view = signal<SdSegmentedModel<'list' | 'grid'>>('list');
  readonly selectedChannels = signal<SdSegmentedModel<string>>(['web']);
  readonly selectedChannelText = computed(() => {
    const selected = this.selectedChannels();
    return Array.isArray(selected) ? selected.join(', ') : String(selected ?? '');
  });
  readonly form = new FormGroup({});
  readonly requiredMode = signal<SdSegmentedModel<Mode>>(null);
  reset(): void {
    this.requiredMode.set(null);
    this.form.markAsUntouched();
    this.form.markAsPristine();
  }
}
