/* eslint-disable @typescript-eslint/no-explicit-any */
import { DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTable, MatTableModule } from '@angular/material/table';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdInput, SdSwitch } from '@sdcorejs/angular/forms';
import { SdStorage } from '@sdcorejs/angular/services';
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { SdTableColumn } from '../../models/table-column.model';
import { ConfiguredTable, ConfiguredTableResult } from '../../models/table-option-config.model';
import { SdTableOption } from '../../models/table-option.model';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSlideToggleModule,
    CdkTableModule,
    DragDropModule,
    SdButton,
    SdInput,
    SdModal,
    SdSwitch
],
  providers: [ConfigService],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class ConfigComponent {
  @Input() tableOption?: SdTableOption;
  @ViewChild(SdModal) modal?: SdModal;
  @ViewChild('table') table!: MatTable<SdTableColumn>;
  readonly changes = new EventEmitter<ConfiguredTableResult>();
  #setting?: SdStorage<ConfiguredTable>;
  configuration?: ConfiguredTable;
  dragDisabled = true;
  constructor(
    private ref: ChangeDetectorRef,
    private confirmService: SdConfirmService,
    private configService: ConfigService
  ) {}

  @HostListener('window:mouseup', ['$event'])
  mouseUp() {
    this.dragDisabled = true;
  }
  open = async () => {
    this.#setting = this.configService.init(this.tableOption!)!;
    this.configuration = this.#setting?.get();
    this.modal?.open();
  };

  close = () => {
    this.modal?.close();
  }

  onSave = () => {
    this.#setting?.set(this.configuration!);
    this.modal?.close();
    this.ref.detectChanges();
  };

  onReset = async () => {
    this.confirmService.confirm('XÃ¡c nháº­n Ä‘Æ°a táº¥t cáº£ thiáº¿t láº­p vá» máº·c Ä‘á»‹nh').then(() => {
      this.#setting?.remove();
      this.modal?.close();
      this.ref.detectChanges();
    });
  };

  dropTable(event: any) {
    moveItemInArray(this.configuration!.columns!, event.previousIndex, event.currentIndex);
    this.table.renderRows();
  }

  handleMouseDown() {
    this.dragDisabled = false;
  }

  handleMouseUp() {
    this.dragDisabled = true;
  }
}

