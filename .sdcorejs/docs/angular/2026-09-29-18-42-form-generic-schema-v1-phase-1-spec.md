# Spec - Form generic schema v1 — Đợt 1: nền - 2026-09-29 18:42

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
          Schema gốc SdFormGenericSchema là phiên bản đầu tiên (không schemaVersion, không chuyển đổi từ SdFormGeneric cũ) theo ngữ pháp cố
          định Form → pages → group → element; phần tử phân loại bằng `type`; chừa sẵn shape cho static/button (đợt 2) và tabs/steps/table
          (đợt 3).
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs: []
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
        task_refs: []
      - id: R-003
        type: requirement
        statement: >-
          Điều kiện rules { visible, hidden, disabled, required } lưu bằng Filter của @sdcorejs/utils và đánh giá bằng
          FilterUtilities.evaluate trên giá trị form + biến; validation cấp form dùng Filter hoặc hàm đăng ký ở portal.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs: []
      - id: R-004
        type: requirement
        statement: >-
          Validation của field chuẩn hoá { required, min, max, minLength, maxLength, pattern { value, message }, maxItems, phoneCountry };
          giữ nguyên các preset text (email, phone, url, password) và number (integer, decimal, currency, percent) cùng kiểm tra của chúng.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs: []
      - id: R-005
        type: requirement
        statement: >-
          Nguồn lựa chọn options = { source: static, items } | { source: catalog, catalog, params, fill } với SdFormGenericValueRef có cấu
          trúc; multiple là thuộc tính field; portal đăng ký catalog { id, label, params, fields, load, search? }.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs: []
      - id: R-006
        type: requirement
        statement: >-
          Cấu hình portal gom về provideSdFormGeneric({ catalogs, templates, htmlDefinitions, validators, breakpoints }) thay cho
          SD_FORM_GENERIC_CONFIGURATION.form cũ.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs: []
      - id: R-007
        type: requirement
        statement: >-
          sd-form-render có API [schema], [(value)] (model, không mutate input), [form], [variables], [viewed], [breakpoint],
          [labelPlacement], [keys]; method validate() trả { valid, messages } và upload(); defaultValue khai báo theo field.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs: []
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
        task_refs: []
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
        task_refs: []
      - id: R-010
        type: requirement
        statement: >-
          Bỏ sd-feel-expression, model expression cũ và phần tử break; CHANGELOG ghi mục BREAKING có ví dụ trước/sau; sd-form-generic.md
          viết lại cho schema mới; showcase chạy trên schema mới; i18n đủ 5 ngôn ngữ.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs: []
      - id: R-011
        type: requirement
        statement: >-
          Kiểm chứng: TDD cho phần logic, test sau cho giao diện kèm ảnh chụp thật; full suite v19 có coverage, lint, check:i18n,
          check:i18n-parity, check:scss-hex xanh; rollout v20/v21/v22 bằng npm run sync và check:sync xanh.
        source: explicit-user
        status: active
        owner_repository_id: sdcorejs-angular
        owner_module_id: components/form-generic
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
      - id: AC-017
        type: acceptance-criterion
        statement: >-
          Kiểm tra public API và tài liệu sau thay đổi → SdFeelExpression và các export expression cũ không còn; CHANGELOG [Unreleased] có
          mục BREAKING kèm ví dụ trước/sau; sd-form-generic.md mô tả schema mới
        behavior: Kiểm tra public API và tài liệu sau thay đổi
        expected_result: >-
          SdFeelExpression và các export expression cũ không còn; CHANGELOG [Unreleased] có mục BREAKING kèm ví dụ trước/sau;
          sd-form-generic.md mô tả schema mới
        verification_kind: manual
        blocking: true
        requirement_refs:
          - R-010
        task_refs: []
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
        task_refs: []
      - id: AC-019
        type: acceptance-criterion
        statement: >-
          Chụp ảnh thật builder ở Desktop/Tablet/Mobile và renderer ở 3 bề rộng form → Ảnh cho thấy span theo mức, nhãn kế thừa, newRow và
          không có lỗi console
        behavior: Chụp ảnh thật builder ở Desktop/Tablet/Mobile và renderer ở 3 bề rộng form
        expected_result: Ảnh cho thấy span theo mức, nhãn kế thừa, newRow và không có lỗi console
        verification_kind: manual
        blocking: true
        requirement_refs:
          - R-008
          - R-011
        task_refs: []
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
          FilterUtilities.evaluate của @sdcorejs/utils 1.1.4 xử lý đủ toán tử mà sd-query-builder sinh ra (so sánh, like, IN, BETWEEN, NULL,
          ngày tương đối, so sánh field–field).
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
      - id: D-011
        type: decision
        statement: Cách test? → TDD cho logic; viết test sau cho giao diện kèm ảnh chụp thật
        question: Cách test?
        selected_value: TDD cho logic; viết test sau cho giao diện kèm ảnh chụp thật
        source: explicit-user
        status: approved
        blocking: true
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
        task_refs: []
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
  supersedes: null
  target_root: .
  target_root_kind: target-project
  owner_repository_id: sdcorejs-angular
  owner_repository_role: library
  owner_module_id: components/form-generic
  execution_host_repository_id: sdcorejs-angular
  track: angular
  stack_profile: core-ui-angular
  profile_confidence: high
  source_requirement_context: form-generic-schema-v1 (sdcorejs-brainstorming, người dùng duyệt 2026-09-29)
  acceptance_criteria_count: 19
  manual_criteria_count: 2
  non_goals:
    - Cây container tự do, tabs trong group, danh sách lồng nhau
    - Sửa dòng trực tiếp trong bảng
    - Nội dung động trong heading/paragraph
    - Hàm chuyển đổi schema cũ, schemaVersion
    - Tác vụ lưu/nháp/xuất trong builder
  risks:
    - Khối lượng viết lại lớn
    - Package public trên npm — BREAKING
    - Canvas hẹp hơn mức desktop
    - Rollout v20–v22 lần trước còn lỗi
  assumptions:
    - A-001 Chưa có consumer nào dùng schema SdFormGeneric hay API form-generic hiện tại.
    - >-
      A-002 FilterUtilities.evaluate của @sdcorejs/utils 1.1.4 xử lý đủ toán tử mà sd-query-builder sinh ra (so sánh, like, IN, BETWEEN,
      NULL, ngày tương đối, so sánh field–field).
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
    revision: 1
    supersedes: null
    change_reason: null
