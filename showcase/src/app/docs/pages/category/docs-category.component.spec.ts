import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DocsCategoryComponent } from './docs-category.component';
import { PublishedDocsService } from '../../core/published-docs.service';

describe('DocsCategoryComponent', () => {
  let fixture: ComponentFixture<DocsCategoryComponent>;

  async function create(
    category: string,
    publishedIds: readonly string[] = [
      'directives/src/sd-desktop',
      'directives/src/sd-hover-copy',
      'directives/src/sd-href',
      'directives/src/sd-mobile',
      'directives/src/sd-scroll',
      'directives/src/sd-tooltip',
    ]
  ): Promise<void> {
    const paramMap = convertToParamMap({ version: '21.1.2', category });
    await TestBed.configureTestingModule({
      imports: [DocsCategoryComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap }, paramMap: of(paramMap) },
        },
        {
          provide: PublishedDocsService,
          useValue: {
            loadIndex: () =>
              Promise.resolve({
                docs: publishedIds.map(id => ({ id })),
              }),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DocsCategoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('renders every page in a valid category with canonical versioned links', async () => {
    await create('directives');

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Directives');
    expect(element.querySelectorAll('.page-card')).toHaveSize(6);
    expect(element.querySelector<HTMLAnchorElement>('.page-card')?.getAttribute('href')).toContain('/v/21.1.2/directives/');
  });

  it('renders a useful not-found state for an unknown category', async () => {
    await create('unknown');

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="status"]')?.textContent).toContain('category does not exist');
    expect(element.querySelectorAll('.page-card')).toHaveSize(0);
  });

  it('labels and disables references that are absent from the selected version', async () => {
    await create('guides', []);

    const card = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('.page-card');
    expect(card?.classList).toContain('page-card--unavailable');
    expect(card?.getAttribute('aria-disabled')).toBe('true');
    expect(card?.getAttribute('href')).toBeNull();
    expect(card?.textContent).toContain('Not in v21.1.2');
  });

  it('routes a current live demo to Examples when its archived reference is absent', async () => {
    await create('components', []);

    const card = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('.page-card');
    expect(card?.classList).not.toContain('page-card--unavailable');
    expect(card?.getAttribute('href')).toContain('/v/21.1.2/components/anchor/examples');
    expect(card?.textContent).toContain('Current live demo');
    expect(card?.textContent).toContain('Open live demo');
  });
});
