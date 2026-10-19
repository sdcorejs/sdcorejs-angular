import { ApplicationRef, Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { SdConfirmService } from '@sdcorejs/angular/services';
import type { Filter } from '@sdcorejs/utils/models';
import { SdFormBuilder } from '../components/form-builder/form-builder.component';
import { InspectorComponent } from '../components/form-builder/inspector/inspector.component';
import { DatetimeComponent } from '../components/form-render/components/item/components/datetime/datetime.component';
import { SdFormRender } from '../components/form-render/form-render.component';
import type { SdFormGenericField } from '../models/form-generic-field.model';
import type { SdFormGenericSchema } from '../models/form-generic-schema.model';
import { ComponentViewedPipe } from '../pipes/component-viewed.pipe';
import { SdFormRenderService } from '../services/form-render.service';
import { sdDisplayValue } from './form-generic-display';
import { sdElementState, sdEvaluateFilter } from './form-generic-filter';
import { sdRunFormValidations } from './form-generic-validation';

// form-generic under ISdCoreConfiguration.timeZone. Every expectation is pinned to an instant, so it
// holds on any machine zone (Bangkok locally, UTC in CI). Asia/Ho_Chi_Minh is +07 in 2026 and +08 in 1960.

const VN = 'Asia/Ho_Chi_Minh';
type Json = Record<string, unknown>;

const zone = (timeZone?: string) => (timeZone ? [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone } }] : []);
const schemaOf = (elements: Json[], extra: Json = {}) => ({ pages: [{ id: 'p', elements }], ...extra }) as unknown as SdFormGenericSchema;
const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

