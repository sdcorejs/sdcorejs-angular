import { AUTHOR_PROFILE, isConfiguredAuthorValue } from './author-profile.config';

describe('author profile configuration', () => {
  it('exposes the verified maintainer identity and contact details', () => {
    expect(AUTHOR_PROFILE.authorName).toBe('Trần Thuận Nghĩa');
    expect(AUTHOR_PROFILE.authorTitle).toBe('Full Stack Developer');
    expect(AUTHOR_PROFILE.linkedinUrl).toBe('https://www.linkedin.com/in/tran-thuan-nghia/');
    expect(AUTHOR_PROFILE.email).toBe('tran.thuan.nghia@gmail.com');
  });

  it('hides empty and placeholder values while accepting configured values', () => {
    expect(isConfiguredAuthorValue('')).toBeFalse();
    expect(isConfiguredAuthorValue('   ')).toBeFalse();
    expect(isConfiguredAuthorValue('[PLACEHOLDER]')).toBeFalse();
    expect(isConfiguredAuthorValue(AUTHOR_PROFILE.authorName)).toBeTrue();
  });
});
