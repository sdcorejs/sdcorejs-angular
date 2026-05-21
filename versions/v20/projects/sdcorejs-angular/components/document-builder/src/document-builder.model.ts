import { EditorConfig, EventInfo, ModelDocumentSelection, ViewDataTransfer } from 'ckeditor5';
import { I18nService } from '@sdcorejs/angular/i18n';
import { CkCommentConfig } from './plugins/ck-comment/ck-comment.plugin.model';

export type DocumentBuilderOption = EditorConfig & {
  getOption?: () => SdDocumentBuilderOption;
  // i18n service Ä‘Æ°á»£c Angular component inject vÃ o Ä‘á»ƒ CKEditor plugin (vá»‘n náº±m ngoÃ i DI tree) cÃ³ thá»ƒ dá»‹ch
  _i18n?: I18nService;
};

export interface SdDocumentBuilderOption {
  onDropVariable?: (variable: SdDocumentBuilderVariable) => boolean | Promise<boolean | SdDocumentBuilderVariable>; // Callback khi tháº£ variable vÃ o editor (fires TRÆ¯á»šC khi insert â€” dÃ¹ng Ä‘á»ƒ validate/transform)
  onAfterDropVariable?: (variable: SdDocumentBuilderVariable) => void; // Callback sau khi variable Ä‘Ã£ thá»±c sá»± Ä‘Æ°á»£c insert vÃ o model (dÃ¹ng Ä‘á»ƒ refresh danh sÃ¡ch, gá»i variable.all())
  onPasteVariable?: (display: string) => SdDocumentBuilderVariable | null | Promise<SdDocumentBuilderVariable | null>; // Callback tra cá»©u variable thá»±c khi paste {{display}}
  comment?: CkCommentConfig; // Cáº¥u hÃ¬nh comment
  onSelection?: (selection: ModelDocumentSelection, $event: EventInfo<string, unknown>) => void;
  onOrientation?: (orientation: 'PORTRAIT' | 'LANDSCAPE') => void; // Callback khi orientation thay Ä‘á»•i
  onPaste?: (data: SdPasteEventData) => void | Promise<void>; // Callback khi paste tá»« external sources
  orientation?: 'PORTRAIT' | 'LANDSCAPE'; // Orientation hiá»‡n táº¡i
}

// 1. Interface cho Biáº¿n (Variable)
export interface SdDocumentBuilderVariable<T = any> {
  id: string;
  uuid?: string; // MÃ£ nÃ y FE tá»± sinh sau khi biáº¿n Ä‘Æ°á»£c drop
  value: string; // GiÃ¡ trá»‹ render ra (vÃ­ dá»¥: {{full_name}})
  display: string;
  bindingValue?: string; // GiÃ¡ trá»‹ runtime Ä‘Ã£ binding (undefined = chÆ°a bind)
  data?: T;
}

// 2. Interface cho Heading
export interface SdDocumentBuilderHeading {
  id: string; // ID Ä‘á»‹nh danh (do ta tá»± sinh ra lÃºc runtime Ä‘á»ƒ lÃ m key scroll)
  text: string; // Ná»™i dung tiÃªu Ä‘á»
  level: number; // Cáº¥p Ä‘á»™: 1 (H1), 2 (H2), 3 (H3)...
  type: string; // 'heading1', 'heading2'...
}

// 3. Interface cho Paste Event
export interface SdPasteEventData {
  html?: string; // HTML content tá»« clipboard
  text: string; // Plain text content
  source: 'word' | 'excel' | 'google-docs' | 'web' | 'unknown'; // Nguá»“n paste Ä‘Æ°á»£c detect
  dataTransfer: ViewDataTransfer; // ViewDataTransfer object tá»« CKEditor
}

