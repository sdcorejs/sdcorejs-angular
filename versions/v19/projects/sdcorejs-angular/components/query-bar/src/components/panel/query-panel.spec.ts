import { Overlay, OverlayContainer } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Component, TemplateRef, ViewContainerRef, inject, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ɵSdQueryPanelDirective, ɵSdQueryPanelCloseReason, ɵSdQueryPanelGroup, ɵSdQueryPanelTriggerDirective } from './query-panel';

// Khung overlay nội bộ của sd-query-bar (handoff mục 2.2), thử với ba panel giả: danh sách, biểu mẫu, danh sách canh phải.
@Component({
  imports: [ɵSdQueryPanelDirective, ɵSdQueryPanelTriggerDirective, MatTooltipModule],
  providers: [ɵSdQueryPanelGroup],
  template: `
    <button id="list-trigger" type="button" [sdQueryPanelTrigger]="list" (panelClosed)="log('list', $event)">List</button>
    <button
      id="form-trigger"
      type="button"
      [sdQueryPanelTrigger]="form"
      (panelOpened)="opened.push('form')"
      (panelClosed)="log('form', $event)">
      Form
    </button>
    <div style="display: flex; justify-content: flex-end; width: 600px">
      <button id="end-trigger" type="button" [sdQueryPanelTrigger]="endList" (panelClosed)="log('end', $event)">End</button>
    </div>
    <div id="chip-trigger" role="button" tabindex="0" [sdQueryPanelTrigger]="list">Chip</div>
    <button id="outside" type="button">Outside</button>
    <button id="tip" type="button" matTooltip="Gợi ý">Tip</button>
    <span id="plain">Plain text</span>

    <ng-template sdQueryPanel="listbox" #list="sdQueryPanel">
      <div class="sd-query-panel sd-query-panel--list probe-list" role="listbox">
        @if (find()) {
          <input class="probe-find" aria-label="Find" />
        }
        <div role="option" aria-selected="false" tabindex="-1" aria-disabled="true">A</div>
        <div role="option" aria-selected="false" tabindex="-1" class="probe-first">B</div>
        <div role="option" aria-selected="false" tabindex="-1">C</div>
      </div>
    </ng-template>

    <ng-template sdQueryPanel="dialog" #form="sdQueryPanel">
      <div class="sd-query-panel sd-query-panel--form probe-form" role="dialog" aria-label="Form">
        <button type="button" class="probe-header">Operator</button>
        <div data-sd-query-panel-initial>
          <input class="probe-value" aria-label="Value" />
        </div>
        <input class="probe-last" aria-label="Last" />
      </div>
    </ng-template>

    <ng-template sdQueryPanel="menu" sdQueryPanelAlign="end" #endList="sdQueryPanel">
      <div class="sd-query-panel sd-query-panel--list probe-end" role="menu" style="width: 220px">
        <button type="button" role="menuitem" class="probe-item">Item</button>
      </div>
    </ng-template>

    <ng-template #child>
      <div class="probe-child"><button type="button" class="probe-child-button">Child option</button></div>
    </ng-template>
  `,
})
class PanelHost {
  readonly list = viewChild.required<ɵSdQueryPanelDirective>('list');
  readonly form = viewChild.required<ɵSdQueryPanelDirective>('form');
  readonly endList = viewChild.required<ɵSdQueryPanelDirective>('endList');
  readonly child = viewChild.required<TemplateRef<unknown>>('child');
  readonly tooltip = viewChild.required(MatTooltip);
  readonly views = inject(ViewContainerRef);
  readonly find = signal(false);
  readonly closed: string[] = [];
  readonly opened: string[] = [];
  log(panel: string, reason: ɵSdQueryPanelCloseReason): void {
    this.closed.push(`${panel}:${reason}`);
  }
}

