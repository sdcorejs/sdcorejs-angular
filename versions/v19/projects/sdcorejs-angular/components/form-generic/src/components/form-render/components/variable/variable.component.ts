import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { filter, Subject, Subscription } from 'rxjs';
import { SdFormGenericVariable } from '../../../../models';

@Component({
  selector: 'variable',
  templateUrl: './variable.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VariableComponent implements OnInit, OnDestroy {
  @Input({ required: true }) variables?: SdFormGenericVariable[];
  @Input({ required: true }) setVariables!: Subject<{ key: string; value: any }>;
  @Input() form = new FormGroup<any>({});
  entity: Record<string, any> = {};
  @Input({
    alias: 'entity',
    required: true,
  })
  set _entity(val: Record<string, any>) {
    if (this.entity !== val) {
      this.entity = val;
    }
  }

  #subscription = new Subscription();
  constructor(private ref: ChangeDetectorRef) {}
  ngOnInit() {
    if (this.variables) {
      // Kiểm tra xem variable có trong form chưa, nếu có thì push vào form
      // Mục đích là khi variable bị thay đổi thì trigger được valueChanges và nơi khác lấy được variables
      for (const variable of this.variables) {
        if (!this.form.controls[variable.key]) {
          this.form.addControl(variable.key, new FormControl(this.entity?.[variable.key]));
        }
      }
      // Khi nhận được tín hiệu setVariables từ nơi khác, nếu variable này thuộc ds variables thì thực hiện gán variable
      this.#subscription.add(
        this.setVariables.pipe(filter(variable => !!this.variables?.some(e => e.key === variable.key))).subscribe(variable => {
          this.entity[variable.key] = variable.value;
          this.form.setValue(this.entity);
        })
      );
    }
  }
  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }
}
