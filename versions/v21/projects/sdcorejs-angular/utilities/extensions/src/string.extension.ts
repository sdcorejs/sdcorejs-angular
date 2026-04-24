/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */
// declare global {
//   interface StringConstructor {
//     isValidEmail(value: any): boolean;
//     isValidPhone(value: any): boolean;
//     isValidCode(value: any): boolean;
//     changeAliasLowerCase(alias: any): string;
//     aliasIncludes(alias: any, searchText: any): boolean;
//     format(template: string, ...arr: any[]): string;
//     templateToDisplay(template: string, entity: any): string; // Convert theo format ${key}
//     encrypt(obj: any): string;
//     decrypt(encripted: string): any;
//     isNullOrEmpty(value: any): boolean;
//     isNullOrWhiteSpace(value: any): boolean;
//   }
// }

const REGEX_EMAIL = '^(([^<>()[\\].,;:\\s@"]+(\\.[^<>()[\\].,;:\\s@"]+)*)|(".+"))@(([^<>()[\\].,;:\\s@"]+\\.)+[^<>()[\\].,;:\\s@"]{2,})$';
const REGEX_PHONE = '^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\\s./0-9]*$';
const REGEX_PHONE_VN = '^(?:\\+84|0|84)(3[2-9]|5[2689]|7[06-9]|8[1-689]|9[0-9])\\d{7}$';
const REGEX_IDVN_OR_PASSPORT = '^(\\d{9}|\\d{12}|[A-Z]\\d{7})$';
const REGEX_TIME = '^(?:[01]\\d|2[0-3]):[0-5]\\d$';
const isValidEmail = (value: any) => {
  if (!value) {
    return false;
  }
  const re = new RegExp(REGEX_EMAIL);
  return re.test(value);
};

const isValidPhone = (value: any) => {
  if (!value) {
    return false;
  }
  const re = new RegExp(REGEX_PHONE);
  return re.test(value);
};

const isValidCode = (value: any) => {
  if (!value) {
    return false;
  }
  const re = /^[a-zA-Z0-9\@\_\-]{2,20}$/;
  return re.test(value);
};

const isNullOrEmpty = (value: any) => {
  return value === undefined || value === null || value === '';
};

const isNullOrWhiteSpace = (value: any) => {
  return value === undefined || value === null || typeof value !== 'string' || value.match(/^ *$/) !== null;
};

const changeAliasLowerCase = (alias: any) => {
  let str: string = alias?.toString() ?? '';
  str = str.toString().toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, ' ');
  str = str.replace(/ + /g, ' ');
  str = str.trim();
  return str;
};

const aliasIncludes = (alias: any, searchText: any) => {
  return changeAliasLowerCase(alias).includes(changeAliasLowerCase(searchText));
};

const format = (template: string, ...arr: any[]) => {
  for (let i = 0; i < arr.length; i++) {
    const regexp = new RegExp(`\\{${i}\\}`, 'gi');
    template = template.replace(regexp, arr[i]);
  }
  return template;
};

const getValueByPath = (entity: Record<string, any>, key: string) => {
  let value: any = entity;
  for (const part of key.split('.')) {
    value = value?.[part];
  }
  return value;
};

// Convert: `[${code}] ${name}` => `[Mã] Tên`;
const templateToDisplay = (template: string, entity: Record<string, any>) => {
  if (!template) {
    return template;
  }
  const regex = /\$\{([A-Za-z0-9._-]*)\}/g;
  const matches = template.match(regex) || [];
  for (const match of matches) {
    const key = match.slice(2, match.length - 1);
    if (key) {
      template = template.replace(match, getValueByPath(entity, key) ?? '');
    }
  }
  return template;
};

const EXACT_TEMPLATE_REGEX = /^\$\{([A-Za-z0-9._-]*)\}$/;
const NUMBER_LITERAL_REGEX = /^-?\d+(\.\d+)?$/;

