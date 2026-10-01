# Spec - Form generic schema v1 — Đợt 1: nền (bản sửa 2) - 2026-09-30 22:46

```yaml
spec_context:
  source: sdcorejs-spec
  decision_coverage:
    schema_version: 1
    revision: 4
    records:
      - id: R-001
        type: requirement
        statement: >-
          Schema gốc SdFormGenericSchema là phiên bản đầu tiên (không schemaVersion, không chuyển đổi từ SdFormGeneric cũ) theo ngữ pháp cố
          định Form → pages → group → element; phần tử phân loại bằng `type`; chừa sẵn shape cho static/button (đợt 2) và tabs/steps/table
          (đợt 3).
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs:
          - TASK-002
          - TASK-003
          - TASK-018
          - TASK-022
      - id: R-002
        type: requirement
        statement: >-
          Bố cục responsive layout.span { desktop, tablet, mobile } (1–12) + newRow, theo SD_FORM_GENERIC_BREAKPOINTS = { tablet: 600,
          desktop: 1024 } đo trên bề rộng form; mặc định desktop 12, tablet theo desktop, mobile 12; ghi đè breakpoint qua provider; bỏ phần
          tử break.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs:
          - TASK-004
          - TASK-005
          - TASK-016
          - TASK-020
      - id: R-003
        type: requirement
        statement: >-
          Điều kiện rules { visible, hidden, disabled, required } lưu bằng Filter của @sdcorejs/utils và đánh giá bằng
          FilterUtilities.evaluate trên giá trị form + biến; validation cấp form dùng Filter hoặc hàm đăng ký ở portal.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-008
          - TASK-009
          - TASK-016
          - TASK-019
      - id: R-004
        type: requirement
        statement: >-
          Validation của field chuẩn hoá { required, min, max, minLength, maxLength, pattern { value, message }, maxItems, phoneCountry };
          giữ nguyên các preset text (email, phone, url, password) và number (integer, decimal, currency, percent) cùng kiểm tra của chúng.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs:
          - TASK-003
          - TASK-015
          - TASK-017
      - id: R-005
        type: requirement
        statement: >-
          Nguồn lựa chọn options = { source: static, items } | { source: catalog, catalog, params, fill } với SdFormGenericValueRef có cấu
          trúc; multiple là thuộc tính field; portal đăng ký catalog { id, label, params, fields, load, search? }.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs:
          - TASK-003
          - TASK-006
          - TASK-007
          - TASK-012
          - TASK-013
          - TASK-017
          - TASK-019
      - id: R-006
        type: requirement
        statement: >-
          Cấu hình portal gom về provideSdFormGeneric({ catalogs, templates, htmlDefinitions, validators, breakpoints }) thay cho
          SD_FORM_GENERIC_CONFIGURATION.form cũ.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs:
          - TASK-012
          - TASK-013
          - TASK-014
      - id: R-007
        type: requirement
        statement: >-
          sd-form-render có API [schema], [(value)] (model, không mutate input), [form], [variables], [viewed], [breakpoint],
          [labelPlacement], [keys]; method validate() trả { valid, messages } và upload(); defaultValue khai báo theo field.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-009
          - TASK-016
          - TASK-017
      - id: R-008
        type: requirement
        statement: >-
          sd-form-builder có API [(schema)], thiết kế trên schema mới ngang tính năng hiện có cho các field và group; chế độ Desktop |
          Tablet | Mobile sửa span của mức đang xem, hiển thị mức kế thừa, newRow thay cho ngắt dòng; Xem trước dùng renderer với
          [breakpoint] ép mức.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs:
          - TASK-018
          - TASK-019
          - TASK-020
          - TASK-024
      - id: R-009
        type: requirement
        statement: >-
          Giữ đủ chức năng hiện có trên model mới: biến, validation cấp form, templates, HTML definitions (biến, truy vấn), upload (loại,
          nguồn, định dạng, số file, dung lượng, tham số), hyperlink khi chỉ xem, labelPlacement, viewed, SdFormRenderService.viewEntities,
          đổi mã có cập nhật tham chiếu có cấu trúc.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs:
          - TASK-008
          - TASK-009
          - TASK-010
          - TASK-011
          - TASK-014
          - TASK-017
          - TASK-019
      - id: R-010
        type: requirement
        statement: >-
          Bỏ sd-feel-expression, model expression cũ và phần tử break; CHANGELOG ghi mục BREAKING có ví dụ trước/sau; sd-form-generic.md
          viết lại cho schema mới; showcase chạy trên schema mới; i18n đủ 5 ngôn ngữ.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs:
          - TASK-021
          - TASK-022
          - TASK-023
          - TASK-024
      - id: R-011
        type: requirement
        statement: >-
          Kiểm chứng: TDD cho phần logic, test sau cho giao diện bằng kiểm tra DOM tự động (ảnh chụp thật chỉ là UAT tùy chọn, không phải
          bằng chứng của gate); full suite v19 có coverage, lint, check:i18n, check:i18n-parity, check:scss-hex xanh; rollout v20/v21/v22
          bằng npm run sync, check:sync xanh và v22 giữ LF (kiểm bằng lệnh tự động).
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs:
          - TASK-001
          - TASK-024
          - TASK-025
          - TASK-026
      - id: AC-001
        type: acceptance-criterion
        statement: >-
          Builder phát (schemaChange) sau một thay đổi của người dùng → JSON là SdFormGenericSchema hợp lệ: có pages, không có
          schemaVersion, không có phần tử break, mọi phần tử có id, field có key duy nhất
        behavior: Builder phát (schemaChange) sau một thay đổi của người dùng
        expected_result: >-
          JSON là SdFormGenericSchema hợp lệ: có pages, không có schemaVersion, không có phần tử break, mọi phần tử có id, field có key duy
          nhất
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-001
        task_refs:
          - TASK-002
          - TASK-003
          - TASK-018
          - TASK-020
          - TASK-022
        evidence_refs:
          - EVIDENCE-002
          - EVIDENCE-003
          - EVIDENCE-018
          - EVIDENCE-020
          - EVIDENCE-022
      - id: AC-002
        type: acceptance-criterion
        statement: >-
          Renderer hiển thị field span { desktop: 6 } ở bề rộng form 1100px, 800px và 480px → Hai field/hàng ở 1100px và 800px (tablet kế
          thừa desktop); xếp chồng ở 480px (mobile mặc định 12)
        behavior: 'Renderer hiển thị field span { desktop: 6 } ở bề rộng form 1100px, 800px và 480px'
        expected_result: Hai field/hàng ở 1100px và 800px (tablet kế thừa desktop); xếp chồng ở 480px (mobile mặc định 12)
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-002
        task_refs:
          - TASK-004
          - TASK-005
          - TASK-016
        evidence_refs:
          - EVIDENCE-004
          - EVIDENCE-005
          - EVIDENCE-016
      - id: AC-003
        type: acceptance-criterion
        statement: >-
          Portal ghi đè breakpoints { tablet: 700 } rồi render form rộng 650px → Form dùng mức mobile; các giá trị không ghi đè giữ mặc định
          SD_FORM_GENERIC_BREAKPOINTS
        behavior: 'Portal ghi đè breakpoints { tablet: 700 } rồi render form rộng 650px'
        expected_result: Form dùng mức mobile; các giá trị không ghi đè giữ mặc định SD_FORM_GENERIC_BREAKPOINTS
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-002
        task_refs:
          - TASK-004
          - TASK-005
          - TASK-012
          - TASK-013
          - TASK-016
        evidence_refs:
          - EVIDENCE-004
          - EVIDENCE-005
          - EVIDENCE-012
          - EVIDENCE-013
          - EVIDENCE-016
      - id: AC-004
        type: acceptance-criterion
        statement: >-
          Một field có layout.newRow: true đứng sau field span 4 trong cùng group → Field đó bắt đầu hàng mới dù hàng trước còn chỗ; canvas
          và renderer xếp giống nhau
        behavior: 'Một field có layout.newRow: true đứng sau field span 4 trong cùng group'
        expected_result: Field đó bắt đầu hàng mới dù hàng trước còn chỗ; canvas và renderer xếp giống nhau
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-002
        task_refs:
          - TASK-004
          - TASK-005
          - TASK-018
        evidence_refs:
          - EVIDENCE-004
          - EVIDENCE-005
          - EVIDENCE-018
      - id: AC-005
        type: acceptance-criterion
        statement: >-
          Field có rules.visible là Filter { field: agree, operator: EQUAL, data: true }, rules.required dựa trên field khác và
          rules.disabled dựa trên biến → Ẩn/hiện, bắt buộc và vô hiệu đổi theo giá trị và biến ngay khi chúng thay đổi; field ẩn không bị
          kiểm tra; Filter ngày tương đối được hỗ trợ
        behavior: >-
          Field có rules.visible là Filter { field: agree, operator: EQUAL, data: true }, rules.required dựa trên field khác và
          rules.disabled dựa trên biến
        expected_result: >-
          Ẩn/hiện, bắt buộc và vô hiệu đổi theo giá trị và biến ngay khi chúng thay đổi; field ẩn không bị kiểm tra; Filter ngày tương đối
          được hỗ trợ
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-003
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-016
          - TASK-019
        evidence_refs:
          - EVIDENCE-006
          - EVIDENCE-007
          - EVIDENCE-016
          - EVIDENCE-019
      - id: AC-006
        type: acceptance-criterion
        statement: >-
          Gọi validate() khi có validation cấp form (Filter, alert error và warning) và một validator hàm đăng ký ở portal → Trả { valid,
          messages: { error[], warning[] } } — không bao giờ undefined; validator hàm nhận giá trị form; lỗi error làm valid = false
        behavior: Gọi validate() khi có validation cấp form (Filter, alert error và warning) và một validator hàm đăng ký ở portal
        expected_result: >-
          Trả { valid, messages: { error[], warning[] } } — không bao giờ undefined; validator hàm nhận giá trị form; lỗi error làm valid =
          false
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-003
          - R-007
        task_refs:
          - TASK-008
          - TASK-009
          - TASK-016
        evidence_refs:
          - EVIDENCE-008
          - EVIDENCE-009
          - EVIDENCE-016
      - id: AC-007
        type: acceptance-criterion
        statement: >-
          Nhập giá trị sai cho các preset email, phone (VN và quốc tế), url, integer, decimal, currency, percent và các ràng buộc
          minLength/maxLength/pattern/maxItems → Mỗi trường báo đúng lỗi như bản hiện tại; password không bao giờ nhận defaultValue và hiển
          thị mặt nạ khi chỉ xem
        behavior: >-
          Nhập giá trị sai cho các preset email, phone (VN và quốc tế), url, integer, decimal, currency, percent và các ràng buộc
          minLength/maxLength/pattern/maxItems
        expected_result: Mỗi trường báo đúng lỗi như bản hiện tại; password không bao giờ nhận defaultValue và hiển thị mặt nạ khi chỉ xem
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-004
        task_refs:
          - TASK-015
          - TASK-017
        evidence_refs:
          - EVIDENCE-015
          - EVIDENCE-017
      - id: AC-008
        type: acceptance-criterion
        statement: >-
          Select dùng options catalog với params [{ name: provinceId, value: { field: city } }] và fill [{ field: note, from: name }] →
          load() nhận params đã giải tham chiếu; đổi city thì tải lại danh mục; chọn một mục thì điền note; catalog có search thì tìm theo
          từ khoá; options static hiển thị items đúng thứ tự
        behavior: 'Select dùng options catalog với params [{ name: provinceId, value: { field: city } }] và fill [{ field: note, from: name }]'
        expected_result: >-
          load() nhận params đã giải tham chiếu; đổi city thì tải lại danh mục; chọn một mục thì điền note; catalog có search thì tìm theo
          từ khoá; options static hiển thị items đúng thứ tự
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-005
          - R-006
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-012
          - TASK-013
          - TASK-017
        evidence_refs:
          - EVIDENCE-006
          - EVIDENCE-007
          - EVIDENCE-012
          - EVIDENCE-013
          - EVIDENCE-017
      - id: AC-009
        type: acceptance-criterion
        statement: >-
          Truyền [(value)] là object đã deep-freeze cùng schema có defaultValue rồi nhập dữ liệu → Không lỗi, input không bị sửa;
          valueChange phát object mới; defaultValue chỉ áp cho key chưa có giá trị và không áp ở chế độ chỉ xem
        behavior: Truyền [(value)] là object đã deep-freeze cùng schema có defaultValue rồi nhập dữ liệu
        expected_result: >-
          Không lỗi, input không bị sửa; valueChange phát object mới; defaultValue chỉ áp cho key chưa có giá trị và không áp ở chế độ chỉ
          xem
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-007
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-016
        evidence_refs:
          - EVIDENCE-006
          - EVIDENCE-007
          - EVIDENCE-016
      - id: AC-010
        type: acceptance-criterion
        statement: >-
          Đặt [breakpoint]="mobile" cho renderer đang rộng 1200px, rồi đặt lại null → Bố cục dùng span mobile khi ép; khi null quay về mức
          đo theo bề rộng form
        behavior: Đặt [breakpoint]="mobile" cho renderer đang rộng 1200px, rồi đặt lại null
        expected_result: Bố cục dùng span mobile khi ép; khi null quay về mức đo theo bề rộng form
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-007
        task_refs:
          - TASK-004
          - TASK-005
          - TASK-016
        evidence_refs:
          - EVIDENCE-004
          - EVIDENCE-005
          - EVIDENCE-016
      - id: AC-011
        type: acceptance-criterion
        statement: >-
          Gọi upload() khi field upload có tệp chờ và có params tham chiếu field khác → Các tệp được tải lên với tham số đã giải tham chiếu
          và value nhận kết quả
        behavior: Gọi upload() khi field upload có tệp chờ và có params tham chiếu field khác
        expected_result: Các tệp được tải lên với tham số đã giải tham chiếu và value nhận kết quả
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-007
          - R-009
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-016
          - TASK-017
        evidence_refs:
          - EVIDENCE-006
          - EVIDENCE-007
          - EVIDENCE-016
          - EVIDENCE-017
      - id: AC-012
        type: acceptance-criterion
        statement: >-
          Trong builder chuyển sang Tablet và kéo resize một field từ 6 xuống 4, rồi xoá giá trị tablet ở inspector → Chỉ span.tablet đổi;
          desktop/mobile giữ nguyên; mức kế thừa hiện nhãn "Theo Desktop"; xoá thì quay về kế thừa
        behavior: Trong builder chuyển sang Tablet và kéo resize một field từ 6 xuống 4, rồi xoá giá trị tablet ở inspector
        expected_result: Chỉ span.tablet đổi; desktop/mobile giữ nguyên; mức kế thừa hiện nhãn "Theo Desktop"; xoá thì quay về kế thừa
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-008
        task_refs:
          - TASK-004
          - TASK-005
          - TASK-018
          - TASK-020
        evidence_refs:
          - EVIDENCE-004
          - EVIDENCE-005
          - EVIDENCE-018
          - EVIDENCE-020
      - id: AC-013
        type: acceptance-criterion
        statement: >-
          Builder nhận lại đúng schema vừa phát ([(schema)] vòng về) rồi nhận một schema khác nội dung → Vòng về không reset lịch sử
          undo/selection; schema khác nội dung nạp lại và reset lịch sử
        behavior: Builder nhận lại đúng schema vừa phát ([(schema)] vòng về) rồi nhận một schema khác nội dung
        expected_result: Vòng về không reset lịch sử undo/selection; schema khác nội dung nạp lại và reset lịch sử
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-008
        task_refs:
          - TASK-002
          - TASK-003
          - TASK-018
          - TASK-020
        evidence_refs:
          - EVIDENCE-002
          - EVIDENCE-003
          - EVIDENCE-018
          - EVIDENCE-020
      - id: AC-014
        type: acceptance-criterion
        statement: >-
          Bật "Bắt đầu hàng mới" ở tab Bố cục của một field và dùng Xem trước ở cả 3 mức → Canvas và Xem trước xếp hàng giống nhau ở từng
          mức; Xem trước ép đúng mức đang chọn
        behavior: Bật "Bắt đầu hàng mới" ở tab Bố cục của một field và dùng Xem trước ở cả 3 mức
        expected_result: Canvas và Xem trước xếp hàng giống nhau ở từng mức; Xem trước ép đúng mức đang chọn
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-008
        task_refs:
          - TASK-004
          - TASK-005
          - TASK-020
        evidence_refs:
          - EVIDENCE-004
          - EVIDENCE-005
          - EVIDENCE-020
      - id: AC-015
        type: acceptance-criterion
        statement: >-
          Đổi mã một field được tham chiếu trong rules (Filter field và so sánh field–field), options.params, options.fill, upload params,
          html query và validation cấp form → Mọi tham chiếu có cấu trúc chuyển sang mã mới; tham chiếu trong chuỗi tự do (hyperlink, nội
          dung HTML) giữ nguyên và được đếm trong câu xác nhận
        behavior: >-
          Đổi mã một field được tham chiếu trong rules (Filter field và so sánh field–field), options.params, options.fill, upload params,
          html query và validation cấp form
        expected_result: >-
          Mọi tham chiếu có cấu trúc chuyển sang mã mới; tham chiếu trong chuỗi tự do (hyperlink, nội dung HTML) giữ nguyên và được đếm
          trong câu xác nhận
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-009
        task_refs:
          - TASK-008
          - TASK-009
          - TASK-019
          - TASK-020
        evidence_refs:
          - EVIDENCE-008
          - EVIDENCE-009
          - EVIDENCE-019
          - EVIDENCE-020
      - id: AC-016
        type: acceptance-criterion
        statement: >-
          Gọi SdFormRenderService.viewEntities(schema, entities) → Trả giá trị hiển thị theo từng field (nhãn lựa chọn, ngày, số theo
          preset) giống bản hiện tại
        behavior: Gọi SdFormRenderService.viewEntities(schema, entities)
        expected_result: Trả giá trị hiển thị theo từng field (nhãn lựa chọn, ngày, số theo preset) giống bản hiện tại
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-009
        task_refs:
          - TASK-010
          - TASK-011
          - TASK-014
        evidence_refs:
          - EVIDENCE-010
          - EVIDENCE-011
          - EVIDENCE-014
      - id: AC-017
        type: acceptance-criterion
        statement: >-
          Chạy public-api.spec.ts và lệnh kiểm tài liệu tự động (lấy danh sách export runtime và export đã bỏ từ public-api.spec.ts) → Entry
          chỉ còn đúng bề mặt runtime của hợp đồng v1; SdFeelExpression và các export cũ không còn; CHANGELOG [Unreleased] có mục BREAKING
          nhắc từng export đã bỏ kèm ví dụ trước/sau; sd-form-generic.md nhắc mọi export runtime
        behavior: Chạy public-api.spec.ts và lệnh kiểm tài liệu tự động (lấy danh sách export runtime và export đã bỏ từ public-api.spec.ts)
        expected_result: >-
          Entry chỉ còn đúng bề mặt runtime của hợp đồng v1; SdFeelExpression và các export cũ không còn; CHANGELOG [Unreleased] có mục
          BREAKING nhắc từng export đã bỏ kèm ví dụ trước/sau; sd-form-generic.md nhắc mọi export runtime
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-010
        task_refs:
          - TASK-022
          - TASK-023
        evidence_refs:
          - EVIDENCE-022
          - EVIDENCE-023
      - id: AC-018
        type: acceptance-criterion
        statement: >-
          Chạy full suite v19 có coverage, lint, check:i18n, check:i18n-parity, check:scss-hex, rồi npm run sync và check:sync → Tất cả
          xanh; v22 giữ LF
        behavior: Chạy full suite v19 có coverage, lint, check:i18n, check:i18n-parity, check:scss-hex, rồi npm run sync và check:sync
        expected_result: Tất cả xanh; v22 giữ LF
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-011
        task_refs:
          - TASK-025
          - TASK-026
        evidence_refs:
          - EVIDENCE-025
          - EVIDENCE-026
      - id: AC-019
        type: acceptance-criterion
        statement: >-
          Chạy test component tự động: sd-form-builder ở chế độ Desktop/Tablet/Mobile, sd-form-render ở bề rộng form 1100px, 800px và 480px,
          và test của demo showcase → DOM cho thấy span đúng theo mức, nhãn kế thừa "Theo Desktop"/"Mặc định", field newRow bắt đầu hàng
          mới, demo showcase chạy trên API mới và không có lỗi console; ảnh chụp thật là UAT tùy chọn ngoài gate
        behavior: >-
          Chạy test component tự động: sd-form-builder ở chế độ Desktop/Tablet/Mobile, sd-form-render ở bề rộng form 1100px, 800px và 480px,
          và test của demo showcase
        expected_result: >-
          DOM cho thấy span đúng theo mức, nhãn kế thừa "Theo Desktop"/"Mặc định", field newRow bắt đầu hàng mới, demo showcase chạy trên
          API mới và không có lỗi console; ảnh chụp thật là UAT tùy chọn ngoài gate
        verification_kind: automated
        blocking: true
        requirement_refs:
          - R-008
          - R-011
        task_refs:
          - TASK-024
        evidence_refs:
          - EVIDENCE-024
      - id: A-001
        type: assumption
        statement: Chưa có consumer nào dùng schema SdFormGeneric hay API form-generic hiện tại.
        evidence_refs: []
        source: explicit
        confidence: medium
        status: confirmed
        blocking: false
        consequence_if_wrong: Consumer ẩn (package public trên npm) sẽ vỡ khi nâng lên 3.0.
        validation_method: Mục BREAKING trong CHANGELOG kèm ví dụ trước/sau; người dùng xác nhận trong brainstorming.
        owner: user
        rationale: Người dùng xác nhận chưa ai dùng nên chấp nhận đổi toàn bộ schema.
        impacted_refs:
          - R-001
          - R-010
      - id: A-002
        type: assumption
        statement: >-
          FilterUtilities.evaluate của @sdcorejs/utils (bản pin trong workspace: 1.1.4 lúc lập spec r1, 1.2.4 sau khi merge origin/main) xử
          lý đủ toán tử mà sd-query-builder sinh ra (so sánh, like, IN, BETWEEN, NULL, ngày tương đối, so sánh field–field).
        evidence_refs: []
        source: inferred
        confidence: medium
        status: proposed
        blocking: false
        consequence_if_wrong: Một số điều kiện không đánh giá đúng; cần lớp bù nhỏ trong module.
        validation_method: Test TDD cho từng toán tử trước khi viết renderer.
        owner: sdcorejs-execute-plan
        rationale: d.ts công khai match/evaluate/resolveRelativeDate; hành vi chi tiết cần test xác nhận.
        impacted_refs:
          - R-003
      - id: A-003
        type: assumption
        statement: >-
          Code builder/renderer đang có trong working tree (các vòng rewrite trước, chưa commit) là nền cho đợt 1; phần tương tác kéo-thả,
          resize, lịch sử undo được giữ và chuyển sang model mới.
        evidence_refs: []
        source: inferred
        confidence: high
        status: proposed
        blocking: false
        consequence_if_wrong: Phải viết lại cả lớp tương tác, khối lượng tăng mạnh.
        validation_method: Rà soát lúc lập plan; người dùng duyệt spec.
        owner: user
        rationale: Người dùng đã chốt tiếp tục trên nhánh hiện tại.
        impacted_refs:
          - R-008
      - id: A-004
        type: assumption
        statement: Kiểu checklist (có trong model cũ nhưng renderer chưa hỗ trợ) không nằm trong phiên bản đầu tiên; chọn nhiều dùng select multiple.
        evidence_refs: []
        source: defaulted
        confidence: medium
        status: proposed
        blocking: false
        consequence_if_wrong: Cần bổ sung kiểu checkbox-group sau.
        validation_method: Người dùng duyệt spec.
        owner: user
        rationale: Renderer hiện không có component cho checklist nên không mất chức năng đang chạy.
        impacted_refs:
          - R-001
          - R-009
      - id: A-005
        type: assumption
        statement: Biến của form dùng chung không gian key với field (builder đã chặn trùng); Filter được đánh giá trên { ...value, ...variables }.
        evidence_refs: []
        source: inferred
        confidence: high
        status: proposed
        blocking: false
        consequence_if_wrong: Điều kiện tham chiếu biến bị đánh giá sai.
        validation_method: Test TDD cho rules tham chiếu biến.
        owner: sdcorejs-execute-plan
        rationale: Builder hiện kiểm tra trùng giữa key field và key biến.
        impacted_refs:
          - R-003
          - R-009
      - id: D-001
        type: decision
        statement: >-
          Có giữ tương thích schema SdFormGeneric cũ? → Không — thiết kế lại toàn bộ, coi là phiên bản đầu tiên, không schemaVersion, không
          hàm chuyển đổi
        question: Có giữ tương thích schema SdFormGeneric cũ?
        selected_value: Không — thiết kế lại toàn bộ, coi là phiên bản đầu tiên, không schemaVersion, không hàm chuyển đổi
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Chưa có consumer; schema cũ lẫn string/number, expression riêng, break ẩn.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-001
          - R-010
          - AC-001
          - AC-017
        task_refs:
          - TASK-002
          - TASK-003
          - TASK-022
          - TASK-023
      - id: D-002
        type: decision
        statement: >-
          Mô hình cấu trúc? → Cây có ngữ pháp cố định: Form → pages (single | tabs | steps) → group → element; group không lồng; tabs/steps
          chỉ ở cấp form
        question: Mô hình cấu trúc?
        selected_value: 'Cây có ngữ pháp cố định: Form → pages (single | tabs | steps) → group → element; group không lồng; tabs/steps chỉ ở cấp form'
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Đủ cho Group/Tabs/Steps/Table mà độ phức tạp kéo-thả vẫn kiểm soát được.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-001
          - AC-001
        task_refs:
          - TASK-002
          - TASK-003
          - TASK-018
      - id: D-003
        type: decision
        statement: >-
          Bố cục responsive? → span theo 3 mức desktop/tablet/mobile + newRow; SD_FORM_GENERIC_BREAKPOINTS = { tablet: 600, desktop: 1024 }
          đo trên bề rộng form; mặc định desktop 12, tablet theo desktop, mobile 12; ghi đè qua provider
        question: Bố cục responsive?
        selected_value: >-
          span theo 3 mức desktop/tablet/mobile + newRow; SD_FORM_GENERIC_BREAKPOINTS = { tablet: 600, desktop: 1024 } đo trên bề rộng form;
          mặc định desktop 12, tablet theo desktop, mobile 12; ghi đè qua provider
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Form nằm trong drawer/dialog phải theo bề rộng thật của form, không theo màn hình.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-002
          - AC-002
          - AC-003
          - AC-004
          - AC-010
        task_refs:
          - TASK-004
          - TASK-005
          - TASK-016
          - TASK-020
      - id: D-004
        type: decision
        statement: Định dạng điều kiện? → rules { visible, hidden, disabled, required } và validation cấp form dùng Filter của @sdcorejs/utils
        question: Định dạng điều kiện?
        selected_value: rules { visible, hidden, disabled, required } và validation cấp form dùng Filter của @sdcorejs/utils
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Một định dạng duy nhất với sd-query-builder; có sẵn FilterUtilities.evaluate.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-003
          - AC-005
          - AC-006
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-008
          - TASK-009
          - TASK-016
          - TASK-019
      - id: D-005
        type: decision
        statement: >-
          Nguồn lựa chọn? → options { source: static, items } | { source: catalog, catalog, params, fill }; SdFormGenericValueRef có cấu
          trúc; multiple là thuộc tính field
        question: Nguồn lựa chọn?
        selected_value: >-
          options { source: static, items } | { source: catalog, catalog, params, fill }; SdFormGenericValueRef có cấu trúc; multiple là
          thuộc tính field
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Bỏ values/valuesKey rời, label/display lẫn lộn, chuỗi ${key} và tên setVariables dễ nhầm.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-005
          - AC-008
        task_refs:
          - TASK-003
          - TASK-006
          - TASK-007
          - TASK-017
          - TASK-019
      - id: D-006
        type: decision
        statement: Cấu hình portal? → provideSdFormGeneric({ catalogs, templates, htmlDefinitions, validators, breakpoints })
        question: Cấu hình portal?
        selected_value: provideSdFormGeneric({ catalogs, templates, htmlDefinitions, validators, breakpoints })
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Một điểm cấu hình, một shape cho mỗi loại nguồn.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-006
          - AC-003
          - AC-008
        task_refs:
          - TASK-012
          - TASK-013
          - TASK-014
      - id: D-007
        type: decision
        statement: >-
          API component? → sd-form-render [schema] [(value)] [form] [variables] [viewed] [breakpoint] (sdAction); sd-form-builder
          [(schema)]; không mutate input; defaultValue theo field
        question: API component?
        selected_value: >-
          sd-form-render [schema] [(value)] [form] [variables] [viewed] [breakpoint] (sdAction); sd-form-builder [(schema)]; không mutate
          input; defaultValue theo field
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Signal-first, tên thống nhất schema cho cả hai component.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-007
          - R-008
          - AC-009
          - AC-010
          - AC-013
        task_refs:
          - TASK-016
          - TASK-020
      - id: D-008
        type: decision
        statement: Chức năng hiện có? → Giữ đủ, mọi biểu thức đổi sang Filter, bỏ sd-feel-expression
        question: Chức năng hiện có?
        selected_value: Giữ đủ, mọi biểu thức đổi sang Filter, bỏ sd-feel-expression
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Không mất chức năng, chỉ còn một định dạng biểu thức.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-009
          - R-010
          - AC-015
          - AC-016
          - AC-017
        task_refs:
          - TASK-008
          - TASK-009
          - TASK-010
          - TASK-011
          - TASK-014
          - TASK-019
          - TASK-022
      - id: D-009
        type: decision
        statement: Đặt tên? → Type dùng tiền tố SdFormGeneric*, hằng số SD_FORM_GENERIC_*
        question: Đặt tên?
        selected_value: Type dùng tiền tố SdFormGeneric*, hằng số SD_FORM_GENERIC_*
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Theo tên hằng số người dùng chọn.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-001
          - R-002
        task_refs:
          - TASK-003
          - TASK-005
      - id: D-010
        type: decision
        statement: 'Cách giao? → 3 đợt trong bản 3.0 chưa phát hành: đợt 1 nền, đợt 2 Tĩnh + Nút, đợt 3 Cấu trúc; CHANGELOG mục BREAKING'
        question: Cách giao?
        selected_value: '3 đợt trong bản 3.0 chưa phát hành: đợt 1 nền, đợt 2 Tĩnh + Nút, đợt 3 Cấu trúc; CHANGELOG mục BREAKING'
        source: explicit-user
        status: approved
        blocking: true
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Mỗi đợt tự chạy được và review sớm.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-001
          - R-010
          - R-011
        task_refs:
          - TASK-023
          - TASK-026
      - id: D-011
        type: decision
        statement: Cách test? → TDD cho logic; viết test sau cho giao diện kèm ảnh chụp thật
        question: Cách test?
        selected_value: TDD cho logic; viết test sau cho giao diện kèm ảnh chụp thật
        source: explicit-user
        status: superseded
        blocking: false
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: Logic model/rules/layout rủi ro cao; UI cần kiểm chứng trực quan.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-011
          - AC-018
          - AC-019
        task_refs:
          - TASK-002
          - TASK-004
          - TASK-006
          - TASK-008
          - TASK-010
          - TASK-012
          - TASK-024
          - TASK-025
      - id: D-012
        type: decision
        statement: >-
          Tên type của field và container? → Giữ tên type field hiện có (textfield, textarea, number, select, radio, checkbox, datetime,
          chip-string, chip-calendar, upload, html); container giữ type group
        question: Tên type của field và container?
        selected_value: >-
          Giữ tên type field hiện có (textfield, textarea, number, select, radio, checkbox, datetime, chip-string, chip-calendar, upload,
          html); container giữ type group
        source: approved-spec
        status: proposed
        blocking: false
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Giảm thay đổi không cần thiết; người dùng quen tên Group.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-001
          - AC-001
        task_refs:
          - TASK-003
          - TASK-017
      - id: D-013
        type: decision
        statement: >-
          Form một trang lưu thế nào? → Luôn là pages: [ … ] (một phần tử khi không dùng tabs/steps); builder ẩn khái niệm trang ở chế độ
          một trang
        question: Form một trang lưu thế nào?
        selected_value: 'Luôn là pages: [ … ] (một phần tử khi không dùng tabs/steps); builder ẩn khái niệm trang ở chế độ một trang'
        source: approved-spec
        status: proposed
        blocking: false
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Một shape duy nhất, đợt 3 thêm tabs/steps không đổi schema.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-001
          - AC-001
        task_refs:
          - TASK-002
          - TASK-003
          - TASK-018
      - id: D-014
        type: decision
        statement: >-
          validate() thuộc đợt nào? → Đợt 1 (thay getValidationMessages để giữ chức năng); submit()/reset() và (sdAction) có hiệu lực ở đợt
          2 cùng button
        question: validate() thuộc đợt nào?
        selected_value: Đợt 1 (thay getValidationMessages để giữ chức năng); submit()/reset() và (sdAction) có hiệu lực ở đợt 2 cùng button
        source: approved-spec
        status: proposed
        blocking: false
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Validation cấp form đang có phải chạy được ngay đợt 1.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-007
          - AC-006
        task_refs:
          - TASK-008
          - TASK-009
          - TASK-016
      - id: D-015
        type: decision
        statement: Table ở đợt 1? → Chưa hỗ trợ; shape container table chừa sẵn và làm ở đợt 3
        question: Table ở đợt 1?
        selected_value: Chưa hỗ trợ; shape container table chừa sẵn và làm ở đợt 3
        source: approved-spec
        status: proposed
        blocking: false
        scope: module
        owner_repository_id: sdcorejs-angular
        rationale: >-
          Table đổi hẳn sang cột là field con; làm hai lần sẽ phí công. Bản 3.0 chưa phát hành nên tạm thiếu Table giữa các đợt là chấp nhận
          được.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-001
          - R-009
        task_refs:
          - TASK-017
          - TASK-019
      - id: D-016
        type: decision
        statement: Giới hạn field được render (input properties cũ)? → Giữ, đổi tên thành [keys] (danh sách key field được render)
        question: Giới hạn field được render (input properties cũ)?
        selected_value: Giữ, đổi tên thành [keys] (danh sách key field được render)
        source: approved-spec
        status: proposed
        blocking: false
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Giữ chức năng hiện có với tên rõ nghĩa.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-007
        task_refs:
          - TASK-016
      - id: D-017
        type: decision
        statement: >-
          Mở rộng union phần tử ở đợt 2/3 thế nào, và code gặp type lạ thì xử lý ra sao? → Thêm thành viên mới vào union
          SdFormGenericElement (và giá trị navigation) mà không đổi shape thành viên cũ. Renderer bỏ qua type lạ (cảnh báo khi dev mode);
          builder giữ nguyên phần tử lạ khi nạp → phát (round-trip) và hiện thẻ "chưa hỗ trợ".
        question: Mở rộng union phần tử ở đợt 2/3 thế nào, và code gặp type lạ thì xử lý ra sao?
        selected_value: >-
          Thêm thành viên mới vào union SdFormGenericElement (và giá trị navigation) mà không đổi shape thành viên cũ. Renderer bỏ qua type
          lạ (cảnh báo khi dev mode); builder giữ nguyên phần tử lạ khi nạp → phát (round-trip) và hiện thẻ "chưa hỗ trợ".
        source: approved-architecture
        status: proposed
        blocking: false
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Các đợt sau là các đơn vị làm độc lập; luật mở rộng phải cố định trước để không phá schema đợt 1.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-001
          - AC-001
        task_refs:
          - TASK-002
          - TASK-003
          - TASK-016
          - TASK-018
      - id: D-018
        type: decision
        statement: >-
          Tách lõi thuần TS ở đâu? → models (type + normalize/validate grammar), layout (breakpoint, kế thừa span, xếp hàng) và rules (đánh
          giá Filter, duyệt/đổi tham chiếu) là TypeScript thuần — không DI, không DOM; renderer và builder chỉ phụ thuộc chiều vào chúng.
        question: Tách lõi thuần TS ở đâu?
        selected_value: >-
          models (type + normalize/validate grammar), layout (breakpoint, kế thừa span, xếp hàng) và rules (đánh giá Filter, duyệt/đổi tham
          chiếu) là TypeScript thuần — không DI, không DOM; renderer và builder chỉ phụ thuộc chiều vào chúng.
        source: approved-architecture
        status: proposed
        blocking: false
        scope: module
        owner_repository_id: sdcorejs-angular
        rationale: Canvas và renderer phải xếp giống nhau; logic cần TDD nhanh, không cần TestBed.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-002
          - R-003
          - AC-002
          - AC-004
          - AC-005
          - AC-015
        task_refs:
          - TASK-003
          - TASK-005
          - TASK-007
          - TASK-009
          - TASK-011
      - id: D-019
        type: decision
        statement: >-
          Item của catalog và bộ nhớ đệm? → Catalog trả SdFormGenericCatalogItem = SdFormGenericOption & { data?: Record<string, unknown> };
          fill đọc item.data[from]. Kết quả load được đệm theo từng instance renderer, khoá bằng catalog id + params đã giải; không dùng bộ
          đệm toàn cục.
        question: Item của catalog và bộ nhớ đệm?
        selected_value: >-
          Catalog trả SdFormGenericCatalogItem = SdFormGenericOption & { data?: Record<string, unknown> }; fill đọc item.data[from]. Kết quả
          load được đệm theo từng instance renderer, khoá bằng catalog id + params đã giải; không dùng bộ đệm toàn cục.
        source: approved-architecture
        status: proposed
        blocking: false
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Hai form cùng trang không được dùng lẫn dữ liệu; fill cần dữ liệu ngoài value/label.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-005
          - AC-008
        task_refs:
          - TASK-012
          - TASK-013
      - id: D-020
        type: decision
        statement: >-
          Ngữ nghĩa value và validate()? → value chỉ gồm key của field (không có phần tử tĩnh/nút), giữ giá trị của field đang ẩn;
          valueChange phát object mới sau mỗi thay đổi control (không debounce). validate() đánh dấu mọi control đã chạm, chạy validator của
          field rồi validations cấp form, trả { valid, messages: { error, warning } }; chỉ error làm valid = false.
        question: Ngữ nghĩa value và validate()?
        selected_value: >-
          value chỉ gồm key của field (không có phần tử tĩnh/nút), giữ giá trị của field đang ẩn; valueChange phát object mới sau mỗi thay
          đổi control (không debounce). validate() đánh dấu mọi control đã chạm, chạy validator của field rồi validations cấp form, trả {
          valid, messages: { error, warning } }; chỉ error làm valid = false.
        source: approved-architecture
        status: proposed
        blocking: false
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Consumer và các đợt sau phải hiểu value và validate() giống nhau.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-007
          - AC-006
          - AC-009
        task_refs:
          - TASK-006
          - TASK-007
          - TASK-009
          - TASK-016
      - id: D-021
        type: decision
        statement: >-
          Ranh giới kiểm chứng của validation map? → kind none — form-generic là thư viện UI, không xác thực người dùng và không gọi HTTP
          (INV-009); mọi AC chứng minh bằng Karma unit/component, lệnh kiểm tra của repo hoặc ảnh chụp thủ công
        question: Ranh giới kiểm chứng của validation map?
        selected_value: >-
          kind none — form-generic là thư viện UI, không xác thực người dùng và không gọi HTTP (INV-009); mọi AC chứng minh bằng Karma
          unit/component, lệnh kiểm tra của repo hoặc ảnh chụp thủ công
        source: approved-plan
        status: proposed
        blocking: false
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: Không có ranh giới phân quyền nào trong phạm vi nên không cần bằng chứng từ chối ở API; một ranh giới chung cho mọi dòng.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-001
          - R-002
          - R-003
          - R-004
          - R-005
          - R-006
          - R-007
          - R-008
          - R-009
          - R-010
          - R-011
          - AC-001
          - AC-002
          - AC-003
          - AC-004
          - AC-005
          - AC-006
          - AC-007
          - AC-008
          - AC-009
          - AC-010
          - AC-011
          - AC-012
          - AC-013
          - AC-014
          - AC-015
          - AC-016
          - AC-017
          - AC-018
          - AC-019
          - INV-001
          - INV-002
          - INV-003
          - INV-004
          - INV-005
          - INV-006
          - INV-007
          - INV-008
          - INV-009
        validation_boundary:
          kind: none
          source_refs:
            - R-001
            - R-002
            - R-003
            - R-004
            - R-005
            - R-006
            - R-007
            - R-008
            - R-009
            - R-010
            - R-011
            - AC-001
            - AC-002
            - AC-003
            - AC-004
            - AC-005
            - AC-006
            - AC-007
            - AC-008
            - AC-009
            - AC-010
            - AC-011
            - AC-012
            - AC-013
            - AC-014
            - AC-015
            - AC-016
            - AC-017
            - AC-018
            - AC-019
            - INV-001
            - INV-002
            - INV-003
            - INV-004
            - INV-005
            - INV-006
            - INV-007
            - INV-008
            - INV-009
        task_refs:
          - TASK-025
      - id: D-022
        type: decision
        statement: >-
          Các thuộc tính/API cũ không có trong hợp đồng mới xử lý thế nào? → Bỏ ở đợt 1 và ghi trong mục BREAKING: onLoaded (consumer tự
          biết lúc đặt [schema]); beforeSubmit, properties.onChange.setValues và kiểu checklist (renderer chưa từng thực thi); setVariables
          và VariableComponent (thay bằng options.fill và [variables]); field table (D-015, làm lại ở đợt 3)
        question: Các thuộc tính/API cũ không có trong hợp đồng mới xử lý thế nào?
        selected_value: >-
          Bỏ ở đợt 1 và ghi trong mục BREAKING: onLoaded (consumer tự biết lúc đặt [schema]); beforeSubmit, properties.onChange.setValues và
          kiểu checklist (renderer chưa từng thực thi); setVariables và VariableComponent (thay bằng options.fill và [variables]); field
          table (D-015, làm lại ở đợt 3)
        source: approved-plan
        status: proposed
        blocking: false
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Hợp đồng C-002 đã duyệt không có các mục này; phần lớn chưa từng chạy ở renderer nên không mất chức năng đang dùng.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-009
          - R-010
          - AC-017
        task_refs:
          - TASK-016
          - TASK-022
          - TASK-023
      - id: D-023
        type: decision
        statement: >-
          validate() gặp validator hàm chưa được đăng ký ở provider? → Fail-closed: thêm một lỗi error nêu mã validator chưa đăng ký, valid
          = false; không bỏ qua im lặng
        question: validate() gặp validator hàm chưa được đăng ký ở provider?
        selected_value: 'Fail-closed: thêm một lỗi error nêu mã validator chưa đăng ký, valid = false; không bỏ qua im lặng'
        source: approved-plan
        status: proposed
        blocking: false
        scope: public-contract
        owner_repository_id: sdcorejs-angular
        rationale: Cấu hình portal thiếu validator phải lộ ra ngay, không để dữ liệu sai lọt qua.
        supersedes: null
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-003
          - AC-006
        task_refs:
          - TASK-008
          - TASK-009
      - id: D-024
        type: decision
        question: Kiểm chứng giao diện và tài liệu thế nào để delivery convergence xác nhận được?
        selected_value: >-
          TDD cho logic; test sau cho giao diện bằng kiểm tra DOM tự động (span theo mức, nhãn kế thừa, newRow, không lỗi console); public
          API, CHANGELOG và tài liệu kiểm bằng test/lệnh tự động; ảnh chụp thật chỉ là UAT tùy chọn ngoài gate
        source: explicit-user
        status: approved
        blocking: true
        scope: repository
        owner_repository_id: sdcorejs-angular
        rationale: >-
          sdcorejs-convergence:v1 không bao giờ nhận evidence thủ công làm bằng chứng; người dùng chọn sửa spec → architecture → plan
          (2026-09-30) để gate đạt CONVERGED. Kiểm tra DOM lặp lại được trên mọi tree, ảnh chụp thì không.
        supersedes: D-011
        revisit_condition: null
        convention_impact:
          candidate: false
          category: null
        downstream_refs:
          - R-011
          - AC-017
          - AC-018
          - AC-019
        task_refs: []
        statement: >-
          Kiểm chứng giao diện và tài liệu thế nào để delivery convergence xác nhận được? → TDD cho logic; test sau cho giao diện bằng kiểm
          tra DOM tự động (span theo mức, nhãn kế thừa, newRow, không lỗi console); public API, CHANGELOG và tài liệu kiểm bằng test/lệnh tự
          động; ảnh chụp thật chỉ là UAT tùy chọn ngoài gate
      - id: INV-001
        type: invariant
        statement: >-
          sd-form-render không bao giờ mutate schema, value hay variables được truyền vào; sd-form-builder không bao giờ mutate schema được
          truyền vào; mọi lần phát là object mới.
        protected_refs:
          - R-007
          - R-008
          - AC-009
          - AC-013
        task_refs:
          - TASK-007
          - TASK-016
          - TASK-018
          - TASK-020
        evidence_refs:
          - EVIDENCE-016
          - EVIDENCE-018
      - id: INV-002
        type: invariant
        statement: >-
          Chọn mức breakpoint, kế thừa span và xếp hàng (kể cả newRow) do một module layout thuần duy nhất đảm nhận; canvas và renderer cho
          cùng input + cùng mức luôn ra cùng các hàng.
        protected_refs:
          - R-002
          - AC-002
          - AC-003
          - AC-004
          - AC-010
          - AC-014
        task_refs:
          - TASK-005
          - TASK-016
          - TASK-018
          - TASK-020
        evidence_refs:
          - EVIDENCE-005
          - EVIDENCE-020
      - id: INV-003
        type: invariant
        statement: >-
          Mọi điều kiện (rules) và validation cấp form dạng biểu thức đều là Filter, đánh giá bởi một evaluator duy nhất bọc
          FilterUtilities.evaluate trên { ...value, ...variables }; không còn định dạng biểu thức nào khác trong schema hay runtime.
        protected_refs:
          - R-003
          - AC-005
          - AC-006
        task_refs:
          - TASK-007
          - TASK-009
          - TASK-016
          - TASK-019
          - TASK-022
        evidence_refs:
          - EVIDENCE-007
          - EVIDENCE-016
      - id: INV-004
        type: invariant
        statement: >-
          Schema luôn đúng ngữ pháp: pages → (group | element), group chỉ chứa element, không có break, không có schemaVersion, key field
          duy nhất (kể cả so với biến); mọi lệnh của builder chỉ tạo ra schema hợp lệ.
        protected_refs:
          - R-001
          - AC-001
        task_refs:
          - TASK-003
          - TASK-018
        evidence_refs:
          - EVIDENCE-003
          - EVIDENCE-018
      - id: INV-005
        type: invariant
        statement: >-
          Mọi tham chiếu tới key field hoặc biến trong schema đều có cấu trúc (Filter.field và so sánh field–field, SdFormGenericValueRef,
          fill.field); chuỗi tự do chỉ còn ở hyperlink và nội dung html.
        protected_refs:
          - R-005
          - R-009
          - AC-008
          - AC-015
        task_refs:
          - TASK-003
          - TASK-009
          - TASK-019
        evidence_refs:
          - EVIDENCE-009
      - id: INV-006
        type: invariant
        statement: >-
          Thêm type phần tử mới (đợt 2/3) không đổi shape của type đã có; phần tử có type lạ được renderer bỏ qua và được builder giữ nguyên
          khi phát lại.
        protected_refs:
          - R-001
          - AC-001
        task_refs:
          - TASK-003
          - TASK-016
          - TASK-018
        evidence_refs:
          - EVIDENCE-003
          - EVIDENCE-016
          - EVIDENCE-018
      - id: INV-007
        type: invariant
        statement: Chỉ sửa code ở versions/v19; v20/v21/v22 chỉ đổi qua npm run sync và check:sync luôn qua; v22 giữ LF.
        protected_refs:
          - R-011
          - AC-018
        task_refs:
          - TASK-001
          - TASK-026
        evidence_refs:
          - EVIDENCE-026
      - id: INV-008
        type: invariant
        statement: >-
          Public API của entry form-generic đúng bằng danh sách hợp đồng C-001…C-006; mọi export cũ bị bỏ đều được liệt kê trong mục
          BREAKING của CHANGELOG.
        protected_refs:
          - R-010
          - AC-017
        task_refs:
          - TASK-022
          - TASK-023
        evidence_refs:
          - EVIDENCE-022
      - id: INV-009
        type: invariant
        statement: >-
          Component không tự gọi HTTP; dữ liệu của portal chỉ đi qua callback trong provideSdFormGeneric (catalog.load/search,
          htmlDefinitions, validators, templates).
        protected_refs:
          - R-005
          - R-006
          - AC-008
        task_refs:
          - TASK-013
          - TASK-014
          - TASK-017
        evidence_refs:
          - EVIDENCE-013
          - EVIDENCE-014
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
        tombstones: []
      - revision: 2
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
          - id: D-019
            type: decision
          - id: D-020
            type: decision
          - id: INV-001
            type: invariant
          - id: INV-002
            type: invariant
          - id: INV-003
            type: invariant
          - id: INV-004
            type: invariant
          - id: INV-005
            type: invariant
          - id: INV-006
            type: invariant
          - id: INV-007
            type: invariant
          - id: INV-008
            type: invariant
          - id: INV-009
            type: invariant
        tombstones: []
      - revision: 3
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
          - id: D-019
            type: decision
          - id: D-020
            type: decision
          - id: D-021
            type: decision
          - id: D-022
            type: decision
          - id: D-023
            type: decision
          - id: INV-001
            type: invariant
          - id: INV-002
            type: invariant
          - id: INV-003
            type: invariant
          - id: INV-004
            type: invariant
          - id: INV-005
            type: invariant
          - id: INV-006
            type: invariant
          - id: INV-007
            type: invariant
          - id: INV-008
            type: invariant
          - id: INV-009
            type: invariant
        tombstones: []
      - revision: 4
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
          - id: D-019
            type: decision
          - id: D-020
            type: decision
          - id: D-021
            type: decision
          - id: D-022
            type: decision
          - id: D-023
            type: decision
          - id: D-024
            type: decision
          - id: INV-001
            type: invariant
          - id: INV-002
            type: invariant
          - id: INV-003
            type: invariant
          - id: INV-004
            type: invariant
          - id: INV-005
            type: invariant
          - id: INV-006
            type: invariant
          - id: INV-007
            type: invariant
          - id: INV-008
            type: invariant
          - id: INV-009
            type: invariant
        tombstones: []
  goal_backward_review:
    schema_version: 1
    mode: sdcorejs-plan:goal-backward
    stage: spec
    future_gaps: []
  architecture_gate:
    valid: true
    required: true
    status: required
    signals:
      - persisted-data-model-contract
      - public-api-contract
      - state-data-ownership
    bypass: null
    rationale: >-
      Thay schema JSON mà consumer lưu trữ (persisted data model), đổi public API của sd-form-render/sd-form-builder/provider, và chuyển
      quyền sở hữu giá trị từ object entity bị mutate sang model value.
  contract_id: form-generic-schema-v1
  requirement_id: form-generic-schema-v1
  approved_spec_path: ''
  approved_spec_hash: ''
  supersedes: .sdcorejs/specs/angular/2026-09-29-18-42-form-generic-schema-v1-phase-1.md
  target_root: .
  target_root_kind: target-project
  owner_repository_id: sdcorejs-angular
  owner_repository_role: library
  owner_module_id: components/form-generic
  execution_host_repository_id: sdcorejs-angular
  track: angular
  stack_profile: core-ui-angular
  profile_confidence: high
  source_requirement_context: form-generic-schema-v1 (sdcorejs-brainstorming, người dùng duyệt 2026-09-29; bản sửa 2 theo lựa chọn 1 của người dùng 2026-09-30)
  acceptance_criteria_count: 19
  manual_criteria_count: 0
  non_goals:
    - Cây container tự do, tabs trong group, danh sách lồng nhau
    - Sửa dòng trực tiếp trong bảng
    - Nội dung động trong heading/paragraph
    - Hàm chuyển đổi schema cũ, schemaVersion
    - Tác vụ lưu/nháp/xuất trong builder
    - Ảnh chụp thật làm bằng chứng của delivery gate
  risks:
    - Khối lượng viết lại lớn
    - Package public trên npm — BREAKING
    - Canvas hẹp hơn mức desktop
    - Rollout v20–v22 lần trước còn lỗi
    - Kiểm tra DOM tự động không bắt được lỗi thuần thị giác
  assumptions:
    - A-001 Chưa có consumer nào dùng schema SdFormGeneric hay API form-generic hiện tại.
    - >-
      A-002 FilterUtilities.evaluate của @sdcorejs/utils (bản pin trong workspace: 1.1.4 lúc lập spec r1, 1.2.4 sau khi merge origin/main)
      xử lý đủ toán tử mà sd-query-builder sinh ra (so sánh, like, IN, BETWEEN, NULL, ngày tương đối, so sánh field–field).
    - >-
      A-003 Code builder/renderer đang có trong working tree (các vòng rewrite trước, chưa commit) là nền cho đợt 1; phần tương tác kéo-thả,
      resize, lịch sử undo được giữ và chuyển sang model mới.
    - >-
      A-004 Kiểu checklist (có trong model cũ nhưng renderer chưa hỗ trợ) không nằm trong phiên bản đầu tiên; chọn nhiều dùng select
      multiple.
    - A-005 Biến của form dùng chung không gian key với field (builder đã chặn trùng); Filter được đánh giá trên { ...value, ...variables }.
  redaction_applied: false
  approval:
    approved: false
    approved_at: null
    approval_source: explicit-user-choice
  change_control:
    revision: 2
    supersedes: .sdcorejs/specs/angular/2026-09-29-18-42-form-generic-schema-v1-phase-1.md
    change_reason: >-
      Delivery convergence (sdcorejs-convergence:v1) không bao giờ nhận evidence thủ công, nên R-011, AC-017 và AC-019 chuyển sang kiểm
      chứng tự động (D-024 thay D-011); ảnh chụp thật thành UAT tùy chọn ngoài gate. A-002 không còn ghim @sdcorejs/utils 1.1.4 vì nhánh đã
      merge origin/main (utils 1.2.4). Nội dung chức năng không đổi.
```

