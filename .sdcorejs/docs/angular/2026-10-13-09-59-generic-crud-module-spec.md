# Spec - Module generic CRUD theo schema (SdGenericSchema) - 2026-10-13 09:59

```yaml
spec_context:
  source: sdcorejs-spec
  decision_coverage:
    schema_version: 1
    revision: 1
    records:
      - id: R-001
        type: requirement
        statement: >-
          Thêm entry point @sdcorejs/angular/modules/generic, không phụ thuộc backend: public API runtime gồm provideSdGeneric,
          provideSdGenericEntity, sdGenericRoutes, validateSdGenericSchema; các model SdGenericSchema, SdGenericProperty, SdGenericAdapter…
          chỉ export dạng type. Không chứa adapter hay giá trị riêng của backend nào.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
      - id: R-002
        type: requirement
        statement: >-
          Model SdGenericSchema { version: 1, module, entity, general { label, primaryKey?, properties }, list?, detail?, create?, update?,
          import? }; detail/create/update có dạng { title?, form?: SdFormGenericSchema }; list có title?, columns?, externalFilters?,
          orders?, pageSize?, export?; import có columns?: { key, matchField? }[], upsertKey?.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
      - id: R-003
        type: requirement
        statement: >-
          Model SdGenericProperty { key, label, dataType: string|text|number|boolean|date|datetime|time|enum|relation|json|file, multiple?,
          format? (email|phone|url|password cho string; integer|decimal|currency|percent cho number), enums?: { value, label, color?, icon?
          }[], relation?: { module?, entity, valueField? = 'id', displayField?, display?, searchFields? }, validation?, defaultValue?,
          insertable? = true, updatable? = true, system? }; không có relation.type, multiple quyết định chọn một hay nhiều.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
      - id: R-004
        type: requirement
        statement: >-
          Contract SdGenericAdapter { module, schema(entity), query(entity, PagingReq) → PagingRes, detail(entity, id), create(entity,
          data), update(entity, id, data), delete(entity, id), search?(entity, req), configuration?: { get(entity), set(entity, schema) },
          display?(args) }; request/response dùng PagingReq/PagingRes/Filter/Order của @sdcorejs/utils.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
      - id: R-005
        type: requirement
        statement: >-
          provideSdGeneric({ adapters, permission? }) và provideSdGenericEntity({ module, entity, … }) gọi được nhiều lần ở root và trong
          lazy route; tra cứu theo module (và module+entity) đi từ injector gần nhất lên root, bản gần nhất thắng; trùng module/entity trong
          cùng một lần gọi là lỗi khi khởi tạo; adapters nhận class (DI tạo) hoặc instance.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
      - id: R-006
        type: requirement
        statement: >-
          Schema hiệu lực dựng qua 3 lớp: adapter.schema(entity) → provideSdGenericEntity.schema(base) (nếu có) = cấu hình mặc định →
          configuration.get(entity) khác null thì validate rồi merge lên trên; null thì dùng cấu hình mặc định. Adapter không khai
          configuration thì lib lưu ở localStorage. Mỗi entity một cấu hình; lưu theo server hay theo người dùng do adapter quyết định.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
      - id: R-007
        type: requirement
        statement: >-
          Merge cấu hình đã lưu với schema hiện tại: key, dataType, enums[].value, relation.entity lấy từ schema hiện tại; label, nhãn enum,
          display, validation, defaultValue… lấy từ bản đã lưu; property không còn ở schema hiện tại bị bỏ khỏi general, list, layout form
          và import; property mới được thêm vào general và vào list.columns với visible: false, không tự chèn vào layout form đã lưu.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
      - id: R-008
        type: requirement
        statement: >-
          validateSdGenericSchema(stored, base) trả danh sách issue { path, code, severity } kiểm tra: shape và version, key property không
          trùng, module/entity khớp, tham chiếu của list.columns/externalFilters/orders/import.columns/upsertKey/field trong layout tới
          property có thật, type field layout khớp dataType, ngữ pháp layout form-generic, upsertKey không multiple, field layout create
          phải insertable và update phải updatable, template tiêu đề. Khi load: tham chiếu treo tự bỏ; lỗi shape/version thì dùng cấu hình
          mặc định, console.warn và hiện banner cho người có quyền CONFIGURATION. Khi lưu: có lỗi thì chặn.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
      - id: R-009
        type: requirement
        statement: >-
          Tiêu đề nằm trong từng section (list.title, create.title, detail.title, update.title), hỗ trợ template ${key}; list.title và
          create.title không được có placeholder; detail.title và update.title chỉ tham chiếu property có thật; tiêu đề render dạng text
          (không HTML); thiếu thì sinh từ general.label.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
      - id: R-010
        type: requirement
        statement: >-
          sdGenericRoutes() cung cấp generic/:module/:entity, …/create, …/:id/detail, …/:id/update, …/configuration. Form
          detail/create/update hiển thị dạng page hoặc side-drawer theo provideSdGenericEntity.display → adapter.display → mặc định 'page';
          side-drawer điều khiển bằng route: list vẫn hiển thị phía sau, giữ filter/trang, back đóng drawer, lưu xong list reload.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
      - id: R-011
        type: requirement
        statement: >-
          Quyền theo định dạng <MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION} (viết hoa), kiểm tra qua
          SdPermissionService.hasPermission; thiếu quyền thì ẩn action và chặn route tương ứng; provideSdGeneric({ permission: false }) tắt
          kiểm tra.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
      - id: R-012
        type: requirement
        statement: >-
          Màn list dùng sd-table type server: cột mặc định là mọi property trừ json/file; visible: false là ẩn mặc định nhưng bật lại được;
          sortable/filterable; externalFilters; orders mặc định; pageSize mặc định 20; export Excel phía client khi bật; action có sẵn
          create/import/export (header), detail/update/delete (dòng), delete (chọn nhiều, gọi delete lần lượt); xoá có xác nhận và reload
          sau khi xoá.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
      - id: R-013
        type: requirement
        statement: >-
          Detail/create/update render bằng sd-form-render: layout = section.form ?? detail.form ?? tự sinh từ general; mỗi field layout được
          điền type/label/options/validation từ general theo key; detail ở chế độ viewed và hiện cả property system; create bỏ system và
          property không insertable; update bỏ system và property không updatable, payload update chỉ gồm property updatable; relation dùng
          catalog do lib tự đăng ký, search theo thứ tự provideSdGenericEntity.search → adapter.search → adapter.query với CONTAIN (tìm) /
          IN (lấy nhãn).
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
      - id: R-014
        type: requirement
        statement: >-
          provideSdGenericEntity.hooks: beforeSave(ctx { action, data, schema }) trả payload (đồng bộ hoặc Promise) trước khi gọi
          adapter.create/update; afterSave(ctx) chạy sau khi lưu thành công.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
      - id: R-015
        type: requirement
        statement: >-
          provideSdGenericEntity khai action mở rộng: listActions, rowCommands, bulkActions, detailActions với { id, label, icon?,
          permission?, visible?(ctx), run(ctx) }, ctx gồm schema, row hoặc rows, reload(); hiddenDefaults ẩn action có sẵn (create, import,
          export, detail, update, delete).
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
      - id: R-016
        type: requirement
        statement: >-
          Import dùng sd-import-excel: template từ import.columns hoặc mọi property insertable trừ system/json/file; ô enum nhận value hoặc
          label; ô relation so khớp theo matchField (mặc định relation.displayField) qua search với values; có upsertKey thì tra theo lô bản
          ghi đã tồn tại → update, chưa có → create; không upsertKey thì luôn create; tối đa 5 request song song; kết quả từng dòng hiện
          trong sd-import-excel; chỉ cần quyền IMPORT.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
      - id: R-017
        type: requirement
        statement: >-
          Màn chỉnh cấu hình tại …/configuration với 4 tab: Thông tin chung (label, nhãn/màu enum, display/searchFields của relation,
          validation, defaultValue, insertable/updatable; không sửa key/dataType), Danh sách (thứ tự cột, width/visible/sortable/filterable,
          externalFilters, orders, pageSize, export), Form (sd-form-builder cho detail, create/update có lựa chọn "giống detail", palette là
          properties), Import (columns, upsertKey); hiện cảnh báo property bị bỏ/mới; nút Lưu validate rồi gọi configuration.set(entity,
          schema), có lỗi thì chặn.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: modules/generic
      - id: R-018
        type: requirement
        statement: >-
          form-generic thêm field type time (giá trị chuỗi HH:mm) và json (dùng code-editor, giá trị JSON hợp lệ) ở renderer, builder và
          validation; chỉ thêm mới, schema form-generic hiện có không đổi hành vi.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
      - id: R-019
        type: requirement
        statement: >-
          Showcase có trang demo module generic chạy với adapter mock in-memory; có tài liệu sd-generic.md và cập nhật sd-form-generic.md
          cho time/json.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: showcase
      - id: R-020
        type: requirement
        statement: >-
          Thay đổi viết ở versions/v19 rồi rollout sang v20/v21/v22 bằng npm run sync, check:sync xanh; CHANGELOG có mục Unreleased mô tả
          thay đổi, nhắm release suffix 3.2 (chỉ thêm mới).
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: null
      - id: AC-001
        type: acceptance-criterion
        statement: >-
          Mở generic/tms/order khi configuration.get trả null → Màn list hiện các cột sinh từ properties (trừ json/file), dữ liệu lấy qua
          adapter.query với PagingReq pageSize 20
        behavior: Mở generic/tms/order khi configuration.get trả null
        expected_result: Màn list hiện các cột sinh từ properties (trừ json/file), dữ liệu lấy qua adapter.query với PagingReq pageSize 20
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-004
          - R-006
          - R-012
      - id: AC-002
        type: acceptance-criterion
        statement: >-
          Cùng module tms khai ở provideSdGeneric root và trong lazy route rồi mở trang generic trong lazy route đó → Lib dùng adapter khai
          ở lazy route; trang ngoài lazy route dùng adapter root
        behavior: Cùng module tms khai ở provideSdGeneric root và trong lazy route rồi mở trang generic trong lazy route đó
        expected_result: Lib dùng adapter khai ở lazy route; trang ngoài lazy route dùng adapter root
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-005
      - id: AC-003
        type: acceptance-criterion
        statement: Một lần gọi provideSdGeneric khai hai adapter cùng module → Khởi tạo injector ném lỗi nêu tên module bị trùng
        behavior: Một lần gọi provideSdGeneric khai hai adapter cùng module
        expected_result: Khởi tạo injector ném lỗi nêu tên module bị trùng
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-005
      - id: AC-004
        type: acceptance-criterion
        statement: >-
          provideSdGenericEntity.schema đổi label của một property và configuration.get trả bản đã lưu đổi label property khác → Schema hiệu
          lực có cả hai thay đổi; khi get trả null thì chỉ có thay đổi của provideSdGenericEntity.schema
        behavior: provideSdGenericEntity.schema đổi label của một property và configuration.get trả bản đã lưu đổi label property khác
        expected_result: Schema hiệu lực có cả hai thay đổi; khi get trả null thì chỉ có thay đổi của provideSdGenericEntity.schema
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-006
      - id: AC-005
        type: acceptance-criterion
        statement: >-
          Adapter không khai configuration, lưu cấu hình từ màn chỉnh rồi tải lại trang → Cấu hình được ghi và đọc lại từ localStorage theo
          module và entity
        behavior: Adapter không khai configuration, lưu cấu hình từ màn chỉnh rồi tải lại trang
        expected_result: Cấu hình được ghi và đọc lại từ localStorage theo module và entity
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-006
          - R-017
      - id: AC-006
        type: acceptance-criterion
        statement: >-
          Cấu hình đã lưu có cột và field layout trỏ tới property đã bị xoá ở schema hiện tại, và schema hiện tại có property mới →
          Cột/field treo bị bỏ, trang vẫn chạy; property mới có trong general và list.columns với visible: false, không có trong layout form
          đã lưu; dataType lấy từ schema hiện tại
        behavior: Cấu hình đã lưu có cột và field layout trỏ tới property đã bị xoá ở schema hiện tại, và schema hiện tại có property mới
        expected_result: >-
          Cột/field treo bị bỏ, trang vẫn chạy; property mới có trong general và list.columns với visible: false, không có trong layout form
          đã lưu; dataType lấy từ schema hiện tại
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-007
          - R-008
      - id: AC-007
        type: acceptance-criterion
        statement: >-
          configuration.get trả object sai shape hoặc version không hỗ trợ → Lib dùng cấu hình mặc định, gọi console.warn, banner "cấu hình
          không hợp lệ" chỉ hiện với người có quyền CONFIGURATION
        behavior: configuration.get trả object sai shape hoặc version không hỗ trợ
        expected_result: Lib dùng cấu hình mặc định, gọi console.warn, banner "cấu hình không hợp lệ" chỉ hiện với người có quyền CONFIGURATION
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-008
          - R-011
      - id: AC-008
        type: acceptance-criterion
        statement: >-
          validateSdGenericSchema nhận schema có key trùng, upsertKey trỏ property multiple, field layout update không updatable, field
          layout sai type → Trả issue với path và code tương ứng cho từng lỗi, severity error
        behavior: >-
          validateSdGenericSchema nhận schema có key trùng, upsertKey trỏ property multiple, field layout update không updatable, field
          layout sai type
        expected_result: Trả issue với path và code tương ứng cho từng lỗi, severity error
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-008
      - id: AC-009
        type: acceptance-criterion
        statement: >-
          Validate update.title = 'Đơn ${unknown}' và list.title = 'DS ${code}'; render detail.title = '<b>${code}</b>' → Cả hai title đầu
          bị báo lỗi template; title detail hiện chuỗi text đã thay giá trị, thẻ <b> không được render thành HTML
        behavior: Validate update.title = 'Đơn ${unknown}' và list.title = 'DS ${code}'; render detail.title = '<b>${code}</b>'
        expected_result: Cả hai title đầu bị báo lỗi template; title detail hiện chuỗi text đã thay giá trị, thẻ <b> không được render thành HTML
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-008
          - R-009
      - id: AC-010
        type: acceptance-criterion
        statement: >-
          Người dùng thiếu quyền TMS_ORDER_C_GENERIC_CREATE mở màn list rồi điều hướng thẳng tới generic/tms/order/create → Nút tạo mới bị
          ẩn và route create bị chặn; khi provideSdGeneric({ permission: false }) thì nút hiện và route mở được
        behavior: Người dùng thiếu quyền TMS_ORDER_C_GENERIC_CREATE mở màn list rồi điều hướng thẳng tới generic/tms/order/create
        expected_result: 'Nút tạo mới bị ẩn và route create bị chặn; khi provideSdGeneric({ permission: false }) thì nút hiện và route mở được'
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-010
          - R-011
      - id: AC-011
        type: acceptance-criterion
        statement: >-
          display trả 'side-drawer', người dùng lọc list rồi mở generic/tms/order/1/detail và bấm back → Drawer mở đè lên list, URL có
          /1/detail; back đóng drawer, list giữ filter và trang
        behavior: display trả 'side-drawer', người dùng lọc list rồi mở generic/tms/order/1/detail và bấm back
        expected_result: Drawer mở đè lên list, URL có /1/detail; back đóng drawer, list giữ filter và trang
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-010
      - id: AC-012
        type: acceptance-criterion
        statement: >-
          Không khai display và mở generic/tms/order/1/update → Form update hiển thị dạng trang đầy đủ (mặc định 'page'); lưu thành công thì
          quay về list và list reload
        behavior: Không khai display và mở generic/tms/order/1/update
        expected_result: Form update hiển thị dạng trang đầy đủ (mặc định 'page'); lưu thành công thì quay về list và list reload
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-010
      - id: AC-013
        type: acceptance-criterion
        statement: >-
          list có column visible: false, orders mặc định và externalFilters có default → Cột ẩn nhưng có trong cài đặt cột; request query
          mang orders và filters tương ứng
        behavior: 'list có column visible: false, orders mặc định và externalFilters có default'
        expected_result: Cột ẩn nhưng có trong cài đặt cột; request query mang orders và filters tương ứng
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-012
      - id: AC-014
        type: acceptance-criterion
        statement: >-
          Xoá một dòng và xoá 3 dòng đã chọn → Mỗi lần có hộp xác nhận; adapter.delete được gọi 1 lần rồi 3 lần tuần tự; list reload sau khi
          xoá
        behavior: Xoá một dòng và xoá 3 dòng đã chọn
        expected_result: Mỗi lần có hộp xác nhận; adapter.delete được gọi 1 lần rồi 3 lần tuần tự; list reload sau khi xoá
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-012
      - id: AC-015
        type: acceptance-criterion
        statement: >-
          Mở create, update, detail với schema không có layout form và có property system, property updatable: false → Create không có
          system; update không có system và property không updatable, payload update không chứa chúng; detail ở chế độ viewed và có property
          system; field có label/type/options lấy từ general
        behavior: 'Mở create, update, detail với schema không có layout form và có property system, property updatable: false'
        expected_result: >-
          Create không có system; update không có system và property không updatable, payload update không chứa chúng; detail ở chế độ
          viewed và có property system; field có label/type/options lấy từ general
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-013
      - id: AC-016
        type: acceptance-criterion
        statement: >-
          Mở select relation với entity có search riêng, với adapter có search, và với adapter chỉ có query → Lần lượt gọi search của
          entity, search của adapter, query với filter CONTAIN trên searchFields/displayField; nhãn giá trị đã chọn lấy qua IN trên
          valueField
        behavior: Mở select relation với entity có search riêng, với adapter có search, và với adapter chỉ có query
        expected_result: >-
          Lần lượt gọi search của entity, search của adapter, query với filter CONTAIN trên searchFields/displayField; nhãn giá trị đã chọn
          lấy qua IN trên valueField
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-013
          - R-004
      - id: AC-017
        type: acceptance-criterion
        statement: >-
          beforeSave thêm field vào payload và afterSave được khai → adapter.create/update nhận payload đã sửa; afterSave chạy đúng một lần
          sau khi lưu thành công và không chạy khi lưu lỗi
        behavior: beforeSave thêm field vào payload và afterSave được khai
        expected_result: adapter.create/update nhận payload đã sửa; afterSave chạy đúng một lần sau khi lưu thành công và không chạy khi lưu lỗi
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-014
      - id: AC-018
        type: acceptance-criterion
        statement: >-
          provideSdGenericEntity khai rowCommands có permission và visible, hiddenDefaults: [delete] → Command chỉ hiện khi có quyền và
          visible trả true, run nhận ctx có row và reload; command delete có sẵn bị ẩn
        behavior: 'provideSdGenericEntity khai rowCommands có permission và visible, hiddenDefaults: [delete]'
        expected_result: Command chỉ hiện khi có quyền và visible trả true, run nhận ctx có row và reload; command delete có sẵn bị ẩn
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-015
      - id: AC-019
        type: acceptance-criterion
        statement: >-
          Import file 3 dòng với upsertKey code (1 dòng code đã tồn tại), một ô enum ghi bằng label, một ô relation ghi theo displayField →
          Dòng đã tồn tại gọi update, hai dòng còn lại gọi create; enum và relation được đổi sang value/id; không quá 5 request chạy đồng
          thời; kết quả từng dòng hiện trong sd-import-excel
        behavior: Import file 3 dòng với upsertKey code (1 dòng code đã tồn tại), một ô enum ghi bằng label, một ô relation ghi theo displayField
        expected_result: >-
          Dòng đã tồn tại gọi update, hai dòng còn lại gọi create; enum và relation được đổi sang value/id; không quá 5 request chạy đồng
          thời; kết quả từng dòng hiện trong sd-import-excel
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-016
      - id: AC-020
        type: acceptance-criterion
        statement: >-
          Ở màn chỉnh cấu hình, xoá property đang dùng làm upsertKey khỏi import rồi bấm Lưu; sau đó sửa label hợp lệ rồi bấm Lưu → Lần đầu
          bị chặn và hiện lỗi; lần sau gọi configuration.set(entity, schema) với label mới; ô key và dataType không sửa được
        behavior: Ở màn chỉnh cấu hình, xoá property đang dùng làm upsertKey khỏi import rồi bấm Lưu; sau đó sửa label hợp lệ rồi bấm Lưu
        expected_result: Lần đầu bị chặn và hiện lỗi; lần sau gọi configuration.set(entity, schema) với label mới; ô key và dataType không sửa được
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-017
          - R-008
      - id: AC-021
        type: acceptance-criterion
        statement: >-
          Render schema form-generic có field time và json; nhập '25:00' và chuỗi JSON sai → Hai field báo lỗi validation; giá trị đúng được
          lưu là chuỗi HH:mm và JSON đã parse; builder có hai loại field này trong palette; spec form-generic hiện có vẫn xanh
        behavior: Render schema form-generic có field time và json; nhập '25:00' và chuỗi JSON sai
        expected_result: >-
          Hai field báo lỗi validation; giá trị đúng được lưu là chuỗi HH:mm và JSON đã parse; builder có hai loại field này trong palette;
          spec form-generic hiện có vẫn xanh
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-018
      - id: AC-022
        type: acceptance-criterion
        statement: >-
          Mở trang demo module generic trên Showcase → Trang hiện list từ adapter mock và mở được create/detail; guard example/registry của
          Showcase xanh
        behavior: Mở trang demo module generic trên Showcase
        expected_result: Trang hiện list từ adapter mock và mở được create/detail; guard example/registry của Showcase xanh
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-019
      - id: AC-023
        type: acceptance-criterion
        statement: >-
          Chạy npm run sync rồi npm run check:sync và build sdcorejs-angular trên v19–v22 → check:sync xanh, bốn workspace build không lỗi;
          CHANGELOG có mục Unreleased cho module generic
        behavior: Chạy npm run sync rồi npm run check:sync và build sdcorejs-angular trên v19–v22
        expected_result: check:sync xanh, bốn workspace build không lỗi; CHANGELOG có mục Unreleased cho module generic
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-020
      - id: AC-024
        type: acceptance-criterion
        statement: >-
          Chạy spec public-api của entry point modules/generic → Entry point export đúng bốn symbol runtime provideSdGeneric,
          provideSdGenericEntity, sdGenericRoutes, validateSdGenericSchema; không import package riêng của backend nào
        behavior: Chạy spec public-api của entry point modules/generic
        expected_result: >-
          Entry point export đúng bốn symbol runtime provideSdGeneric, provideSdGenericEntity, sdGenericRoutes, validateSdGenericSchema;
          không import package riêng của backend nào
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-001
          - R-002
          - R-003
      - id: A-001
        type: assumption
        statement: >-
          Multi-provider khai trong injector con không gộp với injector cha; lib phải tự đi từ injector gần nhất lên root (skipSelf) để tìm
          adapter/entity.
        evidence_refs: []
        source: inferred
        confidence: high
        status: confirmed
        blocking: false
        consequence_if_wrong: Có thể đọc trực tiếp token multi thay vì đi theo chuỗi injector; thiết kế vẫn đúng nhưng thừa code.
        validation_method: Test TDD cho AC-002 với injector root + lazy.
        owner: sdcorejs-execute-plan
        rationale: Hành vi chuẩn của Angular DI; đã gặp ở SD_API_CONFIG (SdApiHandlerRegistry).
        impacted_refs:
          - R-005
      - id: A-002
        type: assumption
        statement: >-
          sd-table server truyền PagingReq (filters, orders, pageSize, pageNumber) đủ để chuyển thẳng sang adapter.query, gồm cả external
          filter.
        evidence_refs: []
        source: inferred
        confidence: medium
        status: proposed
        blocking: false
        consequence_if_wrong: Cần lớp chuyển SdTableFilterRequest sang Filter trong module generic.
        validation_method: Test TDD cho AC-013 đối chiếu request thực tế sd-table phát ra.
        owner: sdcorejs-execute-plan
        rationale: 'components/table/src/models/table-option.model.ts:198 khai items(filterRequest, pagingReq: PagingReq).'
        impacted_refs:
          - R-012
      - id: A-003
        type: assumption
        statement: sd-import-excel accept(items) trả SdImportExcelValidation[] đủ để báo kết quả từng dòng sau khi gọi create/update.
        evidence_refs: []
        source: inferred
        confidence: medium
        status: proposed
        blocking: false
        consequence_if_wrong: Cần thêm hiển thị kết quả riêng sau bước accept.
        validation_method: Test cho AC-019.
        owner: sdcorejs-execute-plan
        rationale: components/import-excel/src/import-excel.model.ts:17.
        impacted_refs:
          - R-016
      - id: A-004
        type: assumption
        statement: sd-code-editor dùng được làm control (model/ControlValueAccessor) bên trong renderer form-generic cho field json.
        evidence_refs: []
        source: inferred
        confidence: medium
        status: proposed
        blocking: false
        consequence_if_wrong: Field json cần bọc adapter control riêng quanh code-editor.
        validation_method: Test cho AC-021.
        owner: sdcorejs-execute-plan
        rationale: components/code-editor/src/code-editor.component.ts có model/CVA.
        impacted_refs:
          - R-018
      - id: A-005
        type: assumption
        statement: Khoá localStorage mặc định là sd-generic:configuration:<module>.<entity>; cấu hình chỉ có hiệu lực trên trình duyệt đó.
        evidence_refs: []
        source: defaulted
        confidence: high
        status: proposed
        blocking: false
        consequence_if_wrong: Đổi tên khoá trước release, chưa có dữ liệu cũ.
        validation_method: Người dùng duyệt spec; test cho AC-005.
        owner: user
        rationale: Người dùng chốt mặc định localStorage; tên khoá do spec đặt.
        impacted_refs:
          - R-006
      - id: D-001
        type: decision
        statement: >-
          Module generic đặt ở repo nào? → @sdcorejs/angular, entry point @sdcorejs/angular/modules/generic, không phụ thuộc backend;
          adapter backend OMD nằm ngoài repo
        question: Module generic đặt ở repo nào?
        selected_value: '@sdcorejs/angular, entry point @sdcorejs/angular/modules/generic, không phụ thuộc backend; adapter backend OMD nằm ngoài repo'
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: form-generic 3.0 đã ở đây; nguyên tắc adapter không phụ thuộc backend.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-001
          - AC-024
      - id: D-002
        type: decision
        statement: >-
          Ghép SdGenericSchema với form-generic thế nào? → general.properties là nguồn duy nhất; detail/create/update chứa layout
          SdFormGenericSchema tham chiếu property theo key, lib điền type/label/options/validation lúc render; thiếu layout thì tự sinh
        question: Ghép SdGenericSchema với form-generic thế nào?
        selected_value: >-
          general.properties là nguồn duy nhất; detail/create/update chứa layout SdFormGenericSchema tham chiếu property theo key, lib điền
          type/label/options/validation lúc render; thiếu layout thì tự sinh
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Tránh cấu hình trùng lặp (pain point lib-core-commerce) mà vẫn dùng đủ form-generic và sd-form-builder.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-002
          - R-013
          - AC-015
      - id: D-003
        type: decision
        statement: >-
          Tên gọi trong model và adapter? → properties (không phải fields), adapter.detail (không phải get), configuration: { get, set },
          entity (không phải typeCode)
        question: Tên gọi trong model và adapter?
        selected_value: 'properties (không phải fields), adapter.detail (không phải get), configuration: { get, set }, entity (không phải typeCode)'
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Theo convention API của người dùng.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-002
          - R-004
          - AC-001
      - id: D-004
        type: decision
        statement: Định dạng route? → generic/:module/:entity, /create, /:id/detail, /:id/update, /configuration (id đứng trước action)
        question: Định dạng route?
        selected_value: generic/:module/:entity, /create, /:id/detail, /:id/update, /configuration (id đứng trước action)
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Mỗi entity một cấu hình nên route mang thẳng module/entity, không cần tách chuỗi.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-010
          - AC-011
          - AC-012
      - id: D-005
        type: decision
        statement: >-
          Page hay side-drawer quyết định ở đâu? → Callback display(args) ở provideSdGenericEntity rồi adapter, mặc định 'page'; side-drawer
          điều khiển bằng route
        question: Page hay side-drawer quyết định ở đâu?
        selected_value: Callback display(args) ở provideSdGenericEntity rồi adapter, mặc định 'page'; side-drawer điều khiển bằng route
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Consumer quyết theo schema, ví dụ số property; deep link và back hoạt động.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-010
          - AC-011
      - id: D-006
        type: decision
        statement: >-
          Phạm vi giao lần này? → Làm hết một lần: runtime CRUD, import, màn chỉnh cấu hình, action mở rộng, form-generic time/json,
          Showcase, docs
        question: Phạm vi giao lần này?
        selected_value: 'Làm hết một lần: runtime CRUD, import, màn chỉnh cấu hình, action mở rộng, form-generic time/json, Showcase, docs'
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: Người dùng chọn phương án 3.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-012
          - R-016
          - R-017
          - R-018
          - R-019
      - id: D-007
        type: decision
        statement: >-
          provide một hay nhiều lần? → Nhiều lần ở root và lazy route; tra injector gần nhất lên root, gần nhất thắng; không dùng registry
          đọc field private của router
        question: provide một hay nhiều lần?
        selected_value: Nhiều lần ở root và lazy route; tra injector gần nhất lên root, gần nhất thắng; không dùng registry đọc field private của router
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Module tự provide adapter; registry root chỉ thấy module đã load và phụ thuộc field private.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-005
          - AC-002
          - AC-003
      - id: D-008
        type: decision
        statement: time và json? → Thêm field type time và json vào form-generic (json dùng code-editor), chỉ thêm mới
        question: time và json?
        selected_value: Thêm field type time và json vào form-generic (json dùng code-editor), chỉ thêm mới
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Phạm vi làm hết một lần; tránh map tạm kém chính xác.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-018
          - AC-021
      - id: D-009
        type: decision
        statement: Quan hệ OneToMany và relation.type? → Chỉ multi-select, không bảng con; bỏ relation.type, multiple quyết định một/nhiều
        question: Quan hệ OneToMany và relation.type?
        selected_value: Chỉ multi-select, không bảng con; bỏ relation.type, multiple quyết định một/nhiều
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Giữ đơn giản như lib-core-commerce; bảng con để sau.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-003
          - AC-016
      - id: D-010
        type: decision
        statement: search và history? → search? tuỳ chọn ở adapter và ở entity, fallback query CONTAIN/IN; history không thuộc lib
        question: search và history?
        selected_value: search? tuỳ chọn ở adapter và ở entity, fallback query CONTAIN/IN; history không thuộc lib
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Backend có API search riêng để bảo đảm hiệu năng; history mỗi dự án tự làm.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-004
          - R-013
          - AC-016
      - id: D-011
        type: decision
        statement: >-
          Tuỳ biến theo entity ở đâu? → Provider riêng provideSdGenericEntity { module, entity, schema(base), search?, display?, hooks?,
          listActions?, rowCommands?, bulkActions?, detailActions?, hiddenDefaults? }; schema dạng hàm thay vì object partial
        question: Tuỳ biến theo entity ở đâu?
        selected_value: >-
          Provider riêng provideSdGenericEntity { module, entity, schema(base), search?, display?, hooks?, listActions?, rowCommands?,
          bulkActions?, detailActions?, hiddenDefaults? }; schema dạng hàm thay vì object partial
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Adapter trả schema mặc định theo entity; deep-merge mảng không rõ nghĩa.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-006
          - R-014
          - R-015
          - AC-004
          - AC-017
          - AC-018
      - id: D-012
        type: decision
        statement: >-
          Lưu cấu hình thế nào? → configuration: { get(entity), set(entity, schema) } trên adapter, mỗi entity một cấu hình, null là chưa
          có; adapter không khai thì localStorage
        question: Lưu cấu hình thế nào?
        selected_value: >-
          configuration: { get(entity), set(entity, schema) } trên adapter, mỗi entity một cấu hình, null là chưa có; adapter không khai thì
          localStorage
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Không cần nhận diện configurationId; server hay theo người dùng do consumer quyết.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-006
          - AC-005
      - id: D-013
        type: decision
        statement: >-
          Cấu hình đã lưu không hợp lệ thì sao? → Tham chiếu treo tự bỏ; lỗi shape/version dùng mặc định + console.warn + banner cho người
          có quyền CONFIGURATION; lưu có lỗi thì chặn
        question: Cấu hình đã lưu không hợp lệ thì sao?
        selected_value: >-
          Tham chiếu treo tự bỏ; lỗi shape/version dùng mặc định + console.warn + banner cho người có quyền CONFIGURATION; lưu có lỗi thì
          chặn
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Bước validate quan trọng; trang không chết vì cấu hình hỏng.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-008
          - AC-007
          - AC-020
      - id: D-014
        type: decision
        statement: Tiêu đề đặt ở đâu? → Trong từng section list/create/update/detail, template ${key} có validate, render dạng text
        question: Tiêu đề đặt ở đâu?
        selected_value: Trong từng section list/create/update/detail, template ${key} có validate, render dạng text
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Người dùng yêu cầu; tránh XSS như htmlTemplate cũ.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-009
          - AC-009
      - id: D-015
        type: decision
        statement: >-
          Mã quyền và cơ chế kiểm tra? → <MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION} qua
          SdPermissionService, có permission: false
        question: Mã quyền và cơ chế kiểm tra?
        selected_value: '<MODULE>_<ENTITY>_C_GENERIC_{LIST|DETAIL|CREATE|UPDATE|DELETE|IMPORT|CONFIGURATION} qua SdPermissionService, có permission: false'
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Định dạng người dùng đưa, thêm CONFIGURATION cho màn chỉnh cấu hình.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-011
          - AC-010
      - id: D-016
        type: decision
        statement: >-
          Luật import? → Template từ import.columns hoặc property insertable; enum theo value/label; relation theo matchField qua search;
          upsert theo upsertKey; tối đa 5 request song song; chỉ quyền IMPORT
        question: Luật import?
        selected_value: >-
          Template từ import.columns hoặc property insertable; enum theo value/label; relation theo matchField qua search; upsert theo
          upsertKey; tối đa 5 request song song; chỉ quyền IMPORT
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Dùng lại create/update của adapter và sd-import-excel có sẵn.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-016
          - AC-019
      - id: D-017
        type: decision
        statement: >-
          Cách viết test? → TDD cho logic (tra adapter/entity, dựng schema, merge, validate, template, fallback search, mã quyền, import
          upsert); viết test sau cho UI và Showcase
        question: Cách viết test?
        selected_value: >-
          TDD cho logic (tra adapter/entity, dựng schema, merge, validate, template, fallback search, mã quyền, import upsert); viết test
          sau cho UI và Showcase
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: Logic thuần có giá trị TDD cao; UI chủ yếu là nối component.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-005
          - R-007
          - R-008
      - id: D-018
        type: decision
        statement: >-
          Release? → Suffix minor kế tiếp 3.2, chỉ thêm mới, CHANGELOG Unreleased; tag/publish theo release ritual và cần người dùng cho
          phép riêng
        question: Release?
        selected_value: Suffix minor kế tiếp 3.2, chỉ thêm mới, CHANGELOG Unreleased; tag/publish theo release ritual và cần người dùng cho phép riêng
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: Không phá vỡ API consumer.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-020
          - AC-023
    history:
      - revision: 1
        active:
          - id: R-001
            type: requirement
          - id: R-002
            type: requirement
          - id: R-003
            type: requirement
          - id: R-004
            type: requirement
          - id: R-005
            type: requirement
          - id: R-006
            type: requirement
          - id: R-007
            type: requirement
          - id: R-008
            type: requirement
          - id: R-009
            type: requirement
          - id: R-010
            type: requirement
          - id: R-011
            type: requirement
          - id: R-012
            type: requirement
          - id: R-013
            type: requirement
          - id: R-014
            type: requirement
          - id: R-015
            type: requirement
          - id: R-016
            type: requirement
          - id: R-017
            type: requirement
          - id: R-018
            type: requirement
          - id: R-019
            type: requirement
          - id: R-020
            type: requirement
          - id: AC-001
            type: acceptance-criterion
          - id: AC-002
            type: acceptance-criterion
          - id: AC-003
            type: acceptance-criterion
          - id: AC-004
            type: acceptance-criterion
          - id: AC-005
            type: acceptance-criterion
          - id: AC-006
            type: acceptance-criterion
          - id: AC-007
            type: acceptance-criterion
          - id: AC-008
            type: acceptance-criterion
          - id: AC-009
            type: acceptance-criterion
          - id: AC-010
            type: acceptance-criterion
          - id: AC-011
            type: acceptance-criterion
          - id: AC-012
            type: acceptance-criterion
          - id: AC-013
            type: acceptance-criterion
          - id: AC-014
            type: acceptance-criterion
          - id: AC-015
            type: acceptance-criterion
          - id: AC-016
            type: acceptance-criterion
          - id: AC-017
            type: acceptance-criterion
          - id: AC-018
            type: acceptance-criterion
          - id: AC-019
            type: acceptance-criterion
          - id: AC-020
            type: acceptance-criterion
          - id: AC-021
            type: acceptance-criterion
          - id: AC-022
            type: acceptance-criterion
          - id: AC-023
            type: acceptance-criterion
          - id: AC-024
            type: acceptance-criterion
          - id: A-001
            type: assumption
          - id: A-002
            type: assumption
          - id: A-003
            type: assumption
          - id: A-004
            type: assumption
          - id: A-005
            type: assumption
          - id: D-001
            type: decision
          - id: D-002
            type: decision
          - id: D-003
            type: decision
          - id: D-004
            type: decision
          - id: D-005
            type: decision
          - id: D-006
            type: decision
          - id: D-007
            type: decision
          - id: D-008
            type: decision
          - id: D-009
            type: decision
          - id: D-010
            type: decision
          - id: D-011
            type: decision
          - id: D-012
            type: decision
          - id: D-013
            type: decision
          - id: D-014
            type: decision
          - id: D-015
            type: decision
          - id: D-016
            type: decision
          - id: D-017
            type: decision
          - id: D-018
            type: decision
        tombstones: []
  goal_backward_review:
    schema_version: 1
    mode: sdcorejs-plan:goal-backward
    stage: spec
    future_gaps:
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-001.task_refs
        record_id: AC-001
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-002.task_refs
        record_id: AC-002
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-003.task_refs
        record_id: AC-003
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-004.task_refs
        record_id: AC-004
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-005.task_refs
        record_id: AC-005
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-006.task_refs
        record_id: AC-006
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-007.task_refs
        record_id: AC-007
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-008.task_refs
        record_id: AC-008
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-009.task_refs
        record_id: AC-009
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-010.task_refs
        record_id: AC-010
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-011.task_refs
        record_id: AC-011
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-012.task_refs
        record_id: AC-012
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-013.task_refs
        record_id: AC-013
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-014.task_refs
        record_id: AC-014
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-015.task_refs
        record_id: AC-015
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-016.task_refs
        record_id: AC-016
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-017.task_refs
        record_id: AC-017
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-018.task_refs
        record_id: AC-018
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-019.task_refs
        record_id: AC-019
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-020.task_refs
        record_id: AC-020
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-021.task_refs
        record_id: AC-021
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-022.task_refs
        record_id: AC-022
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-023.task_refs
        record_id: AC-023
        message: an acceptance criterion must map to at least one planned task
      - code: AC_PLAN_COVERAGE_MISSING
        path: records.AC-024.task_refs
        record_id: AC-024
        message: an acceptance criterion must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-001.task_refs
        record_id: R-001
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-002.task_refs
        record_id: R-002
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-003.task_refs
        record_id: R-003
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-004.task_refs
        record_id: R-004
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-005.task_refs
        record_id: R-005
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-006.task_refs
        record_id: R-006
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-007.task_refs
        record_id: R-007
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-008.task_refs
        record_id: R-008
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-009.task_refs
        record_id: R-009
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-010.task_refs
        record_id: R-010
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-011.task_refs
        record_id: R-011
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-012.task_refs
        record_id: R-012
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-013.task_refs
        record_id: R-013
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-014.task_refs
        record_id: R-014
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-015.task_refs
        record_id: R-015
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-016.task_refs
        record_id: R-016
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-017.task_refs
        record_id: R-017
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-018.task_refs
        record_id: R-018
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-019.task_refs
        record_id: R-019
        message: a requirement must map to at least one planned task
      - code: REQUIREMENT_PLAN_COVERAGE_MISSING
        path: records.R-020.task_refs
        record_id: R-020
        message: a requirement must map to at least one planned task
  architecture_gate:
    valid: true
    required: true
    status: required
    signals:
      - conflicting-independent-unit-decisions
      - persisted-data-model-contract
      - public-api-contract
      - state-data-ownership
    bypass: null
    rationale: >-
      Thêm public entry point mới (adapter contract, provider, route, validate) và schema JSON SdGenericSchema mà consumer lưu trữ qua
      configuration.set; xác định chủ sở hữu cấu hình (adapter/localStorage) và luật merge với schema backend; list, form, import và màn
      chỉnh cấu hình là các đơn vị độc lập phải dùng chung một bộ tra adapter, dựng schema và mã quyền, nếu không sẽ tự quyết theo cách xung
      đột.
  contract_id: generic-crud-module-v1
  requirement_id: generic-crud-module-v1
  approved_spec_path: ''
  approved_spec_hash: ''
  supersedes: null
  target_root: .
  target_root_kind: target-project
  owner_repository_id: sdcorejs-angular
  owner_repository_role: library
  owner_module_id: modules/generic
  execution_host_repository_id: sdcorejs-angular
  track: angular
  stack_profile: core-ui-angular
  profile_confidence: high
  source_requirement_context: >-
    generic-crud-module-v1 (sdcorejs-brainstorming trong phiên 8a7d5987, tiếp nối phiên ed7db25d bị ngắt; người dùng duyệt tóm tắt
    2026-10-13)
  acceptance_criteria_count: 24
  manual_criteria_count: 0
  non_goals:
    - Lịch sử thay đổi (history/audit log) của bản ghi
    - Bảng con cho quan hệ OneToMany
    - Nhiều cấu hình cho cùng một entity
    - Adapter cho backend cụ thể (core-commerce, tms, cdp, OMD…)
    - Tag và publish npm
  risks:
    - Phạm vi lớn trong một lần giao
    - Side-drawer điều khiển bằng route phụ thuộc kết quả display lúc chạy
    - form-generic mở rộng public API (time, json)
    - Cấu hình mặc định ở localStorage chỉ theo trình duyệt
    - Guard demo-section/example của Showcase
    - Rollout bốn line v19–v22
  assumptions:
    - >-
      A-001 - Multi-provider khai trong injector con không gộp với injector cha; lib phải tự đi từ injector gần nhất lên root (skipSelf) để
      tìm adapter/entity.
    - >-
      A-002 - sd-table server truyền PagingReq (filters, orders, pageSize, pageNumber) đủ để chuyển thẳng sang adapter.query, gồm cả
      external filter.
    - A-003 - sd-import-excel accept(items) trả SdImportExcelValidation[] đủ để báo kết quả từng dòng sau khi gọi create/update.
    - A-004 - sd-code-editor dùng được làm control (model/ControlValueAccessor) bên trong renderer form-generic cho field json.
    - A-005 - Khoá localStorage mặc định là sd-generic:configuration:<module>.<entity>; cấu hình chỉ có hiệu lực trên trình duyệt đó.
  redaction_applied: false
  approval:
    approved: false
    approved_at: null
    approval_source: explicit-user-choice
  change_control:
    revision: 1
    supersedes: null
    change_reason: null
```

