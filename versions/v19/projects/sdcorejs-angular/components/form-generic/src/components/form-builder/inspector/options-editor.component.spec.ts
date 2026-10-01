import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import type { SdFormGenericOption } from '../../../models/form-generic-field.model';
import { OptionsChange, OptionsEditorComponent } from './options-editor.component';

describe('OptionsEditorComponent', () => {
  let fixture: ComponentFixture<OptionsEditorComponent>;
  let emitted: OptionsChange[];
  const options: SdFormGenericOption[] = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B', disabled: true },
    { value: 'c', label: 'C' },
  ];
  const handles = () => Array.from(fixture.nativeElement.querySelectorAll('.opt__handle')) as HTMLButtonElement[];
  const values = () => emitted[emitted.length - 1].options.map(option => option.value);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [OptionsEditorComponent, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(OptionsEditorComponent);
    fixture.componentRef.setInput('options', Object.freeze([...options]));
    emitted = [];
    fixture.componentInstance.optionsChange.subscribe(change => emitted.push(change));
    fixture.detectChanges();
  });

  it('reorders with a drag handle per row instead of up/down buttons', () => {
    expect(handles().length).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('.cdk-drag').length).toBe(3);
    expect(fixture.nativeElement.querySelector('sd-icon[name="arrow_upward"]')).toBeNull();

    fixture.componentInstance.drop({ previousIndex: 0, currentIndex: 2 } as never);
    expect(values()).toEqual(['b', 'c', 'a']);
    expect(options.map(option => option.value))
      .withContext('input array is never mutated')
      .toEqual(['a', 'b', 'c']);
  });

  it('moves with ↑/↓ on the focused handle and keeps focus on the moved option', async () => {
    document.body.appendChild(fixture.nativeElement);
    handles()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect(values()).toEqual(['b', 'a', 'c']);

    fixture.componentRef.setInput('options', emitted[0].options);
    fixture.detectChanges();
    await Promise.resolve();
    expect(document.activeElement).toBe(handles()[1]);

    // Mép đầu danh sách: ↑ không phát gì.
    handles()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    expect(emitted.length).toBe(1);
    fixture.nativeElement.remove();
  });

  it('keeps the other option properties when editing a label', () => {
    fixture.componentInstance.update(1, 'label', 'Bee');
    expect(emitted[0].options[1]).toEqual({ value: 'b', label: 'Bee', disabled: true });
    expect(emitted[0].coalesceKey).toBe('option:1:label');
  });

  it('ignores a drop onto the same position', () => {
    fixture.componentInstance.drop({ previousIndex: 1, currentIndex: 1 } as never);
    expect(emitted.length).toBe(0);
  });
});
