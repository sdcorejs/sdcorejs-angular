import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdSplitterPanelComponent } from './splitter-panel.component';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdSplitterPanelComponent],
  template: `
    <sd-splitter-panel
      [panelId]="id()"
      [size]="size()"
      [unit]="unit()"
      [minSize]="minSize()"
      [maxSize]="maxSize()"
      [collapsible]="collapsible()"
      [(collapsed)]="collapsed"
      [resizable]="resizable()">
      <span>content</span>
    </sd-splitter-panel>
  `,
})
class Host {
  id = signal<string | undefined>('sidebar');
  size = signal(250);
  unit = signal<'px' | 'flex'>('px');
  minSize = signal(0);
  maxSize = signal<number | undefined>(undefined);
  collapsible = signal(true);
  collapsed = signal(false);
  resizable = signal(true);
}

describe('SdSplitterPanelComponent', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let panelEl: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    panelEl = fixture.debugElement.query(By.css('sd-splitter-panel')).nativeElement;
  });

  it('renders content qua ng-content', () => {
    expect(panelEl.textContent).toContain('content');
  });

  it('expose inputs qua signal-based getters', () => {
    const cmp = fixture.debugElement.query(By.directive(SdSplitterPanelComponent)).componentInstance as SdSplitterPanelComponent;
    expect(cmp.panelId()).toBe('sidebar');
    expect(cmp.size()).toBe(250);
    expect(cmp.unit()).toBe('px');
    expect(cmp.collapsible()).toBe(true);
    expect(cmp.resizable()).toBe(true);
  });

  it('host element có class sd-splitter__panel', () => {
    expect(panelEl.classList.contains('sd-splitter__panel')).toBe(true);
  });

  it('two-way binding [(collapsed)] đồng bộ với host signal', () => {
    const cmp = fixture.debugElement.query(By.directive(SdSplitterPanelComponent)).componentInstance as SdSplitterPanelComponent;
    cmp.collapsed.set(true);
    fixture.detectChanges();
    expect(host.collapsed()).toBe(true);
  });
});