```

## Problem & Goals

`sd-form-builder` / `sd-form-render` dùng schema `SdFormGeneric` với nhiều điểm khó hiểu và khó mở rộng: cột lẫn chuỗi và số, phần tử `break` ẩn, biểu thức điều kiện riêng (`SdFormGenericExpression`) phải chuyển qua lại với `Filter` của query builder, nguồn lựa chọn rải ở `values` / `valuesKey` / `properties.query` / `properties.setVariables`, renderer ghi ngược vào `entity` của consumer, và chỉ có hai mức bố cục desktop/mobile.

Mục tiêu của chương trình `form-generic-schema-v1` là một schema phiên bản đầu tiên, gọn, có cấu trúc, đủ chỗ cho các phần tử Tĩnh, Nút và Cấu trúc (Tabs, Steps, Table). **Đợt 1** (spec này) dựng nền: model mới, bố cục 3 mức theo bề rộng form, điều kiện bằng `Filter`, nguồn lựa chọn mới, cấu hình portal, API component mới — và đưa renderer + builder lên schema mới với đầy đủ chức năng hiện có cho các field và group.

Người dùng: đội phát triển portal (thiết kế form bằng builder, render bằng renderer) và người dùng nghiệp vụ điền form. Thành công khi form hiện có dựng lại được trên schema mới, hiển thị đúng ở desktop/tablet/mobile, và API không còn mutate dữ liệu của consumer.

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
- R-011 - Kiểm chứng: TDD cho phần logic, test sau cho giao diện kèm ảnh chụp thật; full suite v19 có coverage, lint, check:i18n, check:i18n-parity, check:scss-hex xanh; rollout v20/v21/v22 bằng npm run sync và check:sync xanh. (nguồn: explicit-user, trạng thái: active, sở hữu: sdcorejs-angular / components/form-generic)

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
- D-011 - Cách test? **TDD cho logic; viết test sau cho giao diện kèm ảnh chụp thật**. Nguồn: explicit-user; trạng thái: approved; phạm vi: repository; sở hữu: sdcorejs-angular. Lý do: Logic model/rules/layout rủi ro cao; UI cần kiểm chứng trực quan. Thay thế: không.
- D-012 - Tên type của field và container? **Giữ tên type field hiện có (textfield, textarea, number, select, radio, checkbox, datetime, chip-string, chip-calendar, upload, html); container giữ type group**. Nguồn: approved-spec; trạng thái: proposed (duyệt cùng spec); phạm vi: public-contract; sở hữu: sdcorejs-angular. Lý do: Giảm thay đổi không cần thiết; người dùng quen tên Group. Thay thế: không.
- D-013 - Form một trang lưu thế nào? **Luôn là pages: [ … ] (một phần tử khi không dùng tabs/steps); builder ẩn khái niệm trang ở chế độ một trang**. Nguồn: approved-spec; trạng thái: proposed (duyệt cùng spec); phạm vi: public-contract; sở hữu: sdcorejs-angular. Lý do: Một shape duy nhất, đợt 3 thêm tabs/steps không đổi schema. Thay thế: không.
- D-014 - validate() thuộc đợt nào? **Đợt 1 (thay getValidationMessages để giữ chức năng); submit()/reset() và (sdAction) có hiệu lực ở đợt 2 cùng button**. Nguồn: approved-spec; trạng thái: proposed (duyệt cùng spec); phạm vi: public-contract; sở hữu: sdcorejs-angular. Lý do: Validation cấp form đang có phải chạy được ngay đợt 1. Thay thế: không.
- D-015 - Table ở đợt 1? **Chưa hỗ trợ; shape container table chừa sẵn và làm ở đợt 3**. Nguồn: approved-spec; trạng thái: proposed (duyệt cùng spec); phạm vi: module; sở hữu: sdcorejs-angular. Lý do: Table đổi hẳn sang cột là field con; làm hai lần sẽ phí công. Bản 3.0 chưa phát hành nên tạm thiếu Table giữa các đợt là chấp nhận được. Thay thế: không.
- D-016 - Giới hạn field được render (input properties cũ)? **Giữ, đổi tên thành [keys] (danh sách key field được render)**. Nguồn: approved-spec; trạng thái: proposed (duyệt cùng spec); phạm vi: public-contract; sở hữu: sdcorejs-angular. Lý do: Giữ chức năng hiện có với tên rõ nghĩa. Thay thế: không.

## Assumptions

- A-001 - Chưa có consumer nào dùng schema SdFormGeneric hay API form-generic hiện tại. Nguồn: explicit; độ tin cậy: medium; trạng thái: confirmed; chặn: không. Nếu sai: Consumer ẩn (package public trên npm) sẽ vỡ khi nâng lên 3.0. Kiểm chứng: Mục BREAKING trong CHANGELOG kèm ví dụ trước/sau; người dùng xác nhận trong brainstorming. Người chịu trách nhiệm: user.
- A-002 - FilterUtilities.evaluate của @sdcorejs/utils 1.1.4 xử lý đủ toán tử mà sd-query-builder sinh ra (so sánh, like, IN, BETWEEN, NULL, ngày tương đối, so sánh field–field). Nguồn: inferred; độ tin cậy: medium; trạng thái: proposed; chặn: không. Nếu sai: Một số điều kiện không đánh giá đúng; cần lớp bù nhỏ trong module. Kiểm chứng: Test TDD cho từng toán tử trước khi viết renderer. Người chịu trách nhiệm: sdcorejs-execute-plan.
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
- Technology assumptions: Angular 19 standalone + signals (explicit); `@sdcorejs/utils` 1.1.4 `Filter` / `FilterUtilities` (explicit, hành vi toán tử cần test — A-002); `sd-query-builder`, `sd-section`, Angular Material/CDK có sẵn (explicit); không thêm dependency mới (defaulted); nguồn canonical `versions/v19`, rollout v20/v21/v22 bằng `npm run sync` (explicit); cài đặt/build/test bằng Node 22.22.3 (explicit).

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
- AC-017 - Kiểm tra public API và tài liệu sau thay đổi. Kết quả mong đợi: SdFeelExpression và các export expression cũ không còn; CHANGELOG [Unreleased] có mục BREAKING kèm ví dụ trước/sau; sd-form-generic.md mô tả schema mới. (manual; phủ R-010)
- AC-018 - Chạy full suite v19 có coverage, lint, check:i18n, check:i18n-parity, check:scss-hex, rồi npm run sync và check:sync. Kết quả mong đợi: Tất cả xanh; v22 giữ LF. (automated; phủ R-011)
- AC-019 - Chụp ảnh thật builder ở Desktop/Tablet/Mobile và renderer ở 3 bề rộng form. Kết quả mong đợi: Ảnh cho thấy span theo mức, nhãn kế thừa, newRow và không có lỗi console. (manual; phủ R-008, R-011)

## Risks & mitigations

- **Risk:** Khối lượng viết lại lớn (model, state, renderer, builder) -> **Mitigation:** giữ lớp tương tác sẵn có (A-003), TDD cho logic trước, chia plan theo lát dọc chạy được.
- **Risk:** Package public trên npm, đổi schema là BREAKING -> **Mitigation:** mục BREAKING kèm ví dụ trước/sau trong CHANGELOG; tài liệu viết lại (A-001).
- **Risk:** `FilterUtilities.evaluate` thiếu hoặc khác hành vi toán tử -> **Mitigation:** test từng toán tử trước; lớp bù nhỏ trong module nếu cần (A-002).
- **Risk:** Canvas thiết kế hẹp hơn mức desktop làm Xem trước sai mức -> **Mitigation:** `[breakpoint]` ép mức cho Xem trước; khung tablet/mobile cố định.
- **Risk:** Table tạm vắng giữa đợt 1 và đợt 3 -> **Mitigation:** 3.0 chưa phát hành; không tag trước khi đợt 3 xong (D-015).
- **Risk:** Lần rollout v20–v22 trước còn lỗi và máy dev hay quá tải -> **Mitigation:** xử lý lỗi rollout trước bước kiểm chứng; chạy Karma theo nhóm rồi mới full suite.

## Out of scope (deferred)

- Phần tử Tĩnh (heading, paragraph, quote, image, link, divider, notice), button với `(sdAction)`, `submit()`/`reset()` - defer until đợt 2
- Tabs, Steps (`linear`), container Table nhập dòng qua drawer, nhóm palette Tĩnh/Cấu trúc, tab Sơ đồ - defer until đợt 3
- Kiểu checklist (checkbox-group) - defer until có nhu cầu thực tế (A-004)
- Sửa dòng trực tiếp trong bảng (`edit: inline`) - defer until sau đợt 3 nếu có yêu cầu
