import { TemplateRef } from '@angular/core';

export interface SdOrgChartItem {
  id: string | number;
  image?: string | null;
  title: string;
  description?: string | null;
  color?: string | null;
  expanded?: boolean;
  children?: SdOrgChartItem[];
}

export interface SdOrgChartItemContext<T extends SdOrgChartItem = SdOrgChartItem> {
  $implicit: T;
  item: T;
  depth: number;
  parent: T | null;
  expanded: boolean;
  hasChildren: boolean;
  isLeaf: boolean;
  toggle: () => void;
}

export type SdOrgChartItemTemplate<T extends SdOrgChartItem = SdOrgChartItem> = TemplateRef<SdOrgChartItemContext<T>>;

export interface SdOrgChartToggleEvent<T extends SdOrgChartItem = SdOrgChartItem> {
  item: T;
  expanded: boolean;
}

export interface SdOrgChartOption<T extends SdOrgChartItem = SdOrgChartItem> {
  autoId?: string | null;
  items: T[];
  itemTemplate?: TemplateRef<SdOrgChartItemContext<T>> | null;
  collapsible?: boolean;
  onToggle?: (event: SdOrgChartToggleEvent<T>) => void;
}
