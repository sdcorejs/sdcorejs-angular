import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SdMiniEditor, SdMiniEditorOption, SdMiniEditorMentionItem } from '@sdcorejs/angular/components/mini-editor';

@Component({
  selector: 'app-mini-editor-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, SdMiniEditor],
  templateUrl: './sd-mini-editor-demo.component.html',
  styleUrls: ['./sd-mini-editor-demo.component.scss'],
})
export class SdMiniEditorDemoComponent {
  // Demo 1: Basic HTML output
  basicContent = '';
  basicOption: SdMiniEditorOption = {
    outputFormat: 'html',
    placeholder: 'Nháº­p ná»™i dung vá»›i bold, italic, link...',
    onChange: content => console.log('Basic content:', content),
  };

  // Demo 2: Markdown output
  markdownContent = '';
  markdownOption: SdMiniEditorOption = {
    outputFormat: 'markdown',
    placeholder: 'Nháº­p ná»™i dung - sáº½ convert sang markdown',
    onChange: content => console.log('Markdown content:', content),
  };

  // Demo 3: With Mention
  mentionContent = '';
  mentionLogs: string[] = [];

  users = [
    { id: '1', name: 'Nguyá»…n VÄƒn A', email: 'nva@example.com', avatar: '' },
    { id: '2', name: 'Tráº§n Thá»‹ B', email: 'ttb@example.com', avatar: '' },
    { id: '3', name: 'LÃª VÄƒn C', email: 'lvc@example.com', avatar: '' },
    { id: '4', name: 'Pháº¡m Thá»‹ D', email: 'ptd@example.com', avatar: '' },
    { id: '5', name: 'HoÃ ng VÄƒn E', email: 'hve@example.com', avatar: '' },
  ];

  mentionOption: SdMiniEditorOption = {
    outputFormat: 'html',
    placeholder: 'GÃµ @ Ä‘á»ƒ mention ngÆ°á»i dÃ¹ng...',
    enableMention: true,
    mentionConfig: {
      feeds: [
        {
          marker: '@',
          minimumCharacters: 0,
          dropdownLimit: 5,
          feed: (queryText: string) => {
            const users = this.users
              .filter(
                user =>
                  user.name.toLowerCase().includes(queryText.toLowerCase()) || user.email.toLowerCase().includes(queryText.toLowerCase())
              )
              .map(user => ({
                id: `@${user.id}`,
                text: user.name,
                data: {
                  email: user.email,
                },
              }));
            return users;
          },
          itemRenderer: item => {
            const div = document.createElement('div');
            div.className = 'mention-item';
            const customData = (item as unknown as { data?: { email?: string } }).data;
            const email = customData?.email || '';
            div.innerHTML = `<div class="mention-name">${item.text}</div><div class="mention-email">${email}</div>`;
            return div;
          },
        },
      ],
    },
    onChange: content => this.log('Content changed', content),
    onMentionSelect: (item: SdMiniEditorMentionItem) => this.log('Mention selected', item),
    onFocus: () => this.log('Editor focused'),
    onBlur: () => this.log('Editor blurred'),
  };

  // Demo 4: Disabled state
  disabledContent = '<p>Ná»™i dung khÃ´ng thá»ƒ chá»‰nh sá»­a</p>';
  disabledOption: SdMiniEditorOption = {
    outputFormat: 'html',
    placeholder: 'Editor bá»‹ disabled',
  };
  isDisabled = true;

  // Demo 5: With initial content
  initialContent = '<p><strong>ChÃ o má»«ng</strong> Ä‘áº¿n vá»›i <em>sd-mini-editor</em>! <a href="https://example.com">Link máº«u</a></p>';
  initialOption: SdMiniEditorOption = {
    outputFormat: 'html',
    placeholder: 'Editor cÃ³ ná»™i dung ban Ä‘áº§u',
    onChange: content => console.log('Initial content changed:', content),
  };

  // Demo 6: Auto height with max height
  maxHeightContent = '';
  maxHeightOption: SdMiniEditorOption = {
    outputFormat: 'html',
    height: 'auto',
    maxHeight: '150px',
    placeholder: 'Auto-height vá»›i max-height 150px. Nháº­p nhiá»u dÃ²ng Ä‘á»ƒ tháº¥y scrollbar...',
    onChange: content => console.log('MaxHeight content:', content),
  };

  private log(message: string, data?: unknown) {
    const logEntry = data ? `${message}: ${JSON.stringify(data)}` : message;
    console.log(logEntry);
    this.mentionLogs.unshift(`${new Date().toLocaleTimeString()} - ${logEntry}`);
    if (this.mentionLogs.length > 10) {
      this.mentionLogs.pop();
    }
  }

  clearLogs() {
    this.mentionLogs = [];
  }

  getContentInfo() {
    return {
      basic: this.basicContent,
      markdown: this.markdownContent,
      mention: this.mentionContent,
    };
  }
}

