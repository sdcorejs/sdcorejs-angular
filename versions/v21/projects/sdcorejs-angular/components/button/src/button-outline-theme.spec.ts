import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdButton } from './button.component';
import { setInput } from '../../../testing/test-utils';

function channels(color: string): number[] {
  const values = color.match(/[\d.]+/g)!.map(Number);
  return color.startsWith('color(') ? values.slice(-3).map(value => value * 255) : values.slice(0, 3);
}

function luminance(color: string): number {
  return channels(color)
    .map(value => value / 255)
    .map(value => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(first: string, second: string): number {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe('SdButton outline theme regression', () => {
  let fixture: ComponentFixture<SdButton>;
  let host: HTMLElement;
  const button = () => host.querySelector('button')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdButton, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SdButton);
    host = fixture.nativeElement;
    host.style.colorScheme = 'light';
    const tokens: Record<string, string> = {
      surface: '#fdfbff',
      'border-strong': '#74777f',
      border: '#c4c6d0',
      primary: '#005cbb',
      success: '#2e7d32',
      info: '#006a6a',
      warning: '#a66300',
      error: '#ba1a1a',
    };
    for (const [name, value] of Object.entries(tokens)) host.style.setProperty(`--sd-${name}`, value);
    setInput(fixture, 'type', 'outline');
    setInput(fixture, 'title', 'Review');
  });

  it('softens the existing neutral outline while preserving a distinguishable real border', () => {
    const style = getComputedStyle(button());
    expect(style.borderTopStyle).toBe('solid');
    expect(style.borderTopWidth).toBe('1px');
    expect(contrast(style.borderTopColor, 'rgb(253, 251, 255)')).toBeGreaterThanOrEqual(3);
    expect(contrast(style.borderTopColor, 'rgb(253, 251, 255)')).toBeLessThan(4);
  });

  it('honors containing consumer outline overrides without changing the other variants', () => {
    host.style.setProperty('--sd-button-outline-border', 'rgb(40, 70, 100)');
    host.style.setProperty('--sd-button-outline-warning', 'rgb(101, 61, 20)');
    setInput(fixture, 'color', 'warning');
    expect(getComputedStyle(button()).borderTopColor).toBe('rgb(40, 70, 100)');
    expect(getComputedStyle(button()).color).toBe('rgb(101, 61, 20)');
    setInput(fixture, 'type', 'text');
    expect(getComputedStyle(button()).color).toBe('rgb(166, 99, 0)');
  });

  it('keeps semantic text readable on light and dark without replacing the consumer global palette', () => {
    for (const scheme of ['light', 'dark']) {
      host.style.colorScheme = scheme;
      const surface = scheme === 'light' ? 'rgb(253, 251, 255)' : 'rgb(18, 19, 24)';
      host.style.setProperty('--sd-surface', surface);
      host.style.setProperty('--sd-primary', scheme === 'light' ? '#005cbb' : '#abc7ff');
      host.style.setProperty('--sd-error', scheme === 'light' ? '#ba1a1a' : '#ffb4ab');
      host.style.setProperty('--sd-border-strong', scheme === 'light' ? '#74777f' : '#8e9099');
      for (const palette of ['primary', 'success', 'info', 'warning', 'error']) {
        setInput(fixture, 'color', palette);
        expect(contrast(getComputedStyle(button()).color, surface))
          .withContext(`${scheme} ${palette}`)
          .toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast(getComputedStyle(button()).borderTopColor, surface)).toBeGreaterThanOrEqual(3);
    }
    expect(host.style.getPropertyValue('--sd-warning')).toBe('#a66300');
  });

  it('keeps outline loading full opacity and leaves fill loading behavior unchanged', () => {
    setInput(fixture, 'color', 'warning');
    const normal = getComputedStyle(button()).color;
    const stateLayer = button().querySelector('.mat-mdc-button-persistent-ripple')!;
    expect(getComputedStyle(stateLayer, '::before').backgroundColor).toBe(normal);
    setInput(fixture, 'loading', true);
    expect(getComputedStyle(button()).opacity).toBe('1');
    expect(getComputedStyle(button()).color).toBe(normal);
    const spinner = host.querySelector('mat-spinner')!;
    expect(spinner).not.toBeNull();
    expect(getComputedStyle(spinner).width).toBe('18px');
    expect(getComputedStyle(spinner).height).toBe('18px');
    // Material also keeps a hidden determinate graphic in the DOM. Assert the
    // displayed indeterminate container and every painted arc, not the first circle.
    const container = spinner.querySelector('.mdc-circular-progress__indeterminate-container')!;
    expect(getComputedStyle(container).opacity).toBe('1');
    const circles = container.querySelectorAll('.mdc-circular-progress__indeterminate-circle-graphic circle');
    expect(circles.length).toBe(3);
    for (const circle of Array.from(circles)) {
      const style = getComputedStyle(circle);
      expect(style.stroke).withContext(circle.closest('svg')!.getAttribute('class')!).toBe(normal);
      expect(parseFloat(style.strokeWidth)).toBeGreaterThan(0);
    }
    setInput(fixture, 'type', 'fill');
    expect(getComputedStyle(button()).opacity).toBe('0.85');
  });

  it('retains border width and height across disabled/loading and each size', () => {
    for (const [size, height] of [
      ['sm', '32px'],
      ['md', '40px'],
      ['lg', '48px'],
    ]) {
      setInput(fixture, 'size', size);
      for (const [disabled, loading] of [
        [false, false],
        [true, false],
        [false, true],
      ]) {
        setInput(fixture, 'disabled', disabled);
        setInput(fixture, 'loading', loading);
        const style = getComputedStyle(button());
        expect(style.borderTopWidth).toBe('1px');
        expect(style.height).toBe(height);
      }
    }
  });
});
