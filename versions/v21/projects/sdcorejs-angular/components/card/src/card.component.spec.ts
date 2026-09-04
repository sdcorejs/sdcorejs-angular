import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { Color as SdColor } from '@sdcorejs/utils/models';
import { SdCardGroup, type SdCardCompareWith } from './card-group.component';
import { SdCard } from './card.component';

interface StatusOption {
  id: number;
  label: string;
}

@Component({
  standalone: true,
  imports: [SdCard, SdCardGroup],
  template: `
    <div data-testid="standalone-wrapper">
      <sd-card
        #standalone="sdCard"
        data-testid="standalone"
        autoId="standalone"
        [value]="'standalone'"
        [disabled]="standaloneDisabled()"
        [color]="standaloneColor()"
        (click)="onStandaloneClick(standalone.selected(), $event)">
        <span class="projected-first">Projected content</span>
        <strong class="projected-second">kept intact</strong>
      </sd-card>
    </div>

    <sd-card-group
      data-testid="single-group"
      autoId="single"
      aria-label="Single selection"
      [(model)]="singleModel"
      [disabled]="singleGroupDisabled()"
      [color]="groupColor()"
      (sdChange)="onSingleChange($event)">
      <sd-card
        #singleA="sdCard"
        data-testid="single-a"
        autoId="single-a"
        [value]="dynamicValue()"
        (click)="onSingleCardClick(singleA.selected(), $event)">
        A
      </sd-card>
      <sd-card data-testid="single-b" [value]="'b'" [disabled]="singleCardDisabled()" [color]="cardColor()"> B </sd-card>

      <sd-card-group data-testid="inner-group" [(model)]="innerModel" (sdChange)="innerChanges.push($event)">
        <sd-card data-testid="inner-card" [value]="'inner'">Inner</sd-card>
      </sd-card-group>
    </sd-card-group>

    <sd-card-group data-testid="multiple-group" multiple [(model)]="multipleModel" (sdChange)="multipleChanges.push($event)">
      <sd-card data-testid="multiple-a" [value]="'a'">A</sd-card>
      <sd-card data-testid="multiple-b" [value]="'b'">B</sd-card>
    </sd-card-group>

    <sd-card-group data-testid="object-group" [(model)]="objectModel" [compareWith]="compareById" (sdChange)="objectChanges.push($event)">
      <sd-card data-testid="object-card" [value]="objectOption()">Object</sd-card>
    </sd-card-group>

    <sd-card-group
      data-testid="object-multiple-group"
      multiple
      [(model)]="objectMultipleModel"
      [compareWith]="compareById"
      (sdChange)="objectMultipleChanges.push($event)">
      <sd-card data-testid="object-multiple-card" [value]="objectOption()">Object multiple</sd-card>
    </sd-card-group>

    <sd-card-group data-testid="bare-group" multiple disabled>
      <sd-card data-testid="bare-card" value="bare" disabled>Bare</sd-card>
    </sd-card-group>
  `,
})
class CardTestHost {
  readonly standaloneDisabled = signal(false);
  readonly standaloneColor = signal<SdColor | undefined>(undefined);
  readonly singleModel = signal<string | string[] | null>(null);
  readonly multipleModel = signal<string | string[] | null>(null);
  readonly innerModel = signal<string | string[] | null>(null);
  readonly objectModel = signal<StatusOption | StatusOption[] | null>({ id: 1, label: 'External reference' });
  readonly objectMultipleModel = signal<StatusOption | StatusOption[] | null>(null);
  readonly objectOption = signal<StatusOption>({ id: 1, label: 'Card reference' });
  readonly dynamicValue = signal('a');
  readonly singleGroupDisabled = signal(false);
  readonly singleCardDisabled = signal(false);
  readonly groupColor = signal<SdColor>('success');
  readonly cardColor = signal<SdColor | undefined>('warning');

  readonly compareById: SdCardCompareWith<StatusOption> = (modelValue, cardValue) => modelValue.id === cardValue.id;

