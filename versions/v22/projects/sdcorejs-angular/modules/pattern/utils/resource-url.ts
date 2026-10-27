/** Joins single path segments to a base URL; takes no query string. */
export function resourceUrl(baseUrl: string, ...segments: string[]): string {
  const path = segments
    .map(segment => {
      if (segment.length === 0 || segment === '.' || segment === '..') {
        throw new Error('Resource URL requires non-empty path segments.');
      }
      return encodeURIComponent(segment);
    })
    .join('/');
  const base = baseUrl.replace(/\/+$/u, '');
  return path ? base + '/' + path : base || '/';
}
