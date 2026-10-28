import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DOCS_BASE_URL, DOCS_STORAGE } from './docs.tokens';
import {
  angularMajorOfVersion,
  buildReleaseCatalog,
  groupReleasesForMenu,
  packageVersionFor,
  releaseOfVersion,
  resolveAngularMajorForRelease,
  resolveLatestVersion,
  selectMenuReleases,
} from './docs-release.utils';
import { buildVersionRoute, groupVersionsByMajor, resolveRequestedVersion, selectShowcaseReleaseManifest } from './docs-version.utils';
import { DocsVersionsManifest } from './published-docs.models';

const SELECTED_VERSION_KEY = 'sdcorejs.docs.version';
/** Preferred Angular major: "latest" links and release switches keep it when the release publishes it. */
const PREFERRED_MAJOR_KEY = 'sdcorejs.docs.ng';

@Injectable({ providedIn: 'root' })
export class DocsVersionService {
  readonly #http = inject(HttpClient);
  readonly #router = inject(Router);
  readonly #baseUrl = inject(DOCS_BASE_URL);
  readonly #storage = inject(DOCS_STORAGE);
  readonly #manifest = signal<DocsVersionsManifest | null>(null);
  #manifestRequest: Promise<DocsVersionsManifest> | null = null;
  #invalidFallbackVersion: string | null = null;
  #preserveInvalidNoticeOnce = false;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedVersion = signal<string | null>(null);
  readonly invalidVersion = signal<string | null>(null);
  readonly manifest = this.#manifest.asReadonly();
  readonly latestVersion = computed(() => this.#manifest()?.latest ?? '');
  readonly versionGroups = computed(() => groupVersionsByMajor(this.#manifest()?.versions ?? []));
  /** Package version in effect: the route version once resolved, else the latest one. */
  readonly resolvedPackageVersion = computed(() => this.selectedVersion() ?? this.latestVersion());
  readonly selectedRelease = computed(() => releaseOfVersion(this.resolvedPackageVersion()));
  readonly selectedAngularMajor = computed(() => {
    const major = angularMajorOfVersion(this.resolvedPackageVersion());
    return major < 0 ? null : major;
  });
  readonly releaseCatalog = computed(() => {
    const manifest = this.#manifest();
    return manifest ? buildReleaseCatalog(manifest) : [];
  });
  readonly latestRelease = computed(
    () => this.releaseCatalog().find(release => release.latest)?.id ?? releaseOfVersion(this.latestVersion())
  );
  readonly isLatestRelease = computed(() => !this.selectedRelease() || this.selectedRelease() === this.latestRelease());
  readonly currentRelease = computed(() => this.releaseCatalog().find(release => release.id === this.selectedRelease()) ?? null);
  readonly menuReleaseGroups = computed(() =>
    groupReleasesForMenu(selectMenuReleases(this.releaseCatalog(), this.selectedRelease() || null))
  );

  async load(force = false): Promise<DocsVersionsManifest> {
    const cached = this.#manifest();
    if (!force && cached) return cached;
    if (!force && this.#manifestRequest) return this.#manifestRequest;

    this.loading.set(true);
    this.error.set(null);
    const url = new URL('versions.json', this.#baseUrl).toString();
    const request = firstValueFrom(this.#http.get<DocsVersionsManifest>(url))
      .then(publishedManifest => {
        const manifest = selectShowcaseReleaseManifest(publishedManifest);
        this.#manifest.set(manifest);
        let stored: string | null = null;
        try {
          stored = this.#storage?.getItem(SELECTED_VERSION_KEY) ?? null;
        } catch {
          // Storage can be unavailable in privacy-restricted browser contexts.
        }
        const selected = stored ? resolveRequestedVersion(stored, manifest).version : resolveLatestVersion(manifest, this.#preferredMajor());
        this.selectedVersion.set(selected);
        return manifest;
      })
      .catch((error: unknown) => {
        this.error.set(error instanceof Error ? error.message : 'Unable to load published versions.');
        this.#manifestRequest = null;
        throw error;
      })
      .finally(() => this.loading.set(false));

    this.#manifestRequest = request;
    return request;
  }

  async resolve(requested: string | null | undefined): Promise<string> {
    const manifest = await this.load();
    const normalized = requested?.trim();
    const resolution =
      !normalized || normalized === 'latest'
        ? { version: resolveLatestVersion(manifest, this.#preferredMajor()), fallback: false }
        : resolveRequestedVersion(requested, manifest);
    const invalid = resolution.fallback && requested && requested !== 'latest' ? requested : null;
    if (invalid) {
      this.invalidVersion.set(invalid);
      this.#invalidFallbackVersion = resolution.version;
      this.#preserveInvalidNoticeOnce = true;
    } else if (requested === this.#invalidFallbackVersion && this.#preserveInvalidNoticeOnce) {
      this.#preserveInvalidNoticeOnce = false;
    } else {
      this.invalidVersion.set(null);
      this.#invalidFallbackVersion = null;
      this.#preserveInvalidNoticeOnce = false;
    }
    this.selectedVersion.set(resolution.version);
    return resolution.version;
  }

  async select(requested: string): Promise<void> {
    const version = await this.resolve(requested);
    this.invalidVersion.set(null);
    this.#invalidFallbackVersion = null;
    this.#preserveInvalidNoticeOnce = false;
    try {
      this.#storage?.setItem(SELECTED_VERSION_KEY, version);
      const major = angularMajorOfVersion(version);
      if (major >= 0) this.#storage?.setItem(PREFERRED_MAJOR_KEY, String(major));
    } catch {
      // Navigation remains functional even when version persistence is blocked.
    }
    await this.#router.navigateByUrl(buildVersionRoute(this.#router.url, version));
  }

  /** Switches release and keeps the Angular major when the release publishes it, else the highest available. */
  async selectRelease(release: string): Promise<void> {
    await this.load();
    const target = this.releaseCatalog().find(item => item.id === release);
    if (!target) return;
    const major = resolveAngularMajorForRelease(target, this.selectedAngularMajor() ?? this.#preferredMajor());
    await this.select(packageVersionFor(major, target.id));
  }

  /** Switches Angular major within the current release; unpublished combinations are ignored. */
  async selectAngularMajor(major: number): Promise<void> {
    await this.load();
    const release = this.currentRelease();
    if (!release?.majors.includes(major)) return;
    await this.select(packageVersionFor(major, release.id));
  }

  isPublished(release: string, major: number): boolean {
    return this.releaseCatalog().some(item => item.id === release && item.majors.includes(major));
  }

  #preferredMajor(): number | null {
    try {
      const stored = Number(this.#storage?.getItem(PREFERRED_MAJOR_KEY));
      return Number.isInteger(stored) && stored > 0 ? stored : null;
    } catch {
      return null;
    }
  }
}
