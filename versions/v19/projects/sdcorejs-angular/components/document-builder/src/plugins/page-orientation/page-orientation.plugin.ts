import { ButtonView, Plugin } from 'ckeditor5';
// Icon khổ dọc (Mặc định cũ)
const ICON_PORTRAIT =
  '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6V4h8v12z"/></svg>';

// Icon khổ ngang (Mới)
const ICON_LANDSCAPE =
  '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M18 4H2C.9 4 0 4.9 0 6v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 10H2V6h16v8z"/></svg>';
export class PageOrientation extends Plugin {
  public static readonly pluginName = 'PageOrientation';

  private _currentOrientation: 'PORTRAIT' | 'LANDSCAPE' = 'PORTRAIT';
  private orientationChangeEmitter?: (orientation: 'PORTRAIT' | 'LANDSCAPE') => void;
  private buttonView?: ButtonView;

  init() {
    const editor = this.editor;
    const componentFactory = editor.ui.componentFactory;

    // Đăng ký nút tên là 'pageOrientation'
    componentFactory.add('pageOrientation', locale => {
      const view = new ButtonView(locale);
      this.buttonView = view;

      view.set({
        // label: 'Xoay giấy (A4)',
        icon: ICON_PORTRAIT,
        // tooltip: true,
        // withText: true,
        class: 'btn-orientation', // Class để style nếu cần
      });

      // Xử lý khi bấm nút
      view.on('execute', () => {
        this.toggleOrientation();
      });

      return view;
    });
  }

  /**
   * Toggle between portrait and landscape orientation
   */
  toggleOrientation(): void {
    const newOrientation = this._currentOrientation === 'PORTRAIT' ? 'LANDSCAPE' : 'PORTRAIT';
    this.setOrientation(newOrientation);
  }

  /**
   * Set orientation programmatically
   */
  setOrientation(orientation: 'PORTRAIT' | 'LANDSCAPE'): void {
    const editor = this.editor;
    const editingView = editor.editing.view;
    const rootElement = editingView.document.getRoot();

    editor.editing.view.change(writer => {
      if (orientation === 'LANDSCAPE') {
        writer.addClass('landscape', rootElement!);
      } else {
        writer.removeClass('landscape', rootElement!);
      }
    });

    // Update button icon
    if (this.buttonView) {
      this.buttonView.icon = orientation === 'LANDSCAPE' ? ICON_LANDSCAPE : ICON_PORTRAIT;
    }

    this._currentOrientation = orientation;
    this.orientationChangeEmitter?.(orientation);
  }

  /**
   * Get current orientation
   */
  getOrientation(): 'PORTRAIT' | 'LANDSCAPE' {
    return this._currentOrientation;
  }

  /**
   * Register callback for orientation changes
   */
  onOrientationChange(callback: (orientation: 'PORTRAIT' | 'LANDSCAPE') => void): void {
    this.orientationChangeEmitter = callback;
  }
}
