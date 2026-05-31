export { Utilities, BrowserUtilities } from '@sdcorejs/utils/fns';

// Hardcoded i18n cho upload utility — pure function nên không inject() được I18nService.
// Đọc lang trực tiếp từ localStorage (cùng key với I18nService: 'sd-core.language').
// Khi I18nService chuyển sang reload-on-change model, lang ở đây luôn đồng bộ với UI.
const SD_UPLOAD_MESSAGES = {
  vi: {
    'invalid-format': '[{name}] File tải lên không đúng định dạng. Vui lòng chọn lại',
    'invalid-size': '[{name}] Kích thước file không hợp lệ. Vui lòng chọn một file khác',
  },
  en: {
    'invalid-format': '[{name}] Invalid file format. Please select again',
    'invalid-size': '[{name}] Invalid file size. Please choose a different file',
  },
  ja: {
    'invalid-format': '[{name}] ファイル形式が正しくありません。もう一度選択してください',
    'invalid-size': '[{name}] ファイルサイズが正しくありません。別のファイルを選択してください',
  },
  ko: {
    'invalid-format': '[{name}] 파일 형식이 올바르지 않습니다. 다시 선택해 주세요',
    'invalid-size': '[{name}] 파일 크기가 올바르지 않습니다. 다른 파일을 선택해 주세요',
  },
  zh: {
    'invalid-format': '[{name}] 文件格式不正确，请重新选择',
    'invalid-size': '[{name}] 文件大小不符合要求，请选择其他文件',
  },
} as const;

type SdUploadMsgKey = keyof typeof SD_UPLOAD_MESSAGES.vi;
type SdUploadLang = keyof typeof SD_UPLOAD_MESSAGES;

const getSdUploadLang = (): SdUploadLang => {
  try {
    const stored = localStorage.getItem('sd-core.language');
    if (stored && stored in SD_UPLOAD_MESSAGES) return stored as SdUploadLang;
  } catch { /* ignore */ }
  return 'vi';
};

const upload = (option?: { extensions?: string[]; maxSizeInMb?: number; validator?: (fileName: string) => string; multiple?: boolean }) => {
  const uploadId = 'U1e09c1c0-b647-437e-995e-d7a1a1b60550';
  const promise = new Promise<File | File[] | null>((resolve, reject) => {
    const body = document.getElementsByTagName('body')?.[0];
    if (!body) {
      resolve(null);
      return;
    }
    const existedElement = document.getElementById(uploadId);
    if (existedElement) {
      existedElement.remove();
    }
    const element = document.createElement('input');
    element.setAttribute('id', uploadId);
    element.setAttribute('type', 'file');
    if (option?.multiple) {
      element.setAttribute('multiple', '');
    }
    element.style.display = 'none';
    body.appendChild(element);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    element.addEventListener('change', (evt: any) => {
      try {
        const target = evt.target as DataTransfer;

        // Hardcode i18n cho upload utility — pure function nên không inject() được I18nService.
        // Đọc lang trực tiếp từ localStorage (cùng key với I18nService: 'sd-core.language').
        // Throw plain Error(translatedText) để consumer không cần xử lý đặc biệt.
        const throwUploadError = (msgKey: SdUploadMsgKey, name: string): never => {
          const lang = getSdUploadLang();
          const template = SD_UPLOAD_MESSAGES[lang][msgKey] ?? SD_UPLOAD_MESSAGES.vi[msgKey];
          throw new Error(template.replace('{name}', name));
        };

        if (option?.multiple) {
          const files: File[] = [];
          for (const file of target.files) {
            if (file) {
              const lastDot = file.name.lastIndexOf('.');
              if (lastDot === -1) {
                throwUploadError('invalid-format', file.name);
              }
              const extension = file.name.substring(lastDot + 1);
              if (option) {
                if (option.extensions?.length && !option.extensions.some(e => e.toLowerCase() === extension.toLowerCase())) {
                  throwUploadError('invalid-format', file.name);
                }
                if (option.maxSizeInMb && option.maxSizeInMb > 0 && option.maxSizeInMb * 1024 * 1024 < file.size) {
                  throwUploadError('invalid-size', file.name);
                }
                if (option.validator && option.validator(file.name)) {
                  // Custom validator returns its own message — pass through as-is (caller defines format).
                  const message = option.validator(file.name);
                  throw new Error(message);
                }
              }
              files.push(file);
            }
            resolve(files);
          }
        } else {
          const file = target.files.item(0);
          if (file) {
            const lastDot = file.name.lastIndexOf('.');
            if (lastDot === -1) {
              throwUploadError('invalid-format', file.name);
            }
            const extension = file.name.substring(lastDot + 1);
            if (option) {
              if (option.extensions?.length && !option.extensions.some(e => e.toLowerCase() === extension.toLowerCase())) {
                throwUploadError('invalid-format', file.name);
              }
              if (option.maxSizeInMb && option.maxSizeInMb > 0 && option.maxSizeInMb * 1024 * 1024 < file.size) {
                throwUploadError('invalid-size', file.name);
              }
              if (option.validator && option.validator(file.name)) {
                const message = option.validator(file.name);
                throw new Error(message);
              }
            }
            resolve(file);
          }
        }
      } catch (error) {
        reject(error);
      }
    });
    element.click();
  });
  return promise;
};

const generateFileName = (fileName?: string | null) => {
  if (!fileName) {
    return `file_${randomId()}`;
  }
  return fileName;
};