## Problem & Goals

`sd-form-builder` / `sd-form-render` dùng schema `SdFormGeneric` với nhiều điểm khó hiểu và khó mở rộng: cột lẫn chuỗi và số, phần tử `break` ẩn, biểu thức điều kiện riêng (`SdFormGenericExpression`) phải chuyển qua lại với `Filter` của query builder, nguồn lựa chọn rải ở `values` / `valuesKey` / `properties.query` / `properties.setVariables`, renderer ghi ngược vào `entity` của consumer, và chỉ có hai mức bố cục desktop/mobile.

Mục tiêu của chương trình `form-generic-schema-v1` là một schema phiên bản đầu tiên, gọn, có cấu trúc, đủ chỗ cho các phần tử Tĩnh, Nút và Cấu trúc (Tabs, Steps, Table). **Đợt 1** (spec này) dựng nền: model mới, bố cục 3 mức theo bề rộng form, điều kiện bằng `Filter`, nguồn lựa chọn mới, cấu hình portal, API component mới — và đưa renderer + builder lên schema mới với đầy đủ chức năng hiện có cho các field và group.

Người dùng: đội phát triển portal (thiết kế form bằng builder, render bằng renderer) và người dùng nghiệp vụ điền form. Thành công khi form hiện có dựng lại được trên schema mới, hiển thị đúng ở desktop/tablet/mobile, và API không còn mutate dữ liệu của consumer.

