import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TreeSelectDemoComponent } from './tree-select-demo.component';

describe('TreeSelectDemoComponent', () => {
  it('renders static, cascade, lazy and unloaded-key/viewed examples', async () => {
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule, TreeSelectDemoComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TreeSelectDemoComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('demo-section')).toHaveSize(4);
    expect(element.querySelectorAll('sd-tree-select')).toHaveSize(4);
    expect(element.querySelector('[data-tree-select-view]')?.textContent).toContain('99');
  });
});
