import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { I18nService } from '@sdcorejs/angular/i18n';

import { LayoutTestTheme } from '../../../testing/layout-theme.spec';
import { SdUploadFile } from './upload-file.component';

const IMG = (name: string) => `http://cdn.example.com/${name}.jpg`;
const DOC = (name: string) => `http://cdn.example.com/${name}.pdf`;

@Component({
  imports: [SdUploadFile, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <table style="width: 360px; table-layout: fixed; border-collapse: collapse">
      <tbody>
        <tr>
          <td style="padding: 0">
            <sd-upload-file
              variant="inline"
              label="Chứng từ"
              [max]="max()"
              [maxOfImage]="maxOfImage()"
              [disabled]="disabled()"
              [required]="required()"
              [(model)]="model" />
          </td>
        </tr>
      </tbody>
    </table>
  `,
})
class InlineHost {
  readonly field = viewChild.required(SdUploadFile);
  readonly max = signal(10);
  readonly maxOfImage = signal(3);
  readonly disabled = signal(false);
  readonly required = signal(false);
  model: (string | number)[] = [];
}

// Đợt 3 · 4d (design handoff `upload-file.md`, mục H4 — variant inline).
describe('Upload file inline variant (wave 3 · 4d)', () => {
  let fixture: ComponentFixture<InlineHost>;
  let host: InlineHost;
  let i18n: I18nService;

  const el = () => fixture.nativeElement as HTMLElement;
  const q = (selector: string) => el().querySelector(selector) as HTMLElement | null;
  const qa = (selector: string) => Array.from(el().querySelectorAll(selector)) as HTMLElement[];
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const setModel = async (model: (string | number)[]) => {
    host.model = model;
    await settle();
  };
  const resolve = (property: string, value: string) => {
    const probe = document.createElement('div');
    probe.style.setProperty(property, value);
    el().appendChild(probe);
    const computed = getComputedStyle(probe).getPropertyValue(property);
    probe.remove();
    return computed;
  };

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [InlineHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(InlineHost);
    host = fixture.componentInstance;
    i18n = TestBed.inject(I18nService);
    await settle();
  });

  it('defaults to the default variant', () => {
    const plain = TestBed.createComponent(SdUploadFile);
    expect(plain.componentInstance.variant()).toBe('default');
  });

  it('is one 32px line without label, description or counter', async () => {
    await setModel([IMG('a'), DOC('hop-dong')]);
    const line = q('.sd-upload-file__inline')!;
    expect(line.getBoundingClientRect().height).toBe(36);
    expect(getComputedStyle(line).flexWrap).toBe('nowrap');
    expect(getComputedStyle(line).paddingTop).toBe('4px');
    expect(q('sd-label')).toBeNull();
    expect(q('.sd-upload-file__counter')).toBeNull();
    expect(q('.sd-upload-file__description')).toBeNull();
    expect(q('sd-upload-file')!.classList).toContain('sd-upload-file--inline');
  });

  it('orders the upload tile, images, document chips, then "+N"', async () => {
    host.maxOfImage.set(3);
    await setModel([DOC('a'), IMG('b'), DOC('c'), IMG('d'), DOC('e')]);
    const children = Array.from(q('.sd-upload-file__inline')!.children) as HTMLElement[];
    expect(children[0].classList).toContain('sd-upload-file__inline-add');
    expect(children[1].classList).toContain('sd-upload-file__inline-item--image');
    expect(children[2].classList).toContain('sd-upload-file__inline-item--image');
    expect(children[3].querySelector('.sd-upload-file__chip')).not.toBeNull();
    expect(children[4].classList).toContain('sd-upload-file__inline-more');
    expect(children[4].textContent!.trim()).toBe('+2');
  });

  it('sizes the tile and images 32×32 with 6px corners, the tile dashed in --sd-border-strong', async () => {
    await setModel([IMG('a')]);
    const add = q('.sd-upload-file__inline-add')!;
    const thumb = q('.sd-upload-file__inline-thumb')!;
    for (const box of [add.getBoundingClientRect(), thumb.getBoundingClientRect()]) {
      expect([box.width, box.height]).toEqual([32, 32]);
    }
    expect(getComputedStyle(add).borderTopStyle).toBe('dashed');
    expect(getComputedStyle(add).borderTopColor).toBe(resolve('border-top-color', 'var(--sd-border-strong)'));
    expect(getComputedStyle(add).borderTopLeftRadius).toBe('6px');
    expect(getComputedStyle(thumb).borderTopLeftRadius).toBe('6px');
    expect(add.querySelector('sd-icon')!.textContent).toContain('upload_file');
  });

  it('cuts a document chip at 140px with an ellipsis, on --sd-surface-muted', async () => {
    await setModel([DOC('bien-ban-ban-giao-tai-san-quy-3-nam-2026-chi-nhanh-ha-noi')]);
    const chip = q('.sd-upload-file__chip')!;
    expect(chip.getBoundingClientRect().width).toBeLessThanOrEqual(140);
    expect(chip.getBoundingClientRect().height).toBe(32);
    expect(getComputedStyle(chip).backgroundColor).toBe(resolve('background-color', 'var(--sd-surface-muted)'));
    expect(getComputedStyle(q('.sd-upload-file__chip-name')!).textOverflow).toBe('ellipsis');
    expect(chip.querySelector('sd-upload-file-type-icon')).not.toBeNull();
  });

  it('opens the popup at an item, and "+N" at the first hidden one', async () => {
    host.maxOfImage.set(2);
    await setModel([IMG('a'), IMG('b'), DOC('c'), DOC('d')]);
    const open = spyOn(host.field().previewFileComponent()!, 'open');
    const files = host.field().previewFiles();

    q('.sd-upload-file__inline-thumb')!.click();
    expect(open).toHaveBeenCalledWith(files, 0);
    q('.sd-upload-file__inline-more')!.click();
    expect(open).toHaveBeenCalledWith(
      files,
      files.findIndex(file => file.src === DOC('c'))
    );
  });

  it('says "Chưa có tệp" in 13px --sd-upload-file-empty-text when empty', () => {
    const empty = q('.sd-upload-file__empty')!;
    expect(empty.textContent!.trim()).toBe(i18n.t('core.component.upload-file.no-files'));
    expect(getComputedStyle(empty).fontSize).toBe('13px');
    expect(getComputedStyle(empty).color).toBe(resolve('color', 'var(--sd-upload-file-empty-text)'));
  });

  it('shows a 16px remove badge at -4px on hover or focus', async () => {
    await setModel([IMG('a')]);
    const badge = q('.sd-upload-file__inline-remove')!;
    const box = badge.getBoundingClientRect();
    expect([box.width, box.height]).toEqual([16, 16]);
    expect(getComputedStyle(badge).top).toBe('-4px');
    expect(getComputedStyle(badge).visibility).toBe('hidden');
    q('.sd-upload-file__inline-thumb')!.focus();
    expect(getComputedStyle(badge).visibility).toBe('visible');
    expect(badge.getAttribute('aria-label')).toBe(i18n.t('core.component.upload-file.remove-named', { name: IMG('a') }));
  });

  it('hides the tile when full or disabled, and has no remove badge when disabled', async () => {
    host.max.set(1);
    await setModel([IMG('a')]);
    expect(q('.sd-upload-file__inline-add')).toBeNull();
    host.max.set(5);
    host.disabled.set(true);
    await settle();
    expect(q('.sd-upload-file__inline-add')).toBeNull();
    expect(q('.sd-upload-file__inline-remove')).toBeNull();
  });

  it('shows a required error as an error border around the tile, announced to screen readers', async () => {
    host.required.set(true);
    await settle();
    host.field().formControl.markAsTouched();
    host.field().formControl.updateValueAndValidity();
    await settle();
    const add = q('.sd-upload-file__inline-add')!;
    expect(getComputedStyle(add).borderTopColor).toBe(resolve('border-top-color', 'var(--sd-error)'));
    expect(q('.sd-upload-file__inline [role="alert"]')!.textContent!.trim()).toBe(i18n.t('core.component.upload-file.please-upload'));
  });

  it('tints the whole line primary 6% while files are dragged over it', async () => {
    const data = new DataTransfer();
    data.items.add(new File(['x'], 'a.pdf', { type: 'application/pdf' }));
    q('sd-upload-file')!.dispatchEvent(new DragEvent('dragenter', { dataTransfer: data, bubbles: true, cancelable: true }));
    fixture.detectChanges();
    const line = q('.sd-upload-file__inline')!;
    expect(getComputedStyle(line).backgroundColor).toBe(
      resolve('background-color', 'color-mix(in srgb, var(--sd-primary) 6%, transparent)')
    );
  });

  it('fits a table cell row', async () => {
    await setModel([IMG('a'), DOC('b')]);
    expect(q('td')!.getBoundingClientRect().height).toBeLessThanOrEqual(40);
  });
});
