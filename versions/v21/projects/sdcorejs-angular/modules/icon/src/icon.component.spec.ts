import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatMenuModule } from '@angular/material/menu';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LucidePlus } from '@lucide/angular';
import { queryByCss, setInput } from '../../../testing/test-utils';
import { SdIcon } from './icon.component';
import { provideSdIcon } from './icon.provider';

@Component({
  standalone: true,
  imports: [SdIcon, MatMenuModule],
  template: `
    <button type="button" [matMenuTriggerFor]="menu">open</button>
    <mat-menu #menu="matMenu">
      <button type="button" mat-menu-item>
        <sd-icon name="edit" size="sm"></sd-icon>
        <span>Sửa</span>
      </button>
    </mat-menu>
  `,
})
class MenuHostComponent {}

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

  // why: base CSS của Material nhắm thẳng `.mat-icon` con trong menu/list item và ép nó 24px +
  // margin-right 12px. Glyph bên trong sd-icon vì thế phình to hơn host rồi bị xén (host có
  // overflow hidden) và lệch sang trái — đúng lỗi "icon bị cắt đè" khi mở mat-menu. Glyph phải luôn
  // khít host ở mọi ngữ cảnh Material, không phụ thuộc component cha vá tay.
  it('keeps the Material glyph inside the host box when rendered in a mat-menu item', async () => {
    await TestBed.configureTestingModule({
      imports: [MenuHostComponent, NoopAnimationsModule],
    }).compileComponents();

    const fixture = TestBed.createComponent(MenuHostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLElement).click();
    fixture.detectChanges();

    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const host = overlay.querySelector('sd-icon') as HTMLElement;
    const glyph = host.querySelector('.sd-icon__material') as HTMLElement;
    const hostRect = host.getBoundingClientRect();
    const glyphRect = glyph.getBoundingClientRect();

    expect(hostRect.width).toBeCloseTo(16, 0);
    expect(glyphRect.width).toBeCloseTo(hostRect.width, 0);
    expect(glyphRect.height).toBeCloseTo(hostRect.height, 0);
    // Khoảng cách với nhãn là việc của menu item, không phải của glyph bên trong host.
    expect(getComputedStyle(glyph).marginRight).toBe('0px');
  });
});
