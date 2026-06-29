---
name: v19-first-rollout
description: From now on, feature and showcase work starts in v19, then rolls out to v20 and v21.
type: feedback
track: angular
---

# V19 First, Then Roll Out

Từ nay, `versions/v19` là workspace chính để viết tính năng, test, tài liệu API, README npm-facing và showcase cho `@sdcorejs/angular`. Sau khi thay đổi ở v19 ổn, chạy rollout để đồng bộ cùng bề mặt tính năng sang `versions/v20` và `versions/v21`.

**Why:** v19 là source of truth repo-owned sau final legacy sync, còn v20/v21 là lớp dẫn xuất theo Angular major.

**How to apply:** Khi làm việc mới, sửa `versions/v19/**` trước, verify ở v19, rồi chạy `npm run sync` ở root để lan sang v20/v21; chỉ sửa trực tiếp v20/v21 nếu đó là shim riêng cho Angular major.
