import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';
import { SdExcelService } from '@sdcorejs/angular/services/excel';

interface Employee {
  code: string;
  name: string;
  department: string;
  salary: number;
}

@Component({
  selector: 'app-excel-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent, MatButtonModule],
  template: `
    <demo-page title="Excel" description="SdExcelService – export() / exportCSV() / generateTemplate() / upload() / parse(). Sử dụng exceljs nội bộ, tự kèm header có style.">
      <demo-section heading="Xuất file .xlsx" [props]="[{ name: 'export()', value: 'method' }]" note="export({ columns, items, fileName }) – sheet 'data' có header + dữ liệu.">
        <button mat-flat-button color="primary" (click)="onExport()">Tải nhanvien.xlsx</button>
      </demo-section>

      <demo-section heading="Xuất file .csv" [props]="[{ name: 'exportCSV()', value: 'method' }]" note="exportCSV() – kèm BOM UTF-8 để Excel mở đúng dấu tiếng Việt.">
        <button mat-flat-button color="primary" (click)="onExportCsv()">Tải nhanvien.csv</button>
      </demo-section>

      <demo-section heading="Tải template trống" [props]="[{ name: 'generateTemplate()', value: 'method' }]" note="generateTemplate() – tạo file mẫu để người dùng nhập liệu (cột có required, mô tả).">
        <button mat-stroked-button (click)="onTemplate()">Tải template-nhanvien.xlsx</button>
      </demo-section>
    </demo-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExcelDemoComponent {
  readonly #excel = inject(SdExcelService);

  readonly #items: Employee[] = [
    { code: 'NV001', name: 'Nguyễn Văn An',  department: 'Kỹ thuật',  salary: 18500000 },
    { code: 'NV002', name: 'Trần Thị Bích',  department: 'Nhân sự',   salary: 14200000 },
    { code: 'NV003', name: 'Lê Minh Cường',  department: 'Kinh doanh', salary: 22000000 },
    { code: 'NV004', name: 'Phạm Thu Hà',    department: 'Marketing', salary: 16800000 },
    { code: 'NV005', name: 'Hoàng Văn Đức',  department: 'Kỹ thuật',  salary: 19500000 },
  ];

  readonly #columns = [
    { field: 'code',       title: 'Mã NV',     width: '120px' },
    { field: 'name',       title: 'Họ và tên', width: '220px' },
    { field: 'department', title: 'Phòng ban', width: '180px' },
    { field: 'salary',     title: 'Lương (VND)', width: '160px' },
  ];

  async onExport() {
    await this.#excel.export({ columns: this.#columns, items: this.#items, fileName: 'nhanvien.xlsx' });
  }

  async onExportCsv() {
    await this.#excel.exportCSV({ columns: this.#columns, items: this.#items, fileName: 'nhanvien' });
  }

  async onTemplate() {
    await this.#excel.generateTemplate({
      fileName: 'template-nhanvien.xlsx',
      columns: [
        { field: 'code',       title: 'Mã NV',       required: true,  description: 'Bắt buộc, duy nhất' },
        { field: 'name',       title: 'Họ và tên',   required: true,  description: 'Bắt buộc' },
        { field: 'department', title: 'Phòng ban',   description: 'Có thể bỏ trống' },
        { field: 'salary',     title: 'Lương (VND)', description: 'Số nguyên dương' },
      ],
    });
  }
}