**Bản sửa 2 (2026-09-30 22:46):** kiểm chứng giao diện, public API và tài liệu chuyển sang kiểm tra tự động (R-011, AC-017, AC-019, D-024) để delivery convergence xác nhận được trên mọi tree; ảnh chụp thật chỉ còn là UAT tùy chọn ngoài gate. Nội dung chức năng của đợt 1 không đổi.

## Requirements

- R-001 - Schema gốc SdFormGenericSchema là phiên bản đầu tiên (không schemaVersion, không chuyển đổi từ SdFormGeneric cũ) theo ngữ pháp cố định Form → pages → group → element; phần tử phân loại bằng `type`; chừa sẵn shape cho static/button (đợt 2) và tabs/steps/table (đợt 3). (nguồn: explicit-user, trạng thái: active, sở hữu: sdcorejs-angular / components/form-generic)
- R-002 - Bố cục responsive layout.span { desktop, tablet, mobile } (1–12) + newRow, theo SD_FORM_GENERIC_BREAKPOINTS = { tablet: 600, desktop: 1024 } đo trên bề rộng form; mặc định desktop 12, tablet theo desktop, mobile 12; ghi đè breakpoint qua provider; bỏ phần tử break. (nguồn: explicit-user, trạng thái: active, sở hữu: sdcorejs-angular / components/form-generic)
- R-003 - Điều kiện rules { visible, hidden, disabled, required } lưu bằng Filter của @sdcorejs/utils và đánh giá bằng FilterUtilities.evaluate trên giá trị form + biến; validation cấp form dùng Filter hoặc hàm đăng ký ở portal. (nguồn: explicit-user, trạng thái: active, sở hữu: sdcorejs-angular / components/form-generic)
- R-004 - Validation của field chuẩn hoá { required, min, max, minLength, maxLength, pattern { value, message }, maxItems, phoneCountry }; giữ nguyên các preset text (email, phone, url, password) và number (integer, decimal, currency, percent) cùng kiểm tra của chúng. (nguồn: explicit-user, trạng thái: active, sở hữu: sdcorejs-angular / components/form-generic)
- R-005 - Nguồn lựa chọn options = { source: static, items } | { source: catalog, catalog, params, fill } với SdFormGenericValueRef có cấu trúc; multiple là thuộc tính field; portal đăng ký catalog { id, label, params, fields, load, search? }. (nguồn: explicit-user, trạng thái: active, sở hữu: sdcorejs-angular / components/form-generic)
- R-006 - Cấu hình portal gom về provideSdFormGeneric({ catalogs, templates, htmlDefinitions, validators, breakpoints }) thay cho SD_FORM_GENERIC_CONFIGURATION.form cũ. (nguồn: explicit-user, trạng thái: active, sở hữu: sdcorejs-angular / components/form-generic)
- R-007 - sd-form-render có API [schema], [(value)] (model, không mutate input), [form], [variables], [viewed], [breakpoint], [labelPlacement], [keys]; method validate() trả { valid, messages } và upload(); defaultValue khai báo theo field. (nguồn: explicit-user, trạng thái: active, sở hữu: sdcorejs-angular / components/form-generic)
- R-008 - sd-form-builder có API [(schema)], thiết kế trên schema mới ngang tính năng hiện có cho các field và group; chế độ Desktop | Tablet | Mobile sửa span của mức đang xem, hiển thị mức kế thừa, newRow thay cho ngắt dòng; Xem trước dùng renderer với [breakpoint] ép mức. (nguồn: explicit-user, trạng thái: active, sở hữu: sdcorejs-angular / components/form-generic)
- R-009 - Giữ đủ chức năng hiện có trên model mới: biến, validation cấp form, templates, HTML definitions (biến, truy vấn), upload (loại, nguồn, định dạng, số file, dung lượng, tham số), hyperlink khi chỉ xem, labelPlacement, viewed, SdFormRenderService.viewEntities, đổi mã có cập nhật tham chiếu có cấu trúc. (nguồn: explicit-user, trạng thái: active, sở hữu: sdcorejs-angular / components/form-generic)
- R-010 - Bỏ sd-feel-expression, model expression cũ và phần tử break; CHANGELOG ghi mục BREAKING có ví dụ trước/sau; sd-form-generic.md viết lại cho schema mới; showcase chạy trên schema mới; i18n đủ 5 ngôn ngữ. (nguồn: explicit-user, trạng thái: active, sở hữu: sdcorejs-angular / components/form-generic)
- R-011 - Kiểm chứng: TDD cho phần logic, test sau cho giao diện bằng kiểm tra DOM tự động (ảnh chụp thật chỉ là UAT tùy chọn, không phải bằng chứng của gate); full suite v19 có coverage, lint, check:i18n, check:i18n-parity, check:scss-hex xanh; rollout v20/v21/v22 bằng npm run sync, check:sync xanh và v22 giữ LF (kiểm bằng lệnh tự động). (nguồn: explicit-user, trạng thái: active, sở hữu: sdcorejs-angular / components/form-generic)