## Problem & Goals

Các portal đang phải viết tay từng màn list/detail/create/update/import cho mỗi entity, dù màn nào cũng chỉ là CRUD trên một backend. Bản trước là `@omg-b2b/core-commerce` (lib-core-commerce, nhánh `development`, HEAD `02d1c81`). Bản này dựng được CRUD từ schema, nhưng có các vấn đề:

- Gắn chặt backend OMD: `returnType` kiểu Java, nhánh `if backend === 'CoreCommerce'`.
- Cấu hình bị lặp: `Property.hidden` lặp `list.hidden`, và mỗi nơi đọc một kiểu.
- Tiêu đề nằm ở ba chỗ, có `htmlTemplate` không escape.
- Phần cấu hình lưu được nhưng không chỗ nào đọc.

Mục tiêu là một module generic trong `@sdcorejs/angular`:

- **Không phụ thuộc backend.** Mỗi backend là một `module` (`tms`, `wms`…) và đăng ký một adapter qua DI.
- **Tự dựng màn hình** list, detail, create, update, import và màn chỉnh cấu hình từ một schema duy nhất `SdGenericSchema`.
- **Một nguồn cho dữ liệu field.** `general.properties` mô tả field; các section khác chỉ tham chiếu theo `key`.
- **Dùng lại component sẵn có:** `sd-table`, `form-generic` (`sd-form-render`/`sd-form-builder`), `sd-import-excel`, `sd-side-drawer` và `SdPermissionService`.

