import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DocsVersionService } from '../docs/core/docs-version.service';
import { PublishedDocsService } from '../docs/core/published-docs.service';
import { ShellComponent } from './shell.component';

describe('ShellComponent mobile navigation', () => {
  it('captures focus on open, traps Tab, and restores the trigger on Escape', async () => {
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        {
          provide: DocsVersionService,
          useValue: {
            load: jasmine.createSpy().and.resolveTo(undefined),
            select: jasmine.createSpy().and.resolveTo(undefined),
            selectedVersion: signal('21.1.2'),
            latestVersion: signal('21.1.2'),
            loading: signal(false),
            error: signal<string | null>(null),
            versionGroups: signal([]),
          },
        },
        { provide: PublishedDocsService, useValue: { loadIndex: jasmine.createSpy().and.resolveTo({ docs: [] }) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ShellComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.mobile-menu') as HTMLButtonElement;

    fixture.componentInstance.toggleMobileNav();
    fixture.detectChanges();
    await Promise.resolve();
    const focusable = [...fixture.nativeElement.querySelectorAll('.sidebar a[href], .sidebar button:not([disabled])')] as HTMLElement[];
    expect(document.activeElement).toBe(focusable[0]);

    focusable.at(-1)?.focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    fixture.componentInstance.onDocumentKeydown(tab);
    expect(tab.defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(focusable[0]);

    const escape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    fixture.componentInstance.onDocumentKeydown(escape);
    await Promise.resolve();
    expect(fixture.componentInstance.mobileNavOpen()).toBeFalse();
    expect(document.activeElement).toBe(trigger);

    fixture.destroy();
  });
});