## Decisions

- D-001 - Có giữ tương thích schema SdFormGeneric cũ? **Không — thiết kế lại toàn bộ, coi là phiên bản đầu tiên, không schemaVersion, không hàm chuyển đổi**. Nguồn: explicit-user; trạng thái: approved; phạm vi: public-contract; sở hữu: sdcorejs-angular. Lý do: Chưa có consumer; schema cũ lẫn string/number, expression riêng, break ẩn. Thay thế: không.
- D-002 - Mô hình cấu trúc? **Cây có ngữ pháp cố định: Form → pages (single | tabs | steps) → group → element; group không lồng; tabs/steps chỉ ở cấp form**. Nguồn: explicit-user; trạng thái: approved; phạm vi: public-contract; sở hữu: sdcorejs-angular. Lý do: Đủ cho Group/Tabs/Steps/Table mà độ phức tạp kéo-thả vẫn kiểm soát được. Thay thế: không.
- D-003 - Bố cục responsive? **span theo 3 mức desktop/tablet/mobile + newRow; SD_FORM_GENERIC_BREAKPOINTS = { tablet: 600, desktop: 1024 } đo trên bề rộng form; mặc định desktop 12, tablet theo desktop, mobile 12; ghi đè qua provider**. Nguồn: explicit-user; trạng thái: approved; phạm vi: public-contract; sở hữu: sdcorejs-angular. Lý do: Form nằm trong drawer/dialog phải theo bề rộng thật của form, không theo màn hình. Thay thế: không.
- D-004 - Định dạng điều kiện? **rules { visible, hidden, disabled, required } và validation cấp form dùng Filter của @sdcorejs/utils**. Nguồn: explicit-user; trạng thái: approved; phạm vi: public-contract; sở hữu: sdcorejs-angular. Lý do: Một định dạng duy nhất với sd-query-builder; có sẵn FilterUtilities.evaluate. Thay thế: không.
- D-005 - Nguồn lựa chọn? **options { source: static, items } | { source: catalog, catalog, params, fill }; SdFormGenericValueRef có cấu trúc; multiple là thuộc tính field**. Nguồn: explicit-user; trạng thái: approved; phạm vi: public-contract; sở hữu: sdcorejs-angular. Lý do: Bỏ values/valuesKey rời, label/display lẫn lộn, chuỗi ${key} và tên setVariables dễ nhầm. Thay thế: không.
- D-006 - Cấu hình portal? **provideSdFormGeneric({ catalogs, templates, htmlDefinitions, validators, breakpoints })**. Nguồn: explicit-user; trạng thái: approved; phạm vi: public-contract; sở hữu: sdcorejs-angular. Lý do: Một điểm cấu hình, một shape cho mỗi loại nguồn. Thay thế: không.
- D-007 - API component? **sd-form-render [schema] [(value)] [form] [variables] [viewed] [breakpoint] (sdAction); sd-form-builder [(schema)]; không mutate input; defaultValue theo field**. Nguồn: explicit-user; trạng thái: approved; phạm vi: public-contract; sở hữu: sdcorejs-angular. Lý do: Signal-first, tên thống nhất schema cho cả hai component. Thay thế: không.
- D-008 - Chức năng hiện có? **Giữ đủ, mọi biểu thức đổi sang Filter, bỏ sd-feel-expression**. Nguồn: explicit-user; trạng thái: approved; phạm vi: public-contract; sở hữu: sdcorejs-angular. Lý do: Không mất chức năng, chỉ còn một định dạng biểu thức. Thay thế: không.
- D-009 - Đặt tên? **Type dùng tiền tố SdFormGeneric*, hằng số SD_FORM_GENERIC_***. Nguồn: explicit-user; trạng thái: approved; phạm vi: public-contract; sở hữu: sdcorejs-angular. Lý do: Theo tên hằng số người dùng chọn. Thay thế: không.
- D-010 - Cách giao? **3 đợt trong bản 3.0 chưa phát hành: đợt 1 nền, đợt 2 Tĩnh + Nút, đợt 3 Cấu trúc; CHANGELOG mục BREAKING**. Nguồn: explicit-user; trạng thái: approved; phạm vi: public-contract; sở hữu: sdcorejs-angular. Lý do: Mỗi đợt tự chạy được và review sớm. Thay thế: không.
- D-011 - Cách test? **TDD cho logic; viết test sau cho giao diện kèm ảnh chụp thật**. Nguồn: explicit-user; trạng thái: superseded; phạm vi: repository; sở hữu: sdcorejs-angular. Lý do: Logic model/rules/layout rủi ro cao; UI cần kiểm chứng trực quan. Thay thế: không. Đã bị D-024 thay thế ở bản sửa 2.
- D-012 - Tên type của field và container? **Giữ tên type field hiện có (textfield, textarea, number, select, radio, checkbox, datetime, chip-string, chip-calendar, upload, html); container giữ type group**. Nguồn: approved-spec; trạng thái: proposed (duyệt cùng spec); phạm vi: public-contract; sở hữu: sdcorejs-angular. Lý do: Giảm thay đổi không cần thiết; người dùng quen tên Group. Thay thế: không.
- D-013 - Form một trang lưu thế nào? **Luôn là pages: [ … ] (một phần tử khi không dùng tabs/steps); builder ẩn khái niệm trang ở chế độ một trang**. Nguồn: approved-spec; trạng thái: proposed (duyệt cùng spec); phạm vi: public-contract; sở hữu: sdcorejs-angular. Lý do: Một shape duy nhất, đợt 3 thêm tabs/steps không đổi schema. Thay thế: không.
- D-014 - validate() thuộc đợt nào? **Đợt 1 (thay getValidationMessages để giữ chức năng); submit()/reset() và (sdAction) có hiệu lực ở đợt 2 cùng button**. Nguồn: approved-spec; trạng thái: proposed (duyệt cùng spec); phạm vi: public-contract; sở hữu: sdcorejs-angular. Lý do: Validation cấp form đang có phải chạy được ngay đợt 1. Thay thế: không.
- D-015 - Table ở đợt 1? **Chưa hỗ trợ; shape container table chừa sẵn và làm ở đợt 3**. Nguồn: approved-spec; trạng thái: proposed (duyệt cùng spec); phạm vi: module; sở hữu: sdcorejs-angular. Lý do: Table đổi hẳn sang cột là field con; làm hai lần sẽ phí công. Bản 3.0 chưa phát hành nên tạm thiếu Table giữa các đợt là chấp nhận được. Thay thế: không.
- D-016 - Giới hạn field được render (input properties cũ)? **Giữ, đổi tên thành [keys] (danh sách key field được render)**. Nguồn: approved-spec; trạng thái: proposed (duyệt cùng spec); phạm vi: public-contract; sở hữu: sdcorejs-angular. Lý do: Giữ chức năng hiện có với tên rõ nghĩa. Thay thế: không.
- D-024 - Kiểm chứng giao diện và tài liệu thế nào để delivery convergence xác nhận được? **TDD cho logic; test sau cho giao diện bằng kiểm tra DOM tự động (span theo mức, nhãn kế thừa, newRow, không lỗi console); public API, CHANGELOG và tài liệu kiểm bằng test/lệnh tự động; ảnh chụp thật chỉ là UAT tùy chọn ngoài gate**. Nguồn: explicit-user; trạng thái: approved; phạm vi: repository; sở hữu: sdcorejs-angular. Lý do: sdcorejs-convergence:v1 không bao giờ nhận evidence thủ công làm bằng chứng; người dùng chọn sửa spec → architecture → plan (2026-09-30) để gate đạt CONVERGED. Kiểm tra DOM lặp lại được trên mọi tree, ảnh chụp thì không. Thay thế: D-011.

