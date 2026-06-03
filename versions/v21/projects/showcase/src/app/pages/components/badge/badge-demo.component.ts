import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdBadge } from '@sdcorejs/angular/components/badge';

@Component({
  selector: 'app-badge-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdBadge],
  template: `
    <demo-page
      title="Badge"
      description="Nhãn trạng thái / số đếm — có 3 dạng (type): icon, round, tag.">

      <demo-section [props]="[{ name: 'type', value: 'icon / round / tag' }]">
        <sd-badge type="icon" primary icon="check_circle" title="icon"></sd-badge>
        <sd-badge type="round" primary title="round"></sd-badge>
        <sd-badge type="tag" primary icon="label" title="tag"></sd-badge>
      </demo-section>

      <demo-section [props]="[{ name: 'type', value: 'round' }, { name: 'color' }]">
        <sd-badge type="round" primary title="primary"></sd-badge>
        <sd-badge type="round" secondary title="secondary"></sd-badge>
        <sd-badge type="round" success title="success"></sd-badge>
        <sd-badge type="round" info title="info"></sd-badge>
        <sd-badge type="round" warning title="warning"></sd-badge>
        <sd-badge type="round" error title="error"></sd-badge>
      </demo-section>

      <demo-section [props]="[{ name: 'type', value: 'tag' }, { name: 'color' }]">
        <sd-badge type="tag" primary icon="label" title="primary"></sd-badge>
        <sd-badge type="tag" secondary icon="label" title="secondary"></sd-badge>
        <sd-badge type="tag" success icon="label" title="success"></sd-badge>
        <sd-badge type="tag" info icon="label" title="info"></sd-badge>
        <sd-badge type="tag" warning icon="label" title="warning"></sd-badge>
        <sd-badge type="tag" error icon="label" title="error"></sd-badge>
      </demo-section>

      <demo-section [props]="[{ name: 'type', value: 'icon' }, { name: 'color' }]">
        <sd-badge type="icon" primary icon="circle" title="primary"></sd-badge>
        <sd-badge type="icon" secondary icon="circle" title="secondary"></sd-badge>
        <sd-badge type="icon" success icon="circle" title="success"></sd-badge>
        <sd-badge type="icon" info icon="circle" title="info"></sd-badge>
        <sd-badge type="icon" warning icon="circle" title="warning"></sd-badge>
        <sd-badge type="icon" error icon="circle" title="error"></sd-badge>
      </demo-section>

      <demo-section [props]="[{ name: 'type', value: 'round' }, { name: 'size', value: 'sm / md / lg' }]">
        <sd-badge type="round" primary title="sm" size="sm"></sd-badge>
        <sd-badge type="round" primary title="md" size="md"></sd-badge>
        <sd-badge type="round" primary title="lg" size="lg"></sd-badge>
      </demo-section>

      <demo-section [props]="[{ name: 'type', value: 'round' }, { name: 'icon' }, { name: 'size', value: 'sm / md / lg' }]">
        <sd-badge type="round" success icon="check_circle" title="sm" size="sm"></sd-badge>
        <sd-badge type="round" success icon="check_circle" title="md" size="md"></sd-badge>
        <sd-badge type="round" success icon="check_circle" title="lg" size="lg"></sd-badge>
      </demo-section>

      <demo-section [props]="[{ name: 'type', value: 'tag' }, { name: 'size', value: 'sm / md / lg' }]">
        <sd-badge type="tag" info icon="label" title="sm" size="sm"></sd-badge>
        <sd-badge type="tag" info icon="label" title="md" size="md"></sd-badge>
        <sd-badge type="tag" info icon="label" title="lg" size="lg"></sd-badge>
      </demo-section>

      <demo-section [props]="[{ name: 'description' }]">
        <sd-badge type="icon" success icon="check_circle" title="title" description="description"></sd-badge>
        <sd-badge type="tag" primary icon="star" title="title" description="description"></sd-badge>
      </demo-section>

      <demo-section [props]="[{ name: 'type', value: 'round' }, { name: 'title', value: 'number' }]">
        <sd-badge type="round" primary [title]="unreadCount()"></sd-badge>
        <sd-badge type="round" error [title]="errorsCount()"></sd-badge>
        <sd-badge type="round" warning title="99+"></sd-badge>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeDemoComponent {
  readonly unreadCount = signal(7);
  readonly errorsCount = signal(3);
}
