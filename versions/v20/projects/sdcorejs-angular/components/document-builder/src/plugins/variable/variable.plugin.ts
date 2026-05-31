import { v4 as uuidv4 } from 'uuid';
import { Config, Plugin, Widget, toWidget } from 'ckeditor5';
import { DocumentBuilderOption, SdDocumentBuilderVariable } from '../../document-builder.model';
import { resolveMaybeAsync } from '@sdcorejs/utils/models';

export class VariablePlugin extends Plugin {
  // Tên plugin đăng ký với CKEditor — bắt buộc để tìm kiếm bằng string và ổn định trong build minified
  static get pluginName() {
    return 'VariablePlugin' as const;
  }

  static get requires() {
    return [Widget];
  }

  init() {
    const editor = this.editor;
    const schema = editor.model.schema;
    const conversion = editor.conversion;
    const editingView = editor.editing.view;

    // Cờ đánh dấu đang trong quá trình xử lý paste
    let isPasting = false;
    this.listenTo(
      editingView.document,
      'clipboardInput',
      () => {
        isPasting = true;
        // Reset cờ sau khi quá trình paste (ngay trong cùng event loop/tick) hoàn tất
        setTimeout(() => {
          isPasting = false;
        }, 0);
      },
      { priority: 'highest' }
    );

    // 1. Định nghĩa Schema (Model)
    schema.register('variable', {
      inheritAllFrom: '$inlineObject',
      allowWhere: '$text',
      isInline: true,
      isObject: true,
      allowAttributes: ['id', 'uuid', 'value', 'display', 'bindingValue'],
    });

    // 2. Model -> HTML
    // model là string 'variable' → chỉ chạy khi element được TẠO MỚI (không reconvert khi attribute đổi)
    // Luôn render trạng thái UNBOUND tại đây — binding state được xử lý riêng bởi converter bên dưới
    conversion.for('downcast').elementToElement({
      model: 'variable',
      view: (modelItem, { writer: viewWriter }) => {
        const id = modelItem.getAttribute('id') as string;
        const uuid = modelItem.getAttribute('uuid') as string;
        const display = modelItem.getAttribute('display') as string;
        const value = modelItem.getAttribute('value') as string;

        const widgetElement = viewWriter.createContainerElement('span', {
          class: 'variable-widget',
          'data-id': id,
          'data-value': value,
          'data-display': display,
          'data-binding': 'false', // Luôn bắt đầu unbound — binding chỉ set qua bindValue()
        });

        const innerText = viewWriter.createText(`{{${display}}}`);
        viewWriter.insert(viewWriter.createPositionAt(widgetElement, 0), innerText);
        return toWidget(widgetElement, viewWriter);
      },
    });

    // 2b. bindingValue → view
    // - editingDowncast: HTML bind dùng createRawElement để hiển thị table/section trong editor.
    // - dataDowncast (getData): CHỈ lưu data-binding-value (URI), không chèn block HTML vào <span> —
    //   tránh HTML lưu dạng <p><span>…<table>… (invalid / upcast CKEditor lỗi null.start).
    const applyBindingValueAttributeToView = (isDataPipeline: boolean) => {
      return (evt: any, data: any, conversionApi: any) => {
        if (!conversionApi.consumable.consume(data.item, evt.name)) return;

        const viewWriter = conversionApi.writer;
        const viewElement = conversionApi.mapper.toViewElement(data.item as any);
        if (!viewElement) return;

        const bindingValue = data.attributeNewValue as string | null | undefined;
        const isBound = !!bindingValue;
        const display = data.item.getAttribute('display') as string;

        viewWriter.remove(viewWriter.createRangeIn(viewElement));

        if (!isBound) {
          viewWriter.setAttribute('data-binding', 'false', viewElement);
          viewWriter.removeAttribute('data-binding-value', viewElement);
          viewWriter.insert(viewWriter.createPositionAt(viewElement, 0), viewWriter.createText(`{{${display}}}`));
          return;
        }

        const raw = bindingValue as string;
        const isHtml = /<[a-z][\s\S]*>/i.test(raw);

        if (isHtml) {
          viewWriter.setAttribute('data-binding', 'html', viewElement);
          viewWriter.setAttribute('data-binding-value', encodeURIComponent(raw), viewElement);
          if (isDataPipeline) {
            // Không nhét DOM con vào serialized HTML; upcast đọc binding từ data-binding-value.
            return;
          }
          const htmlHost = viewWriter.createRawElement(
            'span',
            { class: 'variable-html-content' },
            (domElement: HTMLElement) => {
              domElement.innerHTML = raw;
            }
          );
          viewWriter.insert(viewWriter.createPositionAt(viewElement, 0), htmlHost);
        } else {
          viewWriter.setAttribute('data-binding', 'true', viewElement);
          viewWriter.removeAttribute('data-binding-value', viewElement);
          viewWriter.insert(viewWriter.createPositionAt(viewElement, 0), viewWriter.createText(raw));
        }
      };
    };

    conversion.for('dataDowncast').add(dispatcher => {
      dispatcher.on('attribute:bindingValue:variable', applyBindingValueAttributeToView(true));
    });
    conversion.for('editingDowncast').add(dispatcher => {
      dispatcher.on('attribute:bindingValue:variable', applyBindingValueAttributeToView(false));
    });

    // 3. HTML -> Model
    conversion.for('upcast').elementToElement({
      // NOTE: Chỉ khai báo các attribute CẦN THIẾT để nhận biết variable widget.
      // - data-binding KHÔNG được đưa vào required attributes (HTML cũ không có sẽ không được nhận biết).
      // - data-binding="true" → đọc text child làm bindingValue (plain text).
      // - data-binding="html" → đọc data-binding-value (URI-encoded) làm bindingValue.
      view: {
        name: 'span',
        classes: 'variable-widget ck-widget',
        attributes: {
          'data-id': true,
          'data-value': true,
          'data-display': true,
          contenteditable: true,
        },
      },
      model: (viewElement, { writer: modelWriter }) => {
        const bindingMode = viewElement.getAttribute('data-binding');
        let bindingValue: string | undefined;

        if (bindingMode === 'html') {
          const encoded = viewElement.getAttribute('data-binding-value');
          if (encoded) {
            try {
              bindingValue = decodeURIComponent(encoded);
            } catch {
              bindingValue = undefined;
            }
          }
        } else if (bindingMode === 'true') {
          // Đọc text content làm bindingValue (bound value được lưu trực tiếp vào inner text)
          for (const child of viewElement.getChildren()) {
            if (child.is('$text')) {
              bindingValue = (child as any).data as string;
              break;
            }
          }
        }

        return modelWriter.createElement('variable', {
          id: viewElement.getAttribute('data-id'),
          // Fix trùng uuid: Nếu đang paste, TẠO MỚI uuid thay vì dùng uuid cũ từ HTML
          uuid: isPasting ? uuidv4() : (viewElement.getAttribute('data-uuid') ?? uuidv4()),
          value: viewElement.getAttribute('data-value'),
          display: viewElement.getAttribute('data-display'),
          ...(bindingValue ? { bindingValue } : {}),
        });
      },
    });

    // 4. Xử lý sự kiện Drop
    this.listenTo(editingView.document, 'drop', async (evt, data) => {
      const dataTransfer = (data as any).dataTransfer;
      const jsonData = dataTransfer.getData('ck-variable');
      if (!jsonData) return;

      // data.dropRange là vị trí con chuột trên View khi thả
      const viewRange = (data as any).dropRange;
      const modelRange = editor.editing.mapper.toModelRange(viewRange);
      evt.stop();

      try {
        let variable: SdDocumentBuilderVariable = JSON.parse(jsonData);
        const config = editor.config as Config<DocumentBuilderOption>;
        const getOption = config.get('getOption') as DocumentBuilderOption['getOption'];
        const option = getOption?.();
        if (option?.onDropVariable) {
          // Bug 4 Fix (Q2-A): Xóa tham số dropIndex — không còn tryền giá trị hardcode 0
          const result = await resolveMaybeAsync<boolean | SdDocumentBuilderVariable>(option.onDropVariable(variable));

          // * Hỗ trợ dữ liệu có sẵn sẽ chỉ cần nhận vào boolean có cho phép thả hay không?
          // i18n nằm trong editor.config — plugin không có DI nên đọc qua config; Angular wrapper luôn truyền _i18n
          const i18n = (editor.config as Config<DocumentBuilderOption>).get('_i18n') as DocumentBuilderOption['_i18n'];
          if (typeof result === 'boolean') {
            if (!result) {
              throw new Error(i18n?.t('core.component.document-builder.variable.not-allowed') ?? '');
            }
          } else {
            // * Hỗ trợ dữ liệu lấy từ API (Kiểm tra xem result có đúng định dạng interface SdDocumentBuilderVariable hay không?)
            if (this.#isSdDocumentBuilderVariableResult(result)) {
              variable = result;
            } else {
              throw new Error(i18n?.t('core.component.document-builder.variable.invalid-data') ?? '');
            }
          }
        }

        let insertedUuid = '';
        editor.model.change(writer => {
          // 4.1. Chèn biến
          insertedUuid = uuidv4();
          const variableElem = writer.createElement('variable', {
            id: variable.id,
            uuid: insertedUuid,
            value: variable.value,
            display: variable.display,
          });

          editor.model.insertContent(variableElem, modelRange);
          // 4.2. Đặt con trỏ ra sau biến
          writer.setSelection(variableElem, 'after');
        });

        // onAfterDropVariable: fires SAU model.change() → variable đã có trong model
        // Consumer có thể gọi variable.all() tại đây và thấy biến mới nhất
        option?.onAfterDropVariable?.({ ...variable, uuid: insertedUuid });
      } catch (e) {
        // Đặt con trỏ ngay tại vị trí lỗi
        if (modelRange) {
          editor.model.change(writer => {
            writer.setSelection(modelRange);
          });
        }
        console.error(e);
      } finally {
        // 5. Dọn dẹp drop-target dù thành công hay lỗi
        editor.model.change(writer => {
          for (const marker of editor.model.markers) {
            if (marker.name.startsWith('drop-target')) {
              writer.removeMarker(marker);
            }
          }
        });
      }
    });

    // -------------------------------------------------------------------------
    // 5 & 6. Navigation (Arrow keys + Mouse) + Cursor spacing sau variable
    // -------------------------------------------------------------------------

    // Bug 1 Fix: isNavigating cần được reset sau mỗi lần change:range xử lý xong
    // để tránh logic chèn \u00A0 chạy lặp khi có selection change programmatic.
    let isNavigating = false;

    // Opt 1: Gộp arrow-key detection + Backspace/Delete handler vào 1 listener keydown
    // Bug 3 Fix: Dùng this.listenTo() thay .on() để CKEditor tự cleanup khi plugin destroy
    this.listenTo(
      editingView.document,
      'keydown',
      (evt, data) => {
        const keyCode = data.keyCode;

        // --- Arrow key navigation detection (priority: high) ---
        // Mã phím mũi tên: 37 (Left), 38 (Up), 39 (Right), 40 (Down)
        const isArrowKey = keyCode >= 37 && keyCode <= 40;
        if (isArrowKey) {
          isNavigating = true;
          return; // không xử lý thêm cho arrow key ở đây
        }

        // Reset flag nếu nhấn phím khác (không phải arrow, không phải Backspace/Delete)
        const btnBackspace = keyCode === 8;
        const btnDelete = keyCode === 46;
        if (!btnBackspace && !btnDelete) {
          isNavigating = false;
          return;
        }

        // --- Opt 1: Backspace / Delete handler (đã gộp vào cùng listener) ---
        // priority: highest — chạy trước mọi handler khác để bắt xóa variable 2 bước
        const selection = editor.model.document.selection;
        const model = editor.model;

        // CASE 1: Nếu con trỏ đang nhấp nháy (Collapsed)
        if (selection.isCollapsed) {
          const position = selection.getFirstPosition();
          // Với Backspace ta kiểm tra nodeBefore, với Delete ta kiểm tra nodeAfter
          const targetNode = btnBackspace ? position?.nodeBefore : position?.nodeAfter;

          if (targetNode && targetNode.is('element', 'variable')) {
            data.preventDefault();
            evt.stop();

            model.change(writer => {
              // Chọn bao quanh Variable đó (lần bấm tiếp theo sẽ xóa)
              writer.setSelection(targetNode, 'on');
            });
            return;
          }
        }
        // CASE 2: Nếu đang có một vùng chọn (đã được highlight từ lần bấm trước)
        else {
          const selectedElement = selection.getSelectedElement();

          // Nếu phần tử đang được chọn chính là variable → xóa hẳn
          if (selectedElement && selectedElement.is('element', 'variable')) {
            data.preventDefault();
            evt.stop();

            model.change(writer => {
              writer.remove(selectedElement);
            });
          }
        }
      },
      // priority: highest — Backspace/Delete phải chạy trước CKEditor default để bắt 2-step deletion
      { priority: 'highest' }
    );

    // Bug 3 Fix: mousedown cũng dùng this.listenTo() để tránh memory leak
    this.listenTo(editingView.document, 'mousedown', () => {
      isNavigating = true;
    });

    this.listenTo(editor.model.document.selection, 'change:range', () => {
      // Nếu không phải là hành động click hoặc mũi tên thì thoát hàm.
      if (!isNavigating) {
        return;
      }

      // Bug 1 Fix: Reset ngay sau khi vào handler để tránh chạy lặp
      // khi có thêm selection change programmatic (VD: writer.insertText bên dưới tự trigger lại)
      isNavigating = false;

      const model = editor.model;
      const selection = model.document.selection;
      if (!selection.isCollapsed) return;

      const position = selection.getFirstPosition();
      const nodeBefore = position?.nodeBefore;
      if (!position) return;

      // Kiểm tra: Node đứng trước con trỏ là variable
      if (nodeBefore && nodeBefore.is('element', 'variable')) {
        // Lấy node ngay sau variable để kiểm tra
        const nextNode = nodeBefore.nextSibling;

        // Logic: Nếu phía sau KHÔNG CÓ GÌ hoặc KHÔNG PHẢI LÀ TEXT → chèn \u00A0 để có thể gõ tiếp
        if (!nextNode || !nextNode.is('$text')) {
          model.change(writer => {
            writer.insertText('\u00A0', nodeBefore, 'after');
            // Lấy vị trí ngay sau variable (lúc này đang là đầu của text node mới)
            const posAfterVariable = writer.createPositionAfter(nodeBefore);
            // Dịch chuyển vị trí đó sang phải 1 đơn vị (bỏ qua ký tự vừa thêm)
            const targetPos = posAfterVariable.getShiftedBy(1);
            writer.setSelection(targetPos);
          });
        }
      }
    });

    // -------------------------------------------------------------------------
    // 8. Xử lý sự kiện Copy / Cut (Clipboard Output)
    // -------------------------------------------------------------------------
    // priority: low — chạy sau CKEditor để bổ sung text/plain fallback, không can thiệp HTML
    this.listenTo(
      editor.editing.view.document,
      'clipboardOutput',
      (evt, data) => {
        const isCopyOrCut = data.method === 'copy' || data.method === 'cut';
        if (!isCopyOrCut) return;

        const dataTransfer = data.dataTransfer;
        const content = data.content;

        // Opt 3: Chỉ visit element nodes, bỏ qua các node không liên quan
        let plainText = '';
        const viewRange = editor.editing.view.createRangeIn(content);
        for (const item of viewRange.getItems()) {
          if (item.is('$text')) {
            plainText += (item as any).data;
          } else if (item.is('element', 'span') && item.hasClass('variable-widget')) {
            const display = item.getAttribute('data-display');
            if (display) plainText += `{{${display}}}`;
          }
        }

        if (plainText) {
          dataTransfer.setData('text/plain', plainText);
        }

        // HTML content giữ nguyên — CKEditor sẽ tự xử lý upcast khi paste lại
      },
      { priority: 'low' }
    );

    // -------------------------------------------------------------------------
    // 9. Xử lý sự kiện Paste (Clipboard Input)
    // -------------------------------------------------------------------------
    // Nếu paste từ external source (chỉ có text, không có HTML variable)
    // thì chuyển {{text}} thành variable widget
    this.listenTo(
      editor.editing.view.document,
      'clipboardInput',
      async (evt, data: any) => {
        const dataTransfer = data.dataTransfer;

        // Nếu có HTML chứa variable-widget thì để CKEditor xử lý (upcast converter)
        // Việc chống trùng uuid (regenerate) đã được xử lý ở upcast converter dựa vào biến isPasting
        let html = dataTransfer.getData('text/html');
        if (html && html.includes('variable-widget')) {
          return;
        }

        // Chỉ xử lý nếu chỉ có plain text với pattern {{text}}
        const text = dataTransfer.getData('text/plain');
        if (!text) return;

        // Kiểm tra có chứa pattern {{text}} không
        const variablePattern = /\{\{([^}]+)\}\}/g;
        if (!variablePattern.test(text)) {
          return;
        }

        // Reset lastIndex sau khi test
        variablePattern.lastIndex = 0;

        evt.stop();

        // Bug 2 Fix (Q1-A): Lấy option để gọi onPasteVariable callback nếu có
        const config = editor.config as Config<DocumentBuilderOption>;
        const getOption = config.get('getOption') as DocumentBuilderOption['getOption'];
        const option = getOption?.();

        // Tách text thành các phần: normal text và variables
        let lastIndex = 0;
        let match;
        const fragments: Array<{ type: 'text' | 'variable'; content: string; display?: string }> = [];

        while ((match = variablePattern.exec(text)) !== null) {
          // Thêm text trước variable
          if (match.index > lastIndex) {
            fragments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
          }
          fragments.push({ type: 'variable', content: match[0], display: match[1] });
          lastIndex = match.index + match[0].length;
        }

        // Thêm text còn lại sau variable cuối cùng
        if (lastIndex < text.length) {
          fragments.push({ type: 'text', content: text.slice(lastIndex) });
        }

        // Bug 2 Fix: Resolve tất cả variable fragments trước khi thực hiện model.change
        // Tránh async operation bên trong model.change (CKEditor không hỗ trợ async writer)

        // Xây dựng lookup map từ variables đang có trong document (theo display name)
        // Dùng để fallback khi không có onPasteVariable — giữ lại đầy đủ id/value của biến gốc
        // khi copy-paste nội bộ bị mất HTML (chỉ còn plain text {{display}})
        const existingVariableMap = this.#buildDisplayMap();

        const resolvedFragments: Array<{ type: 'text' | 'variable'; content: string; variable?: SdDocumentBuilderVariable }> = [];
        for (const fragment of fragments) {
          if (fragment.type === 'variable' && fragment.display) {
            let resolved: SdDocumentBuilderVariable | null = null;

            if (option?.onPasteVariable) {
              try {
                resolved = await resolveMaybeAsync<SdDocumentBuilderVariable | null>(option.onPasteVariable(fragment.display));
              } catch (e) {
                // @i18n-ignore — dev console warning
                console.warn(`[VariablePlugin] onPasteVariable("${fragment.display}") thất bại:`, e);
              }
            }

            // Fallback 1: Tra cứu variable đang có trong document theo display name
            // → Giữ lại đầy đủ id/value khi copy-paste nội bộ bị mất HTML
            if (!resolved) {
              resolved = existingVariableMap.get(fragment.display) ?? null;
            }

            // Fallback 2: Không tìm thấy → tạo variable sentinel với id = ''
            // Consumer có thể filter qua variable.all() và nhận biết bằng id === ''
            resolvedFragments.push({
              type: 'variable',
              content: fragment.content,
              variable: resolved ?? {
                id: '',
                uuid: uuidv4(),
                value: fragment.display,
                display: fragment.display,
              },
            });
          } else {
            resolvedFragments.push({ type: 'text', content: fragment.content });
          }
        }

        // Chèn từng fragment vào document
        editor.model.change(writer => {
          const selection = editor.model.document.selection;
          const position = selection.getFirstPosition();
          if (!position) return;

          let currentPosition = position;
          for (const fragment of resolvedFragments) {
            if (fragment.type === 'text' && fragment.content) {
              const textNode = writer.createText(fragment.content);
              writer.insert(textNode, currentPosition);
              currentPosition = writer.createPositionAfter(textNode);
            } else if (fragment.type === 'variable' && fragment.variable) {
              const variableElem = writer.createElement('variable', {
                id: fragment.variable.id,
                uuid: uuidv4(),
                value: fragment.variable.value,
                display: fragment.variable.display,
              });
              writer.insert(variableElem, currentPosition);
              currentPosition = writer.createPositionAfter(variableElem);
            }
          }

          // Đặt con trỏ sau nội dung vừa paste
          writer.setSelection(currentPosition);
        });
      },
      { priority: 'high' }
    );
  }

  #isSdDocumentBuilderVariableResult = (obj: any): obj is SdDocumentBuilderVariable => {
    return (
      obj !== null &&
      obj !== undefined &&
      typeof obj === 'object' &&
      !Array.isArray(obj) &&
      typeof obj.id === 'string' &&
      typeof obj.value === 'string' &&
      typeof obj.display === 'string'
    );
  };

  /**
   * Quét tất cả variable elements trong document hiện tại, trả về Map<display, SdDocumentBuilderVariable>.
   * Dùng làm fallback khi paste {{display}} mà không có onPasteVariable callback:
   * nếu document đã có variable cùng display → tái sử dụng id/value của biến gốc.
   * Nếu có nhiều variable cùng display → lấy cái đầu tiên tìm được.
   */
  #buildDisplayMap = (): Map<string, SdDocumentBuilderVariable> => {
    const map = new Map<string, SdDocumentBuilderVariable>();
    const root = this.editor.model.document.getRoot();
    if (!root) return map;

    const range = this.editor.model.createRangeIn(root);
    for (const item of range.getItems()) {
      if (item.is('element', 'variable')) {
        const display = item.getAttribute('display') as string;
        // Chỉ lưu lần đầu tiên gặp display này
        if (display && !map.has(display)) {
          map.set(display, {
            id: item.getAttribute('id') as string,
            uuid: item.getAttribute('uuid') as string,
            value: item.getAttribute('value') as string,
            display,
          });
        }
      }
    }

    return map;
  };

  // =========================================================================
  // PUBLIC API — Variable management
  // =========================================================================

  /**
   * Lấy tất cả variables trong document.
   * @returns Danh sách tất cả variables (bao gồm bindingValue nếu đã binding)
   */
  all<T = any>(): SdDocumentBuilderVariable<T>[] {
    const model = this.editor.model;
    const root = model.document.getRoot();
    if (!root) return [];

    const variables: SdDocumentBuilderVariable<T>[] = [];
    try {
      const range = model.createRangeIn(root);
      for (const item of range.getItems()) {
        if (item.is('element', 'variable')) {
          variables.push({
            id: item.getAttribute('id') as string,
            uuid: item.getAttribute('uuid') as string,
            value: item.getAttribute('value') as string,
            display: item.getAttribute('display') as string,
            bindingValue: item.getAttribute('bindingValue') as string | undefined,
          });
        }
      }
    } catch (e) {
      console.error(e);
      return [];
    }
    return variables;
  }

  /**
   * Scroll tới vị trí của variable theo uuid.
   * @param uuid - uuid của variable (FE tự sinh sau mỗi lần drop)
   */
  scroll(uuid: string): void {
    const model = this.editor.model;
    const root = model.document.getRoot();
    if (!root) return;

    let targetElement: any = null;
    const range = model.createRangeIn(root);
    for (const item of range.getItems()) {
      if (item.is('element', 'variable') && item.getAttribute('uuid') === uuid) {
        targetElement = item;
        break;
      }
    }

    if (targetElement) {
      const viewElement = this.editor.editing.mapper.toViewElement(targetElement);
      if (viewElement) {
        const domElement = this.editor.editing.view.domConverter.viewToDom(viewElement);
        if (domElement) {
          (domElement as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
          model.change(writer => {
            writer.setSelection(targetElement, 'on');
          });
        }
      }
    } else {
      // @i18n-ignore — dev console warning
      console.warn(`Variable với uuid "${uuid}" không tìm thấy trong tài liệu.`);
    }
  }

  /**
   * Gán giá trị cho TẤT CẢ variable có cùng id trong document.
   * Nếu value rỗng → tự động gọi clearValue(id).
   * @param id    - id của variable definition
   * @param value - giá trị binding cần hiển thị
   * @returns số instance đã được cập nhật
   */
  bindValue(id: string, value: string): number {
    if (!value) return this.clearValue(id);
    const model = this.editor.model;
    const root = model.document.getRoot();
    if (!root) return 0;

    let count = 0;
    model.change(writer => {
      const range = model.createRangeIn(root);
      for (const item of range.getItems()) {
        if (item.is('element', 'variable') && item.getAttribute('id') === id) {
          writer.setAttribute('bindingValue', value, item);
          count++;
        }
      }
    });
    return count;
  }

  /**
   * Xóa binding value của TẤT CẢ variable có cùng id.
   * @param id - id của variable definition
   * @returns số instance đã được cập nhật
   */
  clearValue(id: string): number {
    const model = this.editor.model;
    const root = model.document.getRoot();
    if (!root) return 0;

    let count = 0;
    model.change(writer => {
      const range = model.createRangeIn(root);
      for (const item of range.getItems()) {
        if (item.is('element', 'variable') && item.getAttribute('id') === id && item.hasAttribute('bindingValue')) {
          writer.removeAttribute('bindingValue', item);
          count++;
        }
      }
    });
    return count;
  }

  /**
   * Batch bind nhiều variables theo map { id → value }.
   * Toàn bộ thực hiện trong 1 model.change() → 1 undo step duy nhất.
   * @param map - { [id]: boundValue }
   */
  bindValues(map: Record<string, string>): void {
    if (!Object.keys(map).length) return;
    const model = this.editor.model;
    const root = model.document.getRoot();
    if (!root) return;

    model.change(writer => {
      const range = model.createRangeIn(root);
      for (const item of range.getItems()) {
        if (!item.is('element', 'variable')) continue;
        const id = item.getAttribute('id') as string;
        if (!(id in map)) continue;

        const value = map[id];
        if (value) {
          writer.setAttribute('bindingValue', value, item);
        } else if (item.hasAttribute('bindingValue')) {
          writer.removeAttribute('bindingValue', item);
        }
      }
    });
  }

  /**
   * Batch clear binding của nhiều variables.
   * @param ids - danh sách id cần clear; nếu không truyền/rỗng → clear TẤT CẢ
   */
  clearValues(ids?: string[]): void {
    const model = this.editor.model;
    const root = model.document.getRoot();
    if (!root) return;

    const idSet = ids?.length ? new Set(ids) : null;

    model.change(writer => {
      const range = model.createRangeIn(root);
      for (const item of range.getItems()) {
        if (!item.is('element', 'variable') || !item.hasAttribute('bindingValue')) continue;
        const id = item.getAttribute('id') as string;
        if (!idSet || idSet.has(id)) {
          writer.removeAttribute('bindingValue', item);
        }
      }
    });
  }

  /** Xóa toàn bộ binding values trong document. Shorthand của clearValues(). */
  clearAllValues(): void {
    this.clearValues();
  }
}

/**
 * HTML từ getData() phiên bản cũ có thể chứa block (vd. table) bên trong `span.variable-widget[data-binding="html"]`,
 * khiến setData/upcast CKEditor lỗi (unexpected-error, null.start). Gọi trước `setData` để giữ chỉ
 * `data-binding-value` và bỏ các node con.
 */
export function sanitizeVariableHtmlBoundSerializedHtml(html: string): string {
  if (!html || !html.includes('variable-widget')) return html;
  try {
    const doc = new DOMParser().parseFromString(`<div id="__sd_var_sanitize_root__">${html}</div>`, 'text/html');
    const root = doc.getElementById('__sd_var_sanitize_root__');
    if (!root) return html;
    root.querySelectorAll('span.variable-widget').forEach(el => {
      if (el.getAttribute('data-binding') !== 'html') return;
      if (!el.hasAttribute('data-binding-value')) return;
      el.replaceChildren();
    });
    return root.innerHTML;
  } catch {
    return html;
  }
}
