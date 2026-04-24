import { Plugin } from 'ckeditor5';

export class ImageCustomPlugin extends Plugin {
  static get pluginName() {
    return 'ImageCustomPlugin' as const;
  }

  init() {
    const editor = this.editor;

    // Thiết lập style mặc định là alignCenter khi chèn ảnh
    editor.commands.get('imageUpload')?.on('execute', (evt, args) => {
      // Đặt style mặc định sau khi ảnh được chèn
      setTimeout(() => {
        const selection = editor.model.document.selection;
        const imageElement = selection.getSelectedElement();
        if (imageElement && (imageElement.name === 'imageBlock' || imageElement.name === 'imageInline')) {
          const currentStyle = imageElement.getAttribute('imageStyle');
          // Chỉ đặt mặc định nếu chưa có style nào
          if (!currentStyle) {
            editor.model.change(writer => {
              writer.setAttribute('imageStyle', 'alignCenter', imageElement);
            });
          }
        }
      }, 0);
    });

    // Downcast: Model -> View (HTML output)
    // CKEditor 5 có 2 loại ảnh: imageBlock và imageInline
    editor.conversion.for('downcast').add(dispatcher => {
      // Xử lý ảnh block (được wrap trong figure)
      dispatcher.on(
        'insert:imageBlock',
        (evt, data, conversionApi) => {
          this.handleImageInsert(evt, data, conversionApi);
        },
        { priority: 'low' }
      );

      // Xử lý ảnh inline
      dispatcher.on(
        'insert:imageInline',
        (evt, data, conversionApi) => {
          this.handleImageInsert(evt, data, conversionApi);
        },
        { priority: 'low' }
      );

      // Xử lý thay đổi attribute cho cả 2 loại ảnh
      ['imageBlock', 'imageInline'].forEach(imageType => {
        // Xử lý thay đổi src
        dispatcher.on(
          `attribute:src:${imageType}`,
          (evt, data, conversionApi) => {
            this.handleImageAttributeChange(evt, data, conversionApi);
          },
          { priority: 'low' }
        );

        // Xử lý thay đổi width
        dispatcher.on(
          `attribute:width:${imageType}`,
          (evt, data, conversionApi) => {
            this.handleImageAttributeChange(evt, data, conversionApi);
          },
          { priority: 'low' }
        );

        // Xử lý thay đổi height
        dispatcher.on(
          `attribute:height:${imageType}`,
          (evt, data, conversionApi) => {
            this.handleImageAttributeChange(evt, data, conversionApi);
          },
          { priority: 'low' }
        );

        // Xử lý thay đổi imageStyle (căn chỉnh) - thêm float inline style
        dispatcher.on(
          `attribute:imageStyle:${imageType}`,
          (evt, data, conversionApi) => {
            this.handleImageStyleChange(evt, data, conversionApi);
          },
          { priority: 'low' }
        );
      });
    });

    // Xử lý upcast (HTML paste) - xóa aspect-ratio từ HTML đầu vào
    editor.conversion.for('upcast').add(dispatcher => {
      dispatcher.on(
        'element:img',
        (evt, data, conversionApi) => {
          const viewItem = data.viewItem;
          if (!viewItem) return;

          // Kiểm tra viewItem có các method cần thiết
          if (typeof viewItem.getStyle !== 'function') return;

          // Xóa aspect-ratio từ inline styles nếu có
          const hasAspectRatio = viewItem.getStyle('aspect-ratio');
          if (hasAspectRatio && typeof viewItem.removeStyle === 'function') {
            viewItem.removeStyle('aspect-ratio');
          }

          // Đặt custom styles nếu _styles map tồn tại
          if (viewItem._styles && typeof viewItem._styles.set === 'function') {
            viewItem._styles.set('margin', '0');
            viewItem._styles.set('border', '0');
            viewItem._styles.set('max-width', '100%');
            viewItem._styles.set('height', 'auto');
          }
        },
        { priority: 'high' }
      );
    });
  }

  /**
   * Xử lý sự kiện chèn ảnh
   */
  private handleImageInsert(evt: any, data: any, conversionApi: any): void {
    const viewWriter = conversionApi.writer;
    const viewElement = conversionApi.mapper.toViewElement(data.item);

    if (!viewElement) return;

    // viewElement có thể là figure (cho block) hoặc img itself (cho inline)
    // Tìm element img thực tế
    const imgElement = this.findImgElement(viewElement);
    if (!imgElement) return;

    this.applyCustomStyles(viewWriter, imgElement);
  }

