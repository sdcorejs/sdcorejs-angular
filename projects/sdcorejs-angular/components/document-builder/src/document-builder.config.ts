/**
 * Cấu hình màu cho Document Builder
 * Bảng màu tập trung và cấu hình cho việc lựa chọn màu nhất quán
 */

import { ColorPickerConfig, FontColorConfig, FontSizeConfig, HeadingConfig } from 'ckeditor5';

/**
 * Trả về bảng màu chung được sử dụng trong tất cả tính năng của document builder
 * @returns Mảng các tùy chọn màu được định sẵn với giá trị hex và label
 */
export function getPresetColors(): FontColorConfig['colors'] {
  return [
    { color: '#000000', label: 'Black' },
    { color: '#4D4D4D', label: 'Dim grey' },
    { color: '#999999', label: 'Grey' },
    { color: '#E6E6E6', label: 'Light grey' },
    { color: '#FFFFFF', label: 'White' },
    { color: '#E64D4D', label: 'Red' },
    { color: '#E6994D', label: 'Orange' },
    { color: '#E6E64D', label: 'Yellow' },
    { color: '#99E64D', label: 'Light green' },
    { color: '#4DE64D', label: 'Green' },
    { color: '#4DE699', label: 'Aquamarine' },
    { color: '#4DE6E6', label: 'Turquoise' },
    { color: '#4D99E6', label: 'Light blue' },
    { color: '#4D4DE6', label: 'Blue' },
    { color: '#994DE6', label: 'Purple' },
  ];
}

/**
 * Trả về cấu hình bộ chọn màu với định dạng hex
 * @returns Đối tượng cấu hình bộ chọn màu
 */
export function getColorPickerConfig(): ColorPickerConfig {
  return {
    format: 'hex',
  };
}

/**
 * Trả về cấu hình kích thước font cho document builder
 * @returns Mảng các tùy chọn kích thước font được định sẵn
 */
export function getFontSizeOptions(): FontSizeConfig['options'] {
  return [
    {
      title: '9',
      model: '9pt',
      view: {
        name: 'span',
        styles: { 'font-size': '9pt' },
        priority: 7,
      },
    },
    {
      title: '10',
      model: '10pt',
      view: {
        name: 'span',
        styles: { 'font-size': '10pt' },
        priority: 7,
      },
    },
    {
      title: '11',
      model: '11pt',
      view: {
        name: 'span',
        styles: { 'font-size': '11pt' },
        priority: 7,
      },
    },
    {
      title: '12',
      model: '12pt',
      view: {
        name: 'span',
        styles: { 'font-size': '12pt' },
        priority: 7,
      },
    },
    {
      title: '13',
      model: '13pt',
      view: {
        name: 'span',
        styles: { 'font-size': '13pt' },
        priority: 7,
      },
    },
    {
      title: '14',
      model: '14pt',
      view: {
        name: 'span',
        styles: { 'font-size': '14pt' },
        priority: 7,
      },
    },
    {
      title: '16',
      model: '16pt',
      view: {
        name: 'span',
        styles: { 'font-size': '16pt' },
        priority: 7,
      },
    },
    {
      title: '18',
      model: '18pt',
      view: {
        name: 'span',
        styles: { 'font-size': '18pt' },
        priority: 7,
      },
    },
    {
      title: '20',
      model: '20pt',
      view: {
        name: 'span',
        styles: { 'font-size': '20pt' },
        priority: 7,
      },
    },
    {
      title: '24',
      model: '24pt',
      view: {
        name: 'span',
        styles: { 'font-size': '24pt' },
        priority: 7,
      },
    },
  ];
}

export function getHeadingOptions(): HeadingConfig['options'] {
  return [
    {
      model: 'paragraph',
      title: 'Paragraph',
      class: 'ck-heading_paragraph',
    },
    {
      model: 'heading1',
      view: {
        name: 'h1',
        styles: { 'font-size': '24pt', 'font-weight': 'bold', 'line-height': '1.15' },
      },
      title: 'Heading 1',
      class: 'ck-heading_heading1',
    },
    {
      model: 'heading2',
      view: {
        name: 'h2',
        styles: { 'font-size': '20pt', 'font-weight': 'bold', 'line-height': '1.15' },
      },
      title: 'Heading 2',
      class: 'ck-heading_heading2',
    },
    {
      model: 'heading3',
      view: {
        name: 'h3',
        styles: { 'font-size': '16pt', 'font-weight': 'bold', 'line-height': '1.15' },
      },
      title: 'Heading 3',
      class: 'ck-heading_heading3',
    },
  ];
}