  nativeParentClicks = 0;
  standaloneClicks: Event[] = [];
  standaloneHandlerStates: boolean[] = [];
  singleChanges: (string | string[] | null)[] = [];
  multipleChanges: (string | string[] | null)[] = [];
  innerChanges: (string | string[] | null)[] = [];
  objectChanges: (StatusOption | StatusOption[] | null)[] = [];
  objectMultipleChanges: (StatusOption | StatusOption[] | null)[] = [];
  singleCardClicks: Event[] = [];
  singleCardHandlerStates: boolean[] = [];
  activationOrder: string[] = [];

  onStandaloneClick(selected: boolean, event: Event): void {
    this.standaloneHandlerStates.push(selected);
    this.standaloneClicks.push(event);
  }

  onSingleChange(value: string | string[] | null): void {
    this.activationOrder.push('sdChange');
    this.singleChanges.push(value);
  }

  onSingleCardClick(selected: boolean, event: Event): void {
    this.activationOrder.push('click');
    this.singleCardHandlerStates.push(selected);
    this.singleCardClicks.push(event);
  }
}

describe('SdCard and SdCardGroup', () => {
  let fixture: ComponentFixture<CardTestHost>;
  let host: CardTestHost;

  const element = (testId: string): HTMLElement => {
    const result = fixture.nativeElement.querySelector(`[data-testid="${testId}"]`) as HTMLElement | null;
    if (!result) throw new Error(`Missing test element: ${testId}`);
    return result;
  };

  const card = <T = unknown>(testId: string): SdCard<T> =>
    fixture.debugElement.query(By.css(`[data-testid="${testId}"]`)).componentInstance as SdCard<T>;

  const group = <T = unknown>(testId: string): SdCardGroup<T> =>
    fixture.debugElement.query(By.css(`[data-testid="${testId}"]`)).componentInstance as SdCardGroup<T>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CardTestHost] }).compileComponents();
    fixture = TestBed.createComponent(CardTestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    element('standalone-wrapper').addEventListener('click', () => host.nativeParentClicks++);
  });

  describe('group model', () => {
    it('defaults multiple to false', () => {
      expect(group('single-group').multiple()).toBeFalse();
    });

    it('coerces bare multiple and disabled attributes', () => {
      expect(group('bare-group').multiple()).toBeTrue();
      expect(group('bare-group').disabled()).toBeTrue();
      expect(card('bare-card').disabled()).toBeTrue();
    });

    it('selects a card in single mode', () => {
      element('single-a').click();
      expect(host.singleModel()).toBe('a');
    });

    it('clears a selected card in single mode', fakeAsync(() => {
      element('single-a').click();
      tick(301);
      element('single-a').click();
      expect(host.singleModel()).toBeNull();
    }));

    it('adds a value in multiple mode', () => {
      element('multiple-a').click();
      expect(host.multipleModel()).toEqual(['a']);
    });

    it('removes a value in multiple mode', fakeAsync(() => {
      element('multiple-a').click();
      tick(301);
      element('multiple-a').click();
      expect(host.multipleModel()).toEqual([]);
    }));

    it('updates multiple values immutably', () => {
      const original = ['a'];
      host.multipleModel.set(original);
      fixture.detectChanges();
      element('multiple-b').click();
      expect(host.multipleModel()).toEqual(['a', 'b']);
      expect(host.multipleModel()).not.toBe(original);
      expect(original).toEqual(['a']);
    });

    it('does not create comparator-equivalent duplicates', () => {
      const existing = { id: 1, label: 'Existing reference' };
      host.objectMultipleModel.set([existing]);
      fixture.detectChanges();
      element('object-multiple-card').click();
      expect(host.objectMultipleModel()).toEqual([]);
    });

    it('removes every comparator-equivalent value from an externally supplied array', () => {
      host.objectMultipleModel.set([
        { id: 1, label: 'First equivalent value' },
        { id: 1, label: 'Second equivalent value' },
      ]);
      fixture.detectChanges();
      element('object-multiple-card').click();
      expect(host.objectMultipleModel()).toEqual([]);
      expect(host.objectMultipleChanges).toEqual([[]]);
    });

    it('uses Object.is by default for primitive values', () => {
      host.multipleModel.set(['a']);
      fixture.detectChanges();
      expect(card('multiple-a').selected()).toBeTrue();
    });

    it('uses compareWith for object values with different references', () => {
      expect(host.objectModel()).not.toBe(host.objectOption());
      expect(card('object-card').selected()).toBeTrue();
    });

    it('recomputes selection after an external model update', () => {
      host.singleModel.set('a');
      fixture.detectChanges();
      expect(card('single-a').selected()).toBeTrue();
    });

    it('does not emit sdChange for an external model update', () => {
      host.singleModel.set('a');
      fixture.detectChanges();
      expect(host.singleChanges).toEqual([]);
    });

    it('emits sdChange exactly once for one user interaction', () => {
      element('single-a').click();
      expect(host.singleChanges).toEqual(['a']);
    });

    it('emits the new model value', () => {
      element('multiple-b').click();
      expect(host.multipleChanges).toEqual([['b']]);
    });

    it('does not update or emit when the group is disabled', () => {
      host.singleGroupDisabled.set(true);
      fixture.detectChanges();
      element('single-a').click();
      expect(host.singleModel()).toBeNull();
      expect(host.singleChanges).toEqual([]);
    });

    it('defensively normalizes an array model on the next single interaction', () => {
      host.singleModel.set(['b']);
      fixture.detectChanges();
      element('single-a').click();
      expect(host.singleModel()).toBe('a');
      expect(host.singleChanges).toEqual(['a']);
    });

    it('defensively normalizes a scalar model on the next multiple interaction', () => {
      host.multipleModel.set('invalid-shape');
      fixture.detectChanges();
      element('multiple-a').click();
      expect(host.multipleModel()).toEqual(['a']);
      expect(host.multipleChanges).toEqual([['a']]);
    });
  });

  describe('card in a group', () => {
    it('uses its injected group as the selection source of truth', () => {
      element('single-a').click();
      expect(card('single-a').selected()).toBeTrue();
    });

    it('uses the nearest group when groups are nested', () => {
      element('inner-card').click();
      expect(host.innerModel()).toBe('inner');
      expect(host.singleModel()).toBeNull();
      expect(host.innerChanges).toEqual(['inner']);
    });

    it('reacts to the group model', () => {
      host.singleModel.set('a');
      fixture.detectChanges();
      expect(card('single-a').selected()).toBeTrue();
      host.singleModel.set(null);
      fixture.detectChanges();
      expect(card('single-a').selected()).toBeFalse();
    });

    it('reacts to multiple selection mode', () => {
      host.multipleModel.set(['a', 'b']);
      fixture.detectChanges();
      expect(card('multiple-a').selected()).toBeTrue();
      expect(card('multiple-b').selected()).toBeTrue();
    });

    it('reacts to a custom comparator', () => {
      host.objectModel.set({ id: 1, label: 'Another external reference' });
      fixture.detectChanges();
      expect(card('object-card').selected()).toBeTrue();
    });

    it('reacts when its value input changes', () => {
      host.singleModel.set('a');
      fixture.detectChanges();
      expect(card('single-a').selected()).toBeTrue();
      host.dynamicValue.set('changed');
      fixture.detectChanges();
      expect(card('single-a').selected()).toBeFalse();
    });

    it('does not toggle the group when the card is disabled', () => {
      host.singleCardDisabled.set(true);
      fixture.detectChanges();
      element('single-b').click();
      expect(host.singleModel()).toBeNull();
      expect(host.singleChanges).toEqual([]);
    });

    it('becomes effectively disabled when its group is disabled', () => {
      host.singleGroupDisabled.set(true);
      fixture.detectChanges();
      expect(element('single-a').getAttribute('aria-disabled')).toBe('true');
      expect(element('single-a').classList.contains('sd-disabled')).toBeTrue();
    });

    it('inherits the group color', () => {
      expect(element('single-a').classList.contains('sd-c-success')).toBeTrue();
    });

    it('lets card color override group color', () => {
      expect(element('single-b').classList.contains('sd-c-warning')).toBeTrue();
      expect(element('single-b').classList.contains('sd-c-success')).toBeFalse();
    });

    it('supports all six public Color values', () => {
      const colors: SdColor[] = ['primary', 'secondary', 'info', 'success', 'warning', 'error'];
      for (const colorValue of colors) {
        host.groupColor.set(colorValue);
        fixture.detectChanges();
        expect(element('single-a').classList.contains(`sd-c-${colorValue}`))
          .withContext(colorValue)
          .toBeTrue();
      }
    });
  });

  describe('standalone card', () => {
    it('works without a group injection context', () => {
      expect(() => card('standalone').selected()).not.toThrow();
    });

    it('defaults to unselected', () => {
      expect(card('standalone').selected()).toBeFalse();
    });

    it('toggles selected on click', () => {
      element('standalone').click();
      expect(card('standalone').selected()).toBeTrue();
    });

    it('toggles selected off on the next accepted click', fakeAsync(() => {
      element('standalone').click();
      tick(301);
      element('standalone').click();
      expect(card('standalone').selected()).toBeFalse();
    }));

    it('does not toggle when disabled', () => {
      host.standaloneDisabled.set(true);
      fixture.detectChanges();
      element('standalone').click();
      expect(card('standalone').selected()).toBeFalse();
    });

    it('exposes selected through exportAs template references', () => {
      element('standalone').click();
      expect(host.standaloneHandlerStates).toEqual([true]);
    });

    it('uses the shared Core UI default color when no color is provided', () => {
      expect(element('standalone').classList.contains('sd-c-primary')).toBeTrue();
    });
  });

  describe('click and native event contract', () => {
    it('emits the custom click output exactly once', () => {
      element('standalone').click();
      expect(host.standaloneClicks.length).toBe(1);
      expect(host.standaloneClicks[0] instanceof Event).toBeTrue();
    });

    it('does not bubble the native click to an outer wrapper', () => {
      element('standalone').click();
      expect(host.nativeParentClicks).toBe(0);
    });

    it('emits the exact accepted native Event payload', () => {
      const nativeEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      element('standalone').dispatchEvent(nativeEvent);
      expect(host.standaloneClicks).toEqual([nativeEvent]);
    });

    it('does not deliver both native and custom click bindings to the consumer', () => {
      element('standalone').click();
      expect(host.standaloneClicks.length).toBe(1);
      expect(host.nativeParentClicks).toBe(0);
    });

    it('does not emit click when effectively disabled', () => {
      host.standaloneDisabled.set(true);
      fixture.detectChanges();
      element('standalone').click();
      expect(host.standaloneClicks).toEqual([]);
    });

    it('stops a disabled native click before it reaches an outer wrapper', () => {
      host.standaloneDisabled.set(true);
      fixture.detectChanges();
      element('standalone').click();
      expect(host.nativeParentClicks).toBe(0);
    });

    it('throttles rapid activation to the leading click per 300ms', fakeAsync(() => {
      element('standalone').click();
      element('standalone').click();
      element('standalone').click();
      tick(299);
      expect(host.standaloneClicks.length).toBe(1);
      tick(1);
      element('standalone').click();
      expect(host.standaloneClicks.length).toBe(2);
    }));

    it('removes native listeners and subscriptions on destroy', fakeAsync(() => {
      const cardElement = element('standalone');
      const cardInstance = card('standalone');
      const received: Event[] = [];
      cardInstance.click.subscribe(event => received.push(event));
      fixture.destroy();
      cardElement.click();
      tick(301);
      expect(received).toEqual([]);
    }));

    it('updates selected state before the card click handler runs', () => {
      element('standalone').click();
      expect(host.standaloneHandlerStates).toEqual([true]);
    });

    it('emits group sdChange before card click', () => {
      element('single-a').click();
      expect(host.activationOrder).toEqual(['sdChange', 'click']);
      expect(host.singleCardHandlerStates).toEqual([true]);
    });
  });

  describe('keyboard and accessibility', () => {
    it('uses group semantics while preserving a consumer native accessible name', () => {
      const groupElement = element('single-group');
      expect(groupElement.getAttribute('role')).toBe('group');
      expect(groupElement.getAttribute('aria-label')).toBe('Single selection');
      expect(groupElement.getAttribute('aria-disabled')).toBe('false');
      host.singleGroupDisabled.set(true);
      fixture.detectChanges();
      expect(groupElement.getAttribute('aria-disabled')).toBe('true');
    });

    it('emits stable Core UI data-autoid values only when configured', () => {
      expect(element('single-group').getAttribute('data-autoid')).toBe('components-card-group-single');
      expect(element('standalone').getAttribute('data-autoid')).toBe('components-card-standalone');
      expect(element('single-a').getAttribute('data-autoid')).toBe('components-card-single-a');
      expect(element('inner-group').getAttribute('data-autoid')).toBeNull();
    });

    it('activates exactly once with Enter', () => {
      element('standalone').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      expect(host.standaloneClicks.length).toBe(1);
      expect(card('standalone').selected()).toBeTrue();
    });

    it('activates exactly once with Space', () => {
      element('standalone').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
      expect(host.standaloneClicks.length).toBe(1);
      expect(card('standalone').selected()).toBeTrue();
    });

    it('prevents the Space key default scrolling behavior', () => {
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      element('standalone').dispatchEvent(event);
      expect(event.defaultPrevented).toBeTrue();
    });

    it('does not activate from keyboard when disabled', () => {
      host.standaloneDisabled.set(true);
      fixture.detectChanges();
      element('standalone').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      element('standalone').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
      expect(host.standaloneClicks).toEqual([]);
      expect(card('standalone').selected()).toBeFalse();
    });

    it('reflects selected state through aria-pressed', () => {
      expect(element('standalone').getAttribute('aria-pressed')).toBe('false');
      element('standalone').click();
      fixture.detectChanges();
      expect(element('standalone').getAttribute('aria-pressed')).toBe('true');
    });

    it('reflects effective disabled state through aria-disabled', () => {
      expect(element('single-a').getAttribute('aria-disabled')).toBe('false');
      host.singleGroupDisabled.set(true);
      fixture.detectChanges();
      expect(element('single-a').getAttribute('aria-disabled')).toBe('true');
    });

    it('uses button role and removes disabled cards from tab order', () => {
      expect(element('standalone').getAttribute('role')).toBe('button');
      expect(element('standalone').getAttribute('tabindex')).toBe('0');
      host.standaloneDisabled.set(true);
      fixture.detectChanges();
      expect(element('standalone').getAttribute('tabindex')).toBe('-1');
    });

    it('applies selected and disabled host classes together', () => {
      host.singleModel.set('b');
      host.singleCardDisabled.set(true);
      fixture.detectChanges();
      expect(element('single-b').classList.contains('sd-selected')).toBeTrue();
      expect(element('single-b').classList.contains('sd-disabled')).toBeTrue();
    });
  });

  describe('content projection and API shape', () => {
    it('renders projected content intact', () => {
      expect(element('standalone').querySelector('.projected-first')?.textContent).toContain('Projected content');
      expect(element('standalone').querySelector('.projected-second')?.textContent).toContain('kept intact');
    });

    it('does not render default icon, title, value, prefix, or suffix elements', () => {
      const standalone = element('standalone');
      expect(standalone.querySelector('sd-icon')).toBeNull();
      expect(standalone.querySelector('[class*="title"], [class*="prefix"], [class*="suffix"], [class*="value"]')).toBeNull();
    });

    it('projects all generic children exactly once', () => {
      expect(element('standalone').querySelectorAll('.projected-first').length).toBe(1);
      expect(element('standalone').querySelectorAll('.projected-second').length).toBe(1);
    });

    it('lets the group project every card intact without imposing a wrapper', () => {
      const singleGroup = element('single-group');
      expect(singleGroup.children.length).toBe(3);
      expect(singleGroup.firstElementChild?.getAttribute('data-testid')).toBe('single-a');
    });

    it('updates a consumer WritableSignal through [(model)]', () => {
      element('single-a').click();
      expect(host.singleModel()).toBe('a');
    });

    it('relies on model() for the generated modelChange output', () => {
      const definition = (SdCardGroup as unknown as { ɵcmp: { outputs: Record<string, string> } }).ɵcmp;
      expect(definition.outputs['modelChange']).toBe('model');
      expect(Object.hasOwn(group('single-group'), 'modelChange')).toBeFalse();
    });

    it('does not expose selected as an input or selectedChange as an output', () => {
      const definition = (
        SdCard as unknown as {
          ɵcmp: { inputs: Record<string, string>; outputs: Record<string, string> };
        }
      ).ɵcmp;
      expect(definition.inputs['selected']).toBeUndefined();
      expect(definition.outputs['selectedChange']).toBeUndefined();
    });
  });
});