const download = (fileOrPath: File | string | undefined | null, fileName?: string | null) => {
  if (!fileOrPath) {
    console.warn('No file or path provided for download');
    return;
  }
  fileName = generateFileName(fileName);
  if (fileOrPath instanceof File) {
    // Hoặc sử dụng cách thông thường:
    const url = URL.createObjectURL(fileOrPath);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileOrPath.name || fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Giải phóng tài nguyên
    return;
  }
  const a = document.createElement('a');
  a.href = fileOrPath;
  if (fileOrPath.startsWith('http')) {
    a.target = '_blank'; // mở tab mới
  } else {
    a.download = fileName;
  }
  a.style.visibility = 'hidden';
  document.body.appendChild(a);
  a.click();
  a.remove();
  return;
};

const downloadBlob = (blob: Blob, fileName?: string) => {
  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    if (link.download !== undefined) {
      // feature detection
      link.download = generateFileName(fileName);
      link.href = url;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();
    }
  } catch (e) {
    console.error('BlobToSaveAs error', e);
  }
};

const changeAliasLowerCase = (alias: string) => {
  let str = alias?.toString() ?? '';
  str = str.toString().toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  // eslint-disable-next-line no-useless-escape
  str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, ' ');
  str = str.replace(/ + /g, ' ');
  str = str.trim();
  return str;
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

const allWithPaging = async <T = unknown>(
  func: (pageSize: number, pageNumber: number) => Promise<{ items: T[]; total: number }>,
  defaultPageSize?: number
): Promise<T[]> => {
  const pageSize = defaultPageSize || 1000;
  let pageNumber = 0;
  let count = 0;
  let items: T[] = [];
  while (true) {
    const res = await func(pageSize, pageNumber);
    if (Array(res?.items) && res?.total > 0) {
      items = [...items, ...res.items];
      count += res.items.length;
      pageNumber++;
      if (count >= res.total || !res.items?.length) {
        return items;
      }
    } else {
      return [];
    }
  }
};

const isIncognito = async (): Promise<boolean> => {
  // Chrome-based
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const { quota } = await navigator.storage.estimate();
      if (quota && quota < 120 * 1024 * 1024) return true;
    } catch (err) {
      console.error(err);
    }
  }

  // Safari fallback
  try {
    localStorage.setItem('__incognito_test', '1');
    localStorage.removeItem('__incognito_test');
    return false;
  } catch {
    return true;
  }
};

const isMobile = (): boolean => {
  return /Mobi|Android/i.test(navigator.userAgent);
};

const randomId = (prefix?: string | null): string => {
  const id = `${new Date().getTime().toString(36)}${Math.random().toString(36).substring(2, 7)}`;
  if (prefix) {
    return `${prefix}_${id}`;
  }
  return id;
};

const hash = (obj: any): string => {
  const json = stableStringify(obj);
  let hash = 0;

  for (let i = 0; i < json.length; i++) {
    hash = (hash << 5) - hash + json.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return `h${Math.abs(hash)}`;
};

/**
 * Convert object to stable JSON string (keys sorted)
 */
const stableStringify = (obj: any): string => {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (obj instanceof File) {
    // Chỉ serialize các thuộc tính quan trọng của File
    return JSON.stringify({
      __type: 'File',
      name: obj.name,
      size: obj.size,
      type: obj.type,
      lastModified: obj.lastModified,
    });
  }

  if (Array.isArray(obj)) {
    return `[${obj.map(stableStringify).join(',')}]`;
  }

  const keys = Object.keys(obj).sort();
  const keyValuePairs = keys.map(key => `"${key}":${stableStringify(obj[key])}`);

  return `{${keyValuePairs.join(',')}}`;
};

// Hàm `parseQueryParams` dùng để phân tích chuỗi query string (phần sau dấu `?` trên URL)
//   và chuyển đổi nó thành một đối tượng JavaScript với các cặp key-value.
const parseQueryParams = (queryString?: string): Record<string, string> => {
  const params = new URLSearchParams(queryString || '');
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
};

/**
 * Lấy địa chỉ IP public của client bằng cách gọi API bên thứ ba.
 */
const getClientPublicIp = async (): Promise<string | null> => {
  try {
    // Gọi đến API của ipify để lấy IP dưới dạng JSON
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Trả về địa chỉ IP
    return data.ip;
  } catch (error) {
    console.error('Failed to fetch client IP:', error);
    return null; // Trả về null nếu có lỗi
  }
};


// Helper function với fallback
const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback cho browser cũ
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Truy xuất giá trị của object dựa trên đường dẫn nested (VD: 'user.address.city')
 */
const getNestedValue = (obj: any, path: string) => {
  if (!obj || !path) return undefined;
  // Tách chuỗi theo dấu chấm và duyệt qua từng cấp của object
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

/**
 * @deprecated Use {@link Utilities} and {@link BrowserUtilities} from `@sdcorejs/utils/fns` instead.
 * - upload/download/clipboard/isMobile → BrowserUtilities
 * - allWithPaging (→ fetchAllByPaging) / randomId / hash / parseQueryParams / generateUuid / getNestedValue → Utilities
 */
const SdUtilities = {
  upload,
  download,
  downloadBlob,
  changeAliasLowerCase,
  copyToClipboard,
  allWithPaging,
  isIncognito,
  isMobile,
  randomId,
  hash,
  parseQueryParams,
  getClientPublicIp,
  generateUuid,
  getNestedValue
};
export { SdUtilities };

