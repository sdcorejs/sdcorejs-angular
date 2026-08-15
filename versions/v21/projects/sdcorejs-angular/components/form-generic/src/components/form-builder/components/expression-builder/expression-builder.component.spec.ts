import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ExpressionBuilderComponent } from './expression-builder.component';

describe('ExpressionBuilderComponent', () => {
  let fixture: ComponentFixture<ExpressionBuilderComponent>;
  let component: ExpressionBuilderComponent;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [ExpressionBuilderComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpressionBuilderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('attributes', [
      { value: 'name', display: 'Tên', type: 'string' },
      { value: 'age', display: 'Tuổi', type: 'number' },
    ]);
    fixture.componentRef.setInput('model', { combinator: '&&', conditions: [] });
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  // why: nút xoá của điều kiện CẤP 2 từng truyền `idxLv1` (index của nhóm ở cấp 1) vào mảng con,
  // nên bấm xoá dòng con thứ hai lại xoá dòng đầu — hoặc không xoá gì khi nhóm đứng ở vị trí lớn
  // hơn số con. `remove` chỉ nhận (mảng, index) nên chốt hành vi ngay tại đây.
  it('removes exactly the requested index from the given condition list', () => {
    const conditions = component.expression!.conditions;
    component.addCondition(conditions);
    component.addCondition(conditions);
    component.addCondition(conditions);

    const keptFirst = conditions[0].key;
    const keptLast = conditions[2].key;

    component.remove(conditions, 1);

    expect(conditions.length).toBe(2);
    expect(conditions.map(c => c.key)).toEqual([keptFirst, keptLast]);
  });

  it('removes a nested condition from its own group, not from the parent list', () => {
    const root = component.expression!.conditions;
    component.addCondition(root); // index 0 ở cấp 1
    component.addCombinator(root); // index 1 ở cấp 1 — nhóm chứa các điều kiện con

    const group = root[1] as { conditions: { key: string }[] };
    component.addCondition(group.conditions as never);
    component.addCondition(group.conditions as never);

    const keptChild = group.conditions[0].key;

    // Bấm xoá dòng con THỨ HAI: index trong mảng con là 1 (trước đây code truyền nhầm idx của cha).
    component.remove(group.conditions as never, 1);

    expect(root.length).withContext('parent list must be untouched').toBe(2);
    expect(group.conditions.length).toBe(1);
    expect(group.conditions[0].key).toBe(keptChild);
  });
});
