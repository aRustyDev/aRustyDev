// readme/svg/top-repos.ts
import type { RepoData } from "../types.js";
import { wrapSvg, COLORS, LANG_COLORS, formatNumber } from "./shared.js";

export function generateRepoCards(repos: RepoData[], title: string): string {
  const width = 800;
  const cardH = 80;
  const cols = 2;
  const rows = Math.ceil(repos.length / cols);
  const height = 40 + rows * (cardH + 10);
  const cardW = (width - 50) / cols;

  const cards = repos.map((repo, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 20 + col * (cardW + 10);
    const y = 40 + row * (cardH + 10);
    const langColor = LANG_COLORS[repo.language ?? ""] ?? repo.languageColor ?? "#888";
    const desc = repo.description
      ? repo.description.length > 50 ? repo.description.slice(0, 47) + "..." : repo.description
      : "";

    return `<rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="6"
      fill="${COLORS.light.cardBg}" stroke="${COLORS.light.border}" stroke-width="1" />
    <text x="${x + 12}" y="${y + 22}" fill="${COLORS.light.accent}" font-size="14" font-weight="600">${repo.name}</text>
    <text x="${x + 12}" y="${y + 42}" fill="${COLORS.light.fgMuted}" font-size="11">${desc}</text>
    <circle cx="${x + 12}" cy="${y + 62}" r="5" fill="${langColor}" />
    <text x="${x + 22}" y="${y + 66}" fill="${COLORS.light.fgMuted}" font-size="11">${repo.language ?? "Unknown"}</text>
    <text x="${x + cardW - 12}" y="${y + 66}" fill="${COLORS.light.fgMuted}" font-size="11" text-anchor="end">\u2605 ${formatNumber(repo.stars)}</text>`;
  }).join("\n    ");

  const content = `
    <text x="20" y="24" fill="${COLORS.light.fg}" font-size="16" font-weight="600">${title}</text>
    ${cards}`;

  return wrapSvg(content, width, height);
}

export function generateTopRepos(repos: RepoData[]): string {
  return generateRepoCards(repos, "Most Active Repositories");
}