## Assumptions

- A-001 - Chưa có consumer nào dùng schema SdFormGeneric hay API form-generic hiện tại. Nguồn: explicit; độ tin cậy: medium; trạng thái: confirmed; chặn: không. Nếu sai: Consumer ẩn (package public trên npm) sẽ vỡ khi nâng lên 3.0. Kiểm chứng: Mục BREAKING trong CHANGELOG kèm ví dụ trước/sau; người dùng xác nhận trong brainstorming. Người chịu trách nhiệm: user.
- A-002 - FilterUtilities.evaluate của @sdcorejs/utils (bản pin trong workspace: 1.1.4 lúc lập spec r1, 1.2.4 sau khi merge origin/main) xử lý đủ toán tử mà sd-query-builder sinh ra (so sánh, like, IN, BETWEEN, NULL, ngày tương đối, so sánh field–field). Nguồn: inferred; độ tin cậy: medium; trạng thái: proposed; chặn: không. Nếu sai: Một số điều kiện không đánh giá đúng; cần lớp bù nhỏ trong module. Kiểm chứng: Test TDD cho từng toán tử trước khi viết renderer. Người chịu trách nhiệm: sdcorejs-execute-plan.
- A-003 - Code builder/renderer đang có trong working tree (các vòng rewrite trước, chưa commit) là nền cho đợt 1; phần tương tác kéo-thả, resize, lịch sử undo được giữ và chuyển sang model mới. Nguồn: inferred; độ tin cậy: high; trạng thái: proposed; chặn: không. Nếu sai: Phải viết lại cả lớp tương tác, khối lượng tăng mạnh. Kiểm chứng: Rà soát lúc lập plan; người dùng duyệt spec. Người chịu trách nhiệm: user.
- A-004 - Kiểu checklist (có trong model cũ nhưng renderer chưa hỗ trợ) không nằm trong phiên bản đầu tiên; chọn nhiều dùng select multiple. Nguồn: defaulted; độ tin cậy: medium; trạng thái: proposed; chặn: không. Nếu sai: Cần bổ sung kiểu checkbox-group sau. Kiểm chứng: Người dùng duyệt spec. Người chịu trách nhiệm: user.
- A-005 - Biến của form dùng chung không gian key với field (builder đã chặn trùng); Filter được đánh giá trên { ...value, ...variables }. Nguồn: inferred; độ tin cậy: high; trạng thái: proposed; chặn: không. Nếu sai: Điều kiện tham chiếu biến bị đánh giá sai. Kiểm chứng: Test TDD cho rules tham chiếu biến. Người chịu trách nhiệm: sdcorejs-execute-plan.

