import type { ContributionWeek } from "../types.js";
import { wrapSvg, COLORS } from "./shared.js";

export function generateContributionTrends(contributions: ContributionWeek[]): string {
  // Take last 52 weeks
  const weeks = contributions.slice(-52);
  const width = 800;
  const height = 180;
  const chartX = 20;
  const chartY = 40;
  const chartW = width - 40;
  const chartH = height - 60;

  const maxCount = Math.max(...weeks.map(w => w.count), 1);
  const barWidth = chartW / weeks.length - 1;

  const bars = weeks.map((week, i) => {
    const barHeight = (week.count / maxCount) * chartH;
    const x = chartX + i * (barWidth + 1);
    const y = chartY + chartH - barHeight;
    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${COLORS.light.accent}" rx="1" opacity="0.8" />`;
  }).join("\n    ");

  const content = `
    <text x="20" y="24" fill="${COLORS.light.fg}" font-size="16" font-weight="600">Contribution Trends (last 52 weeks)</text>
    <line x1="${chartX}" y1="${chartY + chartH}" x2="${chartX + chartW}" y2="${chartY + chartH}" stroke="${COLORS.light.border}" stroke-width="1" />
    ${bars}`;

  return wrapSvg(content, width, height);
}
