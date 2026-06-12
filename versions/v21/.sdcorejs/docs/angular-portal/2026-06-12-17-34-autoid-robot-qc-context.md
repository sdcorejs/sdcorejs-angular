---
track: angular-portal
topic: autoid-robot-qc-context
date: 2026-06-12
module: autoid-inspector
---

# AutoId Robot QC Context

## Summary

Updated `sd-autoid-inspector` so Robot Framework export asks the user for QC context before generating tests. Playwright export remains a direct ZIP export.

## UI Changes

- The Robot Framework button now opens a modal titled `Ngữ cảnh QC cho Robot Framework`.
- The modal collects component, story/trace, requirement, predefined QC test cases, test data, precondition, and QC format notes.
- The confirm button is disabled until at least one context field has content.
- On confirm, the inspector sends the current AutoID payload plus `context` to Forge and downloads the returned ZIP.

## API Payload

Robot export now sends:

```ts
{
  payload,
  options,
  prompt: 'Sinh Robot Framework E2E test bám theo ngữ cảnh QC, testcase, test data và requirement được cung cấp.',
  context: {
    component,
    storyLinkages,
    requirement,
    testCases,
    testData,
    precondition,
    qcNotes,
  },
}
```

Blank context fields are trimmed and omitted before the request.

## Verification

- `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/autoid-inspector/src/autoid-inspector.component.spec.ts`
- `npx eslint projects/sdcorejs-angular/components/autoid-inspector/src/autoid-inspector.component.ts projects/sdcorejs-angular/components/autoid-inspector/src/autoid-inspector.component.html projects/sdcorejs-angular/components/autoid-inspector/src/autoid-inspector.component.spec.ts projects/sdcorejs-angular/components/autoid-inspector/src/models/autoid-export-format.model.ts`
- `npm run build`