## Architecture gate classification

- Status: required
- Signals: persisted-data-model-contract, public-api-contract, state-data-ownership
- Rationale/bypass: Thay schema JSON mà consumer lưu trữ (persisted data model), đổi public API của sd-form-render/sd-form-builder/provider, và chuyển quyền sở hữu giá trị từ object entity bị mutate sang model value.

## Non-goals

- Cây container tự do kiểu Vueform (container lồng nhau, bố cục 2/3/4 cột, danh sách lồng nhau); tabs nằm trong group.
- Phần tử Tĩnh (heading, paragraph, quote, image, link, divider, notice) và Nút — đợt 2.
- Tabs, Steps, container Table, nhóm palette Tĩnh/Cấu trúc, tab Sơ đồ — đợt 3.
- Sửa dòng trực tiếp trong bảng; nội dung động trong heading/paragraph.
- Hàm chuyển đổi schema cũ, trường schemaVersion.
- Tác vụ lưu/nháp/nhập/xuất trong builder.
- Ảnh chụp thật làm bằng chứng của delivery gate (chỉ là UAT tùy chọn; D-024).

## Architecture

### Schema (public, được consumer lưu trữ)

```ts
interface SdFormGenericSchema {
  pages: SdFormGenericPage[];                 // luôn là mảng; đợt 1 chỉ một trang (D-013)
  navigation?: SdFormGenericNavigation;       // chừa cho đợt 3: { type: 'tabs' } | { type: 'steps'; linear?: boolean }
  variables?: SdFormGenericVariable[];        // { key, label }
  validations?: SdFormGenericValidation[];    // { type: 'filter', filter: Filter, message, alert } | { type: 'function', validator, alert }
}
interface SdFormGenericPage { id: string; label?: string; icon?: string; rules?: { visible?: Filter; hidden?: Filter }; elements: SdFormGenericPageElement[] }
type SdFormGenericPageElement = SdFormGenericGroup | SdFormGenericElement;
interface SdFormGenericGroup {                // luôn chiếm trọn một hàng; không lồng group
  id: string; type: 'group'; label: string; icon?: string; color?: Color; collapsible?: boolean;
  hidden?: boolean; rules?: { visible?: Filter; hidden?: Filter }; elements: SdFormGenericElement[];
}
type SdFormGenericElement = SdFormGenericField;   // đợt 2 thêm SdFormGenericStatic | SdFormGenericButton; đợt 3 thêm SdFormGenericTable
```

