import { CommonModule } from '@angular/common';
import { Component, ViewChild, AfterViewInit, TemplateRef } from '@angular/core';
import { SdTabelCellDefDirective } from '@sdcorejs/angular/components';
import { SdTable, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdSelect } from '@sdcorejs/angular/forms';
import { SdInput } from '@sdcorejs/angular/forms';

interface DemoItem {
  number: number;
  string: string;
  boolean: boolean;
  values: string;
  htmlTemplate: string;
  transform: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  templateRef: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cellDef: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  date: any;
}

@Component({
  templateUrl: './sd-table-demo.component.html',
  imports: [CommonModule, SdTable, SdTabelCellDefDirective, SdInput, SdSelect],
})
export class SdTableDemoComponent implements AfterViewInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @ViewChild('cellDef') cellDef: TemplateRef<any> | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @ViewChild('filterInlineDefNumber') filterInlineDefNumber: TemplateRef<any> | undefined;
  @ViewChild(SdTable) sdTable!: SdTable;

  statuses = [
    {
      value: 'ACTIVE',
      display: 'Hoáº¡t Ä‘á»™ng',
    },
    {
      value: 'INACTIVE',
      display: 'Ngá»«ng hoáº¡t Ä‘á»™ng',
    },
    {
      value: 'PENDING',
      display: 'Chá»',
    },
  ];
  tableOption!: SdTableOption<DemoItem>;

  ngAfterViewInit() {
    this.tableOption = {
      type: 'server',
      key: 'bc39e044-3c4b-46d7-a6ee-179327b87559',
      items: async filterRequest => {
        console.log(filterRequest?.rawColumnFilter?.number);
        const res = await this.#getDemoData();
        return {
          items: res,
          total: res?.length,
        };
      },
      config: {
        visible: true,
      },
      columns: [
        {
          field: 'number',
          title: 'Number',
          type: 'number',
          width: '150px',
          charLimited: {
            enable: true,
          },
          filter: {
            operator: {
              enable: true,
              list: ['CONTAIN', 'EQUAL', 'IN'],
            },
            filterDef: this.filterInlineDefNumber,
          },
        },
        {
          field: 'string',
          title: 'String',
          type: 'string',
          width: '200px',
          charLimited: {
            enable: true,
            expandType: 'more',
          },
          filter: {
            operator: {
              enable: true,
              list: ['CONTAIN', 'EQUAL', 'IN'],
            },
          },
        },
        {
          field: 'boolean',
          title: 'Boolean',
          type: 'boolean',
          width: '200px',
        },
        {
          field: 'values',
          title: 'Values',
          type: 'values',
          option: {
            items: this.statuses,
            valueField: 'value',
            displayField: 'display',
          },
          width: '200px',
        },
        {
          field: 'htmlTemplate',
          title: 'HTMLTemplate',
          type: 'string',
          htmlTemplate: value => {
            return value;
          },
          charLimited: {
            enable: true,
          },
          width: '200px',
        },
        {
          field: 'transform',
          title: 'Transform',
          type: 'string',
          transform: value => {
            return value;
          },
          charLimited: {
            enable: true,
          },
          width: '200px',
        },
        {
          field: 'templateRef',
          title: 'TemplateRef',
          type: 'string',
          width: '200px',
          charLimited: {
            enable: true,
          },
        },
        {
          field: 'cellDef',
          title: 'CellDef',
          type: 'string',
          width: '200px',
          cellDef: this.cellDef,
          charLimited: {
            enable: true,
          },
        },
        {
          field: 'date',
          title: 'Date',
          type: 'datetime',
          width: '200px',
        },
      ],
      paginate: {
        pageSize: 10,
        pages: [10, 25, 50, 100],
      },
      filter: {
        hideExternalFilterToolbar: true,
      },
      selector: {
        visible: true,
      },
    };
  }

  onFilterChange = () => {
    this.sdTable.onFilterChange();
  };

  #getDemoData = async (): Promise<DemoItem[]> => {
    return new Promise(resolve => {
      const data: DemoItem[] = [];
      const statuses = ['ACTIVE', 'INACTIVE', 'PENDING'];
      for (let i = 0; i < 50; i++) {
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        data.push({
          number: Math.floor(Math.random() * 1000000) + i,
          string: crypto.randomUUID(),
          values: statuses[Math.floor(Math.random() * statuses.length)],
          boolean: Math.random() > 0.5,
          transform: crypto.randomUUID(),
          date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
          cellDef: `
          <p><strong>Sáº£n pháº©m mÃ£ sá»‘: ${i + 1}</strong></p>
          <ul>
            <li>ThÆ°Æ¡ng hiá»‡u: Brand-${randomSuffix.toUpperCase()}</li>
            <li>KÃ­ch thÆ°á»›c: ${Math.floor(Math.random() * 500) + 100} mm</li>
          </ul>`,
          htmlTemplate: `<p>MÃ´ táº£ ngáº«u nhiÃªn cho má»¥c ${i}: ${randomSuffix}</p>`,
          templateRef: `Ref-${randomSuffix}-${i}`,
        });
      }
      setTimeout(() => {
        resolve(data);
      }, 100);
    });
  };
}

