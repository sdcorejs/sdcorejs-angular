import type { SdBadgeData } from '@sdcorejs/angular/components/badge';
import type { Color as SdColor } from '@sdcorejs/utils/models';

/** One entry of `sd-timeline`: who did what, when, with a body chosen by `content.layout`. */
export interface SdTimelineItem<T = unknown> {
  id: string;
  /** Instant of the entry; read through `SdDateTimeService` in the configured zone. */
  at: string | number | Date;
  /** Without an actor no name is shown and the marker is an icon. */
  actor?: { name: string; avatar?: string };
  /** Overrides the default icon of the layout. */
  icon?: string;
  /** Ring color of the icon marker; neutral by default. */
  color?: SdColor;
  /** "Web", "API"…; hidden at size `sm`. */
  source?: string;
  content: SdTimelineContent;
  /** Original DTO for templates, kept by reference. */
  data?: T;
}

/** Body of a timeline entry. */
export type SdTimelineContent =
  | { layout: 'comment'; data: SdTimelineCommentData }
  | { layout: 'change'; data: SdTimelineChangeData }
  | { layout: 'event'; data: SdTimelineEventData };

export interface SdTimelineCommentData {
  /** Plain text; line breaks are kept. The action reads "commented" (i18n). */
  text: string;
  /** Adds "edited" after the time. */
  edited?: boolean;
}

export interface SdTimelineChangeData {
  /** "updated the order", "changed the status". */
  title: string;
  /** At least one row. */
  changes: readonly SdTimelineChange[];
  badge?: SdBadgeData;
  note?: string;
}

export interface SdTimelineEventData {
  /** "submitted for approval", "created the receipt". */
  title: string;
  badge?: SdBadgeData;
  /** Reason or description: plain text, no frame. */
  note?: string;
}

export interface SdTimelineChange {
  label: string;
  from?: SdTimelineValue;
  to?: SdTimelineValue;
}

export type SdTimelineValue = string | number | null | { badge: SdBadgeData };

export interface SdTimelineLoadArgs {
  /** `null` on the first load and after `reload()`. */
  cursor: string | null;
  pageSize: number;
  signal: AbortSignal;
}

export interface SdTimelineLoadResult<T = unknown> {
  items: SdTimelineItem<T>[];
  /** `null` when there is nothing more to load. */
  nextCursor: string | null;
}

export interface SdTimelineOption<T = unknown> {
  dataSource: {
    onLoad: (args: SdTimelineLoadArgs) => SdTimelineLoadResult<T> | Promise<SdTimelineLoadResult<T>>;
  };
  /** Defaults to 20. */
  pageSize?: number;
  /** Defaults to `'button'`. */
  loadMore?: 'button' | 'auto';
}
