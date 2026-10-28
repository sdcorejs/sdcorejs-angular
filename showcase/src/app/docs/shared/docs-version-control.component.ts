import { CdkMenu, CdkMenuGroup, CdkMenuItem, CdkMenuItemRadio, CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DocsClipboardService } from '../core/docs-clipboard.service';
import { DocsI18nService } from '../core/docs-i18n.service';
import { packageVersionFor } from '../core/docs-release.utils';
import { DocsVersionService } from '../core/docs-version.service';
import { SHOWCASE_RELEASE_MINIMUMS } from '../core/docs-version.utils';

/** Angular majors the docs support, highest first. */
export const DOCS_ANGULAR_MAJORS: readonly number[] = Object.keys(SHOWCASE_RELEASE_MINIMUMS)
  .map(Number)
  .sort((left, right) => right - left);

const MENU_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
];

/**
 * Two-part version control of the header: Release (3.2, 3.1, 2.15…) and Angular major (22/21/20/19). The package
 * version is derived as <ng>.<release>; combinations that were never published stay listed but disabled.
 */
@Component({
  selector: 'docs-version-control',
  standalone: true,
  imports: [MatIconModule, CdkMenuTrigger, CdkMenu, CdkMenuGroup, CdkMenuItem, CdkMenuItemRadio],
  templateUrl: './docs-version-control.component.html',
  styleUrl: './docs-version-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsVersionControlComponent {
  readonly versions = inject(DocsVersionService);
  readonly i18n = inject(DocsI18nService);
  readonly clipboard = inject(DocsClipboardService);
  readonly positions = MENU_POSITIONS;

  readonly release = computed(() => this.versions.selectedRelease());
  readonly angularMajor = computed(() => this.versions.selectedAngularMajor());
  readonly installCommand = computed(() => `npm i @sdcorejs/angular@${this.versions.resolvedPackageVersion()}`);
  readonly angularItems = computed(() => {
    const release = this.versions.currentRelease();
    return DOCS_ANGULAR_MAJORS.map(major => {
      const published = !!release?.majors.includes(major);
      return {
        major,
        published,
        packageVersion: release && published ? packageVersionFor(major, release.id) : null,
      };
    });
  });

  constructor() {
    void this.versions.load().catch(() => undefined);
  }

  selectRelease(release: string): void {
    void this.versions.selectRelease(release).catch(() => undefined);
  }

  selectAngularMajor(major: number): void {
    void this.versions.selectAngularMajor(major).catch(() => undefined);
  }

  copyInstall(): void {
    void this.clipboard.copy(this.installCommand(), 'version-install');
  }

  retry(): void {
    void this.versions.load(true).catch(() => undefined);
  }
}
