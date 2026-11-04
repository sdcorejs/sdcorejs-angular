import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SD_TABLE_PULL_DISTANCE, SdTablePullRefreshComponent } from './pull-refresh.component';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdTablePullRefreshComponent],
  template: `
    <div #list class="list" style="height: 100px; overflow: auto"><div style="height: 400px"></div></div>
    <sd-table-pull-refresh [target]="list" [enabled]="enabled()" [loading]="loading()" (refresh)="refreshed = refreshed + 1" />
  `,
})
class PullHost {
  readonly enabled = signal(true);
  readonly loading = signal(false);
  refreshed = 0;
}

/** Handoff table-mobile 7: pull to refresh on the card list. */
describe('SdTablePullRefreshComponent', () => {
  let fixture: ComponentFixture<PullHost>;
  let host: PullHost;
  let pull: SdTablePullRefreshComponent;
  let list: HTMLElement;

  const touch = (type: string, ...ys: number[]) =>
    list.dispatchEvent(
      new TouchEvent(type, {
        touches: ys.map((clientY, identifier) => new Touch({ identifier, target: list, clientY })),
        bubbles: true,
      })
    );
  const indicator = (): HTMLElement | null => fixture.nativeElement.querySelector('.sd-pull-indicator');
  /** Start at 100, move to `to`, without releasing. */
  const drag = (to: number) => {
    touch('touchstart', 100);
    touch('touchmove', to);
    fixture.detectChanges();
  };

  beforeEach(() => {
    // why: other specs scroll the page; a pull only counts with the page at its top.
    window.scrollTo(0, 0);
    TestBed.configureTestingModule({ imports: [PullHost] });
    fixture = TestBed.createComponent(PullHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    pull = fixture.debugElement.query(By.directive(SdTablePullRefreshComponent)).componentInstance;
    list = fixture.nativeElement.querySelector('.list');
  });
  afterEach(() =>
    TestBed.inject(OverlayContainer)
      .getContainerElement()
      .querySelectorAll('.test-backdrop')
      .forEach(node => node.remove())
  );

  it('follows the finger, says "release" past the threshold and stops at 96px', () => {
    drag(130);
    expect(pull.distance()).toBe(30);
    expect(indicator()?.classList).not.toContain('sd-pull-indicator--ready');
    const pullLabel = indicator()!.getAttribute('aria-label');

    drag(100 + SD_TABLE_PULL_DISTANCE);
    expect(indicator()?.classList).toContain('sd-pull-indicator--ready');
    expect(indicator()!.getAttribute('aria-label')).not.toBe(pullLabel);

    drag(400);
    expect(pull.distance()).toBe(96);
  });

  it('refreshes once on release past the threshold and spins until the read is done', fakeAsync(() => {
    drag(180);
    touch('touchend');
    host.loading.set(true);
    fixture.detectChanges();

    expect(host.refreshed).toBe(1);
    expect(pull.distance()).toBe(0);
    expect(indicator()?.classList).toContain('sd-pull-indicator--busy');
    tick(300);
    expect(pull.refreshing()).toBeTrue();

    // A pull while refreshing does nothing.
    drag(180);
    expect(pull.distance()).toBe(0);

    host.loading.set(false);
    fixture.detectChanges();
    expect(pull.refreshing()).toBeFalse();
    touch('touchend');
    fixture.detectChanges();
    expect(indicator()).toBeNull();
    expect(host.refreshed).toBe(1);
  }));

  it('stops spinning after 300 ms when the refresh never shows as loading', fakeAsync(() => {
    drag(180);
    touch('touchend');
    fixture.detectChanges();
    expect(pull.refreshing()).toBeTrue();

    tick(300);
    expect(pull.refreshing()).toBeFalse();
  }));

  it('does not refresh below the threshold, or when the touch is cancelled', () => {
    drag(150);
    touch('touchend');
    drag(180);
    touch('touchcancel');

    expect(host.refreshed).toBe(0);
    expect(pull.distance()).toBe(0);
  });

  it('ignores a pull up, and stops counting when the pull turns into a scroll', () => {
    drag(60);
    expect(pull.distance()).toBe(0);

    drag(150);
    expect(pull.distance()).toBe(50);
    list.scrollTop = 20;
    touch('touchmove', 170);
    expect(pull.distance()).toBe(0);
  });

  it('ignores a pull that starts with the list scrolled, with two fingers, or with a sheet open', () => {
    list.scrollTop = 20;
    drag(180);
    expect(pull.distance()).toBe(0);
    list.scrollTop = 0;

    touch('touchstart', 100, 100);
    touch('touchmove', 180);
    expect(pull.distance()).toBe(0);

    const backdrop = document.createElement('div');
    backdrop.className = 'cdk-overlay-backdrop test-backdrop';
    TestBed.inject(OverlayContainer).getContainerElement().appendChild(backdrop);
    drag(180);
    expect(pull.distance()).toBe(0);
  });

  it('holds the browser pull to refresh on the page during a pull only', () => {
    const page = document.documentElement;
    page.style.overscrollBehaviorY = 'auto';

    touch('touchstart', 100);
    expect(page.style.overscrollBehaviorY).toBe('contain');
    touch('touchmove', 130);
    touch('touchend');
    expect(page.style.overscrollBehaviorY).toBe('auto');

    touch('touchstart', 100);
    touch('touchcancel');
    expect(page.style.overscrollBehaviorY).toBe('auto');

    touch('touchstart', 100);
    fixture.destroy();
    expect(page.style.overscrollBehaviorY).toBe('auto');
    page.style.overscrollBehaviorY = '';
  });

  it('ignores a touch that starts on a drag handle', () => {
    const handle = document.createElement('span');
    handle.className = 'cdk-drag-handle';
    list.appendChild(handle);

    handle.dispatchEvent(
      new TouchEvent('touchstart', { touches: [new Touch({ identifier: 0, target: handle, clientY: 100 })], bubbles: true })
    );
    touch('touchmove', 180);

    expect(pull.distance()).toBe(0);
    expect(document.documentElement.style.overscrollBehaviorY).not.toBe('contain');
  });

  it('stops listening when disabled', () => {
    host.enabled.set(false);
    fixture.detectChanges();

    drag(180);
    touch('touchend');

    expect(pull.distance()).toBe(0);
    expect(host.refreshed).toBe(0);
  });
});