Thành công khi một portal chỉ cần khai adapter cùng `sdGenericRoutes()` là có đủ CRUD có phân quyền cho mọi entity của backend đó. Tuỳ biến theo entity bằng code qua `provideSdGenericEntity`, hoặc bằng cấu hình đã lưu qua `configuration.set`.

## Requirements

- R-001 - Entry point `@sdcorejs/angular/modules/generic`, không phụ thuộc backend.
  - Export runtime: `provideSdGeneric`, `provideSdGenericEntity`, `sdGenericRoutes`, `validateSdGenericSchema`.
  - Model chỉ export dạng type.
  - Nguồn: người dùng. Trạng thái: active. Chủ sở hữu: `sdcorejs-angular` / `modules/generic`.
- R-002 - Model `SdGenericSchema`, xem mục Architecture.
- R-003 - Model `SdGenericProperty` với 11 `dataType`. `multiple` thay cho `relation.type`.
- R-004 - Contract `SdGenericAdapter`: `schema`, `query`, `detail`, `create`, `update`, `delete`, cùng các hàm tuỳ chọn `search?`, `configuration?`, `display?`.
- R-005 - `provideSdGeneric` và `provideSdGenericEntity` gọi được nhiều lần; injector gần nhất thắng; trùng khai báo trong cùng một lần gọi là lỗi.
- R-006 - Schema hiệu lực qua 3 lớp: adapter → entity → cấu hình đã lưu. Mặc định lưu ở localStorage.
- R-007 - Luật merge giữa cấu hình đã lưu và schema hiện tại.
- R-008 - `validateSdGenericSchema`, và cách xử lý khi cấu hình không hợp lệ (lúc load và lúc lưu).
- R-009 - Tiêu đề theo từng section, template `${key}` có validate, render dạng text.
- R-010 - Route `generic/:module/:entity/...`. Form hiện dạng page hoặc side-drawer; side-drawer điều khiển bằng route.
- R-011 - Mã quyền `<MODULE>_<ENTITY>_C_GENERIC_*` kiểm tra qua `SdPermissionService`; có `permission: false`.
- R-012 - Màn list dùng `sd-table` server, có action sẵn và xoá nhiều dòng.
- R-013 - Detail/create/update dùng `sd-form-render`. Field được điền từ `general`. Relation có thứ tự fallback khi search.
- R-014 - `hooks.beforeSave` / `afterSave`.
- R-015 - Action mở rộng theo entity và `hiddenDefaults`.
- R-016 - Import qua `sd-import-excel`, có upsert theo `upsertKey`.
- R-017 - Màn chỉnh cấu hình 4 tab.
- R-018 - `form-generic` thêm field `time` và `json`, chỉ thêm mới.
- R-019 - Showcase demo với adapter mock, kèm tài liệu.
- R-020 - Rollout v19 → v20/v21/v22 và mục CHANGELOG, nhắm suffix `3.2`.

