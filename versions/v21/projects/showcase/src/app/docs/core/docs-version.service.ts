import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DOCS_BASE_URL, DOCS_STORAGE } from './docs.tokens';
import { buildVersionRoute, groupVersionsByMajor, resolveRequestedVersion, selectShowcaseReleaseManifest } from './docs-version.utils';
import { DocsVersionsManifest } from './published-docs.models';

const SELECTED_VERSION_KEY = 'sdcorejs.docs.version';

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
        const selected = resolveRequestedVersion(stored, manifest).version;
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
    const resolution = resolveRequestedVersion(requested, manifest);
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
    } catch {
      // Navigation remains functional even when version persistence is blocked.
    }
    await this.#router.navigateByUrl(buildVersionRoute(this.#router.url, version));
  }
}
