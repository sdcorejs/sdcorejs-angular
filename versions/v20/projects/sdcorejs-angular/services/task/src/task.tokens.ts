import { DOCUMENT } from '@angular/common';
import { InjectionToken, inject } from '@angular/core';

export interface SdTaskEventSource {
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent<string>) => void) | null;
  onerror: ((event: Event) => void) | null;
  close(): void;
}

export interface SdTaskEventSourceFactory {
  create(url: string, init?: EventSourceInit): SdTaskEventSource;
}

export const SD_TASK_EVENT_SOURCE_FACTORY = new InjectionToken<SdTaskEventSourceFactory | null>('SD_TASK_EVENT_SOURCE_FACTORY', {
  factory: () => {
    const windowRef = inject(DOCUMENT).defaultView;
    if (!windowRef?.EventSource) return null;
    return {
      create: (url: string, init?: EventSourceInit): SdTaskEventSource => new windowRef.EventSource(url, init),
    };
  },
});

export const SD_TASK_RANDOM = new InjectionToken<() => number>('SD_TASK_RANDOM', {
  factory: () => Math.random,
});
