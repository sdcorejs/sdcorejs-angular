---
module: autoid-inspector
title: AutoId Inspector
tracks: [angular-portal]
generated_at: 2026-06-12T17:34+07:00
routes: []
permissions: []
entities: []
screens: [component]
---

# User Guide - `<sd-autoid-inspector>`

## Import

```ts
import {
  SD_AUTOID_INSPECTOR_CONFIGURATION,
  SdAutoidInspector,
} from '@sdcorejs/angular/components/autoid-inspector';
```

## Basic Usage

Place the inspector in a shell or development page where AutoID coverage needs to be reviewed:

```html
<sd-autoid-inspector></sd-autoid-inspector>
```

The component scans Core UI elements that expose `autoid`, shows the discovered elements, reports audit warnings, and allows the user to export inspection data.

## Enable E2E Test Export

Configure the Forge backend URL through `SD_AUTOID_INSPECTOR_CONFIGURATION`:

```ts
import { ApplicationConfig } from '@angular/core';
import { SD_AUTOID_INSPECTOR_CONFIGURATION } from '@sdcorejs/angular/components/autoid-inspector';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: SD_AUTOID_INSPECTOR_CONFIGURATION,
      useValue: {
        host: 'http://localhost:3000',
      },
    },
  ],
};
```

When `host` is configured, the inspector shows the `Tạo E2E test` export section.

## Export Options

- Playwright: exports directly by sending the current AutoID payload to `POST <host>/e2e/test-generator/playwright`.
- Robot Framework: opens the `Ngữ cảnh QC cho Robot Framework` popup first, then sends the current AutoID payload and QC context to `POST <host>/e2e/test-generator/robot`.

The Robot Framework popup can collect:

- Component or feature name.
- Story, AC, BR, or trace links.
- Requirement or acceptance criteria.
- QC-defined test cases.
- Test data.
- Preconditions.
- QC format notes.

The confirm button is enabled after at least one context field has content. Blank fields are trimmed and omitted from the request.

## Backend Contract

Frontend sends:

```ts
{
  payload: {
    meta: {
      url: string;
      title: string;
      generatedAt: string;
      total: number;
      source: 'sd-autoid-inspector';
    },
    elements: Array<Record<string, unknown>>;
  },
  options: {
    language: 'vi';
    mode: 'happy-path';
    outputName: string;
    testName: string;
    baseUrl?: string;
  },
  prompt?: string;
  context?: {
    requirement?: string;
    testCases?: string;
    testData?: string;
    precondition?: string;
    component?: string;
    storyLinkages?: string;
    qcNotes?: string;
  };
}
```

Backend returns `application/zip`. If `Content-Disposition` includes a filename, the inspector uses that filename. Otherwise it creates a fallback filename from the current page.

## Security Notes

Do not put the AI API key in the Angular application. `host` is only the Forge backend URL. Forge reads the AI API key from backend environment variables and calls the model server-side.
