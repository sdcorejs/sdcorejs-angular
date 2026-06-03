import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'demo-page',
  standalone: true,
  template: `
    <header class="demo-page__header">
      <h1>{{ title() }}</h1>
      @if (description(); as d) {
        <p class="demo-page__desc">{{ d }}</p>
      }
    </header>
    <div class="demo-page__body">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .demo-page__header {
      margin-bottom: 24px;
      h1 {
        font-size: 22px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      .demo-page__desc {
        color: #4a4a4a;
        font-size: 14px;
        max-width: 720px;
        margin: 0;
      }
    }
    .demo-page__body {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoPageComponent {
  title = input.required<string>();
  description = input<string | undefined>(undefined);
}

/** One demonstrated property of a showcase section. `value` omitted = boolean/bare attribute (badge shows the name only). */
export interface DemoProp {
  name: string;
  value?: string | number | boolean;
}

@Component({
  selector: 'demo-section',
  standalone: true,
  template: `
    @let _heading = heading();
    <header class="demo-section__head">
      @if (props(); as ps) {
        <!-- why: format chuẩn — mỗi property 1 badge, tên màu secondary, giá trị màu primary. -->
        <div class="demo-section__props">
          @for (p of ps; track p.name) {
            <span class="demo-prop"
              ><span class="demo-prop__name">{{ p.name }}</span
              >@if (p.value !== undefined) {<span class="demo-prop__sep">:</span
                ><span class="demo-prop__value">{{ p.value }}</span>}</span
            >
          }
        </div>
      } @else if (_heading) {
        <h2>{{ _heading }}</h2>
      }
      @if (note(); as n) {
        <p class="demo-section__note">{{ n }}</p>
      }
    </header>
    <div class="demo-section__body">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background: #ffffff;
      border: 1px solid #e6e6e6;
      border-radius: 8px;
      padding: 20px 24px;
    }
    .demo-section__head {
      margin-bottom: 14px;
      h2 {
        font-size: 15px;
        font-weight: 600;
        color: #1565c0;
        margin: 0 0 2px;
      }
      .demo-section__props {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin: 0 0 2px;
      }
      .demo-prop {
        display: inline-flex;
        align-items: center;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 12px;
        line-height: 1.6;
        background: #f3f5f8;
        border: 1px solid #e6e6e6;
        border-radius: 6px;
        padding: 1px 8px;
      }
      .demo-prop__name { color: #6b6b6b; }
      .demo-prop__sep { color: #6b6b6b; margin: 0 1px; }
      .demo-prop__value { color: #1565c0; font-weight: 600; }
      .demo-section__note {
        font-size: 12px;
        color: #6b6b6b;
        margin: 0;
      }
    }
    .demo-section__body {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoSectionComponent {
  /** Optional fallback title — used only when `props` is not supplied (rare; most sections use `props`). */
  heading = input<string | undefined>(undefined);
  /** Demonstrated properties, rendered as `name:value` badges. Preferred over `heading`. */
  props = input<DemoProp[] | undefined>(undefined);
  note = input<string | undefined>(undefined);
}
