import type { ActivityStats } from "../types.js";
import { wrapSvg, COLORS, formatNumber } from "./shared.js";

export function generateActivitySummary(stats: ActivityStats): string {
  const width = 800;
  const height = 160;

  const items = [
    { label: "Commits", value: formatNumber(stats.totalCommits), icon: "M12.166 4.94a.5.5 0 0 1 .668 0l5 4.5a.5.5 0 0 1-.668.744L12.5 5.97v12.53a.5.5 0 0 1-1 0V5.97l-4.666 4.214a.5.5 0 0 1-.668-.744l5-4.5z" },
    { label: "PRs", value: formatNumber(stats.totalPRs), icon: "" },
    { label: "Reviews", value: formatNumber(stats.totalReviews), icon: "" },
    { label: "Issues", value: formatNumber(stats.totalIssues), icon: "" },
    { label: "Stars", value: formatNumber(stats.totalStars), icon: "" },
    { label: "Repos", value: formatNumber(stats.totalRepos), icon: "" },
    // DEFERRED: "total lines" and "contribution rank percentiles" from spec.
    // Total lines requires cloning/scanning repos (expensive). Rank percentiles
    // require a reference dataset. Both deferred to post-launch iteration.
  ];

  const colWidth = (width - 40) / items.length;
  const statsContent = items.map((item, i) => {
    const x = 20 + i * colWidth + colWidth / 2;
    return `<text x="${x}" y="75" fill="${COLORS.light.fg}" font-size="22" font-weight="700" text-anchor="middle">${item.value}</text>
    <text x="${x}" y="100" fill="${COLORS.light.fgMuted}" font-size="12" text-anchor="middle">${item.label}</text>`;
  }).join("\n    ");

  const content = `
    <text x="20" y="30" fill="${COLORS.light.fg}" font-size="16" font-weight="600">GitHub Activity</text>
    <line x1="20" y1="42" x2="${width - 20}" y2="42" stroke="${COLORS.light.border}" stroke-width="1" />
    ${statsContent}`;

  return wrapSvg(content, width, height);
}
