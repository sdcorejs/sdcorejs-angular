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

  function center(element: Element): { x: number; y: number } {
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function dispatchMouse(target: EventTarget, type: string, point: { x: number; y: number }, buttons: number): void {
    target.dispatchEvent(
      new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        detail: 1,
        clientX: point.x,
        clientY: point.y,
        button: 0,
        buttons,
      })
    );
  }

  function startMouseDrag(source: Element): void {
    const start = center(source);
    dispatchMouse(source, 'mousedown', start, 1);
    dispatchMouse(document, 'mousemove', { x: start.x + 12, y: start.y + 12 }, 1);
    tick(20);
  }

  function moveMouseTo(element: Element): void {
    dispatchMouse(document, 'mousemove', center(element), 1);
    tick(20);
    fixture.detectChanges();
  }

  function moveMouseToPoint(point: { x: number; y: number }): void {
    dispatchMouse(document, 'mousemove', point, 1);
    tick(20);
    fixture.detectChanges();
  }

  function endMouseDrag(element: Element): void {
    dispatchMouse(document, 'mouseup', center(element), 0);
    tick(0);
    fixture.detectChanges();
  }

  function endMouseDragAtPoint(point: { x: number; y: number }): void {
    dispatchMouse(document, 'mouseup', point, 0);
    tick(0);
    fixture.detectChanges();
  }

  function visibleCdkPlaceholders(): HTMLElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.cdk-drag-placeholder')).filter(element => {
      const style = getComputedStyle(element);
      return (
        !element.classList.contains('fb-palette-native-placeholder') &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      );
    });
  }

  function visibleDropPlaceholders(): HTMLElement[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.fb-palette-drop-placeholder, .cdk-drag-placeholder')
    ).filter(element => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
  }

  function placeholderPose(element: HTMLElement): string {
    const rect = element.getBoundingClientRect();
    return `${Math.round(rect.left)}:${Math.round(rect.top)}:${getComputedStyle(element).transform}`;
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

  it('moves one palette preview from the first row to the second and drops once', fakeAsync(() => {
    component.components = [field('a', '4'), field('b', '4'), field('c', '8')];
    component.dragDropRows = buildFormBuilderRows(component.components as any) as any;
    fixture.detectChanges();

    const paletteItem = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.fb-palette-item')!;
    const firstRowItems = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('#row-a .fb-row__items')!;
    const firstRowHandle = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('#row-a .fb-row__drag')!;
    const secondRowItems = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('#row-c .fb-row__items')!;
    const firstItem = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('#a')!;
    const existingIds = new Set(component.components.map(item => item.id));

    startMouseDrag(paletteItem);
    moveMouseTo(firstItem);
    expect(component.paletteDropTarget()).toEqual(jasmine.objectContaining({ kind: 'inline', rowId: 'row-a' }));
    let firstRowRect = firstRowItems.getBoundingClientRect();
    const firstRowHandleRect = firstRowHandle.getBoundingClientRect();
    const firstSortPoint = {
      x: Math.max(firstRowRect.left + 2, firstRowHandleRect.right + 2),
      y: firstRowRect.top + 4,
    };
    moveMouseToPoint(firstSortPoint);

    expect(palettePlaceholders().length).toBe(1);
    expect(visibleDropPlaceholders().length).toBe(1);
    const nativePlaceholder = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.fb-palette-native-placeholder.cdk-drag-placeholder'
    )!;
    const nativePlaceholderRect = nativePlaceholder.getBoundingClientRect();
    expect(nativePlaceholderRect.width).toBeGreaterThan(0);
    expect(nativePlaceholderRect.height).toBeGreaterThan(0);
    expect(getComputedStyle(nativePlaceholder).visibility).toBe('hidden');
    expect(component.paletteDropTarget()).toEqual({ kind: 'inline', rowId: 'row-a', index: 0, columns: '4' });

    firstRowRect = firstRowItems.getBoundingClientRect();
    moveMouseToPoint({ x: firstRowRect.right - 2, y: firstRowRect.top + 4 });

    expect(palettePlaceholders().length).toBe(1);
    expect(visibleDropPlaceholders().length).toBe(1);
    expect(component.paletteDropTarget()).toEqual({ kind: 'inline', rowId: 'row-a', index: 2, columns: '4' });

    moveMouseTo(secondRowItems);

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

    endMouseDrag(secondRowItems);

    const createdItems = component.components.filter(item => !existingIds.has(item.id));
    expect(createdItems.length).toBe(1);
    expect(component.components.findIndex(item => item.id === createdItems[0].id)).toBe(expectedIndex);
    expect(createdItems[0].type).toBe('textfield');
    expect((createdItems[0] as any).layout.columns).toBe('4');
    expect(palettePlaceholders().length).toBe(0);
    expect(visibleDropPlaceholders().length).toBe(0);
  }));

  it('drags a palette field into an empty canvas through the real CDK container', fakeAsync(() => {
    component.components = [];
    component.dragDropRows = [];
    fixture.detectChanges();

    const paletteItem = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.fb-palette-item')!;
    const canvas = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('#frmComponent')!;

    startMouseDrag(paletteItem);
    moveMouseTo(canvas);

    expect(component.paletteDropTarget()).toEqual({ kind: 'empty' });
    expect(visibleDropPlaceholders().length).toBe(1);

    moveMouseTo(canvas);

    expect(visibleDropPlaceholders().length).toBe(1);
    endMouseDrag(canvas);

    expect(component.components.length).toBe(1);
    expect((component.components[0] as any).layout.columns).toBe('12');
    expect(visibleDropPlaceholders().length).toBe(0);
  }));

  it('lets the CDK placeholder follow an existing field into a row with capacity', fakeAsync(() => {
    component.components = [field('a', '4'), field('b', '4'), field('d', '6'), field('c', '4')];
    component.dragDropRows = buildFormBuilderRows(component.components as any) as any;
    fixture.detectChanges();

    const source = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('#c')!;
    const targetItem = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('#b')!;

    startMouseDrag(source);
    fixture.detectChanges();

    let placeholders = visibleCdkPlaceholders();
    expect(placeholders.length).toBe(1);
    expect(placeholders[0].closest('.fb-row')?.id).toBe('row-d');

    moveMouseTo(targetItem);

    placeholders = visibleCdkPlaceholders();
    expect(placeholders.length).toBe(1);
    expect(placeholders[0].closest('.fb-row')?.id).toBe('row-a');

    endMouseDrag(targetItem);

    expect(component.components.map(item => item.id)).toEqual(['a', 'c', 'b', 'd']);
    expect(visibleDropPlaceholders().length).toBe(0);
  }));

  it('lets the CDK row placeholder move down and back up before the final drop', fakeAsync(() => {
    component.components = [field('a', '12'), field('b', '12'), field('c', '12')];
    component.dragDropRows = buildFormBuilderRows(component.components as any) as any;
    fixture.detectChanges();

    const rows = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.fb-row'));
    const handle = rows[0].querySelector<HTMLElement>('.fb-row__drag')!;

    startMouseDrag(handle);
    moveMouseTo(rows[2]);

    let placeholders = visibleCdkPlaceholders();
    expect(placeholders.length).toBe(1);
    const downPose = placeholderPose(placeholders[0]);

    const rowCRect = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('#row-c')!.getBoundingClientRect();
    const upPoint = { x: rowCRect.left + rowCRect.width / 2, y: rowCRect.top + rowCRect.height / 4 };
    moveMouseToPoint(upPoint);

    placeholders = visibleCdkPlaceholders();
    expect(placeholders.length).toBe(1);
    const upPose = placeholderPose(placeholders[0]);
    expect(upPose).not.toBe(downPose);

    endMouseDragAtPoint(upPoint);

    expect(visibleDropPlaceholders().length).toBe(0);
    expect(component.components.map(item => item.id)).toEqual(['b', 'a', 'c']);
  }));

  it('does not override the inline transform used by CDK sorting', () => {
    const styles = ((SdFormBuilder as any).ɵcmp.styles as string[]).join('\n');
    expect(styles).not.toMatch(/\.cdk-drag-placeholder\.fb-drop-placeholder[\s\S]*?transform:\s*none\s*!important/);
  });
});
