export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastData {
  id: string;
  type: ToastType;
  title?: string;
  message: string | string[];
  duration: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface SdNotifyOption {
  duration?: number; // Input từ user thì vẫn để là tùy chọn
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
}
