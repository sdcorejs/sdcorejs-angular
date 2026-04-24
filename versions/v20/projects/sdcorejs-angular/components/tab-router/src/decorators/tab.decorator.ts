import { Type } from '@angular/core';
import { SdColor } from '@sdcorejs/angular/utilities/models';
import { filter, take } from 'rxjs/operators';
import { SdTabDecoratorService } from '../services/tab-decorator.service';

export interface SdTabComponentArgs {
  url?: string;
  params?: any;
  queryParams?: any;
  data?: Record<string, any>;
}

export declare interface SdTabComponentBuilder {
  component: Type<any>;
  name: string | ((args: SdTabComponentArgs) => string);
  icon?: string | ((args: SdTabComponentArgs) => string);
  tooltip?: string | ((args: SdTabComponentArgs) => string);
  color?: SdColor | ((args: SdTabComponentArgs) => SdColor);
}

export function SdTabComponent<T>(builder: SdTabComponentBuilder) {
  return (constructor: T) => {
    SdTabDecoratorService.tabRouterService
      .pipe(
        filter(service => service !== undefined && service !== null),
        take(1)
      )
      .subscribe(service => {
        service.addBuilder(builder);
      });
  };
}

