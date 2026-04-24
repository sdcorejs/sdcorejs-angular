/* eslint-disable @typescript-eslint/no-explicit-any */
// export {};

import { NumberUtilities } from './number.extension';

// declare global {
//   interface Date {
//     begin(): Date;
//     end(): Date;
//     addMiliseconds(miliseconds: number): Date;
//     addHours(hours: number): Date;
//     addDays(days: number): Date;
//     addMonths(months: number): Date;
//     toFormat(format: string): string;
//   }
//   interface DateConstructor {
//     equal(date1: any, date2: any): boolean;
//     dayDiff(date1: any, date2: any): number | null;
//     monthDiff(date1: any, date2: any): number | null;
//     yearDiff(date1: any, date2: any): number | null;
//     age(date1: any, date2: any): number | null;
//     parseFrom(value: any, format: string): Date | null;
//     isDate(value: any): boolean;
//     toFormat(value: any, format: string): string;
//     addMiliseconds(value: any, miliseconds: number): Date | null;
//     addHours(value: any, hours: number): Date | null;
//     addDays(value: any, days: number): Date | null;
//     addMonths(value: any, months: number): Date | null;
//     begin(value: any): Date | null;
//     end(value: any): Date | null;
//     timeDifference(previous: any, current?: any): string;
//   }
// }

const isDate = (value: any) => {
  if (!value) {
    return false;
  }
  if (typeof value === 'string') {
    // Kiểm tra regex
    if (value.length < 8) {
      return false;
    } else {
      const date1 = value.substring(0, 10); // yyyy/MM/dd
      const date2 = value.substring(0, 9); // yyyy/M/dd, yyyy/MM/d
      const date3 = value.substring(0, 8); // yyyy/M/d
      const regex1 = /^(0[1-9]|[1-9]|1[0-2])(-|\/)(0[1-9]|[1-9]|[12][0-9]|3[01])(-|\/)(\d{4})$/; // MM/dd/yyyy, MM-dd-yyyy
      const regex2 = /^(\d{4})(-|\/)(0[1-9]|[1-9]|1[0-2])(-|\/)(0[1-9]|[1-9]|[12][0-9]|3[01])$/; // yyyy/MM/dd, yyyy-MM-dd
      const result =
        regex1.test(date1) || regex2.test(date1) || regex1.test(date2) || regex2.test(date2) || regex1.test(date3) || regex2.test(date3);
      if (result) {
        const date = new Date(value);
        return !isNaN(date.getTime());
      } else {
        return false;
      }
    }
  } else {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
};

// const toFormatBackup = (value: any, format: string): string => {
//   if (!isDate(value)) {
//     return '';
//   }
//   const date: Date = new Date(value);
//   let result = format;
//   result = result.replace('yyyy', date.getFullYear().toString());
//   result = result.replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'));
//   result = result.replace('dd', date.getDate().toString().padStart(2, '0'));
//   result = result.replace('HH', date.getHours().toString().padStart(2, '0'));
//   result = result.replace('mm', date.getMinutes().toString().padStart(2, '0'));
//   result = result.replace('ss', date.getSeconds().toString().padStart(2, '0'));
//   return result;
// };

const toFormat = (value: any, format: string): string => {
  if (!isDate(value)) {
    return '';
  }

  const isDatePart = (type: Intl.DateTimeFormatPart['type']): type is 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' => {
    return type === 'year' || type === 'month' || type === 'day' || type === 'hour' || type === 'minute' || type === 'second';
  };

  const date = new Date(value);
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const map: Partial<Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', string>> = {};
  parts.forEach(part => {
    if (isDatePart(part.type)) {
      map[part.type] = part.value;
    }
  });

  return format
    .replace('yyyy', map.year ?? '')
    .replace('MM', map.month ?? '')
    .replace('dd', map.day ?? '')
    .replace('HH', map.hour ?? '')
    .replace('mm', map.minute ?? '')
    .replace('ss', map.second ?? '');
};

const addDays = (value: any, days: number) => {
  if (!isDate(value)) {
    return null;
  }
  const date: Date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
};

const addMiliseconds = (value: any, miliseconds: number) => {
  if (!isDate(value)) {
    return null;
  }
  const date: Date = new Date(value);
  date.setMilliseconds(date.getMilliseconds() + miliseconds);
  return date;
};

const begin = (value: any): Date | null => {
  if (!isDate(value)) {
    return null;
  }
  return new Date(toFormat(value, 'MM/dd/yyyy'));
};

const end = (value: any): Date | null => {
  if (!isDate(value)) {
    return null;
  }
  return addMiliseconds(begin(addDays(value, 1)), -1);
};

const equal = (date1: any, date2: any) => {
  if (!isDate(date1) && !isDate(date2)) {
    return true;
  }
  if (!isDate(date1) || !isDate(date2)) {
    return false;
  }
  return new Date(date1).getTime() === new Date(date2).getTime();
};

const dayDiff = (date1: any, date2: any) => {
  if (!isDate(date1) || !isDate(date2)) {
    return null;
  }
  const diff = new Date(date2).getTime() - new Date(date1).getTime();
  return Math.floor(diff / (24 * 3600 * 1000));
};

const monthDiff = (date1: any, date2: any) => {
  if (!isDate(date1) || !isDate(date2)) {
    return null;
  }
  const d1Y = date1.getFullYear();
  const d2Y = date2.getFullYear();
  const d1M = date2.getMonth();
  const d2M = date2.getMonth();
  return d2M + 12 * d2Y - (d1M + 12 * d1Y);
};

const yearDiff = (date1: any, date2: any) => {
  if (!isDate(date1) || !isDate(date2)) {
    return null;
  }
  return new Date(date2).getFullYear() - new Date(date1).getFullYear();
};

