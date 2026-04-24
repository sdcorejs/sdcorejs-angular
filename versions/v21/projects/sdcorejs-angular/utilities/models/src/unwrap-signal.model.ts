import { InputSignal, InputSignalWithTransform, ModelSignal } from '@angular/core';

/**
 * Utility Type: Bóc tách kiểu dữ liệu gốc từ Angular Signal Inputs & Models
 */
export type SdUnwrapSignal<T> = 
  /* 1. Ưu tiên check Input có transform trước -> Lấy WriteType */
  T extends InputSignalWithTransform<any, infer WriteT> ? WriteT :
  /* 2. Check Input bình thường -> Lấy ReadType */
  T extends InputSignal<infer ReadT> ? ReadT :
  /* 3. Check Model (Two-way binding) -> Lấy ModelType */
  T extends ModelSignal<infer ModelT> ? ModelT : 
  /* 4. Trả về chính nó nếu không phải Signal */
  T;

// Nếu thuộc tính trên component bị optional (ví dụ: myInput?: ...), 
// bạn có thể bọc thêm NonNullable để code chặt chẽ hơn:
export type SdUnwrapSafe<T> = SdUnwrapSignal<NonNullable<T>>;