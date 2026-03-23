// readme/svg/shared.ts

export const COLORS = {
  light: {
    bg: "#ffffff",
    fg: "#1f2328",
    fgMuted: "#656d76",
    border: "#d0d7de",
    accent: "#0969da",
    cardBg: "#f6f8fa",
  },
  dark: {
    bg: "#0d1117",
    fg: "#e6edf3",
    fgMuted: "#8b949e",
    border: "#30363d",
    accent: "#58a6ff",
    cardBg: "#161b22",
  },
} as const;

// GitHub language colors
export const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Rust: "#dea584",
  Go: "#00ADD8",
  Python: "#3572A5",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Nix: "#7e7eff",
  Lua: "#000080",
  Zig: "#ec915c",
};

export function formatNumber(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(n);
}

export function wrapSvg(content: string, width: number, height: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    .light { display: block; }
    .dark { display: none; }
    @media (prefers-color-scheme: dark) {
      .light { display: none; }
      .dark { display: block; }
    }
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
  </style>
  <g class="light">
    <rect width="${width}" height="${height}" fill="${COLORS.light.bg}" rx="6" />
    ${content}
  </g>
  <g class="dark">
    <rect width="${width}" height="${height}" fill="${COLORS.dark.bg}" rx="6" />
    ${content.replace(new RegExp(escapeRegex(COLORS.light.fg), "g"), COLORS.dark.fg)
             .replace(new RegExp(escapeRegex(COLORS.light.fgMuted), "g"), COLORS.dark.fgMuted)
             .replace(new RegExp(escapeRegex(COLORS.light.border), "g"), COLORS.dark.border)
             .replace(new RegExp(escapeRegex(COLORS.light.accent), "g"), COLORS.dark.accent)
             .replace(new RegExp(escapeRegex(COLORS.light.cardBg), "g"), COLORS.dark.cardBg)
             .replace(new RegExp(escapeRegex(COLORS.light.bg), "g"), COLORS.dark.bg)}
  </g>
</svg>`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
