import { Plugin } from 'ckeditor5';

export class ImageUploadPlugin extends Plugin {
  static get pluginName() {
    return 'ImageUploadPlugin' as const;
  }

  init() {
    const editor = this.editor;

    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
      return new Base64UploadAdapter(loader);
    };
  }
}

class Base64UploadAdapter {
  private loader: any;

  constructor(loader: any) {
    this.loader = loader;
  }

  /**
   * Starts the upload process and converts the file to base64.
   * @returns Promise that resolves with the base64 URL
   */
  upload(): Promise<{ default: string }> {
    return this.loader.file.then((file: File) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          const base64Url = reader.result as string;
          resolve({ default: base64Url });
        };

        reader.onerror = () => {
          reject('Failed to convert image to base64');
        };

        reader.readAsDataURL(file);
      });
    });
  }

  /**
   * Aborts the upload process.
   */
  abort(): void {
    // For base64 conversion, there's nothing to abort
    // This method is required by the UploadAdapter interface
  }
}
