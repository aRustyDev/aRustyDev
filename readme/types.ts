// readme/types.ts

export interface LanguageData {
  name: string;
  bytes: number;
  color: string;
  percentage: number;
}

export interface ContributionWeek {
  week: string; // ISO date of week start
  count: number;
}

export interface RepoData {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  language: string | null;
  languageColor: string | null;
  updatedAt: string;
  isArchived: boolean;
}

export interface ReleaseData {
  repo: string;
  repoUrl: string;
  tagName: string;
  publishedAt: string;
}

export interface ActivityStats {
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalReviews: number;
  totalDiscussions: number;
  totalStars: number;
  totalRepos: number;
  contributionStreak: number;
}

export interface BlogPost {
  title: string;
  url: string;
  date: string;
}

export interface GitHubData {
  languages: LanguageData[];
  contributions: ContributionWeek[];
  topRepos: RepoData[];
  pinnedRepos: RepoData[];
  releases: ReleaseData[];
  stats: ActivityStats;
}

export interface ReadmeData {
  github: GitHubData;
  blogPosts: BlogPost[];
}
