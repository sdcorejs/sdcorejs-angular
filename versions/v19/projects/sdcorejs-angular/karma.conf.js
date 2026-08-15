// Karma configuration for sd-angular library

// ─── Jasmine random seed ──────────────────────────────────────────────────────
// Jasmine chạy spec theo thứ tự ngẫu nhiên. Không có seed in ra thì một run đỏ trên
// CI KHÔNG BÁO CÁO LẠI ĐƯỢC — không ai biết thứ tự nào đã gây ra lỗi.
// Seed lấy từ env `JASMINE_SEED`; nếu trống thì sinh ở ĐÂY (Node) chứ không để Jasmine
// tự sinh trong browser, vì chỉ seed sinh ở đây mới in được ra log của mọi run.
//
// ⚠️ CAVEAT — pin seed là CẦN nhưng KHÔNG ĐỦ để replay 1:1.
// Jasmine shuffle dựa trên `spec.id`, mà `spec.id` được gán theo thứ tự các module spec
// được nạp — tức thứ tự module trong bundle do build sinh ra. Bundle đó KHÔNG ổn định
// giữa các lần build (đổi/thêm/xoá file, cache, thứ tự resolve của bundler). Cùng một
// seed trên hai bundle khác nhau => hai thứ tự khác nhau.
// Vì vậy: seed dùng để BÁO CÁO một run đỏ, ĐỪNG giả định `JASMINE_SEED=<x>` là tái hiện
// được 100%. Muốn replay chắc chắn thì phải pin CẢ bundle (cùng commit, cùng cache) rồi
// mới pin seed. Kết luận này đến từ một lần điều tra thật, đừng "sửa" lại thành
// "pin seed là đủ".
const jasmineSeed = process.env['JASMINE_SEED'] || String(Math.floor(Math.random() * 1000000));
console.log(`[karma] Jasmine random seed = ${jasmineSeed}  (re-run with JASMINE_SEED=${jasmineSeed}; see caveat in karma.conf.js)`);

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      jasmine: {
        random: true,
        seed: jasmineSeed,
      },
      clearContext: false,
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter: {
      dir: require('path').join(__dirname, '../../coverage/sd-angular'),
      subdir: '.',
      // Ý định: đếm CẢ file không spec nào import, để thêm test đầu tiên vào một vùng chưa có
      // test KHÔNG làm tụt % (file chưa ai import thì không nằm ở cả tử số lẫn mẫu số).
      //
      // ⚠️ Cờ này là NO-OP ở setup hiện tại — ĐÃ ĐO 2026-08-10: bật/tắt không đổi con số nào.
      // Lý do: instrument do babel-plugin-istanbul chạy TRONG webpack, còn `includeAllSources`
      // của karma-coverage chỉ đọc `globalCoverageMap` mà PREPROCESSOR của chính nó nạp
      // (`karma-coverage/lib/preprocessor.js:164`) — preprocessor đó không hề chạy ở đây.
      // Giữ cờ để khi builder đổi sang cơ chế dùng preprocessor thì đúng ngay.
      //
      // Cách THẬT SỰ có tác dụng: `coverage-includes.spec.ts` (cùng thư mục) dùng
      // `import.meta.webpackContext` kéo mọi file source vào bundle. Đọc comment đầu file đó
      // trước khi sửa — có 3 cái bẫy đã trả giá bằng từng lần chạy.
      //
      // Số đo 2026-08-12, cùng một commit, chỉ khác có/không `coverage-includes.spec.ts`:
      //   không có: 365 file · 22_818 stmt · 79.16 / 68.10 / 76.70 / 80.00
      //   có:       371 file · 22_873 stmt · 79.01 / 68.00 / 76.48 / 79.83
      // Tức là chỉ thêm 6 file (2 attribute-date của form-builder, 4 directive/pipe của table).
      // Ghi chú cũ "405/639 file" gây hiểu sai: 639 là đếm mọi file `.ts`. Trong 576 file không
      // phải spec, 206 file KHÔNG BAO GIỜ vào lcov được vì không sinh code runtime — 161 barrel
      // chỉ re-export + 45 file type-only. Đã verify: 0 file có code runtime bị bỏ sót.
      includeAllSources: true,
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcovonly' },
      ],
      // Thresholds enforced on global aggregate only.
      // Per-file (each) thresholds are intentionally omitted: many library
      // sub-packages (chart, editor, datetime popups, table services) have
      // no tests yet and would generate spurious CI failures.
      //
      // Lịch sử baseline (mỗi mốc là một lần chạy thật `ng test --code-coverage`):
      //   Plan 1+2   (820 tests):  75.19 / 58.09 / 73.9  / 76.82
      //   Plan 3   (1_123 tests):  72.39 / 54.30 / 71.57 / 73.83
      //   Plan 4   (1_313 tests):  69.44 / 53.82 / 70.04 / 70.51
      //   2026-08-10 (4_625 tests):  73.14 / 63.17 / 72.20 / 73.52  trên 405 file
      //   2026-08-12 (4_443 tests):  79.01 / 68.00 / 76.48 / 79.83  trên 371 file
      //     (18072/22873 stmt, 7104/10447 branch, 3445/4504 func, 16150/20230 line)
      //     Số file tụt 405 -> 371 vì branch này xoá `services/docx`, `components/document-builder`
      //     và 15 file re-export của `utilities/**`; % tăng vì phần bị xoá gần như không có test.
      //
      // Threshold = số đo thật trừ ~1pp: đủ chặt để một vùng mất test là đỏ, đủ lỏng để không vỡ
      // vì nhiễu (timing, DOM-heavy spec trong headless). Trước đợt này threshold là
      // 72/62/71/72 — thấp hơn số đo thật ~7pp, tức gate gần như không chặn gì.
      check: {
        global: {
          statements: 78,
          branches: 67,
          functions: 75,
          lines: 78,
        },
      },
    },
    reporters: ['progress', 'kjhtml', 'coverage'],
    // why: từ khi `coverage-includes.spec.ts` kéo TOÀN BỘ source vào bundle (để mẫu số coverage
    // gồm cả file không spec nào import), page load đầu tiên nặng hẳn lên — bundle đã instrument,
    // cộng ckeditor/pdfjs/exceljs/chart.js. Với default (`browserNoActivityTimeout` 30s,
    // `browserDisconnectTimeout` 2s, `pingTimeout` 5s) Chrome bị coi là chết TRƯỚC KHI chạy
    // spec đầu tiên: "Disconnected reconnect failed before timeout of 2000ms (ping timeout)",
    // 0 spec chạy, exit 0 — tức là một run rỗng trông như run xanh. Các mốc dưới đây là để chờ
    // được page load nặng, KHÔNG phải để che spec chậm.
    browserNoActivityTimeout: 180000,
    browserDisconnectTimeout: 60000,
    browserDisconnectTolerance: 2,
    captureTimeout: 180000,
    pingTimeout: 60000,
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadless'],
    customLaunchers: {
      // Dùng trên GitHub Actions (`--browsers=ChromeHeadlessCI`). Chrome trên runner
      // chạy user không đặc quyền + /dev/shm nhỏ, thiếu mấy cờ này thì browser
      // crash/treo ngẫu nhiên và job đỏ oan.
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      },
    },
    singleRun: false,
    restartOnFileChange: true,
  });
};
