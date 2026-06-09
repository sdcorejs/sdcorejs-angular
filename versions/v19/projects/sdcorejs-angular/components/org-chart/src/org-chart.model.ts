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
