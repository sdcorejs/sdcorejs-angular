/**
 * @description
 * `SdSchemaExternalFilter` là một kiểu dữ liệu hợp nhất (discriminated union type)
 * được sử dụng để định nghĩa cấu trúc của các bộ lọc bên ngoài (external filters).
 * Các bộ lọc này thường được sử dụng ngoài các bảng dữ liệu chính (ví dụ: ở khu vực đầu trang hoặc thanh bên)
 * để cung cấp khả năng lọc đa dạng và linh hoạt cho các danh sách và màn hình.
 */
export type SdSchemaExternalFilter =
  | ExternalFilterString
  | ExternalFilterNumber
  | ExternalFilterDate
  | ExternalFilterDatetime
  | ExternalFilterDaterange
  | ExternalFilterBoolean
  | ExternalFilterEnum
  | ExternalFilterRelation;

/**
 * @description
 * Kiểu dữ liệu cho thuộc tính `type` của `SdSchemaExternalFilter`.
 * Dùng để phân biệt các loại bộ lọc khác nhau.
 */
export type SdSchemaExternalFilterType = SdSchemaExternalFilter['type'];

/**
 * @description
 * Giao diện cơ bản cho tất cả các loại bộ lọc bên ngoài.
 * Mọi bộ lọc cụ thể đều phải kế thừa các thuộc tính từ giao diện này.
 */
interface ExternalFilterBase {
  /**
   * @description
   * Mã định danh duy nhất cho bộ lọc này.
   * Thường tương ứng với tên trường dữ liệu ở backend mà bộ lọc này sẽ tác động.
   * @example 'customerName', 'statusCode'
   */
  code: string;
  /**
   * @description
   * Nhãn hiển thị trên giao diện người dùng cho bộ lọc này.
   * Cung cấp một tên rõ ràng, dễ hiểu cho người dùng.
   * @example 'Tên khách hàng', 'Trạng thái đơn hàng'
   */
  label: string;
}

/**
 * @description
 * Bộ lọc kiểu chuỗi văn bản. Dùng cho các trường dữ liệu là văn bản.
 */
interface ExternalFilterString extends ExternalFilterBase {
  /**
   * @description Kiểu của bộ lọc. Luôn là 'string' cho bộ lọc văn bản.
   */
  type: 'string';
}

/**
 * @description
 * Bộ lọc kiểu số. Dùng cho các trường dữ liệu là số.
 */
interface ExternalFilterNumber extends ExternalFilterBase {
  /**
   * @description Kiểu của bộ lọc. Luôn là 'number' cho bộ lọc số.
   */
  type: 'number';
}

/**
 * @description
 * Bộ lọc kiểu ngày. Dùng cho các trường dữ liệu là ngày tháng (không có thời gian).
 */
interface ExternalFilterDate extends ExternalFilterBase {
  /**
   * @description Kiểu của bộ lọc. Luôn là 'date' cho bộ lọc ngày.
   */
  type: 'date';
}

/**
 * @description
 * Bộ lọc kiểu ngày giờ. Dùng cho các trường dữ liệu là ngày tháng có kèm thời gian.
 */
interface ExternalFilterDatetime extends ExternalFilterBase {
  /**
   * @description Kiểu của bộ lọc. Luôn là 'datetime' cho bộ lọc ngày giờ.
   */
  type: 'datetime';
}

/**
 * @description
 * Bộ lọc kiểu khoảng ngày. Dùng cho các trường dữ liệu cần lọc theo một khoảng thời gian (từ ngày X đến ngày Y).
 */
interface ExternalFilterDaterange extends ExternalFilterBase {
  /**
   * @description Kiểu của bộ lọc. Luôn là 'daterange' cho bộ lọc khoảng ngày.
   */
  type: 'daterange';
}

/**
 * @description
 * Bộ lọc kiểu boolean (đúng/sai). Dùng cho các trường dữ liệu chỉ có hai trạng thái.
 */
