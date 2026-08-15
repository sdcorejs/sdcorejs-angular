import test from 'node:test';
import assert from 'node:assert/strict';
import { findViolations, withoutTypeScriptComments } from '../versions/v19/scripts/check-i18n.mjs';

test('comments do not count as hardcoded Vietnamese', () => {
  const src = ["// Ghi chú tiếng Việt trong comment", "const label = 'plain english';", ''].join('\n');
  assert.equal(findViolations(src).length, 0);
});

test('a Vietnamese string literal counts', () => {
  const src = ["const label = 'Xin chào';", ''].join('\n');
  const violations = findViolations(src);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].line, 1);
});

test('@i18n-ignore on the same line suppresses the finding', () => {
  const src = ["const label = 'Xin chào'; // @i18n-ignore dev-facing", ''].join('\n');
  assert.equal(findViolations(src).length, 0);
});

test('@i18n-ignore on the line above suppresses the finding', () => {
  const src = ['// @i18n-ignore dev-facing console text', "console.warn('Cảnh báo cho dev');", ''].join('\n');
  assert.equal(findViolations(src).length, 0);
});

test('@i18n-ignore covers exactly one line — the next unmarked line still fails', () => {
  const src = ['// @i18n-ignore', "const a = 'Dòng một';", "const b = 'Dòng hai';", ''].join('\n');
  const violations = findViolations(src);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].line, 3);
});

// why: regex literal chứa quote/backtick (vd bảng strip-diacritics của changeAliasLowerCase)
// từng đẩy máy trạng thái vào 'string' vĩnh viễn — mọi comment tiếng Việt phía sau bị đếm
// như code thật (utility.extension.ts đo 37 thay vì 9). Test này khoá đúng ca đó.
test('a regex literal containing quotes and backticks does not poison later comments', () => {
  const src = [
    "const clean = (s) => s.replace(/\\'|\\\"|`|-/g, ' ');",
    '// Comment tiếng Việt phía sau regex — không được đếm',
    "const after = 'still english';",
    '',
  ].join('\n');
  assert.equal(findViolations(src).length, 0);
});

test('division is not mistaken for a regex start', () => {
  const src = ['const ratio = total / count;', "const label = 'Tỷ lệ';", ''].join('\n');
  const violations = findViolations(src);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].line, 2);
});

test('strings survive comment stripping untouched', () => {
  const src = "const a = 'giữ nguyên'; // xoá chỗ này\n";
  const stripped = withoutTypeScriptComments(src);
  assert.ok(stripped.includes('giữ nguyên'));
  assert.ok(!stripped.includes('xoá chỗ này'));
});

test('html comments are ignored, html text nodes are not', () => {
  const src = ['<!-- chú thích tiếng Việt -->', '<span>Nội dung thật</span>', ''].join('\n');
  const violations = findViolations(src, { html: true });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].line, 2);
});
