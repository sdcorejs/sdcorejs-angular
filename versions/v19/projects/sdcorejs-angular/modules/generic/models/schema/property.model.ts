import { SdTableColumn } from '@sdcorejs/angular/components';
import { Color } from '@sdcorejs/utils/models';

/**
 * @description
 * `SdSchemaProperty` là một kiểu dữ liệu hợp nhất (discriminated union type)
 * được sử dụng để định nghĩa cấu trúc của từng thuộc tính (trường) trong một mô hình dữ liệu.
 * Nó cung cấp các cấu hình chi tiết về kiểu dữ liệu, cách hiển thị, hành vi trong danh sách
 * và các quy tắc cho việc thêm/cập nhật dữ liệu.
 */
export type SdSchemaProperty<T = any> =
  | PropertyString<T>
  | PropertyNumber<T>
  | PropertyDate<T>
  | PropertyDatetime<T>
  | PropertyBoolean<T>
  | PropertyEnum<T>
  | PropertyRelation<T>;

/**
 * @description
 * Kiểu dữ liệu cho thuộc tính `type` của `SdSchemaProperty`.
 * Dùng để phân biệt các loại thuộc tính khác nhau.
 */
export type SdSchemaPropertyType = SdSchemaProperty['type'];

/**
 * @description
 * Giao diện cơ bản cho tất cả các loại thuộc tính trong schema.
 * Mọi thuộc tính cụ thể đều phải kế thừa các thuộc tính từ giao diện này.
 */
interface PropertyBase<T = any> {
  /**
   * @description
   * Tên trường (field name) của thuộc tính trong model.
   * Đây là khóa để ánh xạ thuộc tính này với dữ liệu thực tế của model.
   * @example 'name', 'statusCode', 'createdAt'
   */
  code: Extract<keyof T, string>;
  /**
   * @description
   * Nhãn tiếng Việt của trường thông tin, hiển thị trên giao diện người dùng.
   * @example 'Tên sản phẩm', 'Mã đơn hàng', 'Ngày tạo'
   */
  label: string;
  /**
   * @description
   * (Tùy chọn) Cấu hình liên quan đến cách thuộc tính này được hiển thị trong danh sách (bảng).
   * @see List
   */
  list?: List<T>;
  /**
   * @description
   * (Tùy chọn) Cấu hình liên quan đến cách thuộc tính này được hiển thị trong màn hình chi tiết (form).
   * @see Detail
   */
  detail?: Detail<T>;
}

/**
 * @description
 * Định nghĩa thuộc tính có kiểu dữ liệu là chuỗi văn bản.
 */
interface PropertyString<T> extends PropertyBase<T> {
  /**
   * @description Kiểu của thuộc tính. Luôn là 'string'.
   */
  type: 'string';
}

/**
 * @description
 * Định nghĩa thuộc tính có kiểu dữ liệu là số.
 */
interface PropertyNumber<T> extends PropertyBase<T> {
  /**
   * @description Kiểu của thuộc tính. Luôn là 'number'.
   */
  type: 'number';
}

/**
 * @description
 * Định nghĩa thuộc tính có kiểu dữ liệu là ngày tháng (chỉ ngày, không có thời gian).
 */
interface PropertyDate<T> extends PropertyBase<T> {
  /**
   * @description Kiểu của thuộc tính. Luôn là 'date'.
   */
  type: 'date';
}

/**
 * @description
 * Định nghĩa thuộc tính có kiểu dữ liệu là ngày và giờ.
 */
interface PropertyDatetime<T> extends PropertyBase<T> {
  /**
   * @description Kiểu của thuộc tính. Luôn là 'datetime'.
   */
  type: 'datetime';
}

/**
 * @description
 * Định nghĩa thuộc tính có kiểu dữ liệu là boolean (đúng/sai).
 */
