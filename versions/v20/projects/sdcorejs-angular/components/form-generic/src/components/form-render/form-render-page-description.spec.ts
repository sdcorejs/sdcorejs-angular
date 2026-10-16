import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import type { SdFormGenericSchema } from '../../models/form-generic-schema.model';
import { SdFormRender } from './form-render.component';

describe('Form render page description', () => {
  let fixture: ComponentFixture<SdFormRender>;
  const schema = (navigation?: SdFormGenericSchema['navigation']): SdFormGenericSchema => ({
    ...(navigation ? { navigation } : {}),
    pages: [
      {
        id: 'details',
        label: 'Details',
        description: 'Thông tin chung của hồ sơ.',
        elements: [{ id: 'project', key: 'project', type: 'textfield', label: 'Project' }],
      },
      {
        id: 'address',
        label: 'Address',
        description: 'Nhập địa chỉ liên hệ hiện tại.',
        elements: [{ id: 'city', key: 'city', type: 'textfield', label: 'City' }],
      },
      { id: 'review', label: 'Review', elements: [] },
    ],
  });
  const root = () => fixture.nativeElement as HTMLElement;
  const description = (pageId: string) =>
    root().querySelector<HTMLElement>(`.sd-fg-grid[data-page-id="${pageId}"]`)?.previousElementSibling as HTMLElement | null;
  async function setup(navigation?: SdFormGenericSchema['navigation']) {
    TestBed.configureTestingModule({ imports: [SdFormRender], providers: [provideNoopAnimations()] });
    fixture = TestBed.createComponent(SdFormRender);
    fixture.componentRef.setInput('schema', schema(navigation));
    fixture.componentRef.setInput('form', new FormGroup({}));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  afterEach(() => fixture?.destroy());

  it('shows the first page description above its fields with single-page navigation', async () => {
    await setup();
    const texts = Array.from(root().querySelectorAll<HTMLElement>('.sd-fg-page-description')).map(el => el.textContent?.trim());
    expect(texts).toEqual(['Thông tin chung của hồ sơ.']);
    expect(description('details')?.classList).toContain('sd-fg-page-description');
  });

  for (const type of ['tabs', 'steps'] as const) {
    it(`shows only the active page description and describes the page region with it (${type})`, async () => {
      await setup({ type });
      // why: tab/step bodies of inactive pages may not be in the DOM, or are hidden; only shown text counts.
      const shown = () =>
        Array.from(root().querySelectorAll<HTMLElement>('.sd-fg-page-description'))
          .filter(el => !el.hidden && el.getClientRects().length > 0)
          .map(el => el.textContent?.trim());
      expect(shown()).toEqual(['Thông tin chung của hồ sơ.']);
      const details = description('details')!;
      const region = root().querySelector('.sd-fg-grid[data-page-id="details"]')!;
      expect(region.getAttribute('aria-describedby')).toBe(details.id);

      await fixture.componentInstance.requestPage('address');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(shown()).toEqual(['Nhập địa chỉ liên hệ hiện tại.']);

      await fixture.componentInstance.requestPage('review');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(shown()).toEqual([]);
      expect(root().querySelector('.sd-fg-grid[data-page-id="review"]')?.hasAttribute('aria-describedby')).toBeFalse();
    });
  }
});
