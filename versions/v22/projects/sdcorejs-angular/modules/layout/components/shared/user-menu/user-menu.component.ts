import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  isSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { SdAvatar } from '@sdcorejs/angular/components';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { isObservable } from 'rxjs';
import {
  SD_LAYOUT_CONFIGURATION,
  SdLayoutAccountAction,
  SdLayoutNotificationConfiguration,
  SdLayoutUserInfo,
} from '../../../configurations';

@Component({
  selector: 'sd-layout-user-menu',
  standalone: true,
  imports: [SdAvatar, SdIcon, SdTranslatePipe],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdLayoutUserMenuComponent {
  readonly #configuration = inject(SD_LAYOUT_CONFIGURATION, { optional: true });
  readonly #destroyRef = inject(DestroyRef);
  readonly #document = inject(DOCUMENT);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');

  userInfo = input.required<SdLayoutUserInfo>();
  signout = input<SdLayoutAccountAction | undefined>();
  changePassword = input<SdLayoutAccountAction | undefined>();
  updateProfile = input<SdLayoutAccountAction | undefined>();
  setting = input<SdLayoutAccountAction | undefined>();
  notification = input<SdLayoutNotificationConfiguration | undefined>();
  compact = input(false);
  presentation = input<'disclosure' | 'mobile' | 'mobile-inline'>('disclosure');
  opened = output<void>();
  closed = output<void>();
  isOpen = signal(false);
  readonly #observableNotificationCount = signal<number | undefined>(undefined);

  avatar = computed(() => {
    const user = this.userInfo();
    return user.avatar || user.fullName || user.username || user.email;
  });
  displayName = computed(() => this.userInfo().fullName || this.userInfo().username || this.userInfo().email || 'User');
  role = computed(() => {
    const role = this.userInfo().role;
    const text = role?.text?.trim();
    return text ? { ...role, text } : undefined;
  });
  signoutAction = computed(() => this.signout() ?? this.#configuration?.signout);
  changePasswordAction = computed(() => this.changePassword() ?? this.#configuration?.changePassword);
  updateProfileAction = computed(() => this.updateProfile() ?? this.#configuration?.updateProfile);
  settingAction = computed(() => this.setting() ?? this.#configuration?.setting);
  notificationConfiguration = computed(() => this.notification() ?? this.#configuration?.notification);
  notificationAction = computed(() => this.notificationConfiguration()?.action);
  notificationCount = computed(() => {
    const source = this.notificationConfiguration()?.count;
    const value = isSignal(source) ? source() : isObservable(source) ? this.#observableNotificationCount() : source;
    return this.#normalizeNotificationCount(value);
  });
  notificationBadge = computed(() => {
    const count = this.notificationCount();
    return count > 99 ? '99+' : count > 0 ? String(count) : undefined;
  });

  constructor() {
    // Observable sources may change with component inputs; effect cleanup guarantees one active subscription.
    effect(onCleanup => {
      const source = this.notificationConfiguration()?.count;
      this.#observableNotificationCount.set(undefined);
      if (!isObservable(source)) return;

      const subscription = source.subscribe(value => this.#observableNotificationCount.set(value));
      onCleanup(() => subscription.unsubscribe());
    });

    effect(() => {
      if (!this.isOpen()) return;
      this.menu()?.nativeElement.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    });

    const onDocumentKeydown = (event: KeyboardEvent): void => {
      if (!this.isOpen() || event.key !== 'Escape') return;
      event.preventDefault();
      this.close();
    };
    const onDocumentPointerDown = (event: PointerEvent): void => {
      if (!this.isOpen()) return;
      const nodeConstructor = this.#document.defaultView?.Node;
      if (!nodeConstructor || !(event.target instanceof nodeConstructor) || this.#host.nativeElement.contains(event.target)) return;
      this.close(false);
    };

    this.#document.addEventListener('keydown', onDocumentKeydown);
    this.#document.addEventListener('pointerdown', onDocumentPointerDown);
    this.#destroyRef.onDestroy(() => {
      this.#document.removeEventListener('keydown', onDocumentKeydown);
      this.#document.removeEventListener('pointerdown', onDocumentPointerDown);
    });
  }

  open(): void {
    if (this.isOpen()) return;
    this.isOpen.set(true);
    this.opened.emit();
  }

  toggle(): void {
    if (this.isOpen()) this.close(false);
    else this.open();
  }

  close(restoreFocus = true): void {
    const wasOpen = this.isOpen();
    this.isOpen.set(false);
    if (wasOpen) this.closed.emit();
    if (restoreFocus) this.trigger()?.nativeElement.focus();
  }

  onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || !(event.currentTarget instanceof HTMLElement)) return;

    const actions = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
    if (!actions.length) return;
    event.preventDefault();
    const currentIndex = actions.findIndex(action => action === this.#document.activeElement);
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? actions.length - 1
          : event.key === 'ArrowDown'
            ? (currentIndex + 1) % actions.length
            : (currentIndex - 1 + actions.length) % actions.length;
    actions[nextIndex].focus();
  }

  runChangePassword(): void {
    this.#runAction(this.changePasswordAction());
  }

  runSignout(): void {
    this.#runAction(this.signoutAction());
  }

  runUpdateProfile(): void {
    this.#runAction(this.updateProfileAction());
  }

  runSetting(): void {
    this.#runAction(this.settingAction());
  }

  runNotification(): void {
    this.#runAction(this.notificationAction());
  }

  #runAction(action: SdLayoutAccountAction | undefined): void {
    action?.();
    this.close();
  }

  #normalizeNotificationCount(value: number | undefined): number {
    return Number.isFinite(value) && Number(value) > 0 ? Math.floor(Number(value)) : 0;
  }
}