describe('form-generic with ISdCoreConfiguration.timeZone', () => {
  afterEach(() => TestBed.resetTestingModule());

  describe('rules and validations (clock 2026-08-14T17:30:00Z = 15/08/2026 00:30 in the zone)', () => {
    const today: Filter = { field: 'd', operator: 'GREATER_OR_EQUAL', dataType: 'date-today', data: 'TODAY' };
    const fieldTypes = { d: 'date' } as const;

    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2026-08-14T17:30:00Z'));
    });
    afterEach(() => jasmine.clock().uninstall());

    it('resolves date-today in the zone', () => {
      expect(sdEvaluateFilter(today, { d: '2026/08/15' }, fieldTypes, VN)).toBeTrue();
      expect(sdEvaluateFilter(today, { d: '2026/08/14' }, fieldTypes, VN)).toBeFalse();
      expect(sdElementState({ rules: { visible: today } }, { d: '2026/08/14' }, fieldTypes, VN).visible).toBeFalse();
    });

    it('evaluates form validations in the zone', async () => {
      const result = await sdRunFormValidations([{ type: 'filter', filter: today, message: 'from today', alert: 'error' }], {
        value: { d: '2026/08/15' },
        variables: {},
        fieldTypes,
        timeZone: VN,
      });
      expect(result.messages.error).toEqual(['from today']);
    });
  });

  describe('SdFormRender', () => {
    // '1960-05-19T16:30:00Z' is 20/05/1960 00:30 in the zone, so it is not before the zone-less 20/05/1960 00:00 there.
    const notBefore: Filter = { field: 'd', operator: 'GREATER_OR_EQUAL', data: '1960-05-20T00:00:00' };

    const render = async (schema: SdFormGenericSchema, value: Json, timeZone?: string) => {
      TestBed.configureTestingModule({ imports: [SdFormRender, NoopAnimationsModule], providers: zone(timeZone) });
      const fixture = TestBed.createComponent(SdFormRender);
      fixture.componentRef.setInput('schema', schema);
      fixture.componentRef.setInput('value', value);
      fixture.autoDetectChanges();
      await fixture.whenStable();
      await frames();
      fixture.detectChanges();
      return fixture;
    };

    it('applies rules and validations in the zone', async () => {
      const fixture = await render(
        schemaOf(
          [
            { id: 'f-d', key: 'd', type: 'datetime', subtype: 'datetime', label: 'D' },
            { id: 'f-shown', key: 'shown', type: 'textfield', label: 'Shown', rules: { visible: notBefore } },
          ],
          { validations: [{ type: 'filter', filter: notBefore, message: 'not before' }] }
        ),
        { d: '1960-05-19T16:30:00Z' },
        VN
      );
      expect((fixture.nativeElement as HTMLElement).querySelector('[data-element-id="f-shown"]')).not.toBeNull();
      expect((await fixture.componentInstance.validate()).messages.error).toContain('not before');
    });

    it('bounds a today min/max of a date-time field by today in the zone', async () => {
      spyOn(Date, 'now').and.returnValue(Date.parse('2026-08-14T17:30:00Z'));
      const fixture = await render(
        schemaOf([
          { id: 'f-dt', key: 'dt', type: 'datetime', subtype: 'datetime', label: 'DT', validation: { min: 'today', max: 'today' } },
        ]),
        {},
        VN
      );
      const field = fixture.debugElement.query(By.directive(DatetimeComponent)).componentInstance as DatetimeComponent;
      expect(field.min()).toBe('2026-08-14T17:00:00.000Z');
      expect(field.max()).toBe('2026-08-15T16:59:59.999Z');
    });
  });

  describe('read-only display', () => {
    const date = { id: 'f-a', key: 'a', type: 'datetime', subtype: 'date', label: 'A' } as unknown as SdFormGenericField;
    const dateTime = { id: 'f-b', key: 'b', type: 'datetime', subtype: 'datetime', label: 'B' } as unknown as SdFormGenericField;
    const chips = { id: 'f-c', key: 'c', type: 'chip-calendar', label: 'C' } as unknown as SdFormGenericField;
    const instant = '1960-05-19T16:00:00Z';

    for (const [timeZone, day, time] of [
      [VN, '20/05/1960', '20/05/1960 00:00'],
      ['Asia/Bangkok', '19/05/1960', '19/05/1960 23:00'],
    ]) {
      it(`formats instants in ${timeZone}`, async () => {
        TestBed.configureTestingModule({ providers: [ComponentViewedPipe, ...zone(timeZone)] });
        const pipe = TestBed.inject(ComponentViewedPipe);
        expect(pipe.transform(instant, date)).toBe(day);
        expect(pipe.transform(instant, dateTime)).toBe(time);
        expect(pipe.transform([instant], chips)).toBe(day);
        const schema = schemaOf([date, dateTime, chips] as unknown as Json[]);
        expect(await TestBed.inject(SdFormRenderService).viewEntities(schema, [{ a: instant, b: instant, c: [instant] }])).toEqual([
          { a: day, b: time, c: day },
        ]);
      });
    }

    it('keeps the machine zone without a date formatter', () => {
      const local = new Date(1960, 4, 20, 8, 30);
      expect(sdDisplayValue(dateTime, local.toISOString())).toBe('20/05/1960 08:30');
    });
  });

  describe('form builder inspector', () => {
    @Component({
      standalone: true,
      imports: [SdFormBuilder],
      template: `<div style="width: 1280px; height: 760px; display: flex">
        <sd-form-builder style="flex: 1" [schema]="form()"></sd-form-builder>
      </div>`,
    })
    class Host {
      readonly form = signal<SdFormGenericSchema>(
        schemaOf([{ id: 'd', key: 'd', type: 'datetime', subtype: 'date', label: 'D', validation: { min: '1960-05-19T16:00:00Z' } }])
      );
      readonly builder = viewChild.required(SdFormBuilder);
    }

    it('shows an instant default limit as the calendar day in the zone', async () => {
      TestBed.configureTestingModule({
        imports: [Host, NoopAnimationsModule],
        providers: [{ provide: SdConfirmService, useValue: { confirm: () => Promise.resolve() } }, ...zone(VN)],
      });
      const fixture = TestBed.createComponent(Host);
      document.body.appendChild(fixture.nativeElement);
      const render = async () => {
        fixture.detectChanges();
        TestBed.inject(ApplicationRef).tick();
        await fixture.whenStable();
        fixture.detectChanges();
      };
      await render();
      fixture.componentInstance.builder().store.select('d');
      fixture.componentInstance.builder().store.inspectorTab.set('rules');
      await render();
      const inspector = fixture.debugElement.query(By.directive(InspectorComponent)).componentInstance as InspectorComponent;
      expect(inspector.minDateChoices()).toContain(jasmine.objectContaining({ value: '1960-05-19T16:00:00Z', display: '20/05/1960' }));
      fixture.destroy();
      (fixture.nativeElement as HTMLElement).remove();
    });
  });
});
