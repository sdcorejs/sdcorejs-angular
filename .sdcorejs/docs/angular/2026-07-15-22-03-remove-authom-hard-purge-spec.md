# Spec - Gỡ toàn bộ AuthOM khỏi @sdcorejs/angular và Showcase - 2026-07-15 22:03

## Problem & Goals

`@sdcorejs/angular` hiện phát hành secondary entrypoint
`@sdcorejs/angular/modules/authom`, quảng bá nó trong Core UI documentation và
đưa nó vào Showcase documentation registry. Repository còn giữ design/plan cũ
và 31 archive tài liệu đã phát hành có module hoặc cross-link AuthOM.

Người dùng không muốn thư viện tiếp tục liên quan đến nền tảng OM và đã chọn
hard-purge toàn repository thay vì deprecate hoặc chỉ gỡ khỏi sản phẩm hiện tại.
Thành công nghĩa là source, public API, Showcase, README, hồ sơ tính năng cũ và
published-doc archive không còn module/cross-link AuthOM, trong khi các module
Auth, Keycloak, Permission và Layout vẫn hoạt động như trước.

Đây là breaking removal có chủ ý. Không cung cấp compatibility stub, alias hoặc
deprecated façade vì bất kỳ lớp tương thích nào cũng tiếp tục duy trì liên hệ mà
người dùng muốn loại bỏ.

## Confirmed decisions

- Phạm vi được chọn: hard-purge cả source hiện hành và lịch sử repository.
- v19 là source of truth; v20/v21 chỉ nhận source/showcase deletion qua root sync.
- 31 published release archive được rewrite có chủ ý dù convention bình thường coi chúng là immutable.
- Các package npm đã phát hành và Git history không thể bị thay đổi bởi task này.
- Spec/plan mới mô tả quyết định removal được giữ làm audit trail; old AuthOM feature specs/plans bị xóa.
- Những reference OneMount không liên quan trực tiếp đến AuthOM, như author/email lịch sử, nằm ngoài phạm vi.
- Coverage dùng structural RED -> GREEN kết hợp existing Showcase tests, sync guard và production builds.

## Non-goals

- Không xóa hoặc redesign các module `auth`, `keycloak`, `permission`, `layout` hay `icon`.
- Không tạo identity provider, OAuth/OIDC client hoặc replacement module mới.
- Không xóa dependency dùng chung chỉ vì AuthOM từng import nó; hiện không có dependency chỉ dành riêng cho module này.
- Không sửa generated `dist/**` bằng tay; production build chịu trách nhiệm tái tạo package metadata.
- Không rewrite Git history, unpublish npm package cũ, bump version, tag, publish hoặc deploy trong task implementation.
- Không scrub mọi chuỗi `OneMount` không liên quan tới integration bị xóa.

## Architecture

### Core UI and public API

Xóa toàn bộ secondary entrypoint
`versions/v19/projects/sdcorejs-angular/modules/authom/**` và bỏ re-export khỏi
`modules/index.ts`. `src/public-api.ts` vẫn export umbrella `modules` vì các
module khác còn được hỗ trợ. Không giữ stub; consumer import entrypoint cũ sẽ
nhận compile/package-resolution error rõ ràng.

Các README và module document hiện hành được viết lại để chỉ mô tả Auth,
Keycloak, Permission, Layout và các app-owned provider. Mọi cross-link tới
`sd-authom.md` bị xóa, nhưng contract/runtime của bốn module còn lại không đổi.

### Showcase

Xóa AuthOM khỏi `documentation.registry.ts`. Navigation và route đều được sinh
từ registry nên không cần route/component riêng để xóa; URL legacy sẽ đi vào
not-found qua guard hiện có. Cập nhật registry count tests và markdown link
resolution test, không thay generic renderer. AuthOM không có live demo nên
tổng example/demo count vẫn giữ nguyên.

### Multi-version rollout

Mọi source, docs và Showcase edit dùng chung được thực hiện tại v19 trước. Root
`npm run sync` mirror cả deletion sang v20/v21; `npm run check:sync` chứng minh
parity. Không hand-edit shared logic tại derived workspaces.

### Historical repository purge

Xóa 2 hồ sơ feature cũ ở root và 6 mirror tương ứng trong v19/v20/v21. Với 31
published release archive, xóa `modules/authom/sd-authom.md`, bỏ entry khỏi từng
`index.json`, bỏ cross-link trong `auth`, `keycloak`, `layout`, `permission`, rồi
cập nhật document count trong index và `published-docs/versions.json`.
`published-docs/catalog.json` được tái tạo từ archive đã purge.

Archive rewrite phải có tính cơ học và giới hạn: ngoài file AuthOM, direct
cross-link và metadata count/catalog liên quan, nội dung release lịch sử khác
phải được giữ nguyên. Sau rewrite, manifest/index/catalog integrity test phải
vẫn pass.

Contract này được giữ trong một spec vì active registry và published-doc
integrity phải cùng đạt GREEN; implementation plan có thể chia phase nhưng
partial purge không được coi là hoàn tất.

### Runtime and data flow

Sau removal không còn AuthOM initialization, token lifecycle, interceptor,
silent-refresh iframe, storage key hay route data flow trong package. Auth,
Keycloak, Permission và Layout tiếp tục dùng provider/service riêng hiện có.
Task không chạm backend, persistence, permission model hoặc dữ liệu người dùng.

## File structure

