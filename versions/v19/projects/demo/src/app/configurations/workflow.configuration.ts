import { Injectable } from '@angular/core';

import { ISdWorkflowConfiguration } from '@sdcorejs/angular/components';

@Injectable({
  providedIn: 'root',
})
export class WorkflowConfiguration implements ISdWorkflowConfiguration {
  constructor() {
    // this.#url = environment.host; // TODO
  }

  form: ISdWorkflowConfiguration['form'] = {
    templates: [
      {
        value: 'T1',
        display: 'Template 1',
        component: {
          id: '',
          key: 'template_1',
          type: 'textfield',
          label: 'Label template 1',
          validate: {
            required: true,
          },
        },
      },
    ],
    selections: [
      {
        value: 'UNIT',
        display: 'CÄƒn há»™',
        values: async () => {
          return [{ value: 'CH1', display: 'CÄƒn há»™ 1' }];
        },
        queries: {
          items: [
            {
              value: 'tower_id',
              display: 'TÃ²a',
            },
          ],
        },
        variables: {
          items: [
            {
              value: 'name',
              display: 'TÃªn cÄƒn há»™',
            },
          ],
          detail: async values => {
            if (!Array.isArray(values)) {
              return { name: 'CÄƒn há»™ 1' };
            }
            return undefined;
          },
        },
      },
    ],
    tables: [
      {
        value: 'TABLE_01',
        display: 'Table máº«u 1',
        columns: () => [
          {
            key: 'key_01',
            label: 'Cá»™t máº«u 1',
            width: '150px',
            type: 'string',
          },
          {
            key: 'key_02',
            label: 'Cá»™t máº«u 2',
            type: 'string',
          },
        ],
      },
    ],
    htmls: [
      {
        value: 'DEFINITION_01',
        display: 'Máº«u 1',
        type: 'static',
        content:
          '<div style="background:#F9F9F9" class="px-16 py-8 my-16">\n<span class="material-icons-outlined align-middle">${icon}</span>\n<strong class="fs-14">${title}</strong>\n</div>',
        variables: [
          {
            key: 'icon',
            label: 'Icon',
            value: 'home',
          },
          {
            key: 'title',
            label: 'TiÃªu Ä‘á»',
            value: 'ÄÃ¢y lÃ  tiÃªu Ä‘á» máº«u',
          },
        ],
      },
      {
        value: 'DEFINITION_02',
        display: 'Máº«u 2',
        type: 'query',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: async (query?: Record<string, any>) => {
          if (query?.['key01'] === 'A') {
            return `HTML A`;
          } else if (query?.['key01'] === 'B') {
            return `HTML B`;
          }
          return `HTML khÃ¡c A & B`;
        },
        queries: [
          {
            key: 'key01',
            label: 'Key 01',
          },
        ],
      },
      {
        type: 'query',
        value: 'DEFINITION_03',
        display: 'MÃ£ QR',
        content: async query => {
          let imageSource;
          if (query?.['source']) {
            imageSource = query?.['source'];
          }
          return `<img src="${imageSource || '/assets/images/no-qr-img.svg'}" alt="QR Code" style="width: \${width};height: \${height}"/>`;
        },
        queries: [
          {
            key: 'source',
            label: 'Nguá»“n áº¢nh QR',
          },
        ],
        variables: [
          {
            key: 'width',
            label: 'Chiá»u rá»™ng',
            value: '100px',
          },
          {
            key: 'height',
            label: 'Chiá»u cao',
            value: '100px',
          },
        ],
      },
    ],
    validation: {
      functions: [
        {
          value: 'VALIDATIION_01',
          display: 'Validation sá»‘ 1',
          validate: async args => {
            await new Promise(resole => setTimeout(resole, 2000));
            return 'ÄÃ¢y lÃ  bÃ¡o lá»—i 1 tá»« Server';
          },
        },
        {
          value: 'VALIDATIION_02',
          display: 'Validation sá»‘ 2',
          validate: async args => {
            await new Promise(resole => setTimeout(resole, 2000));
            return 'ÄÃ¢y lÃ  bÃ¡o lá»—i 2 tá»« Server';
          },
        },
      ],
    },
  };
}

