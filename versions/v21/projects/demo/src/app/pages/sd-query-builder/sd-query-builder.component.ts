import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdQueryBuilder } from '@sdcorejs/angular/components';
@Component({
  templateUrl: './sd-query-builder.component.html',
  imports: [SdQueryBuilder],
})
export class SdQueryBuilderComponent {
  form = new FormGroup({});
}

