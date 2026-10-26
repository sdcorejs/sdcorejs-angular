import { ChangeDetectionStrategy, Component, forwardRef, inject, viewChild } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { PATTERN_CATALOG } from '../catalog/pattern-catalog';
import { PatternSourceDrawerComponent, type PatternSourceScope } from '../source/source-drawer.component';
import { PatternToolbarComponent } from '../toolbar/toolbar.component';
import { PatternSourceViewer } from './pattern-source-viewer';

const DOCS_SCOPE: PatternSourceScope = { title: 'README và docs', prefixes: ['README.md', 'docs/'] };

/**
 * Frame of every `/pattern` route: the screen fills the space above the sample toolbar.
 * Routed screens get the full height here, so feature code never sets a height (E1).
 */
@Component({
  selector: 'sd-pattern-shell',
  standalone: true,
  imports: [RouterOutlet, PatternToolbarComponent, PatternSourceDrawerComponent],
  providers: [{ provide: PatternSourceViewer, useExisting: forwardRef(() => PatternShellComponent) }],
  template: `
    <div class="sd-pattern-shell__body">
      <router-outlet></router-outlet>
    </div>
    <sd-pattern-toolbar (viewSource)="openSource()"></sd-pattern-toolbar>
    <sd-pattern-source-drawer></sd-pattern-source-drawer>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }
    .sd-pattern-shell__body {
      position: relative;
      display: flex;
      flex-direction: column;
      flex: 1 1 0;
      min-height: 0;
    }
    .sd-pattern-shell__body ::ng-deep > router-outlet ~ * {
      display: flex;
      flex-direction: column;
      flex: 1 1 0;
      min-height: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatternShellComponent extends PatternSourceViewer {
  readonly #route = inject(ActivatedRoute);
  private readonly drawer = viewChild.required(PatternSourceDrawerComponent);

  openSource(path?: string): void {
    const scope = !path ? this.#currentScope() : path.startsWith('features/') ? this.#featureScope(path.split('/')[1]) : DOCS_SCOPE;
    void this.drawer().open(scope, path);
  }

  #currentScope(): PatternSourceScope {
    const feature = this.#route.firstChild?.routeConfig?.path;
    return feature ? this.#featureScope(feature) : DOCS_SCOPE;
  }

  #featureScope(feature: string): PatternSourceScope {
    const group = PATTERN_CATALOG.find(item => item.key === feature);
    return { title: `features/${feature}${group ? ' · ' + group.title : ''}`, prefixes: [`features/${feature}/`] };
  }
}