Nội dung đầy đủ và quan hệ của từng mục nằm trong `spec_context.decision_coverage` ở đầu file.

## Decisions

| ID | Câu hỏi | Lựa chọn (người dùng duyệt) |
|---|---|---|
| D-001 | Repo | `@sdcorejs/angular/modules/generic`, không phụ thuộc backend |
| D-002 | Ghép với form-generic | `general.properties` là nguồn duy nhất; layout `SdFormGenericSchema` tham chiếu theo `key`, thiếu thì tự sinh |
| D-003 | Tên gọi | `properties`, `adapter.detail`, `configuration: { get, set }`, `entity` |
| D-004 | Route | `generic/:module/:entity`, `/create`, `/:id/detail`, `/:id/update`, `/configuration` |
| D-005 | Page / side-drawer | Callback `display` ở entity rồi adapter, mặc định `'page'`, điều khiển bằng route |
| D-006 | Phạm vi | Làm hết một lần |
| D-007 | Provider | Gọi nhiều lần, injector gần nhất thắng, không dùng registry đọc router |
| D-008 | time / json | Thêm vào `form-generic` (`json` dùng `code-editor`) |
| D-009 | OneToMany | Chỉ multi-select; bỏ `relation.type` |
| D-010 | search / history | `search?` ở adapter và entity, fallback `query`; bỏ `history` |
| D-011 | Tuỳ biến entity | `provideSdGenericEntity`; `schema` là hàm `(base) => schema` |
| D-012 | Lưu cấu hình | `configuration.get/set(entity)`, mỗi entity một cấu hình, mặc định localStorage |
| D-013 | Cấu hình lỗi | Tự bỏ tham chiếu treo; lỗi shape thì dùng mặc định + `console.warn` + banner; lưu có lỗi thì chặn |
| D-014 | Tiêu đề | Theo từng section, template có validate, render dạng text |
| D-015 | Quyền | `<MODULE>_<ENTITY>_C_GENERIC_{LIST…CONFIGURATION}`, `SdPermissionService`, `permission: false` |
| D-016 | Import | Template, enum, relation `matchField`, upsert, tối đa 5 request song song, chỉ cần quyền IMPORT |
| D-017 | Test | TDD cho logic, viết test sau cho UI/Showcase |
| D-018 | Release | Suffix `3.2`, chỉ thêm mới; tag/publish cần người dùng cho phép riêng |

