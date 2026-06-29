# SdSelectFooterActionDirective — `when()` Function Support

**Date:** 2026-06-24
**Status:** Approved
**Branch:** hung.pham15/object-utilities

---

## Problem

`SdSelectFooterActionDirective` hiện có hai input để kiểm soát visibility:

- `when`: `'always' | 'empty' | 'has-result'` — logic cứng, không mở rộng được
- `pattern`: `RegExp | string` — chỉ test regex trên `searchText`, là một special-case cứng nhắc

Người dùng muốn logic phức tạp hơn (ví dụ: email hợp lệ + không trùng danh sách + kiểm tra server) không thể làm được mà không đưa logic vào template — vi phạm nguyên tắc của directive.

---

## Solution

1. **Bỏ `pattern` input** — breaking change, intentional.
2. **Mở rộng `when` type** để nhận function `(ctx) => boolean | Promise<boolean>`.
3. **Mở rộng `SdSelectFooterActionContext`** — thêm `filteredItems: unknown[]` và `selectedItems: unknown[]` để function có đủ thông tin.
4. **Xử lý async** trong component bằng signal + effect — kết quả được cache, không block CD.

---

## API Changes

### `SdSelectFooterActionContext` (mở rộng)

```typescript
export interface SdSelectFooterActionContext {
  searchText: string;
  filteredItems: unknown[];   // thêm mới
  selectedItems: unknown[];   // thêm mới
}
```

### Types mới

```typescript
export type SdSelectFooterActionWhenFn =
  (ctx: SdSelectFooterActionContext) => boolean | Promise<boolean>;

export type SdSelectFooterActionWhen =
  'always' | 'empty' | 'has-result' | SdSelectFooterActionWhenFn;
```

### `SdSelectFooterActionDirective`

```typescript
// BEFORE
readonly when    = input<'always' | 'empty' | 'has-result'>('always');
readonly pattern = input<RegExp | string | undefined>();   // ← XÓA

// AFTER
readonly when = input<SdSelectFooterActionWhen>('always');
// pattern đã bị xóa hoàn toàn
```

---

## Behavior

### String `when` (không thay đổi)

| Giá trị | Điều kiện hiển thị |
|---------|-------------------|
| `'always'` | Luôn hiển thị |
| `'empty'` | `searchText.length > 0` **và** không có item nào có `value === searchText.trim()` |
| `'has-result'` | `filteredItems.length > 0` |

### Function `when`

- Được gọi với `SdSelectFooterActionContext` mỗi khi `searchText`, `filteredItems`, hoặc `selectedItems` thay đổi.
- Hỗ trợ cả sync (`() => boolean`) và async (`async () => boolean`).
- Giá trị ban đầu trong khi Promise đang resolve: `false` (ẩn footer).
- Kết quả được lưu trong `WeakMap` signal riêng — không ảnh hưởng đến string-based `when`.

---

## Component Changes (`select.component.ts`)

### `footerActionContext` computed (cập nhật)

```typescript
readonly footerActionContext = computed(() => ({
  searchText: this.searchText(),
  filteredItems: this.filteredItems() as unknown[],
  selectedItems: this.selectedItems() as unknown[],
}));
```

### Signal mới

```typescript
readonly #footerFnVisibility =
  signal<WeakMap<SdSelectFooterActionDirective, boolean>>(new WeakMap());
```

### Effect mới (trong constructor)

```typescript
effect(() => {
  const actions = this.footerActions();
  const context = this.footerActionContext();

  const fnActions: Array<{
    action: SdSelectFooterActionDirective;
    fn: SdSelectFooterActionWhenFn;
  }> = [];
  for (const action of actions) {
    const when = action.when();
    if (typeof when === 'function') fnActions.push({ action, fn: when });
  }

  if (!fnActions.length) return;

  Promise.all(
    fnActions.map(async ({ action, fn }) => ({
      action,
      result: await Promise.resolve(fn(context)),
    }))
  ).then(results => {
    const map = new WeakMap<SdSelectFooterActionDirective, boolean>();
    results.forEach(({ action, result }) => map.set(action, result));
    this.#footerFnVisibility.set(map);
    this.#ref.markForCheck();
  });
});
```

### `shouldRenderFooterAction` (cập nhật)

```typescript
shouldRenderFooterAction(action: SdSelectFooterActionDirective): boolean {
  const when = action.when();

  if (typeof when === 'function') {
    return this.#footerFnVisibility().get(action) ?? false;
  }

  if (when === 'always') return true;
  if (when === 'empty') {
    return this.searchText().length > 0 &&
      this.filteredItems().every(item => this.itemValue(item) !== this.searchText().trim());
  }
  if (when === 'has-result') return this.filteredItems().length > 0;
  return false;
}
```

---

## Usage — Before / After

### Before (sẽ không còn hoạt động)

```html
<ng-template sdSelectFooterAction when="empty" [pattern]="emailPattern" let-searchText="searchText">
  <button (click)="add(searchText)">Thêm "{{ searchText }}"</button>
</ng-template>
```

### After — sync function

```typescript
readonly emailWhen = (ctx: SdSelectFooterActionContext): boolean =>
  ctx.searchText.trim().length > 0 &&
  this.emailPattern.test(ctx.searchText.trim()) &&
  (ctx.filteredItems as EmailOption[]).every(i => i.value !== ctx.searchText.trim().toLowerCase());
```

```html
<ng-template sdSelectFooterAction [when]="emailWhen" let-searchText="searchText">
  <button (click)="add(searchText)">Thêm "{{ searchText }}"</button>
</ng-template>
```

### After — async function

```typescript
readonly emailWhenAsync = async (ctx: SdSelectFooterActionContext): Promise<boolean> => {
  if (!this.emailPattern.test(ctx.searchText.trim())) return false;
  await new Promise<void>(r => setTimeout(r, 300)); // simulate server check
  return !this.emailItems.some(i => i.value === ctx.searchText.trim().toLowerCase());
};
```

---

## Breaking Changes

| Thay đổi | Migration |
|---------|-----------|
| `pattern` input bị xóa | Chuyển logic `pattern` + `when` thành một function `[when]="myFn"` |
| `SdSelectFooterActionContext` thêm 2 trường | Backward-compatible — template không bị ảnh hưởng; function `when` cũ nếu có sẽ nhận thêm 2 trường mới trong context (không gây lỗi) |

---

## Test Coverage

| Test | Loại |
|------|------|
| `pattern` input không còn tồn tại trên directive | Unit |
| Sync `when()` trả về `true` → footer visible | Integration |
| Sync `when()` trả về `false` → footer ẩn | Integration |
| Async `when()` resolve `true` → footer visible | Integration |
| Context truyền `filteredItems` + `selectedItems` vào function | Integration |
| Function `when` thay thế `pattern` + `when="empty"` (email demo) | Integration |

---

## Files Affected

| File | Loại thay đổi |
|------|--------------|
| `forms/select/src/select-footer-action.directive.ts` | Breaking — bỏ `pattern`, thêm types |
| `forms/select/src/select.component.ts` | Additive — signal + effect + cập nhật method |
| `forms/select/src/select.component.spec.ts` | Update tests |
| `demo/.../sd-select-demo.component.ts` | Cập nhật demo |
| `demo/.../sd-select-demo.component.html` | Cập nhật demo |
| `forms/select/sd-select.md` | Cập nhật docs |
