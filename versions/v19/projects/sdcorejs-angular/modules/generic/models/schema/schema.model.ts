import { SdSchemaExternalFilter } from './external-filter.model';
import { SdSchemaProperty } from './property.model';

/**
 * @description
 * `SdSchema` là một giao diện trung tâm, đóng vai trò như một bản thiết kế toàn diện
 * để định nghĩa cấu trúc dữ liệu, cách hiển thị, các quy tắc nghiệp vụ, bộ lọc,
 * và quyền hạn cho từng loại đối tượng (entity) trong hệ thống.
 * Nó giúp tự động hóa quá trình phát triển giao diện người dùng, đảm bảo tính nhất quán
 * và giảm thiểu công sức bảo trì.
 *
 * @template T Kiểu dữ liệu của model mà schema này mô tả (ví dụ: Product, Customer).
 */
export interface SdSchema<T = any> {
  /**
   * @description
   * Tên của phân hệ lớn (module) mà schema này thuộc về.
   * Đây là một nhóm chức năng nghiệp vụ lớn trong hệ thống.
   * @example 'OMS' (Hệ thống Quản lý Đơn hàng), 'WMS' (Hệ thống Quản lý Kho)
   */
  module: string;
  /**
   * @description
   * Một mã định danh duy nhất cho loại thực thể (entity) mà schema này mô tả,
   * nằm trong một phân hệ cụ thể.
   * Quan trọng để hệ thống nhận diện và áp dụng đúng schema cho từng loại đối tượng.
   * @example 'PRODUCT' (thực thể Sản phẩm), 'ORDER' (thực thể Đơn hàng), 'CUSTOMER' (thực thể Khách hàng)
   */
  typeCode: string;
  /**
   * @description
   * Tên của trường được sử dụng làm khóa chính (unique identifier) của đối tượng.
   * Quan trọng cho các thao tác như xem chi tiết, cập nhật hoặc xóa một bản ghi cụ thể.
   * @default 'id'
   */
  primaryKey: string;
  /**
   * @description
   * (Tùy chọn) Tên của trường trong model `T` được sử dụng làm giá trị khi chọn một đối tượng
   * (ví dụ: trong các dropdown, combobox).
   * @example 'id', 'code'
   */
  valueField?: Extract<keyof T, string>;
  /**
   * @description
   * (Tùy chọn) Tên của trường trong model `T` được sử dụng để hiển thị đại diện cho đối tượng.
   * Dùng để hiển thị một cách dễ đọc trong các danh sách hoặc combobox.
   * @example 'name', 'fullName'
   */
  displayField?: Extract<keyof T, string>;
  /**
   * @description
   * (Tùy chọn) Một chuỗi định dạng cho phép hiển thị dữ liệu dạng văn bản theo một cấu trúc mong muốn.
   * Cung cấp khả năng tùy chỉnh hiển thị phức tạp hơn so với `displayField` đơn thuần.
   * @example `${code} - ${name}` sẽ hiển thị "Mã - Tên"
   */
  transform?: string;
  /**
   * @description
   * Mảng các đối tượng `SdSchemaProperty` mô tả từng thuộc tính (trường) của model `T`.
   * Định nghĩa chi tiết về kiểu dữ liệu, ràng buộc, cách hiển thị và hành vi của từng trường
   * trong cả danh sách và màn hình chi tiết/form.
   * @see SdSchemaProperty
   */
  properties: SdSchemaProperty<T>[];
  /**
   * @description
   * (Tùy chọn) Cấu hình liên quan đến màn hình danh sách, bao gồm các bộ lọc bên ngoài.
   * @see List
   */
  list?: List;
  /**
   * @description
   * (Tùy chọn) Định nghĩa các mã quyền (permission codes) cần thiết cho các thao tác CRUD
   * (Create, Read, Update, Delete) trên model này.
   * Dùng để kiểm soát quyền truy cập của người dùng.
   * @see Permission
   */
  permission?: Permission;
  /**
   * @description
   * (Tùy chọn) Định nghĩa các tiêu đề hiển thị trên các màn hình khác nhau
   * (danh sách, tạo mới, cập nhật, chi tiết, xóa).
   * @see Title
   */
  title?: Title;
}

/**
 * @description
 * Giao diện định nghĩa các cấu hình cho màn hình danh sách của một model.
 */
interface List {
  /**
   * @description
   * Mảng các đối tượng `SdSchemaExternalFilter` mô tả các bộ lọc bên ngoài
   * được sử dụng trên màn hình danh sách.
   * Các bộ lọc này thường nằm ngoài bảng dữ liệu chính, cho phép người dùng
   * lọc dữ liệu dựa trên các tiêu chí phức tạp hơn.
   * @see SdSchemaExternalFilter
   */
  externalFilters: SdSchemaExternalFilter[];
}

/**
 * @description
 * Giao diện định nghĩa các tiêu đề hiển thị trên các màn hình khác nhau liên quan đến model.
 */
interface Title {
  /**
   * @description
   * (Tùy chọn) Tiêu đề cho màn hình danh sách.
   * @example 'Danh sách khách hàng'
   */
  list?: string;
  /**
   * @description
   * (Tùy chọn) Tiêu đề cho màn hình tạo mới.
   * @example 'Tạo mới khách hàng'
   */
  create?: string;
  /**
   * @description
   * (Tùy chọn) Tiêu đề cho màn hình cập nhật. Có thể sử dụng placeholder `${fieldName}`.
   * @example 'Cập nhật sản phẩm ${name}'
   */
  update?: string;
  /**
   * @description
   * (Tùy chọn) Tiêu đề cho màn hình chi tiết. Có thể sử dụng placeholder `${fieldName}`.
   * @example 'Chi tiết sản phẩm ${name}'
   */
  detail?: string;
  /**
   * @description
   * (Tùy chọn) Tiêu đề khi xác nhận thao tác xóa.
   * @example 'Bạn có chắc muốn xóa các sản phẩm đã chọn?'
   */
  delete?: string;
}

/**
 * @description
 * Giao diện định nghĩa các mã quyền truy cập (permission codes) cho các thao tác
 * khác nhau trên model.
 */
interface Permission {
  /**
   * @description
   * (Tùy chọn) Mã quyền để truy cập trang danh sách.
   * @example 'PCM_P_PRODUCT_LIST'
   */
  list?: string;
  /**
   * @description
   * (Tùy chọn) Mã quyền để xem chi tiết một bản ghi.
   * @example 'PCM_C_PRODUCT_DETAIL'
   */
  detail?: string;
  /**
   * @description
   * (Tùy chọn) Mã quyền để tạo mới một bản ghi.
   * @example 'PCM_C_PRODUCT_CREATE'
   */
  create?: string;
  /**
   * @description
   * (Tùy chọn) Mã quyền để chỉnh sửa một bản ghi.
   * @example 'PCM_C_PRODUCT_UPDATE'
   */
  update?: string;
  /**
   * @description
   * (Tùy chọn) Mã quyền để xóa một hoặc nhiều bản ghi.
   * @example 'PCM_C_PRODUCT_DELETE'
   */
  delete?: string;
}