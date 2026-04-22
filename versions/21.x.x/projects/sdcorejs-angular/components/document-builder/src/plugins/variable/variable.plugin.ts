import { v4 as uuidv4 } from 'uuid';
import { Config, Plugin, Widget, toWidget } from 'ckeditor5';
import { SdDocumentBuilderVariable, SdEditorConfig } from '../../document-builder.model';
import { SdResolveMaybeAsync } from '@sdcorejs/angular/utilities';

export class VariablePlugin extends Plugin {
  // TÃªn plugin Ä‘Äƒng kÃ½ vá»›i CKEditor â€” báº¯t buá»™c Ä‘á»ƒ tÃ¬m kiáº¿m báº±ng string vÃ  á»•n Ä‘á»‹nh trong build minified
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

    // Cá» Ä‘Ã¡nh dáº¥u Ä‘ang trong quÃ¡ trÃ¬nh xá»­ lÃ½ paste
    let isPasting = false;
    this.listenTo(
      editingView.document,
      'clipboardInput',
      () => {
        isPasting = true;
        // Reset cá» sau khi quÃ¡ trÃ¬nh paste (ngay trong cÃ¹ng event loop/tick) hoÃ n táº¥t
        setTimeout(() => {
          isPasting = false;
        }, 0);
      },
      { priority: 'highest' }
    );

    // 1. Äá»‹nh nghÄ©a Schema (Model)
    schema.register('variable', {
      inheritAllFrom: '$inlineObject',
      allowWhere: '$text',
      isInline: true,
      isObject: true,
      allowAttributes: ['id', 'uuid', 'value', 'display', 'bindingValue'],
    });