const age = (date1: any, date2: any) => {
  const diff = monthDiff(date1, date2);
  if (!diff) {
    return null;
  }
  return NumberUtilities.round(diff / 12);
};

const parseFrom = (value: any, format: string) => {
  if (!value) {
    return null;
  }
  if (!format) {
    return null;
  }
  value = value.toString();
  const dmy = format.indexOf('dd') > -1 && format.indexOf('MM') > -1 && format.indexOf('yyyy') > -1;
  const hms = format.indexOf('HH') > -1 || format.indexOf('mm') > -1 || format.indexOf('ss') > -1;
  let strDate = '';
  if (dmy) {
    const dd = value.substr(format.indexOf('dd'), 'dd'.length);
    const MM = value.substr(format.indexOf('MM'), 'MM'.length);
    const yyyy = value.substr(format.indexOf('yyyy'), 'yyyy'.length);
    if (+yyyy > 0 && +MM > 0 && +dd > 0) {
      strDate += `${MM}/${dd}/${yyyy}`;
    } else {
      return null;
    }
  } else {
    const today = new Date();
    const yyyy = today.getFullYear().toString();
    const MM = (today.getMonth() + 1).toString().padStart(2, '0');
    const dd = today.getDate().toString().padStart(2, '0');
    strDate += `${MM}/${dd}/${yyyy}`;
  }
  if (hms) {
    const HH = format.indexOf('HH') > -1 ? value.substr(format.indexOf('HH'), 'HH'.length) : '00';
    const mm = format.indexOf('mm') > -1 ? value.substr(format.indexOf('mm'), 'mm'.length) : '00';
    const ss = format.indexOf('ss') > -1 ? value.substr(format.indexOf('ss'), 'ss'.length) : '00';
    strDate += ` ${HH || '00'}:${mm || '00'}:${ss || '00'}`;
  }
  if (!isDate(strDate)) {
    return null;
  }
  return new Date(strDate);
};

const addHours = (value: any, hours: number) => {
  if (!isDate(value)) {
    return null;
  }
  const date: Date = new Date(value);
  date.setHours(date.getHours() + hours);
  return date;
};

const addMonths = (value: any, months: number) => {
  if (!isDate(value)) {
    return null;
  }
  const date: Date = new Date(value);
  date.setMonth(date.getMonth() + months);
  return date;
};

const timeDifference = function (previous: any, current: any = new Date()) {
  if (!isDate(previous)) {
    return '';
  }
  if (!isDate(current)) {
    return '';
  }
  const from = new Date(previous);
  const to = new Date(current);
  const msPerMinute = 60 * 1000;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;
  const msPerMonth = msPerDay * 30;
  const msPerYear = msPerDay * 365;
  const elapsed = to.getTime() - from.getTime();

  if (elapsed < msPerMinute) {
    return `${Math.round(elapsed / 1000)} seconds ago`;
  }

  if (elapsed < msPerHour) {
    return `${Math.round(elapsed / msPerMinute)} minutes ago`;
  }

  if (elapsed < msPerDay) {
    return `${Math.round(elapsed / msPerHour)} hours ago`;
  }

  if (elapsed < msPerMonth) {
    return `${Math.round(elapsed / msPerDay)} days ago`;
  }

  if (elapsed < msPerYear) {
    return `${Math.round(elapsed / msPerMonth)} months ago`;
  }
  return `${Math.round(elapsed / msPerYear)} years ago`;
};

// Date.prototype.begin = function () {
//   return new Date(this.toFormat('MM/dd/yyyy'));
// };

// Date.prototype.end = function () {
//   // eslint-disable-next-line @typescript-eslint/no-this-alias
//   const date: Date = this;
//   return date.addDays(1).begin().addMiliseconds(-1);
// };

// Date.prototype.addMiliseconds = function (miliseconds: number) {
//   // eslint-disable-next-line @typescript-eslint/no-this-alias
//   const date: Date = this;
//   date.setMilliseconds(date.getMilliseconds() + miliseconds);
//   return date;
// };

// Date.prototype.addHours = function (hours: number) {
//   // eslint-disable-next-line @typescript-eslint/no-this-alias
//   const date: Date = this;
//   date.setHours(date.getHours() + hours);
//   return date;
// };

// Date.prototype.addDays = function (days: number) {
//   // eslint-disable-next-line @typescript-eslint/no-this-alias
//   const date: Date = this;
//   date.setDate(date.getDate() + days);
//   return date;
// };

// Date.prototype.addMonths = function (months: number) {
//   // eslint-disable-next-line @typescript-eslint/no-this-alias
//   const date: Date = this;
//   date.setMonth(date.getMonth() + months);
//   return date;
// };

// Date.prototype.toFormat = function (format: string) {
//   // eslint-disable-next-line @typescript-eslint/no-this-alias
//   const date: Date = this;
//   let result = format;
//   result = result.replace('yyyy', date.getFullYear().toString());
//   result = result.replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'));
//   result = result.replace('dd', date.getDate().toString().padStart(2, '0'));
//   result = result.replace('HH', date.getHours().toString().padStart(2, '0'));
//   result = result.replace('mm', date.getMinutes().toString().padStart(2, '0'));
//   result = result.replace('ss', date.getSeconds().toString().padStart(2, '0'));
//   return result;
// };

const DateUtilities = {
  equal,
  dayDiff,
  monthDiff,
  yearDiff,
  age,
  parseFrom,
  isDate,
  toFormat,
  addMiliseconds,
  addHours,
  addDays,
  addMonths,
  begin,
  end,
  timeDifference,
};

export { DateUtilities };
