import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdLicenseService } from '@sdcorejs/angular/services/license';

import { SdFormBuilder } from './form-builder.component';

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
