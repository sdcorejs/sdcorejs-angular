import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdLicenseService } from '@sdcorejs/angular/services/license';

import { SdFormBuilder } from './form-builder.component';
import { buildFormBuilderRows } from './form-builder-layout';

// ---------------------------------------------------------------------------
// Group drill-in (Detail) — replaces in-group drag/drop.
// Pure component-level tests: set `components` directly and drive the public
// handlers. No template render (avoids heavy child deps) and no input-debounce.
// ---------------------------------------------------------------------------

/** Top-level schema: a plain field + a group `g1` holding one child `c1`. */
function buildSchema(): any[] {
  return [
    { id: 't1', key: 'k_t1', type: 'textfield', label: 'Top field', layout: { columns: '12' }, validate: {}, properties: {} },
    {
      id: 'g1',
      type: 'group',
      label: 'Group 1',
      layout: { columns: '12' },
      components: [{ id: 'c1', key: 'k_c1', type: 'textfield', label: 'Child 1', layout: { columns: '12' }, validate: {}, properties: {} }],
      properties: { icon: 'category', color: 'primary' },
    },
  ];
}

describe('SdFormBuilder — group drill-in (Detail)', () => {
  let fixture: ComponentFixture<SdFormBuilder>;
  let component: SdFormBuilder;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SdFormBuilder, NoopAnimationsModule],
      // why: SdBaseSecureComponent gọi licenseService.enforceLicense() trong constructor.
      providers: [{ provide: SdLicenseService, useValue: { enforceLicense: () => {} } }],
    });
    fixture = TestBed.createComponent(SdFormBuilder);
    component = fixture.componentInstance;
    // KHÔNG detectChanges: tránh render template + bỏ qua input-debounce; set scope trực tiếp.
    component.components = buildSchema();
  });

  function group1(): any {
    return component.components.find((c: any) => c.id === 'g1');
  }
  function paletteHasGroup(): boolean {
    return component.paletteGroups().some(g => g.items.some(i => i.type === 'group'));
  }

  it('enterGroupEdit() focuses the group: editingGroupId + rows scoped to its children', () => {
    // asserts: drill-in points the canvas at the group's children and clears selection
    const g = group1();
    component.enterGroupEdit(g);
    expect(component.editingGroupId()).toBe('g1');
    expect(component.editingGroup()).toBe(g);
    expect(component.selectedComponent()).toBeUndefined();
    expect(component.dragDropRows.flatMap(r => r.items).map((i: any) => i.id)).toEqual(['c1']);
  });

  it('enterGroupEdit() creates stable row ids from the schema item ids, not row indexes', () => {
    const g = group1();
    g.components.push({ id: 'c2', key: 'k_c2', type: 'number', label: 'Child 2', layout: { columns: '12' }, validate: {}, properties: {} });

    component.enterGroupEdit(g);

    expect(component.dragDropRows.map((row: any) => row.id)).toEqual(['row-c1', 'row-c2']);
  });

  it('addComponent() while editing pushes into the GROUP, not the top level', () => {
    // asserts: scope is the group — new fields land in g1.components, top level untouched
    const g = group1();
    component.enterGroupEdit(g);
    const tf = component.formBuilderComponents.find(c => c.type === 'textfield')!;
    component.addComponent(tf);
    expect(g.components.length).toBe(2);
    expect(component.components.length).toBe(2); // still [t1, g1]
  });

  it('palette hides the Group item while editing, restores it after exit', () => {
    // asserts: no group-in-group — the Group palette item is gone inside a group
    expect(paletteHasGroup()).toBeTrue();
    component.enterGroupEdit(group1());
    expect(paletteHasGroup()).toBeFalse();
    component.confirmGroupEdit();
    expect(paletteHasGroup()).toBeTrue();
  });

  it('adding a Group while editing is a no-op (blocked group-in-group)', () => {
    // asserts: defense-in-depth — even if invoked, addComponent ignores a group in drill-in
    const g = group1();
    component.enterGroupEdit(g);
    const grp = component.formBuilderComponents.find(c => c.type === 'group')!;
    const before = g.components.length;
    component.addComponent(grp);
    expect(g.components.length).toBe(before);
  });

  it('confirmGroupEdit() keeps the edits and returns to the main canvas', () => {
    const g = group1();
    component.enterGroupEdit(g);
    component.addComponent(component.formBuilderComponents.find(c => c.type === 'number')!);
    expect(g.components.length).toBe(2);
    component.confirmGroupEdit();
    expect(component.editingGroupId()).toBeUndefined();
    expect(group1().components.length).toBe(2); // kept
  });

  it('cancelGroupEdit() reverts the group to its pre-entry snapshot and exits', () => {
    const g = group1();
    component.enterGroupEdit(g);
    component.addComponent(component.formBuilderComponents.find(c => c.type === 'number')!);
    expect(g.components.length).toBe(2);
    component.cancelGroupEdit();
    expect(component.editingGroupId()).toBeUndefined();
    expect(group1().components.length).toBe(1); // reverted
    expect(group1().components[0].id).toBe('c1');
  });

  it('removeComponent() while editing removes from the group scope only', () => {
    const g = group1();
    component.enterGroupEdit(g);
    component.removeComponent('c1');
    expect(g.components.length).toBe(0);
    expect(component.components.length).toBe(2); // top level unchanged
  });

  it('tracks resize state while a column handle is being dragged', () => {
    const item = component.components[0] as any;
    item.layout.columns = '6';
    component.dragDropRows = buildFormBuilderRows(component.components as any) as any;
    const row = component.dragDropRows[0];

    component.startResizeControl(item, row);

    expect(component.isResizing()).toBeTrue();
    expect(component.resizeState()).toEqual({ itemId: 't1', rowId: 'row-t1', columns: '6' });

    component.endResizeControl({} as any);

    expect(component.isResizing()).toBeFalse();
    expect(component.resizeState()).toBeUndefined();
  });

  it('uses Material Icons Outlined instead of Material Symbols for builder glyphs', () => {
    const styles = ((SdFormBuilder as any).ɵcmp.styles as string[]).join('\n');

    expect(styles).toContain('Material Icons Outlined');
    expect(styles).not.toContain('Material Symbols Rounded');
  });

  it('keeps palette drops in the indicated row when that row has free columns', () => {
    const paletteTextfield = component.formBuilderComponents.find(c => c.type === 'textfield')!;
    component.components = [
      { id: 'a', key: 'k_a', type: 'textfield', label: 'A', layout: { columns: '6' }, validate: {}, properties: {} },
    ] as any;
    component.dragDropRows = buildFormBuilderRows(component.components as any) as any;

    component.drop({
      previousContainer: { data: [paletteTextfield] },
      container: { data: component.dragDropRows[0].items },
      previousIndex: 0,
      currentIndex: 1,
      isPointerOverContainer: true,
      item: { element: { nativeElement: { id: '' } } },
    } as any);

    expect(component.components.map((item: any) => item.layout.columns)).toEqual(['6', '6']);
    expect(component.dragDropRows[0].items.length).toBe(2);
  });

  it('uses the dragged palette data instead of the first palette item when creating a component', () => {
    const advancedPaletteItems = component.formBuilderComponents.filter(c => c.group === 'advanced');
    const chipCalendar = component.formBuilderComponents.find(c => c.type === 'chip-calendar')!;
    const upload = component.formBuilderComponents.find(c => c.type === 'upload')!;
    component.components = [
      { id: 'a', key: 'k_a', type: 'textfield', label: 'A', layout: { columns: '6' }, validate: {}, properties: {} },
    ] as any;
    component.dragDropRows = buildFormBuilderRows(component.components as any) as any;

    for (const draggedItem of [chipCalendar, upload]) {
      component.drop({
        previousContainer: { data: advancedPaletteItems },
        container: { data: component.dragDropRows[0].items },
        previousIndex: 0,
        currentIndex: 1,
        isPointerOverContainer: true,
        item: {
          data: draggedItem,
          element: { nativeElement: { id: '' } },
        },
      } as any);
    }

    expect(component.components.map((item: any) => item.type)).toEqual(['textfield', 'chip-calendar', 'upload']);
  });

  it('places palette drops after a full row instead of splitting its items', () => {
    const paletteTextfield = component.formBuilderComponents.find(c => c.type === 'textfield')!;
    component.components = [
      { id: 'a', key: 'k_a', type: 'textfield', label: 'A', layout: { columns: '6' }, validate: {}, properties: {} },
      { id: 'b', key: 'k_b', type: 'textfield', label: 'B', layout: { columns: '6' }, validate: {}, properties: {} },
    ] as any;
    component.dragDropRows = buildFormBuilderRows(component.components as any) as any;

    component.drop({
      previousContainer: { data: [paletteTextfield] },
      container: { data: component.dragDropRows[0].items },
      previousIndex: 0,
      currentIndex: 1,
      isPointerOverContainer: true,
      item: { element: { nativeElement: { id: '' } } },
    } as any);

    expect(component.components.slice(0, 2).map((item: any) => item.id)).toEqual(['a', 'b']);
    expect((component.components[2] as any).layout.columns).toBe('12');
    expect(component.dragDropRows[0].items.map((item: any) => item.id)).toEqual(['a', 'b']);
    expect(component.dragDropRows[1].items.length).toBe(1);
  });

  it('does not draw a second row-level drop rail on top of the CDK placeholder', () => {
    const styles = ((SdFormBuilder as any).ɵcmp.styles as string[]).join('\n');

    expect(styles).not.toContain('is-drag-target::after');
  });

  it('uses text-free skeleton drag previews instead of icon/name ligature text', () => {
    const styles = ((SdFormBuilder as any).ɵcmp.styles as string[]).join('\n');

    expect(styles).toContain('fb-drag-preview__glyph');
    expect(styles).toContain('fb-drag-preview__line');
    expect(styles).not.toContain('span:not(.msi)');
  });

  it('renders dashed content placeholders instead of rail-only drop indicators', () => {
    const styles = ((SdFormBuilder as any).ɵcmp.styles as string[]).join('\n');

    expect(styles).toContain('.fb-drop-placeholder');
    expect(styles).toContain('border: 1.5px dashed');
    expect(styles).not.toContain('.cdk-drag-placeholder::before');
  });

  it('blocks existing items from entering rows where their columns cannot fit', () => {
    component.components = [
      { id: 'a', key: 'k_a', type: 'textfield', label: 'A', layout: { columns: '8' }, validate: {}, properties: {} },
      { id: 'b', key: 'k_b', type: 'textfield', label: 'B', layout: { columns: '6' }, validate: {}, properties: {} },
    ] as any;
    component.dragDropRows = buildFormBuilderRows(component.components as any) as any;

    expect(
      component.canEnterRowDropList({ data: component.components[1] } as any, { data: component.dragDropRows[0].items } as any)
    ).toBeFalse();
    expect(
      component.canEnterRowDropList({ data: component.components[0] } as any, { data: component.dragDropRows[0].items } as any)
    ).toBeTrue();
  });

  it('blocks palette inline drops on full rows so the placeholder matches the after-row insertion', () => {
    const paletteTextfield = component.formBuilderComponents.find(c => c.type === 'textfield')!;
    component.components = [
      { id: 'a', key: 'k_a', type: 'textfield', label: 'A', layout: { columns: '6' }, validate: {}, properties: {} },
      { id: 'b', key: 'k_b', type: 'textfield', label: 'B', layout: { columns: '6' }, validate: {}, properties: {} },
    ] as any;
    component.dragDropRows = buildFormBuilderRows(component.components as any) as any;

    expect(component.canEnterRowDropList({ data: paletteTextfield } as any, { data: component.dragDropRows[0].items } as any)).toBeFalse();
  });

  it('onDuplicate() regenerates nested child ids and keys when duplicating a group', () => {
    const g = group1();

    component.onDuplicate(g);

    const duplicated = component.components[component.components.length - 1] as any;
    expect(duplicated.id).not.toBe(g.id);
    expect(duplicated.components[0].id).not.toBe(g.components[0].id);
    expect(duplicated.components[0].key).not.toBe(g.components[0].key);
    expect(duplicated.components[0].label).toBe(g.components[0].label);
  });
});
