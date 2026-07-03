---
created_at: 2026-07-03T16:45:00+07:00
track: angular
branch: release/0.11
type: implementation-note
---

# Fix Excel/CSV Formula Injection

## Summary
- Added a shared `neutralizeSpreadsheetFormula` helper to v19, v20, and v21 Excel services.
- The helper prefixes exported string values with `'` when they start with spreadsheet formula trigger characters: `=`, `+`, `-`, `@`, tab, carriage return, or newline.
- Applied the helper to CSV output, XLSX data rows, template metadata rows, and extra sheet values before writing workbook cells.
- Kept non-string values unchanged so numeric values such as `-42` remain numbers in XLSX and CSV exports.

## Regression Coverage
- Added helper unit tests for dangerous prefixes, already-neutralized values, safe strings, and non-string values.
- Added CSV export regression coverage for user-controlled fields such as `fullName` and `createdBy`.

## Verification
- PASS v19 Excel service specs: `TOTAL: 22 SUCCESS`.
- PASS v20 Excel service specs: `TOTAL: 22 SUCCESS`.
- PASS v21 Excel service specs: `TOTAL: 22 SUCCESS`.
- PASS v19 package production build.
- PASS v20 package production build.
- PASS v21 package production build.
- PASS `git diff --check` for touched files.
