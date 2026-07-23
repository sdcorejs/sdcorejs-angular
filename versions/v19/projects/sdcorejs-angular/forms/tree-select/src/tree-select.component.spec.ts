import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdTreeItemLazy, SdTreeItemStatic, SdTreeSelectionEvent } from '@sdcorejs/angular/components/tree';
import { SdTreeSelect } from './tree-select.component';

interface Department {
  id: number;
  name: string;
}

const CHILD: Department = { id: 2, name: 'Accounts payable' };
const ROOT: Department = { id: 1, name: 'Finance' };
const STATIC_ITEMS: SdTreeItemStatic<Department>[] = [
  { id: 'finance', label: ROOT.name, data: ROOT, children: [{ id: 'payable', label: CHILD.name, data: CHILD }] },
];

describe('SdTreeSelect', () => {
  let fixture: ComponentFixture<SdTreeSelect<Department, number>>;
  let component: SdTreeSelect<Department, number>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule, SdTreeSelect] }).compileComponents();
    fixture = TestBed.createComponent(SdTreeSelect<Department, number>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', STATIC_ITEMS);
    fixture.componentRef.setInput('valueField', 'id');
    fixture.componentRef.setInput('displayField', 'name');
  });

  it('applies single and multiple stable-key selections', () => {
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('model', [1]);
    fixture.detectChanges();
    component.open();
    component.onTreeSelection(selectionEvent(CHILD, true, [ROOT, CHILD]));
    component.applySelection();
    expect(component.model()).toEqual([1, 2]);

    fixture.componentRef.setInput('multiple', false);
    fixture.componentRef.setInput('model', 1);
    fixture.detectChanges();
    component.open();
    component.onTreeSelection(selectionEvent(CHILD, true, [CHILD]));
    component.applySelection();
    expect(component.model()).toBe(2);
  });

  it('preserves unloaded initial keys while loaded nodes are selected and filtered', () => {
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('model', [99]);
    fixture.detectChanges();
    component.open();

    component.onTreeSelection(selectionEvent(CHILD, true, [CHILD]));
    component.filter('accounts');
    component.applySelection();

    expect(component.model()).toEqual([99, 2]);
    expect(component.displayText()).toContain('99');
  });

  it('passes configured cascade and disabled-node policies to SdTree', () => {
    fixture.componentRef.setInput('cascade', 'descendants');
    fixture.componentRef.setInput('disabledNode', (item: Department) => item.id === 2);
    fixture.detectChanges();

    expect(component.treeOption().selector?.cascade).toBe('descendants');
    expect(component.treeOption().selector?.disabled?.(CHILD, [])).toBeTrue();
  });

  it('registers with a parent FormGroup and supports disabled/viewed state', () => {
    const form = new FormGroup({});
    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('name', 'departmentId');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    expect(form.get('departmentId')).toBe(component.formControl);
    expect(component.formControl.disabled).toBeTrue();
    expect((fixture.nativeElement.querySelector('[data-tree-select-trigger]') as HTMLButtonElement).disabled).toBeTrue();

    fixture.componentRef.setInput('disabled', false);
    fixture.componentRef.setInput('viewed', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-tree-select-trigger]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-tree-select-view]')).not.toBeNull();
  });

  it('retains keys for lazy children that have not loaded yet', () => {
    const lazyItems: SdTreeItemLazy<Department>[] = [{ id: 'finance', label: ROOT.name, data: ROOT, hasChildren: true }];
    fixture.componentRef.setInput('items', lazyItems);
    fixture.componentRef.setInput('tree', { loadType: 'lazy', onExpandChildren: () => [] });
    fixture.componentRef.setInput('multiple', true);
    fixture.componentRef.setInput('model', [2]);
    fixture.detectChanges();
    component.open();
    component.applySelection();

    expect(component.model()).toEqual([2]);
  });

  it('forwards root and lazy load errors from the composed tree', async () => {
    const error = new Error('tree failed');
    const loadError = jasmine.createSpy('loadError');
    component.sdLoadError.subscribe(loadError);
    fixture.componentRef.setInput('items', () => Promise.reject(error));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(loadError).toHaveBeenCalledOnceWith({ error });
  });
});

function selectionEvent(item: Department, selected: boolean, selectedItems: Department[]): SdTreeSelectionEvent<Department> {
  return { item, selected, selectedItems };
}
