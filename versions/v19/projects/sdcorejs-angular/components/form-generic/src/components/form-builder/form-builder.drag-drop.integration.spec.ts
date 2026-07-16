import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdLicenseService } from '@sdcorejs/angular/services/license';
import { buildFormBuilderRows } from './form-builder-layout';
import { SdFormBuilder } from './form-builder.component';

function field(id: string, columns: string): any {
  return { id, key: `key_${id}`, type: 'textfield', label: id, layout: { columns }, validate: {}, properties: {} };
}

describe('SdFormBuilder drag/drop placeholders', () => {
  let fixture: ComponentFixture<SdFormBuilder>;
  let component: SdFormBuilder;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SdFormBuilder, NoopAnimationsModule],
      providers: [{ provide: SdLicenseService, useValue: { enforceLicense: () => {} } }],
    });
    fixture = TestBed.createComponent(SdFormBuilder);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.components = [field('a', '6'), field('b', '8'), field('c', '6')];
    component.dragDropRows = buildFormBuilderRows(component.components as any) as any;
    fixture.detectChanges();
  });

  function palettePlaceholders(): HTMLElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.fb-palette-drop-placeholder')).filter(
      element => {
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      }
    );
  }

  it('replaces the rendered inline palette placeholder instead of retaining the first row preview', () => {
    const paletteTextfield = component.formBuilderComponents.find(item => item.type === 'textfield')!;
    component.onPaletteDragStarted(paletteTextfield);

    component.onRowItemsDropEntered(component.dragDropRows[0], { currentIndex: 1 } as any);
    fixture.detectChanges();

    let placeholders = palettePlaceholders();
    expect(placeholders.length).toBe(1);
    expect(placeholders[0].closest('.fb-row')?.id).toBe('row-a');

    component.onRowItemsDropEntered(component.dragDropRows[1], { currentIndex: 0 } as any);
    fixture.detectChanges();

    placeholders = palettePlaceholders();
    expect(placeholders.length).toBe(1);
    expect(placeholders[0].closest('.fb-row')?.id).toBe('row-b');
  });

  it('renders and consumes one empty-canvas target', () => {
    const paletteTextfield = component.formBuilderComponents.find(item => item.type === 'textfield')!;
    component.components = [];
    component.dragDropRows = [];
    component.onPaletteDragStarted(paletteTextfield);
    component.paletteDropTarget.set({ kind: 'empty' });
    fixture.detectChanges();

    const placeholders = palettePlaceholders();
    expect(placeholders.length).toBe(1);
    expect(placeholders[0].classList).toContain('fb-row-insert-placeholder');

    component.drop({
      previousContainer: { data: [paletteTextfield] },
      container: { data: component.dragDropRows },
      previousIndex: 0,
      currentIndex: 0,
      isPointerOverContainer: true,
      item: {
        data: paletteTextfield,
        element: { nativeElement: { id: '' } },
      },
    } as any);
    fixture.detectChanges();

    expect(component.components.length).toBe(1);
    expect((component.components[0] as any).layout.columns).toBe('12');
    expect(component.paletteDropTarget()).toBeUndefined();
  });

  it('clears the palette preview immediately when the pointer leaves the canvas', () => {
    const canvas = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('#frmComponent')!;
    spyOn(canvas, 'getBoundingClientRect').and.returnValue({
      left: 0,
      top: 0,
      right: 500,
      bottom: 500,
      width: 500,
      height: 500,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    const paletteTextfield = component.formBuilderComponents.find(item => item.type === 'textfield')!;
    component.onPaletteDragStarted(paletteTextfield);
    component.paletteDropTarget.set({ kind: 'inline', rowId: 'row-a', index: 1, columns: '6' });
    fixture.detectChanges();
    expect(palettePlaceholders().length).toBe(1);

    component.onAnyDragMoved({ pointerPosition: { x: 501, y: 501 } } as any);
    fixture.detectChanges();

    expect(component.paletteDropTarget()).toBeUndefined();
    expect(palettePlaceholders().length).toBe(0);
  });

  it('removes every custom palette placeholder after drag end', fakeAsync(() => {
    const paletteTextfield = component.formBuilderComponents.find(item => item.type === 'textfield')!;
    component.onPaletteDragStarted(paletteTextfield);
    component.onRowItemsDropEntered(component.dragDropRows[0], { currentIndex: 1 } as any);
    fixture.detectChanges();
    expect(palettePlaceholders().length).toBe(1);

    component.onAnyDragEnded();
    tick(0);
    fixture.detectChanges();

    expect(palettePlaceholders().length).toBe(0);
  }));
});