interface PropertyBoolean<T> extends PropertyBase<T> {
  /**
   * @description Kiểu của thuộc tính. Luôn là 'boolean'.
   */
  type: 'boolean';
  /**
   * @description
   * (Tùy chọn) Kiểu hiển thị cụ thể cho thuộc tính boolean trên giao diện.
   * @default 'dropdown'
   */
  subType?: 'dropdown' | 'checkbox' | 'switch' | 'radio';
  /**
   * @description
   * (Tùy chọn) Văn bản hiển thị trên giao diện khi giá trị là `true`.
   * @example 'Hoạt động', 'Đã duyệt'
   */
  displayOnTrue?: string;
  /**
   * @description
   * (Tùy chọn) Văn bản hiển thị trên giao diện khi giá trị là `false`.
   * @example 'Không hoạt động', 'Chưa duyệt'
   */
  displayOnFalse?: string;
}

/**
 * @description
 * Định nghĩa thuộc tính kiểu enum (liệt kê), cho phép chọn một trong các giá trị định sẵn.
 */
interface PropertyEnum<T> extends PropertyBase<T> {
  /**
   * @description Kiểu của thuộc tính. Luôn là 'enum'.
   */
  type: 'enum';
  /**
   * @description
   * Mảng các đối tượng tùy chọn cho thuộc tính enum. Mỗi đối tượng bao gồm:
   * - `value`: Giá trị thực tế của tùy chọn.
   * - `display`: Văn bản hiển thị cho người dùng.
   * - `badgeColor`: (Tùy chọn) Màu sắc cho badge hiển thị tùy chọn (ví dụ: 'success', 'warning').
   * - `badgeIcon`: (Tùy chọn) Icon cho badge hiển thị tùy chọn.
   */
  options: {
    value: string;
    display: string;
    badgeColor?: Color;
    badgeIcon?: string;
  }[];
}

/**
 * @description
 * Định nghĩa thuộc tính quan hệ (relation), liên kết đến một mô hình dữ liệu khác.
 */
interface PropertyRelation<T> extends PropertyBase<T> {
  /**
   * @description Kiểu của thuộc tính. Luôn là 'relation'.
   */
  type: 'relation';
  /**
   * @description
   * Kiểu quan hệ giữa mô hình hiện tại và mô hình được liên kết.
   * @example 'OneToOne', 'OneToMany', 'ManyToMany', 'ManyToOne'
   */
  relation: 'OneToOne' | 'OneToMany' | 'ManyToMany' | 'ManyToOne';
  /**
   * @description
   * Tên của module backend mà mối quan hệ này trỏ tới.
   * @example 'user-management', 'product-catalog'
   */
  module: string;
  /**
   * @description
   * `typeCode` của mô hình được liên kết (như được định nghĩa trong `SdSchema` của nó).
   * @example 'CUSTOMER_DETAIL', 'PRODUCT_ITEM'
   */
  typeCode: string;
  /**
   * @description
   * (Tùy chọn) Trường nào của model hiện tại sẽ được ánh xạ đến trường nào của model được liên kết (mappedTo).
   * Ví dụ: Property `orderId` của `OrderDetail` có quan hệ đến `Order`
   * có thể `mappedTo` đến trường 'orderDetailIds' của `Order` model.
   * @example 'orderDetailIds' (trường này thuộc về model được liên kết)
   */
  mappedTo?: string;
  /**
   * @description
   * (Tùy chọn) Một đối tượng chứa các tham số truy vấn bổ sung
   * để áp dụng khi lấy dữ liệu cho mối quan hệ này.
   * @example `{ isActive: true, status: 'approved' }`
   */
  query?: Record<string, never>;

