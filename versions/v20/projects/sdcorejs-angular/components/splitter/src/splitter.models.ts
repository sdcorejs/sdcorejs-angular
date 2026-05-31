// projects/sdcorejs-angular/components/splitter/src/splitter.models.ts
export type SplitterOrientation = 'horizontal' | 'vertical';
export type SplitterPanelUnit = 'px' | 'flex';

export interface SplitterPanelState {
  id: string | number;
  size: number;
  unit: SplitterPanelUnit;
  collapsed: boolean;
}

export interface SplitterLayoutState {
  v: 1;
  panels: SplitterPanelState[];
}

// Internal — không export ra index.ts
export interface ResolvedPanelMeta {
  id: string | number;          // panelId nếu có, else index
  index: number;
  unit: SplitterPanelUnit;
  minSize: number;
  maxSize: number | undefined;
  collapsible: boolean;
  resizable: boolean;
  declaredSize: number;         // size khai báo trong template, dùng cho resetLayout
  lastSize: number;             // size trước khi collapse (cho expand restore)
}
