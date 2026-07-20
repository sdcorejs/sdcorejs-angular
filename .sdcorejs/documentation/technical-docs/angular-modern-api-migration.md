---
title: Angular modern API migration
track: angular
status: implemented
updated_at: 2026-07-20
source_of_truth: versions/v19/projects/sdcorejs-angular
---

# Angular modern API migration

## Mục đích

Thư viện được rà soát để ưu tiên API hiện đại của Angular: signal inputs bằng `input()`, signal outputs bằng `output()` và dependency injection bằng `inject()`. Thay đổi được thực hiện tại workspace v19 rồi mirror sang v20/v21; public binding name và hành vi template được giữ nguyên.

Đây là migration có kiểm soát, không phải chuyển đổi cơ học toàn bộ. Những trường hợp schematic không chứng minh được tính tương thích vẫn giữ decorator hoặc constructor DI và được ghi nhận như ngoại lệ có chủ đích.

## Phạm vi và kết quả

| Nhóm                        |            Kết quả tại v19 |                                                               Ngoại lệ còn lại |
| --------------------------- | -------------------------: | -----------------------------------------------------------------------------: |
| `@Input` → `input()`        |      76 inputs được chuyển |                                                           180 decorator inputs |
| `@Output` → `output()`      |     44 outputs được chuyển |                                                            7 decorator outputs |
| Constructor DI → `inject()` |        68 file được chuyển |             6 runtime constructor arguments và 1 direct-instantiation contract |
| Internal state → signal     | Rà soát 216 signal hiện có | Không mass-convert state khi chưa chứng minh được lifecycle/identity semantics |

Phạm vi source thay đổi ở v19 gồm 119 file: 89 TypeScript và 30 template. `npm run sync` tạo cùng thay đổi tương ứng cho v20 và v21.

## Input migration

Signal input giữ nguyên binding name của template. Consumer tiếp tục dùng cùng cú pháp:

```html
<sd-component [value]="value"></sd-component>
```

Trong class, input đã migrate là `InputSignal<T>` và phải đọc bằng lời gọi hàm:

```ts
readonly value = input<string>();

protected normalizedValue = computed(() => this.value()?.trim());
```

180 decorator inputs được giữ lại vì safe migration không chứng minh được tương thích. Phần lớn là setter inputs, aliases hoặc thuộc khu vực `form-generic`; 22 trường hợp trong `modules/generic` còn chịu ảnh hưởng của lỗi type-check tồn tại từ trước. Không ép chuyển các trường hợp này vì setter side effect, timing và khả năng ghi trực tiếp vào property là public contract thực tế.

## Output migration

Output đã migrate dùng `OutputEmitterRef<T>` nhưng giữ nguyên event name và `.emit(...)`, nên template consumer không đổi:

```html
<sd-component (sdChange)="onChange($event)"></sd-component>
```

TypeScript consumer không nên phụ thuộc vào RxJS-specific APIs của `EventEmitter` như `pipe`, `complete` hoặc `error`; `output()` chỉ cam kết `emit` và subscription theo Angular output contract.

### Ngoại lệ `EventEmitter`

| Component                | Output                                   | Lý do giữ lại                                                                                                  |
| ------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `SdBadge`                | `click`                                  | Template đọc `.observed` để quyết định pointer styling                                                         |
| `SdAutocomplete`         | `sdAdd`                                  | Template đọc `.observed` để quyết định render add action                                                       |
| `SdInput`                | `sdFocusForceBlur`                       | Focus handling đọc `.observed`                                                                                 |
| `SdInputNumber`          | `sdFocusForceBlur`                       | Focus handling đọc `.observed`                                                                                 |
| `GenericSelectComponent` | `modelChange`, `sdChange`, `sdSelection` | Contract type hiện tại không nhất quán với các giá trị thực tế được emit; module đã có lỗi type-check baseline |

Không thay `.observed` bằng kiểm tra nội bộ khác vì điều đó sẽ thay đổi hành vi render/focus khi consumer đăng ký listener.

## Dependency injection

Các dependency do Angular cung cấp được chuyển từ constructor parameter properties sang field initializer dùng `inject()`. Compatibility constructors được giữ ở các public class có khả năng tham gia inheritance để tránh phá constructor shape của lớp kế thừa.

Constructor vẫn hợp lệ khi parameter là runtime data thay vì dependency, ví dụ `route`, `parentInjector` hoặc `formControl`. `VariableComponent` tiếp tục nhận `ChangeDetectorRef` trong constructor vì class này có call site khởi tạo trực tiếp bằng `new VariableComponent(ref)` ngoài Angular injection context; dùng field `inject()` ở đây gây `NG0203`.

## Quy tắc đồng bộ đa phiên bản

`versions/v19` là source of truth. Không sửa logic dùng chung trực tiếp trong `versions/v20` hoặc `versions/v21`.

```powershell
npm run sync
npm run check:sync
```

Sync mirror source, template và trạng thái workspace sang hai major derived. Các thay đổi chỉ dành riêng cho một Angular major phải được tách khỏi vùng mirror và ghi rõ lý do.

## Verification

Các gate đã chạy cho migration:

- `npm run lint:release`: pass cho v19, v20 và v21.
- Full library build: pass cho cả ba workspace.
- `npm run check:sync`: pass sau khi mirror từ v19.
- Focused regression cho `VariableComponent`: 1/1 pass sau khi khôi phục constructor DI.
- Full Karma sau fix: 3.198 pass, 15 fail, 9 skip. Regression do migration không còn; 13 failures tái hiện ở code ngoài diff và 2 drag/drop failures phụ thuộc test order.
- Coverage baseline vẫn thấp hơn threshold: statements 67,9%, lines 68,35%, functions 66,18%.

Full test suite vì vậy chưa phải green gate của repository. Không hạ threshold hoặc nới assertion để che baseline; các failure còn lại cần được xử lý như một follow-up độc lập.

## Checklist cho migration tiếp theo

1. Chạy Angular schematic ở safe mode trên v19.
2. Kiểm tra setter inputs, aliased inputs, `.observed`, direct class construction và inheritance trước khi sửa thủ công.
3. Chạy focused tests cho các contract bị chạm.
4. Chạy build/lint v19, sau đó `npm run sync` và verify v20/v21.
5. Chỉ chuyển internal state sang signal khi equality, mutation, lifecycle timing và template consumption đều rõ ràng.

## Entry points liên quan

| Path                                                                                                                                  | Trách nhiệm                                     |
| ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `versions/v19/projects/sdcorejs-angular`                                                                                              | Source of truth cho library implementation      |
| `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/components/variable/variable.component.ts` | Ngoại lệ constructor DI do direct instantiation |
| `versions/v19/projects/sdcorejs-angular/components/badge/src/badge.component.ts`                                                      | Ngoại lệ output `.observed`                     |
| `versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.ts`                                             | Ngoại lệ output `.observed`                     |
| `versions/v19/projects/sdcorejs-angular/forms/input/src/input.component.ts`                                                           | Ngoại lệ focus output `.observed`               |
| `versions/v19/projects/sdcorejs-angular/forms/input-number/src/input-number.component.ts`                                             | Ngoại lệ focus output `.observed`               |
| `versions/v19/projects/sdcorejs-angular/modules/generic/components/generic-select/generic-select.component.ts`                        | Output contract cần sửa type trước khi migrate  |
| `scripts/sync-multi-version-workspaces.ps1`                                                                                           | Mirror v19 sang v20/v21                         |
| `scripts/check-version-sync.mjs`                                                                                                      | Kiểm tra parity giữa ba workspace               |
