import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DocsVersionService } from './docs-version.service';
import { DocCategory } from './documentation.models';
import { findDocPage } from './documentation.registry';

const DOC_CATEGORIES: readonly DocCategory[] = ['components', 'forms', 'services'];

export const legacyDocsRedirectGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  const versions = inject(DocsVersionService);
  const category = route.paramMap.get('category') as DocCategory | null;
  const slug = route.paramMap.get('slug') ?? '';

  if (!category || !DOC_CATEGORIES.includes(category) || !findDocPage(category, slug)) {
    return router.createUrlTree(['/not-found'], { queryParams: { path: `${category ?? ''}/${slug}` } });
  }

  try {
    const manifest = await versions.load();
    const version = versions.selectedVersion() ?? manifest.latest;
    return router.createUrlTree(['/v', version, category, slug, 'overview']);
  } catch {
    return router.createUrlTree(['/v', 'latest', category, slug, 'overview']);
  }
};
