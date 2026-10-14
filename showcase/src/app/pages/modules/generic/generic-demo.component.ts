import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SdButton } from '@sdcorejs/angular/components/button';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

/** Live routes mounted by `app.routes.ts` under `/demo` with the in-memory adapter. */
export const GENERIC_DEMO_BASE = '/demo/generic/showcase';

@Component({
  selector: 'app-generic-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DemoPageComponent, DemoSectionComponent, SdButton],
  template: `
    <demo-page
      #demoPage
      title="Generic CRUD"
      description="List, detail, create, update, import and configuration screens generated from one SdGenericSchema per entity, backed by an adapter per module.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-generic-crud-with-a-mock-adapter') {
        <demo-section
          heading="Generic CRUD with a mock adapter"
          note="The showcase registers an in-memory adapter for the module 'showcase' and mounts sdGenericRoutes() under /demo. Product opens forms as a page; supplier (fewer properties) opens them in a side drawer."
          [props]="[
            { name: 'provideSdGeneric', value: '{ adapters: [GenericDemoMockAdapter], permission: false }' },
            { name: 'routes', value: 'generic/:module/:entity[/create | /:id/detail | /:id/update]' },
          ]">
          <div class="d-flex gap-8 flex-wrap" data-generic-demo="crud">
            <sd-button
              data-generic-link="product"
              type="fill"
              color="primary"
              prefixIcon="inventory_2"
              title="Open products"
              (click)="open(productsUrl)"></sd-button>
            <sd-button
              data-generic-link="supplier"
              prefixIcon="local_shipping"
              title="Open suppliers"
              (click)="open(suppliersUrl)"></sd-button>
          </div>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-generic-configuration-screen') {
        <demo-section
          heading="Generic configuration screen"
          note="Edit labels, columns, filters, form layouts and import settings. Without an adapter store the configuration is kept in localStorage; an invalid stored configuration falls back to the default one."
          [props]="[
            { name: 'route', value: 'generic/:module/:entity/configuration' },
            { name: 'storage', value: 'adapter.schemaStore or localStorage' },
          ]">
          <sd-button
            data-generic-link="configuration"
            prefixIcon="settings"
            title="Configure products"
            (click)="open(configurationUrl)"></sd-button>
        </demo-section>
      }
    </demo-page>
  `,
})
export class GenericDemoComponent {
  readonly #router = inject(Router);
  readonly productsUrl = `${GENERIC_DEMO_BASE}/product`;
  readonly suppliersUrl = `${GENERIC_DEMO_BASE}/supplier`;
  readonly configurationUrl = `${GENERIC_DEMO_BASE}/product/configuration`;

  open(url: string): void {
    void this.#router.navigateByUrl(url);
  }
}
