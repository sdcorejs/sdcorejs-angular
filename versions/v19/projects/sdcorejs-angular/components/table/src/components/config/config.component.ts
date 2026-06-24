import { DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTable, MatTableModule } from '@angular/material/table';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdInput, SdSwitch } from '@sdcorejs/angular/forms';
import { I18nService, TranslatePipe } from '@sdcorejs/angular/i18n';
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
    SdSwitch,
    TranslatePipe,
  ],
  providers: [ConfigService],
})
export class ConfigComponent {
  // ==========================================
  // 1. SIGNAL INPUTS / OUTPUTS
  // ==========================================
  autoIdInput = input<string | null | undefined>(undefined, { alias: 'autoId' });
  tableOption = input<SdTableOption | undefined>(undefined);
  changes = output<ConfiguredTableResult>();

  // Base autoId (đã là `components-table-<scope>` từ parent), '' khi parent không set.
  autoId = computed(() => this.autoIdInput() || '');

  // ==========================================
  // 2. SIGNAL QUERIES
  // ==========================================
  modal = viewChild<SdModal>(SdModal);
  table = viewChild.required<MatTable<SdTableColumn>>(MatTable);

  // ==========================================
  // 3. INJECT
  // ==========================================
  readonly #ref = inject(ChangeDetectorRef);
  readonly #confirmService = inject(SdConfirmService);
  readonly #configService = inject(ConfigService);
  readonly #i18n = inject(I18nService);

  // ==========================================
  // 4. STATE
  // ==========================================
  configuration = signal<ConfiguredTable | undefined>(undefined);
  // dragDisabled không nên là signal (mutated trong drag handlers, không trigger render).
  dragDisabled = true;
  #setting?: SdStorage<ConfiguredTable>;

  // ==========================================
  // 5. WINDOW MOUSEUP — tự destroy qua takeUntilDestroyed (thay @HostListener)
  // ==========================================
  constructor() {
    fromEvent(window, 'mouseup')
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.dragDisabled = true;
      });
  }

  // ==========================================
  // 6. PUBLIC API
  // ==========================================
  open = async () => {
    const opt = this.tableOption();
    if (!opt) return;
    this.#setting = this.#configService.init(opt)!;
    this.configuration.set(this.#setting?.get());
    this.modal()?.open();
  };

  close = () => {
    this.modal()?.close();
  };

  onSave = () => {
    const cfg = this.configuration();
    if (cfg) this.#setting?.set(cfg);
    this.modal()?.close();
    this.#ref.detectChanges();
  };

  onReset = async () => {
    this.#confirmService.confirm(this.#i18n.t('core.component.table.config.confirm-reset')).then(() => {
      this.#setting?.remove();
      this.modal()?.close();
      this.#ref.detectChanges();
    });
  };

  dropTable(event: any) {
    const cols = this.configuration()?.columns;
    if (!cols) return;
    moveItemInArray(cols, event.previousIndex, event.currentIndex);
    this.table().renderRows();
  }

  handleMouseDown() {
    this.dragDisabled = false;
  }

  handleMouseUp() {
    this.dragDisabled = true;
  }
}
