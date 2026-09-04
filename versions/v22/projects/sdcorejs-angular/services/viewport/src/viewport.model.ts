export interface SdViewportBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

export type SdViewportBreakpoint = keyof SdViewportBreakpoints;

export interface SdViewport {
  innerWidth: number;
  innerHeight?: number;
  addEventListener(type: 'resize', listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: 'resize', listener: EventListenerOrEventListenerObject): void;
}
