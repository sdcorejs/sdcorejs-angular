import { InjectionToken } from '@angular/core';
import { MaybeAsync } from '@sdcorejs/utils/models';

/**
 * Cấu hình trung tâm cho module permission.
 *
 * Luồng hoạt động chính:
 * 1. `loadPermissions(key?)` ở service được gọi để lấy danh sách mã quyền theo từng `key` cấu hình.
 * 2. Guard/service đối chiếu mã quyền theo route metadata.
 * 3. Khi không đủ quyền, callback `onForbiden()` sẽ được gọi (nếu có).
 *
 * Lưu ý:
 * - `SD_PERMISSION_CONFIGURATION` hỗ trợ cả cấu hình đơn và mảng cấu hình (`multi: true`).
 * - Nếu cần tạm bỏ qua kiểm tra quyền (POC/UAT cục bộ), đặt `disabled = true`.
 */
export interface ISdPermissionConfiguration {
  /**
   * Khóa định danh cấu hình.
   * Dùng để phân biệt khi hệ thống mở rộng theo nhiều profile permission.
   *
   * Lưu ý: `undefined` cũng được xem là một key hợp lệ (cấu hình mặc định).
   */
  key?: string;

  /**
   * Bật/tắt kiểm tra permission toàn cục.
   * - `true`: bỏ qua kiểm tra quyền.
   * - `false | undefined`: kiểm tra quyền theo cấu hình route.
   */
  disabled?: boolean;

  /**
   * Trả về danh sách mã quyền của user hiện tại.
   * Có thể đồng bộ hoặc bất đồng bộ.
   *
   * Ví dụ giá trị trả về:
   * - `['PRODUCT_C_EMPLOYEE_VIEW', 'PRODUCT_C_EMPLOYEE_UPDATE']`
   */
  loadPermissions: () => MaybeAsync<string[]>;

  /**
   * Callback xử lý khi user không có quyền truy cập URL hiện tại.
   * Thường dùng để điều hướng sang trang forbidden hoặc hiển thị thông báo.
   *
   * Giữ nguyên tên `onForbiden` để tương thích API hiện tại.
   */
  onForbiden?: () => void;

  /**
   * Cung cấp access token hiện tại cho các tác vụ liên quan permission.
   * Hỗ trợ trả về đồng bộ, Promise hoặc Observable.
   */
  getToken?: () => MaybeAsync<string | undefined | null>;

  /**
   * Cho phép mirror danh sách mã quyền của key này xuống `sessionStorage` để sống qua reload.
   *
   * ⚠️ Mặc định `false` — danh sách quyền CHỈ nằm trong bộ nhớ.
   *
   * Bật cờ này nghĩa là chấp nhận: mọi script chạy trên cùng origin đều ĐỌC và GHI được danh sách đó.
   * Cache KHÔNG phải một ranh giới phân quyền — nó chỉ tiết kiệm một lần gọi API khi reload; backend
   * vẫn phải kiểm tra quyền cho từng request. Khi bật, nhớ gọi `SdPermissionService.reset()` lúc
   * signout để xoá cả bản mirror.
   */
  persistCache?: boolean;
}

/**
 * InjectionToken cho cấu hình permission.
 *
 * Ví dụ provider:
 * {
 *   provide: SD_PERMISSION_CONFIGURATION,
 *   useValue: {
 *     disabled: false,
 *     loadPermissions: () => ['SAMPLE_C_EMPLOYEE_VIEW'],
 *     onForbiden: () => router.navigateByUrl('/layout/forbidden')
 *   }
 * }
 */
export const SD_PERMISSION_CONFIGURATION = new InjectionToken<ISdPermissionConfiguration | ISdPermissionConfiguration[]>(
  'sd-permission.configuration'
);