  /**
   * Xử lý sự kiện thay đổi attribute ảnh
   */
  private handleImageAttributeChange(evt: any, data: any, conversionApi: any): void {
    const viewWriter = conversionApi.writer;
    const viewElement = conversionApi.mapper.toViewElement(data.item);

    if (!viewElement) return;

    const imgElement = this.findImgElement(viewElement);
    if (!imgElement) return;

    this.applyCustomStyles(viewWriter, imgElement);
  }

  /**
   * Xử lý sự kiện thay đổi style ảnh - thêm float inline style cho căn chỉnh
   */
  private handleImageStyleChange(evt: any, data: any, conversionApi: any): void {
    const viewWriter = conversionApi.writer;
    const viewElement = conversionApi.mapper.toViewElement(data.item);

    if (!viewElement) return;

    // Tìm container ck-widget (element figure)
    const widgetElement = this.findWidgetElement(viewElement);
    if (!widgetElement) return;

    // Lấy giá trị imageStyle (căn chỉnh)
    const imageStyle = data.item.getAttribute('imageStyle') as string;

    // Xóa các style hiện có trước
    viewWriter.removeStyle('float', widgetElement);
    viewWriter.removeStyle('margin', widgetElement);
    viewWriter.removeStyle('text-align', widgetElement);

    // Áp dụng style dựa trên căn chỉnh ảnh
    // Các options đã cấu hình: ['inline', 'alignLeft', 'alignRight', 'alignCenter']
    switch (imageStyle) {
      case 'inline':
        // Ảnh inline - không style đặc biệt, chỉ flow inline
        break;
      case 'alignLeft':
        // Float trái
        viewWriter.setStyle('float', 'left', widgetElement);
        viewWriter.setStyle('margin', '0 16px 16px 0', widgetElement);
        break;
      case 'alignRight':
        // Float phải
        viewWriter.setStyle('float', 'right', widgetElement);
        viewWriter.setStyle('margin', '0 0 16px 16px', widgetElement);
        break;
      case 'alignCenter':
      case 'block':
        // Căn giữa
        viewWriter.setStyle('text-align', 'center', widgetElement);
        viewWriter.setStyle('margin', '16px auto', widgetElement);
        break;
      default:
        // Mặc định - căn giữa
        viewWriter.setStyle('text-align', 'center', widgetElement);
        viewWriter.setStyle('margin', '16px auto', widgetElement);
        break;
    }

    // Áp dụng custom styles cơ bản cho element img
    const imgElement = this.findImgElement(viewElement);
    if (imgElement) {
      this.applyCustomStyles(viewWriter, imgElement);
    }
  }

  /**
   * Áp dụng custom styles cho element ảnh
   */
  private applyCustomStyles(viewWriter: any, imgElement: any): void {
    // Xóa aspect-ratio nếu tồn tại
    if (imgElement.getStyle('aspect-ratio')) {
      viewWriter.removeStyle('aspect-ratio', imgElement);
    }

    // Áp dụng custom styles
    viewWriter.setStyle('margin', '0', imgElement);
    viewWriter.setStyle('border', '0', imgElement);
    viewWriter.setStyle('max-width', '100%', imgElement);
    viewWriter.setStyle('height', 'auto', imgElement);
  }

  /**
   * Tìm container ck-widget (element figure)
   * CKEditor wrap ảnh block trong <figure class="ck-widget"><img></figure>
   */
  private findWidgetElement(viewElement: any): any {
    if (!viewElement) return null;

    // Nếu đây là element figure itself
    if (viewElement.name === 'figure') {
      return viewElement;
    }

    // Cho ảnh inline, trả về element itself (span wrapper)
    if (viewElement.name === 'span') {
      return viewElement;
    }

    // Tìm ngược lên tree để tìm figure/ck-widget
    let current = viewElement;
    while (current) {
      if (current.name === 'figure' || current.name === 'span') {
        return current;
      }
      // Di chuyển lên parent
      if (current.parent) {
        current = current.parent;
      } else {
        break;
      }
    }

    // Nếu không tìm thấy widget, trả về element gốc
    return viewElement;
  }

  /**
   * Tìm element img thực tế bên trong widget structure
   * CKEditor wrap ảnh block trong <figure class="ck-widget"><img></figure>
   */
  private findImgElement(viewElement: any): any {
    if (!viewElement) return null;

    // Nếu đây là element img itself
    if (viewElement.name === 'img') {
      return viewElement;
    }

    // Cho structure widget của CKEditor, tìm đệ quy
    // Ảnh block: figure > span > img
    // Ảnh thường được wrap trong một container
    const queue = [viewElement];
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;

      if (current.name === 'img') {
        return current;
      }

      // Thêm children vào queue
      if (current.getChildren) {
        for (const child of current.getChildren()) {
          queue.push(child);
        }
      }
    }

    return null;
  }
}