Field giữ tên type hiện có (D-012): `textfield` (subtype text | email | phone | url | password), `textarea`, `number` (subtype integer | decimal | currency | percent, precision, currency), `select` (multiple), `radio` (direction), `checkbox`, `datetime` (subtype date | datetime), `chip-string`, `chip-calendar`, `upload` (accept file | image, source, extensions, maxFiles, maxSizeMb, params), `html` (content, definition, variables, query). Mọi field có `id`, `key`, `label`, `placeholder?`, `helperText?`, `defaultValue?`, `layout?`, `rules?`, `validation?`, `disabled?`, `viewed?`, `hidden?`, `hyperlink?` (select/radio khi chỉ xem).

```ts
interface SdFormGenericLayout { span?: { desktop?: number; tablet?: number; mobile?: number }; newRow?: boolean }   // 1–12
export const SD_FORM_GENERIC_BREAKPOINTS = { tablet: 600, desktop: 1024 } as const;   // px, bề rộng form
type SdFormGenericBreakpoint = 'mobile' | 'tablet' | 'desktop';
interface SdFormGenericRules { visible?: Filter; hidden?: Filter; disabled?: Filter; required?: Filter }
interface SdFormGenericFieldValidation {
  required?: boolean; min?: number | 'today'; max?: number | 'today'; minLength?: number; maxLength?: number;
  pattern?: { value: string; message?: string }; maxItems?: number; phoneCountry?: 'VN';
}
type SdFormGenericOptions =
  | { source: 'static'; items: SdFormGenericOption[] }
  | { source: 'catalog'; catalog: string; params?: { name: string; value: SdFormGenericValueRef }[]; fill?: { field: string; from: string }[] };
interface SdFormGenericOption { value: string; label: string; disabled?: boolean }
type SdFormGenericValueRef = { field: string } | { variable: string } | { value: string | number | boolean };
```

### Quy tắc đánh giá

- **Mức bố cục:** renderer đo bề rộng lưới của form (ResizeObserver đang có) và chọn mức theo `SD_FORM_GENERIC_BREAKPOINTS` (hoặc giá trị ghi đè của provider); `[breakpoint]` khác null thì ép mức. Span: desktop = `span.desktop ?? 12`; tablet = `span.tablet ?? desktop`; mobile = `span.mobile ?? 12`. `newRow` luôn mở hàng mới; hàng xếp tham lam theo 12 cột như hiện nay; canvas và renderer dùng chung một hàm.
- **Điều kiện:** hiển thị khi (`visible` vắng hoặc đúng) và (`hidden` vắng hoặc sai) và `hidden` tĩnh không bật; `disabled`/`required` là OR với cờ tĩnh. Filter được đánh giá trên `{ ...value, ...variables }`. Field bị ẩn không đăng ký control nên không bị kiểm tra; giá trị cũ vẫn giữ trong `value`.
- **Catalog:** `params` được giải tham chiếu mỗi khi giá trị nguồn đổi và gọi `load(params, ctx)`, hoặc `search(term, params, ctx)` khi catalog có tìm kiếm; `fill` ghi `item.data[from]` vào field đích khi người dùng chọn.

### Component và cấu hình

- `<sd-form-render [schema] [(value)] [form] [variables] [viewed] [breakpoint] [labelPlacement] [keys] (sdAction)>` — `value` là `model()`, luôn phát object mới; method `validate(): Promise<{ valid; messages: { error: string[]; warning: string[] } }>` và `upload()`; `(sdAction)`, `submit()`, `reset()` có hiệu lực ở đợt 2 (D-014).
- `<sd-form-builder [(schema)]>` — `schema` là `model()`; nhận lại đúng schema vừa phát thì bỏ qua (giữ lịch sử); `getSchema()` trả bản clone.
- `provideSdFormGeneric({ catalogs?, templates?, htmlDefinitions?, validators?, breakpoints? })` → EnvironmentProviders, thay cho `SD_FORM_GENERIC_CONFIGURATION.form` cũ.
- `SdFormRenderService.viewEntities(schema, entities)` giữ vai trò cũ trên schema mới.

### Builder

Giữ lớp tương tác đã có (kéo-thả Pointer Events, resize theo lưới, lịch sử undo/redo, inspector theo tab, palette, preset, đổi mã có xác nhận, toast hoàn tác xoá) và chuyển lớp state/document/layout/reference sang model mới. Thanh công cụ có Desktop | Tablet | Mobile; resize và inspector ghi span của mức đang xem; mức đang kế thừa hiển thị nhãn "Theo Desktop" (tablet) hoặc "Mặc định" (mobile); tab Bố cục có "Bắt đầu hàng mới" thay cho ngắt dòng. Điều kiện và validation cấp form sửa bằng `sd-query-builder` và lưu thẳng `Filter`. Xem trước dùng `sd-form-render` với `[breakpoint]` theo mức đang chọn (khung tablet 768px, mobile 390px).

## Stack profile and technology assumptions

