import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DemoPageComponent, DemoSectionComponent, SHOWCASE_DEMO_SECTION_ID } from './demo-page.component';

@Component({ selector: 'test-first-example', standalone: true, template: 'First' })
class FirstExampleComponent {
  static instances = 0;
  constructor() { FirstExampleComponent.instances += 1; }
}

@Component({ selector: 'test-second-example', standalone: true, template: 'Second' })
class SecondExampleComponent {
  static instances = 0;
  constructor() { SecondExampleComponent.instances += 1; }
}

@Component({
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, FirstExampleComponent, SecondExampleComponent],
  template: `
    <demo-page #demoPage title="Focused examples">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-first') {
        <demo-section heading="First"><test-first-example /></demo-section>
      }
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-second') {
        <demo-section heading="Second"><test-second-example /></demo-section>
      }
    </demo-page>
  `,
})
class FocusedDemoHostComponent {}

describe('focused demo rendering', () => {
  it('constructs only the selected scenario instead of hidden sibling galleries', async () => {
    FirstExampleComponent.instances = 0;
    SecondExampleComponent.instances = 0;
    await TestBed.configureTestingModule({
      imports: [FocusedDemoHostComponent],
      providers: [{ provide: SHOWCASE_DEMO_SECTION_ID, useValue: 'example-first' }],
    }).compileComponents();

    const fixture = TestBed.createComponent(FocusedDemoHostComponent);
    fixture.detectChanges();

    expect(FirstExampleComponent.instances).toBe(1);
    expect(SecondExampleComponent.instances).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('demo-section')).toHaveSize(1);
  });
});