Mọi quyết định đều có trạng thái `approved` và nguồn `explicit-user` (hỏi đáp trong brainstorming ngày 2026-10-12–13).

## Assumptions

- A-001 - Multi-provider ở injector con không gộp với injector cha. Lib tự đi từ injector gần nhất lên root.
  - confirmed, độ tin cao, không chặn. Kiểm chứng bằng TDD AC-002.
- A-002 - `PagingReq` mà `sd-table` server phát ra đủ để chuyển thẳng sang `adapter.query`.
  - proposed, độ tin trung bình, không chặn.
  - Nếu sai: thêm lớp chuyển đổi trong module. Kiểm chứng: AC-013.
- A-003 - `sd-import-excel` `accept(items)` trả kết quả từng dòng, đủ dùng sau khi gọi create/update.
  - proposed, không chặn. Kiểm chứng: AC-019.
- A-004 - `sd-code-editor` dùng được làm control trong renderer `form-generic`.
  - proposed, không chặn.
  - Nếu sai: bọc thêm một adapter control. Kiểm chứng: AC-021.
- A-005 - Khoá localStorage mặc định là `sd-generic:configuration:<module>.<entity>`.
  - proposed, mặc định, không chặn. Người dùng duyệt khi duyệt spec.

## Architecture gate classification

