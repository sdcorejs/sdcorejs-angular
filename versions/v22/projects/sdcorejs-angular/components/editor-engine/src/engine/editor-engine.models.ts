export interface SdEditorImportDiagnostic {
  code: 'unsafe-html' | 'unsupported-html' | 'markdown-loss' | 'invalid-option';
  path: string;
  tag?: string;
  attribute?: string;
  detail: string;
}
export class SdEditorImportError extends Error {
  constructor(public readonly diagnostics: readonly SdEditorImportDiagnostic[]) {
    super('Editor content cannot be exported without data loss or unsafe HTML.');
    this.name = 'SdEditorImportError';
  }
}
export interface SdEditorMentionItem {
  id: string;
  name?: string;
  text?: string;
  data?: unknown;
}
export interface SdEditorMentionFeed {
  marker: string;
  feed:
    | readonly (string | SdEditorMentionItem)[]
    | ((query: string) => readonly (string | SdEditorMentionItem)[] | Promise<readonly (string | SdEditorMentionItem)[]>);
  minimumCharacters?: number;
  dropdownLimit?: number;
}
export type SdEditorSourceChangeReason = 'source' | 'editable' | 'format';
export interface SdEditorEngineOptions {
  content?: string;
  format?: 'html' | 'markdown';
  editable?: boolean;
  placeholder?: string;
  mentionFeeds?: readonly SdEditorMentionFeed[];
  onDiagnostics?: (diagnostics: readonly SdEditorImportDiagnostic[]) => void;
  onChange?: (value: string) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onStateChange?: () => void;
  /** Distinguishes authoritative replacement/permission changes from representation conversion. */
  onSourceChange?: (reason: SdEditorSourceChangeReason) => void;
  /** Converted current value, or undefined when loss/unsafe diagnostics block export. */
  onFormatChange?: (value: string | undefined) => void;
  onCompositionStateChange?: (composing: boolean) => void;
  onMentionSelect?: (item: SdEditorMentionItem) => void;
  mentionLabel?: () => string;
}
export interface SdEditorImageAttributes {
  src: string;
  alt?: string;
  id?: string;
  loading?: string;
  width?: number | string;
  height?: number | string;
}
