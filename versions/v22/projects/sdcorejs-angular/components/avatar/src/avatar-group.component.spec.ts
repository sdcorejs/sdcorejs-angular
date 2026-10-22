import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutTestTheme } from '../../../testing/layout-theme.spec';
import { SdAvatarGroup, SdAvatarGroupItem } from './avatar-group.component';
import { SdAvatar } from './avatar.component';

const PEOPLE: SdAvatarGroupItem[] = [
  { src: 'Lê Lan Anh', status: 'success', statusLabel: 'Đang hoạt động' },
  { src: 'Phạm Minh Quân', status: 'success', statusLabel: 'Đang gọi', statusPulse: true },
  { src: 'Trần Thu Hà', status: 'secondary', statusLabel: 'Ngoại tuyến' },
  { src: 'Đỗ Hải', status: 'warning', statusLabel: 'Vắng mặt' },
  { src: 'Nguyễn Bảo Ngọc', status: 'success', statusLabel: 'Đang hoạt động' },
  { src: 'https://example.com/long.png', name: 'Vũ Hoàng Long', status: 'error', statusLabel: 'Không làm phiền' },
  { src: 'Hoàng Mai Chi' },
];

// sd-avatar-group (design handoff wave 3 · 2b).
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdAvatarGroup, LayoutTestTheme],
  template: `
    <sd-layout-test-theme />
    <div style="padding: 24px">
      <sd-avatar-group [items]="items" [max]="max" [size]="size" [ariaLabel]="ariaLabel" />
    </div>
  `,
})
class GroupHost {
  items = PEOPLE;
  max = 4;
  size = 32;
  ariaLabel: string | undefined;
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdAvatarGroup, LayoutTestTheme],
  template: `<sd-avatar-group [items]="items" (moreClick)="more = $event" />`,
})
class MoreClickHost {
  items = PEOPLE;
  more: SdAvatarGroupItem[] | null = null;
}

const resolve = (property: string, value: string): string => {
  const probe = document.createElement('div');
  probe.style.setProperty(property, value);
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
};