- Status: **required**.
- Signals: `conflicting-independent-unit-decisions`, `persisted-data-model-contract`, `public-api-contract`, `state-data-ownership`.
- Rationale:
  - Thêm một public entry point mới: adapter contract, provider, route, `validateSdGenericSchema`.
  - Thêm schema JSON mà consumer lưu trữ qua `configuration.set`.
  - Phải chốt chủ sở hữu cấu hình (adapter hay localStorage) và luật merge với schema backend.
  - List, form, import và màn chỉnh cấu hình là các đơn vị độc lập nhưng phải dùng chung một bộ tra adapter, dựng schema và mã quyền.

Vì vậy, sau khi spec được duyệt phải qua `sdcorejs-architecture` rồi mới tới `sdcorejs-plan`.

## Non-goals

- Lịch sử thay đổi (history/audit log) của bản ghi. Mỗi dự án tự làm, ví dụ qua `detailActions`.
- Bảng con cho quan hệ OneToMany. Chỉ hỗ trợ multi-select.
- Nhiều cấu hình cho cùng một entity, id cấu hình riêng, menu builder.
- Adapter cho backend cụ thể (core-commerce, tms, cdp…). Các adapter này nằm ở repo của dự án.
- Import xử lý phía backend (task, polling, upload history) như `core-import` cũ.
- Tag `v3.2` và publish npm. Việc này theo release ritual và cần người dùng cho phép riêng.

