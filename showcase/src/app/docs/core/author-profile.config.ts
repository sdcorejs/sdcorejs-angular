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

/** Central source of verified maintainer metadata for the Showcase. */
export const AUTHOR_PROFILE: AuthorProfile = {
  authorName: 'Trần Thuận Nghĩa',
  authorHandle: 'sdcorejs',
  authorTitle: 'Full Stack Developer',
  authorBio:
    'Focused on building practical, strongly typed web applications and reusable tools that make complex business workflows easier to deliver and maintain.',
  avatar: 'assets/brand/sdcorejs-logo.png',
  githubUrl: 'https://github.com/sdcorejs',
  linkedinUrl: 'https://www.linkedin.com/in/tran-thuan-nghia/',
  websiteUrl: '',
  email: 'tran.thuan.nghia@gmail.com',
  location: '',
  technicalFocus: [],
  motivation: '',
  projectPrinciples: [],
};

export function isConfiguredAuthorValue(value: string | null | undefined): value is string {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 && !/^\[.*]$/.test(normalized);
}
