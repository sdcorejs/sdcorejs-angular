import { TestBed } from '@angular/core/testing';
import { LucidePlus } from '@lucide/angular';
import { queryByCss, setInput } from '../../../testing/test-utils';
import { SdIcon } from './icon.component';
import { provideSdIcon } from './icon.provider';

describe('SdIcon', () => {
  it('renders Material outlined icon by default', async () => {
    await TestBed.configureTestingModule({
      imports: [SdIcon],
    }).compileComponents();

    const fixture = TestBed.createComponent(SdIcon);
    setInput(fixture, 'name', 'save');

    expect(fixture.componentInstance.resolvedFontSet()).toBe('material-icons-outlined');
    expect(fixture.componentInstance.resolvedMaterialFontSet()).toBe('material-icons-outlined');
    expect(queryByCss(fixture, 'mat-icon.sd-icon__material').textContent?.trim()).toBe('save');
  });

  it('renders Material filled icon when fontSet="material-icons"', async () => {
    await TestBed.configureTestingModule({
      imports: [SdIcon],
    }).compileComponents();

    const fixture = TestBed.createComponent(SdIcon);
    setInput(fixture, 'name', 'save');
    setInput(fixture, 'fontSet', 'material-icons');

    expect(fixture.componentInstance.resolvedFontSet()).toBe('material-icons');
    expect(fixture.componentInstance.resolvedMaterialFontSet()).toBe('material-icons');
    expect(queryByCss(fixture, 'mat-icon.sd-icon__material').textContent?.trim()).toBe('save');
  });

  it('resolves Lucide-style names and legacy outline names when rendering Material icons', async () => {
    await TestBed.configureTestingModule({
      imports: [SdIcon],
    }).compileComponents();

    const fixture = TestBed.createComponent(SdIcon);
    setInput(fixture, 'name', 'trash-2');

    expect(fixture.componentInstance.resolvedName()).toBe('delete');
    expect(queryByCss(fixture, 'mat-icon.sd-icon__material').textContent?.trim()).toBe('delete');

    setInput(fixture, 'name', 'info_outline');

    expect(fixture.componentInstance.resolvedName()).toBe('info');
    expect(queryByCss(fixture, 'mat-icon.sd-icon__material').textContent?.trim()).toBe('info');
  });

  it('renders Lucide icon from provider and resolves Material-style alias', async () => {
    await TestBed.configureTestingModule({
      imports: [SdIcon],
      providers: [provideSdIcon({ defaultFontSet: 'lucide', lucideIcons: [LucidePlus] })],
    }).compileComponents();

    const fixture = TestBed.createComponent(SdIcon);
    setInput(fixture, 'name', 'add');

    const svg = queryByCss(fixture, 'svg.sd-icon__svg') as unknown as SVGElement;
    expect(svg.querySelector('path')).not.toBeNull();
  });

  it('allows component input to override provider default icon set', async () => {
    await TestBed.configureTestingModule({
      imports: [SdIcon],
      providers: [provideSdIcon({ defaultFontSet: 'lucide', lucideIcons: [LucidePlus] })],
    }).compileComponents();

    const fixture = TestBed.createComponent(SdIcon);
    setInput(fixture, 'name', 'add');
    setInput(fixture, 'fontSet', 'material-icons');

    expect(fixture.componentInstance.resolvedFontSet()).toBe('material-icons');
    expect(fixture.componentInstance.resolvedMaterialFontSet()).toBe('material-icons');
    expect(queryByCss(fixture, 'mat-icon.sd-icon__material').textContent?.trim()).toBe('add');
  });

  it('resolves semantic size tokens and custom CSS size strings', async () => {
    await TestBed.configureTestingModule({
      imports: [SdIcon],
    }).compileComponents();

    const fixture = TestBed.createComponent(SdIcon);
    setInput(fixture, 'name', 'search');
    setInput(fixture, 'size', 'lg');

    expect(fixture.componentInstance.resolvedSize()).toBe(24);
    expect(fixture.componentInstance.resolvedCssSize()).toBe('24px');

    setInput(fixture, 'size', '1.25rem');

    expect(fixture.componentInstance.resolvedSize()).toBe('1.25rem');
    expect(fixture.componentInstance.resolvedCssSize()).toBe('1.25rem');
  });
});