- Track: angular
- Stack profile: core-ui-angular
- Profile evidence: repo là mã nguồn package `@sdcorejs/angular` (`versions/v19/projects/sdcorejs-angular`); showcase và sandbox import `@sdcorejs/angular`; `.sdcorejs/summary.md` ghi `stack_profiles: [core-ui-angular]`.
- Technology assumptions: Angular 19 standalone + signals (explicit); `@sdcorejs/utils` 1.2.4 `Filter` / `FilterUtilities` (1.1.4 lúc lập spec r1; nhánh đã merge origin/main) (explicit, hành vi toán tử cần test — A-002); `sd-query-builder`, `sd-section`, Angular Material/CDK có sẵn (explicit); không thêm dependency mới (defaulted); nguồn canonical `versions/v19`, rollout v20/v21/v22 bằng `npm run sync` (explicit); cài đặt/build/test bằng Node 22.22.3 (explicit).

## File structure

- `versions/v19/projects/sdcorejs-angular/components/form-generic/src/models/**` - edit: thay bằng model v1 (schema, page, group, field, layout, rules, validation, options, value ref, cấu hình)
- `versions/v19/projects/sdcorejs-angular/components/form-generic/src/configurations/**` - edit: `provideSdFormGeneric`, token cấu hình, `SD_FORM_GENERIC_BREAKPOINTS`
- `versions/v19/projects/sdcorejs-angular/components/form-generic/src/layout/**` - create: chọn mức breakpoint, kế thừa span, xếp hàng dùng chung cho canvas và renderer
- `versions/v19/projects/sdcorejs-angular/components/form-generic/src/rules/**` - create: đánh giá rules/validation bằng Filter, duyệt và đổi tham chiếu có cấu trúc
- `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-render/**` - edit: API mới, bố cục 3 mức, catalog, không mutate
- `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/**` - edit: state/document/commands/layout/palette/references/inspector/canvas/preview trên model mới, 3 viewport, newRow
- `versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/**` - delete
- `versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/**`, `src/services/**`, `src/presets/**` - edit: bỏ pipe expression cũ, chuyển các pipe/service/preset còn lại sang model mới
- `versions/v19/projects/sdcorejs-angular/components/form-generic/index.ts` và `src/components/index.ts` - edit: export công khai mới
- `versions/v19/projects/sdcorejs-angular/components/form-generic/sd-form-generic.md` - edit: viết lại tài liệu
- `versions/v19/projects/sdcorejs-angular/i18n/src/{vi,en,ko,ja,zh}.ts` - edit: key mới (Tablet, kế thừa span, hàng mới), bỏ key không còn dùng
- `showcase/src/app/pages/components/form-generic/**` và `showcase/src/app/docs/generated/**` - edit: demo trên schema mới, sinh lại example sources
- `CHANGELOG.md` - edit: mục BREAKING trong [Unreleased]
- `versions/v20/**`, `versions/v21/**`, `versions/v22/**` - edit bằng `npm run sync` (không sửa tay)

## Acceptance criteria

- AC-001 - Builder phát (schemaChange) sau một thay đổi của người dùng. Kết quả mong đợi: JSON là SdFormGenericSchema hợp lệ: có pages, không có schemaVersion, không có phần tử break, mọi phần tử có id, field có key duy nhất. (automated; phủ R-001)
- AC-002 - Renderer hiển thị field span { desktop: 6 } ở bề rộng form 1100px, 800px và 480px. Kết quả mong đợi: Hai field/hàng ở 1100px và 800px (tablet kế thừa desktop); xếp chồng ở 480px (mobile mặc định 12). (automated; phủ R-002)
- AC-003 - Portal ghi đè breakpoints { tablet: 700 } rồi render form rộng 650px. Kết quả mong đợi: Form dùng mức mobile; các giá trị không ghi đè giữ mặc định SD_FORM_GENERIC_BREAKPOINTS. (automated; phủ R-002)
- AC-004 - Một field có layout.newRow: true đứng sau field span 4 trong cùng group. Kết quả mong đợi: Field đó bắt đầu hàng mới dù hàng trước còn chỗ; canvas và renderer xếp giống nhau. (automated; phủ R-002)
- AC-005 - Field có rules.visible là Filter { field: agree, operator: EQUAL, data: true }, rules.required dựa trên field khác và rules.disabled dựa trên biến. Kết quả mong đợi: Ẩn/hiện, bắt buộc và vô hiệu đổi theo giá trị và biến ngay khi chúng thay đổi; field ẩn không bị kiểm tra; Filter ngày tương đối được hỗ trợ. (automated; phủ R-003)
- AC-006 - Gọi validate() khi có validation cấp form (Filter, alert error và warning) và một validator hàm đăng ký ở portal. Kết quả mong đợi: Trả { valid, messages: { error[], warning[] } } — không bao giờ undefined; validator hàm nhận giá trị form; lỗi error làm valid = false. (automated; phủ R-003, R-007)
- AC-007 - Nhập giá trị sai cho các preset email, phone (VN và quốc tế), url, integer, decimal, currency, percent và các ràng buộc minLength/maxLength/pattern/maxItems. Kết quả mong đợi: Mỗi trường báo đúng lỗi như bản hiện tại; password không bao giờ nhận defaultValue và hiển thị mặt nạ khi chỉ xem. (automated; phủ R-004)
- AC-008 - Select dùng options catalog với params [{ name: provinceId, value: { field: city } }] và fill [{ field: note, from: name }]. Kết quả mong đợi: load() nhận params đã giải tham chiếu; đổi city thì tải lại danh mục; chọn một mục thì điền note; catalog có search thì tìm theo từ khoá; options static hiển thị items đúng thứ tự. (automated; phủ R-005, R-006)
- AC-009 - Truyền [(value)] là object đã deep-freeze cùng schema có defaultValue rồi nhập dữ liệu. Kết quả mong đợi: Không lỗi, input không bị sửa; valueChange phát object mới; defaultValue chỉ áp cho key chưa có giá trị và không áp ở chế độ chỉ xem. (automated; phủ R-007)
- AC-010 - Đặt [breakpoint]="mobile" cho renderer đang rộng 1200px, rồi đặt lại null. Kết quả mong đợi: Bố cục dùng span mobile khi ép; khi null quay về mức đo theo bề rộng form. (automated; phủ R-007)
- AC-011 - Gọi upload() khi field upload có tệp chờ và có params tham chiếu field khác. Kết quả mong đợi: Các tệp được tải lên với tham số đã giải tham chiếu và value nhận kết quả. (automated; phủ R-007, R-009)
- AC-012 - Trong builder chuyển sang Tablet và kéo resize một field từ 6 xuống 4, rồi xoá giá trị tablet ở inspector. Kết quả mong đợi: Chỉ span.tablet đổi; desktop/mobile giữ nguyên; mức kế thừa hiện nhãn "Theo Desktop"; xoá thì quay về kế thừa. (automated; phủ R-008)
- AC-013 - Builder nhận lại đúng schema vừa phát ([(schema)] vòng về) rồi nhận một schema khác nội dung. Kết quả mong đợi: Vòng về không reset lịch sử undo/selection; schema khác nội dung nạp lại và reset lịch sử. (automated; phủ R-008)
- AC-014 - Bật "Bắt đầu hàng mới" ở tab Bố cục của một field và dùng Xem trước ở cả 3 mức. Kết quả mong đợi: Canvas và Xem trước xếp hàng giống nhau ở từng mức; Xem trước ép đúng mức đang chọn. (automated; phủ R-008)
- AC-015 - Đổi mã một field được tham chiếu trong rules (Filter field và so sánh field–field), options.params, options.fill, upload params, html query và validation cấp form. Kết quả mong đợi: Mọi tham chiếu có cấu trúc chuyển sang mã mới; tham chiếu trong chuỗi tự do (hyperlink, nội dung HTML) giữ nguyên và được đếm trong câu xác nhận. (automated; phủ R-009)
- AC-016 - Gọi SdFormRenderService.viewEntities(schema, entities). Kết quả mong đợi: Trả giá trị hiển thị theo từng field (nhãn lựa chọn, ngày, số theo preset) giống bản hiện tại. (automated; phủ R-009)
- AC-017 - Chạy public-api.spec.ts và lệnh kiểm tài liệu tự động (lấy danh sách export runtime và export đã bỏ từ public-api.spec.ts). Kết quả mong đợi: Entry chỉ còn đúng bề mặt runtime của hợp đồng v1; SdFeelExpression và các export cũ không còn; CHANGELOG [Unreleased] có mục BREAKING nhắc từng export đã bỏ kèm ví dụ trước/sau; sd-form-generic.md nhắc mọi export runtime. (automated; phủ R-010)
- AC-018 - Chạy full suite v19 có coverage, lint, check:i18n, check:i18n-parity, check:scss-hex, rồi npm run sync và check:sync. Kết quả mong đợi: Tất cả xanh; v22 giữ LF. (automated; phủ R-011)
- AC-019 - Chạy test component tự động: sd-form-builder ở chế độ Desktop/Tablet/Mobile, sd-form-render ở bề rộng form 1100px, 800px và 480px, và test của demo showcase. Kết quả mong đợi: DOM cho thấy span đúng theo mức, nhãn kế thừa "Theo Desktop"/"Mặc định", field newRow bắt đầu hàng mới, demo showcase chạy trên API mới và không có lỗi console; ảnh chụp thật là UAT tùy chọn ngoài gate. (automated; phủ R-008, R-011)

## Risks & mitigations

- **Risk:** Khối lượng viết lại lớn (model, state, renderer, builder) -> **Mitigation:** giữ lớp tương tác sẵn có (A-003), TDD cho logic trước, chia plan theo lát dọc chạy được.
- **Risk:** Package public trên npm, đổi schema là BREAKING -> **Mitigation:** mục BREAKING kèm ví dụ trước/sau trong CHANGELOG; tài liệu viết lại (A-001).
- **Risk:** `FilterUtilities.evaluate` thiếu hoặc khác hành vi toán tử -> **Mitigation:** test từng toán tử trước; lớp bù nhỏ trong module nếu cần (A-002).
- **Risk:** Canvas thiết kế hẹp hơn mức desktop làm Xem trước sai mức -> **Mitigation:** `[breakpoint]` ép mức cho Xem trước; khung tablet/mobile cố định.
- **Risk:** Table tạm vắng giữa đợt 1 và đợt 3 -> **Mitigation:** 3.0 chưa phát hành; không tag trước khi đợt 3 xong (D-015).
- **Risk:** Lần rollout v20–v22 trước còn lỗi và máy dev hay quá tải -> **Mitigation:** xử lý lỗi rollout trước bước kiểm chứng; chạy Karma theo nhóm rồi mới full suite.
- **Risk:** Kiểm tra DOM tự động không bắt được lỗi thuần thị giác (màu, khoảng cách, cắt chữ) -> **Mitigation:** test DOM kiểm span, nhãn kế thừa, newRow và lỗi console ở cả 3 mức; ảnh chụp thật vẫn là UAT tùy chọn trước khi phát hành 3.0 (D-024).

## Out of scope (deferred)

- Phần tử Tĩnh (heading, paragraph, quote, image, link, divider, notice), button với `(sdAction)`, `submit()`/`reset()` - defer until đợt 2
- Tabs, Steps (`linear`), container Table nhập dòng qua drawer, nhóm palette Tĩnh/Cấu trúc, tab Sơ đồ - defer until đợt 3
- Kiểu checklist (checkbox-group) - defer until có nhu cầu thực tế (A-004)
- Sửa dòng trực tiếp trong bảng (`edit: inline`) - defer until sau đợt 3 nếu có yêu cầu
