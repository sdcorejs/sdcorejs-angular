import { Plugin } from 'ckeditor5';

/**
 * Plugin để thêm margin-bottom: 4px cho các block elements
 * (paragraph, heading, list, table) thông qua downcast conversion
 */
export class BlockSpace extends Plugin {
  static get pluginName() {
    return 'BlockSpace';
  }

  init() {
    const editor = this.editor;
    const conversion = editor.conversion;

    // Handler factory để áp dụng margin-bottom: 4px
    const makeHandler = (elementType: string) => {
      return (evt: any, data: any, conversionApi: any) => {
        const viewElement = conversionApi.mapper.toViewElement(data.item);
        if (viewElement) {
          conversionApi.writer.setStyle('margin-top', '0', viewElement);
          conversionApi.writer.setStyle('margin-bottom', '6pt', viewElement);
          conversionApi.writer.setStyle('padding-top', '0', viewElement);
          conversionApi.writer.setStyle('padding-bottom', '0', viewElement);
          conversionApi.writer.setStyle('line-height', '1.15', viewElement);
        }
      };
    };

    // Áp dụng margin-bottom cho tất cả block elements
    conversion.for('downcast').add(dispatcher => {
      // Paragraph
      dispatcher.on('insert:paragraph', makeHandler('paragraph'), { priority: 'low' });

      // Heading (h1-h6)
      ['heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6'].forEach(heading => {
        dispatcher.on(`insert:${heading}`, makeHandler(heading), { priority: 'low' });
      });

      // Table
      dispatcher.on('insert:table', makeHandler('table'), { priority: 'low' });

      // PageBreak - add page-break-before style
      dispatcher.on(
        'insert:pageBreak',
        (evt: any, data: any, conversionApi: any) => {
          const viewElement = conversionApi.mapper.toViewElement(data.item);
          if (viewElement) {
            conversionApi.writer.setStyle('page-break-before', 'always', viewElement);
          }
        },
        { priority: 'low' }
      );
    });
  }
}
