import { Component, Injector, runInInjectionContext } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ɵsdTimerScope } from './sd-timer-scope';

@Component({ standalone: true, template: '' })
class TimerHost {
  readonly timers = ɵsdTimerScope();
  readonly ran: string[] = [];
}

describe('ɵsdTimerScope', () => {
  it('runs the handler with the same delay as setTimeout', fakeAsync(() => {
    const fixture = TestBed.createComponent(TimerHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;

    host.timers.schedule(() => host.ran.push('late'), 150);
    tick(149);
    expect(host.ran).toEqual([]);

    tick(1);
    expect(host.ran).toEqual(['late']);

    fixture.destroy();
  }));

  it('defaults to a zero delay (next macrotask)', fakeAsync(() => {
    const fixture = TestBed.createComponent(TimerHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;

    host.timers.schedule(() => host.ran.push('soon'));
    expect(host.ran).toEqual([]);

    tick();
    expect(host.ran).toEqual(['soon']);

    fixture.destroy();
  }));

  it('clears every pending handler when the host is destroyed', fakeAsync(() => {
    const fixture = TestBed.createComponent(TimerHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;

    host.timers.schedule(() => host.ran.push('a'), 100);
    host.timers.schedule(() => host.ran.push('b'), 150);
    expect(host.timers.pending).toBe(2);

    fixture.destroy();

    expect(host.timers.pending).toBe(0);
    // why: nếu handle không bị clear thì fakeAsync sẽ chạy nốt và `ran` có phần tử.
    tick(500);
    expect(host.ran).toEqual([]);
  }));

  it('ignores scheduling once the host is destroyed', fakeAsync(() => {
    const fixture = TestBed.createComponent(TimerHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;

    fixture.destroy();
    host.timers.schedule(() => host.ran.push('after-destroy'), 10);

    expect(host.timers.pending).toBe(0);
    tick(100);
    expect(host.ran).toEqual([]);
  }));

  it('drops the handle before invoking the handler so re-scheduling is tracked', fakeAsync(() => {
    const fixture = TestBed.createComponent(TimerHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;

    host.timers.schedule(() => {
      host.ran.push('first');
      host.timers.schedule(() => host.ran.push('second'), 50);
    }, 50);

    tick(50);
    expect(host.ran).toEqual(['first']);
    expect(host.timers.pending).toBe(1);

    tick(50);
    expect(host.ran).toEqual(['first', 'second']);
    expect(host.timers.pending).toBe(0);

    fixture.destroy();
  }));

  it('clear() cancels pending handlers without waiting for destroy', fakeAsync(() => {
    const fixture = TestBed.createComponent(TimerHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;

    host.timers.schedule(() => host.ran.push('cancelled'), 100);
    host.timers.clear();

    tick(200);
    expect(host.ran).toEqual([]);

    // why: clear() KHÔNG đóng scope — schedule sau đó vẫn phải chạy.
    host.timers.schedule(() => host.ran.push('after-clear'), 10);
    tick(10);
    expect(host.ran).toEqual(['after-clear']);

    fixture.destroy();
  }));

  it('works from any injection context, not just components', fakeAsync(() => {
    const scope = runInInjectionContext(TestBed.inject(Injector), () => ɵsdTimerScope());
    const ran: string[] = [];

    scope.schedule(() => ran.push('root'), 10);
    tick(10);

    expect(ran).toEqual(['root']);
  }));

  it('refuses to be created outside an injection context', () => {
    expect(() => ɵsdTimerScope()).toThrow();
  });
});
