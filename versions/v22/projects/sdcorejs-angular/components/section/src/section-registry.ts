import { InjectionToken } from '@angular/core';
import type { SdSection } from './section.component';

/**
 * A container that lists the sections inside it, such as the table of contents of `sd-page`. Every outermost
 * `sd-section` below the provider registers itself, also one inside a child component of the container.
 */
export interface SdSectionRegistry {
  /** Adds a section; returns the function that removes it. */
  register(section: SdSection, element: HTMLElement): () => void;
}

export const SD_SECTION_REGISTRY = new InjectionToken<SdSectionRegistry>('SD_SECTION_REGISTRY');
