import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdButton } from '@sdcorejs/angular/components/button';
import {
  SdImportExcel,
  SdImportExcelOption,
  SdImportExcelValidation,
} from '@sdcorejs/angular/components/import-excel';

interface EmployeeRow {
  code: string;
  fullName: string;
  age: number;
  department: string;
  joinDate: Date;
  isActive: boolean;
  skills: string[];
}

@Component({
  selector: 'app-import-excel-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, SdButton, SdImportExcel],
  template: `
    <demo-page
      title="Import Excel"
      description="Quy trình import Excel đầy đủ — tải mẫu, upload file, validate theo dòng & chéo dòng, preview các dòng OK / cảnh báo / lỗi, xuất file lỗi và trả về dữ liệu hợp lệ.">

      <demo-section heading="Import danh sách nhân viên">
        <p class="hint">Bấm nút bên dưới để mở modal import. Có thể bấm "Tải file mẫu" trong modal để tải template Excel.</p>
        <sd-button
          type="fill"
          color="primary"
          title="Mở Import Excel"
          prefixIcon="upload_file"
          (click)="excelModal()?.open()">
        </sd-button>
        <sd-import-excel [option]="employeeImport" #excelModalRef></sd-import-excel>
      </demo-section>
    </demo-page>
  `,
  styles: [`
    .hint {
      font-size: 13px;
      color: #6b6b6b;
      margin: 0 0 8px;
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportExcelDemoComponent {
  readonly excelModal = viewChild<SdImportExcel>('excelModalRef');

  readonly employeeImport: SdImportExcelOption<EmployeeRow> = {
    title: 'Nhập liệu Nhân viên',
    fileName: 'Mau_Import_NhanVien',
    limit: 1000,
    columns: [
      { field: 'code', title: 'Mã NV', type: 'string', width: '120px', required: true, maxlength: 10 },
      { field: 'fullName', title: 'Họ và tên', type: 'string', width: '220px', required: true },
      { field: 'age', title: 'Tuổi', type: 'number', width: '80px', required: true, min: 18, max: 65 },
      {
        field: 'department',
        title: 'Phòng ban',
        type: 'values',
        width: '150px',
        values: ['IT', 'HR', 'Sale', 'Marketing'],
        checkValueInArray: true,
      },
      {
        field: 'joinDate',
        title: 'Ngày vào làm',
        type: 'date',
        width: '150px',
        format: 'dd/MM/yyyy',
        required: true,
      },
      { field: 'isActive', title: 'Đang làm việc', type: 'bool', width: '120px' },
      {
        field: 'skills',
        title: 'Kỹ năng',
        type: 'array',
        width: '260px',
        divideString: ',',
        unitString: 'kỹ năng',
      },
    ],
    validateItem: async (item, index, allItems): Promise<SdImportExcelValidation> => {
      const duplicateCount = allItems.filter(i => (i as EmployeeRow).code === item.code).length;
      if (duplicateCount > 1) {
        return { idx: index, errorMessage: `Mã nhân viên <strong>${item.code}</strong> bị trùng lặp.` };
      }
      if (item.age && item.age < 22) {
        return { idx: index, warningMessage: 'Nhân viên trẻ (< 22 tuổi) cần đào tạo thêm.' };
      }
      return { idx: index };
    },
    accept: items => {
      alert(`Đã nhận ${items.length} dòng dữ liệu hợp lệ!`);
      return [];
    },
  };
}
