import type { RepoData } from "../types.js";
import { generateRepoCards } from "./top-repos.js";

export function generatePinnedRepos(repos: RepoData[]): string {
  return generateRepoCards(repos, "Pinned Repositories");
}