## Architecture

### Schema (public, consumer lưu trữ)

```ts
interface SdGenericSchema {
  version: 1;
  module: string;
  entity: string;
  general: { label: string; primaryKey?: string /* mặc định 'id' */; properties: SdGenericProperty[] };
  list?: {
    title?: string;
    columns?: { key: string; width?: number; visible?: boolean; sortable?: boolean; filterable?: boolean }[];
    externalFilters?: { key: string; operator?: Operator; default?: unknown; required?: boolean }[];
    orders?: Order[];
    pageSize?: number; // mặc định 20
    export?: boolean;
  };
  detail?: { title?: string; form?: SdFormGenericSchema };
  create?: { title?: string; form?: SdFormGenericSchema }; // form vắng → detail.form → tự sinh
  update?: { title?: string; form?: SdFormGenericSchema };
  import?: { columns?: { key: string; matchField?: string }[]; upsertKey?: string };
}

interface SdGenericProperty {
  key: string;
  label: string;
  dataType: 'string' | 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'time' | 'enum' | 'relation' | 'json' | 'file';
  multiple?: boolean;
  format?: 'email' | 'phone' | 'url' | 'password' | 'integer' | 'decimal' | 'currency' | 'percent';
  enums?: { value: string; label: string; color?: string; icon?: string }[];
  relation?: { module?: string; entity: string; valueField?: string; displayField?: string; display?: string; searchFields?: string[] };
  validation?: { required?: boolean; min?: number; max?: number; minLength?: number; maxLength?: number; pattern?: string };
  defaultValue?: unknown;
  insertable?: boolean; // mặc định true
  updatable?: boolean; // mặc định true
  system?: boolean;
}
```

`Operator`, `Order`, `Filter`, `PagingReq` và `PagingRes` lấy từ `@sdcorejs/utils/models`.

**Map `dataType` sang component**

| `dataType` | Cột `sd-table` | Field `form-generic` |
|---|---|---|
| string | string | textfield (`subtype` = `format`); `multiple` → chip-string |
| text | string | textarea |
| number | number | number (`subtype` = `format`) |
| boolean | boolean | checkbox |
| date / datetime | date / datetime | datetime (`subtype`) |
| time | time | time (mới) |
| enum | values (badge theo `color`/`icon`) | select, `options` tĩnh |
| relation | lazy-values | select + catalog do lib đăng ký |
| json | không có cột mặc định | json (mới, dùng `code-editor`) |
| file | không có cột mặc định | upload |

### Adapter, provider và cách tra cứu

```ts
interface SdGenericAdapter {
  module: string;
  schema(entity: string): Promise<SdGenericSchema>;
  query(entity: string, req: PagingReq): Promise<PagingRes>;
  detail(entity: string, id: string): Promise<Record<string, unknown>>;
  create(entity: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  update(entity: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  delete(entity: string, id: string): Promise<void>;
  search?(entity: string, req: SdGenericSearchReq): Promise<Record<string, unknown>[]>;
  configuration?: { get(entity: string): Promise<SdGenericSchema | null>; set(entity: string, schema: SdGenericSchema): Promise<void> };
  display?(args: { schema: SdGenericSchema; action: 'create' | 'update' | 'detail' }): 'page' | 'side-drawer';
}
// SdGenericSearchReq = { term?, values?, fields, valueField, filters?, limit? }
```

- `provideSdGeneric({ adapters: (Type<SdGenericAdapter> | SdGenericAdapter)[], permission?: boolean })`.
- `provideSdGenericEntity({ module, entity, schema?, search?, display?, hooks?, listActions?, rowCommands?, bulkActions?, detailActions?, hiddenDefaults? })`.
- **Cách tra cứu.** Mỗi provider đăng ký vào một registry thuộc injector của chính nó. Khi tra theo `module` (hoặc `module + entity`), lib tìm ở registry gần nhất trước, rồi đi tiếp lên registry cha bằng `skipSelf`. Bản gần nhất thắng.
- **Đặt route.** Route generic phải nằm trong cây route của lazy module đã provide adapter, hoặc adapter phải provide ở root.

### Dựng schema hiệu lực

1. `adapter.schema(entity)` cho schema gốc.
2. `provideSdGenericEntity.schema(base)`, nếu có, chỉnh lại. Kết quả là **cấu hình mặc định**.
3. `configuration.get(entity)`. Adapter không khai thì đọc localStorage `sd-generic:configuration:<module>.<entity>`.
   - `null`: dùng cấu hình mặc định.
   - Khác `null`: `validateSdGenericSchema(stored, default)`.
     - Lỗi shape hoặc `version`: dùng mặc định, `console.warn`, hiện banner cho người có quyền CONFIGURATION.
     - Hợp lệ: merge theo R-007, các tham chiếu treo tự bị bỏ.

`validateSdGenericSchema` là hàm thuần, trả `{ path, code, severity }[]`. Cả màn chỉnh cấu hình (chặn lưu khi có lỗi) lẫn bước load đều dùng hàm này.

### Màn hình và route

`sdGenericRoutes()` trả cây route sau:

```
generic/:module/:entity             → trang list (sd-table)
  create | :id/detail | :id/update  → route con: host form, hiện dạng page hoặc side-drawer theo display
generic/:module/:entity/configuration → màn chỉnh cấu hình
```

- **Side-drawer.** Route con render `sd-side-drawer` trong outlet của trang list. List giữ filter/trang; back thì đóng drawer.
- **Page.** Trang list ẩn đi khi route con đang hoạt động.
- Lưu thành công thì quay về list và list reload.
- **Quyền.** Mỗi route có guard theo mã `<MODULE>_<ENTITY>_C_GENERIC_*` (`module` và `entity` viết hoa). Action ẩn hay hiện theo cùng mã đó.
- **Form.**
  - Layout chọn theo thứ tự `section.form` → `detail.form` → tự sinh.
  - Mỗi field trong layout được điền type/label/options/validation từ `general` theo `key`.
  - Catalog relation đăng ký theo id `<module>.<entity>` và gọi search theo thứ tự entity → adapter → `query`.
- **Import.** Dùng `sd-import-excel`; `accept(items)` thực hiện upsert với tối đa 5 request song song.
- **Màn chỉnh cấu hình.** Có 4 tab; tab Form nhúng `sd-form-builder`, `templates` sinh từ properties.

### Mở rộng form-generic

Thêm `SdFormGenericTime` (`type: 'time'`, giá trị chuỗi `HH:mm`) và `SdFormGenericJson` (`type: 'json'`, dùng `code-editor`) vào union `SdFormGenericField`, kèm renderer, palette builder và validation. Phần này chỉ thêm mới. Docs `sd-form-generic.md` được cập nhật.

### i18n

Nhãn cố định của module (nút, banner, tab, xác nhận xoá) đi qua i18n sẵn có (`sdTranslate`), có bản vi/en/ja như các module khác.

## Stack profile and technology assumptions

- Track: `angular`.
- Stack profile: `core-ui-angular`, độ tin cao.
- Profile evidence: repo nguồn của `@sdcorejs/angular`, workspace `versions/v19` (canonical), Showcase ở root, entry point `modules/*` dùng ng-packagr secondary entry.
- Technology assumptions:
  - Angular 19 standalone, signals.
  - Jasmine/Karma (`ChromeHeadlessCI`, `--code-coverage`).
  - `@sdcorejs/utils` cho `PagingReq`/`Filter`.
  - Không thêm dependency mới.
  - Node `22.22.3` cho install/build.

## File structure

Đường dẫn gốc là `versions/v19/projects/sdcorejs-angular`, sau đó sync sang v20/v21/v22. Plan sẽ liệt kê đường dẫn chính xác.

