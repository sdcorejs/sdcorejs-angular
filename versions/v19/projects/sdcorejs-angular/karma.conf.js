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
      // Ý định: đếm CẢ file không được spec nào import, để thêm test đầu tiên vào một
      // vùng chưa có test KHÔNG làm tụt % (file chưa ai import hiện không nằm ở cả tử
      // số lẫn mẫu số).
      //
      // ⚠️ ĐÃ ĐO: với `@angular-devkit/build-angular:karma` (webpack) cờ này là NO-OP.
      // Chạy full suite trước/sau khi bật, 2026-08-10: vẫn đúng 405 file trong
      // lcov.info, mẫu số statements 24_948 -> 24_949 (chênh 1 là do sửa docx.service.ts,
      // không phải do cờ).
      // Lý do: instrument do babel-plugin-istanbul chạy TRONG webpack, còn
      // `includeAllSources` của karma-coverage chỉ đọc `globalCoverageMap` mà
      // PREPROCESSOR của chính nó nạp (`karma-coverage/lib/preprocessor.js:164`) —
      // preprocessor đó không hề chạy ở setup này. Entry bundle chỉ gồm `**/*.spec.ts`
      // + import bắc cầu (`build-angular/src/builders/karma/find-tests-plugin.js`), nên
      // file không ai import thì không vào bundle => không có gì để đếm.
      //
      // Hệ quả phải nhớ: % dưới đây là trên 405/639 file source, KHÔNG phải toàn bộ repo.
      // Muốn phủ thật thì phải cho mọi file source vào bundle (test entry `main` +
      // `require.context`) — việc đó nằm ở `angular.json`, không phải file này.
      // Giữ cờ để khi builder đổi sang cơ chế dùng preprocessor thì đúng ngay.
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
      // Lịch sử baseline (mỗi lần đo là một lần chạy thật `ng test --code-coverage`):
      //   Plan 1+2   (820 tests):  75.19 / 58.09 / 73.9  / 76.82
      //   Plan 3   (1_123 tests):  72.39 / 54.30 / 71.57 / 73.83
      //   Plan 4   (1_313 tests):  69.44 / 53.82 / 70.04 / 70.51
      //   2026-08-10 (4_595 tests, includeAllSources TẮT):
      //                            72.32 / 62.50 / 71.64 / 72.62  trên 405 file
      //   2026-08-10 (4_625 tests, includeAllSources BẬT + excel/docx spec chạy code
      //     thật thay vì tự stub chính method đang test):
      //                            73.14 / 63.17 / 72.20 / 73.52  trên 405 file
      //     (18249/24949 stmt, 7148/11315 branch, 3436/4759 func, 16360/22250 line)
      //     Phần tăng đến 100% từ hai spec excel/docx — cờ includeAllSources không
      //     đổi được con số nào, xem ghi chú ở trên.
      //
      // Threshold = số đo thật trừ ~1-1.5pp: đủ chặt để một vùng mất test là đỏ,
      // đủ lỏng để không vỡ vì nhiễu (timing, DOM-heavy spec trong headless).
      check: {
        global: {
          statements: 72,
          branches: 62,
          functions: 71,
          lines: 72,
        },
      },
    },
    reporters: ['progress', 'kjhtml', 'coverage'],
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
