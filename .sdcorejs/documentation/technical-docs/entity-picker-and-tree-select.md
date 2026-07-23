---
title: Entity Picker và Tree Select architecture
track: angular
status: implemented-in-v19
updated_at: 2026-07-23
source_of_truth: versions/v19/projects/sdcorejs-angular
---

# Entity Picker và Tree Select architecture

## Phạm vi

Task 9 thêm hai standalone `OnPush` secondary entrypoint:

- `@sdcorejs/angular/forms/entity-picker`;
- `@sdcorejs/angular/forms/tree-select`.

Task cũng mở rộng `@sdcorejs/angular/components/tree` bằng keyboard navigation, single/cascade selection, indeterminate state, root/lazy error retry và race containment. V19 là source-of-truth; rollout v20/v21 thuộc Task 14.

## Nguyên tắc composition

```text
SdEntityPicker -> SdModal
               -> SdQueryBar -> normalized SdQuery
               -> SdTable -> provider.load(request + AbortSignal)
               -> SdDataState(error/retry)

SdTreeSelect   -> SdModal
               -> SdTree(static/lazy + keyboard + selection + retry)
```

Picker không copy paging/filter/selection engine của Table. TreeSelect không copy tree flattening/expansion/lazy engine của Tree. Hai control chỉ quản lý model key, draft/commit và form connector.

## EntityPicker data flow

`SdEntityPickerDataProvider<T,TKey>` có hai operation:

1. `load(request)` trả `{items,total}` cho page hiện tại.
2. `hydrate(keys, signal)` tùy chọn, resolve key ban đầu/off-page để hiển thị.

Mỗi `loadPage` tăng version và abort controller cũ. Result/failure chỉ được commit nếu controller chưa abort và version vẫn là mới nhất. Cache entity merge theo `compareWith(keyOf(item), key)`; draft giữ `TKey[]`, không giữ object reference.

Select row cập nhật đúng một key. Select-all nhận page items từ `SdTable.dataItems`, loại các key của page khỏi draft rồi ghép selected keys của page, nhờ đó key ngoài page không bị mất. Apply chuyển draft thành scalar/null hoặc array tùy `multiple`; Cancel chỉ đóng modal.

Table option có key rõ ràng dựa trên `autoId/name`. Điều này tránh `ConfigService` hash toàn bộ option chứa `TemplateRef` có vòng lặp khi consumer project row template.

Hydration có controller độc lập. Lỗi hydration chỉ được xóa bởi một hydration thành công tương ứng; lỗi cũ đã abort không phát output. `sdLoadError` dùng chung surface cho app telemetry.

## Tree race và error model

Tree dùng hai lớp chống race:

- root `loadId`: mọi loader invocation tăng ID; signal source mới cũng tăng ID ngay lập tức để promise của source cũ không thể ghi đè;
- `treeGeneration` + per-node lazy load ID: root replacement vô hiệu mọi lazy response của generation cũ.

Root rejection được giữ tại `rootError`, render `role=alert` và retry. Lazy rejection được giữ trong `lazyErrorState[nodeId]`, gắn vào `SdTreeNode.loadError` và retry tại node. `loadError` output phân biệt root (`item` undefined) và branch (`item` có dữ liệu node).

## Tree selection state

Selection nội bộ dùng stable node ID. Controlled `selectedItems` vẫn được map về node ID để giữ API hiện có. `single` xóa selection trước khi chọn node mới. `cascade=descendants`:

1. thu thập node và loaded descendants không disabled;
2. thêm/xóa ID theo thao tác;
3. reconcile ancestors từ dưới lên;
4. parent có một phần child được đánh dấu indeterminate thay vì selected.

TreeSelect map selected raw entities về consumer keys và ghép lại hidden/unloaded keys chưa có trong `loadedEntities`. Vì vậy filter hoặc lazy loading không làm mất model ngoài viewport hiện tại.

## Keyboard và accessibility

`visibleNodes` tạo thứ tự roving tabindex. `activeNodeId` đảm bảo chỉ một treeitem có `tabindex=0`. Handler hỗ trợ Up/Down/Home/End/Left/Right/Enter/Space theo tree pattern; rows xuất `aria-level`, `aria-expanded`, `aria-selected`, và `aria-checked=mixed` khi indeterminate.

Picker triggers có `aria-haspopup=dialog`; `SdModal` chịu trách nhiệm dialog/focus trap. `sdClosed` queue microtask để trả focus về trigger. Default UI copy đi qua 14 key mới trong en/vi/ja/ko/zh.

## Form connector

Cả hai control tạo `SdFormControl` và gọi shared `ɵsdFormControlConnector` với form/name/model/required/disabled/readonly/viewed. Connector chịu trách nhiệm đăng ký lại khi parent/name đổi, validator required và model-control synchronization. Implementation không tạo một adapter Angular Forms riêng cho từng picker.

## Template contracts

EntityPicker export ba typed directives:

- `SdEntityPickerSelectedTemplateDirective<T,TKey>`;
- `SdEntityPickerRowTemplateDirective<T>`;
- `SdEntityPickerDetailTemplateDirective<T,TKey>`.

TreeSelect export `SdTreeSelectNodeTemplateDirective<T>` dựa trên `SdTreeItemContext<T>`. Tất cả directives có `ngTemplateContextGuard` để Angular template checker suy luận context.

## Public surface và packaging

Hai entrypoint được export từ `forms/index.ts`, `SdFormsModule`, và root public API. Để tránh cycle `components/table -> forms root -> entity-picker -> components/table`, các implementation Table chỉ import đúng secondary form entrypoint cần thiết (`forms/input`, `forms/select`, v.v.), không import barrel `forms`.

## Showcase

- EntityPicker: server single, multi hydration, row/detail templates, error/retry/create.
- TreeSelect: static single, cascade multiple, lazy, unloaded key viewed.
- Registry sau Task 9: 91 pages, 284 examples, 1396 route shells.

## Review repairs

Các finding được khóa bằng regression test hoặc integration failure trước khi sửa:

1. signal source mới vô hiệu promise root cũ;
2. select-all giữ key ngoài page;
3. hydration thành công xóa đúng lỗi hydration cũ;
4. projected Table `TemplateRef` không bị hash đệ quy nhờ option key ổn định;
5. template directives có typed context guards;
6. TreeSelect forward load error và UI actions dùng i18n.

## Source map

| Path                                                                | Responsibility                                                      |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `forms/entity-picker/src/entity-picker.component.*`                 | provider, cache, key draft/commit, Table/QueryBar/Modal composition |
| `forms/tree-select/src/tree-select.component.*`                     | key preservation, Tree/Modal composition                            |
| `components/tree/src/tree.component.*`                              | source/lazy state, keyboard, selection, retry                       |
| `components/tree/src/tree.model.ts`                                 | typed items/options/context/error contracts                         |
| `i18n/src/{en,vi,ja,ko,zh}.ts`                                      | default picker/tree action copy                                     |
| `projects/showcase/src/app/pages/forms/{entity-picker,tree-select}` | live examples                                                       |

## Remaining release work

- Rollout v20/v21 và published docs mapping trong Task 14.
- Full-suite repair, visual smoke và release gates trong Task 15.
- Package scripts `check:i18n`/`check:i18n-parity` vẫn trỏ tới baseline script bị thiếu; independent catalog parity được ghi nhận riêng cho tới khi Task 15 sửa gate.
