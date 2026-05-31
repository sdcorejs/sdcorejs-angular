import { Plugin } from 'ckeditor5';

export class HighlightRangePlugin extends Plugin {
  init() {
    const editor = this.editor;

    editor.conversion.for('editingDowncast').markerToHighlight({
      model: 'highlightRange',
      view: {
        classes: 'highlight-range',
      },
    });
  }
}
