import { Plugin, ContextualBalloon, ButtonView, ModelRange, View } from 'ckeditor5';
import { CkComment, CkCommentConfig, CkCommentColors, CkCommentSelection } from './ck-comment.plugin.model';

export class CkCommentPlugin extends Plugin {
  static get pluginName() {
    return 'CkComment';
  }

  static get requires() {
    return [ContextualBalloon];
  }

  #comments: Map<string | number, CkComment> = new Map();
  #selectedId: string | number | null = null;
  #pendingId: string | null = null; // ID cho pending highlight
  #isCreatingPending: boolean = false; // Flag để prevent clearing pending khi đang tạo
  #isProcessingClick: boolean = false; // Flag để prevent duplicate click events
  #balloon!: ContextualBalloon;
  #config: CkCommentConfig = {};

  // Hằng số ID cho pending marker
  static readonly PENDING_MARKER_ID = '__pending_comment__';

  // Số node tìm kiếm mặc định khi path không chính xác
  static readonly DEFAULT_SEARCH_RANGE = 5;

  // Độ dài text tối đa để tạo marker
  static readonly DEFAULT_MAX_TEXT_LENGTH = 1000;

  // Màu sắc mặc định cho markers
  static readonly DEFAULT_COLORS: CkCommentColors = {
    marker: 'rgba(59, 130, 246, 0.2)',
    markerSelected: 'rgba(59, 130, 246, 0.5)',
    markerPending: 'rgba(245, 158, 11, 0.4)',
    markerModified: 'rgba(255, 193, 7, 0.4)',
  };