- `modules/generic/index.ts`, `ng-package.json`, `sd-generic.md`: tạo entry point mới cùng tài liệu.
- `modules/generic/src/models/`: tạo `SdGenericSchema`, `SdGenericProperty`, `SdGenericAdapter`, action, hook, issue.
- `modules/generic/src/configurations/`: tạo `provideSdGeneric`, `provideSdGenericEntity`, các registry token.
- `modules/generic/src/services/`: tạo phần tra adapter/entity, dựng schema, merge, validate, template tiêu đề, mã quyền, search fallback, import upsert, lưu cấu hình localStorage.
- `modules/generic/src/routes/`: tạo `sdGenericRoutes` và guard quyền.
- `modules/generic/src/pages/`: tạo các trang list, form host (page/drawer) và configuration.
- `modules/generic/src/components/`: tạo các phần con của màn chỉnh cấu hình và banner cấu hình lỗi.
- `modules/generic/src/**/*.spec.ts` và `src/public-api.spec.ts`: tạo test.
- `modules/index.ts`: sửa, thêm export `@sdcorejs/angular/modules/generic` theo đúng barrel hiện có.
- `components/form-generic/src/models/form-generic-field.model.ts`, `components/form-render/components/item/components/{time,json}/`, builder palette/presets, `sd-form-generic.md`: sửa để thêm `time` và `json`.
- `i18n/src/{en,ja}.ts`, `i18n.messages.ts`: sửa, thêm nhãn của module generic.
- `showcase/src/app/pages/**/generic-demo*`, registry docs và các file example sinh ra: tạo/sửa trang demo cùng adapter mock.
- `CHANGELOG.md`: sửa, thêm mục Unreleased.
- `versions/v20|v21|v22/**`: các bản mirror do `npm run sync` sinh ra.

## Acceptance criteria

Mọi tiêu chí đều kiểm bằng test tự động. Không có tiêu chí thủ công hay cần chụp màn hình.

- AC-001 - Mở `generic/tms/order` khi `configuration.get` trả `null` → list hiện cột sinh từ properties (trừ json/file); dữ liệu lấy qua `adapter.query` với pageSize 20.
- AC-002 - Module `tms` khai ở cả root lẫn lazy route → trong lazy route dùng adapter của lazy route; ngoài lazy route dùng adapter root.
- AC-003 - Hai adapter cùng module trong một lần gọi `provideSdGeneric` → ném lỗi nêu tên module bị trùng.
- AC-004 - `provideSdGenericEntity.schema` và cấu hình đã lưu cùng đổi label → schema hiệu lực có cả hai thay đổi. Khi `get` trả `null` thì chỉ có thay đổi của entity.
- AC-005 - Adapter không khai `configuration` → cấu hình lưu và đọc lại từ localStorage theo module/entity.
- AC-006 - Cấu hình đã lưu có tham chiếu treo, còn BE có property mới → tham chiếu treo bị bỏ, trang vẫn chạy. Property mới có trong `general` và trong `list.columns` với `visible: false`, không có trong layout đã lưu. `dataType` lấy từ BE.
- AC-007 - `get` trả object sai shape hoặc `version` lạ → dùng cấu hình mặc định, gọi `console.warn`; banner chỉ hiện với người có quyền CONFIGURATION.
- AC-008 - `validateSdGenericSchema` gặp key trùng, `upsertKey` là property `multiple`, field update không `updatable`, field sai type → trả issue có `path`/`code` cho từng lỗi.
- AC-009 - `update.title` chứa `${unknown}` và `list.title` chứa placeholder → cả hai báo lỗi. `detail.title` chứa `<b>` → render ra text, không thành HTML.
- AC-010 - Thiếu quyền `TMS_ORDER_C_GENERIC_CREATE` → nút tạo mới bị ẩn và route `create` bị chặn. Với `permission: false` thì nút hiện và route mở được.
- AC-011 - `display` = `'side-drawer'`, mở `/1/detail` rồi back → drawer mở đè lên list; back đóng drawer, list giữ filter/trang.
- AC-012 - Không khai `display`, mở `/1/update` → form hiện dạng trang đầy đủ; lưu xong quay về list và list reload.
- AC-013 - Có cột `visible: false`, `orders` mặc định và external filter có `default` → cột ẩn nhưng có trong cài đặt cột; request mang đúng orders/filters.
- AC-014 - Xoá 1 dòng, rồi xoá 3 dòng đã chọn → mỗi lần đều có hộp xác nhận; `delete` gọi 1 lần, rồi 3 lần tuần tự; list reload.
- AC-015 - Layout tự sinh với property `system` và property `updatable: false` → create không có `system`; update không có cả hai loại và payload không chứa chúng; detail ở chế độ viewed và có `system`; label/type/options lấy từ `general`.
- AC-016 - Relation select → gọi search theo thứ tự entity → adapter → `query` (CONTAIN); nhãn của giá trị đã chọn lấy qua IN trên `valueField`.
- AC-017 - `beforeSave` sửa payload → adapter nhận payload đã sửa. `afterSave` chạy đúng một lần khi lưu thành công và không chạy khi lưu lỗi.
- AC-018 - `rowCommands` có `permission`/`visible`, cùng `hiddenDefaults: ['delete']` → command chỉ hiện khi đủ điều kiện; `run` nhận `ctx` có `row` và `reload`; delete có sẵn bị ẩn.
- AC-019 - Import 3 dòng, `upsertKey = code` (1 dòng đã tồn tại), có ô enum ghi bằng label và ô relation ghi theo `displayField` → 1 update và 2 create; enum/relation được đổi đúng; tối đa 5 request song song; kết quả từng dòng hiện trong `sd-import-excel`.
- AC-020 - Màn chỉnh cấu hình: lưu khi có lỗi bị chặn; lưu khi hợp lệ gọi `configuration.set(entity, schema)`; `key`/`dataType` không sửa được.
- AC-021 - Field `time` và `json`: `'25:00'` và JSON sai đều báo lỗi; giá trị đúng được lưu đúng kiểu; builder có cả hai trong palette; spec form-generic cũ vẫn xanh.
- AC-022 - Trang demo Showcase hiện list từ adapter mock, mở được create/detail; guard example/registry của Showcase xanh.
- AC-023 - `npm run sync` rồi `npm run check:sync` xanh; bốn workspace v19–v22 build không lỗi; CHANGELOG có mục Unreleased.
- AC-024 - Spec public-api xác nhận entry point export đúng 4 symbol runtime và không import package riêng của backend nào.

## Risks & mitigations

- **Rủi ro:** phạm vi lớn trong một lần giao. → **Giảm thiểu:** plan chia thành các đơn vị độc lập (lõi model/provider/resolver; list; form; import; màn chỉnh cấu hình; form-generic time/json; Showcase/docs; rollout). Đơn vị nào cũng có test riêng. Lõi làm trước để các đơn vị sau không tự quyết khác nhau.
- **Rủi ro:** side-drawer theo route phụ thuộc `display` lúc chạy, nên có thể nháy giữa page và drawer. → **Giảm thiểu:** chỉ render route con sau khi schema hiệu lực đã resolve xong; có test AC-011/AC-012.
- **Rủi ro:** mở rộng public API của `form-generic`. → **Giảm thiểu:** chỉ thêm member mới vào union, có review naming/API consistency, đối chiếu field `datetime`/`textarea` hiện có.
- **Rủi ro:** cấu hình mặc định ở localStorage chỉ theo từng trình duyệt. → **Giảm thiểu:** ghi rõ trong `sd-generic.md` rằng triển khai thật phải khai `configuration` ở adapter.
- **Rủi ro:** Guard demo-section/example của Showcase. → **Giảm thiểu:** plan liệt kê manifest/registry/spec đếm, chạy `npm run test:showcase-examples`.
- **Rủi ro:** rollout bốn line, và sync trên checkout CRLF làm bẩn v22. → **Giảm thiểu:** `npm run sync` + `check:sync`; khôi phục các file v22 chỉ khác EOL trước khi commit.
- **Rủi ro:** XSS qua template. → **Giảm thiểu:** tiêu đề chỉ render text; không có `htmlTemplate`.

## Out of scope (deferred)

- History/audit log trong lib: để sau, khi có hai dự án trở lên cần cùng một contract history.
- Bảng con OneToMany: để sau, khi có entity thật cần thêm/sửa con ngay trong detail.
- Nhiều cấu hình cho một entity (menu builder): để sau, khi cần nhiều màn khác nhau cho cùng entity.
- Import xử lý phía backend (task/polling): để sau, khi file vượt khả năng xử lý phía client.
- Tag `v3.2` và publish: sau khi PR được merge và người dùng cho phép.
