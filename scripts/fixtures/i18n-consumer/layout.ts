import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';
import { SdTabRouterOutletComponent } from '@sdcorejs/angular/components/tab-router';
import { SD_LAYOUT_CONFIGURATION } from '@sdcorejs/angular/modules/layout';
import { providers } from './providers';

@Component({
  selector: 'fixture-app',
  imports: [SdTabRouterOutletComponent, RouterLink],
  template: `
    <nav aria-label="Fixture routes">
      <a routerLink="/home">Home</a> · <a routerLink="/403">403</a> · <a routerLink="/404">404</a>
    </nav>
    <sd-tab-router-outlet [syncBrowserTitle]="true" />
  `,
})
class LayoutFixture {}

bootstrapApplication(LayoutFixture, { providers: [
  ...providers,
  { provide: SD_LAYOUT_CONFIGURATION, useValue: {} },
  provideRouter([
    { path: 'home', loadChildren: () => import('@sdcorejs/angular/modules/layout').then(m => m.HomeModule) },
    { path: '403', loadChildren: () => import('@sdcorejs/angular/modules/layout').then(m => m.ForbiddenModule) },
    { path: '404', loadChildren: () => import('@sdcorejs/angular/modules/layout').then(m => m.NotFoundModule) },
  ]),
] }).catch(error => console.error(error));