  /**
   * @description
   * (Tùy chọn) Trường từ mô hình liên kết sẽ được sử dụng làm giá trị duy nhất.
   * Mặc định là khóa chính (`primaryKey`) của `SdSchema` của mô hình được liên kết.
   * @example 'id', 'code'
   */
  valueField?: string;
  /**
   * @description
   * (Tùy chọn) Trường từ mô hình liên kết sẽ được hiển thị cho người dùng trên giao diện.
   * @example 'name', 'fullName'
   */
  displayField?: string;
  /**
   * @description
   * (Tùy chọn) Danh sách các trường trong mô hình liên kết sẽ được dùng để tìm kiếm
   * khi người dùng nhập vào ô tìm kiếm của trường quan hệ.
   * @example ['name', 'email', 'phone']
   */
  searchFields?: string[];
  /**
   * @description
   * (Tùy chọn) Một chuỗi định dạng văn bản để tùy chỉnh cách hiển thị của thực thể liên kết.
   * @example `${code} - ${name}` sẽ hiển thị "PROD001 - Bàn phím cơ"
   */
  transform?: string;
  /**
   * @description
   * (Tùy chọn) Một chuỗi định dạng HTML để tùy chỉnh cách hiển thị của thực thể liên kết.
   * Hữu ích cho các trường hợp hiển thị phức tạp hơn so với `transform`.
   * @example `<div><span>${code}</span> - <strong>${name}</strong></div>`
   */
  template?: string;
}

/**
 * @description
 * Giao diện định nghĩa các cấu hình cho thuộc tính khi hiển thị trong danh sách (bảng).
 */
interface List<T = any> {
  /**
   * @description
   * (Tùy chọn) Chiều rộng của cột trong bảng.
   * Có thể là số (pixels) hoặc chuỗi (ví dụ: '100px', '20%').
   * @see SdTableColumn['width']
   */
  width?: SdTableColumn<T>['width'];
  /**
   * @description
   * (Tùy chọn) Nếu là `true`, cột này sẽ bị ẩn hoàn toàn và người dùng không thể hiển thị lại
   * thông qua cài đặt hiển thị cột.
   * @see SdTableColumn['hidden']
   * @default false
   */
  hidden?: SdTableColumn<T>['hidden'];
  /**
   * @description
   * (Tùy chọn) Nếu là `true`, cột này sẽ bị ẩn mặc định nhưng người dùng có thể hiển thị lại
   * thông qua cài đặt hiển thị cột.
   * @see SdTableColumn['invisible']
   * @default false
   */
  invisible?: SdTableColumn<T>['invisible'];
  /**
   * @description
   * (Tùy chọn) Nếu là `true`, cột này có thể được sắp xếp (sort) trong bảng.
   * @see SdTableColumn['sortable']
   * @default false
   */
  sortable?: SdTableColumn<T>['sortable'];
  /**
   * @description
   * (Tùy chọn) Cấu hình bộ lọc cho cột này trong bảng.
   * @see SdTableColumn['filter']
   */
  filter?: SdTableColumn<T>['filter'];
  /**
   * @description
   * (Tùy chọn) Hàm hoặc chuỗi định dạng văn bản để chuyển đổi giá trị hiển thị của cột.
   * @see SdTableColumn['transform']
   */
  transform?: SdTableColumn<T>['transform'];
  /**
   * @description
   * (Tùy chọn) Chuỗi template HTML để tùy chỉnh cách hiển thị nội dung của ô trong bảng.
   * @see SdTableColumn['htmlTemplate']
   */
  htmlTemplate?: SdTableColumn<T>['htmlTemplate'];
}

/**
 * @description
 * Giao diện định nghĩa các cấu hình cho thuộc tính khi hiển thị trong màn hình chi tiết (form tạo/cập nhật).
 */
interface Detail<T = any> {
  /**
   * @description
   * (Tùy chọn) Nếu là `true`, trường này có thể được chèn (insert) khi tạo mới đối tượng.
   * @default true
   */
  insertable?: boolean;
  /**
   * @description
   * (Tùy chọn) Nếu là `true`, trường này có thể được cập nhật (update) khi chỉnh sửa đối tượng.
   * @default true
   */
  updatable?: boolean;
  /**
   * @description
   * (Tùy chọn) Nếu là `true`, trường này là bắt buộc (required) khi nhập liệu.
   * @default false
   */
  required?: boolean;
  /**
   * @description
   * (Tùy chọn) Giá trị mặc định của trường khi tạo mới.
   * @default undefined
   */
  defaultValue?: never; // Sử dụng 'never' để đảm bảo rằng đây là một thuộc tính marker và không nên được gán giá trị cụ thể ở đây. Giá trị sẽ được gán trong các thành phần UI dựa trên kiểu dữ liệu của Property.
}