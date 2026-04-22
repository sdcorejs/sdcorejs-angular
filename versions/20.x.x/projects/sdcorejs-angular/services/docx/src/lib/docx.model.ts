export interface SdDocxConvertOptions {
  validateFormat?: boolean;
  validateSize?: boolean;
  maxSizeInMb?: number;
}

export interface SdDocxConvertResult {
  html: string;
  messages: string[];
}
