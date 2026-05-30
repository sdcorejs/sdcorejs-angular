/* eslint-disable @angular-eslint/no-input-rename */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { SdFormatComponent, SdFormGenericHtml } from '../../../../../models';
import { BuilderService } from '../../../services';
import { filter, Subscription } from 'rxjs';
import { HtmlPipe } from '../../../../../pipes';
import { FormGenericService } from '../../../../../services';
import { Utilities } from '@sdcorejs/utils/fns';

@Component({
  selector: 'html-control',
  templateUrl: './html-control.component.html',
  styleUrls: ['./html-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HtmlPipe],
})
export class HtmlControl {
  component!: SdFormGenericHtml;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericHtml) {
    this.component = component;
    SdFormatComponent(this.component);
    this.content = this.component.content;
  }
  content?: string;
  hashed?: string; // Dùng để ép Angular nhận diện sự thay đổi của HTML khi content/variables
  #subscription = new Subscription();
  constructor(
    private ref: ChangeDetectorRef,
    private builderService: BuilderService,
    private formGenericService: FormGenericService
  ) {}

  ngAfterViewInit(): void {
    this.#subscription.add(
      // Chỉ lắng nghe sự kiện thay đổi tương ứng với component dựa vào id
      this.builderService.componentListeners.pipe(filter(component => component.id === this.component.id)).subscribe(async () => {
        if (this.component.template) {
          this.content = await this.formGenericService.html.getContent(this.component.template);
        } else {
          this.content = this.component.content;
        }
        this.hashed = Utilities.hash({
          content: this.content,
          variables: this.component.properties?.variables?.reduce(
            (current, next) => ({
              ...current,
              [next.key]: next.value,
            }),
            {}
          ),
        });
        this.ref.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }
}