describe('SdAvatarGroup', () => {
  let fixture: ComponentFixture<GroupHost>;
  let overlay: HTMLElement;

  const render = (patch: Partial<GroupHost>) => {
    Object.assign(fixture.componentInstance, patch);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
  };
  const group = () => fixture.nativeElement.querySelector('sd-avatar-group') as HTMLElement;
  const items = () => Array.from(group().querySelectorAll<HTMLElement>('.sd-avatar-group__item'));
  const more = () => group().querySelector('.sd-avatar-group__more') as HTMLButtonElement | null;
  const popover = () => overlay.querySelector('.sd-avatar-group__popover') as HTMLElement | null;
  const settle = () => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [GroupHost, MoreClickHost, NoopAnimationsModule] }).compileComponents();
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
    fixture = TestBed.createComponent(GroupHost);
    fixture.detectChanges();
  });

  afterEach(() => {
    overlay.innerHTML = '';
  });

  describe('counting', () => {
    it('shows max avatars and a "+N" button for the rest', () => {
      expect(items().length).toBe(4);
      expect(more()!.textContent!.trim()).toBe('+3');
    });

    it('shows the one extra person instead of a "+1" button', () => {
      render({ max: 6 });
      expect(items().length).toBe(7);
      expect(more()).toBeNull();
    });

    it('shows everybody and no button when the list fits', () => {
      render({ items: PEOPLE.slice(0, 3) });
      expect(items().length).toBe(3);
      expect(more()).toBeNull();
    });

    it('passes size, name and status down to each avatar', () => {
      render({ size: 40, max: 6 });
      const avatars = fixture.debugElement.queryAll(By.directive(SdAvatar)).map(debug => debug.componentInstance as SdAvatar);
      expect(avatars.every(avatar => avatar.size() === 40)).toBeTrue();
      expect(avatars[1].statusPulse()).toBeTrue();
      expect(avatars[5].name()).toBe('Vũ Hoàng Long');
      expect(avatars[5].status()).toBe('error');
    });
  });

  describe('layout', () => {
    it('overlaps each avatar by round(size × 0.15) and stacks the left one on top', () => {
      for (const [size, overlap] of [
        [24, 4],
        [32, 5],
        [64, 10],
      ] as const) {
        render({ size });
        const boxes = items().map(item => item.getBoundingClientRect());
        expect(boxes[1].left - boxes[0].left)
          .withContext(`size ${size}`)
          .toBeCloseTo(size - overlap, 0);
        const zIndexes = items().map(item => Number(getComputedStyle(item).zIndex));
        expect(zIndexes)
          .withContext('z-index falls from left to right')
          .toEqual([...zIndexes].sort((a, b) => b - a));
        expect(new Set(zIndexes).size).toBe(zIndexes.length);
        expect(Number(getComputedStyle(more()!).zIndex))
          .withContext('"+N" lies at the bottom')
          .toBeLessThan(Math.min(...zIndexes));
      }
    });

    it('rings each avatar with --sd-avatar-status-ring: 2px, 3px from size 64', () => {
      const ring = resolve('color', 'var(--sd-surface)');
      expect(getComputedStyle(items()[0]).boxShadow).toBe(`${ring} 0px 0px 0px 2px`);
      render({ size: 64 });
      expect(getComputedStyle(items()[0]).boxShadow).toBe(`${ring} 0px 0px 0px 3px`);
    });

    it('draws "+N" as a button of the avatar size on --sd-surface-muted with --sd-text-secondary text', () => {
      const button = more()!;
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');
      const box = button.getBoundingClientRect();
      expect(box.width).toBe(32);
      expect(box.height).toBe(32);
      const style = getComputedStyle(button);
      expect(style.backgroundColor).toBe(resolve('background-color', 'var(--sd-surface-muted)'));
      expect(style.color).toBe(resolve('color', 'var(--sd-text-secondary)'));
      expect(style.fontWeight).toBe('600');
      expect(style.fontSize).toBe('12.8px');
      expect(style.borderTopLeftRadius).toBe('50%');
    });
  });

  describe('accessibility', () => {
    it('is a group named "{n} người" by default, or by ariaLabel', () => {
      expect(group().getAttribute('role')).toBe('group');
      expect(group().getAttribute('aria-label')).toBe('7 người');
      render({ ariaLabel: 'Người phụ trách' });
      expect(group().getAttribute('aria-label')).toBe('Người phụ trách');
    });

    it('names "+N" "Xem thêm {n} người" and reports whether the list is open', fakeAsync(() => {
      expect(more()!.getAttribute('aria-label')).toBe('Xem thêm 3 người');
      expect(more()!.getAttribute('aria-expanded')).toBe('false');
      more()!.click();
      settle();
      expect(more()!.getAttribute('aria-expanded')).toBe('true');
    }));

    it('gives each avatar the tooltip "{name} · {statusLabel}"', () => {
      render({ max: 6 });
      const avatars = fixture.debugElement.queryAll(By.directive(SdAvatar)).map(debug => debug.componentInstance as SdAvatar);
      expect(avatars[0].tooltip()).toBe('Lê Lan Anh · Đang hoạt động');
      expect(avatars[5].tooltip()).toBe('Vũ Hoàng Long · Không làm phiền');
      expect(avatars[6].tooltip()).toBe('Hoàng Mai Chi');
    });
  });

  describe('popover', () => {
    it('lists the hidden people in a 280px dialog titled "{n} người khác", focusing the first row', fakeAsync(() => {
      more()!.click();
      settle();
      const el = popover()!;
      expect(el).not.toBeNull();
      expect(el.getAttribute('role')).toBe('dialog');
      expect(el.getBoundingClientRect().width).toBe(280);
      expect(el.querySelector('.sd-avatar-group__popover-title')!.textContent!.trim()).toBe('3 người khác');
      const rows = Array.from(el.querySelectorAll<HTMLElement>('.sd-avatar-group__row'));
      expect(rows.map(row => row.querySelector('.sd-avatar-group__row-name')!.textContent!.trim())).toEqual([
        'Nguyễn Bảo Ngọc',
        'Vũ Hoàng Long',
        'Hoàng Mai Chi',
      ]);
      expect(rows.map(row => row.querySelector('.sd-avatar-group__row-status')?.textContent?.trim() ?? '')).toEqual([
        'Đang hoạt động',
        'Không làm phiền',
        '',
      ]);
      expect(rows[0].getBoundingClientRect().height).toBe(44);
      expect(rows[0].querySelector('sd-avatar .sd-avatar')!.getBoundingClientRect().width).toBe(28);
      expect(getComputedStyle(el.querySelector('.sd-avatar-group__list')!).maxHeight).toBe('320px');
      expect(document.activeElement).toBe(rows[0]);
    }));

    it('closes on Esc and returns focus to "+N"', fakeAsync(() => {
      more()!.click();
      settle();
      document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      settle();
      expect(popover()).toBeNull();
      expect(document.activeElement).toBe(more());
      expect(more()!.getAttribute('aria-expanded')).toBe('false');
    }));

    it('emits moreClick with the hidden people instead of opening when it is listened to', fakeAsync(() => {
      const host = TestBed.createComponent(MoreClickHost);
      host.detectChanges();
      (host.nativeElement.querySelector('.sd-avatar-group__more') as HTMLButtonElement).click();
      host.detectChanges();
      tick();
      expect(host.componentInstance.more?.map(item => item.src)).toEqual([
        'Nguyễn Bảo Ngọc',
        'https://example.com/long.png',
        'Hoàng Mai Chi',
      ]);
      expect(popover()).toBeNull();
    }));
  });
});
