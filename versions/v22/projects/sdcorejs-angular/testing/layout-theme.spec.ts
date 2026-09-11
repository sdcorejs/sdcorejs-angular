import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, ViewEncapsulation } from '@angular/core';

// why: geometry regressions need the same reset, theme and shared form styles as consumers.
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'sd-layout-test-theme',
  template: '',
  styleUrl: '../assets/scss/sd-core.scss',
  encapsulation: ViewEncapsulation.None,
})
export class LayoutTestTheme {}
