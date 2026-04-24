import { Injectable } from '@angular/core';
import { debounceTime, Subject } from 'rxjs';
import { SdFormGenericComponent, SdFormGenericGroup } from '../../../models';

@Injectable({
  providedIn: 'root',
})
export class BuilderService {
  constructor() {}

  // Khi component change attribute, mong muốn re-render control để người dùng nhìn trực quan
  // Ví dụ:
  // Khi content html thay đổi (attribute), mong muốn bố cục (control) cũng sẽ hiển thị
  // Khi columns của table thay đổi, cập nhật bố cục
  #componentChanges = new Subject<SdFormGenericComponent | SdFormGenericGroup>();
  get componentEmitters() {
    return this.#componentChanges;
  }

  get componentListeners() {
    // Debound 0.2s để tránh trigger liên tục
    return this.#componentChanges.pipe(debounceTime(200));
  }
}
