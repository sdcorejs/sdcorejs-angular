import { Plugin, ContextualBalloon, ButtonView, ModelRange, View } from 'ckeditor5';
import { I18nService } from '@sdcorejs/angular/i18n';
import { CkComment, CkCommentConfig, CkCommentColors, CkCommentSelection } from './ck-comment.plugin.model';

export class CkCommentPlugin extends Plugin {
  static get pluginName() {
    return 'CkComment';
  }

  static get requires() {
    return [ContextualBalloon];
  }

  #comments: Map<string | number, CkComment> = new Map();
  // i18n Ä‘á»c tá»« editor.config â€” plugin khÃ´ng cÃ³ DI nÃªn dÃ¹ng pattern nÃ y; fallback giá»¯ VI Ä‘á»ƒ consumer chÆ°a setup váº«n cháº¡y
  #getI18n(): I18nService | undefined {
    return (this.editor.config as { get(key: string): unknown }).get('_i18n') as I18nService | undefined;
  }
  #selectedId: string | number | null = null;
  #pendingId: string | null = null; // ID cho pending highlight
  #isCreatingPending: boolean = false; // Flag Ä‘á»ƒ prevent clearing pending khi Ä‘ang táº¡o
  #isProcessingClick: boolean = false; // Flag Ä‘á»ƒ prevent duplicate click events
  #balloon!: ContextualBalloon;
  #config: CkCommentConfig = {};

  // Háº±ng sá»‘ ID cho pending marker
  static readonly PENDING_MARKER_ID = '__pending_comment__';

  // Sá»‘ node tÃ¬m kiáº¿m máº·c Ä‘á»‹nh khi path khÃ´ng chÃ­nh xÃ¡c
  static readonly DEFAULT_SEARCH_RANGE = 5;

  // Äá»™ dÃ i text tá»‘i Ä‘a Ä‘á»ƒ táº¡o marker
  static readonly DEFAULT_MAX_TEXT_LENGTH = 1000;

  // MÃ u sáº¯c máº·c Ä‘á»‹nh cho markers
  static readonly DEFAULT_COLORS: CkCommentColors = {
    marker: 'rgba(59, 130, 246, 0.2)',
    markerSelected: 'rgba(59, 130, 246, 0.5)',
    markerPending: 'rgba(245, 158, 11, 0.4)',
    markerModified: 'rgba(255, 193, 7, 0.4)',
  };

  /**
   * Debug log - chá»‰ log khi debug config lÃ  true
   */
  #log(...args: any[]): void {
    if (this.#config.debug) {
      console.log('[CkCommentPlugin]', ...args);
    }
  }

  /**
   * Debug warn - chá»‰ warn khi debug config lÃ  true
   */
  #warn(...args: any[]): void {
    if (this.#config.debug) {
      console.warn('[CkCommentPlugin]', ...args);
    }
  }

  /**
   * Láº¥y mÃ u sáº¯c Ä‘Ã£ merge vá»›i default
   */
  #getColors(): CkCommentColors {
    return { ...CkCommentPlugin.DEFAULT_COLORS, ...this.#config.colors };
  }

  init() {
    const editor = this.editor;
    this.#balloon = editor.plugins.get(ContextualBalloon);

    this.#log('init() called');

    // Thiáº¿t láº­p marker to highlight conversion
    this.#setupMarkerConversion();

    // Thiáº¿t láº­p click handler cho markers
    this.#setupMarkerClickHandler();

    // Thiáº¿t láº­p toolbar button
    this.#setupToolbarButton();

    // Thiáº¿t láº­p ContextualBalloon cho text selection (tÃ¹y chá»n)
    this.#setupContextualBalloon();

    // Theo dÃµi thay Ä‘á»•i ná»™i dung Ä‘á»ƒ cáº­p nháº­t tráº¡ng thÃ¡i comment
    this.#setupChangeTracking();
  }

  // ========================================================================
  // TOOLBAR BUTTON
  // ========================================================================

  #setupToolbarButton() {
    const editor = this.editor;

    editor.ui.componentFactory.add('ckCommentBtn', locale => {
      const view = new ButtonView(locale);

      const i18n = this.#getI18n();
      view.set({
        label: i18n?.t('core.component.document-builder.ck-comment.label') ?? '',
        icon: '<svg width="16px" height="16px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M18 13v6l-4-4H4a2 2 0 01-2-2V4a2 2 0 012-2h14a2 2 0 012 2v9zM5 7h10v2H5V7zm0 4h10v2H5v-2z"/></svg>',
        tooltip: true,
        isEnabled: false,
      });

      // Enable khi cÃ³ selection, khÃ´ng pháº£i chá»‰ khoáº£ng tráº¯ng, vÃ  allowCreating = true
      const selection = editor.model.document.selection;
      this.listenTo(selection, 'change', () => {
        // Disabled ngay khi allowCreating = false
        if (!(this.#config.allowCreating ?? true)) {
          view.isEnabled = false;
          return;
        }

        const isCollapsed = selection.isCollapsed;
        const range = selection.getFirstRange();

        // Kiá»ƒm tra xem selection cÃ³ content khÃ´ng pháº£i khoáº£ng tráº¯ng khÃ´ng
        let hasValidContent = false;
        if (range && !isCollapsed) {
          const text = this.#getTextFromRange(range);
          const trimmedText = text.trim();
          const maxTextLength = this.#config.maxTextLength ?? CkCommentPlugin.DEFAULT_MAX_TEXT_LENGTH;
          // Kiá»ƒm tra: cÃ³ content, khÃ´ng pháº£i chá»‰ khoáº£ng tráº¯ng, vÃ  khÃ´ng vÆ°á»£t quÃ¡ max length
          hasValidContent = trimmedText.length > 0 && trimmedText.length <= maxTextLength;

          if (trimmedText.length > maxTextLength) {
            // @i18n-ignore â€” dev-only debug log, khÃ´ng hiá»ƒn thá»‹ cho ngÆ°á»i dÃ¹ng
            this.#log(`Äá»™ dÃ i text vÆ°á»£t quÃ¡ giá»›i háº¡n: ${trimmedText.length} > ${maxTextLength}`);
          }
        }

        view.isEnabled = hasValidContent;
      });

      // Xá»­ lÃ½ khi click button
      this.listenTo(view, 'execute', () => {
        this.#log('Toolbar button clicked');
        const selectionData = this.#getSelectionData();
        if (selectionData) {
          // Set flag Ä‘á»ƒ prevent clearing pending khi selection change
          this.#isCreatingPending = true;

          this.#log('Calling onPendingComment callback');
          this.#config.onPendingComment?.({
            id: '',
            startPath: selectionData.startPath,
            endPath: selectionData.endPath,
            originalText: selectionData.text,
            currentText: selectionData.text,
            status: 'normal',
          });

          // Reset flag sau má»™t khoáº£ng ngáº¯n Ä‘á»ƒ cho phÃ©p clear náº¿u selection thá»±c sá»± thay Ä‘á»•i
          setTimeout(() => {
            this.#isCreatingPending = false;
          }, 100);
        }
      });

      return view;
    });
  }

  // ========================================================================
  // MARKER CONVERSION
  // ========================================================================

  #setupMarkerConversion() {
    const self = this;

    this.editor.conversion.for('editingDowncast').markerToHighlight({
      model: 'comment',
      view: (data: { markerRange: ModelRange; markerName: string }) => {
        const markerName = data.markerName;
        const commentId = markerName.replace('comment:', '');
        const classes = ['ck-comment-marker'];
        const colors = self.#getColors();

        // Kiá»ƒm tra xem cÃ³ pháº£i pending marker khÃ´ng
        if (commentId === CkCommentPlugin.PENDING_MARKER_ID) {
          classes.push('ck-comment-pending');
          return {
            classes: classes,
            attributes: {
              'data-comment-id': commentId,
              style: `--comment-pending-bg: ${colors.markerPending}`,
            },
          };
        }

        const comment = self.#comments.get(commentId);

        // Build CSS variables based on status - ALWAYS set the correct variable for the status
        let cssVars: string[] = [];

        if (comment) {
          // Add status class
          classes.push(`ck-comment-${comment.status}`);

          // Set CSS variable based on status
          if (comment.status === 'modified') {
            cssVars = [`--comment-modified-bg: ${colors.markerModified}`];
          } else if (comment.status === 'broken') {
            cssVars = [`--comment-broken-bg: ${colors.markerBroken}`];
          } else {
            // normal status
            cssVars = [`--comment-bg: ${colors.marker}`];
          }

          // Add selected state if needed
          if (commentId === self.#selectedId) {
            classes.push('ck-comment-selected');
            cssVars.push(`--comment-selected-bg: ${colors.markerSelected}`);
          }
        } else {
          // No comment found - use default
          cssVars = [`--comment-bg: ${colors.marker}`];
        }

        return {
          classes: classes,
          attributes: {
            'data-comment-id': commentId,
            style: cssVars.join('; '),
          },
        };
      },
    });
  }

  // ========================================================================
  // CLICK HANDLER
  // ========================================================================

  #setupMarkerClickHandler() {
    const viewDocument = this.editor.editing.view.document;

    // Láº¯ng nghe cáº£ click vÃ  mousedown trÃªn CKEditor view
    viewDocument.on('mousedown', (evt: any, data: any) => {
      this.#log('Mousedown event triggered, data:', data);
      this.#handleMarkerClick(evt, data);
    });

    viewDocument.on('click', (evt: any, data: any) => {
      this.#log('Click event triggered, data:', data);
      this.#handleMarkerClick(evt, data);
    });

    // ThÃªm DOM event listener nhÆ° fallback Ä‘á»ƒ Ä‘áº£m báº£o báº¯t Ä‘Æ°á»£c click
    // Sá»­ dá»¥ng editor's editable DOM element
    const editableElement = this.editor.ui.getEditableElement();
    if (editableElement) {
      editableElement.addEventListener('click', (domEvent: Event) => {
        this.#log('DOM click event triggered');
        this.#handleDomMarkerClick(domEvent as MouseEvent, editableElement);
      });
    }
  }

  /**
   * Handle DOM click event (fallback)
   */
  #handleDomMarkerClick(domEvent: MouseEvent, rootElement: Element) {
    // Prevent duplicate if already processing
    if (this.#isProcessingClick) {
      this.#log('DOM click skipped - already processing');
      return;
    }

    let targetElement: Element | null = domEvent.target as Element;

    // Traverse up to find marker element
    while (targetElement && targetElement !== rootElement) {
      if (targetElement.classList?.contains('ck-comment-marker')) {
        const commentId = targetElement.getAttribute('data-comment-id');
        this.#log('DOM click found marker with commentId:', commentId);
        if (commentId) {
          this.#isProcessingClick = true;
          this.selectComment(commentId, false);
          domEvent.stopPropagation();
          domEvent.preventDefault();

          // Reset flag after a short delay
          setTimeout(() => {
            this.#isProcessingClick = false;
          }, 50);
        }
        return;
      }
      targetElement = targetElement.parentElement;
    }

    // Click outside markers - clear selection
    if (this.#selectedId) {
      this.#log('DOM click outside markers, clearing selection');
      this.#selectedId = null;
      this.#refreshView();
    }
  }

  #handleMarkerClick(evt: any, data: any) {
    // Prevent duplicate if already processing
    if (this.#isProcessingClick) {
      this.#log('View click skipped - already processing');
      return;
    }

    const viewElement = data.target;
    let element: any = viewElement;

    this.#log('Target element:', element, 'hasClass:', typeof element?.hasClass);

    // Duyá»‡t lÃªn cÃ¢y Ä‘á»ƒ tÃ¬m comment marker
    while (element) {
      const hasMarkerClass = element.hasClass?.('ck-comment-marker');
      this.#log('Checking element, hasMarkerClass:', hasMarkerClass);

      if (hasMarkerClass) {
        const commentId = element.getAttribute('data-comment-id');
        this.#log('Found marker with commentId:', commentId);
        this.#isProcessingClick = true;
        this.selectComment(commentId, false);
        evt.stop();

        // Reset flag after a short delay
        setTimeout(() => {
          this.#isProcessingClick = false;
        }, 50);
        return;
      }
      element = element.parent;
    }

    // Click ngoÃ i markers - xÃ³a selection
    if (this.#selectedId) {
      this.#log('Click outside markers, clearing selection');
      this.#selectedId = null;
      this.#refreshView();
    }
  }

  // ========================================================================
  // CONTEXTUAL BALLOON
  // ========================================================================

  #setupContextualBalloon() {
    const editor = this.editor;
    const selection = editor.model.document.selection;

    this.#log('#setupContextualBalloon initialized');

    // Láº¯ng nghe selection changes
    this.listenTo(selection, 'change:range', () => {
      this.#log('Selection change:range, isCollapsed:', selection.isCollapsed);

      // XÃ³a pending náº¿u selection thay Ä‘á»•i sang text khÃ¡c
      // NHÆ¯NG khÃ´ng xÃ³a náº¿u Ä‘ang trong quÃ¡ trÃ¬nh táº¡o pending
      if (this.#pendingId && !this.#isCreatingPending) {
        this.#log('Selection changed, clearing pending');
        this.clearPendingSelection();
      } else if (this.#isCreatingPending) {
        this.#log('Skipping clear pending - isCreatingPending flag is set');
      }

      if (!selection.isCollapsed) {
        // Chá»‰ hiá»‡n balloon khi allowCreating = true (máº·c Ä‘á»‹nh)
        if (!(this.#config.allowCreating ?? true)) {
          this.#hideBalloon();
          return;
        }

        const range = selection.getFirstRange();
        if (range) {
          // Chá»‰ hiá»‡n balloon khi selection cÃ³ content khÃ´ng pháº£i khoáº£ng tráº¯ng vÃ  khÃ´ng vÆ°á»£t quÃ¡ max length
          const text = this.#getTextFromRange(range);
          const trimmedText = text.trim();
          const maxTextLength = this.#config.maxTextLength ?? CkCommentPlugin.DEFAULT_MAX_TEXT_LENGTH;
          if (trimmedText.length > 0 && trimmedText.length <= maxTextLength) {
            this.#showBalloon(range);
          } else {
            this.#hideBalloon();
          }
        }
      } else {
        this.#hideBalloon();
      }
    });

    // áº¨n balloon khi focus thay Ä‘á»•i
    this.listenTo(editor.ui, 'update', () => {
      if (selection.isCollapsed) {
        this.#hideBalloon();
      }
    });
  }

  #showBalloon(range: ModelRange) {
    this.#log('#showBalloon called, range:', range);
    const editor = this.editor;

    // áº¨n balloon hiá»‡n táº¡i trÆ°á»›c
    this.#hideBalloon();

    // Táº¡o balloon button
    const buttonView = new ButtonView(editor.locale);
    const balloonI18n = this.#getI18n();
    buttonView.set({
      label: balloonI18n?.t('core.component.document-builder.ck-comment.label') ?? '',
      icon: '<svg width="16px" height="16px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M18 13v6l-4-4H4a2 2 0 01-2-2V4a2 2 0 012-2h14a2 2 0 012 2v9zM5 7h10v2H5V7zm0 4h10v2H5v-2z"/></svg>',
      tooltip: true,
      withText: true,
    });

    // Xá»­ lÃ½ khi click button
    this.listenTo(buttonView, 'execute', () => {
      this.#log('Balloon button clicked');
      const selection = this.#getSelectionData();
      this.#log('Selection data:', selection);
      if (selection) {
        // Set flag Ä‘á»ƒ prevent clearing pending khi selection change
        this.#isCreatingPending = true;

        this.#log('Calling onPendingComment callback');
        this.#config.onPendingComment?.({
          id: '',
          startPath: selection.startPath,
          endPath: selection.endPath,
          originalText: selection.text,
          currentText: selection.text,
          status: 'normal',
        });

        // Reset flag sau má»™t khoáº£ng ngáº¯n
        setTimeout(() => {
          this.#isCreatingPending = false;
        }, 100);
      }
      this.#hideBalloon();
    });

    // ThÃªm vÃ o balloon
    try {
      this.#balloon.add({
        view: buttonView,
        position: {
          target: () => {
            const viewRange = editor.editing.mapper.toViewRange(range);
            return editor.editing.view.domConverter.viewRangeToDom(viewRange);
          },
        },
      });
      this.#balloonView = buttonView;
      this.#log('Balloon added successfully');
    } catch (e) {
      this.#warn('Error adding balloon:', e);
    }
  }

  #balloonView: View<HTMLElement> | null = null;

  #hideBalloon() {
    if (this.#balloonView) {
      this.#balloon.remove(this.#balloonView);
      this.#balloonView = null;
    }
  }

  // ========================================================================
  // CHANGE TRACKING
  // ========================================================================

  #setupChangeTracking() {
    const editor = this.editor;

    // Láº¯ng nghe thay Ä‘á»•i dá»¯ liá»‡u
    editor.model.document.on('change:data', () => {
      this.#updateCommentStatuses();
    });

    // Láº¯ng nghe thay Ä‘á»•i marker
    editor.model.document.on('change:markers', () => {
      this.#updateCommentStatuses();
    });
  }

  #updateCommentStatuses() {
    let hasChanges = false;

    this.#comments.forEach((comment, id) => {
      const marker = this.editor.model.markers.get(`comment:${id}`);

      if (marker) {
        const range = marker.getRange();
        const currentText = this.#getTextFromRange(range);

        // Tá»± Ä‘á»™ng cáº­p nháº­t paths (CKEditor duy trÃ¬ chÃºng)
        const newStartPath = Array.from(range.start.path);
        const newEndPath = Array.from(range.end.path);

        const pathChanged =
          JSON.stringify(comment.startPath) !== JSON.stringify(newStartPath) ||
          JSON.stringify(comment.endPath) !== JSON.stringify(newEndPath);

        const textChanged = currentText !== comment.currentText;

        if (pathChanged || textChanged) {
          const oldStatus = comment.status;
          hasChanges = true;
          comment.startPath = newStartPath;
          comment.endPath = newEndPath;
          comment.currentText = currentText;

          // Cáº­p nháº­t tráº¡ng thÃ¡i
          if (currentText === comment.originalText) {
            comment.status = 'normal';
          } else if (currentText.length === 0) {
            comment.status = 'broken';
          } else {
            comment.status = 'modified';
          }

          this.#log(
            `Comment ${id} status changed: ${oldStatus} -> ${comment.status}`,
            `\n  originalText: "${comment.originalText}"`,
            `\n  currentText: "${currentText}"`,
            `\n  textChanged: ${textChanged}`
          );
        }
      } else {
        // KhÃ´ng tÃ¬m tháº¥y marker - bá»‹ há»ng
        if (comment.status !== 'broken') {
          const oldStatus = comment.status;
          hasChanges = true;
          comment.status = 'broken';
          this.#log(`Comment ${id} marker not found, status changed: ${oldStatus} -> broken`);
        }
      }
    });

    if (hasChanges) {
      this.#refreshView();
      this.#fireOnChange();
    }
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  /**
   * Thiáº¿t láº­p config vá»›i callbacks
   */
  setConfig(config: CkCommentConfig) {
    this.#config = config;
  }

  /**
   * ThÃªm comment vÃ  táº¡o marker
   */
  addComment(comment: CkComment): boolean {
    if (this.#comments.has(comment.id)) {
      this.#warn(`Comment with id ${comment.id} already exists`);
      return false;
    }

    // Táº¡o marker
    const success = this.#createMarker(comment);

    // LÆ°u comment (vá»›i tráº¡ng thÃ¡i broken náº¿u marker tháº¥t báº¡i)
    const storedComment = success ? { ...comment } : { ...comment, status: 'broken' as const };
    this.#comments.set(comment.id, storedComment);

    this.#refreshView();
    this.#fireOnChange();

    // Chá»‰ fire onAddComment callback KHI thÃªm thÃ nh cÃ´ng (khÃ´ng pháº£i broken)
    if (success) {
      this.#config.onAddComment?.(storedComment);
    }

    return true;
  }

  /**
   * XÃ³a comment theo id
   */
  removeComment(id: string | number): boolean {
    const comment = this.#comments.get(id);
    if (!comment) {
      return false;
    }

    // XÃ³a marker
    this.editor.model.change(writer => {
      writer.removeMarker(`comment:${id}`);
    });

    // XÃ³a khá»i map
    this.#comments.delete(id);

    // XÃ³a selection náº¿u bá»‹ xÃ³a
    if (this.#selectedId === id) {
      this.#selectedId = null;
    }

    this.#refreshView();
    this.#fireOnChange();

    return true;
  }

  /**
   * Chá»n comment theo id - chá»‰ thÃªm class highlight, khÃ´ng bÃ´i Ä‘en text
   */
  selectComment(id: string | number, scrollIntoView: boolean = true): void {
    this.#log('selectComment called with id:', id, 'hasComment:', this.#comments.has(id));

    if (!this.#comments.has(id)) {
      this.#warn('Comment not found:', id);
      return;
    }

    this.#selectedId = id;
    this.#refreshView();
    if (scrollIntoView) {
      this.#scrollToComment(id);
    }

    this.#log('Firing onSelectComment callback for id:', id);
    this.#config.onSelectComment?.(id);
  }

  /**
   * Thiáº¿t láº­p táº¥t cáº£ comments (khÃ´i phá»¥c tá»« dá»¯ liá»‡u)
   */
  setComments(comments: CkComment[]): void {
    this.#log('setComments called with', comments.length, 'comments');

    // XÃ³a comments hiá»‡n táº¡i
    this.#log('Clearing existing comments, count:', this.#comments.size);
    this.#comments.forEach((_, id) => {
      const markerName = `comment:${id}`;
      if (this.editor.model.markers.has(markerName)) {
        this.#log('Removing marker:', markerName);
        this.editor.model.change(writer => {
          writer.removeMarker(markerName);
        });
      } else {
        this.#warn('Marker not found, skipping:', markerName);
      }
    });
    this.#comments.clear();
    this.#selectedId = null;

    // ThÃªm comments má»›i - status sáº½ Ä‘Æ°á»£c tÃ­nh toÃ¡n Ä‘á»™ng tá»« editor
    comments.forEach(comment => {
      const success = this.#createMarker(comment);
      // LÆ°u comment vá»›i status máº·c Ä‘á»‹nh, sáº½ Ä‘Æ°á»£c cáº­p nháº­t bá»Ÿi #updateCommentStatuses
      const storedComment = {
        ...comment,
        status: success ? ('normal' as const) : ('broken' as const),
        currentText: success ? comment.originalText : '',
      };
      this.#comments.set(comment.id, storedComment);
    });

    this.#refreshView();
    this.#fireOnChange();
  }

  /**
   * Láº¥y táº¥t cáº£ comments
   */
  get comments(): CkComment[] {
    return Array.from(this.#comments.values());
  }

  /**
   * Thiáº¿t láº­p pending highlight cho selection (khi user Ä‘ang nháº­p ná»™i dung comment)
   */
  setPendingSelection(startPath: number[], endPath: number[]): boolean {
    // XÃ³a pending marker hiá»‡n táº¡i MÃ€ KHÃ”NG fire callback
    this.#clearPendingMarker();

    const model = this.editor.model;

    try {
      model.change(writer => {
        const root = model.document.getRoot();
        if (!root) {
          throw new Error('Document root not found');
        }
        const startPos = writer.createPositionFromPath(root, startPath);
        const endPos = writer.createPositionFromPath(root, endPath);
        const range = writer.createRange(startPos, endPos);

        writer.addMarker(`comment:${CkCommentPlugin.PENDING_MARKER_ID}`, {
          range,
          usingOperation: false,
          affectsData: false,
        });
      });

      this.#pendingId = CkCommentPlugin.PENDING_MARKER_ID;
      this.#refreshView();
      return true;
    } catch (e) {
      this.#warn('Failed to set pending selection:', e);
      return false;
    }
  }

  /**
   * XÃ³a pending marker mÃ  khÃ´ng fire callback (dÃ¹ng ná»™i bá»™)
   */
  #clearPendingMarker(): void {
    if (!this.#pendingId) return;

    this.editor.model.change(writer => {
      writer.removeMarker(`comment:${CkCommentPlugin.PENDING_MARKER_ID}`);
    });

    this.#pendingId = null;
    this.#refreshView();
  }

  /**
   * XÃ³a pending highlight vÃ  fire onCancelPending callback
   */
  clearPendingSelection(): void {
    if (!this.#pendingId) return;

    this.#clearPendingMarker();

    // Fire callback Ä‘á»ƒ thÃ´ng bÃ¡o UI
    this.#config.onCancelPending?.();
  }

  /**
   * Láº¥y dá»¯ liá»‡u selection hiá»‡n táº¡i Ä‘á»ƒ táº¡o comment
   * Trim khoáº£ng tráº¯ng Ä‘á»ƒ trÃ¡nh sai vá»‹ trÃ­ khi lÆ°u
   */
  #getSelectionData(): CkCommentSelection | null {
    const selection = this.editor.model.document.selection;
    const range = selection.getFirstRange();

    if (!range || range.isCollapsed) {
      return null;
    }

    // Validate: start/end khÃ´ng Ä‘Æ°á»£c náº±m bÃªn trong isObject element (path.length > 2)
    // TrÆ°á»ng há»£p xáº£y ra khi user drag-select qua bound variable widget
    if (range.start.path.length > 2 || range.end.path.length > 2) {
      this.#warn('Selection contains invalid path (inside isObject element) - aborting comment creation', {
        startPath: Array.from(range.start.path),
        endPath: Array.from(range.end.path),
      });
      return null;
    }

    const text = this.#getTextFromRange(range);
    const trimmedText = text.trim();

    if (!trimmedText) {
      return null;
    }

    // Kiá»ƒm tra Ä‘á»™ dÃ i text tá»‘i Ä‘a
    const maxTextLength = this.#config.maxTextLength ?? CkCommentPlugin.DEFAULT_MAX_TEXT_LENGTH;
    if (trimmedText.length > maxTextLength) {
      this.#warn(`Text too long: ${trimmedText.length} > ${maxTextLength}`);
      // Fire error callback
      const errorI18n = this.#getI18n();
      this.#config.onError?.({
        code: 'TEXT_TOO_LONG',
        message: errorI18n?.t('core.component.document-builder.ck-comment.text-too-long', { length: trimmedText.length, max: maxTextLength }) ?? '',
        data: { textLength: trimmedText.length, maxLength: maxTextLength },
      });
      return null;
    }

    // TÃ­nh toÃ¡n sá»‘ kÃ½ tá»± cáº§n trim á»Ÿ Ä‘áº§u vÃ  cuá»‘i
    const leadingWhitespace = text.length - text.trimStart().length;
    const trailingWhitespace = text.length - text.trimEnd().length;

    // Äiá»u chá»‰nh range Ä‘á»ƒ loáº¡i bá» khoáº£ng tráº¯ng
    let adjustedRange = range;
    if (leadingWhitespace > 0 || trailingWhitespace > 0) {
      adjustedRange = this.#adjustRangeForTrim(range, leadingWhitespace, trailingWhitespace);
    }

    // Validate láº¡i sau khi trim
    if (adjustedRange.start.path.length > 2 || adjustedRange.end.path.length > 2) {
      this.#warn('Adjusted range has invalid path depth - aborting');
      return null;
    }

    return {
      range: adjustedRange,
      startPath: Array.from(adjustedRange.start.path),
      endPath: Array.from(adjustedRange.end.path),
      text: trimmedText,
    };
  }


  /**
   * Äiá»u chá»‰nh range Ä‘á»ƒ loáº¡i bá» khoáº£ng tráº¯ng Ä‘áº§u/cuá»‘i.
   * Äáº£m báº£o cÃ¡c vá»‹ trÃ­ sau khi dá»‹ch chuyá»ƒn khÃ´ng rÆ¡i vÃ o bÃªn trong isObject element
   * (vÃ­ dá»¥: variable widget Ä‘Ã£ bound) Ä‘á»ƒ trÃ¡nh lá»—i document-selection-wrong-position.
   */
  #adjustRangeForTrim(range: ModelRange, leadingTrim: number, trailingTrim: number): ModelRange {
    const model = this.editor.model;

    /** Kiá»ƒm tra pos cÃ³ há»£p lá»‡ (khÃ´ng náº±m bÃªn trong isObject element) */
    const isValidPosition = (pos: any): boolean => {
      try {
        // path.length > 2 nghÄ©a lÃ  position náº±m sÃ¢u hÆ¡n paragraph â†’ bÃªn trong element
        if (pos.path && pos.path.length > 2) return false;
        // Kiá»ƒm tra node táº¡i vá»‹ trÃ­ Ä‘Ã³
        const nodeAfter = pos.nodeAfter;
        const nodeBefore = pos.nodeBefore;
        // KhÃ´ng cho phÃ©p position báº¯t Ä‘áº§u/káº¿t thÃºc bÃªn trong isObject
        if (nodeAfter && model.schema.isObject(nodeAfter)) return true; // trÆ°á»›c object = ok
        if (nodeBefore && model.schema.isObject(nodeBefore)) return true; // sau object = ok
        return model.schema.checkChild(pos, '$text') || true;
      } catch {
        return false;
      }
    };

    return model.change(writer => {
      let startPos = range.start;
      let endPos = range.end;

      // Dá»‹ch start position forward Ä‘á»ƒ bá» khoáº£ng tráº¯ng Ä‘áº§u
      if (leadingTrim > 0) {
        for (let i = 0; i < leadingTrim && startPos; i++) {
          const nextPos = startPos.getShiftedBy(1);
          if (nextPos && isValidPosition(nextPos)) {
            startPos = nextPos;
          } else {
            break;
          }
        }
      }

      // Dá»‹ch end position backward Ä‘á»ƒ bá» khoáº£ng tráº¯ng cuá»‘i
      if (trailingTrim > 0) {
        for (let i = 0; i < trailingTrim && endPos; i++) {
          const prevPos = endPos.getShiftedBy(-1);
          if (prevPos && prevPos.isAfter(startPos) && isValidPosition(prevPos)) {
            endPos = prevPos;
          } else {
            break;
          }
        }
      }

      return writer.createRange(startPos, endPos);
    });
  }



  // ========================================================================
  // INTERNAL HELPERS
  // ========================================================================

  #createMarker(comment: CkComment): boolean {
    const model = this.editor.model;

    try {
      model.change(writer => {
        const root = model.document.getRoot();
        if (!root) {
          throw new Error('Document root not found');
        }
        const startPos = writer.createPositionFromPath(root, comment.startPath);
        const endPos = writer.createPositionFromPath(root, comment.endPath);
        const range = writer.createRange(startPos, endPos);

        // Validate: kiá»ƒm tra text táº¡i range cÃ³ khá»›p vá»›i originalText khÃ´ng
        const rangeText = this.#getTextFromRange(range);
        this.#log('Range text:', rangeText, 'range:', range);

        if (rangeText !== comment.originalText) {
          this.#warn(
            `Marker text mismatch for comment ${comment.id}:`,
            `\n  Expected: "${comment.originalText}"`,
            `\n  Got: "${rangeText}"`,
            `\n  Trying to find text near original path...`
          );

          // Thá»­ tÃ¬m text gáº§n path gá»‘c
          const searchRange = this.#config.searchRange ?? CkCommentPlugin.DEFAULT_SEARCH_RANGE;
          const foundRange = this.#findTextNearPath(comment.originalText, comment.startPath, comment.endPath, searchRange);

          if (foundRange) {
            this.#log('Found text at new position, updating paths');
            // Cáº­p nháº­t paths cho comment
            comment.startPath = Array.from(foundRange.start.path);
            comment.endPath = Array.from(foundRange.end.path);

            writer.addMarker(`comment:${comment.id}`, {
              range: foundRange,
              usingOperation: true,
              affectsData: false,
            });
            return;
          }

          throw new Error(`Failed to find text "${comment.originalText}" near original path`);
        }

        writer.addMarker(`comment:${comment.id}`, {
          range,
          usingOperation: true, // CKEditor tá»± Ä‘á»™ng cáº­p nháº­t vá»‹ trÃ­
          affectsData: false,
        });
      });

      return true;
    } catch (e) {
      this.#warn(`Failed to create marker for comment ${comment.id}:`, e);
      return false;
    }
  }

  /**
   * TÃ¬m text trong document trong pháº¡m vi Â±searchRange nodes tá»« path gá»‘c
   */
  #findTextNearPath(searchText: string, startPath: number[], endPath: number[], searchRange: number): ModelRange | null {
    if (!searchText) return null;

    const model = this.editor.model;
    const root = model.document.getRoot();
    if (!root) return null;

    // TODO: Implement text search logic here
    // 1. Láº¥y vá»‹ trÃ­ start vÃ  end tá»« cÃ¡c path gá»‘c
    // 2. TÃ¬m kiáº¿m trong pháº¡m vi Â±searchRange nodes tá»« cÃ¡c vá»‹ trÃ­ Ä‘Ã³
    // 3. Tráº£ vá» range náº¿u tÃ¬m tháº¥y text, null náº¿u khÃ´ng tÃ¬m tháº¥y

    return null;
  }

  #getTextFromRange(range: ModelRange): string {
    let text = '';
    for (const item of range.getItems()) {
      if (item.is('$textProxy') || item.is('$text')) {
        text += (item as any).data;
      }
    }
    return text;
  }

  #scrollToComment(id: string | number): void {
    const marker = this.editor.model.markers.get(`comment:${id}`);
    if (!marker) {
      this.#warn('Marker not found for scroll:', id);
      return;
    }

    const editor = this.editor;
    const STICKY_OFFSET = 100; // Offset cho sticky toolbar

    try {
      // Get the model range from marker
      const modelRange = marker.getRange();
      
      // Convert model range to view range
      const viewRange = editor.editing.mapper.toViewRange(modelRange);
      
      // Convert view range to DOM range
      const domRange = editor.editing.view.domConverter.viewRangeToDom(viewRange);

      this.#log('DOM range start:', domRange.startContainer, domRange.startOffset);

      // Get the start position of the range
      let targetElement: Element | Node = domRange.startContainer;
      
      // If it's a text node, get its parent
      if (targetElement.nodeType === Node.TEXT_NODE) {
        targetElement = targetElement.parentElement!;
      }

      this.#log('Target element:', targetElement);

      // Find .builder-container
      let scrollContainer: Element | null = targetElement as Element;
      while (scrollContainer && !scrollContainer.classList?.contains('builder-container')) {
        scrollContainer = scrollContainer.parentElement;
      }

      this.#log('Found scroll container:', scrollContainer);

      if (!scrollContainer) {
        this.#warn('No builder-container found');
        return;
      }

      // Get the target element's position relative to the container
      const containerRect = scrollContainer.getBoundingClientRect();
      const targetRect = (targetElement as Element).getBoundingClientRect();
      const relativeTop = targetRect.top - containerRect.top + scrollContainer.scrollTop - STICKY_OFFSET;

      this.#log('Container top:', containerRect.top);
      this.#log('Target top:', targetRect.top);
      this.#log('Current scroll:', scrollContainer.scrollTop);
      this.#log('Relative top to scroll:', relativeTop);

      scrollContainer.scrollTo({ top: relativeTop, behavior: 'smooth' });
    } catch (e) {
      this.#warn('Error scrolling to comment:', e);
    }
  }

  #refreshView(): void {
    // Force view refresh Ä‘á»ƒ cáº­p nháº­t marker classes
    // Reconvert táº¥t cáº£ comment markers Ä‘á»ƒ cáº­p nháº­t classes cá»§a chÃºng
    const markers = this.editor.model.markers;
    for (const marker of markers) {
      if (marker.name.startsWith('comment:')) {
        this.editor.editing.reconvertMarker(marker.name);
      }
    }
  }

  #fireOnChange(): void {
    this.#config.onChange?.(this.comments);
  }
}

