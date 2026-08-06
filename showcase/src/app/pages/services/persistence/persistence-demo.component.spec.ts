import { TestBed } from '@angular/core/testing';
import { PersistenceDemoComponent } from './persistence-demo.component';

describe('PersistenceDemoComponent', () => {
  it('renders graph, identity, envelope and containment examples', async () => {
    await TestBed.configureTestingModule({ imports: [PersistenceDemoComponent] }).compileComponents();
    const fixture = TestBed.createComponent(PersistenceDemoComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const text = element.textContent ?? '';
    expect(element.querySelectorAll('demo-section')).toHaveSize(4);
    expect(text).toContain('Date: true');
    expect(text).toContain('Map: true');
    expect(text).toContain('Set: true');
    expect(text).toContain('Shared reference: true');
    expect(text).toContain('Circular reference: true');
    expect(text).toContain('Stable identity: true');
    expect(text).toContain('Envelope payload: Finance');
    expect(text).toContain('Invalid document rejected: true');
  });
});