describe('ɵSdQueryPanelDirective', () => {
  let fixture: ComponentFixture<PanelHost>;
  let host: PanelHost;

  const el = <T extends HTMLElement = HTMLElement>(selector: string): T => fixture.nativeElement.querySelector(selector) as T;
  const overlay = (): HTMLElement => TestBed.inject(OverlayContainer).getContainerElement();
  const panel = (selector = '.sd-query-panel'): HTMLElement | null => overlay().querySelector<HTMLElement>(selector);
  const key = (target: Element, value: string, init: KeyboardEventInit = {}): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };
  const click = (target: HTMLElement): void => {
    target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    target.click();
    fixture.detectChanges();
  };
  // Bàn phím: click không có pointerdown đi trước (Enter / Space trên <button>). Chuột: pointerdown rồi click.
  const openList = (keyboard = true): void => {
    if (keyboard) el('#list-trigger').click();
    else click(el('#list-trigger'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PanelHost, NoopAnimationsModule] });
    fixture = TestBed.createComponent(PanelHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    for (const button of Array.from(document.querySelectorAll('.probe-outside'))) button.remove();
  });

  describe('QB-P-03 position', () => {
    // why: trong cả bộ test, DOM sót lại ở body đẩy fixture xuống cuối khung — ghim trigger ở đầu khung để "đủ chỗ
    // bên dưới" không phụ thuộc thứ tự chạy.
    const pinTop = (trigger: HTMLElement, side: 'left' | 'right'): void => {
      Object.assign(trigger.style, { position: 'fixed', top: '8px', [side]: '24px' });
    };

    it('QB-P-03 opens below the trigger, start-aligned, 4px away', () => {
      pinTop(el('#list-trigger'), 'left');
      openList();
      const trigger = el('#list-trigger').getBoundingClientRect();
      const box = panel()!.getBoundingClientRect();
      expect(Math.round(box.top - trigger.bottom)).toBe(4);
      expect(Math.round(box.left)).toBe(Math.round(trigger.left));
    });

    it('QB-P-03 flips above the trigger when there is no room below', () => {
      const trigger = el('#list-trigger');
      Object.assign(trigger.style, { position: 'fixed', bottom: '4px', left: '24px' });
      openList();
      const rect = trigger.getBoundingClientRect();
      const box = panel()!.getBoundingClientRect();
      expect(Math.round(rect.top - box.bottom)).toBe(4);
    });

    it('QB-P-03 aligns an end panel (saved filters) with the end of its trigger', () => {
      pinTop(el('#end-trigger'), 'right');
      el('#end-trigger').click();
      fixture.detectChanges();
      const trigger = el('#end-trigger').getBoundingClientRect();
      const box = panel('.probe-end')!.getBoundingClientRect();
      expect(Math.round(box.right)).toBe(Math.round(trigger.right));
      expect(Math.round(box.top - trigger.bottom)).toBe(4);
    });
  });

  describe('QB-P-04 closing', () => {
    it('QB-P-04 closes on Escape, once', () => {
      openList();
      key(document.activeElement!, 'Escape');
      expect(panel()).toBeNull();
      expect(host.closed).toEqual(['list:escape']);
    });

    it('QB-P-04 leaves an Escape that a child control already handled to that control', () => {
      openList();
      const option = panel()!.querySelector('[role="option"]')!;
      option.addEventListener('keydown', event => event.preventDefault(), { once: true });
      key(option, 'Escape');
      expect(panel()).not.toBeNull();
    });

    it('QB-P-04 closes on a click outside, once', () => {
      openList();
      click(el('#plain'));
      expect(panel()).toBeNull();
      expect(host.closed).toEqual(['list:outside']);
    });

    it('QB-P-04 toggles from its own trigger instead of treating that click as outside', () => {
      openList(false);
      click(el('#list-trigger'));
      expect(panel()).toBeNull();
      expect(host.closed).toEqual(['list:close']);
    });

    it('QB-P-04 closes a list on Tab and lets the browser move on from the trigger', () => {
      openList();
      const event = key(document.activeElement!, 'Tab');
      expect(panel()).toBeNull();
      expect(event.defaultPrevented).toBeFalse();
      expect(document.activeElement).toBe(el('#list-trigger'));
      expect(host.closed).toEqual(['list:tab']);
    });

    it('QB-P-04 keeps a form open while Tab moves between its controls, closes it when Tab leaves', () => {
      el('#form-trigger').click();
      fixture.detectChanges();
      key(panel()!.querySelector('.probe-value')!, 'Tab');
      expect(panel()).not.toBeNull();
      key(panel()!.querySelector('.probe-header')!, 'Tab', { shiftKey: true });
      expect(panel()).toBeNull();
      expect(host.closed).toEqual(['form:tab']);

      el('#form-trigger').click();
      fixture.detectChanges();
      key(panel()!.querySelector('.probe-last')!, 'Tab');
      expect(panel()).toBeNull();
      expect(host.closed).toEqual(['form:tab', 'form:tab']);
    });

    it('QB-P-04 closes when focus moves to an element outside the panel', () => {
      el('#form-trigger').click();
      fixture.detectChanges();
      el('#outside').focus();
      fixture.detectChanges();
      expect(panel()).toBeNull();
      expect(host.closed).toEqual(['form:outside']);
      expect(document.activeElement).toBe(el('#outside'));
    });

    it('QB-P-04 stays open for clicks and focus inside a child overlay stacked above it (select panel, date picker, operator menu)', () => {
      el('#form-trigger').click();
      fixture.detectChanges();
      const childRef = TestBed.inject(Overlay).create();
      childRef.attach(new TemplatePortal(host.child(), host.views));
      fixture.detectChanges();
      const childButton = overlay().querySelector<HTMLElement>('.probe-child-button')!;
      childButton.focus();
      click(childButton);
      expect(panel()).not.toBeNull();
      childRef.dispose();
      click(el('#plain'));
      expect(panel()).toBeNull();
      expect(host.closed).toEqual(['form:outside']);
    });

    it('QB-P-04 closes with the host, without emitting from destroyed outputs', () => {
      const warn = spyOn(console, 'warn').and.callThrough();
      openList();
      fixture.destroy();
      expect(panel()).toBeNull();
      expect(host.closed).toEqual([]);
      expect(warn).not.toHaveBeenCalled();
    });

    it('QB-P-04 reports an opening made through the panel API to the trigger whose element it uses', () => {
      host.list().open(el('#list-trigger'), { keyboard: true });
      fixture.detectChanges();
      expect(el('#list-trigger').getAttribute('aria-expanded')).toBe('true');
      host.list().close();
      expect(host.closed).toEqual(['list:close']);
    });
  });

  describe('QB-P-05 focus', () => {
    it('QB-P-05 keyboard opening of a list lands on the first enabled option', () => {
      openList(true);
      expect(document.activeElement).toBe(panel()!.querySelector('.probe-first'));
    });

    it('QB-P-05 pointer opening of a list without a find box keeps focus on the panel', () => {
      openList(false);
      expect(document.activeElement).toBe(panel());
    });

    it('QB-P-05 a list with a find box focuses the find box, by keyboard or pointer', () => {
      host.find.set(true);
      fixture.detectChanges();
      openList(false);
      expect(document.activeElement).toBe(panel()!.querySelector('.probe-find'));
      key(document.activeElement!, 'Escape');
      openList(true);
      expect(document.activeElement).toBe(panel()!.querySelector('.probe-find'));
    });

    it('QB-P-05 a form focuses its first value control', () => {
      el('#form-trigger').click();
      fixture.detectChanges();
      expect(document.activeElement).toBe(panel()!.querySelector('.probe-value'));
    });

    it('QB-P-05 a div[role=button] trigger opens from Enter and Space by keyboard', () => {
      const chip = el('#chip-trigger');
      const enter = key(chip, 'Enter');
      expect(enter.defaultPrevented).toBeTrue();
      expect(document.activeElement).toBe(panel()!.querySelector('.probe-first'));
      key(document.activeElement!, 'Escape');
      expect(document.activeElement).toBe(chip);
      const space = key(chip, ' ');
      expect(space.defaultPrevented).toBeTrue();
      expect(panel()).not.toBeNull();
    });

    it('QB-P-05 gives focus back to the trigger on close', () => {
      openList();
      key(document.activeElement!, 'Escape');
      expect(document.activeElement).toBe(el('#list-trigger'));
    });

    it('QB-P-05 gives focus to returnFocusTo instead of the trigger', () => {
      const origin = document.createElement('button');
      origin.className = 'probe-outside';
      document.body.appendChild(origin);
      host.list().open(el('#list-trigger'), { keyboard: true, returnFocusTo: origin });
      fixture.detectChanges();
      host.list().close();
      expect(document.activeElement).toBe(origin);
    });

    it('QB-P-05 a click outside on a focusable element keeps focus there', () => {
      openList();
      const outside = el('#outside');
      outside.focus();
      click(outside);
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(outside);
    });

    it('QB-P-05 a click outside on plain content gives focus back to the trigger', () => {
      openList();
      click(el('#plain'));
      expect(document.activeElement).toBe(el('#list-trigger'));
    });
  });

  describe('QB-P-06 one panel at a time', () => {
    it('QB-P-06 opening a panel closes the other panel of the same group first', () => {
      openList();
      host.form().open(el('#form-trigger'), { keyboard: true });
      fixture.detectChanges();
      expect(overlay().querySelectorAll('.sd-query-panel').length).toBe(1);
      expect(panel('.probe-form')).not.toBeNull();
      expect(host.closed).toEqual(['list:switch']);
      expect(host.opened).toEqual(['form']);
      expect(document.activeElement).toBe(panel()!.querySelector('.probe-value'));
    });

    it('QB-P-06 a click on another trigger closes the open panel as outside, then opens its own', () => {
      openList(false);
      click(el('#form-trigger'));
      expect(overlay().querySelectorAll('.sd-query-panel').length).toBe(1);
      expect(panel('.probe-form')).not.toBeNull();
      expect(host.closed).toEqual(['list:outside']);
    });

    it('QB-P-06 moves the same panel to another trigger, closing it for the first one', () => {
      openList();
      el('#chip-trigger').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      fixture.detectChanges();
      expect(overlay().querySelectorAll('.sd-query-panel').length).toBe(1);
      expect(host.list().origin()).toBe(el('#chip-trigger'));
      expect(el('#list-trigger').getAttribute('aria-expanded')).toBe('false');
      expect(el('#chip-trigger').getAttribute('aria-expanded')).toBe('true');
    });
  });

  // R1 · N-1: MatTooltip cũng nghe keydownEvents() của overlay; tooltip của nút khác gắn sau panel nên nằm trên cùng và
  // nuốt Esc đầu tiên.
  describe('QB-B-01 Escape while a tooltip of another control is shown', () => {
    it('QB-B-01 closes the panel on the first Escape and hides the tooltip', fakeAsync(() => {
      openList();
      host.tooltip().show(0);
      tick();
      fixture.detectChanges();
      expect(overlay().querySelector('.mat-mdc-tooltip-panel')).withContext('tooltip shown above the panel').not.toBeNull();
      key(document.activeElement!, 'Escape');
      expect(panel()).toBeNull();
      expect(host.closed).toEqual(['list:escape']);
      expect(document.activeElement).toBe(el('#list-trigger'));
      host.tooltip().hide(0);
      tick();
    }));

    it('QB-B-01 leaves Escape to an interactive overlay of a control stacked above (its own panel closes first)', () => {
      el('#form-trigger').click();
      fixture.detectChanges();
      const childRef = TestBed.inject(Overlay).create();
      childRef.attach(new TemplatePortal(host.child(), host.views));
      fixture.detectChanges();
      key(panel()!.querySelector('.probe-value')!, 'Escape');
      expect(panel()).not.toBeNull();
      childRef.dispose();
      key(panel()!.querySelector('.probe-value')!, 'Escape');
      expect(panel()).toBeNull();
      expect(host.closed).toEqual(['form:escape']);
    });
  });

  describe('QB-P-07 ARIA', () => {
    it('QB-P-07 trigger announces the popup type, its state and the panel it controls', () => {
      const list = el('#list-trigger');
      expect(list.getAttribute('aria-haspopup')).toBe('listbox');
      expect(el('#form-trigger').getAttribute('aria-haspopup')).toBe('dialog');
      expect(el('#end-trigger').getAttribute('aria-haspopup')).toBe('menu');
      expect(list.getAttribute('aria-expanded')).toBe('false');
      expect(list.hasAttribute('aria-controls')).toBeFalse();

      openList();
      expect(list.getAttribute('aria-expanded')).toBe('true');
      expect(list.getAttribute('aria-controls')).toBe(panel()!.id);
      expect(panel()!.id).toBe(host.list().id);
      expect(panel()!.getAttribute('role')).toBe('listbox');

      key(document.activeElement!, 'Escape');
      expect(list.getAttribute('aria-expanded')).toBe('false');
      expect(list.hasAttribute('aria-controls')).toBeFalse();
    });

    it('QB-P-07 panel root is focusable by script only and the modifier class stays', () => {
      el('#form-trigger').click();
      fixture.detectChanges();
      expect(panel()!.getAttribute('tabindex')).toBe('-1');
      expect(panel()!.classList).toContain('sd-query-panel--form');
    });
  });
});
