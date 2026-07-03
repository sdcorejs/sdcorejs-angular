import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdRadio } from '@sdcorejs/angular/forms/radio';
import { type SdIconSet } from '@sdcorejs/angular/modules/icon';

interface IconSetOption {
  value: SdIconSet;
  display: string;
}

@Component({
  selector: 'app-badge-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FormsModule, ReactiveFormsModule, SdBadge, SdRadio],
  template: `
    <demo-page
      title="Badge"
      description="Nhãn trạng thái / số đếm — có 3 dạng (type): icon, round, tag.">

      <demo-section heading="Ba dạng" [props]="[{ name: 'type', value: 'icon / round / tag' }]">
        <sd-badge type="icon" primary icon="check_circle" title="icon"></sd-badge>
        <sd-badge type="round" primary title="round"></sd-badge>
        <sd-badge type="tag" primary icon="label" title="tag"></sd-badge>
      </demo-section>

      <demo-section
        heading="IconSet switch"
        [props]="[{ name: 'iconSet', value: 'material-icons / material-icons-outlined / lucide' }, { name: 'type', value: 'icon / round / tag' }]"
        note="Chon iconSet bang radio de so sanh alignment cua cung mot bo badge icon.">
        <div class="d-flex flex-column gap-16 w-full">
          <sd-radio
            label="iconSet"
            [items]="iconSetOptions"
            valueField="value"
            displayField="display"
            [(model)]="selectedIconSet"
            [form]="iconSetForm"></sd-radio>

          <div class="d-flex flex-wrap align-items-center gap-16">
            <sd-badge type="icon" success icon="check_circle" [iconSet]="selectedIconSet()" title="Approved"></sd-badge>
            <sd-badge type="icon" info icon="visibility" [iconSet]="selectedIconSet()" title="Visible"></sd-badge>
            <sd-badge type="icon" warning icon="warning" [iconSet]="selectedIconSet()" title="Warning"></sd-badge>
          </div>

          <div class="d-flex flex-wrap align-items-center gap-16">
            <sd-badge type="round" success icon="check_circle" [iconSet]="selectedIconSet()" title="Round success"></sd-badge>
            <sd-badge type="round" info icon="local_offer" [iconSet]="selectedIconSet()" title="Round offer"></sd-badge>
            <sd-badge type="round" error icon="delete" [iconSet]="selectedIconSet()" title="Round error"></sd-badge>
          </div>

          <div class="d-flex flex-wrap align-items-center gap-16">
            <sd-badge type="tag" primary icon="local_offer" [iconSet]="selectedIconSet()" title="Tag primary"></sd-badge>
            <sd-badge type="tag" warning icon="warning" [iconSet]="selectedIconSet()" title="Tag warning"></sd-badge>
            <sd-badge type="tag" secondary icon="visibility" [iconSet]="selectedIconSet()" title="Tag secondary"></sd-badge>
          </div>
        </div>
      </demo-section>

      <demo-section heading="Màu sắc round" [props]="[{ name: 'type', value: 'round' }, { name: 'color', value: 'primary / secondary / success / info / warning / error' }]">
        <sd-badge type="round" primary title="primary"></sd-badge>
        <sd-badge type="round" secondary title="secondary"></sd-badge>
        <sd-badge type="round" success title="success"></sd-badge>
        <sd-badge type="round" info title="info"></sd-badge>
        <sd-badge type="round" warning title="warning"></sd-badge>
        <sd-badge type="round" error title="error"></sd-badge>
      </demo-section>

      <demo-section heading="Màu sắc tag" [props]="[{ name: 'type', value: 'tag' }, { name: 'color', value: 'primary / secondary / success / info / warning / error' }]">
        <sd-badge type="tag" primary icon="label" title="primary"></sd-badge>
        <sd-badge type="tag" secondary icon="label" title="secondary"></sd-badge>
        <sd-badge type="tag" success icon="label" title="success"></sd-badge>
        <sd-badge type="tag" info icon="label" title="info"></sd-badge>
        <sd-badge type="tag" warning icon="label" title="warning"></sd-badge>
        <sd-badge type="tag" error icon="label" title="error"></sd-badge>
      </demo-section>

      <demo-section heading="Màu sắc icon" [props]="[{ name: 'type', value: 'icon' }, { name: 'color', value: 'primary / secondary / success / info / warning / error' }]">
        <sd-badge type="icon" primary icon="circle" title="primary"></sd-badge>
        <sd-badge type="icon" secondary icon="circle" title="secondary"></sd-badge>
        <sd-badge type="icon" success icon="circle" title="success"></sd-badge>
        <sd-badge type="icon" info icon="circle" title="info"></sd-badge>
        <sd-badge type="icon" warning icon="circle" title="warning"></sd-badge>
        <sd-badge type="icon" error icon="circle" title="error"></sd-badge>
      </demo-section>

      <demo-section heading="Kích thước round" [props]="[{ name: 'type', value: 'round' }, { name: 'size', value: 'sm / md / lg' }]">
        <sd-badge type="round" primary title="sm" size="sm"></sd-badge>
        <sd-badge type="round" primary title="md" size="md"></sd-badge>
        <sd-badge type="round" primary title="lg" size="lg"></sd-badge>
      </demo-section>

      <demo-section heading="Round với icon" [props]="[{ name: 'type', value: 'round' }, { name: 'icon', value: 'name' }, { name: 'size', value: 'sm / md / lg' }]">
        <sd-badge type="round" success icon="check_circle" title="sm" size="sm"></sd-badge>
        <sd-badge type="round" success icon="check_circle" title="md" size="md"></sd-badge>
        <sd-badge type="round" success icon="check_circle" title="lg" size="lg"></sd-badge>
      </demo-section>

      <demo-section heading="Kích thước tag" [props]="[{ name: 'type', value: 'tag' }, { name: 'size', value: 'sm / md / lg' }]">
        <sd-badge type="tag" info icon="label" title="sm" size="sm"></sd-badge>
        <sd-badge type="tag" info icon="label" title="md" size="md"></sd-badge>
        <sd-badge type="tag" info icon="label" title="lg" size="lg"></sd-badge>
      </demo-section>

      <demo-section heading="Kèm mô tả" [props]="[{ name: 'description', value: 'text' }]">
        <sd-badge type="icon" success icon="check_circle" title="title" description="description"></sd-badge>
        <sd-badge type="tag" primary icon="star" title="title" description="description"></sd-badge>
      </demo-section>

      <demo-section heading="Số đếm" [props]="[{ name: 'type', value: 'round' }, { name: 'title', value: 'number' }]">
        <sd-badge type="round" primary [title]="unreadCount()"></sd-badge>
        <sd-badge type="round" error [title]="errorsCount()"></sd-badge>
        <sd-badge type="round" warning title="99+"></sd-badge>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeDemoComponent {
  readonly iconSetForm = new FormGroup({});
  readonly selectedIconSet = signal<SdIconSet>('lucide');
  readonly iconSetOptions: IconSetOption[] = [
    { value: 'material-icons', display: 'Material filled' },
    { value: 'material-icons-outlined', display: 'Material outlined' },
    { value: 'lucide', display: 'Lucide' },
  ];

  readonly unreadCount = signal(7);
  readonly errorsCount = signal(3);
}
