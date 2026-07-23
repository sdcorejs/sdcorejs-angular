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
  signal,
  viewChild,
} from '@angular/core';
import { SdAvatar } from '@sdcorejs/angular/components';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SD_LAYOUT_CONFIGURATION, SdLayoutUserInfo } from '../../../configurations';

@Component({
  selector: 'sd-layout-user-menu',
  standalone: true,
  imports: [SdAvatar, SdIcon],
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
  signout = input<(() => void | Promise<void>) | undefined>();
  changePassword = input<(() => void | Promise<void>) | undefined>();
  compact = input(false);
  isOpen = signal(false);

  avatar = computed(() => {
    const user = this.userInfo();
    return user.avatar || user.fullName || user.username || user.email;
  });
  displayName = computed(() => this.userInfo().fullName || this.userInfo().username || this.userInfo().email || 'User');
  signoutAction = computed(() => this.signout() ?? this.#configuration?.signout);
  changePasswordAction = computed(() => this.changePassword() ?? this.#configuration?.changePassword);

  constructor() {
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
    this.isOpen.set(true);
  }

  toggle(): void {
    if (this.isOpen()) this.close(false);
    else this.open();
  }

  close(restoreFocus = true): void {
    this.isOpen.set(false);
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
    this.changePasswordAction()?.();
    this.close();
  }

  runSignout(): void {
    this.signoutAction()?.();
    this.close();
  }
}
