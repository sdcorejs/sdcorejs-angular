/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdDesktopDirective, SdMobileDirective } from '@sdcorejs/angular/directives';
import { SdAutocomplete, SdDate, SdInput, SdInputNumber, SdSelect } from '@sdcorejs/angular/forms';
import { SdTableFilterDefDirective } from '../../directives/sd-table-filter-def.directive';
import { SdTableColumn } from '../../models/table-column.model';
import { SdFilterColumnPipe } from '../../pipes/filter-column.pipe';
import { SdFilterExternalPipe } from '../../pipes/filter-external.pipe';
import { SdTableExternalFilter, TableFilterRegister } from '../../services/table-filter/table-filter.model';
import { FilterValuesPipe } from '../../pipes';

@Component({
  selector: 'sd-popup-filter',
  templateUrl: './popup-filter.component.html',
  styleUrls: ['./popup-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatSlideToggleModule,
    SdButton,
    SdModal,
    SdInput,
    SdInputNumber,
    SdSelect,
    SdAutocomplete,
    SdDate,
    SdFilterColumnPipe,
    SdFilterExternalPipe,
    SdDesktopDirective,
    FilterValuesPipe
  ],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class SdPopupFilter {
  @ViewChild(SdModal) modal?: SdModal;
  #filterRegister?: TableFilterRegister;
  @Input() set filterRegister(value: TableFilterRegister) {
    this.#filterRegister = value;
  }
  @Input() externalFilters: SdTableExternalFilter[] = [];
  externalFilter: Record<string, any> = {};
  inlineExternal: Record<string, boolean> = {};
  @Input() columns: SdTableColumn[] = [];
  columnFilter: Record<string, any> = {};
  inlineColumn: Record<string, boolean> = {};

  @Input() filterDefs: SdTableFilterDefDirective[] = [];
  filterDef: Record<string, any> = {};
  inlineFilterDef: Record<string, boolean> = {};
  constructor(private cdRef: ChangeDetectorRef) {}

  open = () => {
    const configuration = this.#filterRegister?.configuration.get();
    this.inlineColumn = JSON.parse(JSON.stringify(configuration?.inlineColumn));
    this.inlineExternal = JSON.parse(JSON.stringify(configuration?.inlineExternal));
    this.inlineFilterDef = JSON.parse(JSON.stringify(configuration?.inlineFilterDef));
    const filterValue = this.#filterRegister?.value.get();
    this.columnFilter = JSON.parse(JSON.stringify(filterValue?.columnFilter));
    this.externalFilter = JSON.parse(JSON.stringify(filterValue?.externalFilter));
    this.filterDef = JSON.parse(JSON.stringify(filterValue?.filterDef));
    this.modal?.open();
    this.cdRef.markForCheck();
  };

  close = () => {
    this.modal?.close();
    this.cdRef.markForCheck();
  };

  onApply = () => {
    this.#filterRegister?.configuration.set({
      inlineColumn: this.inlineColumn,
      inlineExternal: this.inlineExternal,
      inlineFilterDef: this.inlineFilterDef,
    });
    this.#filterRegister?.value.set({
      columnFilter: this.columnFilter,
      externalFilter: this.externalFilter,
      filterDef: this.filterDef,
    });
    this.modal?.close();
    this.cdRef.markForCheck();
  };

  onClear() {
    this.#filterRegister?.value.remove();
    this.modal?.close();
    this.cdRef.markForCheck();
  }
}

