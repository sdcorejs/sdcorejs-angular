import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { SdTime } from './time.component';

@Component({
  standalone: true,
  imports: [SdTime],
  template: `<sd-time [form]="form" name="startTime" [(model)]="value"></sd-time>`,
})
class Host {
  readonly form = new FormGroup({});
  value: string | null | undefined = '08:00';
}

// forms/time edits a time of day without a time zone; a configured zone must never shift it.
describe('SdTime with ISdCoreConfiguration.timeZone', () => {
  for (const timeZone of ['Asia/Ho_Chi_Minh', 'Asia/Bangkok', undefined]) {
    it(`keeps 08:00 unchanged (${timeZone ?? 'no zone'})`, async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [Host, NoopAnimationsModule],
        providers: timeZone ? [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone } }] : [],
      }).compileComponents();
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.value).toBe('08:00');
      expect(fixture.componentInstance.form.get('startTime')!.value).toBe('08:00');
      expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).value).toBe('08:00');
    });
  }
});
