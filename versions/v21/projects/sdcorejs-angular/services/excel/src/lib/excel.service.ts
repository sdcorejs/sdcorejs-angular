import { inject, Injectable } from '@angular/core';
import type { CellValue, Style } from 'exceljs';
// import hash from 'object-hash';
import { DateUtilities, SdUtilities } from '@sdcorejs/angular/utilities/extensions';
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

  // exceljs lÃ  CJS module â€” khi dynamic import tá»« ESM, named export `Workbook`
  // cÃ³ thá»ƒ náº±m trÃªn `mod.Workbook` hoáº·c bá»‹ bá»c trong `mod.default.Workbook` tuá»³ bundler.
  // Helper nÃ y chuáº©n hoÃ¡ cáº£ hai trÆ°á»ng há»£p.
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
    const firstSheet = workbook.addWorksheet('template'); // Láº¥y ra sheet Ä‘áº§u tiÃªn
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
    SdUtilities.downloadBlob(
      new Blob([file], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      fileName
    );
  };

  exportCSV = async (option: SdExcelExportOption): Promise<void> => {
    const { columns, items, fileName } = option;
    const filename = `${fileName || 'CSV'}_${DateUtilities.toFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.csv`;

    // Escape CSV cell: bá»c trong dáº¥u " náº¿u chá»©a dáº¥u pháº©y / xuá»‘ng dÃ²ng / dáº¥u ngoáº·c kÃ©p.
    // Dáº¥u " bÃªn trong Ä‘Æ°á»£c nhÃ¢n Ä‘Ã´i theo chuáº©n RFC 4180.
    const escape = (v: unknown): string => {
      if (v == null) return '';
      const s = String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const headerLine = columns.map(c => escape(c.title)).join(',');
    const dataLines = items.map(item =>
      columns.map(c => escape((item as Record<string, unknown>)[c.field])).join(','),
    );

    // Prepend UTF-8 BOM (ï»¿) Ä‘á»ƒ Excel má»Ÿ Ä‘Ãºng encoding cho tiáº¿ng Viá»‡t cÃ³ dáº¥u.
    // DÃ¹ng CRLF vÃ¬ Excel trÃªn Windows Æ°u tiÃªn, macOS Excel cÅ©ng cháº¥p nháº­n.
    const csv = 'ï»¿' + [headerLine, ...dataLines].join('\r\n');

    SdUtilities.downloadBlob(
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
    const workbook = new Workbook(); //await XlsxPopulate.fromBlankAsync(); // Äá»c file sau khi Ä‘Ã£ download
    const firstSheet = workbook.addWorksheet('data'); // Láº¥y ra sheet Ä‘áº§u tiÃªn
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
          // Format máº·c Ä‘á»‹nh vá»›i kiá»ƒu sá»‘
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
    SdUtilities.downloadBlob(
      new Blob([file], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      fileName
    );
  };

  // Helper Ä‘á»ƒ láº¥y giÃ¡ trá»‹ text chuáº©n tá»« Ã´ Excel (xá»­ lÃ½ RichText, Formula, Hyperlink)
  #getCellValue = (value: CellValue): string | number | null | undefined | boolean | Date => {
    if (value && typeof value === 'object') {
      // Xá»­ lÃ½ Rich Text (vd: Ã´ bÃ´i Ä‘áº­m)
      if ('richText' in value) {
        return value.richText.map(t => t.text).join('');
      }
      // Xá»­ lÃ½ Hyperlink
      if ('text' in value) {
        return value.text as string; // hoáº·c value.result náº¿u lÃ  cÃ´ng thá»©c
      }
      // Xá»­ lÃ½ Formula
      if ('result' in value) {
        return value.result as any;
      }
    }
    return value as any;
  };
  upload = async (): Promise<{ items: Record<string, any>[]; file: File | null }> => {
    try {
      const fileResult = await SdUtilities.upload({
        extensions: ['xlsx'],
        maxSizeInMb: 10,
      });

      // Chuáº©n hÃ³a file Ä‘áº§u vÃ o (náº¿u upload tráº£ vá» máº£ng thÃ¬ láº¥y pháº§n tá»­ Ä‘áº§u)
      const file = Array.isArray(fileResult) ? fileResult[0] : fileResult;

      if (!file) {
        return { items: [], file: null };
      }

      return await this.parse(file);
    } catch (error) {
      console.error('Upload error:', error);
      throw error; // Hoáº·c return { items: [], file: null } tÃ¹y logic nghiá»‡p vá»¥
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

          // Láº¥y row Header (Row 1)
          const headerRow = sheet.getRow(1);
          // Map: Column Index (báº¯t Ä‘áº§u tá»« 1) -> TÃªn trÆ°á»ng (Key)
          const headerMap: Record<number, string> = {};

          // Duyá»‡t qua cÃ¡c Ã´ cÃ³ dá»¯ liá»‡u thá»±c táº¿ cá»§a dÃ²ng Header
          headerRow.eachCell((cell, colNumber) => {
            const cellValue = this.#getCellValue(cell.value);
            if (cellValue) {
              // Ã‰p kiá»ƒu vá» string vÃ  trim Ä‘á»ƒ lÃ m key
              headerMap[colNumber] = String(cellValue).trim();
            }
          });

          // Duyá»‡t dá»¯ liá»‡u tá»« dÃ²ng 2 trá»Ÿ Ä‘i
          sheet.eachRow((row, rowIndex) => {
            if (rowIndex <= 1 || !row.hasValues) return;

            const item: Record<string, any> = {};

            // Chá»‰ duyá»‡t qua cÃ¡c cá»™t Ä‘Ã£ Ä‘á»‹nh nghÄ©a trong headerMap
            // CÃ¡ch nÃ y an toÃ n hÆ¡n lÃ  duyá»‡t máº£ng values
            Object.keys(headerMap).forEach(colKey => {
              const colNumber = Number(colKey);
              const fieldKey = headerMap[colNumber];

              // Láº¥y giÃ¡ trá»‹ Ã´ táº¡i cá»™t tÆ°Æ¡ng á»©ng
              const rawValue = this.#getCellValue(row.getCell(colNumber).value);

              let finalValue = rawValue;

              // Xá»­ lÃ½ string: trim
              if (typeof finalValue === 'string') {
                finalValue = finalValue.trim();
              }

              // Xá»­ lÃ½ cÃ¡c keyword Ä‘áº·c biá»‡t
              if (finalValue === '' || finalValue === undefined) {
                finalValue = null;
              } else if (finalValue === 'SET_NULL') {
                finalValue = null;
              } else if (finalValue === 'SET_EMPTY') {
                finalValue = '';
              }

              item[fieldKey] = finalValue;
            });

            // Chá»‰ push náº¿u item cÃ³ dá»¯ liá»‡u (tÃ¹y chá»n)
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

