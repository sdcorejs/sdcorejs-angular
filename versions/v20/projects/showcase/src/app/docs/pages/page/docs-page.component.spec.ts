import { Component, input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DocsVersionService } from '../../core/docs-version.service';
import { DocExample } from '../../core/documentation.models';
import { PublishedDocsService } from '../../core/published-docs.service';
import { ExampleViewerComponent } from '../../shared/example-viewer.component';
import { DocsPageComponent } from './docs-page.component';

@Component({
  selector: 'docs-example-viewer',
  standalone: true,
  template: '<div data-testid="live-example">Live example</div>',
})
class ExampleViewerStubComponent {
  readonly example = input.required<DocExample>();
}

describe('DocsPageComponent', () => {
  let fixture: ComponentFixture<DocsPageComponent>;

  beforeEach(async () => {
    const paramMap = convertToParamMap({
      version: '21.1.2',
      category: 'components',
      slug: 'button',
      tab: 'examples',
    });

    await TestBed.configureTestingModule({
      imports: [DocsPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(paramMap), snapshot: { paramMap } } },
        {
          provide: DocsVersionService,
          useValue: {
            resolve: jasmine.createSpy().and.resolveTo('21.1.2'),
            invalidVersion: signal<string | null>(null),
            latestVersion: signal('21.1.2'),
          },
        },
        {
          provide: PublishedDocsService,
          useValue: {
            loadDocument: jasmine.createSpy().and.rejectWith(new Error('Published docs offline')),
            loadStyleGuide: jasmine.createSpy(),
          },
        },
      ],
    })
      .overrideComponent(DocsPageComponent, {
        remove: { imports: [ExampleViewerComponent] },
        add: { imports: [ExampleViewerStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DocsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('keeps compiled live examples available when published Markdown fails', () => {
    expect(fixture.nativeElement.querySelector('[data-testid="live-example"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Published docs offline');
  });
});
