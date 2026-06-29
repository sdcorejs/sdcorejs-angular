import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SdTable, SdTableOption } from '@sdcorejs/angular/components/table';
import { Subject, Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { GenericListOption, SdGenericListService, TList } from '../../services';

@Component({
  selector: 'sd-generic-list',
  templateUrl: './generic-list.component.html',
  styleUrl: './generic-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdTable],
})
export class GenericListComponent<T = any> implements OnDestroy, OnInit {
  @ViewChild(SdTable) table?: SdTable<TList>;
  tableOption?: SdTableOption<TList>;

  // Khi muốn sử dụng generic-list ở màn hình custom mà không phụ thuộc vào menuId thì truyền vào
  #option?: GenericListOption<T>;
  @Input('option') set _option(option: GenericListOption<T>) {
    this.#option = option;
    this.#optionChanges.next(this.#option);
  }

  #subscription = new Subscription();
  #optionChanges = new Subject<GenericListOption<T>>();
  constructor(
    private ref: ChangeDetectorRef,
    private listService: SdGenericListService
  ) {}

  ngOnInit(): void {
    this.#subscription.add(
      this.#optionChanges.pipe(startWith(this.#option)).subscribe(async () => {
        if (this.#option) {
          this.tableOption = await this.listService.loadTableOption(this.#option);
        }
        this.ref.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }

  reload = () => {
    this.table?.reload();
  };
}
