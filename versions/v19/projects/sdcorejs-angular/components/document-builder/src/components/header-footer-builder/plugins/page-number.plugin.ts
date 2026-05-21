import { Plugin, ButtonView } from 'ckeditor5';
import { I18nService } from '@sdcorejs/angular/i18n';

export class PageNumberPlugin extends Plugin {
  init() {
    const editor = this.editor;
    // i18n náº±m trong editor.config â€” plugin khÃ´ng cÃ³ DI nÃªn Ä‘á»c qua config; Angular wrapper luÃ´n truyá»n _i18n
    const i18n = (editor.config as { get(key: string): unknown }).get('_i18n') as I18nService | undefined;
    // 1. ÄÄƒng kÃ½ nÃºt "Sá»‘ trang hiá»‡n táº¡i"
    editor.ui.componentFactory.add('pageNumber', locale => {
      const view = new ButtonView(locale);

      view.set({
        label: i18n?.t('core.component.document-builder.page-number.current') ?? '',
        icon: '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M16 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H4V4h12v12zM6 6h2v2H6zm0 4h2v2H6zm0 4h2v2H6zm4-8h4v2h-4zm0 4h4v2h-4zm0 4h4v2h-4z"/></svg>', // Icon Ä‘Æ¡n giáº£n
        tooltip: true
      });

      // Khi báº¥m nÃºt -> ChÃ¨n HTML Ä‘Ã¡nh dáº¥u
      view.on('execute', () => {
        editor.model.change(writer => {
          const viewFragment = editor.data.processor.toView(
            // ÄÃ¢y lÃ  HTML chuáº©n Ä‘á»ƒ Word hiá»ƒu lÃ  sá»‘ trang (dÃ¹ng cho cÃ¡ch xuáº¥t MHTML/.doc)
            // Hoáº·c lÃ  marker Ä‘á»ƒ Backend replace
            '<span class="page-number-marker" style="mso-field-code: PAGE; background: #eee; border: 1px dashed #999; padding: 0 4px;">[PAGE]</span> ' 
          );
          const modelFragment = editor.data.toModel(viewFragment);
          editor.model.insertContent(modelFragment);
        });
      });
      return view;
    });

    // 2. ÄÄƒng kÃ½ nÃºt "Tá»•ng sá»‘ trang"
    editor.ui.componentFactory.add('totalPages', locale => {
      const view = new ButtonView(locale);

      view.set({
        label: i18n?.t('core.component.document-builder.page-number.total') ?? '',
        icon: '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>',
        tooltip: true
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
