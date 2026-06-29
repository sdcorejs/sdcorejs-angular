import { Plugin } from 'ckeditor5';

export class TableCustom extends Plugin {
  init() {
    const editor = this.editor;

    // Can thiệp vào quá trình convert từ View (HTML Paste) sang Model
    editor.conversion.for('upcast').add(dispatcher => {
      dispatcher.on(
        'element:table',
        (evt, data) => {
          if (!data.modelRange) return;

          for (const item of data.modelRange.getItems()) {
            if (item.is('element', 'table')) {
              editor.model.change(writer => {
                this._applyTableDefaults(writer, item);
                this._applyCellBorders(writer, item);
              });
            }
          }
        },
        { priority: 'low' }
      );

      // Xử lý data-column-widths từ colgroup preservation
      editor.conversion.for('upcast').attributeToAttribute({
        view: 'data-column-widths',
        model: 'tableColumnWidth',
      });

      // Xử lý border-style: none cho tableCell - phải explicit set 'none'
      dispatcher.on(
        'element:td',
        (evt, data) => {
          if (!data.modelRange || !data.viewItem) return;

          const viewElement = data.viewItem;
          const borderStyle = viewElement.getStyle('border-style') || this._parseBorderStyleFromShorthand(viewElement.getStyle('border'));

          // Nếu border-style là none hoặc border shorthand là none/0, explicit set 'none'
          if (borderStyle === 'none' || borderStyle === 'hidden') {
            for (const item of data.modelRange.getItems()) {
              if (item.is('element', 'tableCell')) {
                editor.model.change(writer => {
                  writer.setAttribute('tableCellBorderStyle', 'none', item);
                  // Khi border là none, set width về 0 để không có border
                  writer.setAttribute('tableCellBorderWidth', '0pt', item);
                });
              }
            }
          }
        },
        { priority: 'high' }
      );

      dispatcher.on(
        'element:th',
        (evt, data) => {
          if (!data.modelRange || !data.viewItem) return;

          const viewElement = data.viewItem;
          const borderStyle = viewElement.getStyle('border-style') || this._parseBorderStyleFromShorthand(viewElement.getStyle('border'));

          // Nếu border-style là none hoặc border shorthand là none/0, explicit set 'none'
          if (borderStyle === 'none' || borderStyle === 'hidden') {
            for (const item of data.modelRange.getItems()) {
              if (item.is('element', 'tableCell')) {
                editor.model.change(writer => {
                  writer.setAttribute('tableCellBorderStyle', 'none', item);
                  // Khi border là none, set width về 0 để không có border
                  writer.setAttribute('tableCellBorderWidth', '0pt', item);
                });
              }
            }
          }
        },
        { priority: 'high' }
      );
    });

    const findInnerTable = (viewElement: any): any => {
      if (!viewElement) return null;
      if (viewElement.name === 'table') return viewElement;

      for (const child of viewElement.getChildren()) {
        if (child.name === 'table') return child;
        const found = findInnerTable(child);
        if (found) return found;
      }
      return null;
    };

    editor.conversion.for('downcast').add(dispatcher => {
      dispatcher.on('attribute:tableWidth:table', (evt, data, conversionApi) => {
        const viewWriter = conversionApi.writer;
        const viewElement = conversionApi.mapper.toViewElement(data.item);

        if (!viewElement) return;

        const innerTable = findInnerTable(viewElement);
        if (!innerTable) return;

        viewWriter.setStyle('border-collapse', 'collapse', innerTable);
        viewWriter.setStyle('margin', '0', innerTable);
        viewWriter.setStyle('width', '100%', innerTable);
        viewWriter.setStyle('width', '100%', viewElement);
      });

      dispatcher.on('insert:table', (evt, data, conversionApi) => {
        const viewWriter = conversionApi.writer;
        const viewElement = conversionApi.mapper.toViewElement(data.item);

        if (!viewElement) return;

        const innerTable = findInnerTable(viewElement);
        if (!innerTable) return;

        viewWriter.setStyle('border-collapse', 'collapse', innerTable);
        viewWriter.setStyle('margin', '0', innerTable);
        viewWriter.setStyle('width', '100%', innerTable);
        viewWriter.setStyle('width', '100%', viewElement);
      });

      // Downcast tableColumnWidth to colgroup
      dispatcher.on('attribute:tableColumnWidth:table', (evt, data, conversionApi) => {
        const viewWriter = conversionApi.writer;
        const viewElement = conversionApi.mapper.toViewElement(data.item);

        if (!viewElement) return;

        const innerTable = findInnerTable(viewElement);
        if (!innerTable) return;

        const columnWidths = data.item.getAttribute('tableColumnWidth') as string;
        if (!columnWidths) return;

        // Remove existing colgroup if any
        for (const child of innerTable.getChildren()) {
          if (child.is('element', 'colgroup')) {
            viewWriter.remove(child);
            break;
          }
        }

        // Create new colgroup with col elements
        const colgroup = viewWriter.createContainerElement('colgroup');
        const widths = columnWidths.split(',');

        for (const width of widths) {
          const col = viewWriter.createEmptyElement('col');
          viewWriter.setAttribute('width', width.trim(), col);
          viewWriter.setStyle('width', width.trim(), col);
          viewWriter.insertChild(0, col, colgroup);
        }

        // Insert colgroup as first child of table
        viewWriter.insertChild(0, colgroup, innerTable);
      });
    });

    // Lắng nghe lệnh insertTable
    const insertTableCommand = editor.commands.get('insertTable');
    if (insertTableCommand) {
      this.listenTo(insertTableCommand, 'execute', () => {
        editor.model.change(writer => {
          const position = editor.model.document.selection.getFirstPosition();
          if (!position) return;

          const tableElement = position.findAncestor('table');
          if (tableElement) {
            this._applyTableDefaults(writer, tableElement);
            writer.setAttribute('tableBorderColor', '#000000', tableElement);
            writer.setAttribute('tableBorderStyle', 'solid', tableElement);
            writer.setAttribute('tableBorderWidth', '1pt', tableElement);
            this._applyCellBorders(writer, tableElement);
          }
        });
      });
    }

    // Listen for row/column commands
    const tableCommands = [
      'insertTableRowAbove',
      'insertTableRowBelow',
      'insertTableColumnLeft',
      'insertTableColumnRight',
      'resizeTableRow',
      'resizeTableColumn',
      'setTableColumnWidth',
      'tableColumnWidth',
    ];

    tableCommands.forEach(cmdName => {
      const cmd = editor.commands.get(cmdName);
      if (cmd) {
        this.listenTo(cmd, 'execute', () => {
          editor.model.change(writer => {
            const position = editor.model.document.selection.getFirstPosition();
            if (!position) return;

            const tableElement = position.findAncestor('table');
            if (tableElement) {
              this._applyTableDefaults(writer, tableElement);
              this._applyCellBorders(writer, tableElement);
            }
          });
        });
      }
    });

    // Setup style preservation on model change
    this._setupStylePreservationOnModelChange();
  }