- `versions/v19/projects/sdcorejs-angular/modules/authom/**` - delete secondary entrypoint source, docs and package config.
- `versions/v19/projects/sdcorejs-angular/modules/index.ts` - remove public re-export.
- `versions/v19/projects/sdcorejs-angular/{README.md,modules/{auth,keycloak,layout,permission}/*.md}` - remove current cross-references.
- `versions/v19/projects/showcase/src/app/docs/core/documentation.registry.ts` - remove registry page.
- `versions/v19/projects/showcase/src/app/docs/core/documentation.registry.spec.ts` - update page/category expectations.
- `versions/v19/projects/showcase/src/app/docs/shared/markdown-renderer.component.spec.ts` - remove legacy link expectation.
- `versions/v19/README.md`, root `README.md`, `docs/npm-README.md` - remove current product claims.
- `versions/v20/**`, `versions/v21/**` - generated rollout of matching v19 deletions/edits.
- `docs/superpowers/{specs/2026-05-05-authom-module-design.md,plans/2026-05-06-authom-module.md}` and version mirrors - delete old feature records.
- `published-docs/{version}/**`, `published-docs/versions.json`, `published-docs/catalog.json` - purge 31 archives and repair manifests/catalog.
- `.sdcorejs/docs/angular/**`, `.sdcorejs/specs/angular/**`, `.sdcorejs/plans/angular/**` - retain only the new removal change-control trail created by the workflow.

## Acceptance criteria

1. **AC-001:** `modules/authom` does not exist in v19, v20 or v21, and no public barrel/package metadata exports `@sdcorejs/angular/modules/authom` after clean builds.
2. **AC-002:** Active library docs, root/package README files and supported module docs contain no AuthOM name, symbol, import path, silent-refresh file, storage key or direct AuthOM/Auth0 comparison.
3. **AC-003:** Showcase registry/navigation contains no AuthOM entry; its legacy documentation URL resolves through the existing not-found behavior; category/page/published-ID tests reflect one fewer page while the live demo/example count remains unchanged.
4. **AC-004:** The eight old AuthOM feature spec/plan files at root and version mirrors are deleted.
5. **AC-005:** Every one of the 31 published archives has its AuthOM Markdown file and index entry removed, its direct cross-links cleaned, and its document count decremented exactly once.
6. **AC-006:** `published-docs/versions.json` and `catalog.json` match the purged archive corpus; the checked-in published-doc manifest/index/registry integrity test exits 0.
7. **AC-007:** Auth, Keycloak, Permission, Layout and Icon remain exported and their focused/current tests compile without behavior changes attributable to the purge.
8. **AC-008:** No shared dependency is removed unless a fresh dependency-usage proof shows it is unused outside the deleted module; baseline audit currently finds no AuthOM-only dependency.
9. **AC-009:** Structural absence assertion is observed RED before removal and GREEN after removal for module paths, public exports, Showcase registration, old feature records and published archives.
10. **AC-010:** `npm run sync` and `npm run check:sync` exit 0, proving v20/v21 match v19 after deletion.
11. **AC-011:** Showcase generator/registry/markdown tests and production builds for `@sdcorejs/angular` on v19/v20/v21 exit 0; v19 Showcase production build also exits 0.
12. **AC-012:** Final residue scan finds no AuthOM integration reference outside the newly approved removal spec/plan/checkpoint; unrelated OneMount attribution, Git history and already-published npm artifacts are explicitly exempt.
13. **AC-013:** Implementation does not commit, push, tag, publish or deploy unless the user separately authorizes that Git/release action.

## Test and verification expectations

- Before edit, run one structural assertion that expects forbidden active/archive paths and references to be absent; capture the current failure as RED.
- After purge, run the identical assertion with only the new removal workflow records allow-listed; require zero unexpected matches as GREEN.
- Run root Showcase generator tests, focused v19 Showcase tests and registry/markdown component tests.
- Run `npm run sync` followed by `npm run check:sync`.
- Run production library builds in v19/v20/v21 and v19 Showcase production build.
- Run published-doc manifest/index/catalog integrity checks after archive rewrite.
- Run `git diff --check`, inspect deleted/edited file scope and verify `.superpowers/` temporary files remain outside task changes.

## Risks & mitigations

- **Risk:** Removing the secondary entrypoint breaks existing consumers. -> **Mitigation:** treat this as an explicit breaking removal; do not mask it with a stub, and report the removed import surface in delivery/release notes when a release is authorized.
- **Risk:** Rewriting immutable archives makes old docs differ from old npm packages. -> **Mitigation:** record the user's explicit purge decision, limit edits to direct AuthOM content/metadata and verify every archive structurally.
- **Risk:** Deleting one archive file without updating JSON counts/catalog breaks Pages and Showcase tests. -> **Mitigation:** transform each archive atomically, recompute metadata and run integrity tests.
- **Risk:** Broad `OM` searches can match unrelated packages or names. -> **Mitigation:** match exact integration identifiers and manually classify generic OneMount references instead of deleting substring matches blindly.
- **Risk:** Root sync deletes unrelated v20/v21 work. -> **Mitigation:** capture pre-sync status, edit v19 only, review generated diff and preserve the existing `.superpowers/` untracked companion files.
- **Risk:** Generated `dist` may retain stale entrypoint metadata. -> **Mitigation:** use clean production builds and inspect rebuilt package exports; never edit `dist` manually.

## Out of scope (deferred)

- Git history rewrite - only reconsider after a separate repository-history and remote-coordination plan.
- npm unpublish/deprecate of already released package versions - only perform through a separate npm release/incident decision.
- Replacement identity integration - require a new independent spec if requested later.
- Version bump, tag, release notes publication, Pages deployment or npm publish - require separate ship/release authorization after implementation verification.
