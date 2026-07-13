import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonColorsExampleComponent } from './button-colors.example';
import { ButtonIconOnlyExampleComponent } from './button-icon-only.example';
import { ButtonIconSetExampleComponent } from './button-icon-set.example';
import { ButtonSecondaryBlackExampleComponent } from './button-secondary-black.example';
import { ButtonSizesExampleComponent } from './button-sizes.example';
import { ButtonStatesExampleComponent } from './button-states.example';
import { ButtonVariantsExampleComponent } from './button-variants.example';

const EXAMPLES: readonly { readonly name: string; readonly component: Type<unknown> }[] = [
  { name: 'colors', component: ButtonColorsExampleComponent },
  { name: 'icon only', component: ButtonIconOnlyExampleComponent },
  { name: 'icon set', component: ButtonIconSetExampleComponent },
  { name: 'secondary and black', component: ButtonSecondaryBlackExampleComponent },
  { name: 'sizes', component: ButtonSizesExampleComponent },
  { name: 'states', component: ButtonStatesExampleComponent },
  { name: 'variants', component: ButtonVariantsExampleComponent },
];

describe('Button example spacing', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: EXAMPLES.map(example => example.component) }).compileComponents();
  });

  for (const example of EXAMPLES) {
    it(`keeps the ${example.name} controls separated when they wrap`, () => {
      const fixture: ComponentFixture<unknown> = TestBed.createComponent(example.component);
      document.body.appendChild(fixture.nativeElement);
      fixture.detectChanges();

      const style = getComputedStyle(fixture.nativeElement);
      expect(style.display).toBe('flex');
      expect(style.flexWrap).toBe('wrap');
      expect(style.rowGap).toBe('12px');
      expect(style.columnGap).toBe('12px');

      fixture.nativeElement.remove();
      fixture.destroy();
    });
  }
});
