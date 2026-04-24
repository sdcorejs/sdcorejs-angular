import { Plugin } from 'ckeditor5';
import { getHeadingOptions } from '../../document-builder.config';

export class HeadingPlugin extends Plugin {
  static get pluginName() {
    return 'HeadingPlugin';
  }

  init() {
    const editor = this.editor;

    editor.conversion.for('editingDowncast').markerToHighlight({
      model: 'highlightMarker',
      view: {
        classes: 'ck-heading-highlight',
      },
    });

    // Lấy default styles từ config
    const headingOptions = getHeadingOptions();
    const headingDefaults: Record<string, { fontSize: string; lineHeight: string }> = {};

    headingOptions?.forEach((opt: any) => {
      if (opt.model?.match(/^heading[1-3]$/)) {
        headingDefaults[opt.model] = {
          fontSize: opt.view?.styles?.['font-size'] || 'inherit',
          lineHeight: opt.view?.styles?.['line-height'] || 'inherit',
        };
      }
    });

    // Downcast: Kiểm tra heading có styled text và set style inherit
    const downcastConversion = editor.conversion.for('downcast');
    Object.keys(headingDefaults).forEach(modelName => {
      downcastConversion.add(dispatcher => {
        dispatcher.on(`insert:${modelName}`, createHeadingHandler(editor, modelName, headingDefaults), { priority: 'low' });
      });
    });
  }
}

function createHeadingHandler(editor: any, modelName: string, headingDefaults: Record<string, { fontSize: string; lineHeight: string }>) {
  return (evt: any, data: any, conversionApi: any) => {
    const element = data.item;
    const viewElement = editor.editing.mapper.toViewElement(element);
    if (!viewElement) return;

    const children = Array.from(element.getChildren());
    const hasStyledText = children.some((child: any) => {
      if (child.is('$text')) {
        const attrs = Array.from(child.getAttributes());
        return attrs.length > 0;
      }
      return !child.is('$text');
    });

    editor.editing.view.change((writer: any) => {
      if (children.length === 1 && hasStyledText) {
        // Có styled text → bỏ style mặc định
        writer.setStyle('font-size', 'inherit', viewElement);
        writer.setStyle('line-height', 'inherit', viewElement);
      } else {
        // Không có styled text → set lại style mặc định từ config
        const defaults = headingDefaults[modelName];
        writer.setStyle('font-size', defaults.fontSize, viewElement);
        writer.setStyle('line-height', defaults.lineHeight, viewElement);
      }
    });
  };
}