  /**
   * Parse border style from CSS shorthand (e.g., "1px solid red" or "none")
   */
  private _parseBorderStyleFromShorthand(borderValue: string | null | undefined): string | null {
    if (!borderValue) return null;
    const val = borderValue.toLowerCase().trim();
    if (val === 'none' || val === '0') return 'none';

    // Parse shorthand: width style color (e.g., "1px solid red")
    const parts = val.split(/\s+/);
    for (const part of parts) {
      if (['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset'].includes(part)) {
        return part;
      }
    }
    return null;
  }

  /**
   * Apply default table width
   */
  private _applyTableDefaults(writer: any, tableElement: any): void {
    if (!tableElement) return;
    writer.setAttribute('tableWidth', '100%', tableElement);
  }

  /**
   * Apply default borders to all cells in a table
   * Nếu cell đã có border rồi thì bỏ qua
   */
  private _applyCellBorders(writer: any, tableElement: any): void {
    if (!tableElement) return;

    // Lấy border info từ table để cell kế thừa
    const tableBorderColor = tableElement.getAttribute('tableBorderColor');
    const tableBorderStyle = tableElement.getAttribute('tableBorderStyle');
    const tableBorderWidth = tableElement.getAttribute('tableBorderWidth');

    for (const row of tableElement.getChildren()) {
      for (const cell of row.getChildren()) {
        // Nếu cell đã có border attribute nào rồi thì bỏ qua
        if (
          cell.hasAttribute('tableCellBorderStyle') ||
          cell.hasAttribute('tableCellBorderColor') ||
          cell.hasAttribute('tableCellBorderWidth')
        ) {
          continue;
        }

        // Áp dụng border từ table hoặc default
        const inheritedStyle = tableBorderStyle || 'solid';
        const inheritedColor = tableBorderColor || '#000000';
        const inheritedWidth = tableBorderWidth || '1pt';

        writer.setAttribute('tableCellBorderStyle', inheritedStyle, cell);
        writer.setAttribute('tableCellBorderColor', inheritedColor, cell);
        writer.setAttribute('tableCellBorderWidth', inheritedWidth, cell);

        if (!cell.hasAttribute('tableCellPadding')) {
          writer.setAttribute('tableCellPadding', '0.4em', cell);
        }
      }
    }
  }

  /**
   * Setup listener to preserve cell/table styles when model changes
   */
  private _setupStylePreservationOnModelChange(): void {
    const editor = this.editor;

    // Use listenTo for proper cleanup via destroy()
    this.listenTo(editor.model.document, 'change', (evt: unknown, batch: any) => {
      if (batch?.isLocal === false) return;

      const changes = editor.model.document.differ.getChanges();
      const tablesToFix = this._findTablesNeedingFix(changes);

      if (tablesToFix.size > 0) {
        editor.model.enqueueChange(() => {
          editor.model.change(writer => {
            for (const table of tablesToFix) {
              this._applyTableDefaults(writer, table);
              this._applyCellBorders(writer, table);
            }
          });
        });
      }
    });
  }

  /**
   * Find tables that need border fixes from model changes
   */
  private _findTablesNeedingFix(changes: any): Set<any> {
    const tablesToFix = new Set<any>();

    for (const change of changes) {
      if (change.type === 'attribute') {
        const attrKey = change.attributeKey;
        if (attrKey && (attrKey.includes('table') || attrKey.includes('column') || attrKey.includes('width'))) {
          const element = change.item;
          if (element) {
            const parentTable = this._findParentTable(element);
            if (parentTable) tablesToFix.add(parentTable);
          }
        }
      }

      if (change.type === 'insert' && change.position) {
        const tableElement = change.position.findAncestor?.('table') || change.position.parent?.findAncestor?.('table');
        if (tableElement) tablesToFix.add(tableElement);
      }
    }

    return tablesToFix;
  }

  /**
   * Find parent table element
   */
  private _findParentTable(element: any): any {
    if (!element) return null;
    let parent = element;
    while (parent && !parent.is?.('element', 'table')) {
      parent = parent.parent;
    }
    return parent;
  }

  /**
   * Cleanup listeners when plugin is destroyed
   * Note: this.listenTo() listeners are automatically cleaned up by super.destroy()
   */
  override destroy(): void {
    super.destroy();
  }
}
