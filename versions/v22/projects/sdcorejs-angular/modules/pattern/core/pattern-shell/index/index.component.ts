import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSection } from '@sdcorejs/angular/components/section';
import { SdPageComponent } from '@sdcorejs/angular/modules/layout';
import { PATTERN_CATALOG } from '../catalog/pattern-catalog';
import { PatternSourceViewer } from '../shell/pattern-source-viewer';

/** `/pattern`: the sample routes by entity, the layout each one uses and its docs. */
@Component({
  selector: 'sd-pattern-index',
  standalone: true,
  imports: [RouterLink, SdButton, SdSection, SdPageComponent],
  template: `
    <sd-page
      title="Pattern"
      description="Màn mẫu theo entity, chạy trên Core thật với mock API. Thanh dưới cùng đổi vai trò, độ trễ và lỗi giả lập."
      width="wide">
      <sd-button headerRight type="outline" prefixIcon="description" title="README" (click)="viewer.openSource('README.md')"></sd-button>
      <div class="sd-pattern-index">
        @for (group of groups; track group.key) {
          <sd-section [title]="group.title" [attr.data-pattern-group]="group.key">
            <div sdHeaderRight class="sd-pattern-index__docs">
              @for (doc of group.docs; track doc) {
                <button type="button" class="sd-pattern-index__doc" (click)="viewer.openSource('docs/' + doc + '.md')">{{ doc }}.md</button>
              }
            </div>
            <p class="sd-pattern-index__summary">{{ group.summary }}</p>
            <table class="sd-pattern-index__routes">
              <thead>
                <tr>
                  <th scope="col">Route</th>
                  <th scope="col">Layout</th>
                  <th scope="col">Thể hiện</th>
                </tr>
              </thead>
              <tbody>
                @for (route of group.routes; track route.path) {
                  <tr>
                    <td>
                      <a [routerLink]="route.link" [queryParams]="route.queryParams">/pattern/{{ route.path }}</a>
                    </td>
                    <td class="sd-pattern-index__layout">{{ route.layout }}</td>
                    <td>{{ route.shows }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </sd-section>
        }
      </div>
    </sd-page>
  `,
  styles: `
    .sd-pattern-index {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
    }
    .sd-pattern-index__summary {
      margin: 0;
      padding: 12px 16px 0;
      color: var(--sd-text-secondary);
    }
    .sd-pattern-index__docs {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .sd-pattern-index__doc {
      padding: 2px 8px;
      border: 1px solid var(--sd-border);
      border-radius: 4px;
      background: var(--sd-surface);
      color: var(--sd-primary);
      font: 12px/18px var(--sd-font-mono, monospace);
      cursor: pointer;
    }
    .sd-pattern-index__routes {
      width: 100%;
      border-collapse: collapse;
    }
    .sd-pattern-index__routes th,
    .sd-pattern-index__routes td {
      padding: 8px 16px;
      border-bottom: 1px solid var(--sd-border);
      text-align: left;
      vertical-align: top;
    }
    .sd-pattern-index__routes th {
      color: var(--sd-text-secondary);
      font-size: 12px;
      font-weight: 500;
    }
    .sd-pattern-index__routes td:first-child {
      white-space: nowrap;
    }
    .sd-pattern-index__layout {
      font: 12px/20px var(--sd-font-mono, monospace);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatternIndexComponent {
  readonly viewer = inject(PatternSourceViewer);
  readonly groups = PATTERN_CATALOG;
}
