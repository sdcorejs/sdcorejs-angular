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

@Component({
  selector: 'demo-section',
  standalone: true,
  template: `
    <header class="demo-section__head">
      <h2>{{ heading() }}</h2>
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
  heading = input.required<string>();
  note = input<string | undefined>(undefined);
}