interface ExternalFilterBoolean extends ExternalFilterBase {
  /**
   * @description Kiểu của bộ lọc. Luôn là 'boolean' cho bộ lọc boolean.
   */
  type: 'boolean';
  /**
   * @description
   * Văn bản sẽ hiển thị trên giao diện người dùng khi giá trị của bộ lọc boolean là `true`.
   * @example 'Hoạt động', 'Đã hoàn thành'
   */
  displayOnTrue?: string;
  /**
   * @description
   * Văn bản sẽ hiển thị trên giao diện người dùng khi giá trị của bộ lọc boolean là `false`.
   * @example 'Không hoạt động', 'Đang chờ'
   */
  displayOnFalse?: string;
}

/**
 * @description
 * Bộ lọc kiểu enum (liệt kê). Dùng cho các trường dữ liệu có một tập hợp các tùy chọn cố định.
 */
interface ExternalFilterEnum extends ExternalFilterBase {
  /**
   * @description Kiểu của bộ lọc. Luôn là 'enum' cho bộ lọc enum.
   */
  type: 'enum';
  /**
   * @description
   * Mảng các đối tượng chứa các lựa chọn có sẵn cho bộ lọc.
   * Mỗi đối tượng bao gồm:
   * - `value`: Giá trị thực tế sẽ được gửi đến backend khi được chọn.
   * - `display`: Văn bản dễ đọc được hiển thị cho người dùng trên giao diện.
   * @example [{ value: 'PENDING', display: 'Chờ xử lý' }, { value: 'COMPLETED', display: 'Hoàn thành' }]
   */
  options: {
    value: string;
    display: string;
  }[];
}

/**
 * @description
 * Bộ lọc kiểu quan hệ. Dùng cho các trường dữ liệu liên quan đến một mô hình dữ liệu khác,
 * thường yêu cầu chức năng tra cứu hoặc tìm kiếm (ví dụ: chọn một khách hàng từ danh sách khách hàng).
 */
interface ExternalFilterRelation extends ExternalFilterBase {
  /**
   * @description Kiểu của bộ lọc. Luôn là 'relation' cho bộ lọc quan hệ.
   */
  type: 'relation';
  /**
   * @description
   * Tên của module backend mà mối quan hệ này trỏ tới.
   * Dùng để xác định API endpoint phù hợp để lấy dữ liệu liên quan.
   * @example 'user-management', 'product-catalog'
   */
  module: string;
  /**
   * @description
   * `typeCode` của mô hình liên quan (như được định nghĩa trong `SdSchema` của nó).
   * Dùng để xác định chính xác cấu trúc mô hình cho thực thể liên quan.
   * @example 'CUSTOMER_DETAIL', 'PRODUCT_ITEM'
   */
  typeCode: string;
  /**
   * @description
   * (Tùy chọn) Một đối tượng chứa các tham số truy vấn bổ sung
   * để áp dụng khi lấy dữ liệu cho bộ lọc quan hệ này.
   * Cho phép lọc trước các tùy chọn có sẵn trong mối quan hệ.
   * @example `{ isActive: true, city: 'Hanoi' }`
   */
  query?: Record<string, never>;

  /**
   * @description
   * (Tùy chọn) Trường từ mô hình liên quan đại diện cho giá trị duy nhất của nó.
   * Mặc định là `primaryKey` của `SdSchema` của mô hình được liên kết.
   * @example 'id', 'code'
   */
  valueField?: string;
  /**
   * @description
   * (Tùy chọn) Trường từ mô hình liên quan sẽ được hiển thị cho người dùng trên giao diện.
   * @example 'name', 'fullName'
   */
  displayField?: string;
  /**
   * @description
   * (Tùy chọn) Danh sách các trường trong mô hình liên quan sẽ được sử dụng để tìm kiếm
   * khi người dùng nhập vào trường tìm kiếm của bộ lọc quan hệ.
   * @example ['name', 'email', 'phone']
   */
  searchFields?: string[];
  /**
   * @description
   * (Tùy chọn) Một chuỗi định dạng để tùy chỉnh cách hiển thị của thực thể liên quan.
   * Cho phép định dạng hiển thị phức tạp hơn so với một `displayField` đơn lẻ.
   * @example `${code} - ${name}` sẽ hiển thị "CUST001 - John Doe"
   */
  transform?: string;

  /**
   * @description
   * (Tùy chọn) Nếu là `true`, bộ lọc quan hệ cho phép chọn nhiều thực thể liên quan.
   * @default false
   */
  multiple?: boolean;
}