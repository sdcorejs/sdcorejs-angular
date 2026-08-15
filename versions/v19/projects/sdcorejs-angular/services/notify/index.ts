// why: ToastData/ToastType không phải là chi tiết nội bộ — chúng nằm ngay trên chữ ký public
// của service (`toasts: Signal<ToastData[]>`, `clearByType(type: ToastType)`). Không export thì
// consumer KHÔNG thể khai báo kiểu cho hai API đó. Alias theo tiền tố `Sd` giống SdNotifyOption.
export { type NotifyOption as SdNotifyOption, type ToastData as SdToastData, type ToastType as SdToastType } from './src/notify.model';
export * from './src/notify.service';
