---
title: Add EntityPicker and TreeSelect
track: angular
status: completed
updated_at: 2026-07-23
git_head: cc31df58253569ad19b2c90bf4e34f1077c7d954
---

# Add EntityPicker and TreeSelect

Task 9 adds stable-key `SdEntityPicker` and `SdTreeSelect` secondary entrypoints in v19. EntityPicker composes QueryBar, Table, Modal, and DataState for server paging, search, abort/race containment, off-page hydration, page-safe select-all, typed templates, FormGroup registration, and host-owned create flow. TreeSelect composes Modal and Tree for static/lazy data, single/multiple keys, cascade/indeterminate selection, hidden/unloaded key preservation, retry, and focus restoration.

`SdTree` now supports roving tabindex and native tree keyboard commands, single or loaded-descendant cascade selection, root/lazy error retry, and generation IDs that prevent obsolete async sources from overwriting current state. Review repairs also add typed template guards, TreeSelect error forwarding, stable Table config keys for projected templates, and translated actions across en/vi/ja/ko/zh.

Verification: focused library 42/42, Showcase 9/9, generators 27/27, lint, v19 package build, production Showcase build, independent parity 493 keys × 5 locales, and `git diff --check` all pass. Showcase registry totals are 91 pages, 284 examples, and 1396 route shells. V20/v21 remain untouched until rollout Task 14.