// Convert placeholder/literal an toàn, không thực thi JavaScript động.
const parseExpression = (template: string, entity: Record<string, any>) => {
  if (!template) {
    return undefined;
  }
  const trimmedTemplate = template.trim();
  const exactTemplateMatch = trimmedTemplate.match(EXACT_TEMPLATE_REGEX);
  if (exactTemplateMatch?.[1]) {
    return getValueByPath(entity, exactTemplateMatch[1]);
  }

  if (trimmedTemplate === 'true') {
    return true;
  }
  if (trimmedTemplate === 'false') {
    return false;
  }
  if (trimmedTemplate === 'null') {
    return null;
  }
  if (trimmedTemplate === 'undefined') {
    return undefined;
  }
  if (NUMBER_LITERAL_REGEX.test(trimmedTemplate)) {
    return Number(trimmedTemplate);
  }

  return templateToDisplay(template, entity);
};

const SALT = 'cb9f4b2a-d26c-4787-a66e-e7130ee00f95';

const encrypt = (obj: any) => {
  obj = JSON.stringify(obj).split('');
  for (let i = 0, l = obj.length; i < l; i++)
    if (obj[i] == '{') obj[i] = '}';
    else if (obj[i] == '}') obj[i] = '{';
  return encodeURI(SALT + obj.join(''));
};

const decrypt = (encripted: string) => {
  encripted = decodeURI(encripted);
  if (SALT && encripted.indexOf(SALT) != 0) throw new Error('object cannot be decrypted');
  const strs = encripted.substring(SALT.length).split('');
  for (let i = 0, l = strs.length; i < l; i++)
    if (strs[i] == '{') strs[i] = '}';
    else if (encripted[i] == '}') strs[i] = '{';
  return JSON.parse(strs.join(''));
};

// Conver "Đội Kỹ Thuật" thành "doi_ky_thuat"
const convertToSnakeCaseCode = (name: string): string => {
  if (typeof name !== 'string') {
    throw new Error('Invalid name');
  }
  return name
    .normalize('NFD') // Tách dấu
    .replace(/[\u0300-\u036f]/g, '') // Xóa các dấu vừa tách
    .replace(/[đĐ]/g, 'd') // Quan trọng: Xử lý chữ đ/Đ thành d
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_') // Thay ký tự đặc biệt bằng _
    .replace(/^_+|_+$/g, '') // Xóa _ ở đầu/cuối
    .toLowerCase(); // Chuyển thành chữ thường: doi_ky_thuat
};

/**
 * Tạo code duy nhất, tự động thêm suffix _n nếu bị trùng
 * @param name Tên cần convert
 * @param existingCodes Danh sách các code đã tồn tại
 */
const generateUniqueCode = (name: string, existingCodes: string[]): string => {
  // 1. Tạo base code trước
  const baseCode = convertToSnakeCaseCode(name);
  // 2. Nếu code chưa tồn tại thì trả về luôn
  if (!existingCodes.includes(baseCode)) {
    return baseCode;
  }
  // 3. Nếu trùng, bắt đầu loop để tìm index phù hợp
  let index = 1;
  let newCode = `${baseCode}_${index}`;

  while (existingCodes.includes(newCode)) {
    index++;
    newCode = `${baseCode}_${index}`;
  }
  return newCode;
};

export const StringUtilities = {
  REGEX_EMAIL,
  REGEX_PHONE,
  REGEX_PHONE_VN,
  REGEX_IDVN_OR_PASSPORT,
  REGEX_TIME,
  isValidEmail,
  isValidPhone,
  isValidCode,
  changeAliasLowerCase,
  aliasIncludes,
  format,
  templateToDisplay,
  parseExpression,
  encrypt,
  decrypt,
  isNullOrEmpty,
  isNullOrWhiteSpace,
  convertToSnakeCaseCode,
  generateUniqueCode,
};
