/** One sample route of the catalog page. */
export interface PatternCatalogRoute {
  /** Router commands relative to the pattern shell, e.g. `['product', '1', 'detail']`. */
  readonly link: readonly string[];
  /** URL pattern as written in the docs, e.g. `product/:id/detail`. */
  readonly path: string;
  /** Selector or pattern the screen uses. */
  readonly layout: string;
  /** What the screen shows. */
  readonly shows: string;
}

/** One entity group of the catalog page. */
export interface PatternCatalogGroup {
  readonly key: string;
  readonly title: string;
  readonly summary: string;
  /** Pattern docs under `modules/pattern/docs/`. */
  readonly docs: readonly string[];
  readonly routes: readonly PatternCatalogRoute[];
}

/** The pattern routes of doc 07, by entity. Each group shows different situations, so none repeats another. */
export const PATTERN_CATALOG: readonly PatternCatalogGroup[] = [
  {
    key: 'product',
    title: 'Sản phẩm',
    summary: 'CRUD trên page: danh sách, tạo, chi tiết, cập nhật.',
    docs: ['list', 'detail', 'form', 'select', 'header-actions'],
    routes: [
      {
        link: ['product'],
        path: 'product',
        layout: 'sd-page-list',
        shows: 'Quick search và filter dưới cột. Mã có link theo quyền. Header có Tạo mới, menu Nhập/Xuất.',
      },
      {
        link: ['product', 'create'],
        path: 'product/create',
        layout: 'sd-page-form',
        shows: 'Form một section, product-status-select cho trạng thái, lưu xong sang chi tiết.',
      },
      {
        link: ['product', '1', 'detail'],
        path: 'product/:id/detail',
        layout: 'sd-page-detail',
        shows: 'Title "Chi tiết sản phẩm #mã", badge cạnh title, sd-view theo section.',
      },
      {
        link: ['product', '1', 'update'],
        path: 'product/:id/update',
        layout: 'sd-page-form',
        shows: 'Mã bị khoá. Dirty tính theo giá trị. Lưu lỗi vẫn giữ dữ liệu để thử lại.',
      },
      {
        link: ['product', '999', 'detail'],
        path: 'product/999/detail',
        layout: 'Lỗi trước activation',
        shows: 'Resolver trả 404: sang trang lỗi của host. Đổi vai trò để thấy 403, bật timeout để thấy lỗi mạng.',
      },
    ],
  },
  {
    key: 'customer',
    title: 'Khách hàng',
    summary: 'Thao tác trong drawer và hồ sơ 360°.',
    docs: ['drawer', 'relation', 'detail', 'states'],
    routes: [
      {
        link: ['customer'],
        path: 'customer',
        layout: 'sd-page-list detail="drawer"',
        shows: 'Score card lọc theo loại khách. Card, filter và request dùng cùng một state.',
      },
      {
        link: ['customer', 'create'],
        path: 'customer/create',
        layout: 'Drawer, route con',
        shows: 'Ba section, sd-inform cảnh báo từng nhóm, BE báo trùng email.',
      },
      {
        link: ['customer', '1', 'detail'],
        path: 'customer/:id/detail',
        layout: 'Drawer, route con',
        shows: 'sd-section-item, footer có Cập nhật, chỉ đóng bằng X. Lấy dữ liệu bằng detail(id).',
      },
      {
        link: ['customer', '1', 'update'],
        path: 'customer/:id/update',
        layout: 'Drawer, route con',
        shows: 'beforeClose chặn X, Esc, backdrop khi còn thay đổi. Chỉ tải lại danh sách khi lưu thành công.',
      },
      {
        link: ['customer', '1', '360'],
        path: 'customer/:id/360',
        layout: 'sd-page-detail + tab',
        shows: 'Tab Thông tin, Đơn hàng, Công nợ, Tài liệu. Mở tab nào mới tải tab đó.',
      },
    ],
  },
  {
    key: 'order',
    title: 'Đơn hàng',
    summary: 'Chứng từ có dòng chi tiết và quy trình duyệt.',
    docs: ['list', 'form', 'select', 'states'],
    routes: [
      {
        link: ['order'],
        path: 'order',
        layout: 'sd-page-list',
        shows:
          'Tab trạng thái có số lượng. Chọn nhiều rồi xác nhận hàng loạt, báo kết quả từng phần, thử lại phần lỗi. Có "Tuỳ chỉnh hiển thị".',
      },
      {
        link: ['order', 'create'],
        path: 'order/create',
        layout: 'sd-page-form toc',
        shows: 'customer-select hai dòng. Bảng dòng hàng nhập inline với product-select, tổng tự tính.',
      },
      {
        link: ['order', '2400', 'update'],
        path: 'order/:id/update',
        layout: 'sd-page-form toc',
        shows: 'Vẫn hiện khách hàng đã ngừng hoạt động. BE báo lỗi ngay trên dòng.',
      },
      {
        link: ['order', '2400', 'detail'],
        path: 'order/:id/detail',
        layout: 'sd-page-detail',
        shows: 'Gửi duyệt, Duyệt, Từ chối có lý do bắt buộc. Cột phụ là quy trình duyệt.',
      },
    ],
  },
  {
    key: 'approval',
    title: 'Phê duyệt',
    summary: 'Hộp xử lý nhanh: danh sách và chi tiết cạnh nhau.',
    docs: ['split'],
    routes: [
      {
        link: ['approval'],
        path: 'approval',
        layout: 'sd-page-list + sd-splitter',
        shows: 'Danh sách và chi tiết cạnh nhau, ↑ ↓ để chuyển mục, có trạng thái trống.',
      },
      {
        link: ['approval', '1'],
        path: 'approval/:id',
        layout: 'Route con trong vùng chi tiết',
        shows: 'Duyệt xong tự chọn mục kế. Bộ lọc và vị trí cuộn giữ nguyên.',
      },
    ],
  },
  {
    key: 'category',
    title: 'Danh mục',
    summary: 'Dữ liệu phân cấp.',
    docs: ['list', 'drawer'],
    routes: [
      {
        link: ['category'],
        path: 'category',
        layout: 'sd-page-list',
        shows: 'Bảng cây 3 cấp, có thao tác theo dòng. Tạo danh mục con bằng drawer.',
      },
    ],
  },
  {
    key: 'flow',
    title: 'Quy trình nhiều bước',
    summary: 'Nhập dữ liệu (ngang) và tạo đối tác (dọc, rẽ nhánh, lưu nháp).',
    docs: ['flow'],
    routes: [
      {
        link: ['import'],
        path: 'import',
        layout: 'sd-page + sd-stepper',
        shows: 'Bốn bước ngang: nguồn, ánh xạ, xem trước & xung đột, xác nhận.',
      },
      {
        link: ['partner', 'create'],
        path: 'partner/create',
        layout: 'sd-page + sd-stepper dọc',
        shows: 'Rẽ nhánh cá nhân/doanh nghiệp. Kiểm tra trùng mã khi chuyển bước. Lưu nháp, tải lại trang vẫn khôi phục.',
      },
    ],
  },
  {
    key: 'settings',
    title: 'Cài đặt',
    summary: 'Một bản ghi, không có danh sách.',
    docs: ['form'],
    routes: [
      {
        link: ['settings'],
        path: 'settings',
        layout: 'sd-page-form toc',
        shows: 'Nhiều section có mục lục. Footer hiện trạng thái lưu. Cảnh báo khi rời trang chưa lưu.',
      },
    ],
  },
];
