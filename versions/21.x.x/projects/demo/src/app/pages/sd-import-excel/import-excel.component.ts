import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SdButton } from '@sdcorejs/angular/components/button'; // Sá»­a path náº¿u cáº§n
import { SdImportExcel, SdImportExcelOption, SdImportExcelValidation } from '@sdcorejs/angular/components';

@Component({
  selector: 'app-demo-import',
  standalone: true,
  imports: [CommonModule, SdButton, SdImportExcel],
  template: `
    <div class="p-5">
      <h1>Demo Import Excel UI</h1>
      <p class="mb-4 text-muted">Nháº¥n nÃºt bÃªn dÆ°á»›i Ä‘á»ƒ má»Ÿ Modal kiá»ƒm tra giao diá»‡n Empty State vÃ  Table.</p>

      <sd-button (click)="excelModal.open()" icon="upload_file"> Má»Ÿ Import Excel </sd-button>

      <sd-import-excel [option]="config" #excelModal></sd-import-excel>
    </div>
  `,
})
export class DemoImportComponent {
  @ViewChild('excelModal') excelModal!: SdImportExcel;

  // Cáº¥u hÃ¬nh Demo
  config: SdImportExcelOption = {
    title: 'Nháº­p liá»‡u NhÃ¢n viÃªn (Demo)',
    fileName: 'Mau_Import_NhanVien', // TÃªn file máº«u khi táº£i vá»
    limit: 5000, // Giá»›i háº¡n dÃ²ng

    // 1. Äá»‹nh nghÄ©a cá»™t
    columns: [
      {
        field: 'code',
        title: 'MÃ£ NV',
        width: '120px',
        type: 'string',
        required: true,
        maxlength: 10,
      },
      {
        field: 'fullName',
        title: 'Há» vÃ  tÃªn',
        width: '200px',
        type: 'string',
        required: true,
      },
      {
        field: 'age',
        title: 'Tuá»•i',
        width: '80px',
        type: 'number',
        required: true,
        min: 18,
        max: 65,
      },
      {
        field: 'department',
        title: 'PhÃ²ng ban',
        width: '150px',
        type: 'values', // Dropdown/Enum check
        values: ['IT', 'HR', 'Sale', 'Marketing'],
        checkValueInArray: true, // Báº¯t buá»™c pháº£i náº±m trong list trÃªn
      },
      {
        field: 'joinDate',
        title: 'NgÃ y vÃ o lÃ m',
        width: '150px',
        type: 'date',
        format: 'dd/MM/yyyy',
        required: true,
      },
      {
        field: 'isActive',
        title: 'Äang lÃ m viá»‡c',
        width: '100px',
        type: 'bool', // Check hiá»ƒn thá»‹ checkbox/true-false
      },
      {
        field: 'skills',
        title: 'Ká»¹ nÄƒng (Máº£ng)',
        width: '250px',
        type: 'array', // Check hiá»ƒn thá»‹ máº£ng
        divideString: ',', // PhÃ¢n cÃ¡ch báº±ng dáº¥u pháº©y
        unitString: 'skills',
      },
    ],

    // 2. Cáº¥u hÃ¬nh File Máº«u (Äá»ƒ test nÃºt Download Template á»Ÿ Empty State)
    sheets: [],

    // 3. Custom Validate Logic (Test logic validate chÃ©o)
    validateItem: async (item, index, allItems): Promise<SdImportExcelValidation> => {
      // Giáº£ láº­p check trÃ¹ng mÃ£ nhÃ¢n viÃªn trong file
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const duplicateCount = allItems.filter((i: any) => i.code === item.code).length;
      if (duplicateCount > 1) {
        return {
          idx: index,
          errorMessage: `MÃ£ nhÃ¢n viÃªn <strong>${item.code}</strong> bá»‹ trÃ¹ng láº·p trong file`,
        };
      }

      // Giáº£ láº­p check logic nghiá»‡p vá»¥ (Tuá»•i < 20 thÃ¬ Warning)
      if (item.age && item.age < 22) {
        return {
          idx: index,
          warningMessage: `NhÃ¢n viÃªn tráº» (dÆ°á»›i 22 tuá»•i) cáº§n Ä‘Ã o táº¡o thÃªm`,
        };
      }

      return { idx: index };
    },

    // 4. Xá»­ lÃ½ khi báº¥m nÃºt "XÃ¡c nháº­n"
    accept: items => {
      console.log('--- UPLOAD SUCCESS ---');
      console.log('Data:', items);
      alert(`ÄÃ£ nháº­n ${items.length} dÃ²ng dá»¯ liá»‡u há»£p lá»‡!`);
      return [];
    },
  };
}

