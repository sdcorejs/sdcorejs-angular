import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

const KINDS: Readonly<Record<string, { readonly code: string; readonly title: string; readonly message: string }>> = {
  'not-found': { code: '404', title: 'Không tìm thấy', message: 'Bản ghi không tồn tại hoặc đã bị xoá.' },
  forbidden: { code: '403', title: 'Không có quyền', message: 'Vai trò hiện tại không được mở màn này. Đổi vai trò ở thanh công cụ mẫu.' },
  unavailable: { code: '!', title: 'Không kết nối được', message: 'Máy chủ không trả lời hoặc trả lỗi. Thử lại sau.' },
};

/** Error page of the showcase (the host) for the pattern routes: resolver 404/timeout and Core `onForbiden`. */
@Component({
  selector: 'app-pattern-error',
  standalone: true,
  imports: [RouterLink],
  template: `
    @let _error = error();
    <main class="pattern-error" role="alert">
      <span class="pattern-error__code">{{ _error.code }}</span>
      <h1 class="T20M">{{ _error.title }}</h1>
      <p>{{ _error.message }}</p>
      <a routerLink="/pattern">Về mục lục Pattern</a>
    </main>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 98;
      display: grid;
      place-items: center;
      background: var(--sd-page-bg, #f9f9f9);
    }
    .pattern-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      text-align: center;
    }
    .pattern-error__code {
      color: var(--sd-text-secondary);
      font-size: 48px;
      font-weight: 500;
    }
    h1,
    p {
      margin: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatternErrorComponent {
  readonly #kind = toSignal(inject(ActivatedRoute).paramMap.pipe(map(params => params.get('kind') ?? '')), { initialValue: '' });
  readonly error = computed(() => KINDS[this.#kind()] ?? KINDS['unavailable']);
}
