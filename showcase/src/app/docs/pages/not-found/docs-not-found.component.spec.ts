import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { DocsVersionService } from '../../core/docs-version.service';
import { DocsNotFoundComponent } from './docs-not-found.component';

describe('DocsNotFoundComponent', () => {
  async function render(url: string): Promise<DocsNotFoundComponent> {
    await TestBed.configureTestingModule({
      imports: [DocsNotFoundComponent],
      providers: [
        provideRouter([{ path: '**', component: DocsNotFoundComponent }]),
        { provide: DocsVersionService, useValue: { resolvedPackageVersion: signal('22.3.2'), selectedRelease: signal('3.2') } },
      ],
    }).compileComponents();
    await TestBed.inject(Router).navigateByUrl(url);
    const fixture = TestBed.createComponent(DocsNotFoundComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('suggests pages from the slug, not from the docs tab after it', async () => {
    const component = await render('/v/22.3.2/components/button-old/overview');

    expect(component.slug()).toBe('button-old');
    expect(component.searchTerm()).toBe('button');
    expect(component.suggestions().map(page => page.title)).toContain('Button');
  });
});
