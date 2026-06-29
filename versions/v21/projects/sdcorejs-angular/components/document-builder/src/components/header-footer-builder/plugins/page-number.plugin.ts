import { Plugin, ButtonView } from 'ckeditor5';
import { DocumentBuilderI18n } from '../../../document-builder.model';

export class PageNumberPlugin extends Plugin {
  init() {
    const editor = this.editor;
    // i18n nằm trong editor.config — plugin không có DI nên đọc qua config; Angular wrapper luôn truyền _i18n
    const i18n = (editor.config as { get(key: string): unknown }).get('_i18n') as DocumentBuilderI18n | undefined;
    // 1. Đăng ký nút "Số trang hiện tại"
    editor.ui.componentFactory.add('pageNumber', locale => {
      const view = new ButtonView(locale);

      view.set({
        label: i18n?.t('core.component.document-builder.page-number.current') ?? '',
        icon: '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M16 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H4V4h12v12zM6 6h2v2H6zm0 4h2v2H6zm0 4h2v2H6zm4-8h4v2h-4zm0 4h4v2h-4zm0 4h4v2h-4z"/></svg>', // Icon đơn giản
        tooltip: true,
      });

      // Khi bấm nút -> Chèn HTML đánh dấu
      view.on('execute', () => {
        editor.model.change(writer => {
          const viewFragment = editor.data.processor.toView(
            // Đây là HTML chuẩn để Word hiểu là số trang (dùng cho cách xuất MHTML/.doc)
            // Hoặc là marker để Backend replace
            '<span class="page-number-marker" style="mso-field-code: PAGE; background: #eee; border: 1px dashed #999; padding: 0 4px;">[PAGE]</span> '
          );
          const modelFragment = editor.data.toModel(viewFragment);
          editor.model.insertContent(modelFragment);
        });
      });
      return view;
    });

    // 2. Đăng ký nút "Tổng số trang"
    editor.ui.componentFactory.add('totalPages', locale => {
      const view = new ButtonView(locale);

      view.set({
        label: i18n?.t('core.component.document-builder.page-number.total') ?? '',
        icon: '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>',
        tooltip: true,
      });

      view.on('execute', () => {
        editor.model.change(writer => {
          const viewFragment = editor.data.processor.toView(
            '<span class="total-page-marker" style="mso-field-code: NUMPAGES; background: #eee; border: 1px dashed #999; padding: 0 4px;">[TOTAL]</span> '
          );
          const modelFragment = editor.data.toModel(viewFragment);
          editor.model.insertContent(modelFragment);
        });
      });
      return view;
    });
  }
}
