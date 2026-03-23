// readme/fetch-github.ts
import type {
  GitHubData,
  LanguageData,
  ContributionWeek,
  RepoData,
  ReleaseData,
  ActivityStats,
} from "./types.js";

const USERNAME = "aRustyDev";

interface RawLanguageData {
  [name: string]: { bytes: number; color: string };
}

interface ContributionDay {
  date: string;
  contributionCount: number;
}

interface RawContributionWeek {
  contributionDays: ContributionDay[];
}

export function processLanguageData(raw: RawLanguageData): LanguageData[] {
  const entries = Object.entries(raw);
  if (entries.length === 0) return [];

  const totalBytes = entries.reduce((sum, [, d]) => sum + d.bytes, 0);

  return entries
    .map(([name, data]) => ({
      name,
      bytes: data.bytes,
      color: data.color,
      percentage: Math.round((data.bytes / totalBytes) * 100),
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

export function processContributions(weeks: RawContributionWeek[]): ContributionWeek[] {
  return weeks.map(week => ({
    week: week.contributionDays[0]?.date ?? "",
    count: week.contributionDays.reduce((sum, day) => sum + day.contributionCount, 0),
  }));
}

export async function fetchGitHubData(token: string): Promise<GitHubData> {
  const headers = {
    Authorization: `bearer ${token}`,
    "Content-Type": "application/json",
  };

  // GraphQL query for comprehensive user data
  const query = `query($username: String!) {
    user(login: $username) {
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
      repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: UPDATED_AT, direction: DESC}, privacy: PUBLIC) {
        totalCount
        nodes {
          name
          description
          url
          stargazerCount
          primaryLanguage { name color }
          updatedAt
          isArchived
          languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
            edges { size node { name color } }
          }
        }
      }
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name description url stargazerCount
            primaryLanguage { name color }
            updatedAt isArchived
          }
        }
      }
      repositoryDiscussionComments(first: 1) { totalCount }
    }
  }`;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables: { username: USERNAME } }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL API error: ${response.status}`);
  }

  const json = await response.json() as any;
  const user = json.data.user;
  const contrib = user.contributionsCollection;
  const repos = user.repositories.nodes;

  // Aggregate languages across all repos
  const langMap: RawLanguageData = {};
  for (const repo of repos) {
    if (repo.isArchived) continue;
    for (const edge of repo.languages?.edges ?? []) {
      const name = edge.node.name;
      if (!langMap[name]) {
        langMap[name] = { bytes: 0, color: edge.node.color ?? "#888" };
      }
      langMap[name].bytes += edge.size;
    }
  }

  // Fetch recent releases via REST
  const releasesResp = await fetch(
    `https://api.github.com/users/${USERNAME}/repos?type=owner&sort=updated&per_page=20`,
    { headers: { Authorization: `bearer ${token}` } }
  );
  const repoList = await releasesResp.json() as any[];

  const releases: ReleaseData[] = [];
  for (const repo of repoList.slice(0, 10)) {
    try {
      const relResp = await fetch(
        `https://api.github.com/repos/${USERNAME}/${repo.name}/releases?per_page=1`,
        { headers: { Authorization: `bearer ${token}` } }
      );
      const rels = await relResp.json() as any[];
      if (rels.length > 0) {
        releases.push({
          repo: repo.name,
          repoUrl: repo.html_url,
          tagName: rels[0].tag_name,
          publishedAt: rels[0].published_at,
        });
      }
    } catch {
      // Skip repos where release fetch fails
    }
  }

  const mapRepo = (r: any): RepoData => ({
    name: r.name,
    description: r.description,
    url: r.url ?? r.html_url,
    stars: r.stargazerCount ?? r.stargazers_count ?? 0,
    language: r.primaryLanguage?.name ?? r.language ?? null,
    languageColor: r.primaryLanguage?.color ?? null,
    updatedAt: r.updatedAt ?? r.updated_at,
    isArchived: r.isArchived ?? r.archived ?? false,
  });

  const totalStars = repos.reduce((s: number, r: any) => s + (r.stargazerCount ?? 0), 0);

  return {
    languages: processLanguageData(langMap),
    contributions: processContributions(
      contrib.contributionCalendar.weeks,
    ),
    topRepos: repos
      .filter((r: any) => !r.isArchived)
      .slice(0, 6)
      .map(mapRepo),
    pinnedRepos: (user.pinnedItems?.nodes ?? []).map(mapRepo),
    releases: releases.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    ),
    stats: {
      totalCommits: contrib.totalCommitContributions,
      totalPRs: contrib.totalPullRequestContributions,
      totalIssues: contrib.totalIssueContributions,
      totalReviews: contrib.totalPullRequestReviewContributions,
      totalDiscussions: user.repositoryDiscussionComments?.totalCount ?? 0,
      totalStars,
      totalRepos: user.repositories.totalCount,
      contributionStreak: 0, // DEFERRED: Streak calculation requires walking contribution calendar days. Implement after initial launch.
    },
  };
}
