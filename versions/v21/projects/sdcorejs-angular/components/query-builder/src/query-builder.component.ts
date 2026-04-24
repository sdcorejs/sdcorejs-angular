import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface QueryRule {
  field: string;
  operator: string;
  value: any;
}

export interface QueryGroup {
  condition: 'AND' | 'OR';
  rules: (QueryRule | QueryGroup)[];
  isOpen?: boolean; // Trạng thái mở menu
}

@Component({
  selector: 'sd-query-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './query-builder.component.html',
  styleUrls: ['./query-builder.component.scss']
})
export class SdQueryBuilder {
  @Input() group: QueryGroup = {
    condition: 'AND',
    rules: [
      { field: 'Employee ID', operator: 'Equal', value: '1' },
      { field: 'Title', operator: 'Equal', value: 'Sales Manager' },
      {
        condition: 'OR',
        rules: [
          { field: 'Select Field', operator: '', value: '' }
        ]
      }
    ]
  };

  @Output() groupChange = new EventEmitter<QueryGroup>();

  isGroup(item: any): item is QueryGroup {
    return (item as QueryGroup).rules !== undefined;
  }

  toggleCondition(group: QueryGroup, condition: 'AND' | 'OR') {
    group.condition = condition;
  }

  // --- LOGIC DROPDOWN & Z-INDEX ---
  toggleDropdown(group: QueryGroup, event: Event) {
    event.stopPropagation();
    // Đóng tất cả các dropdown khác để tránh chồng chéo
    if (!group.isOpen) {
        this.closeAllDropdowns(this.group);
    }
    group.isOpen = !group.isOpen;
  }

  @HostListener('document:click')
  closeAll() {
    this.closeAllDropdowns(this.group);
  }

  closeAllDropdowns(group: QueryGroup) {
    group.isOpen = false;
    group.rules.forEach(rule => {
      if (this.isGroup(rule)) this.closeAllDropdowns(rule);
    });
  }
  // --------------------------------

  addRule(group: QueryGroup) {
    group.rules.push({ field: '', operator: 'Equal', value: '' });
    group.isOpen = false;
  }

  addGroup(group: QueryGroup) {
    group.rules.push({
      condition: 'OR',
      rules: [{ field: '', operator: '', value: '' }]
    } as QueryGroup);
    group.isOpen = false;
  }

  removeItem(parentGroup: QueryGroup, index: number) {
    parentGroup.rules.splice(index, 1);
  }
}