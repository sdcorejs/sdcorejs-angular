import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdTree } from './tree.component';

describe('SdTree hierarchy presentation', () => {
  const leaf = (id: string) => ({ id, label: id, data: id });
  const items = [
    { ...leaf('root'), children: [{ ...leaf('branch'), children: [leaf('deep')] }, leaf('last')] },
    { ...leaf('other'), children: [leaf('only')] },
  ];

  function setup(showLines: unknown = false) {
    TestBed.configureTestingModule({ imports: [SdTree, NoopAnimationsModule] });
    const fixture = TestBed.createComponent(SdTree<string>);
    fixture.componentRef.setInput('option', { items, tree: { loadType: 'static', defaultExpanded: true, indentSize: 24 } });
    fixture.componentRef.setInput('showLines', showLines);
    fixture.detectChanges();
    return fixture;
  }

  it('defaults to no lines, coerces the attribute and keeps parent labels stronger than leaves', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('.sd-tree__lines')).toBeNull();
    const labels = fixture.nativeElement.querySelectorAll('.sd-tree__label');
    expect(getComputedStyle(labels[0]).fontWeight).toBe('600');
    expect(getComputedStyle(labels[2]).fontWeight).toBe('400');
    fixture.componentRef.setInput('showLines', '');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-tree__line')).not.toBeNull();
    fixture.componentRef.setInput('showLines', 'false');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-tree__lines')).toBeNull();
    fixture.destroy();
  });

  it('connects visible descendants and stops at the last sibling after filtering and collapse', () => {
    const fixture = setup(true);
    const tree = fixture.componentInstance;
    expect(tree.treeLines().get('deep')?.segments).toEqual([
      { level: 1, branch: true, last: true },
      { level: 0, branch: false, last: false },
    ]);
    expect(tree.treeLines().get('last')?.segments).toEqual([{ level: 0, branch: true, last: true }]);
    expect(tree.treeLines().get('other')?.segments).toEqual([]);
    tree.filter('deep');
    fixture.detectChanges();
    expect(tree.treeLines().get('branch')?.segments).toEqual([{ level: 0, branch: true, last: true }]);
    expect(tree.treeLines().get('deep')?.segments).toEqual([{ level: 1, branch: true, last: true }]);
    tree.filter('');
    void tree.toggle(tree.rootNodes()[0]);
    fixture.detectChanges();
    expect(tree.treeLines().has('branch')).toBeFalse();
    expect(tree.treeLines().get('root')?.children).toBeFalse();
    fixture.destroy();
  });

  it('uses decorative lines without changing indentation, row height or expansion icon color', () => {
    const fixture = setup();
    const rows = fixture.nativeElement.querySelectorAll('.sd-tree__row');
    const before = Array.from(rows as NodeListOf<HTMLElement>).map(row => row.getBoundingClientRect().height);
    const toggle = rows[0].querySelector('.sd-tree__toggle');
    const toggleColor = getComputedStyle(toggle).color;
    fixture.componentRef.setInput('showLines', true);
    fixture.detectChanges();
    expect(Array.from(rows as NodeListOf<HTMLElement>).map(row => row.getBoundingClientRect().height)).toEqual(before);
    expect(getComputedStyle(rows[1]).paddingLeft).toBe('28px');
    const decoration = rows[1].querySelector('.sd-tree__lines');
    expect(decoration.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(decoration).pointerEvents).toBe('none');
    const lastLine = rows[3].querySelector('.sd-tree__line--last');
    expect(getComputedStyle(lastLine).height).toBe('22px');
    toggle.click();
    fixture.detectChanges();
    expect(getComputedStyle(toggle).color).toBe(toggleColor);
    fixture.destroy();
  });

  it('honors option precedence and draws lazy branches only after children load', async () => {
    const fixture = setup(true);
    fixture.componentRef.setInput('option', {
      showLines: false,
      items: [{ ...leaf('lazy'), hasChildren: true }],
      tree: { loadType: 'lazy', onExpandChildren: async () => [leaf('loaded')] },
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.resolvedShowLines()).toBeFalse();
    fixture.componentRef.setInput('option', {
      showLines: true,
      items: [{ ...leaf('lazy'), hasChildren: true }],
      tree: { loadType: 'lazy', onExpandChildren: async () => [{ ...leaf('loaded'), hasChildren: false }] },
    });
    fixture.detectChanges();
    const tree = fixture.componentInstance;
    expect(tree.treeLines().get('lazy')?.children).toBeFalse();
    await tree.toggle(tree.rootNodes()[0]);
    fixture.detectChanges();
    expect(tree.treeLines().get('lazy')?.children).toBeTrue();
    expect(tree.treeLines().get('loaded')?.segments).toEqual([{ level: 0, branch: true, last: true }]);
    fixture.destroy();
  });
});
