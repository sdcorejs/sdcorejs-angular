/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/no-input-rename */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  isSignal,
  OnDestroy,
  OnInit,
  Output,
  Signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdDate, SdInput, SdInputNumber, SdSearch, SdSelect } from '@sdcorejs/angular/forms';
import { SdDateRange } from '@sdcorejs/angular/forms/date-range';
import { SdOperator, SdOperators } from '@sdcorejs/angular/utilities';
import { Subject, Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { SdTableColumn } from '../../models/table-column.model';

@Component({
  selector: 'column-filter',
  templateUrl: './column-filter.component.html',
  styleUrls: ['./column-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatIconModule, SdButton, SdInput, SdInputNumber, SdSelect, SdDate, SdDateRange, SdBadge],
})
export class ColumnFilterComponent implements OnInit, OnDestroy {
  autoId?: string;
  @Input('autoId') set _autoId(val: string | undefined | null) {
    if (val) {
      this.autoId = `${val}-inline-`;
    }
  }
  value: any;
  @Input('value') _value(value: any) {
    this.value = value;
    this.#valueChanges.next(undefined);
  }
  inlineSymbol = 'filter_alt';
  #inlineOperator?: SdOperator;
  @Input('inlineOperator') set _inlineOperator(inlineOperator: SdOperator) {
    if (this.#inlineOperator !== inlineOperator) {
      this.#inlineOperator = inlineOperator;
      this.inlineSymbol = SdOperators.find(e => e.value === inlineOperator)?.symbol ?? 'filter_alt';
    }
  }
  @Output() inlineOperatorChange = new EventEmitter<SdOperator>();
  @Output() operatorChange = new EventEmitter<SdOperator>();

  columnFilter: Record<string, any> = {};
  @Input('columnFilter') set _columnFilter(columnFilter: Record<string, any>) {
    this.columnFilter = columnFilter || {};
    this.#valueChanges.next(undefined);
  }
  operators = SdOperators;
  column!: SdTableColumn;
  items: any[] | Signal<any[]> | SdSearch = [];
  @Input() cacheValues?: Record<string, any[]>;
  @Input('column') set _column(column: SdTableColumn) {
    this.column = column;
    if (!column?.filter?.disabled && column?.filter?.operator?.enable) {
      this.operators = SdOperators.filter(e => column.filter?.operator?.list?.includes?.(e.value));
    } else {
      this.operators = [];
    }
    if (this.column.type === 'values') {
      if (Array.isArray(this.column.option.items)) {
        this.items = this.column.option.items;
      } else if (isSignal(this.column.option.items)) {
        this.items = this.column.option.items;
      } else {
        this.items = this.cacheValues?.[column.field] || [];
      }
    } else if (this.column.type === 'lazy-values') {
      this.items = this.column.option.items;
    }
  }
  @Output() filterChange = new EventEmitter();
  #valueChanges = new Subject();
  #subcription = new Subscription();
  constructor(private ref: ChangeDetectorRef) {}
  ngOnInit() {
    this.#subcription.add(
      this.#valueChanges.pipe(startWith(this.columnFilter)).subscribe(() => {
        if (this.column?.type === 'date' || this.column?.type === 'time' || this.column?.type === 'datetime') {
          if (this.column?.filter?.type !== 'date') {
            this.columnFilter[this.column.field] = this.columnFilter[this.column.field] || {
              from: null,
              to: null,
            };
          }
        }
        if (this.column?.type === 'number') {
          if (this.column?.filter?.type === 'split-number') {
            this.columnFilter[this.column.field] = this.columnFilter[this.column.field] || {
              from: null,
              to: null,
            };
          }
        }
      })
    );
  }

  ngOnDestroy() {
    this.#subcription.unsubscribe();
  }

  onFilterChange = () => {
    this.filterChange.emit();
  };

  onChangeOperator = (operator: { value: SdOperator; symbol?: string; display: string }) => {
    if (operator) {
      this.#inlineOperator = operator.value;
      this.inlineSymbol = operator.symbol!;
    } else {
      this.#inlineOperator = undefined;
      this.inlineSymbol = 'filter_alt';
    }
    this.inlineOperatorChange.emit(this.#inlineOperator);
    this.operatorChange.emit(this.#inlineOperator);
    this.ref.markForCheck();
  };
}

