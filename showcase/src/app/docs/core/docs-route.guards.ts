import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DocsVersionService } from './docs-version.service';
import { buildVersionRoute } from './docs-version.utils';
import { isDocCategory } from './documentation.models';
import { findDocPage } from './documentation.registry';

/** Canonicalizes every versioned route before its page component starts loading data. */
export const docsVersionGuard: CanActivateFn = async (route, state) => {
  const requested = route.paramMap.get('version');
  if (!requested) return true;

  const router = inject(Router);
  const versions = inject(DocsVersionService);
  try {
    const resolved = await versions.resolve(requested);
    return resolved === requested ? true : router.parseUrl(buildVersionRoute(state.url, resolved));
  } catch {
    // Static pages and the locally compiled catalog remain usable while version metadata is offline.
    return true;
  }
};

export const legacyDocsRedirectGuard: CanActivateFn = async route => {
  const router = inject(Router);
  const versions = inject(DocsVersionService);
  const category = route.paramMap.get('category');
  const slug = route.paramMap.get('slug') ?? '';
  const page = isDocCategory(category) ? findDocPage(category, slug) : undefined;

  if (!page) {
    return router.createUrlTree(['/not-found'], { queryParams: { path: `${category ?? ''}/${slug}` } });
  }

  try {
    const manifest = await versions.load();
    const version = versions.selectedVersion() ?? manifest.latest;
    return router.createUrlTree(['/v', version, page.category, page.slug, 'overview']);
  } catch {
    return router.createUrlTree(['/v', 'latest', page.category, page.slug, 'overview']);
  }
};
