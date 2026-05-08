export type SdFormGenericDefinitionHtml = SdFormGenericDefinitionHtmlStatic | SdFormGenericDefinitionHtmlQuery;

interface SdFormGenericDefinitionHtmlStatic {
  type: 'static'
  value: string;
  display: string;
  content: string;
  // Các variables để đơn giản hóa cách nhập liệu html cho người dùng
  // Ví dụ: content: <span>${icon}</span><strong>${title}</strong> thì variables sẽ có 2 phần biến là icon và title
  variables?: { key: string; label: string; value?: string }[];
}

interface SdFormGenericDefinitionHtmlQuery {
  type: 'query';
  value: string;
  display: string;
  queries: { key: string; label: string }[];
  content: (query?: Record<string, any>) => Promise<string>;
  // Các variables để đơn giản hóa cách nhập liệu html cho người dùng
  // Ví dụ: content: <span>${icon}</span><strong>${title}</strong> thì variables sẽ có 2 phần biến là icon và title
  variables?: { key: string; label: string; value?: string }[];
}