  /**
   * Debug log - chỉ log khi debug config là true
   */
  #log(...args: any[]): void {
    if (this.#config.debug) {
      console.log('[CkCommentPlugin]', ...args);
    }
  }

  /**
   * Debug warn - chỉ warn khi debug config là true
   */
  #warn(...args: any[]): void {
    if (this.#config.debug) {
      console.warn('[CkCommentPlugin]', ...args);
    }
  }

  /**
   * Lấy màu sắc đã merge với default
   */
  #getColors(): CkCommentColors {
    return { ...CkCommentPlugin.DEFAULT_COLORS, ...this.#config.colors };
  }

  init() {
    const editor = this.editor;
    this.#balloon = editor.plugins.get(ContextualBalloon);

    this.#log('init() called');

    // Thiết lập marker to highlight conversion
    this.#setupMarkerConversion();

    // Thiết lập click handler cho markers
    this.#setupMarkerClickHandler();

    // Thiết lập toolbar button
    this.#setupToolbarButton();

    // Thiết lập ContextualBalloon cho text selection (tùy chọn)
    this.#setupContextualBalloon();

    // Theo dõi thay đổi nội dung để cập nhật trạng thái comment
    this.#setupChangeTracking();
  }

  // ========================================================================
  // TOOLBAR BUTTON
  // ========================================================================

  #setupToolbarButton() {
    const editor = this.editor;

    editor.ui.componentFactory.add('ckCommentBtn', locale => {
      const view = new ButtonView(locale);

      view.set({
        label: 'Bình luận',
        icon: '<svg width="16px" height="16px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M18 13v6l-4-4H4a2 2 0 01-2-2V4a2 2 0 012-2h14a2 2 0 012 2v9zM5 7h10v2H5V7zm0 4h10v2H5v-2z"/></svg>',
        tooltip: true,
        isEnabled: false,
      });

      // Enable khi có selection, không phải chỉ khoảng trắng, và allowCreating = true
      const selection = editor.model.document.selection;
      this.listenTo(selection, 'change', () => {
        // Disabled ngay khi allowCreating = false
        if (!(this.#config.allowCreating ?? true)) {
          view.isEnabled = false;
          return;
        }

        const isCollapsed = selection.isCollapsed;
        const range = selection.getFirstRange();

        // Kiểm tra xem selection có content không phải khoảng trắng không
        let hasValidContent = false;
        if (range && !isCollapsed) {
          const text = this.#getTextFromRange(range);
          const trimmedText = text.trim();
          const maxTextLength = this.#config.maxTextLength ?? CkCommentPlugin.DEFAULT_MAX_TEXT_LENGTH;
          // Kiểm tra: có content, không phải chỉ khoảng trắng, và không vượt quá max length
          hasValidContent = trimmedText.length > 0 && trimmedText.length <= maxTextLength;

          if (trimmedText.length > maxTextLength) {
            this.#log(`Độ dài text vượt quá giới hạn: ${trimmedText.length} > ${maxTextLength}`);
          }
        }

        view.isEnabled = hasValidContent;
      });

      // Xử lý khi click button
      this.listenTo(view, 'execute', () => {
        this.#log('Toolbar button clicked');
        const selectionData = this.#getSelectionData();
        if (selectionData) {
          // Set flag để prevent clearing pending khi selection change
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

          // Reset flag sau một khoảng ngắn để cho phép clear nếu selection thực sự thay đổi
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

        // Kiểm tra xem có phải pending marker không
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

    // Lắng nghe cả click và mousedown trên CKEditor view
    viewDocument.on('mousedown', (evt: any, data: any) => {
      this.#log('Mousedown event triggered, data:', data);
      this.#handleMarkerClick(evt, data);
    });

    viewDocument.on('click', (evt: any, data: any) => {
      this.#log('Click event triggered, data:', data);
      this.#handleMarkerClick(evt, data);
    });

    // Thêm DOM event listener như fallback để đảm bảo bắt được click
    // Sử dụng editor's editable DOM element
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

    // Duyệt lên cây để tìm comment marker
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

    // Click ngoài markers - xóa selection
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

    // Lắng nghe selection changes
    this.listenTo(selection, 'change:range', () => {
      this.#log('Selection change:range, isCollapsed:', selection.isCollapsed);

      // Xóa pending nếu selection thay đổi sang text khác
      // NHƯNG không xóa nếu đang trong quá trình tạo pending
      if (this.#pendingId && !this.#isCreatingPending) {
        this.#log('Selection changed, clearing pending');
        this.clearPendingSelection();
      } else if (this.#isCreatingPending) {
        this.#log('Skipping clear pending - isCreatingPending flag is set');
      }

      if (!selection.isCollapsed) {
        // Chỉ hiện balloon khi allowCreating = true (mặc định)
        if (!(this.#config.allowCreating ?? true)) {
          this.#hideBalloon();
          return;
        }

        const range = selection.getFirstRange();
        if (range) {
          // Chỉ hiện balloon khi selection có content không phải khoảng trắng và không vượt quá max length
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

    // Ẩn balloon khi focus thay đổi
    this.listenTo(editor.ui, 'update', () => {
      if (selection.isCollapsed) {
        this.#hideBalloon();
      }
    });
  }

  #showBalloon(range: ModelRange) {
    this.#log('#showBalloon called, range:', range);
    const editor = this.editor;

    // Ẩn balloon hiện tại trước
    this.#hideBalloon();

    // Tạo balloon button
    const buttonView = new ButtonView(editor.locale);
    buttonView.set({
      label: 'Bình luận',
      icon: '<svg width="16px" height="16px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M18 13v6l-4-4H4a2 2 0 01-2-2V4a2 2 0 012-2h14a2 2 0 012 2v9zM5 7h10v2H5V7zm0 4h10v2H5v-2z"/></svg>',
      tooltip: true,
      withText: true,
    });

    // Xử lý khi click button
    this.listenTo(buttonView, 'execute', () => {
      this.#log('Balloon button clicked');
      const selection = this.#getSelectionData();
      this.#log('Selection data:', selection);
      if (selection) {
        // Set flag để prevent clearing pending khi selection change
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

        // Reset flag sau một khoảng ngắn
        setTimeout(() => {
          this.#isCreatingPending = false;
        }, 100);
      }
      this.#hideBalloon();
    });

    // Thêm vào balloon
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

    // Lắng nghe thay đổi dữ liệu
    editor.model.document.on('change:data', () => {
      this.#updateCommentStatuses();
    });

    // Lắng nghe thay đổi marker
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

        // Tự động cập nhật paths (CKEditor duy trì chúng)
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

          // Cập nhật trạng thái
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
        // Không tìm thấy marker - bị hỏng
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
   * Thiết lập config với callbacks
   */
  setConfig(config: CkCommentConfig) {
    this.#config = config;
  }

  /**
   * Thêm comment và tạo marker
   */
  addComment(comment: CkComment): boolean {
    if (this.#comments.has(comment.id)) {
      this.#warn(`Comment with id ${comment.id} already exists`);
      return false;
    }

    // Tạo marker
    const success = this.#createMarker(comment);

    // Lưu comment (với trạng thái broken nếu marker thất bại)
    const storedComment = success ? { ...comment } : { ...comment, status: 'broken' as const };
    this.#comments.set(comment.id, storedComment);

    this.#refreshView();
    this.#fireOnChange();

    // Chỉ fire onAddComment callback KHI thêm thành công (không phải broken)
    if (success) {
      this.#config.onAddComment?.(storedComment);
    }

    return true;
  }

  /**
   * Xóa comment theo id
   */
  removeComment(id: string | number): boolean {
    const comment = this.#comments.get(id);
    if (!comment) {
      return false;
    }

    // Xóa marker
    this.editor.model.change(writer => {
      writer.removeMarker(`comment:${id}`);
    });

    // Xóa khỏi map
    this.#comments.delete(id);

    // Xóa selection nếu bị xóa
    if (this.#selectedId === id) {
      this.#selectedId = null;
    }

    this.#refreshView();
    this.#fireOnChange();

    return true;
  }

  /**
   * Chọn comment theo id - chỉ thêm class highlight, không bôi đen text
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
   * Thiết lập tất cả comments (khôi phục từ dữ liệu)
   */
  setComments(comments: CkComment[]): void {
    this.#log('setComments called with', comments.length, 'comments');

    // Xóa comments hiện tại
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

    // Thêm comments mới - status sẽ được tính toán động từ editor
    comments.forEach(comment => {
      const success = this.#createMarker(comment);
      // Lưu comment với status mặc định, sẽ được cập nhật bởi #updateCommentStatuses
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
   * Lấy tất cả comments
   */
  get comments(): CkComment[] {
    return Array.from(this.#comments.values());
  }

  /**
   * Thiết lập pending highlight cho selection (khi user đang nhập nội dung comment)
   */
  setPendingSelection(startPath: number[], endPath: number[]): boolean {
    // Xóa pending marker hiện tại MÀ KHÔNG fire callback
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
   * Xóa pending marker mà không fire callback (dùng nội bộ)
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
   * Xóa pending highlight và fire onCancelPending callback
   */
  clearPendingSelection(): void {
    if (!this.#pendingId) return;

    this.#clearPendingMarker();

    // Fire callback để thông báo UI
    this.#config.onCancelPending?.();
  }

  /**
   * Lấy dữ liệu selection hiện tại để tạo comment
   * Trim khoảng trắng để tránh sai vị trí khi lưu
   */
  #getSelectionData(): CkCommentSelection | null {
    const selection = this.editor.model.document.selection;
    const range = selection.getFirstRange();

    if (!range || range.isCollapsed) {
      return null;
    }

    // Validate: start/end không được nằm bên trong isObject element (path.length > 2)
    // Trường hợp xảy ra khi user drag-select qua bound variable widget
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

    // Kiểm tra độ dài text tối đa
    const maxTextLength = this.#config.maxTextLength ?? CkCommentPlugin.DEFAULT_MAX_TEXT_LENGTH;
    if (trimmedText.length > maxTextLength) {
      this.#warn(`Text too long: ${trimmedText.length} > ${maxTextLength}`);
      // Fire error callback
      this.#config.onError?.({
        code: 'TEXT_TOO_LONG',
        message: `Văn bản quá dài (${trimmedText.length} ký tự). Tối đa ${maxTextLength} ký tự.`,
        data: { textLength: trimmedText.length, maxLength: maxTextLength },
      });
      return null;
    }

    // Tính toán số ký tự cần trim ở đầu và cuối
    const leadingWhitespace = text.length - text.trimStart().length;
    const trailingWhitespace = text.length - text.trimEnd().length;

    // Điều chỉnh range để loại bỏ khoảng trắng
    let adjustedRange = range;
    if (leadingWhitespace > 0 || trailingWhitespace > 0) {
      adjustedRange = this.#adjustRangeForTrim(range, leadingWhitespace, trailingWhitespace);
    }

    // Validate lại sau khi trim
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
   * Điều chỉnh range để loại bỏ khoảng trắng đầu/cuối.
   * Đảm bảo các vị trí sau khi dịch chuyển không rơi vào bên trong isObject element
   * (ví dụ: variable widget đã bound) để tránh lỗi document-selection-wrong-position.
   */
  #adjustRangeForTrim(range: ModelRange, leadingTrim: number, trailingTrim: number): ModelRange {
    const model = this.editor.model;

    /** Kiểm tra pos có hợp lệ (không nằm bên trong isObject element) */
    const isValidPosition = (pos: any): boolean => {
      try {
        // path.length > 2 nghĩa là position nằm sâu hơn paragraph → bên trong element
        if (pos.path && pos.path.length > 2) return false;
        // Kiểm tra node tại vị trí đó
        const nodeAfter = pos.nodeAfter;
        const nodeBefore = pos.nodeBefore;
        // Không cho phép position bắt đầu/kết thúc bên trong isObject
        if (nodeAfter && model.schema.isObject(nodeAfter)) return true; // trước object = ok
        if (nodeBefore && model.schema.isObject(nodeBefore)) return true; // sau object = ok
        return model.schema.checkChild(pos, '$text') || true;
      } catch {
        return false;
      }
    };

    return model.change(writer => {
      let startPos = range.start;
      let endPos = range.end;

      // Dịch start position forward để bỏ khoảng trắng đầu
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

      // Dịch end position backward để bỏ khoảng trắng cuối
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

        // Validate: kiểm tra text tại range có khớp với originalText không
        const rangeText = this.#getTextFromRange(range);
        this.#log('Range text:', rangeText, 'range:', range);

        if (rangeText !== comment.originalText) {
          this.#warn(
            `Marker text mismatch for comment ${comment.id}:`,
            `\n  Expected: "${comment.originalText}"`,
            `\n  Got: "${rangeText}"`,
            `\n  Trying to find text near original path...`
          );

          // Thử tìm text gần path gốc
          const searchRange = this.#config.searchRange ?? CkCommentPlugin.DEFAULT_SEARCH_RANGE;
          const foundRange = this.#findTextNearPath(comment.originalText, comment.startPath, comment.endPath, searchRange);

          if (foundRange) {
            this.#log('Found text at new position, updating paths');
            // Cập nhật paths cho comment
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
          usingOperation: true, // CKEditor tự động cập nhật vị trí
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
   * Tìm text trong document trong phạm vi ±searchRange nodes từ path gốc
   */
  #findTextNearPath(searchText: string, startPath: number[], endPath: number[], searchRange: number): ModelRange | null {
    if (!searchText) return null;

    const model = this.editor.model;
    const root = model.document.getRoot();
    if (!root) return null;

    // TODO: Implement text search logic here
    // 1. Lấy vị trí start và end từ các path gốc
    // 2. Tìm kiếm trong phạm vi ±searchRange nodes từ các vị trí đó
    // 3. Trả về range nếu tìm thấy text, null nếu không tìm thấy

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
    // Force view refresh để cập nhật marker classes
    // Reconvert tất cả comment markers để cập nhật classes của chúng
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
