export interface AuthorProfile {
  readonly authorName: string;
  readonly authorHandle: string;
  readonly authorTitle: string;
  readonly authorBio: string;
  readonly avatar: string;
  readonly githubUrl: string;
  readonly linkedinUrl: string;
  readonly websiteUrl: string;
  readonly email: string;
  readonly location: string;
  readonly technicalFocus: readonly string[];
  readonly motivation: string;
  readonly projectPrinciples: readonly string[];
}

/** Central author metadata. Placeholder values remain hidden until the owner replaces them. */
export const AUTHOR_PROFILE: AuthorProfile = {
  authorName: '[TÊN CỦA TÔI]',
  authorHandle: 'sdcorejs',
  authorTitle: '[CHỨC DANH, VÍ DỤ: Front-end / Full-stack Developer]',
  authorBio: '[MÔ TẢ NGẮN VỀ TÔI]',
  avatar: '[ĐƯỜNG DẪN ASSET HOẶC URL AVATAR]',
  githubUrl: 'https://github.com/sdcorejs',
  linkedinUrl: '[LINKEDIN URL HOẶC ĐỂ TRỐNG]',
  websiteUrl: '[WEBSITE URL HOẶC ĐỂ TRỐNG]',
  email: '[EMAIL HOẶC ĐỂ TRỐNG]',
  location: '[ĐỊA ĐIỂM HOẶC ĐỂ TRỐNG]',
  technicalFocus: [],
  motivation: '',
  projectPrinciples: [],
};

export function isConfiguredAuthorValue(value: string | null | undefined): value is string {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 && !/^\[.*]$/.test(normalized);
}