    // 2. Model -> HTML
    // model lÃ  string 'variable' â†’ chá»‰ cháº¡y khi element Ä‘Æ°á»£c Táº O Má»šI (khÃ´ng reconvert khi attribute Ä‘á»•i)
    // LuÃ´n render tráº¡ng thÃ¡i UNBOUND táº¡i Ä‘Ã¢y â€” binding state Ä‘Æ°á»£c xá»­ lÃ½ riÃªng bá»Ÿi converter bÃªn dÆ°á»›i
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
          'data-binding': 'false', // LuÃ´n báº¯t Ä‘áº§u unbound â€” binding chá»‰ set qua bindValue()
        });

        const innerText = viewWriter.createText(`{{${display}}}`);
        viewWriter.insert(viewWriter.createPositionAt(widgetElement, 0), innerText);
        return toWidget(widgetElement, viewWriter);
      },
    });

    // 2b. One-way attribute converter cho bindingValue (chá»‰ editing view, khÃ´ng áº£nh hÆ°á»Ÿng getData())
    // Chá»‰ cháº¡y khi bindValue() / clearValue() gá»i model.change â†’ setAttribute/removeAttribute
    // Binding Ä‘Æ°á»£c persist vÃ o HTML (getData() vÃ  setData() cÃ³ binding state)
    // conversion.for('downcast') áº£nh hÆ°á»Ÿng cáº£ editing view vÃ  data view (getData)
    conversion.for('downcast').add(dispatcher => {
      dispatcher.on('attribute:bindingValue:variable', (evt, data, conversionApi) => {
        if (!conversionApi.consumable.consume(data.item, evt.name)) return;

        const viewWriter = conversionApi.writer;
        const viewElement = conversionApi.mapper.toViewElement(data.item as any);
        if (!viewElement) return;

        const bindingValue = data.attributeNewValue as string | null | undefined;
        const isBound = !!bindingValue;
        const display = data.item.getAttribute('display') as string;

        // Cáº­p nháº­t data-binding attribute trÃªn container span
        viewWriter.setAttribute('data-binding', isBound ? 'true' : 'false', viewElement);

        // XÃ³a text node cÅ© vÃ  chÃ¨n text má»›i (bound value hoáº·c {{display}})
        viewWriter.remove(viewWriter.createRangeIn(viewElement));
        viewWriter.insert(
          viewWriter.createPositionAt(viewElement, 0),
          viewWriter.createText(isBound ? (bindingValue as string) : `{{${display}}}`)
        );
      });
    });

    // 3. HTML -> Model
    conversion.for('upcast').elementToElement({
      // NOTE: Chá»‰ khai bÃ¡o cÃ¡c attribute Cáº¦N THIáº¾T Ä‘á»ƒ nháº­n biáº¿t variable widget.
      // - data-binding KHÃ”NG Ä‘Æ°á»£c Ä‘Æ°a vÃ o required attributes (HTML cÅ© khÃ´ng cÃ³ sáº½ khÃ´ng Ä‘Æ°á»£c nháº­n biáº¿t).
      // - Náº¿u data-binding="true" trong HTML â†’ Ä‘á»c text content lÃ m bindingValue Ä‘á»ƒ restore tráº¡ng thÃ¡i bound.
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
        const isBound = viewElement.getAttribute('data-binding') === 'true';
        let bindingValue: string | undefined;

        if (isBound) {
          // Äá»c text content lÃ m bindingValue (bound value Ä‘Æ°á»£c lÆ°u trá»±c tiáº¿p vÃ o innerHTML)
          for (const child of viewElement.getChildren()) {
            if (child.is('$text')) {
              bindingValue = (child as any).data as string;
              break;
            }
          }
        }

        return modelWriter.createElement('variable', {
          id: viewElement.getAttribute('data-id'),
          // Fix trÃ¹ng uuid: Náº¿u Ä‘ang paste, Táº O Má»šI uuid thay vÃ¬ dÃ¹ng uuid cÅ© tá»« HTML
          uuid: isPasting ? uuidv4() : (viewElement.getAttribute('data-uuid') ?? uuidv4()),
          value: viewElement.getAttribute('data-value'),
          display: viewElement.getAttribute('data-display'),
          ...(bindingValue ? { bindingValue } : {}),
        });
      },
    });

    // 4. Xá»­ lÃ½ sá»± kiá»‡n Drop
    this.listenTo(editingView.document, 'drop', async (evt, data) => {
      const dataTransfer = (data as any).dataTransfer;
      const jsonData = dataTransfer.getData('ck-variable');
      if (!jsonData) return;

      // data.dropRange lÃ  vá»‹ trÃ­ con chuá»™t trÃªn View khi tháº£
      const viewRange = (data as any).dropRange;
      const modelRange = editor.editing.mapper.toModelRange(viewRange);
      evt.stop();

      try {
        let variable: SdDocumentBuilderVariable = JSON.parse(jsonData);
        const config = editor.config as Config<SdEditorConfig>;
        const getOption = config.get('getOption') as SdEditorConfig['getOption'];
        const option = getOption?.();
        if (option?.onDropVariable) {
          // Bug 4 Fix (Q2-A): XÃ³a tham sá»‘ dropIndex â€” khÃ´ng cÃ²n tryá»n giÃ¡ trá»‹ hardcode 0
          const result = await SdResolveMaybeAsync<boolean | SdDocumentBuilderVariable>(option.onDropVariable(variable));

          // * Há»— trá»£ dá»¯ liá»‡u cÃ³ sáºµn sáº½ chá»‰ cáº§n nháº­n vÃ o boolean cÃ³ cho phÃ©p tháº£ hay khÃ´ng?
          if (typeof result === 'boolean') {
            if (!result) {
              throw new Error('KhÃ´ng cho phÃ©p thÃªm variable vÃ o vÄƒn báº£n');
            }
          } else {
            // * Há»— trá»£ dá»¯ liá»‡u láº¥y tá»« API (Kiá»ƒm tra xem result cÃ³ Ä‘Ãºng Ä‘á»‹nh dáº¡ng interface SdDocumentBuilderVariable hay khÃ´ng?)
            if (this.#isSdDocumentBuilderVariableResult(result)) {
              variable = result;
            } else {
              throw new Error('Dá»¯ liá»‡u variable khÃ´ng há»£p lá»‡');
            }
          }
        }

        let insertedUuid = '';
        editor.model.change(writer => {
          // 4.1. ChÃ¨n biáº¿n
          insertedUuid = uuidv4();
          const variableElem = writer.createElement('variable', {
            id: variable.id,
            uuid: insertedUuid,
            value: variable.value,
            display: variable.display,
          });

          editor.model.insertContent(variableElem, modelRange);
          // 4.2. Äáº·t con trá» ra sau biáº¿n
          writer.setSelection(variableElem, 'after');
        });

        // onAfterDropVariable: fires SAU model.change() â†’ variable Ä‘Ã£ cÃ³ trong model
        // Consumer cÃ³ thá»ƒ gá»i variable.all() táº¡i Ä‘Ã¢y vÃ  tháº¥y biáº¿n má»›i nháº¥t
        option?.onAfterDropVariable?.({ ...variable, uuid: insertedUuid });
      } catch (e) {
        // Äáº·t con trá» ngay táº¡i vá»‹ trÃ­ lá»—i
        if (modelRange) {
          editor.model.change(writer => {
            writer.setSelection(modelRange);
          });
        }
        console.error(e);
      } finally {
        // 5. Dá»n dáº¹p drop-target dÃ¹ thÃ nh cÃ´ng hay lá»—i
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

    // Bug 1 Fix: isNavigating cáº§n Ä‘Æ°á»£c reset sau má»—i láº§n change:range xá»­ lÃ½ xong
    // Ä‘á»ƒ trÃ¡nh logic chÃ¨n \u00A0 cháº¡y láº·p khi cÃ³ selection change programmatic.
    let isNavigating = false;

    // Opt 1: Gá»™p arrow-key detection + Backspace/Delete handler vÃ o 1 listener keydown
    // Bug 3 Fix: DÃ¹ng this.listenTo() thay .on() Ä‘á»ƒ CKEditor tá»± cleanup khi plugin destroy
    this.listenTo(
      editingView.document,
      'keydown',
      (evt, data) => {
        const keyCode = data.keyCode;

        // --- Arrow key navigation detection (priority: high) ---
        // MÃ£ phÃ­m mÅ©i tÃªn: 37 (Left), 38 (Up), 39 (Right), 40 (Down)
        const isArrowKey = keyCode >= 37 && keyCode <= 40;
        if (isArrowKey) {
          isNavigating = true;
          return; // khÃ´ng xá»­ lÃ½ thÃªm cho arrow key á»Ÿ Ä‘Ã¢y
        }

        // Reset flag náº¿u nháº¥n phÃ­m khÃ¡c (khÃ´ng pháº£i arrow, khÃ´ng pháº£i Backspace/Delete)
        const btnBackspace = keyCode === 8;
        const btnDelete = keyCode === 46;
        if (!btnBackspace && !btnDelete) {
          isNavigating = false;
          return;
        }

        // --- Opt 1: Backspace / Delete handler (Ä‘Ã£ gá»™p vÃ o cÃ¹ng listener) ---
        // priority: highest â€” cháº¡y trÆ°á»›c má»i handler khÃ¡c Ä‘á»ƒ báº¯t xÃ³a variable 2 bÆ°á»›c
        const selection = editor.model.document.selection;
        const model = editor.model;

        // CASE 1: Náº¿u con trá» Ä‘ang nháº¥p nhÃ¡y (Collapsed)
        if (selection.isCollapsed) {
          const position = selection.getFirstPosition();
          // Vá»›i Backspace ta kiá»ƒm tra nodeBefore, vá»›i Delete ta kiá»ƒm tra nodeAfter
          const targetNode = btnBackspace ? position?.nodeBefore : position?.nodeAfter;

          if (targetNode && targetNode.is('element', 'variable')) {
            data.preventDefault();
            evt.stop();

            model.change(writer => {
              // Chá»n bao quanh Variable Ä‘Ã³ (láº§n báº¥m tiáº¿p theo sáº½ xÃ³a)
              writer.setSelection(targetNode, 'on');
            });
            return;
          }
        }
        // CASE 2: Náº¿u Ä‘ang cÃ³ má»™t vÃ¹ng chá»n (Ä‘Ã£ Ä‘Æ°á»£c highlight tá»« láº§n báº¥m trÆ°á»›c)
        else {
          const selectedElement = selection.getSelectedElement();

          // Náº¿u pháº§n tá»­ Ä‘ang Ä‘Æ°á»£c chá»n chÃ­nh lÃ  variable â†’ xÃ³a háº³n
          if (selectedElement && selectedElement.is('element', 'variable')) {
            data.preventDefault();
            evt.stop();

            model.change(writer => {
              writer.remove(selectedElement);
            });
          }
        }
      },
      // priority: highest â€” Backspace/Delete pháº£i cháº¡y trÆ°á»›c CKEditor default Ä‘á»ƒ báº¯t 2-step deletion
      { priority: 'highest' }
    );

    // Bug 3 Fix: mousedown cÅ©ng dÃ¹ng this.listenTo() Ä‘á»ƒ trÃ¡nh memory leak
    this.listenTo(editingView.document, 'mousedown', () => {
      isNavigating = true;
    });

    this.listenTo(editor.model.document.selection, 'change:range', () => {
      // Náº¿u khÃ´ng pháº£i lÃ  hÃ nh Ä‘á»™ng click hoáº·c mÅ©i tÃªn thÃ¬ thoÃ¡t hÃ m.
      if (!isNavigating) {
        return;
      }

      // Bug 1 Fix: Reset ngay sau khi vÃ o handler Ä‘á»ƒ trÃ¡nh cháº¡y láº·p
      // khi cÃ³ thÃªm selection change programmatic (VD: writer.insertText bÃªn dÆ°á»›i tá»± trigger láº¡i)
      isNavigating = false;

      const model = editor.model;
      const selection = model.document.selection;
      if (!selection.isCollapsed) return;

      const position = selection.getFirstPosition();
      const nodeBefore = position?.nodeBefore;
      if (!position) return;

      // Kiá»ƒm tra: Node Ä‘á»©ng trÆ°á»›c con trá» lÃ  variable
      if (nodeBefore && nodeBefore.is('element', 'variable')) {
        // Láº¥y node ngay sau variable Ä‘á»ƒ kiá»ƒm tra
        const nextNode = nodeBefore.nextSibling;

        // Logic: Náº¿u phÃ­a sau KHÃ”NG CÃ“ GÃŒ hoáº·c KHÃ”NG PHáº¢I LÃ€ TEXT â†’ chÃ¨n \u00A0 Ä‘á»ƒ cÃ³ thá»ƒ gÃµ tiáº¿p
        if (!nextNode || !nextNode.is('$text')) {
          model.change(writer => {
            writer.insertText('\u00A0', nodeBefore, 'after');
            // Láº¥y vá»‹ trÃ­ ngay sau variable (lÃºc nÃ y Ä‘ang lÃ  Ä‘áº§u cá»§a text node má»›i)
            const posAfterVariable = writer.createPositionAfter(nodeBefore);
            // Dá»‹ch chuyá»ƒn vá»‹ trÃ­ Ä‘Ã³ sang pháº£i 1 Ä‘Æ¡n vá»‹ (bá» qua kÃ½ tá»± vá»«a thÃªm)
            const targetPos = posAfterVariable.getShiftedBy(1);
            writer.setSelection(targetPos);
          });
        }
      }
    });

    // -------------------------------------------------------------------------
    // 8. Xá»­ lÃ½ sá»± kiá»‡n Copy / Cut (Clipboard Output)
    // -------------------------------------------------------------------------
    // priority: low â€” cháº¡y sau CKEditor Ä‘á»ƒ bá»• sung text/plain fallback, khÃ´ng can thiá»‡p HTML
    this.listenTo(
      editor.editing.view.document,
      'clipboardOutput',
      (evt, data) => {
        const isCopyOrCut = data.method === 'copy' || data.method === 'cut';
        if (!isCopyOrCut) return;

        const dataTransfer = data.dataTransfer;
        const content = data.content;

        // Opt 3: Chá»‰ visit element nodes, bá» qua cÃ¡c node khÃ´ng liÃªn quan
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

        // HTML content giá»¯ nguyÃªn â€” CKEditor sáº½ tá»± xá»­ lÃ½ upcast khi paste láº¡i
      },
      { priority: 'low' }
    );

    // -------------------------------------------------------------------------
    // 9. Xá»­ lÃ½ sá»± kiá»‡n Paste (Clipboard Input)
    // -------------------------------------------------------------------------
    // Náº¿u paste tá»« external source (chá»‰ cÃ³ text, khÃ´ng cÃ³ HTML variable)
    // thÃ¬ chuyá»ƒn {{text}} thÃ nh variable widget
    this.listenTo(
      editor.editing.view.document,
      'clipboardInput',
      async (evt, data: any) => {
        const dataTransfer = data.dataTransfer;

        // Náº¿u cÃ³ HTML chá»©a variable-widget thÃ¬ Ä‘á»ƒ CKEditor xá»­ lÃ½ (upcast converter)
        // Viá»‡c chá»‘ng trÃ¹ng uuid (regenerate) Ä‘Ã£ Ä‘Æ°á»£c xá»­ lÃ½ á»Ÿ upcast converter dá»±a vÃ o biáº¿n isPasting
        let html = dataTransfer.getData('text/html');
        if (html && html.includes('variable-widget')) {
          return;
        }

        // Chá»‰ xá»­ lÃ½ náº¿u chá»‰ cÃ³ plain text vá»›i pattern {{text}}
        const text = dataTransfer.getData('text/plain');
        if (!text) return;

        // Kiá»ƒm tra cÃ³ chá»©a pattern {{text}} khÃ´ng
        const variablePattern = /\{\{([^}]+)\}\}/g;
        if (!variablePattern.test(text)) {
          return;
        }

        // Reset lastIndex sau khi test
        variablePattern.lastIndex = 0;

        evt.stop();

        // Bug 2 Fix (Q1-A): Láº¥y option Ä‘á»ƒ gá»i onPasteVariable callback náº¿u cÃ³
        const config = editor.config as Config<SdEditorConfig>;
        const getOption = config.get('getOption') as SdEditorConfig['getOption'];
        const option = getOption?.();

        // TÃ¡ch text thÃ nh cÃ¡c pháº§n: normal text vÃ  variables
        let lastIndex = 0;
        let match;
        const fragments: Array<{ type: 'text' | 'variable'; content: string; display?: string }> = [];

        while ((match = variablePattern.exec(text)) !== null) {
          // ThÃªm text trÆ°á»›c variable
          if (match.index > lastIndex) {
            fragments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
          }
          fragments.push({ type: 'variable', content: match[0], display: match[1] });
          lastIndex = match.index + match[0].length;
        }

        // ThÃªm text cÃ²n láº¡i sau variable cuá»‘i cÃ¹ng
        if (lastIndex < text.length) {
          fragments.push({ type: 'text', content: text.slice(lastIndex) });
        }

        // Bug 2 Fix: Resolve táº¥t cáº£ variable fragments trÆ°á»›c khi thá»±c hiá»‡n model.change
        // TrÃ¡nh async operation bÃªn trong model.change (CKEditor khÃ´ng há»— trá»£ async writer)

        // XÃ¢y dá»±ng lookup map tá»« variables Ä‘ang cÃ³ trong document (theo display name)
        // DÃ¹ng Ä‘á»ƒ fallback khi khÃ´ng cÃ³ onPasteVariable â€” giá»¯ láº¡i Ä‘áº§y Ä‘á»§ id/value cá»§a biáº¿n gá»‘c
        // khi copy-paste ná»™i bá»™ bá»‹ máº¥t HTML (chá»‰ cÃ²n plain text {{display}})
        const existingVariableMap = this.#buildDisplayMap();

        const resolvedFragments: Array<{ type: 'text' | 'variable'; content: string; variable?: SdDocumentBuilderVariable }> = [];
        for (const fragment of fragments) {
          if (fragment.type === 'variable' && fragment.display) {
            let resolved: SdDocumentBuilderVariable | null = null;

            if (option?.onPasteVariable) {
              try {
                resolved = await SdResolveMaybeAsync<SdDocumentBuilderVariable | null>(option.onPasteVariable(fragment.display));
              } catch (e) {
                console.warn(`[VariablePlugin] onPasteVariable("${fragment.display}") tháº¥t báº¡i:`, e);
              }
            }

            // Fallback 1: Tra cá»©u variable Ä‘ang cÃ³ trong document theo display name
            // â†’ Giá»¯ láº¡i Ä‘áº§y Ä‘á»§ id/value khi copy-paste ná»™i bá»™ bá»‹ máº¥t HTML
            if (!resolved) {
              resolved = existingVariableMap.get(fragment.display) ?? null;
            }

            // Fallback 2: KhÃ´ng tÃ¬m tháº¥y â†’ táº¡o variable sentinel vá»›i id = ''
            // Consumer cÃ³ thá»ƒ filter qua variable.all() vÃ  nháº­n biáº¿t báº±ng id === ''
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

        // ChÃ¨n tá»«ng fragment vÃ o document
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

          // Äáº·t con trá» sau ná»™i dung vá»«a paste
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
   * QuÃ©t táº¥t cáº£ variable elements trong document hiá»‡n táº¡i, tráº£ vá» Map<display, SdDocumentBuilderVariable>.
   * DÃ¹ng lÃ m fallback khi paste {{display}} mÃ  khÃ´ng cÃ³ onPasteVariable callback:
   * náº¿u document Ä‘Ã£ cÃ³ variable cÃ¹ng display â†’ tÃ¡i sá»­ dá»¥ng id/value cá»§a biáº¿n gá»‘c.
   * Náº¿u cÃ³ nhiá»u variable cÃ¹ng display â†’ láº¥y cÃ¡i Ä‘áº§u tiÃªn tÃ¬m Ä‘Æ°á»£c.
   */
  #buildDisplayMap = (): Map<string, SdDocumentBuilderVariable> => {
    const map = new Map<string, SdDocumentBuilderVariable>();
    const root = this.editor.model.document.getRoot();
    if (!root) return map;

    const range = this.editor.model.createRangeIn(root);
    for (const item of range.getItems()) {
      if (item.is('element', 'variable')) {
        const display = item.getAttribute('display') as string;
        // Chá»‰ lÆ°u láº§n Ä‘áº§u tiÃªn gáº·p display nÃ y
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
  // PUBLIC API â€” Variable management
  // =========================================================================

  /**
   * Láº¥y táº¥t cáº£ variables trong document.
   * @returns Danh sÃ¡ch táº¥t cáº£ variables (bao gá»“m bindingValue náº¿u Ä‘Ã£ binding)
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
   * Scroll tá»›i vá»‹ trÃ­ cá»§a variable theo uuid.
   * @param uuid - uuid cá»§a variable (FE tá»± sinh sau má»—i láº§n drop)
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
      console.warn(`Variable vá»›i uuid "${uuid}" khÃ´ng tÃ¬m tháº¥y trong tÃ i liá»‡u.`);
    }
  }

  /**
   * GÃ¡n giÃ¡ trá»‹ cho Táº¤T Cáº¢ variable cÃ³ cÃ¹ng id trong document.
   * Náº¿u value rá»—ng â†’ tá»± Ä‘á»™ng gá»i clearValue(id).
   * @param id    - id cá»§a variable definition
   * @param value - giÃ¡ trá»‹ binding cáº§n hiá»ƒn thá»‹
   * @returns sá»‘ instance Ä‘Ã£ Ä‘Æ°á»£c cáº­p nháº­t
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
   * XÃ³a binding value cá»§a Táº¤T Cáº¢ variable cÃ³ cÃ¹ng id.
   * @param id - id cá»§a variable definition
   * @returns sá»‘ instance Ä‘Ã£ Ä‘Æ°á»£c cáº­p nháº­t
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
   * Batch bind nhiá»u variables theo map { id â†’ value }.
   * ToÃ n bá»™ thá»±c hiá»‡n trong 1 model.change() â†’ 1 undo step duy nháº¥t.
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
   * Batch clear binding cá»§a nhiá»u variables.
   * @param ids - danh sÃ¡ch id cáº§n clear; náº¿u khÃ´ng truyá»n/rá»—ng â†’ clear Táº¤T Cáº¢
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

  /** XÃ³a toÃ n bá»™ binding values trong document. Shorthand cá»§a clearValues(). */
  clearAllValues(): void {
    this.clearValues();
  }
}

