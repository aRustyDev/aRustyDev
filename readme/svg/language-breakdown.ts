import type { LanguageData } from "../types.js";
import { wrapSvg, COLORS, LANG_COLORS } from "./shared.js";

export function generateLanguageBreakdown(languages: LanguageData[]): string {
  const top = languages.slice(0, 8);
  const width = 800;
  const height = 250;
  const cx = 125;
  const cy = 125;
  const r = 80;
  const strokeWidth = 24;

  // Generate donut chart arcs
  let offset = 0;
  const circumference = 2 * Math.PI * r;
  const arcs = top.map(lang => {
    const color = LANG_COLORS[lang.name] ?? lang.color;
    const dashLength = (lang.percentage / 100) * circumference;
    const arc = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${color}" stroke-width="${strokeWidth}"
      stroke-dasharray="${dashLength} ${circumference}"
      stroke-dashoffset="${-offset}"
      transform="rotate(-90 ${cx} ${cy})" />`;
    offset += dashLength;
    return arc;
  }).join("\n    ");

  // Generate legend
  const legendX = 280;
  const legendItems = top.map((lang, i) => {
    const y = 30 + i * 28;
    const color = LANG_COLORS[lang.name] ?? lang.color;
    return `<rect x="${legendX}" y="${y}" width="12" height="12" rx="2" fill="${color}" />
    <text x="${legendX + 20}" y="${y + 11}" fill="${COLORS.light.fg}" font-size="13">${lang.name}</text>
    <text x="${legendX + 200}" y="${y + 11}" fill="${COLORS.light.fgMuted}" font-size="13" text-anchor="end">${lang.percentage}%</text>`;
  }).join("\n    ");

  const content = `
    <text x="20" y="24" fill="${COLORS.light.fg}" font-size="16" font-weight="600">Languages</text>
    ${arcs}
    ${legendItems}`;

  return wrapSvg(content, width, height);
}
