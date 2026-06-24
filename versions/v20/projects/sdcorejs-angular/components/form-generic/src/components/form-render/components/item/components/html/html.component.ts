import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Utilities, StringUtilities } from '@sdcorejs/utils/fns';
// import { sha1 } from 'object-hash';
import { debounceTime, filter, startWith, Subject, Subscription } from 'rxjs';
import { SdFormGenericHtml } from '../../../../../../models';
import { HtmlPipe } from '../../../../../../pipes';
import { FormGenericService } from '../../../../../../services';

@Component({
  selector: 'lib-html',
  templateUrl: './html.component.html',
  styleUrls: ['./html.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HtmlPipe],
})
export class HtmlComponent implements AfterViewInit, OnDestroy, OnInit {
  @Input({ required: true }) setVariables!: Subject<{ key: string; value: any }>;

  form = new FormGroup({});
  @Input({ alias: 'form', required: true }) set _form(form: FormGroup) {
    if (this.form !== form) {
      this.form = form;
      this.#inputChanges.next();
    }
  }

  entity: Record<string, any> = {};
  @Input({ alias: 'entity', required: true }) set _entity(val: Record<string, any>) {
    if (this.entity !== val) {
      this.entity = val;
      this.#inputChanges.next();
    }
  }

  // Khi 1 giá trị trong entity thay đổi thì hashedValues sẽ thay đổi
  // Mong muốn khi hashedValues thay đổi thì trigger changes để trigger lại hàm lấy thông tin items
  @Input('hashedValues') set _hashedValues(val: string | undefined) {
    this.#inputChanges.next();
  }
  component!: SdFormGenericHtml;
  key!: string;
  @Input({ alias: 'component', required: true }) set _component(component: SdFormGenericHtml) {
    this.component = component;
    this.key = component.key || component.id;
  }

  viewed = false;
  @Input('viewed') set _viewed(val: boolean | '' | undefined | null) {
    this.viewed = val === '' || !!val;
  }

  #subscription = new Subscription();
  #inputChanges = new Subject<void>();
  constructor(
    private ref: ChangeDetectorRef,
    private readonly formRenderService: FormGenericService
  ) {}

  #hashedQuery?: string;
  hashedValues?: string;
  #generateQuery = (query: string | Record<string, any> | undefined, data: Record<string, any>): Record<string, any> => {
    let result: Record<string, any> = {};
    // Nếu query được cấu hình từ Form Builder của Camunda thì JSON nó sẽ là string, cần thực hiện parse
    if (typeof query === 'string') {
      try {
        result = JSON.parse(query);
      } catch (err) {
        console.error(err);
        return result;
      }
    } else if (Array.isArray(query)) {
      return result;
    } else {
      result = { ...query };
    }
    // Xử lý query,
    // Ví dụ: {"a": "1", "b": "true", "c": "${key}"} => {"a": "1", "b": true, "c": "Dữ liệu tương ứng với key trong data"}
    for (const key of Object.keys({ ...result })) {
      // Xử ly
      result[key] = StringUtilities.templateToDisplay(result[key], data);
      if (result[key] === 'true') {
        result[key] = true;
      }
      if (result[key] === 'false') {
        result[key] = false;
      }
      if (result[key] === '') {
        delete result[key];
      }
    }
    return result;
  };

  async ngOnInit() {
    this.#subscription.add(
      this.setVariables.pipe(filter(variable => variable.key === this.component?.key)).subscribe(variable => {
        this.entity[variable.key] = variable.value;
        this.ref.markForCheck();
      })
    );
    if (!this.component.template) {
      // Nếu HTML không phải từ template thì giá trị = content
      this.entity[this.key] = this.component.content;
    } else if (!this.component.properties?.queries?.length) {
      // Nếu HTML từ static template (không có queries)
      this.entity[this.key] = await this.formRenderService.html.getContent(this.component.template);
      this.ref.markForCheck();
    } else if (this.viewed || this.component?.properties?.viewed) {
      // Đây là trạng thái view của HTML từ template có query
      // Nếu ở trạng thái viewed thì lấy entity hiển thị, nếu không có thì dùng content của component
      this.entity[this.key] = this.entity[this.key] || this.component.content;
      /* const values = { ...this.entity, ...this.form.value };
      const query = this.#generateQuery(this.component?.properties?.query, values);
      this.entity[this.key] = await this.formRenderService.html.getContent(this.component.template, query);
      this.ref.markForCheck(); */
    } else {
      // Nếu có queries thì lắng nghe thay đổi của form
      this.#subscription.add(
        this.form.valueChanges.pipe(debounceTime(500), startWith(this.form.value)).subscribe(values => {
          const hashedValues = Utilities.hash(values);
          if (this.hashedValues !== hashedValues) {
            this.hashedValues = hashedValues;
            this.#inputChanges.next();
          }
        })
      );
      this.#subscription.add(
        this.#inputChanges.pipe(startWith('')).subscribe(async () => {
          const values = { ...this.entity, ...this.form.value };
          const query = this.#generateQuery(this.component?.properties?.query, values);
          const hashedQuery = Utilities.hash(query);
          // Nếu query có thay đổi thì thực hiện gán lại items
          if (hashedQuery !== this.#hashedQuery) {
            this.#hashedQuery = hashedQuery;
            this.entity[this.key] = await this.formRenderService.html.getContent(this.component.template!, query);
            this.ref.markForCheck();
          }
        })
      );
    }
  }

  ngAfterViewInit() {}

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }
}
