# Hồ sơ Record 360

Mở **Khách hàng** trong catalog và chọn một trong hai cách xem. Cả hai dùng chung bản ghi do resolver tải và drawer cập nhật. Mẫu dùng API giả lập của pattern. Khách hàng số 12 có dữ liệu để thử các liên kết, khách hàng số 39 minh hoạ hồ sơ trống.

## Tổng quan và tab chi tiết

Mở `customer/12/360` để xem chỉ số, quan hệ gần đây, thông tin chung và ghi chú. Chọn chỉ số Công nợ để mở bảng hoá đơn đã lọc Quá hạn. Sao chép URL của bảng để mở lại bộ lọc đó. Chọn Xem tất cả trong thẻ để vào tab tương ứng.

Số trên tab Đơn hàng và Tài liệu là tổng số bản ghi. Số đỏ trên tab Công nợ là số hoá đơn quá hạn. Mỗi thẻ Tổng quan chỉ tải tối đa năm dòng. Khi một thẻ lỗi, nút Thử lại tải riêng phần đó. Tab chi tiết tải ở lần mở đầu tiên. Vai trò Chỉ xem trong mẫu không có quyền xem công nợ.

## Hồ sơ một trang

Mở `customer/12/sheet` từ catalog. Chọn một mục trong mục lục để chia sẻ đường dẫn, ví dụ `customer/12/sheet#tai-lieu`. Mục lục hiện từ 1200px. Các phần quan hệ tải khi cuộn đến. Nút In hồ sơ chờ tất cả phần được phép xem tải xong rồi mở hộp thoại in. Nếu một phần lỗi, người dùng có thể thử in lại. Header hồ sơ 360 hiện có một nút cập nhật, bản một trang có lối vào riêng trong catalog.

## Mã nguồn của trang một trang

<!-- @source features/customer/pages/sheet/sheet.component.html -->
```html
@let customer = entity();
<sd-page-detail
  toc
  [title]="'Hồ sơ khách hàng #' + customer.code"
  [description]="customer.name + ' · ' + typeName()"
  [badges]="badges()"
  [backLink]="['../..']">
  <div headerRight class="customer-sheet-actions d-flex align-items-center gap-8">
    <sd-button
      title="In hồ sơ"
      type="light"
      color="primary"
      prefixIcon="print"
      autoId="customer-sheet-print"
      [loading]="printing()"
      (click)="printSheet()" />
    <sd-button
      *sdPermission="'PATTERN_CUSTOMER_U_UPDATE'"
      title="Cập nhật khách hàng"
      type="fill"
      color="primary"
      prefixIcon="edit"
      autoId="customer-sheet-update"
      (click)="updating.set(true)" />
  </div>
  @if (printError()) {
    <p role="alert">Chưa thể in vì một phần hồ sơ chưa tải được. Bấm In hồ sơ để thử lại.</p>
  }
  <div class="customer-sheet-sections d-flex flex-column gap-16">
    <sd-section title="Thông tin chung" id="thong-tin" data-autoid="customer-sheet-section-thong-tin" dividers="header">
      <sd-section-item label="Mã khách hàng">{{ customer.code }}</sd-section-item>
      <sd-section-item label="Tên khách hàng">{{ customer.name }}</sd-section-item>
      <sd-section-item label="Loại khách hàng">{{ typeName() }}{{ customer.tier === 'vip' ? ' · VIP' : '' }}</sd-section-item>
      @if (customer.type === 'business') {
        <sd-section-item label="Mã số thuế">{{ customer.taxCode | sdEmpty }}</sd-section-item>
      }
      <sd-section-item label="Ngày tạo">{{ customer.createdAt | sdFormatDate }}</sd-section-item>
      <sd-section-item label="Ghi chú">{{ customer.note | sdEmpty }}</sd-section-item>
    </sd-section>
    <sd-section title="Liên hệ" id="lien-he" data-autoid="customer-sheet-section-lien-he" dividers="header">
      <sd-section-item label="Email">{{ customer.email }}</sd-section-item>
      <sd-section-item label="Điện thoại">{{ customer.phone }}</sd-section-item>
      <sd-section-item label="Địa chỉ">{{ customer.address | sdEmpty }}</sd-section-item>
    </sd-section>
    @for (item of relations; track item.id) {
      @defer (on viewport; when printing(); prefetch on idle) {
        <customer-relation
          #relation
          [customerId]="customer.id"
          [kind]="item.kind"
          [title]="item.title"
          [limit]="null"
          [sectionId]="item.id"
          [autoId]="'customer-sheet-section-' + item.id"
          [more]="{ link: ['../360'], queryParams: { tab: item.kind } }" />
      } @placeholder {
        <sd-section [title]="item.title" [id]="item.id" [attr.data-autoid]="'customer-sheet-section-' + item.id" dividers="header">
          <sd-data-state compact state="loading" />
        </sd-section>
      }
    }
  </div>
</sd-page-detail>
@if (updating()) {
  <update-side-drawer [id]="customer.id" (saved)="saved($event)" (closed)="updating.set(false)" />
}
```
