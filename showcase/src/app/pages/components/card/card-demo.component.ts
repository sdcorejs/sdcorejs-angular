import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { CardCompareExampleComponent } from './examples/card-compare.example';
import { CardMultipleExampleComponent } from './examples/card-multiple.example';
import { CardSingleExampleComponent } from './examples/card-single.example';
import { CardStandaloneExampleComponent } from './examples/card-standalone.example';
import { CardStatesExampleComponent } from './examples/card-states.example';

@Component({
  selector: 'app-card-demo',
  standalone: true,
  imports: [
    DemoPageComponent,
    DemoSectionComponent,
    CardStandaloneExampleComponent,
    CardSingleExampleComponent,
    CardMultipleExampleComponent,
    CardCompareExampleComponent,
    CardStatesExampleComponent,
  ],
  template: `<demo-page
    #demoPage
    title="Card"
    description="Selectable shell cho nội dung do consumer sở hữu; dùng độc lập hoặc trong group single/multiple.">
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-standalone-card') {
      <demo-section
        heading="Standalone card"
        data-example-typescript="./examples/card-standalone.example.ts"
        data-example-template="./examples/card-standalone.example.html"
        data-example-style="./examples/card-example.scss"
        [props]="[
          { name: 'selected', value: 'readonly Signal<boolean>' },
          { name: 'click', value: 'Event' },
          { name: 'autoId', value: 'stable E2E suffix' },
        ]"
        note="Click card để toggle state; consumer đọc state mới qua #card=sdCard.">
        <app-card-standalone-example></app-card-standalone-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-single-selection') {
      <demo-section
        heading="Single selection"
        data-example-typescript="./examples/card-single.example.ts"
        data-example-template="./examples/card-single.example.html"
        data-example-style="./examples/card-example.scss"
        [props]="[
          { name: 'model', value: 'two-way' },
          { name: 'sdChange', value: 'user changes only' },
          { name: 'autoId', value: 'group / card' },
        ]"
        note="Click lại card đang chọn để clear model về null.">
        <app-card-single-example></app-card-single-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-multiple-selection') {
      <demo-section
        heading="Multiple selection"
        data-example-typescript="./examples/card-multiple.example.ts"
        data-example-template="./examples/card-multiple.example.html"
        data-example-style="./examples/card-example.scss"
        [props]="[
          { name: 'multiple', value: 'true' },
          { name: 'model', value: 'immutable array' },
          { name: 'autoId', value: 'group / card' },
        ]">
        <app-card-multiple-example></app-card-multiple-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-object-comparewith') {
      <demo-section
        heading="Object compareWith"
        data-example-typescript="./examples/card-compare.example.ts"
        data-example-template="./examples/card-compare.example.html"
        data-example-style="./examples/card-example.scss"
        [props]="[
          { name: 'compareWith', value: 'business key' },
          { name: 'autoId', value: 'group / card' },
        ]"
        note="Model và option là hai object khác reference nhưng card ACTIVE vẫn selected theo code.">
        <app-card-compare-example></app-card-compare-example>
      </demo-section>
    }
    @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-disabled-va-color') {
      <demo-section
        heading="Disabled và color"
        data-example-typescript="./examples/card-states.example.ts"
        data-example-template="./examples/card-states.example.html"
        data-example-style="./examples/card-example.scss"
        [props]="[
          { name: 'disabled', value: 'card / group' },
          { name: 'color', value: 'group / card override' },
          { name: 'autoId', value: 'group / card' },
        ]"
        note="Gồm selected+disabled, group disabled, inherited color, override color và standalone selected state.">
        <app-card-states-example></app-card-states-example>
      </demo-section>
    }
  </demo-page>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardDemoComponent {}
