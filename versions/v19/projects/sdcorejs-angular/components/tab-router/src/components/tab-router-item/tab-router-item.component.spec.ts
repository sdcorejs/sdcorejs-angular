import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';

import { SdTabRouterTab } from '../../models/tab-router.model';
import { SdTabRouterService } from '../../services/tab-router.service';
import { SdTabRouterItemComponent } from './tab-router-item.component';

describe('SdTabRouterItemComponent close delegation', () => {
  let fixture: ComponentFixture<SdTabRouterItemComponent>;
  let component: SdTabRouterItemComponent;
  let tabRouterServiceSpy: { close: jasmine.Spy; events: BehaviorSubject<undefined>; builders: BehaviorSubject<never[]> };

  beforeEach(async () => {
    tabRouterServiceSpy = {
      close: jasmine.createSpy('close'),
      events: new BehaviorSubject(undefined),
      builders: new BehaviorSubject([]),
    };

    await TestBed.configureTestingModule({
      imports: [SdTabRouterItemComponent, NoopAnimationsModule],
      providers: [
        { provide: SdTabRouterService, useValue: tabRouterServiceSpy },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SdTabRouterItemComponent);
    component = fixture.componentInstance;

    component.tab = {
      key: 'test-key',
      component: class {},
      isActive: false,
      url: '/test',
      tabInfoChanges: new Subject(),
    } as SdTabRouterTab;

    fixture.detectChanges();
  });

  it('calls tabRouterService.close() with the current tab when close is clicked', () => {
    component.close(new MouseEvent('click'));

    expect(tabRouterServiceSpy.close).toHaveBeenCalledOnceWith(component.tab);
  });

  it('does not run tab.beforeClose because the outlet owns the guard', () => {
    const beforeCloseSpy = jasmine.createSpy('beforeClose').and.returnValue(false);
    component.tab.beforeClose = beforeCloseSpy;

    component.close(new MouseEvent('click'));

    expect(tabRouterServiceSpy.close).toHaveBeenCalledOnceWith(component.tab);
    expect(beforeCloseSpy).not.toHaveBeenCalled();
  });

  it('delegates middle-click close to the service without running beforeClose', () => {
    const beforeCloseSpy = jasmine.createSpy('beforeClose').and.returnValue(false);
    component.tab.beforeClose = beforeCloseSpy;

    component.onMouseup(new MouseEvent('mouseup', { button: 1 }));

    expect(tabRouterServiceSpy.close).toHaveBeenCalledOnceWith(component.tab);
    expect(beforeCloseSpy).not.toHaveBeenCalled();
  });
});
