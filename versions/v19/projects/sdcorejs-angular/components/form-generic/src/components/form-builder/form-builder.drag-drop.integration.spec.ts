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

  afterEach(() => {
    fixture.destroy();
  });

  function palettePlaceholders(): HTMLElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.fb-palette-drop-placeholder')).filter(
      element => {
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      }
    );
  }

  function visibleDropPlaceholders(): HTMLElement[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.fb-palette-drop-placeholder, .cdk-drag-placeholder')
    ).filter(element => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
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

  it('moves one palette preview from the first row to the second and drops once', () => {
    component.components = [field('a', '4'), field('b', '4'), field('c', '8')];
    component.dragDropRows = buildFormBuilderRows(component.components as any) as any;
    fixture.detectChanges();

    const paletteTextfield = component.formBuilderComponents.find(item => item.type === 'textfield')!;
    const firstRow = component.dragDropRows[0];
    const secondRow = component.dragDropRows[1];
    const existingIds = new Set(component.components.map(item => item.id));

    component.onPaletteDragStarted(paletteTextfield);
    component.onRowItemsDropEntered(firstRow, { currentIndex: 0 } as any);
    fixture.detectChanges();
    expect(palettePlaceholders().length).toBe(1);
    expect(visibleDropPlaceholders().length).toBe(1);
    expect(component.paletteDropTarget()).toEqual({ kind: 'inline', rowId: 'row-a', index: 0, columns: '4' });

    component.onRowItemsDropEntered(secondRow, { currentIndex: 0 } as any);
    fixture.detectChanges();

    expect(palettePlaceholders().length).toBe(1);
    expect(visibleDropPlaceholders().length).toBe(1);
    const target = component.paletteDropTarget()!;
    expect(target.kind).toBe('inline');
    if (target.kind !== 'inline') throw new Error('Expected an inline palette target');
    expect(target.rowId).toBe('row-c');
    expect(target.columns).toBe('4');
    const targetRow = component.dragDropRows.find(row => row.id === target.rowId)!;
    const anchor = targetRow.items[target.index] ?? targetRow.items[targetRow.items.length - 1];
    const anchorIndex = component.components.findIndex(item => item.id === anchor.id);
    const expectedIndex = target.index >= targetRow.items.length ? anchorIndex + 1 : anchorIndex;

    component.drop({
      previousContainer: { data: [paletteTextfield] },
      container: { data: secondRow.items },
      previousIndex: 0,
      currentIndex: 0,
      isPointerOverContainer: true,
      item: { data: paletteTextfield, element: { nativeElement: { id: '' } } },
    } as any);
    fixture.detectChanges();

    const createdItems = component.components.filter(item => !existingIds.has(item.id));
    expect(createdItems.length).toBe(1);
    expect(component.components.findIndex(item => item.id === createdItems[0].id)).toBe(expectedIndex);
    expect(createdItems[0].type).toBe('textfield');
    expect((createdItems[0] as any).layout.columns).toBe('4');
    expect(palettePlaceholders().length).toBe(0);
    expect(visibleDropPlaceholders().length).toBe(0);
  });

  it('routes a palette pointer into an empty canvas and applies the CDK drop contract', () => {
    component.components = [];
    component.dragDropRows = [];
    fixture.detectChanges();

    const paletteTextfield = component.formBuilderComponents.find(item => item.type === 'textfield')!;
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

    component.onPaletteDragStarted(paletteTextfield);
    component.onAnyDragMoved({ pointerPosition: { x: 250, y: 250 } } as any);
    fixture.detectChanges();

    expect(component.paletteDropTarget()).toEqual({ kind: 'empty' });
    expect(visibleDropPlaceholders().length).toBe(1);

    component.drop({
      previousContainer: { data: [paletteTextfield] },
      container: { data: component.dragDropRows },
      previousIndex: 0,
      currentIndex: 0,
      isPointerOverContainer: true,
      item: { data: paletteTextfield, element: { nativeElement: { id: '' } } },
    } as any);
    fixture.detectChanges();

    expect(component.components.length).toBe(1);
    expect((component.components[0] as any).layout.columns).toBe('12');
    expect(visibleDropPlaceholders().length).toBe(0);
  });

  it('moves an existing field into a row with capacity through the CDK drop contract', () => {
    component.components = [field('a', '4'), field('b', '4'), field('d', '6'), field('c', '4')];
    component.dragDropRows = buildFormBuilderRows(component.components as any) as any;
    fixture.detectChanges();

    const targetRow = component.dragDropRows[0];
    const sourceRow = component.dragDropRows[1];
    const sourceIndex = sourceRow.items.findIndex(item => item.id === 'c');
    component.drop({
      previousContainer: { data: sourceRow.items },
      container: { data: targetRow.items },
      previousIndex: sourceIndex,
      currentIndex: 1,
      isPointerOverContainer: true,
      item: { data: sourceRow.items[sourceIndex], element: { nativeElement: { id: 'c' } } },
    } as any);
    fixture.detectChanges();

    expect(component.components.map(item => item.id)).toEqual(['a', 'c', 'b', 'd']);
    expect(visibleDropPlaceholders().length).toBe(0);
  });

  it('reorders complete rows through the CDK drop contract', () => {
    component.components = [field('a', '12'), field('b', '12'), field('c', '12')];
    component.dragDropRows = buildFormBuilderRows(component.components as any) as any;
    fixture.detectChanges();

    component.drop({
      previousContainer: { data: component.dragDropRows },
      container: { data: component.dragDropRows },
      previousIndex: 0,
      currentIndex: 1,
      isPointerOverContainer: true,
      item: { data: component.dragDropRows[0], element: { nativeElement: { id: 'row-a' } } },
    } as any);
    fixture.detectChanges();

    expect(visibleDropPlaceholders().length).toBe(0);
    expect(component.components.map(item => item.id)).toEqual(['b', 'a', 'c']);
  });

  it('does not override the inline transform used by CDK sorting', () => {
    const styles = ((SdFormBuilder as any).ɵcmp.styles as string[]).join('\n');
    expect(styles).not.toMatch(/\.cdk-drag-placeholder\.fb-drop-placeholder[\s\S]*?transform:\s*none\s*!important/);
  });
});
