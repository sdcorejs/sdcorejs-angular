import { DOCUMENT } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { buildDocsFragmentHref, DocsFragmentLinkDirective } from './docs-fragment-link.directive';

const nestedDocument = {
  location: {
    pathname: '/sdcorejs-angular/v/21.1.2/components/button/overview',
    search: '?mode=full',
  },
} as unknown as Document;

@Component({
  selector: 'docs-fragment-link-test-host',
  standalone: true,
  imports: [DocsFragmentLinkDirective],
  providers: [{ provide: DOCUMENT, useValue: nestedDocument }],
  template: '<a [docsFragmentLink]="\'button variants\'">Button variants</a>',
})
class FragmentLinkTestHostComponent {}

describe('DocsFragmentLinkDirective', () => {
  let fixture: ComponentFixture<FragmentLinkTestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FragmentLinkTestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FragmentLinkTestHostComponent);
    fixture.detectChanges();
  });

  it('builds an encoded same-document fragment URL with the current pathname and query', () => {
    expect(buildDocsFragmentHref('/sdcorejs-angular/v/21.1.2/components/table/overview', '?language=vi', '#full demo')).toBe(
      '/sdcorejs-angular/v/21.1.2/components/table/overview?language=vi#full%20demo'
    );
  });

  it('renders an href that preserves the nested pathname and query', () => {
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(link.getAttribute('href')).toBe('/sdcorejs-angular/v/21.1.2/components/button/overview?mode=full#button%20variants');
  });
});
