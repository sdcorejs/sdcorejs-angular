// export type SdCellValue = null | number | string | boolean | Date | undefined;

// export interface SdExcelColor {
//   /**
//    * Hex string for alpha-red-green-blue e.g. FF00FF00
//    */
//   argb: string;

//   /**
//    * Choose a theme by index
//    */
//   theme: number;
// }
// export interface SdExcelFont {
//   name: string;
//   size: number;
//   family: number;
//   scheme: 'minor' | 'major' | 'none';
//   charset: number;
//   color: Partial<SdExcelColor>;
//   bold: boolean;
//   italic: boolean;
//   underline: boolean | 'none' | 'single' | 'double' | 'singleAccounting' | 'doubleAccounting';
//   vertAlign: 'superscript' | 'subscript';
//   strike: boolean;
//   outline: boolean;
// }

// export interface SdExcelAlignment {
//   horizontal: 'left' | 'center' | 'right' | 'fill' | 'justify' | 'centerContinuous' | 'distributed';
//   vertical: 'top' | 'middle' | 'bottom' | 'distributed' | 'justify';
//   wrapText: boolean;
//   shrinkToFit: boolean;
//   indent: number;
//   readingOrder: 'rtl' | 'ltr';
//   textRotation: number | 'vertical';
// }

// export type SdExcelBorderStyle =
//   | 'thin'
//   | 'dotted'
//   | 'hair'
//   | 'medium'
//   | 'double'
//   | 'thick'
//   | 'dashDot'
//   | 'dashDotDot'
//   | 'slantDashDot'
//   | 'mediumDashed'
//   | 'mediumDashDotDot'
//   | 'mediumDashDot';
// export interface SdExcelBorder {
//   style: SdExcelBorderStyle;
//   color: Partial<SdExcelColor>;
// }

// export interface SdExcelBorders {
//   top: Partial<SdExcelBorder>;
//   left: Partial<SdExcelBorder>;
//   bottom: Partial<SdExcelBorder>;
//   right: Partial<SdExcelBorder>;
// }

// export type SdExcelFillPatterns =
//   | 'none'
//   | 'solid'
//   | 'darkVertical'
//   | 'darkHorizontal'
//   | 'darkGrid'
//   | 'darkTrellis'
//   | 'darkDown'
//   | 'darkUp'
//   | 'lightVertical'
//   | 'lightHorizontal'
//   | 'lightGrid'
//   | 'lightTrellis'
//   | 'lightDown'
//   | 'lightUp'
//   | 'darkGray'
//   | 'mediumGray'
//   | 'lightGray'
//   | 'gray125'
//   | 'gray0625';
// export interface SdExcelFillPattern {
//   type: 'pattern';
//   pattern: SdExcelFillPatterns;
//   fgColor?: Partial<SdExcelColor>;
//   bgColor?: Partial<SdExcelColor>;
// }
// export type SdExcelFill = SdExcelFillPattern;

// export interface SdStyle {
//   numFmt: string;
//   font: Partial<SdExcelFont>;
//   alignment: Partial<SdExcelAlignment>;
//   border: Partial<SdExcelBorders>;
//   fill: SdExcelFill;
// }
// export interface SdCell {
//   row: number;
//   column: number;
//   value?: SdCellValue;
//   style?: SdStyle;
// }

// export interface SdSheet {
//   name?: string;
//   columns?: {
//     index: number;
//     width?: number;
//     style?: SdStyle;
//   }[];
//   cells: SdCell[];
//   mergeCells?: {
//     top: number;
//     left: number;
//     bottom: number;
//     right: number;
//   }[];
// }
// export interface SdExportCustomOption {
//   fileName?: string;
//   sheets: SdSheet[];
// }
