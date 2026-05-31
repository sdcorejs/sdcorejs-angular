import { inject, Injectable } from '@angular/core';
import type { CellValue, Style } from 'exceljs';
// import hash from 'object-hash';
import { DateUtilities } from '@sdcorejs/angular/utilities/extensions';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdExcelExportOption, SdExcelTemplate } from './excel.model';

@Injectable({
  providedIn: 'root',
})
export class SdExcelService {
  readonly #i18n = inject(I18nService);
  #fieldStyle: Partial<Style> = {
    border: {
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
    alignment: {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    },
    font: {
      bold: true,
      size: 11,
      color: { argb: '000000' },
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: 'FAFAFA',
      },
    },
  };
  #titleColor = 'FFFFFF';
  #titleFgColor = '143180';
  #titleStyle: Partial<Style> = {
    border: {
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
    alignment: {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    },
    font: {
      bold: true,
      size: 11,
      color: { argb: this.#titleColor },
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: this.#titleFgColor,
      },
    },
  };

  #requiredStyle: Partial<Style> = {
    border: {
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
    alignment: {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    },
    font: {
      italic: true,
      size: 11,
      color: { argb: 'FFFFFF' },
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: 'FF1744',
      },
    },
  };

  #descriptionStyle: Partial<Style> = {
    border: {
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
    alignment: {
      wrapText: true,
    },
    font: {
      italic: true,
      size: 9,
      color: { argb: '000000' },
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: 'CFD8DC',
      },
    },
  };

  #cellStyle: Partial<Style> = {
    alignment: {
      vertical: 'middle',
      wrapText: true,
    },
  };

  constructor() {}

  // exceljs là CJS module — khi dynamic import từ ESM, named export `Workbook`
  // có thể nằm trên `mod.Workbook` hoặc bị bọc trong `mod.default.Workbook` tuỳ bundler.
  // Helper này chuẩn hoá cả hai trường hợp.
  async #loadWorkbook(): Promise<new () => import('exceljs').Workbook> {
    const mod: any = await import('exceljs');
    return mod.Workbook ?? mod.default?.Workbook;
  }

  generateTemplate = async (template: SdExcelTemplate) => {
    const { fileName, columns, sheets } = template;
    if (!Array.isArray(columns)) {
      throw new Error('Excel template columns must be an array');
    }
    for (const [idx, column] of columns.entries()) {
      if (!column.field) {
        throw new Error(`Column ${idx + 1}: Field is required`);
      }
      if (!column.title) {
        throw new Error(`Column ${idx + 1}: Title is required`);
      }
    }
    const hasDescription = columns.some(column => column.description);
    const Workbook = await this.#loadWorkbook();
    const workbook = new Workbook();
    const firstSheet = workbook.addWorksheet('template'); // Lấy ra sheet đầu tiên
    columns.forEach((column, index) => {
      const { required, fill, fontColor } = column;
      const cellField = firstSheet.getCell(1, index + 1);
      const cellTitle = firstSheet.getCell(2, index + 1);
      const cellDescription = firstSheet.getCell(3, index + 1);
      let width = 120;
      if (column.width && column.width.endsWith('px')) {
        width = +column.width.replace('px', '');
      }
      firstSheet.getColumn(index + 1).width = width / 7 || 20;
      cellField.style = this.#fieldStyle;
      if (required) {
        cellField.style = this.#requiredStyle;
      } else {
        cellField.style = this.#fieldStyle;
      }
      cellTitle.style = {
        ...this.#titleStyle,
        font: {
          ...this.#titleStyle?.font,
          color: {
            ...this.#titleStyle?.font?.color,
            argb: fontColor || this.#titleStyle?.font?.color?.argb,
          },
        },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb: fill || this.#titleFgColor,
          },
        },
      };
      cellField.value = column.field;
      cellTitle.value = column.title;
      if (hasDescription) {
        cellDescription.style = this.#descriptionStyle;
        cellDescription.value = column.description || '';
      }
    });
    if (sheets?.length) {
      for (const sheet of sheets) {
        if (sheet.name && Array.isArray(sheet.items) && Array.isArray(sheet.headers)) {
          const newSheet = workbook.addWorksheet(sheet.name);
          sheet.headers.forEach((header, index) => {
            newSheet.getColumn(index + 1).width = 30;
            newSheet.getCell(1, index + 1).style = this.#titleStyle;
            newSheet.getCell(1, index + 1).value = header.value;
            newSheet.getCell(2, index + 1).style = this.#titleStyle;
            newSheet.getCell(2, index + 1).value = header.display || header.value;
          });
          sheet.items.forEach((item, idx1) => {
            sheet.headers.forEach((header, idx2) => {
              newSheet.getCell(3 + idx1, 1 + idx2).value = item[header.value];
              newSheet.getCell(3 + idx1, 1 + idx2).style = this.#cellStyle;
            });
          });
        }
      }
    }
    const file = await workbook.xlsx.writeBuffer();
    BrowserUtilities.downloadBlob(
      new Blob([file], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      fileName
    );
  };

  exportCSV = async (option: SdExcelExportOption): Promise<void> => {
    const { columns, items, fileName } = option;
    const filename = `${fileName || 'CSV'}_${DateUtilities.toFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.csv`;

    // Escape CSV cell: bọc trong dấu " nếu chứa dấu phẩy / xuống dòng / dấu ngoặc kép.
    // Dấu " bên trong được nhân đôi theo chuẩn RFC 4180.
    const escape = (v: unknown): string => {
      if (v == null) return '';
      const s = String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const headerLine = columns.map(c => escape(c.title)).join(',');
    const dataLines = items.map(item =>
      columns.map(c => escape((item as Record<string, unknown>)[c.field])).join(','),
    );

    // Prepend UTF-8 BOM (﻿) để Excel mở đúng encoding cho tiếng Việt có dấu.
    // Dùng CRLF vì Excel trên Windows ưu tiên, macOS Excel cũng chấp nhận.
    const csv = '﻿' + [headerLine, ...dataLines].join('\r\n');

    BrowserUtilities.downloadBlob(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
      filename,
    );
  };

  export = async (option: SdExcelExportOption) => {
    const { columns, items, fileName, sheets } = option;
    let hasDescription = false;
    for (const [idx, column] of columns.entries()) {
      if (!column.field) {
        throw new Error(`Column ${idx + 1}: Field is required`);
      }
      if (!column.title) {
        throw new Error(`Column ${idx + 1}: Title is required`);
      }
      if (column.description) {
        hasDescription = true;
      }
    }
    const Workbook = await this.#loadWorkbook();
    const workbook = new Workbook(); //await XlsxPopulate.fromBlankAsync(); // Đọc file sau khi đã download
    const firstSheet = workbook.addWorksheet('data'); // Lấy ra sheet đầu tiên
    columns.forEach((column, index) => {
      let width = 120;
      if (column.width && column.width.endsWith('px')) {
        width = +column.width.replace('px', '');
      }
      firstSheet.getColumn(index + 1).width = width / 7 || 20;
      firstSheet.getCell(1, index + 1).style = this.#fieldStyle;
      if (column.required) {
        firstSheet.getCell(2, index + 1).style = this.#requiredStyle;
      } else {
        firstSheet.getCell(2, index + 1).style = this.#titleStyle;
      }
      firstSheet.getCell(1, index + 1).value = column.field;
      firstSheet.getCell(2, index + 1).value = column.title;
      if (hasDescription) {
        firstSheet.getCell(3, index + 1).style = this.#descriptionStyle;
        firstSheet.getCell(3, index + 1).value = column.description || '';
      }
    });
    if (sheets?.length) {
      for (const sheet of sheets) {
        if (sheet.name && Array.isArray(sheet.items) && Array.isArray(sheet.headers)) {
          const newSheet = workbook.addWorksheet(sheet.name);
          sheet.headers.forEach((header, index) => {
            newSheet.getColumn(index + 1).width = 30;
            newSheet.getCell(1, index + 1).style = this.#titleStyle;
            newSheet.getCell(1, index + 1).value = header.value;
            newSheet.getCell(2, index + 1).style = this.#titleStyle;
            newSheet.getCell(2, index + 1).value = header.display || header.value;
          });
          sheet.items.forEach((item, idx1) => {
            sheet.headers.forEach((header, idx2) => {
              newSheet.getCell(3 + idx1, 1 + idx2).value = item[header.value];
              newSheet.getCell(3 + idx1, 1 + idx2).style = this.#cellStyle;
            });
          });
        }
      }
    }

    const fromRow = hasDescription ? 4 : 3;
    items.forEach((e, idx1) => {
      columns.forEach((column, idx2) => {
        if (typeof e[column.field] === 'number') {
          // Format mặc định với kiểu số
          firstSheet.getCell(fromRow + idx1, 1 + idx2).value = +e[column.field];
          firstSheet.getCell(fromRow + idx1, 1 + idx2).numFmt = '#';
        } else {
          firstSheet.getCell(fromRow + idx1, 1 + idx2).value = e[column.field];
        }
        firstSheet.getCell(fromRow + idx1, 1 + idx2).style = {
          ...this.#cellStyle,
        };
      });
    });
    const file = await workbook.xlsx.writeBuffer();
    BrowserUtilities.downloadBlob(
      new Blob([file], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      fileName
    );
  };

  // Helper để lấy giá trị text chuẩn từ ô Excel (xử lý RichText, Formula, Hyperlink)
  #getCellValue = (value: CellValue): string | number | null | undefined | boolean | Date => {
    if (value && typeof value === 'object') {
      // Xử lý Rich Text (vd: ô bôi đậm)
      if ('richText' in value) {
        return value.richText.map(t => t.text).join('');
      }
      // Xử lý Hyperlink
      if ('text' in value) {
        return value.text as string; // hoặc value.result nếu là công thức
      }
      // Xử lý Formula
      if ('result' in value) {
        return value.result as any;
      }
    }
    return value as any;
  };
  upload = async (): Promise<{ items: Record<string, any>[]; file: File | null }> => {
    try {
      const fileResult = await BrowserUtilities.upload({
        extensions: ['xlsx'],
        maxSizeInMb: 10,
      });

      // Chuẩn hóa file đầu vào (nếu upload trả về mảng thì lấy phần tử đầu)
      const file = Array.isArray(fileResult) ? fileResult[0] : fileResult;

      if (!file) {
        return { items: [], file: null };
      }

      return await this.parse(file);
    } catch (error) {
      console.error('Upload error:', error);
      throw error; // Hoặc return { items: [], file: null } tùy logic nghiệp vụ
    }
  };
  parse = async (file: File): Promise<{ items: Record<string, any>[]; file: File | null }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          if (!buffer) {
            throw new Error(this.#i18n.t('core.excel.cannot-read-file'));
          }

          const Workbook = await this.#loadWorkbook();
          const wb = new Workbook();
          await wb.xlsx.load(buffer);

          const sheet = wb.worksheets[0];
          if (!sheet) {
            throw new Error(this.#i18n.t('core.excel.no-sheet'));
          }

          const items: Record<string, any>[] = [];

          // Lấy row Header (Row 1)
          const headerRow = sheet.getRow(1);
          // Map: Column Index (bắt đầu từ 1) -> Tên trường (Key)
          const headerMap: Record<number, string> = {};

          // Duyệt qua các ô có dữ liệu thực tế của dòng Header
          headerRow.eachCell((cell, colNumber) => {
            const cellValue = this.#getCellValue(cell.value);
            if (cellValue) {
              // Ép kiểu về string và trim để làm key
              headerMap[colNumber] = String(cellValue).trim();
            }
          });

          // Duyệt dữ liệu từ dòng 2 trở đi
          sheet.eachRow((row, rowIndex) => {
            if (rowIndex <= 1 || !row.hasValues) return;

            const item: Record<string, any> = {};

            // Chỉ duyệt qua các cột đã định nghĩa trong headerMap
            // Cách này an toàn hơn là duyệt mảng values
            Object.keys(headerMap).forEach(colKey => {
              const colNumber = Number(colKey);
              const fieldKey = headerMap[colNumber];

              // Lấy giá trị ô tại cột tương ứng
              const rawValue = this.#getCellValue(row.getCell(colNumber).value);

              let finalValue = rawValue;

              // Xử lý string: trim
              if (typeof finalValue === 'string') {
                finalValue = finalValue.trim();
              }

              // Xử lý các keyword đặc biệt
              if (finalValue === '' || finalValue === undefined) {
                finalValue = null;
              } else if (finalValue === 'SET_NULL') {
                finalValue = null;
              } else if (finalValue === 'SET_EMPTY') {
                finalValue = '';
              }

              item[fieldKey] = finalValue;
            });

            // Chỉ push nếu item có dữ liệu (tùy chọn)
            if (Object.keys(item).length > 0) {
              items.push(item);
            }
          });

          resolve({ items, file });
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = error => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };
}
