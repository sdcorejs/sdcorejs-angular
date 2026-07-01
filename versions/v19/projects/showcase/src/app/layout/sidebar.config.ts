export interface SidebarItem {
  label: string;
  path: string;
}

export interface SidebarGroup {
  title: string;
  icon: string;
  items: SidebarItem[];
}

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    title: 'Components',
    icon: 'widgets',
    items: [
      { label: 'Anchor', path: 'components/anchor' },
      { label: 'Avatar', path: 'components/avatar' },
      { label: 'Badge', path: 'components/badge' },
      { label: 'Button', path: 'components/button' },
      { label: 'Chart', path: 'components/chart' },
      { label: 'Code Editor', path: 'components/code-editor' },
      { label: 'Document Builder', path: 'components/document-builder' },
      { label: 'Editor', path: 'components/editor' },
      { label: 'Form Generic', path: 'components/form-generic' },
      { label: 'History', path: 'components/history' },
      { label: 'Icon', path: 'components/icon' },
      { label: 'Import Excel', path: 'components/import-excel' },
      { label: 'Inform', path: 'components/inform' },
      { label: 'Mini Editor', path: 'components/mini-editor' },
      { label: 'Modal', path: 'components/modal' },
      { label: 'Operator', path: 'components/operator' },
      { label: 'Org Chart', path: 'components/org-chart' },
      { label: 'Preview', path: 'components/preview' },
      { label: 'Query Bar', path: 'components/query-bar' },
      { label: 'Query Builder', path: 'components/query-builder' },
      { label: 'Quick Action', path: 'components/quick-action' },
      { label: 'Section', path: 'components/section' },
      { label: 'Side Drawer', path: 'components/side-drawer' },
      { label: 'Splitter', path: 'components/splitter' },
      { label: 'Stepper', path: 'components/stepper' },
      { label: 'Tab', path: 'components/tab' },
      { label: 'Tab Router', path: 'components/tab-router' },
      { label: 'Table', path: 'components/table' },
      { label: 'Tree', path: 'components/tree' },
      { label: 'Upload File', path: 'components/upload-file' },
      { label: 'View', path: 'components/view' },
    ],
  },
  {
    title: 'Forms',
    icon: 'edit_note',
    items: [
      { label: 'Autocomplete', path: 'forms/autocomplete' },
      { label: 'Checkbox', path: 'forms/checkbox' },
      { label: 'Chip', path: 'forms/chip' },
      { label: 'Chip Calendar', path: 'forms/chip-calendar' },
      { label: 'Date', path: 'forms/date' },
      { label: 'Date Range', path: 'forms/date-range' },
      { label: 'Datetime', path: 'forms/datetime' },
      { label: 'Inline Text', path: 'forms/inline-text' },
      { label: 'Input', path: 'forms/input' },
      { label: 'Input Color', path: 'forms/input-color' },
      { label: 'Input Number', path: 'forms/input-number' },
      { label: 'Radio', path: 'forms/radio' },
      { label: 'Select', path: 'forms/select' },
      { label: 'Switch', path: 'forms/switch' },
      { label: 'Textarea', path: 'forms/textarea' },
    ],
  },
  {
    title: 'Services',
    icon: 'build',
    items: [
      { label: 'Confirm', path: 'services/confirm' },
      { label: 'Docx Export', path: 'services/docx' },
      { label: 'Excel Export', path: 'services/excel' },
      { label: 'Loading', path: 'services/loading' },
      { label: 'Notify', path: 'services/notify' },
      { label: 'Storage', path: 'services/storage' },
    ],
  },
];
