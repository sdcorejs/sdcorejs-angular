import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ISdLayoutConfiguration, SD_LAYOUT_CONFIGURATION } from '../../../../configurations';
import { RootComponent } from './root.component';

function configuration(homeUrl?: string): ISdLayoutConfiguration {
  return {
    homeUrl,
    sidebar: { version: 1 },
    userInfo: { fullName: 'Real User' },
    signout: jasmine.createSpy('signout'),
  };
}

describe('Forbidden RootComponent', () => {
  let fixture: ComponentFixture<RootComponent>;

  async function create(homeUrl?: string): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [RootComponent],
      providers: [provideRouter([]), { provide: SD_LAYOUT_CONFIGURATION, useValue: configuration(homeUrl) }],
    })
      .overrideComponent(RootComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(RootComponent);
    fixture.autoDetectChanges();
  }

  it('leaves the error page through the Router using the configured homeUrl', async () => {
    await create('/dashboard');
    const navigateByUrl = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);

    fixture.componentInstance.reload();

    expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('falls back to the app root when the consumer configured no homeUrl', async () => {
    await create();
    const navigateByUrl = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);

    fixture.componentInstance.reload();

    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('never touches window.location', async () => {
    // why: `window.location.href = ''` là global thô — throw khi SSR và chỉ reload lại chính trang lỗi.
    await create('/dashboard');
    spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    const before = window.location.href;

    fixture.componentInstance.reload();

    expect(window.location.href).toBe(before);
  });
});
